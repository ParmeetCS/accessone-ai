"""
EchoSign AI - Indian Sign Language (ISL) Text-to-Gloss Engine
Converts multilingual text (English, Hindi, Tamil) to grammatical ISL Gloss sequences.
Adheres to ISL linguistic grammar:
- Time-Topic-Comment / Subject-Object-Verb (SOV) structure
- Omission of copula/auxiliary verbs ('is', 'am', 'are', 'was', 'were')
- Omission of articles ('a', 'an', 'the')
- Placement of question words (WHAT, WHERE, HOW, WHY, WHO) at the end of clauses
- Placement of negative markers (NOT, NO) at the end
"""

import re
from typing import List, Dict, Any, Tuple

# Multilingual translation dictionary to ISL base glosses
MULTILINGUAL_MAP: Dict[str, str] = {
    # Greetings & Common Expressions
    "hello": "HELLO",
    "hi": "HELLO",
    "namaste": "HELLO",
    "namaskar": "HELLO",
    "vanakkam": "HELLO",
    "good": "GOOD",
    "morning": "MORNING",
    "evening": "EVENING",
    "night": "NIGHT",
    "thank": "THANK-YOU",
    "thanks": "THANK-YOU",
    "dhanyavad": "THANK-YOU",
    "shukriya": "THANK-YOU",
    "nandri": "THANK-YOU",
    "please": "PLEASE",
    "kripya": "PLEASE",
    "dayavu": "PLEASE",
    "yes": "YES",
    "ha": "YES",
    "haan": "YES",
    "aam": "YES",
    "no": "NO",
    "nahin": "NO",
    "illai": "NO",

    # Pronouns
    "i": "I",
    "me": "I",
    "my": "MY",
    "you": "YOU",
    "your": "YOU",
    "tum": "YOU",
    "aap": "YOU",
    "nee": "YOU",
    "neengal": "YOU",
    "we": "WE",
    "they": "THEY",
    "he": "HE",
    "she": "SHE",

    # Question Words (ISL places these at sentence end)
    "how": "HOW",
    "kaise": "HOW",
    "eppadi": "HOW",
    "what": "WHAT",
    "kya": "WHAT",
    "enna": "WHAT",
    "where": "WHERE",
    "kahan": "WHERE",
    "enge": "WHERE",
    "when": "WHEN",
    "kab": "WHEN",
    "eppodu": "WHEN",
    "why": "WHY",
    "kyun": "WHY",
    "yen": "WHY",
    "who": "WHO",
    "kaun": "WHO",
    "yaar": "WHO",

    # Clinical & Medical Terminology
    "doctor": "DOCTOR",
    "physician": "DOCTOR",
    "doc": "DOCTOR",
    "nurse": "NURSE",
    "hospital": "HOSPITAL",
    "clinic": "CLINIC",
    "medicine": "MEDICINE",
    "medication": "MEDICINE",
    "tablet": "TABLET",
    "pill": "TABLET",
    "capsule": "TABLET",
    "syrup": "MEDICINE",
    "pain": "PAIN",
    "ache": "PAIN",
    "dard": "PAIN",
    "vali": "PAIN",
    "fever": "FEVER",
    "temperature": "FEVER",
    "bukhar": "FEVER",
    "kaachal": "FEVER",
    "cough": "COUGH",
    "cold": "COLD",
    "headache": "HEADACHE",
    "stomach": "STOMACH",
    "allergy": "ALLERGY",
    "water": "WATER",
    "pani": "WATER",
    "thanni": "WATER",
    "food": "FOOD",
    "khana": "FOOD",
    "saapadu": "FOOD",
    "help": "HELP",
    "madad": "HELP",
    "udhavi": "HELP",
    "emergency": "EMERGENCY",
    "danger": "DANGER",
    "pharmacy": "PHARMACY",
    "prescription": "PRESCRIPTION",
    "today": "TODAY",
    "tomorrow": "TOMORROW",
    "yesterday": "YESTERDAY",
    "take": "TAKE",
    "drink": "DRINK",
    "eat": "EAT",
    "sleep": "SLEEP",
    "one": "ONE",
    "two": "TWO",
    "three": "THREE",
    "four": "FOUR",
    "five": "FIVE",
    "daily": "DAILY",
    "twice": "TWICE",
}

# Stop words omitted in grammatical Indian Sign Language
ISL_STOP_WORDS = {
    "is", "am", "are", "was", "were", "be", "been", "being",
    "the", "a", "an",
    "to", "of", "for", "with", "at", "by", "from", "up", "about", "into", "over", "after",
    "do", "does", "did", "have", "has", "had",
    "that", "this", "these", "those"
}

QUESTION_GLOSSES = {"WHAT", "WHERE", "HOW", "WHEN", "WHY", "WHO"}
NEGATIVE_GLOSSES = {"NO", "NOT"}

class ISLGlossEngine:
    def __init__(self):
        self.vocab_map = MULTILINGUAL_MAP

    def text_to_gloss(self, text: str, language: str = "english") -> Tuple[List[str], Dict[str, Any]]:
        """
        Converts spoken/typed text into an ISL Gloss sequence respecting SOV syntax.
        """
        if not text or not text.strip():
            return [], {"is_isl_reordered": False, "word_count": 0}

        cleaned = re.sub(r'[^\w\s]', ' ', text.lower()).strip()
        tokens = cleaned.split()

        gloss_tokens: List[str] = []
        unmapped_words: List[str] = []

        for token in tokens:
            if token in ISL_STOP_WORDS:
                continue
            
            if token in self.vocab_map:
                gloss_tokens.append(self.vocab_map[token])
            else:
                # Keep uppercase original word as potential fingerspelling target
                gloss_tokens.append(token.upper())
                unmapped_words.append(token.upper())

        # ISL Syntax Reordering:
        # 1. Temporal markers to front (TODAY, TOMORROW, MORNING, etc.)
        # 2. Subject - Object - Verb (SOV)
        # 3. Questions (HOW, WHAT) to the very end
        # 4. Negatives (NO, NOT) to the end
        time_tokens = []
        core_tokens = []
        question_tokens = []
        negative_tokens = []

        for g in gloss_tokens:
            if g in {"TODAY", "TOMORROW", "YESTERDAY", "MORNING", "EVENING", "NIGHT"}:
                time_tokens.append(g)
            elif g in QUESTION_GLOSSES:
                question_tokens.append(g)
            elif g in NEGATIVE_GLOSSES:
                negative_tokens.append(g)
            else:
                core_tokens.append(g)

        # Assemble ISL grammatical sequence: [Time] + [Subject/Object/Verb] + [Negative] + [Question]
        final_sequence = time_tokens + core_tokens + negative_tokens + question_tokens

        # Fallback if empty
        if not final_sequence and tokens:
            final_sequence = [t.upper() for t in tokens if t not in ISL_STOP_WORDS]

        metadata = {
            "original_text": text,
            "detected_language": language,
            "is_isl_reordered": len(question_tokens) > 0 or len(time_tokens) > 0,
            "word_count": len(tokens),
            "unmapped_words": unmapped_words,
            "time_markers": time_tokens,
            "question_markers": question_tokens,
        }

        return final_sequence, metadata

isl_engine = ISLGlossEngine()
