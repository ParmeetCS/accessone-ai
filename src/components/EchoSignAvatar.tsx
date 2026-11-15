/**
 * AccessOne AI - EchoSign 3D ISL Avatar
 * Renders a Y-Bot style coral-red humanoid robot using pure HTML5 Canvas 2D.
 * No CDN dependency — works 100% offline on Android/iOS.
 * Matches the EchoSign reference: coral-red body, dark joints, articulated hands,
 * studio lighting with shadow/highlight, smooth ISL animations.
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Play, Pause, RotateCcw, Square, Sparkles, AlertTriangle } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { EchoSignAnimationData } from '../services/api';

const WebViewComponent: any = WebView;

interface EchoSignAvatarProps {
  animationList: EchoSignAnimationData[];
  glossSequence?: string[];
  originalText?: string;
  missingVocabulary?: string[];
  isLoading?: boolean;
  onAnimationEnd?: () => void;
}

export const EchoSignAvatar: React.FC<EchoSignAvatarProps> = ({
  animationList,
  glossSequence = [],
  originalText = '',
  missingVocabulary = [],
  isLoading = false,
  onAnimationEnd,
}) => {
  const { colors, scaleFont } = useAppTheme();
  const webViewRef = useRef<WebView>(null);

  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isWebReady, setIsWebReady] = useState(false);

  const activeClip = useMemo(() => {
    if (!animationList || animationList.length === 0) return null;
    return animationList[Math.min(currentWordIdx, animationList.length - 1)];
  }, [animationList, currentWordIdx]);

  const sendCommandTo3D = (payload: any) => {
    if (!webViewRef.current) return;
    const jsonStr = JSON.stringify(payload);
    try { webViewRef.current.postMessage(jsonStr); } catch (e) {}
    try {
      const escaped = JSON.stringify(jsonStr);
      webViewRef.current.injectJavaScript(`
        if (window.handleCmd) window.handleCmd(${escaped});
        true;
      `);
    } catch (e) {}
  };

  useEffect(() => {
    if (!isWebReady) return;
    if (animationList && animationList.length > 0) {
      setCurrentWordIdx(0);
      setIsPlaying(true);
      sendCommandTo3D({
        type: 'LOAD',
        words: animationList.map((a) => ({
          word: a.word, type: a.type, character: a.character,
          num_frames: a.num_frames,
        })),
        speed: speedMultiplier,
      });
    } else {
      setIsPlaying(false);
      setCurrentWordIdx(0);
      sendCommandTo3D({ type: 'RESET' });
    }
  }, [animationList, isWebReady]);

  const handlePlayPause = () => {
    if (!animationList || animationList.length === 0) {
      sendCommandTo3D({
        type: 'LOAD',
        words: [
          { word: 'HELLO', type: 'motion_keypoints', num_frames: 60 },
          { word: 'HOW', type: 'motion_keypoints', num_frames: 50 },
          { word: 'YOU', type: 'motion_keypoints', num_frames: 45 },
        ],
        speed: speedMultiplier,
      });
      setIsPlaying(true);
      return;
    }
    const next = !isPlaying;
    setIsPlaying(next);
    sendCommandTo3D({ type: next ? 'PLAY' : 'PAUSE' });
  };

  const handleReplay = () => {
    setCurrentWordIdx(0); setIsPlaying(true);
    sendCommandTo3D({ type: 'REPLAY' });
  };

  const handleStop = () => {
    setIsPlaying(false); setCurrentWordIdx(0);
    sendCommandTo3D({ type: 'STOP' });
  };

  const cycleSpeed = () => {
    const next = speedMultiplier === 1.0 ? 1.5 : speedMultiplier === 1.5 ? 0.75 : 1.0;
    setSpeedMultiplier(next);
    sendCommandTo3D({ type: 'SPEED', speed: next });
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setIsWebReady(true);
        if (animationList && animationList.length > 0) {
          sendCommandTo3D({
            type: 'LOAD',
            words: animationList.map((a) => ({
              word: a.word, type: a.type, character: a.character, num_frames: a.num_frames,
            })),
            speed: speedMultiplier,
          });
        }
      } else if (data.type === 'WORD_CHANGE') {
        setCurrentWordIdx(data.idx);
      } else if (data.type === 'DONE') {
        setIsPlaying(false);
        if (onAnimationEnd) onAnimationEnd();
      }
    } catch (e) {}
  };

  // ═══════════════════════════════════════════════════════════
  //  Pure HTML5 Canvas 2D — Y-Bot style 3D robot renderer
  //  No external libraries. Works offline on any Android device.
  // ═══════════════════════════════════════════════════════════
  const avatarHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;height:100%;overflow:hidden;background:#C8D4DC;}
  canvas{display:block;width:100%;height:100%;}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
// ════════════════════════════════════════════════════════════
//  EchoSign ISL Avatar — Pure Canvas 2D Y-Bot Renderer
//  Coral-red robot body with dark joints, 3D perspective shading
// ════════════════════════════════════════════════════════════
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, CX, CY, SCALE;

// Animation state
var words = [], wordIdx = 0, frame = 0, playing = false, speed = 1.0;
var time = 0, lastTs = 0;

// ── Responsive sizing ────────────────────────────────────────
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  CX = W / 2; CY = H / 2;
  SCALE = Math.min(W, H) / 420;
}
window.addEventListener('resize', resize);
resize();

// ── Notify React Native ──────────────────────────────────────
function rn(msg) {
  try {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  } catch(e) {}
}

// ════════════════════════════════════════════════════════════
//  DRAWING HELPERS — simulated 3D shading on 2D canvas
// ════════════════════════════════════════════════════════════

// Draw an ellipse with radial gradient (simulates spherical 3D shading)
function sphere(x, y, rx, ry, baseColor, hiColor) {
  var grd = ctx.createRadialGradient(x - rx*0.3, y - ry*0.35, rx*0.05, x, y, Math.max(rx,ry));
  grd.addColorStop(0, hiColor);
  grd.addColorStop(0.55, baseColor);
  grd.addColorStop(1, darken(baseColor, 0.45));
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
  ctx.fillStyle = grd;
  ctx.fill();
}

// Draw a rounded rectangle capsule (torso/arm segments)
function capsule(x, y, w, h, r, baseColor, hiColor, angle) {
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  var grd = ctx.createLinearGradient(-w/2, 0, w/2, 0);
  grd.addColorStop(0, darken(baseColor, 0.35));
  grd.addColorStop(0.28, hiColor);
  grd.addColorStop(0.72, baseColor);
  grd.addColorStop(1, darken(baseColor, 0.40));
  ctx.beginPath();
  roundRect(ctx, -w/2, -h/2, w, h, r);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.restore();
}

// Rounded rect path helper
function roundRect(c, x, y, w, h, r) {
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function darken(hex, amt) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.max(0, Math.round(r*(1-amt)));
  g = Math.max(0, Math.round(g*(1-amt)));
  b = Math.max(0, Math.round(b*(1-amt)));
  return '#' + ('0'+r.toString(16)).slice(-2) + ('0'+g.toString(16)).slice(-2) + ('0'+b.toString(16)).slice(-2);
}

function lighten(hex, amt) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, Math.round(r + (255-r)*amt));
  g = Math.min(255, Math.round(g + (255-g)*amt));
  b = Math.min(255, Math.round(b + (255-b)*amt));
  return '#' + ('0'+r.toString(16)).slice(-2) + ('0'+g.toString(16)).slice(-2) + ('0'+b.toString(16)).slice(-2);
}

// Colors
var CORAL    = '#E8453C';
var CORAL_HI = '#FF7B72';
var JOINT    = '#1A1E24';
var JOINT_HI = '#3A4048';
var VISOR    = '#0D1117';
var SHADOW   = 'rgba(0,0,0,0.22)';

// ════════════════════════════════════════════════════════════
//  POSE SYSTEM — returns arm joint angles for each ISL sign
// ════════════════════════════════════════════════════════════
function getPose(word, t) {
  var w = (word||'').toUpperCase().trim();
  var cycle = Math.sin(t * Math.PI);          // 0→1→0 bell
  var wave  = Math.sin(t * Math.PI * 4);      // fast oscillation
  var osc2  = Math.sin(t * Math.PI * 2);      // medium oscillation

  // Each arm: { shX=shoulder elevation, shZ=shoulder adduction, elX=elbow flex, wrX=wrist flex, curl=finger curl 0-1 }
  // Positive shX = arm raises, negative elX = elbow bends toward body, curl 0=open 1=closed
  var pose = {
    // LEFT arm (from avatar's left = screen right for front-facing)
    lShX: 0.55, lShZ: -0.30, lElX: 0.75, lWrX: 0.0, lCurl: 0.2,
    // RIGHT arm
    rShX: 0.55, rShZ:  0.30, rElX: 0.75, rWrX: 0.0, rCurl: 0.2,
    // Head tilt
    hdY: 0.0, hdX: 0.0,
  };

  if (w.includes('HELLO') || w.includes('HI')) {
    // Right hand raises to temple and waves outward
    pose.rShX = 1.30 + cycle*0.12;
    pose.rShZ = 0.55;
    pose.rElX = 0.42;
    pose.rWrX = wave * 0.30;
    pose.rCurl = 0.05;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('THANK')) {
    // Flat right hand at chin, moves forward
    pose.rShX = 0.95 + t*0.28;
    pose.rShZ = 0.22;
    pose.rElX = 0.22 + t*0.35;
    pose.rWrX = 0.20 * t;
    pose.rCurl = 0.05;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('YES')) {
    // Right fist nods up and down
    pose.rShX = 0.80;
    pose.rShZ = 0.22;
    pose.rElX = 0.65 + wave*0.18;
    pose.rWrX = wave * 0.22;
    pose.rCurl = 0.90;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('NO')) {
    // Right index finger wagging side to side
    pose.rShX = 0.75;
    pose.rShZ = 0.18 + wave*0.42;
    pose.rElX = 0.52;
    pose.rCurl = 0.75;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('PLEASE')) {
    // Right flat hand circles center of chest
    var cx = Math.cos(t * Math.PI * 4) * 0.18;
    var cy = Math.sin(t * Math.PI * 4) * 0.18;
    pose.rShX = 0.70 + cy;
    pose.rShZ = 0.20 + cx;
    pose.rElX = 0.55;
    pose.rWrX = 0.14;
    pose.rCurl = 0.05;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('WATER')) {
    // Right W-shape tapping chin
    pose.rShX = 1.0;
    pose.rShZ = 0.18;
    pose.rElX = 0.18 + wave*0.12;
    pose.rWrX = 0.18;
    pose.rCurl = 0.28;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('MEDICINE') || w.includes('TABLET') || w.includes('PILL')) {
    // Right fingers to mouth
    pose.rShX = 1.15 + cycle*0.12;
    pose.rShZ = 0.18;
    pose.rElX = 0.08;
    pose.rWrX = 0.18;
    pose.rCurl = 0.65;
    pose.hdX = cycle * 0.12;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('DOCTOR')) {
    // Left arm horizontal, right taps left wrist
    pose.lShX = 0.65; pose.lShZ = -0.55; pose.lElX = 0.88; pose.lWrX = 0.30; pose.lCurl = 0.05;
    pose.rShX = 0.75; pose.rShZ = 0.42;
    pose.rElX = 0.65 + wave*0.14;
    pose.rCurl = 0.40;

  } else if (w.includes('HELP')) {
    // Left flat palm up, right fist on top lifts
    pose.lShX = 0.65; pose.lShZ = -0.42; pose.lElX = 0.72; pose.lWrX = 0.35; pose.lCurl = 0.04;
    pose.rShX = 0.70 + cycle*0.20; pose.rShZ = 0.42;
    pose.rElX = 0.70;
    pose.rCurl = 0.88;

  } else if (w.includes('PAIN') || w.includes('HURT')) {
    // Both index fingers pointing at each other, twisting
    pose.lShX = 0.72; pose.lShZ = -0.42; pose.lElX = 0.65; pose.lWrX = osc2*0.28; pose.lCurl = 0.80;
    pose.rShX = 0.72; pose.rShZ =  0.42; pose.rElX = 0.65; pose.rWrX =-osc2*0.28; pose.rCurl = 0.80;

  } else if (w.includes('HOW')) {
    // Both curved hands rotate outward
    pose.lShX = 0.70; pose.lShZ = -0.42; pose.lElX = 0.72; pose.lWrX =-cycle*0.55; pose.lCurl = 0.40;
    pose.rShX = 0.70; pose.rShZ =  0.42; pose.rElX = 0.72; pose.rWrX = cycle*0.55; pose.rCurl = 0.40;

  } else if (w.includes('YOU')) {
    // Right index finger points at viewer
    pose.rShX = 0.72; pose.rShZ = 0.15;
    pose.rElX = 0.20; pose.rWrX = 0.10;
    pose.rCurl = 0.80;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('FEVER')) {
    // Back of hand to forehead
    pose.rShX = 1.28 + cycle*0.08;
    pose.rShZ = 0.22;
    pose.rElX = 0.08;
    pose.rWrX = 0.90;
    pose.rCurl = 0.15;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('HOSPITAL') || w.includes('EMERGENCY')) {
    // Both open hands raised
    pose.lShX = 1.30 + cycle*0.12; pose.lShZ = -0.40; pose.lElX = 0.30; pose.lCurl = 0.04;
    pose.rShX = 1.30 + cycle*0.12; pose.rShZ =  0.40; pose.rElX = 0.30; pose.rCurl = 0.04;

  } else if (w.includes('GOOD')) {
    // Open hand from chin outward
    pose.rShX = 0.90 + t*0.20;
    pose.rShZ = 0.22;
    pose.rElX = 0.30 + t*0.30;
    pose.rWrX = 0.25 * t;
    pose.rCurl = 0.04;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('BAD')) {
    // Hand at mouth twists down
    pose.rShX = 0.95; pose.rShZ = 0.18;
    pose.rElX = 0.20 + t*0.50;
    pose.rWrX = 0.10 + t*0.55;
    pose.rCurl = 0.15;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.includes('NAME')) {
    // Index + middle crossed and tapped
    pose.lShX = 0.75; pose.lShZ = -0.30; pose.lElX = 0.70; pose.lCurl = 0.50;
    pose.rShX = 0.75; pose.rShZ =  0.30; pose.rElX = 0.70 + wave*0.12; pose.rCurl = 0.50;

  } else if (w.includes('TAKE') || w.includes('ONE')) {
    // Right hand grasps and brings toward body
    pose.rShX = 0.70 + t*0.20;
    pose.rShZ = 0.35;
    pose.rElX = 0.55 + t*0.25;
    pose.rCurl = 0.30 + t*0.55;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else if (w.length === 1 && /[A-Z]/.test(w)) {
    // Fingerspelling
    var cv = w.charCodeAt(0) - 65;
    pose.rShX = 0.80; pose.rShZ = 0.22;
    pose.rElX = 0.45; pose.rWrX = 0.22;
    pose.rCurl = (cv % 5) * 0.22;
    pose.lShX = 0.40; pose.lShZ = -0.20; pose.lElX = 0.60; pose.lCurl = 0.25;

  } else {
    // Generic: both arms alternating
    var t2 = t * Math.PI * 2;
    pose.lShX = 0.72 + Math.sin(t2)*0.14; pose.lShZ = -0.35;
    pose.lElX = 0.65 + Math.cos(t2)*0.14; pose.lCurl = 0.22 + Math.sin(t2*2)*0.18;
    pose.rShX = 0.72 + Math.cos(t2)*0.14; pose.rShZ =  0.35;
    pose.rElX = 0.65 + Math.sin(t2)*0.14; pose.rCurl = 0.22 + Math.cos(t2*2)*0.18;
  }

  return pose;
}

// ── Smooth lerp between poses ────────────────────────────────
var curPose = {lShX:0.55,lShZ:-0.30,lElX:0.75,lWrX:0,lCurl:0.2,rShX:0.55,rShZ:0.30,rElX:0.75,rWrX:0,rCurl:0.2,hdX:0,hdY:0};

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpPose(a, b, t) {
  var out = {};
  for (var k in b) out[k] = lerp(a[k]||0, b[k]||0, t);
  return out;
}

// ════════════════════════════════════════════════════════════
//  AVATAR DRAWING — full Y-Bot style robot body
//  Origin at CX, CY (center of canvas)
//  SCALE applied throughout for responsive sizing
// ════════════════════════════════════════════════════════════

function drawAvatar(pose) {
  var s = SCALE;

  // Body reference points (from center CX,CY = hip center)
  var hipY   = CY + s * 55;
  var waistY = CY + s * 20;
  var chestY = CY - s * 30;
  var shlY   = CY - s * 72;   // shoulder ball center
  var neckY  = CY - s * 100;
  var headY  = CY - s * 130;

  // ── Background gradient ──────────────────────────────────
  var bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#C8D4DC');
  bg.addColorStop(1, '#B0BEC8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Floor shadow ellipse ─────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(CX, hipY + s*58, s*95, s*18, 0, 0, Math.PI*2);
  ctx.fillStyle = '#607080';
  ctx.fill();
  ctx.restore();

  // ── PELVIS ───────────────────────────────────────────────
  capsule(CX, hipY, s*78, s*45, s*14, CORAL, CORAL_HI, 0);

  // ── WAIST JOINT (ball) ───────────────────────────────────
  sphere(CX, waistY, s*24, s*22, JOINT, JOINT_HI);

  // ── TORSO (chest) ────────────────────────────────────────
  // Trapezoidal shape: wider at shoulders
  ctx.save();
  var gTorso = ctx.createLinearGradient(CX - s*80, 0, CX + s*80, 0);
  gTorso.addColorStop(0, darken(CORAL, 0.38));
  gTorso.addColorStop(0.25, CORAL_HI);
  gTorso.addColorStop(0.75, CORAL);
  gTorso.addColorStop(1, darken(CORAL, 0.42));
  ctx.beginPath();
  ctx.moveTo(CX - s*48, waistY + s*8);
  ctx.lineTo(CX + s*48, waistY + s*8);
  ctx.lineTo(CX + s*82, shlY + s*18);
  ctx.lineTo(CX - s*82, shlY + s*18);
  ctx.closePath();
  ctx.fillStyle = gTorso;
  ctx.fill();
  ctx.restore();

  // Sternum ridge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX - s*4, waistY + s*8);
  ctx.lineTo(CX + s*4, waistY + s*8);
  ctx.lineTo(CX + s*3, shlY + s*18);
  ctx.lineTo(CX - s*3, shlY + s*18);
  ctx.closePath();
  ctx.fillStyle = darken(JOINT, 0.1);
  ctx.fill();
  ctx.restore();

  // ── SHOULDER PAULDRONS ───────────────────────────────────
  sphere(CX - s*85, shlY + s*10, s*28, s*26, CORAL, CORAL_HI);
  sphere(CX + s*85, shlY + s*10, s*28, s*26, CORAL, CORAL_HI);

  // ── NECK ────────────────────────────────────────────────
  capsule(CX, neckY + s*10, s*22, s*32, s*8, JOINT, JOINT_HI, 0);

  // ── HEAD (helmet) ────────────────────────────────────────
  ctx.save();
  ctx.translate(CX, headY + pose.hdX * s * 10);
  // Main helmet sphere
  var gHead = ctx.createRadialGradient(-s*12, -s*18, s*4, 0, 0, s*52);
  gHead.addColorStop(0, CORAL_HI);
  gHead.addColorStop(0.5, CORAL);
  gHead.addColorStop(1, darken(CORAL, 0.40));
  ctx.beginPath();
  ctx.ellipse(0, 0, s*48, s*58, 0, 0, Math.PI*2);
  ctx.fillStyle = gHead;
  ctx.fill();

  // Helmet visor slot (black strip)
  ctx.beginPath();
  ctx.ellipse(0, -s*8, s*32, s*10, 0, 0, Math.PI*2);
  ctx.fillStyle = VISOR;
  ctx.fill();
  // Visor highlight
  ctx.beginPath();
  ctx.ellipse(-s*8, -s*12, s*10, s*4, -0.3, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();

  // Brow ridge
  ctx.beginPath();
  ctx.ellipse(0, -s*17, s*35, s*7, 0, 0, Math.PI*2);
  ctx.fillStyle = darken(JOINT, 0.0);
  ctx.fill();

  ctx.restore();

  // ── ARMS ────────────────────────────────────────────────
  drawArm(CX - s*85, shlY + s*10, pose, false, s);
  drawArm(CX + s*85, shlY + s*10, pose, true,  s);
}

// ── Draw one arm (left = isRight:false, right = isRight:true) ──
function drawArm(shlX, shlY, pose, isRight, s) {
  var sign = isRight ? 1 : -1;

  // Extract angles from pose
  var shX = isRight ? pose.rShX : pose.lShX;  // elevation (0=down, PI/2=horizontal, PI=up)
  var shZ = isRight ? pose.rShZ : pose.lShZ;  // forward/back swing
  var elX = isRight ? pose.rElX : pose.lElX;  // elbow flex (0=straight, PI/2=90°)
  var wrX = isRight ? pose.rWrX : pose.lWrX;  // wrist flex
  var curl= isRight ? pose.rCurl: pose.lCurl; // finger curl 0-1

  // Upper arm length
  var UAL = s * 88;
  // Forearm length
  var FAL = s * 78;

  // Shoulder ball
  sphere(shlX, shlY, s*20, s*18, JOINT, JOINT_HI);

  // Compute upper arm end point (elbow) using spherical angles
  // shX controls elevation: 0=straight down, PI/2=horizontal, PI=up
  // shZ controls lateral swing toward/away from body
  var elevation = shX;        // 0..PI
  var lateral   = shZ * sign; // positive = out away from body

  // Upper arm vector
  var uxRaw = Math.sin(lateral) * Math.cos(elevation - Math.PI/2);
  var uyRaw = -Math.sin(elevation - Math.PI/2); // negative = upward on screen
  var uzRaw = Math.cos(lateral) * Math.cos(elevation - Math.PI/2);

  // For 2D projection with slight perspective tilt (camera slightly elevated)
  var projX = uxRaw;
  var projY = uyRaw - uzRaw * 0.22; // perspective: z-depth affects screen Y

  var elbX = shlX + projX * UAL;
  var elbY = shlY + projY * UAL;

  // Draw upper arm cylinder (as thick line with round caps)
  drawSegment(shlX, shlY, elbX, elbY, s*18, s*14, CORAL, CORAL_HI);

  // Elbow joint
  sphere(elbX, elbY, s*15, s*13, JOINT, JOINT_HI);

  // Forearm direction: elbow flex bends toward body/forward
  var foreAngle = Math.atan2(projY, projX) + elX * 0.72 * sign;
  var faX = Math.cos(foreAngle);
  var faY = Math.sin(foreAngle);

  var wristX = elbX + faX * FAL;
  var wristY = elbY + faY * FAL;

  drawSegment(elbX, elbY, wristX, wristY, s*14, s*10, CORAL, CORAL_HI);

  // Wrist joint
  sphere(wristX, wristY, s*11, s*10, JOINT, JOINT_HI);

  // ── HAND ──────────────────────────────────────────────
  drawHand(wristX, wristY, foreAngle, wrX, curl, isRight, s);
}

// Draw a limb segment as a tapered capsule
function drawSegment(x1, y1, x2, y2, r1, r2, base, hi) {
  var angle = Math.atan2(y2 - y1, x2 - x1);
  var len = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  // Gradient along length
  var g = ctx.createLinearGradient(0, -r1, 0, r1);
  g.addColorStop(0, darken(base, 0.35));
  g.addColorStop(0.3, hi);
  g.addColorStop(0.7, base);
  g.addColorStop(1, darken(base, 0.42));
  ctx.beginPath();
  ctx.moveTo(0, -r1);
  ctx.lineTo(len, -r2);
  ctx.lineTo(len,  r2);
  ctx.lineTo(0,  r1);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

// Draw hand: palm + 5 articulated fingers
function drawHand(wx, wy, armAngle, wrX, curl, isRight, s) {
  var sign = isRight ? 1 : -1;
  // Palm
  var palmW = s * 30, palmH = s * 22;
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(armAngle + wrX * 0.6);

  // Palm plate
  var gPalm = ctx.createLinearGradient(-palmW*0.5, 0, palmW*0.5, 0);
  gPalm.addColorStop(0, darken(CORAL, 0.30));
  gPalm.addColorStop(0.4, CORAL_HI);
  gPalm.addColorStop(1, darken(CORAL, 0.35));
  ctx.beginPath();
  roundRect(ctx, -palmW*0.5, s*4, palmW, palmH, s*5);
  ctx.fillStyle = gPalm;
  ctx.fill();

  // 5 fingers
  var fingerData = [
    { ox: -s*14 * sign, oy: s*6,  len: s*22, thick: s*7, curl: curl * 0.55 }, // thumb
    { ox: -s*10,        oy: s*24, len: s*28, thick: s*6, curl: curl },         // index
    { ox: -s*3,         oy: s*25, len: s*30, thick: s*6, curl: curl },         // middle
    { ox:  s*4,         oy: s*24, len: s*26, thick: s*5.5, curl: curl },       // ring
    { ox:  s*10,        oy: s*22, len: s*20, thick: s*5, curl: curl },         // pinky
  ];

  fingerData.forEach(function(f) {
    ctx.save();
    ctx.translate(f.ox, f.oy);
    // Finger base segment
    var seg1angle = -(Math.PI/2) + f.curl * 0.75;
    var seg1len = f.len * 0.52;
    var knucX = Math.cos(seg1angle) * seg1len;
    var knucY = Math.sin(seg1angle) * seg1len;
    // Draw base phalanx
    drawSegmentLocal(ctx, 0, 0, knucX, knucY, f.thick, f.thick*0.85, CORAL, CORAL_HI);
    // Knuckle
    ctx.beginPath();
    ctx.arc(knucX, knucY, f.thick*0.72, 0, Math.PI*2);
    ctx.fillStyle = JOINT;
    ctx.fill();
    // Tip phalanx — additional curl
    var seg2angle = seg1angle + f.curl * 0.65;
    var seg2len = f.len * 0.48;
    var tipX = knucX + Math.cos(seg2angle) * seg2len;
    var tipY = knucY + Math.sin(seg2angle) * seg2len;
    drawSegmentLocal(ctx, knucX, knucY, tipX, tipY, f.thick*0.78, f.thick*0.60, CORAL, CORAL_HI);
    // Fingertip cap
    ctx.beginPath();
    ctx.arc(tipX, tipY, f.thick*0.60, 0, Math.PI*2);
    ctx.fillStyle = CORAL;
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

function drawSegmentLocal(c, x1, y1, x2, y2, r1, r2, base, hi) {
  var angle = Math.atan2(y2-y1, x2-x1);
  var len = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
  c.save();
  c.translate(x1,y1); c.rotate(angle);
  var g = c.createLinearGradient(0,-r1,0,r1);
  g.addColorStop(0, darken(base,0.32));
  g.addColorStop(0.35, hi);
  g.addColorStop(0.75, base);
  g.addColorStop(1, darken(base,0.40));
  c.beginPath();
  c.moveTo(0,-r1); c.lineTo(len,-r2); c.lineTo(len,r2); c.lineTo(0,r1);
  c.closePath(); c.fillStyle=g; c.fill();
  c.restore();
}

// ════════════════════════════════════════════════════════════
//  ANIMATION LOOP
// ════════════════════════════════════════════════════════════
var totalFrames = 60;
var frameBar = 0;
var FRAME_LABEL = '';
var TOTAL_SIGNS = 0;
var CUR_SIGN = 0;

function loop(ts) {
  requestAnimationFrame(loop);
  var dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;
  time += dt;

  var word = '';
  if (playing && words.length > 0) {
    var w = words[wordIdx];
    word = w.word || '';
    totalFrames = w.num_frames || 60;
    var targetPose = getPose(word, frame / totalFrames);
    curPose = lerpPose(curPose, targetPose, 0.18);

    frame += speed * 0.75;
    frameBar = Math.round(frame);
    if (frame >= totalFrames) {
      frame = 0;
      if (wordIdx + 1 < words.length) {
        wordIdx++;
        rn({ type: 'WORD_CHANGE', idx: wordIdx });
      } else {
        playing = false;
        rn({ type: 'DONE' });
      }
    }
  } else {
    // Idle: gentle breathing + subtle head sway
    var breathe = Math.sin(time * 1.8) * 0.025;
    var sway    = Math.sin(time * 0.6) * 0.012;
    var neutralTarget = {
      lShX: 0.55 + breathe, lShZ: -0.30, lElX: 0.75, lWrX: 0, lCurl: 0.2,
      rShX: 0.55 + breathe, rShZ:  0.30, rElX: 0.75, rWrX: 0, rCurl: 0.2,
      hdX: sway, hdY: 0,
    };
    curPose = lerpPose(curPose, neutralTarget, 0.06);
    frameBar = 0;
  }

  drawAvatar(curPose);
}

requestAnimationFrame(function(ts) { lastTs = ts; requestAnimationFrame(loop); });

// ── Command handler ──────────────────────────────────────────
window.handleCmd = function(raw) {
  try {
    var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (d.type === 'LOAD') {
      words = d.words || []; wordIdx = 0; frame = 0;
      speed = d.speed || 1.0; playing = words.length > 0;
      TOTAL_SIGNS = words.length; CUR_SIGN = 0;
    } else if (d.type === 'PLAY')   { playing = true; }
    else if (d.type === 'PAUSE')  { playing = false; }
    else if (d.type === 'REPLAY') { wordIdx=0; frame=0; playing=true; }
    else if (d.type === 'STOP')   { playing=false; wordIdx=0; frame=0; }
    else if (d.type === 'SPEED')  { speed = d.speed||1.0; }
    else if (d.type === 'RESET')  { playing=false; words=[]; wordIdx=0; frame=0; }
  } catch(e) {}
};

function onMsg(e) { if (e && e.data) window.handleCmd(e.data); }
window.addEventListener('message', onMsg);
document.addEventListener('message', onMsg);

// Signal ready
setTimeout(function() { rn({ type: 'READY' }); }, 80);
</script>
</body>
</html>`;

  const isFingerspelling = activeClip?.type === 'fingerspelling';

  return (
    <View style={[styles.card, { backgroundColor: '#1E293B', borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Sparkles size={16} color="#FA5252" />
          <Text style={[styles.headerTitle, { fontSize: scaleFont(12) }]}>
            EchoSign 3D ISL Avatar (Y-Bot Rig)
          </Text>
        </View>
        <View style={styles.headerTags}>
          {isFingerspelling ? (
            <View style={[styles.tagBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.tagText}>Fingerspelling (A–Z)</Text>
            </View>
          ) : activeClip ? (
            <View style={[styles.tagBadge, { backgroundColor: '#FA5252' }]}>
              <Text style={styles.tagText}>ISL Motion Library</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.speedPill}
            onPress={cycleSpeed}
            accessibilityLabel={`Playback speed ${speedMultiplier}x`}
            accessibilityRole="button"
          >
            <Text style={styles.speedText}>{speedMultiplier}x</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Avatar Stage */}
      <View style={styles.stageBox}>
        <WebViewComponent
          ref={webViewRef as any}
          originWhitelist={['*']}
          source={{ html: avatarHtml }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          allowFileAccess={true}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          cacheEnabled={true}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#FA5252" />
            <Text style={styles.loadingText}>Generating ISL Gestures...</Text>
          </View>
        )}

        {/* Gloss subtitle overlay */}
        {activeClip && (
          <View style={styles.glossOverlay} pointerEvents="box-none">
            <View style={styles.glossChipRow}>
              <View style={[styles.activeWordPill, { backgroundColor: '#FA5252' }]}>
                <Text style={styles.activeWordText}>{activeClip.word}</Text>
                <Text style={styles.activeWordIdxText}>
                  {currentWordIdx + 1}/{animationList.length}
                </Text>
              </View>
              {isFingerspelling && activeClip.character && (
                <View style={styles.charBadge}>
                  <Text style={styles.charBadgeText}>Letter: {activeClip.character}</Text>
                </View>
              )}
            </View>
            {originalText ? (
              <Text style={styles.originalTextQuote} numberOfLines={2}>
                "{originalText}"
              </Text>
            ) : null}
          </View>
        )}

        {/* Missing Vocabulary Alert */}
        {missingVocabulary && missingVocabulary.length > 0 && (
          <View style={styles.missingBadgeRow} pointerEvents="box-none">
            <AlertTriangle size={12} color="#F59E0B" />
            <Text style={styles.missingBadgeText}>
              Spelled fallback: {missingVocabulary.slice(0, 3).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Playback Controls */}
      <View style={styles.controlsBar}>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.ctrlBtn, isPlaying ? styles.ctrlBtnPause : styles.ctrlBtnPlay]}
            onPress={handlePlayPause}
            accessibilityLabel={isPlaying ? 'Pause animation' : 'Play animation'}
            accessibilityRole="button"
          >
            {isPlaying ? <Pause size={18} color="#FFFFFF" /> : <Play size={18} color="#FFFFFF" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctrlBtnSec}
            onPress={handleReplay}
            accessibilityLabel="Replay sequence"
            accessibilityRole="button"
          >
            <RotateCcw size={16} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctrlBtnSec}
            onPress={handleStop}
            accessibilityLabel="Stop animation"
            accessibilityRole="button"
          >
            <Square size={15} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <View style={styles.statusInfoBox}>
          <Text style={styles.statusWordText}>
            {activeClip ? activeClip.word : isPlaying ? 'Active' : 'Standby'}
          </Text>
          <Text style={styles.statusSubtitleText}>
            {animationList.length > 0
              ? `${currentWordIdx + 1} of ${animationList.length} Signs`
              : isPlaying ? 'Playing...' : 'Tap Play to start'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFFFFF', fontWeight: '700' },
  headerTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  speedPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#334155' },
  speedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  stageBox: { height: 320, position: 'relative', backgroundColor: '#C8D4DC', overflow: 'hidden' },
  webView: { flex: 1, backgroundColor: '#C8D4DC' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(200,212,220,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { color: '#1E293B', fontSize: 12, fontWeight: '600' },
  glossOverlay: { position: 'absolute', bottom: 10, left: 10, right: 10, gap: 4 },
  glossChipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeWordPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, elevation: 2,
  },
  activeWordText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  activeWordIdxText: { color: '#FFE3E3', fontWeight: '600', fontSize: 10 },
  charBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  charBadgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 10 },
  originalTextQuote: {
    color: '#1E293B', fontStyle: 'italic', fontSize: 11, fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start',
  },
  missingBadgeRow: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.92)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  missingBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  controlsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#0F172A', gap: 12,
  },
  controlButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  ctrlBtnPlay: { backgroundColor: '#FA5252' },
  ctrlBtnPause: { backgroundColor: '#E03131' },
  ctrlBtnSec: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1E293B',
    alignItems: 'center', justifyContent: 'center',
  },
  statusInfoBox: { alignItems: 'flex-end', justifyContent: 'center' },
  statusWordText: { color: '#FA5252', fontSize: 12, fontWeight: '700' },
  statusSubtitleText: { color: '#94A3B8', fontSize: 10, fontWeight: '500' },
});
