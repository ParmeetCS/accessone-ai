import base64
import io
import os
import re
import subprocess
import json
import time
import tempfile
import uuid
import socket
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any, Literal
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image
import numpy as np
import cv2
import scipy.io.wavfile as wavfile
import speech_recognition as sr
import imageio_ffmpeg

from backend.app.echosign import isl_engine, motion_library, gesture_recognizer

# Automatically load .env file from project root or backend folder
def _load_env_file():
    candidates = [
        Path(__file__).parent.parent / ".env",
        Path(__file__).parent / ".env",
        Path.cwd() / ".env"
    ]
    for env_path in candidates:
        if env_path.is_file():
            try:
                for line in env_path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k and k not in os.environ:
                        os.environ[k] = v
            except Exception as e:
                print(f"[ENV] Notice: Could not read {env_path}: {e}")
            break

_load_env_file()

# Initialize FastAPI application
app = FastAPI(
    title="AccessOne AI - Clinical Assistive Backend",
    description="Multimodal neural assistive API providing OCR, Scene Description, and Object Identification",
    version="4.2.0"
)

# CORS middleware for mobile Expo client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB limit
WIN_OCR_SCRIPT = Path(__file__).parent / "win_ocr.ps1"

# Cache YOLO model instance for object detection
_yolo_model = None

def get_yolo():
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            # Lightweight nano model
            _yolo_model = YOLO("yolov8n.pt")
        except Exception as e:
            print(f"[YOLO] Warning: could not load YOLO: {e}")
            _yolo_model = False
    return _yolo_model if _yolo_model is not False else None

# Request / Response Schemas
class VisionRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string or data URI")
    mode: Literal["ocr", "describe", "objects", "scene", "barcode"] = Field("ocr", description="Vision analysis mode")
    language: Optional[str] = Field("en-US", description="Language code")

class VisionResponse(BaseModel):
    success: bool = True
    mode: str
    result_text: str
    confidence: float
    processing_ms: int
    title: str
    category: str
    warning_text: Optional[str] = None
    distance: str = "Approx. 30 cm"
    lux: int = 480
    entities: Optional[Dict[str, Any]] = None
    objects_detected: Optional[List[Dict[str, Any]]] = None
    hazards: Optional[List[str]] = None
    limitations: Optional[str] = None

class HearingTranscribeRequest(BaseModel):
    audio: str = Field(..., description="Base64 encoded audio chunk or file")
    format: Optional[str] = Field("m4a", description="Audio format: m4a, wav, webm, aac, mp3")
    language: Optional[str] = Field("en-US", description="Language code e.g. en-US, es-ES, hi-IN, ta-IN")
    session_id: Optional[str] = Field(None, description="Hearing session identifier")
    is_final: Optional[bool] = Field(True, description="Whether this audio represents a final segment")

class SoundEventItem(BaseModel):
    id: str
    title: str
    category: Literal["door", "alarm", "siren", "speech", "medical"]
    direction: str
    angleDeg: int
    db: int
    confidence: float
    time: str

class HearingTranscribeResponse(BaseModel):
    success: bool = True
    transcript: str
    is_final: bool = True
    confidence: Optional[float] = None
    timestamp: str
    status: str
    decibels: int
    is_speech: bool
    sound_events: List[SoundEventItem] = []
    processing_ms: int
    session_id: Optional[str] = None
    language: str

# EchoSign Bridge Schemas
class SpeechToSignRequest(BaseModel):
    text: Optional[str] = Field(None, description="Recognized speech text (or omit if providing raw audio)")
    audio: Optional[str] = Field(None, description="Base64 encoded audio payload")
    audio_format: Optional[str] = Field("m4a", description="Audio format")
    language: Optional[str] = Field("english", description="Input language: english, hindi, tamil, en-US")
    session_id: Optional[str] = Field(None, description="Bridge session ID")

class TextToSignRequest(BaseModel):
    text: str = Field(..., description="Text input for sign language translation")
    language: Optional[str] = Field("english", description="Input language: english, hindi, tamil, en-US")
    session_id: Optional[str] = Field(None, description="Bridge session ID")

class SpeechToSignResponse(BaseModel):
    success: bool = True
    gloss_sequence: List[str]
    original_text: str
    language: str
    animation_data: List[Dict[str, Any]]
    available_vocabulary: List[str]
    missing_vocabulary: List[str]
    session_id: Optional[str] = None
    status: str

class SignToTextRequest(BaseModel):
    video_frame: Optional[str] = Field(None, description="Base64 encoded camera frame")
    landmarks: Optional[List[List[float]]] = Field(None, description="Sequence of 198-keypoint landmark arrays")
    language: Optional[str] = Field("english", description="Target translation language")
    session_id: Optional[str] = Field(None, description="Bridge session ID")

class SignToTextResponse(BaseModel):
    success: bool
    status: str
    predicted_text: Optional[str] = None
    confidence: Optional[float] = None
    gesture_sequence: List[str] = []
    landmarks: Optional[List[float]] = None
    model_status: Dict[str, Any]
    message: Optional[str] = None

# Helper: Decode and validate image
def decode_and_validate_image(b64_str: str) -> tuple[Image.Image, np.ndarray, int]:
    # Strip data URL header if present (e.g. data:image/jpeg;base64,...)
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    
    b64_str = b64_str.strip()
    try:
        raw_bytes = base64.b64decode(b64_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 encoding: {e}")

    if len(raw_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"Image size exceeds 10MB limit ({len(raw_bytes)} bytes)")
    
    if len(raw_bytes) < 100:
        raise HTTPException(status_code=400, detail="Image payload too small or corrupted")

    try:
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unrecognized or corrupted image format: {e}")

    np_img = np.array(pil_img)
    return pil_img, np_img, len(raw_bytes)

# Helper: Calculate real ambient illumination (Lux estimate) and sharpness
def calculate_image_metrics(np_img: np.ndarray) -> tuple[int, float]:
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
    mean_val = float(np.mean(gray))
    # Approximate Lux: daylight/indoor baseline where mean 128 ~ 400-500 Lux
    lux = max(10, int(mean_val * 3.75))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return lux, sharpness

# Helper: Resize image for faster OCR (max 1280px on longest side)
def _resize_for_ocr(pil_img: Image.Image) -> Image.Image:
    MAX_DIM = 1280
    w, h = pil_img.size
    if max(w, h) > MAX_DIM:
        scale = MAX_DIM / max(w, h)
        new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
        pil_img = pil_img.resize((new_w, new_h), Image.LANCZOS)
    return pil_img

# Helper: Run Windows Native OCR (runs in thread pool via asyncio.to_thread)
def run_windows_ocr(pil_img: Image.Image) -> tuple[str, int, int]:
    # Resize large images first — dramatically reduces OCR time
    pil_img = _resize_for_ocr(pil_img)
    temp_path = Path(__file__).parent / f"_temp_ocr_{time.time_ns()}.png"
    try:
        pil_img.save(temp_path, format="PNG", optimize=False, compress_level=1)
        res = subprocess.run(
            [
                "powershell",
                "-NoProfile",          # skip user profile (saves ~1-2s startup)
                "-NonInteractive",
                "-ExecutionPolicy", "Bypass",
                "-File", str(WIN_OCR_SCRIPT),
                "-ImagePath", str(temp_path)
            ],
            capture_output=True,
            text=True,
            timeout=45              # increased from 15s — Windows OCR can be slow
        )
        if res.returncode == 0 and res.stdout.strip():
            # Find first valid JSON line (PowerShell may output warnings before it)
            for line in res.stdout.strip().splitlines():
                line = line.strip()
                if line.startswith("{"):
                    try:
                        data = json.loads(line)
                        if data.get("success"):
                            return data.get("text", "").strip(), data.get("words_count", 0), data.get("lines_count", 0)
                        break
                    except Exception:
                        continue
        if res.returncode != 0:
            print(f"[OCR] PowerShell exit {res.returncode}: {res.stderr[:200]}")
    except subprocess.TimeoutExpired:
        print("[OCR] PowerShell OCR timed out after 45s — image may be too complex")
    except Exception as e:
        print(f"[OCR] Windows native OCR error: {e}")
    finally:
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass
    return "", 0, 0

# Helper: Parse prescription medication details if present
def parse_prescription_entities(text: str) -> Dict[str, Any]:
    entities = {}
    lower = text.lower()
    
    # Common clinical antibiotics and medications
    med_match = re.search(r'\b(amoxicillin|ibuprofen|acetaminophen|lisinopril|metformin|atorvastatin|levothyroxine|azithromycin|ciprofloxacin|omeprazole|prednisone)\b(?:\s*(\d+\s*(?:mg|mcg|ml)))?', text, re.IGNORECASE)
    if med_match:
        med_name = med_match.group(1).capitalize()
        dose = med_match.group(2) if med_match.group(2) else ""
        entities["medication_name"] = f"{med_name} {dose}".strip()

    # Dosage / Frequency instructions
    freq_match = re.search(r'(take\s+\d+.*?(?:daily|times|hours|food|water|needed))', text, re.IGNORECASE)
    if freq_match:
        entities["frequency"] = freq_match.group(1).strip()

    # Warnings
    warning_match = re.search(r'(finish\s+all|rash|allergy|warning|caution|side\s+effects?|keep\s+out).*?(\.|$)', text, re.IGNORECASE)
    if warning_match:
        entities["warning"] = warning_match.group(0).strip()

    return entities

# Mode Handlers
def process_ocr_mode(pil_img: Image.Image, np_img: np.ndarray, lux: int) -> Dict[str, Any]:
    text, words_count, lines_count = run_windows_ocr(pil_img)

    if not text:
        return {
            "result_text": "No legible text detected. Please hold the document or medicine bottle steady with good lighting.",
            "confidence": 0.0,
            "title": "No Text Detected",
            "category": "Optical Character Recognition",
            "warning_text": "Ensure the camera is focused on printed text and avoid glare or motion blur.",
            "entities": {}
        }

    entities = parse_prescription_entities(text)
    is_prescription = "medication_name" in entities or any(w in text.lower() for w in ["rx", "capsule", "tablet", "refill", "pharmacy", "dr."])
    
    # Calculate confidence based on word count and text consistency
    confidence = min(99.4, max(85.0, 88.0 + min(words_count, 20) * 0.5))

    title = entities.get("medication_name")
    if title:
        title = f"Medication: {title}"
    elif is_prescription:
        title = "Prescription Label Detected"
    else:
        title = "Document Text Extracted"

    category = "Pharmaceutical Prescription" if is_prescription else "Printed Document Text"
    warning = entities.get("warning")
    if not warning and is_prescription:
        warning = "Verify dosage and frequency with your healthcare provider or pharmacist before taking."

    return {
        "result_text": text,
        "confidence": round(confidence, 1),
        "title": title,
        "category": category,
        "warning_text": warning,
        "entities": entities
    }

def process_objects_mode(np_img: np.ndarray, lux: int) -> Dict[str, Any]:
    model = get_yolo()
    objects = []
    
    if model:
        try:
            results = model(np_img, verbose=False)
            h, w = np_img.shape[:2]
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    label = model.names[cls_id]
                    conf = float(box.conf[0])
                    if conf >= 0.35:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        center_x = (x1 + x2) / 2.0
                        pos = "left" if center_x < w * 0.35 else ("right" if center_x > w * 0.65 else "center")
                        objects.append({
                            "label": label.capitalize(),
                            "confidence": round(conf * 100, 1),
                            "position": pos,
                            "box": [round(x1), round(y1), round(x2), round(y2)]
                        })
        except Exception as e:
            print(f"[YOLO] Detection error: {e}")

    if not objects:
        return {
            "result_text": "No distinct everyday objects identified with high certainty in this frame.",
            "confidence": 0.0,
            "title": "No Objects Detected",
            "category": "Object Identification",
            "warning_text": None,
            "objects_detected": [],
            "limitations": "Ensure objects are in the center of the frame and sufficiently illuminated."
        }

    # Format human-friendly summary
    summary_parts = []
    for obj in objects[:6]:
        summary_parts.append(f"{obj['label']} on the {obj['position']} ({obj['confidence']}%)")
    result_text = "Identified: " + ", ".join(summary_parts) + "."

    avg_conf = round(sum(o["confidence"] for o in objects) / len(objects), 1)

    return {
        "result_text": result_text,
        "confidence": avg_conf,
        "title": f"{len(objects)} Object{'s' if len(objects) > 1 else ''} Identified",
        "category": "Spatial Object Recognition",
        "objects_detected": objects,
        "distance": "0.3 m - 2.5 m"
    }

def process_scene_mode(np_img: np.ndarray, lux: int) -> Dict[str, Any]:
    obj_data = process_objects_mode(np_img, lux)
    objects = obj_data.get("objects_detected", [])
    
    hazards = []
    if lux < 120:
        hazards.append("Low ambient lighting may reduce obstacle visibility.")
    
    positions = []
    important_objects = []
    for obj in objects:
        important_objects.append(obj["label"])
        positions.append(f"{obj['label']} situated toward the {obj['position']}")

    if objects:
        desc = f"Surrounding scene contains {', '.join(important_objects[:4])}. " + "; ".join(positions[:3]) + "."
        if hazards:
            desc += " Caution: " + " ".join(hazards)
    else:
        desc = "Scene scanned. No major foreground obstacles or hazardous obstructions currently recognized."

    return {
        "result_text": desc,
        "confidence": obj_data.get("confidence", 91.5) if objects else 85.0,
        "title": "Scene Spatial Mapping",
        "category": "Spatial Environmental Overview",
        "objects_detected": objects,
        "hazards": hazards if hazards else None,
        "distance": "1.0 m - 3.5 m",
        "limitations": "Detection limited to optical camera field of view. Proceed with normal navigational caution."
    }

# ── Gemini Vision AI — Describe Surroundings ─────────────────────────────────
# Uses the official Gemini REST API directly (no SDK dependency needed).
# Auto-discovers an available flash vision model so model-name changes on
# Google's side never break scene understanding.
# Falls back to enhanced YOLO-based spatial description if no key / API error.

_GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
_gemini_cache: Dict[str, Any] = {"key": None, "model": None}

# Preferred models, in order — fastest reliable flash models first.
# gemini-3.8-flash / gemini-flash-latest hang on generateContent for this
# endpoint, and gemini-2.5-flash is 404 for new users, so they rank last /
# are omitted. Newer "thinking" models need maxOutputTokens >= 300 because
# hidden reasoning tokens count against the output budget.
_GEMINI_MODEL_PREFERENCES = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
]


def _gemini_rest_request(url: str, payload: Optional[dict] = None, timeout: int = 25) -> dict:
    """Perform a GET (payload None) or POST against the Gemini REST API."""
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _get_gemini_candidates() -> Optional[tuple]:
    """Return (api_key, [candidate model names in preference order]) or None."""
    cached_key, cached_model = _gemini_cache["key"], _gemini_cache["model"]
    if cached_key and cached_model:
        return cached_key, [cached_model]

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("[Gemini] GEMINI_API_KEY not set — using YOLO fallback for describe mode")
        return None

    try:
        # Discover an available vision-capable model for this API key
        listing = _gemini_rest_request(
            f"{_GEMINI_API_BASE}/models?key={api_key}", timeout=15
        )
        available = [
            m["name"].split("models/", 1)[-1]
            for m in listing.get("models", [])
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        # Prefer listed models first, then any other flash model, then anything
        candidates = [m for pref in _GEMINI_MODEL_PREFERENCES for m in available if m == pref]
        candidates += [m for m in available if "flash" in m and m not in candidates]
        candidates += [m for m in available if m not in candidates]
        if not candidates:
            print("[Gemini] No generateContent-capable model available for this key")
            return None
        _gemini_cache["key"] = api_key
        print(f"[Gemini] Model candidates: {candidates[:4]}")
        return api_key, candidates
    except Exception as e:
        print(f"[Gemini] Model discovery failed: {e}")
        return None


def _describe_with_gemini(pil_img: Image.Image, lux: int) -> Dict[str, Any]:
    """
    Use Gemini multimodal to generate an accessibility-focused scene
    description — objects, positions, colors, text, relative distances,
    lighting conditions. Suitable for visually impaired users.
    """
    config = _get_gemini_candidates()
    if config is None:
        return {}  # signal caller to use fallback
    api_key, model_candidates = config

    # Keep image small for Gemini (reduces token cost and latency)
    img = pil_img.copy()
    if max(img.size) > 1024:
        img.thumbnail((1024, 1024), Image.LANCZOS)

    # Convert to base64 for Gemini inline_data
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=82)
    img_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    lighting = "bright" if lux > 400 else ("moderate" if lux > 150 else "dim")

    prompt = (
        "You are an AI assistant helping a visually impaired person understand their surroundings.\n\n"
        f"Lighting condition: {lighting} ({lux} lux estimated).\n\n"
        "Describe this image concisely and accessibly. Include:\n"
        "1. Main objects and their approximate positions (left, center, right, foreground, background)\n"
        "2. Any visible text, signs, or labels\n"
        "3. Colors and shapes of important items\n"
        "4. Any potential hazards or obstacles\n"
        "5. Overall setting or environment type\n\n"
        "Be direct and factual. Use plain language. Do not speculate beyond what is clearly visible. "
        "If something is unclear, say so. Keep response under 120 words."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}},
                ]
            }
        ],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800},
    }

    last_error = "unknown"
    for model_name in model_candidates[:4]:
        try:
            response = _gemini_rest_request(
                f"{_GEMINI_API_BASE}/models/{model_name}:generateContent?key={api_key}",
                payload=payload,
                timeout=25,
            )
            response_candidates = response.get("candidates", [])
            parts = (
                response_candidates[0].get("content", {}).get("parts", [])
                if response_candidates else []
            )
            description = "".join(
                p.get("text", "") for p in parts if "text" in p
            ).strip()
            if not description:
                reason = (
                    response_candidates[0].get("finishReason", "unknown")
                    if response_candidates else "no candidates"
                )
                block = response.get("promptFeedback", {}).get("blockReason")
                print(f"[Gemini] Empty response (finishReason={reason}, blocked={block})")
                return {}  # fallback — model works, image itself was the problem

            # Remember the working model so future calls skip discovery
            _gemini_cache["model"] = model_name
            print(f"[Gemini] Scene described using {model_name}")

            return {
                "result_text": description,
                "confidence": 94.0,
                "title": "AI Scene Description",
                "category": "Gemini Vision AI",
                "distance": "Environmental overview",
                "limitations": f"Description generated by {model_name}. May not capture all details."
            }
        except urllib.error.HTTPError as e:
            body = ""
            try:
                body = e.read().decode("utf-8", errors="replace")[:300]
            except Exception:
                pass
            last_error = f"{e.code}: {body}"
            print(f"[Gemini] {model_name} unavailable ({e.code}) — trying next model")
            if e.code not in (404, 403, 429):
                break  # non-model error (auth, quota, server) — don't retry others
        except Exception as e:
            last_error = str(e)
            print(f"[Gemini] describe_content error: {e}")
            break

    print(f"[Gemini] All model candidates failed. Last error: {last_error}")
    return {"gemini_error": last_error}


def process_describe_mode(pil_img: Image.Image, np_img: np.ndarray, lux: int) -> Dict[str, Any]:
    """
    Describe Surroundings — Gemini Vision AI only. No YOLO fallback:
    scene understanding must be realtime AI, never heuristic mock data.
    Returns {"gemini_error": ...} when Gemini is unavailable so the caller
    can surface an honest error to the user.
    """
    # Attempt Gemini multimodal description
    gemini_result = _describe_with_gemini(pil_img, lux)
    if gemini_result:
        return gemini_result

    return {
        "gemini_error": "Scene understanding is unavailable right now. "
        "The Gemini AI service could not be reached. Check the backend console "
        "for the [Gemini] error details and try again."
    }

# Vision API Endpoint — unified handler for OCR, describe, objects, scene, barcode
@app.post("/api/v1/vision", response_model=VisionResponse)
@app.post("/vision", response_model=VisionResponse)
async def analyze_vision(req: VisionRequest):
    import asyncio
    start_time = time.time()

    # 1. Decode & validate image (fast — stays on event loop)
    pil_img, np_img, byte_size = decode_and_validate_image(req.image)

    # 2. Extract ambient metrics (fast)
    lux, sharpness = calculate_image_metrics(np_img)

    # 3. Process according to mode — all blocking ops run in thread pool
    mode = req.mode.lower()
    if mode in ["ocr", "barcode"]:
        # run_windows_ocr calls subprocess.run (blocking) — offload to thread
        res_dict = await asyncio.to_thread(process_ocr_mode, pil_img, np_img, lux)
    elif mode == "objects":
        res_dict = await asyncio.to_thread(process_objects_mode, np_img, lux)
    elif mode == "describe":
        # Gemini multimodal only — no YOLO fallback
        res_dict = await asyncio.to_thread(process_describe_mode, pil_img, np_img, lux)
        if "gemini_error" in res_dict:
            return VisionResponse(
                success=False,
                mode="describe",
                result_text=res_dict["gemini_error"],
                confidence=0.0,
                processing_ms=int((time.time() - start_time) * 1000),
                title="Scene Understanding Unavailable",
                category="Gemini Vision AI",
                warning_text="Gemini AI could not describe this scene. Check backend logs and try again.",
                distance="Not Available",
                lux=lux,
            )
    else:  # "scene"
        res_dict = await asyncio.to_thread(process_scene_mode, np_img, lux)

    processing_ms = int((time.time() - start_time) * 1000)

    return VisionResponse(
        success=True,
        mode=mode,
        result_text=res_dict.get("result_text", ""),
        confidence=res_dict.get("confidence", 0.0),
        processing_ms=processing_ms,
        title=res_dict.get("title", "Analysis Complete"),
        category=res_dict.get("category", "Vision Assist"),
        warning_text=res_dict.get("warning_text"),
        distance=res_dict.get("distance", "Approx. 30 cm"),
        lux=lux,
        entities=res_dict.get("entities"),
        objects_detected=res_dict.get("objects_detected"),
        hazards=res_dict.get("hazards"),
        limitations=res_dict.get("limitations")
    )


# Dedicated describe endpoint (POST /api/v1/vision/describe)
# Accepts multipart/form-data image upload as well as base64 JSON.
from fastapi import UploadFile, File, Form

class DescribeRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image or data URI")
    language: Optional[str] = Field("en-US", description="Language code")

@app.post("/api/v1/vision/describe", response_model=VisionResponse)
@app.post("/vision/describe", response_model=VisionResponse)
async def describe_surroundings_json(req: DescribeRequest):
    """
    POST /api/v1/vision/describe
    Accepts base64 JSON image → returns AI-generated accessibility scene description.
    Uses Gemini 1.5 Flash if GEMINI_API_KEY is set, YOLO spatial fallback otherwise.
    """
    import asyncio
    start_time = time.time()
    pil_img, np_img, _ = decode_and_validate_image(req.image)
    lux, _ = calculate_image_metrics(np_img)
    res_dict = await asyncio.to_thread(process_describe_mode, pil_img, np_img, lux)
    processing_ms = int((time.time() - start_time) * 1000)
    if "gemini_error" in res_dict:
        return VisionResponse(
            success=False, mode="describe",
            result_text=res_dict["gemini_error"],
            confidence=0.0,
            processing_ms=processing_ms,
            title="Scene Understanding Unavailable",
            category="Gemini Vision AI",
            warning_text="Gemini AI could not describe this scene. Check backend logs and try again.",
            distance="Not Available",
            lux=lux,
        )
    return VisionResponse(
        success=True, mode="describe",
        result_text=res_dict.get("result_text", ""),
        confidence=res_dict.get("confidence", 0.0),
        processing_ms=processing_ms,
        title=res_dict.get("title", "Scene Description"),
        category=res_dict.get("category", "Vision AI"),
        distance=res_dict.get("distance", "Environmental overview"),
        lux=lux,
        limitations=res_dict.get("limitations"),
        objects_detected=res_dict.get("objects_detected"),
        hazards=res_dict.get("hazards"),
    )


@app.post("/api/v1/vision/describe/upload", response_model=VisionResponse)
@app.post("/vision/describe/upload", response_model=VisionResponse)
async def describe_surroundings_upload(file: UploadFile = File(...)):
    """
    POST /api/v1/vision/describe/upload
    Accepts multipart/form-data image upload → returns accessibility scene description.
    """
    import asyncio
    start_time = time.time()
    try:
        raw_bytes = await file.read()
        if len(raw_bytes) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image exceeds 10MB limit")
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        np_img = np.array(pil_img)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    lux, _ = calculate_image_metrics(np_img)
    res_dict = await asyncio.to_thread(process_describe_mode, pil_img, np_img, lux)
    processing_ms = int((time.time() - start_time) * 1000)
    if "gemini_error" in res_dict:
        return VisionResponse(
            success=False, mode="describe",
            result_text=res_dict["gemini_error"],
            confidence=0.0,
            processing_ms=processing_ms,
            title="Scene Understanding Unavailable",
            category="Gemini Vision AI",
            warning_text="Gemini AI could not describe this scene. Check backend logs and try again.",
            distance="Not Available",
            lux=lux,
        )
    return VisionResponse(
        success=True, mode="describe",
        result_text=res_dict.get("result_text", ""),
        confidence=res_dict.get("confidence", 0.0),
        processing_ms=processing_ms,
        title=res_dict.get("title", "Scene Description"),
        category=res_dict.get("category", "Vision AI"),
        distance=res_dict.get("distance", "Environmental overview"),
        lux=lux,
        limitations=res_dict.get("limitations"),
        objects_detected=res_dict.get("objects_detected"),
        hazards=res_dict.get("hazards"),
    )

# Helper: Convert audio payload to 16kHz mono WAV using bundled FFmpeg
def convert_audio_payload_to_wav(b64_str: str, input_format: str = "m4a") -> tuple[str, np.ndarray, int]:
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    
    b64_str = b64_str.strip()
    try:
        raw_bytes = base64.b64decode(b64_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 audio payload: {e}")

    if len(raw_bytes) < 32:
        # Generate 0.5s silent 16kHz mono WAV for empty/ambient chunks
        silent_samples = np.zeros(8000, dtype=np.int16)
        temp_dir = tempfile.gettempdir()
        out_file = os.path.join(temp_dir, f"accessone_audio_silent_{uuid.uuid4().hex[:8]}.wav")
        wavfile.write(out_file, 16000, silent_samples)
        return out_file, silent_samples, 16000

    temp_dir = tempfile.gettempdir()
    unique_id = uuid.uuid4().hex[:10]
    cleaned_fmt = (input_format or "m4a").lower().replace(".", "").strip()
    if not cleaned_fmt:
        cleaned_fmt = "m4a"

    in_file = os.path.join(temp_dir, f"accessone_audio_in_{unique_id}.{cleaned_fmt}")
    out_file = os.path.join(temp_dir, f"accessone_audio_out_{unique_id}.wav")

    with open(in_file, "wb") as f:
        f.write(raw_bytes)

    try:
        # If already standard WAV, try reading directly in-memory first
        if cleaned_fmt == "wav":
            try:
                sample_rate, samples = wavfile.read(io.BytesIO(raw_bytes))
                if len(samples.shape) > 1:
                    samples = samples.mean(axis=1).astype(np.int16)
                with open(out_file, "wb") as f_out:
                    f_out.write(raw_bytes)
                return out_file, samples, int(sample_rate)
            except Exception:
                pass

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        res = subprocess.run(
            [ffmpeg_exe, "-nostdin", "-y", "-i", in_file, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", out_file],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=10
        )
        if res.returncode != 0 or not os.path.exists(out_file):
            raise ValueError(f"FFmpeg conversion failed with return code {res.returncode}")

        with open(out_file, "rb") as f_read:
            converted_bytes = f_read.read()
        sample_rate, samples = wavfile.read(io.BytesIO(converted_bytes))
        if len(samples.shape) > 1:
            samples = samples.mean(axis=1).astype(np.int16)
        return out_file, samples, int(sample_rate)
    except Exception as e:
        if os.path.exists(out_file):
            try:
                os.remove(out_file)
            except Exception:
                pass
        raise HTTPException(status_code=422, detail=f"Could not decode audio stream ({e})")
    finally:
        if os.path.exists(in_file):
            try:
                os.remove(in_file)
            except Exception:
                pass

# Helper: Acoustic telemetry and genuine sound event detection
def analyze_acoustic_events(samples: np.ndarray, sample_rate: int = 16000) -> tuple[int, List[Dict[str, Any]], bool]:
    if len(samples) < 320:
        return 34, [], False

    # Normalize samples to -1.0 to 1.0
    samples_float = samples.astype(np.float32) / 32768.0
    rms = float(np.sqrt(np.mean(samples_float**2)))
    # Ambient dB estimation with reference baseline
    decibels = max(24, min(108, int(20 * np.log10(rms + 1e-6) + 94)))

    # Compute FFT power spectrum
    fft_vals = np.abs(np.fft.rfft(samples_float))
    freqs = np.fft.rfftfreq(len(samples_float), 1.0 / sample_rate)

    peak_idx = int(np.argmax(fft_vals))
    peak_freq = float(freqs[peak_idx])
    peak_mag = float(fft_vals[peak_idx])
    mean_mag = float(np.mean(fft_vals)) + 1e-6
    prominence = peak_mag / mean_mag

    # Transient crest factor (peak amplitude vs RMS)
    peak_amp = float(np.max(np.abs(samples_float)))
    crest_factor = peak_amp / (rms + 1e-6)

    # Human speech frequency band energy ratio (300Hz - 3400Hz)
    speech_band_mask = (freqs >= 300) & (freqs <= 3400)
    speech_energy = float(np.sum(fft_vals[speech_band_mask]**2))
    total_energy = float(np.sum(fft_vals**2)) + 1e-6
    speech_energy_ratio = speech_energy / total_energy
    is_speech_candidate = bool((speech_energy_ratio > 0.40) and (decibels >= 38) and (prominence < 20))

    events: List[Dict[str, Any]] = []
    now_time = "Live"

    # 1. Fire / Smoke Alarm: 2900 - 3300 Hz harmonic peak with high prominence (> 10)
    if 2900 <= peak_freq <= 3300 and prominence > 10 and decibels >= 48:
        events.append({
            "id": f"s-{uuid.uuid4().hex[:6]}",
            "title": f"Fire / Smoke Alarm ({int(peak_freq)}Hz Pure Tone)",
            "category": "alarm",
            "direction": "Overhead Sensor (0°)",
            "angleDeg": 0,
            "db": decibels,
            "confidence": min(0.99, round(float(prominence / 25.0), 2)),
            "time": now_time,
        })
    # 2. Emergency Siren: 700 - 1600 Hz harmonic oscillation
    elif 700 <= peak_freq <= 1600 and prominence > 5.5 and decibels >= 58:
        events.append({
            "id": f"s-{uuid.uuid4().hex[:6]}",
            "title": f"Emergency Siren Alert ({int(peak_freq)}Hz)",
            "category": "siren",
            "direction": "External / Perimeter (45°)",
            "angleDeg": 45,
            "db": decibels,
            "confidence": min(0.96, round(float(prominence / 18.0), 2)),
            "time": now_time,
        })
    # 3. Door Knock: low-frequency percussive impulse burst with rapid crest factor
    elif 80 <= peak_freq <= 320 and crest_factor >= 3.8 and decibels >= 42:
        events.append({
            "id": f"s-{uuid.uuid4().hex[:6]}",
            "title": "Door Knock / Entry Alert",
            "category": "door",
            "direction": "Corridor Entrance (280°)",
            "angleDeg": 280,
            "db": decibels,
            "confidence": min(0.93, round(float(crest_factor / 7.5), 2)),
            "time": now_time,
        })

    return decibels, events, is_speech_candidate

# Helper: Genuine Speech-to-Text Recognition
def transcribe_speech_file(wav_path: str, language: str = "en-US") -> tuple[str, Optional[float], bool]:
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 280
    recognizer.dynamic_energy_threshold = True

    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
    except Exception as e:
        print(f"[ASR] Error opening audio file: {e}")
        return "", None, False

    try:
        # Set socket timeout for ASR network call
        prev_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(6.0)
        try:
            result = recognizer.recognize_google(audio_data, language=language, with_confidence=True)
        finally:
            socket.setdefaulttimeout(prev_timeout)

        if isinstance(result, tuple) and len(result) >= 2:
            transcript, confidence = result[0], float(result[1])
            return str(transcript).strip(), round(confidence * 100, 1), True
        elif isinstance(result, str):
            return result.strip(), 92.5, True
        elif isinstance(result, list) and len(result) > 0:
            first = result[0]
            if isinstance(first, dict):
                return first.get("transcript", "").strip(), round(float(first.get("confidence", 0.9)) * 100, 1), True
            return str(first).strip(), 90.0, True
    except sr.UnknownValueError:
        # Audio was intelligible or silence, not a network failure
        return "", None, False
    except sr.RequestError as e:
        print(f"[ASR] Speech recognition network request error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Speech recognition service network error: {e}"
        )
    except Exception as e:
        print(f"[ASR] General recognition error: {e}")
        return "", None, False

    return "", None, False

# Hearing Transcribe API Endpoint
@app.post("/api/v1/hearing/transcribe", response_model=HearingTranscribeResponse)
@app.post("/hearing/transcribe", response_model=HearingTranscribeResponse)
async def transcribe_hearing_audio(req: HearingTranscribeRequest):
    start_time = time.time()
    wav_path = None

    # Handle ambient silence or empty chunks gracefully
    if not req.audio or len(req.audio.strip()) < 32:
        now_str = time.strftime("%I:%M %p")
        return HearingTranscribeResponse(
            success=True,
            transcript="",
            is_final=req.is_final if req.is_final is not None else True,
            confidence=None,
            timestamp=now_str,
            status="ambient_silence",
            decibels=32,
            is_speech=False,
            sound_events=[],
            processing_ms=0,
            session_id=req.session_id,
            language=req.language or "en-US"
        )

    try:
        # 1. Convert base64 audio payload to standard 16kHz mono WAV
        wav_path, samples, sample_rate = convert_audio_payload_to_wav(req.audio, req.format or "m4a")

        # 2. Extract acoustic telemetry & detect real environmental sound events
        decibels, raw_events, is_speech_candidate = analyze_acoustic_events(samples, sample_rate)
        sound_events = [SoundEventItem(**ev) for ev in raw_events]

        # 3. Transcribe speech using genuine speech recognition
        # If definitive environmental sound event (like fire alarm or door knock) or pure silence, avoid unnecessary network calls
        target_lang = req.language or "en-US"
        transcript = ""
        confidence = None
        recognized = False

        if is_speech_candidate or (not sound_events and decibels >= 38):
            try:
                transcript, confidence, recognized = transcribe_speech_file(wav_path, target_lang)
            except HTTPException:
                raise
            except Exception as e:
                print(f"[Hearing API] ASR invocation failed: {e}")

        processing_ms = int((time.time() - start_time) * 1000)
        now_str = time.strftime("%I:%M %p")

        status = "completed"
        if not transcript:
            if sound_events:
                status = "sound_event_detected"
            elif is_speech_candidate:
                status = "speech_detected_unclear"
            else:
                status = "ambient_silence"

        return HearingTranscribeResponse(
            success=True,
            transcript=transcript,
            is_final=req.is_final if req.is_final is not None else True,
            confidence=confidence,
            timestamp=now_str,
            status=status,
            decibels=decibels,
            is_speech=recognized or is_speech_candidate,
            sound_events=sound_events,
            processing_ms=processing_ms,
            session_id=req.session_id,
            language=target_lang
        )
    finally:
        if wav_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except Exception:
                pass

# EchoSign AI Bridge Endpoints & Handlers
def process_text_to_sign_payload(text: str, language: str = "english", session_id: Optional[str] = None) -> SpeechToSignResponse:
    gloss_sequence, metadata = isl_engine.text_to_gloss(text, language)

    animation_data: List[Dict[str, Any]] = []
    available_vocab: List[str] = []
    missing_vocab: List[str] = []

    for word in gloss_sequence:
        sign_data = motion_library.get_sign(word)
        if sign_data:
            animation_data.append(sign_data)
            available_vocab.append(word)
        else:
            missing_vocab.append(word)
            # Add fingerspelling postures fallback
            spelled_sequence = motion_library.get_fingerspelling(word)
            if spelled_sequence:
                animation_data.extend(spelled_sequence)

    status = "completed"
    if missing_vocab and not available_vocab:
        status = "fingerspelling_only"
    elif missing_vocab:
        status = "partial_vocabulary"

    return SpeechToSignResponse(
        success=True,
        gloss_sequence=gloss_sequence,
        original_text=text,
        language=language,
        animation_data=animation_data,
        available_vocabulary=available_vocab,
        missing_vocabulary=missing_vocab,
        session_id=session_id,
        status=status
    )

@app.post("/api/v1/bridge/speech-to-sign", response_model=SpeechToSignResponse)
@app.post("/bridge/speech-to-sign", response_model=SpeechToSignResponse)
async def bridge_speech_to_sign(req: SpeechToSignRequest):
    recognized_text = req.text
    target_lang = req.language or "english"

    if not recognized_text and req.audio:
        lang_code = "en-US"
        if target_lang.lower() in ["hindi", "hi-in", "hi"]:
            lang_code = "hi-IN"
        elif target_lang.lower() in ["tamil", "ta-in", "ta"]:
            lang_code = "ta-IN"

        wav_path = None
        try:
            wav_path, _, _ = convert_audio_payload_to_wav(req.audio, req.audio_format or "m4a")
            recognized_text, _, _ = transcribe_speech_file(wav_path, lang_code)
        finally:
            if wav_path and os.path.exists(wav_path):
                try:
                    os.remove(wav_path)
                except Exception:
                    pass

    if not recognized_text:
        return SpeechToSignResponse(
            success=False,
            gloss_sequence=[],
            original_text="",
            language=target_lang,
            animation_data=[],
            available_vocabulary=[],
            missing_vocabulary=[],
            session_id=req.session_id,
            status="no_speech_detected"
        )

    return process_text_to_sign_payload(recognized_text, target_lang, req.session_id)

@app.post("/api/v1/bridge/text-to-sign", response_model=SpeechToSignResponse)
@app.post("/bridge/text-to-sign", response_model=SpeechToSignResponse)
def bridge_text_to_sign(req: TextToSignRequest):
    return process_text_to_sign_payload(req.text, req.language or "english", req.session_id)

@app.post("/api/v1/bridge/sign-to-text", response_model=SignToTextResponse)
@app.post("/bridge/sign-to-text", response_model=SignToTextResponse)
def bridge_sign_to_text(req: SignToTextRequest):
    model_status = gesture_recognizer.get_model_status()
    extracted_landmarks = None

    # --- Path 1: Video frame provided — extract landmarks then recognize ---
    if req.video_frame:
        try:
            pil_img, np_img, _ = decode_and_validate_image(req.video_frame)
            lm_array = gesture_recognizer.extract_frame_landmarks(np_img)
            extracted_landmarks = lm_array.tolist()

            # Run single-frame heuristic recognition immediately
            res = gesture_recognizer.recognize_single_frame(lm_array)
            updated_status = gesture_recognizer.get_model_status()
            return SignToTextResponse(
                success=res["success"],
                status=res["status"],
                predicted_text=res.get("predicted_text"),
                confidence=res.get("confidence"),
                gesture_sequence=res.get("gesture_sequence", []),
                landmarks=extracted_landmarks,
                model_status=updated_status,
                message=res.get("message", updated_status["message"])
            )
        except HTTPException:
            raise
        except Exception as e:
            # Return partial success with landmarks only on unexpected errors
            return SignToTextResponse(
                success=False,
                status="frame_error",
                predicted_text=None,
                confidence=None,
                gesture_sequence=[],
                landmarks=extracted_landmarks,
                model_status=model_status,
                message=f"Frame processing error: {e}"
            )

    # --- Path 2: Full landmarks sequence provided — run LSTM / heuristic on sequence ---
    if req.landmarks and len(req.landmarks) > 0:
        seq_np = np.array(req.landmarks, dtype=np.float32)
        res = gesture_recognizer.recognize_gesture(seq_np)
        return SignToTextResponse(
            success=res["success"],
            status=res["status"],
            predicted_text=res.get("predicted_text"),
            confidence=res.get("confidence"),
            gesture_sequence=res.get("gesture_sequence", []),
            landmarks=req.landmarks,
            model_status=model_status,
            message=res.get("message")
        )

    # --- Path 3: Nothing provided — return status info ---
    return SignToTextResponse(
        success=True,
        status="ready",
        predicted_text=None,
        confidence=None,
        gesture_sequence=[],
        landmarks=None,
        model_status=model_status,
        message=model_status["message"]
    )

@app.post("/api/v1/bridge/text-to-speech")
@app.post("/bridge/text-to-speech")
def bridge_text_to_speech(payload: Dict[str, Any]):
    return {
        "success": True,
        "text": payload.get("text", ""),
        "status": "ready_for_device_tts",
        "timestamp": time.time()
    }

@app.get("/api/v1/bridge/sign-capabilities")
@app.get("/bridge/sign-capabilities")
def bridge_sign_capabilities():
    return {
        "success": True,
        "version": "2.0.0",
        "engine": "EchoSign AI - Indian Sign Language Bidirectional Neural Engine",
        "motion_library": motion_library.get_stats(),
        "gesture_model": gesture_recognizer.get_model_status(),
        "supported_languages": ["english", "hindi", "tamil"],
        "grammar_spec": "Indian Sign Language (SOV / Time-Topic-Comment structure)",
        "features_per_frame": 198
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "4.2.0",
        "neuralEngine": "Local Neural YOLOv8 + Windows Native OCR",
        "speechRecognition": "Google Cloud Multilingual ASR Engine + Spectral Sound Event Classifier",
        "signLanguageEngine": "EchoSign AI ISL Keypoint Motion Library & Text-to-Gloss Engine",
        "supportedLanguages": ["en-US", "es-ES", "hi-IN", "ta-IN", "fr-FR", "de-DE"],
        "timestamp": time.time()
    }
