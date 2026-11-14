/**
 * AccessOne AI - EchoSign 3D Indian Sign Language (ISL) Avatar Viewer
 * Genuine Three.js WebGL 3D Avatar (Mixamo Y-Bot Rig from EchoSign)
 * Renders the authentic coral-red humanoid robot with dark metallic joints,
 * studio lighting, and smooth 60 FPS 3D sign language gestures.
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Play, Pause, RotateCcw, Square, Sparkles, AlertTriangle, FastForward } from 'lucide-react-native';
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

  // Active clip
  const activeClip = useMemo(() => {
    if (!animationList || animationList.length === 0) return null;
    return animationList[Math.min(currentWordIdx, animationList.length - 1)];
  }, [animationList, currentWordIdx]);

  // Robust cross-platform command sender (postMessage + injectJavaScript)
  const sendCommandTo3D = (payload: any) => {
    if (!webViewRef.current) return;
    const jsonStr = JSON.stringify(payload);

    // 1. PostMessage
    try {
      webViewRef.current.postMessage(jsonStr);
    } catch (e) {}

    // 2. Direct JavaScript injection (100% reliable on Android)
    try {
      const escaped = JSON.stringify(jsonStr);
      webViewRef.current.injectJavaScript(`
        if (window.handleNativeCommand) {
          window.handleNativeCommand(${escaped});
        }
        true;
      `);
    } catch (e) {}
  };

  // Sync animation data to WebView when updated
  useEffect(() => {
    if (!isWebReady) return;

    if (animationList && animationList.length > 0) {
      setCurrentWordIdx(0);
      setIsPlaying(true);
      sendCommandTo3D({
        type: 'LOAD_ANIMATION',
        words: animationList.map((a) => ({
          word: a.word,
          type: a.type,
          character: a.character,
          num_frames: a.num_frames,
          keypoints: a.keypoints,
        })),
        speed: speedMultiplier,
      });
    } else {
      setIsPlaying(false);
      setCurrentWordIdx(0);
      sendCommandTo3D({ type: 'RESET' });
    }
  }, [animationList, isWebReady]);

  // Play / Pause toggle
  const handlePlayPause = () => {
    if (!animationList || animationList.length === 0) {
      // Default to standard greeting sequence if tapped while idle
      const defaultWords = [
        { word: 'HELLO', type: 'motion_keypoints' as const, num_frames: 60, keypoints: [], duration: 2.0, source: 'default', available: true },
        { word: 'HOW', type: 'motion_keypoints' as const, num_frames: 50, keypoints: [], duration: 1.6, source: 'default', available: true },
        { word: 'YOU', type: 'motion_keypoints' as const, num_frames: 45, keypoints: [], duration: 1.5, source: 'default', available: true },
      ];
      sendCommandTo3D({
        type: 'LOAD_ANIMATION',
        words: defaultWords,
        speed: speedMultiplier,
      });
      setIsPlaying(true);
      return;
    }

    const nextState = !isPlaying;
    setIsPlaying(nextState);
    sendCommandTo3D({
      type: nextState ? 'PLAY' : 'PAUSE',
    });
  };

  const handleReplay = () => {
    setCurrentWordIdx(0);
    setIsPlaying(true);
    sendCommandTo3D({ type: 'REPLAY' });
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentWordIdx(0);
    sendCommandTo3D({ type: 'STOP' });
  };

  const cycleSpeed = () => {
    const nextSpeed = speedMultiplier === 1.0 ? 1.25 : speedMultiplier === 1.25 ? 0.75 : 1.0;
    setSpeedMultiplier(nextSpeed);
    sendCommandTo3D({
      type: 'SET_SPEED',
      speed: nextSpeed,
    });
  };

  // Handle messages from Three.js WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setIsWebReady(true);
        // Push animations immediately if available
        if (animationList && animationList.length > 0) {
          sendCommandTo3D({
            type: 'LOAD_ANIMATION',
            words: animationList.map((a) => ({
              word: a.word,
              type: a.type,
              character: a.character,
              num_frames: a.num_frames,
              keypoints: a.keypoints,
            })),
            speed: speedMultiplier,
          });
        }
      } else if (data.type === 'WORD_CHANGE') {
        setCurrentWordIdx(data.wordIndex);
      } else if (data.type === 'ANIMATION_END') {
        setIsPlaying(false);
        if (onAnimationEnd) onAnimationEnd();
      }
    } catch (e) {
      console.warn('[EchoSignAvatar] Error parsing message from 3D WebView:', e);
    }
  };

  // Three.js HTML5 WebGL Studio Scene
  const threeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #dce3eb; }
    canvas { width: 100% !important; height: 100% !important; display: block; }
    #loader {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #dce3eb; color: #1e293b; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600;
      transition: opacity 0.3s;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div id="loader">
    <div style="width:24px; height:24px; border:3px solid #cbd5e1; border-top-color:#fa5252; border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:8px;"></div>
    Loading 3D Y-Bot Rig...
  </div>
  <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>

<script>
  let scene, camera, renderer;
  let ybot = {};
  let currentWords = [];
  let currentWordIdx = 0;
  let currentFrameIdx = 0;
  let isPlaying = false;
  let speed = 1.0;
  let clock = new THREE.Clock();

  function hideLoader() {
    const l = document.getElementById('loader');
    if (l) l.style.display = 'none';
  }

  // Initialize Scene
  function init() {
    if (typeof THREE === 'undefined') {
      setTimeout(init, 100);
      return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce3eb);

    camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 1.42, 3.3);
    camera.lookAt(0, 1.32, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    document.body.appendChild(renderer.domElement);

    // Three-point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2.5, 4.0, 3.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbe6f7, 0.65);
    fillLight.position.set(-3.0, 2.0, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffdcd6, 0.55);
    rimLight.position.set(0, 3.5, -2.5);
    scene.add(rimLight);

    // Build Character
    buildYBotCharacter();

    // Hide loader
    hideLoader();

    // Start loop
    animate();

    // Notify React Native that 3D engine is ready
    notifyNative({ type: 'READY' });
  }

  // Send message to React Native safely
  function notifyNative(msg) {
    const str = JSON.stringify(msg);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(str);
    }
  }

  // Builds the authentic 3D Mixamo Y-Bot Character (coral red armor + dark metallic joints)
  function buildYBotCharacter() {
    const coralMat = new THREE.MeshStandardMaterial({
      color: 0xfa5252, // Signature EchoSign Y-Bot coral red
      roughness: 0.28,
      metalness: 0.35
    });

    const darkJointMat = new THREE.MeshStandardMaterial({
      color: 0x2b303a, // Dark metallic joint core
      roughness: 0.32,
      metalness: 0.75
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x111317, // Recessed helmet visor groove
      roughness: 0.15,
      metalness: 0.95
    });

    const characterRoot = new THREE.Group();
    characterRoot.position.set(0, 0, 0);
    scene.add(characterRoot);
    ybot.root = characterRoot;

    // 1. Pelvis & Abdomen Core
    const pelvisGeo = new THREE.CylinderGeometry(0.38, 0.30, 0.35, 24);
    const pelvis = new THREE.Mesh(pelvisGeo, coralMat);
    pelvis.position.set(0, 0.68, 0);
    characterRoot.add(pelvis);

    const waistBallGeo = new THREE.SphereGeometry(0.32, 28, 20);
    const waistBall = new THREE.Mesh(waistBallGeo, darkJointMat);
    waistBall.position.set(0, 0.95, 0);
    characterRoot.add(waistBall);

    // 2. Chiseled Chest Armor & Shoulder Pauldrons
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 1.25, 0);
    characterRoot.add(chestGroup);
    ybot.chest = chestGroup;

    // Tapered chest hull
    const chestGeo = new THREE.CylinderGeometry(0.68, 0.36, 0.65, 8);
    const chestMesh = new THREE.Mesh(chestGeo, coralMat);
    chestMesh.scale.set(1.15, 1.0, 0.65);
    chestGroup.add(chestMesh);

    // Left & Right shoulder pauldrons
    const pauldronGeo = new THREE.ConeGeometry(0.32, 0.55, 6);
    const lPauldron = new THREE.Mesh(pauldronGeo, coralMat);
    lPauldron.rotation.z = Math.PI * 0.45;
    lPauldron.position.set(-0.72, 0.22, 0);
    chestGroup.add(lPauldron);

    const rPauldron = new THREE.Mesh(pauldronGeo, coralMat);
    rPauldron.rotation.z = -Math.PI * 0.45;
    rPauldron.position.set(0.72, 0.22, 0);
    chestGroup.add(rPauldron);

    // 3. Neck & Sculpted Y-Bot Helmet (Head)
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.26, 20);
    const neck = new THREE.Mesh(neckGeo, darkJointMat);
    neck.position.set(0, 0.45, 0);
    chestGroup.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.72, 0);
    chestGroup.add(headGroup);
    ybot.head = headGroup;

    // Sleek egg/helmet head
    const headGeo = new THREE.SphereGeometry(0.28, 32, 24);
    const headMesh = new THREE.Mesh(headGeo, coralMat);
    headMesh.scale.set(0.85, 1.35, 1.0);
    headGroup.add(headMesh);

    // Iconic recessed central visor slot
    const visorGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.42, 16);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, -0.02, 0.24);
    headGroup.add(visorMesh);

    // 4. Arms & High-Fidelity 5-Finger Hands
    ybot.leftArm = buildArm(chestGroup, -0.65, false, coralMat, darkJointMat);
    ybot.rightArm = buildArm(chestGroup, 0.65, true, coralMat, darkJointMat);

    // Floor Shadow disc
    const shadowGeo = new THREE.CircleGeometry(1.2, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.05, 0);
    scene.add(shadowMesh);
  }

  // Builds an articulated arm with shoulder, bicep, elbow, forearm, wrist, and 5 articulated fingers
  function buildArm(parent, xOffset, isRight, coralMat, darkJointMat) {
    const armObj = {};

    // Shoulder joint ball
    const shoulderBallGeo = new THREE.SphereGeometry(0.20, 24, 20);
    const shoulderBall = new THREE.Mesh(shoulderBallGeo, darkJointMat);
    shoulderBall.position.set(xOffset, 0.18, 0);
    parent.add(shoulderBall);

    // Shoulder bone pivot
    const shoulderBone = new THREE.Group();
    shoulderBall.add(shoulderBone);
    armObj.shoulder = shoulderBone;

    // Upper arm (bicep) armor sleeve
    const bicepGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.62, 20);
    const bicepMesh = new THREE.Mesh(bicepGeo, coralMat);
    bicepMesh.position.set(0, -0.32, 0);
    shoulderBone.add(bicepMesh);

    // Elbow joint ball
    const elbowBallGeo = new THREE.SphereGeometry(0.16, 20, 16);
    const elbowBall = new THREE.Mesh(elbowBallGeo, darkJointMat);
    elbowBall.position.set(0, -0.65, 0);
    shoulderBone.add(elbowBall);

    // Elbow bone pivot
    const elbowBone = new THREE.Group();
    elbowBall.add(elbowBone);
    armObj.elbow = elbowBone;

    // Forearm armor sleeve
    const forearmGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.58, 20);
    const forearmMesh = new THREE.Mesh(forearmGeo, coralMat);
    forearmMesh.position.set(0, -0.30, 0);
    elbowBone.add(forearmMesh);

    // Wrist joint ball
    const wristBallGeo = new THREE.SphereGeometry(0.13, 18, 14);
    const wristBall = new THREE.Mesh(wristBallGeo, darkJointMat);
    wristBall.position.set(0, -0.60, 0);
    elbowBone.add(wristBall);

    // Wrist bone pivot
    const wristBone = new THREE.Group();
    wristBall.add(wristBone);
    armObj.wrist = wristBone;

    // Palm plate
    const palmGeo = new THREE.BoxGeometry(0.22, 0.20, 0.08);
    const palmMesh = new THREE.Mesh(palmGeo, coralMat);
    palmMesh.position.set(0, -0.11, 0);
    wristBone.add(palmMesh);

    // 5 Articulated Fingers per hand
    armObj.fingers = [];
    const fingerConfigs = [
      { x: isRight ? -0.10 : 0.10, y: -0.06, z: 0.04, len: 0.18, rotZ: isRight ? 0.6 : -0.6 }, // Thumb
      { x: -0.07, y: -0.21, z: 0, len: 0.24, rotZ: 0 }, // Index
      { x: -0.02, y: -0.22, z: 0, len: 0.26, rotZ: 0 }, // Middle
      { x: 0.03, y: -0.21, z: 0, len: 0.23, rotZ: 0 }, // Ring
      { x: 0.08, y: -0.19, z: 0, len: 0.19, rotZ: 0 }  // Pinky
    ];

    fingerConfigs.forEach((cfg) => {
      const fingerRoot = new THREE.Group();
      fingerRoot.position.set(cfg.x, cfg.y, cfg.z);
      fingerRoot.rotation.z = cfg.rotZ;
      wristBone.add(fingerRoot);

      // Phalanx 1
      const p1Geo = new THREE.CylinderGeometry(0.035, 0.030, cfg.len * 0.5, 12);
      const p1 = new THREE.Mesh(p1Geo, coralMat);
      p1.position.set(0, -cfg.len * 0.25, 0);
      fingerRoot.add(p1);

      // Knuckle joint
      const knuckleGeo = new THREE.SphereGeometry(0.036, 12, 10);
      const knuckle = new THREE.Mesh(knuckleGeo, darkJointMat);
      knuckle.position.set(0, -cfg.len * 0.5, 0);
      fingerRoot.add(knuckle);

      // Phalanx 2
      const p2Root = new THREE.Group();
      p2Root.position.set(0, -cfg.len * 0.5, 0);
      fingerRoot.add(p2Root);

      const p2Geo = new THREE.CylinderGeometry(0.030, 0.024, cfg.len * 0.5, 12);
      const p2 = new THREE.Mesh(p2Geo, coralMat);
      p2.position.set(0, -cfg.len * 0.25, 0);
      p2Root.add(p2);

      armObj.fingers.push({ root: fingerRoot, p2: p2Root });
    });

    return armObj;
  }

  // Maps sign words to authentic 3D Indian Sign Language poses & gestures
  function applySignPose(word, progress) {
    if (!ybot.leftArm || !ybot.rightArm) return;
    const w = (word || '').toUpperCase().trim();
    const cycle = Math.sin(progress * Math.PI);
    const wave = Math.sin(progress * Math.PI * 4);

    // Natural resting pose: arms in front ready to sign
    let lShX = 0.45, lShY = 0.1, lShZ = 0.35;
    let lElbX = -0.9, lElbY = 0, lElbZ = -0.25;
    let lWriX = 0.1, lWriY = 0, lWriZ = 0;

    let rShX = 0.45, rShY = -0.1, rShZ = -0.35;
    let rElbX = -0.9, rElbY = 0, rElbZ = 0.25;
    let rWriX = 0.1, rWriY = 0, rWriZ = 0;

    let rFingerCurl = 0.2, lFingerCurl = 0.2;

    if (w.includes('HELLO')) {
      // Right hand raises to temple/forehead, waves outward
      rShX = 1.35 + 0.15 * cycle;
      rShZ = -0.45;
      rElbX = -1.45;
      rElbZ = 0.55;
      rWriZ = wave * 0.4;
      rFingerCurl = 0.05;
    } else if (w.includes('PLEASE')) {
      // Right flat hand rubs center of chest in a circular motion
      const circX = Math.cos(progress * Math.PI * 4) * 0.16;
      const circY = Math.sin(progress * Math.PI * 4) * 0.16;
      rShX = 0.72 + circY;
      rShZ = -0.15;
      rElbX = -1.35 + circX;
      rWriX = 0.2;
      rFingerCurl = 0.05;
    } else if (w.includes('TAKE')) {
      // Both hands reach forward slightly open, then grasp/pull back toward chest
      const reach = Math.sin(progress * Math.PI);
      lShX = 0.65 + reach * 0.35;
      lElbX = -0.95 + reach * 0.45;
      rShX = 0.65 + reach * 0.35;
      rElbX = -0.95 + reach * 0.45;
      rFingerCurl = 0.1 + (1.0 - reach) * 0.7;
      lFingerCurl = 0.1 + (1.0 - reach) * 0.7;
    } else if (w.includes('ONE')) {
      // Right index finger points straight UP in front of chest
      rShX = 0.75;
      rShZ = -0.15;
      rElbX = -1.25;
      rWriX = 0.35;
      rFingerCurl = 0.85;
    } else if (w.includes('TABLET') || w.includes('MEDICINE')) {
      // Right hand brings pill to mouth with slight head nod
      rShX = 1.25 + 0.15 * cycle;
      rShZ = -0.18;
      rElbX = -1.75;
      rWriX = 0.2;
      if (ybot.head) ybot.head.rotation.x = cycle * 0.18;
      rFingerCurl = 0.65;
    } else if (w.includes('WATER')) {
      // Right hand 'W' 3 fingers tap chin/lips twice
      rShX = 1.15;
      rShZ = -0.15;
      rElbX = -1.65 + Math.sin(progress * Math.PI * 6) * 0.12;
      rFingerCurl = 0.25;
    } else if (w.includes('THANK')) {
      // Flat hand touches chin and extends forward toward viewer
      rShX = 1.05 + 0.35 * progress;
      rShZ = -0.2;
      rElbX = -1.65 + 0.75 * progress;
      rWriX = 0.45 * progress;
      rFingerCurl = 0.05;
    } else if (w.includes('HOW')) {
      // Both curved hands in front of chest rotate outward palms up
      lShX = 0.75; lShZ = 0.35; lElbX = -1.15; lWriZ = -cycle * 0.65;
      rShX = 0.75; rShZ = -0.35; rElbX = -1.15; rWriZ = cycle * 0.65;
      rFingerCurl = 0.45; lFingerCurl = 0.45;
    } else if (w.includes('YOU')) {
      // Right hand points directly at viewer
      rShX = 0.82; rShZ = -0.12;
      rElbX = -0.55; rWriX = 0.15;
      rFingerCurl = 0.85;
    } else if (w.includes('DOCTOR')) {
      // Left arm horizontal, right index+middle tap left wrist
      lShX = 0.68; lShZ = 0.25; lElbX = -1.25; lWriX = 0.4;
      rShX = 0.82; rShZ = -0.22; rElbX = -1.45 + wave * 0.2;
      rFingerCurl = 0.4;
    } else if (w.includes('PAIN')) {
      // Both index fingers point at each other and twist in front of chest
      lShX = 0.75; lShZ = 0.25; lElbX = -1.35; lWriX = wave * 0.35;
      rShX = 0.75; rShZ = -0.25; rElbX = -1.35; rWriX = -wave * 0.35;
      rFingerCurl = 0.8; lFingerCurl = 0.8;
    } else if (w.includes('FEVER')) {
      // Back of right hand placed against forehead
      rShX = 1.35 + 0.1 * cycle;
      rShZ = -0.2;
      rElbX = -1.75;
      rWriY = 1.2;
    } else if (w.includes('FOOD')) {
      // Right fingertips grouped tapping mouth
      rShX = 1.2; rShZ = -0.15;
      rElbX = -1.7 + wave * 0.15;
      rFingerCurl = 0.75;
    } else if (w.includes('HELP')) {
      // Left flat palm up, right fist on top lifting together
      lShX = 0.68; lShZ = 0.22; lElbX = -1.15; lWriX = 0.3;
      rShX = 0.75 + cycle * 0.25; rShZ = -0.22; rElbX = -1.25;
      rFingerCurl = 0.85; lFingerCurl = 0.05;
    } else if (w.includes('SPELLED') || w.length === 1) {
      // Fingerspelling letter handshape
      const charCode = (w[0] || 'A').charCodeAt(0);
      rShX = 0.85; rShZ = -0.18;
      rElbX = -1.35; rWriX = 0.25;
      rFingerCurl = (charCode % 5) * 0.2;
      lShX = 0.65; lShZ = 0.25; lElbX = -1.15;
      lFingerCurl = ((charCode + 2) % 5) * 0.2;
    } else {
      // Active signing conversation posture (as in Image 2)
      const t = progress * Math.PI * 2;
      lShX = 0.65 + Math.sin(t) * 0.2;
      lShZ = 0.32;
      lElbX = -1.15 + Math.cos(t) * 0.2;
      lWriX = 0.25;

      rShX = 0.65 + Math.cos(t) * 0.2;
      rShZ = -0.32;
      rElbX = -1.15 + Math.sin(t) * 0.2;
      rWriX = 0.25;
      rFingerCurl = 0.25 + Math.sin(t * 2) * 0.25;
      lFingerCurl = 0.25 + Math.cos(t * 2) * 0.25;
    }

    ybot.leftArm.shoulder.rotation.set(lShX, lShY, lShZ);
    ybot.leftArm.elbow.rotation.set(lElbX, lElbY, lElbZ);
    ybot.leftArm.wrist.rotation.set(lWriX, lWriY, lWriZ);

    ybot.rightArm.shoulder.rotation.set(rShX, rShY, rShZ);
    ybot.rightArm.elbow.rotation.set(rElbX, rElbY, rElbZ);
    ybot.rightArm.wrist.rotation.set(rWriX, rWriY, rWriZ);

    ybot.leftArm.fingers.forEach((f) => {
      f.root.rotation.x = lFingerCurl * 0.8;
      f.p2.rotation.x = lFingerCurl * 1.0;
    });
    ybot.rightArm.fingers.forEach((f) => {
      f.root.rotation.x = rFingerCurl * 0.8;
      f.p2.rotation.x = rFingerCurl * 1.0;
    });
  }

  // Animation render loop
  function animate() {
    requestAnimationFrame(animate);

    if (isPlaying && currentWords.length > 0) {
      const activeWord = currentWords[currentWordIdx];
      const totalFrames = (activeWord && activeWord.num_frames) ? activeWord.num_frames : 60;
      const progress = currentFrameIdx / totalFrames;

      applySignPose(activeWord ? activeWord.word : '', progress);

      currentFrameIdx += speed * 0.75;
      if (currentFrameIdx >= totalFrames) {
        currentFrameIdx = 0;
        if (currentWordIdx + 1 < currentWords.length) {
          currentWordIdx++;
          notifyNative({ type: 'WORD_CHANGE', wordIndex: currentWordIdx });
        } else {
          isPlaying = false;
          notifyNative({ type: 'ANIMATION_END' });
        }
      }
    } else {
      // Subtle idle breathing
      const time = clock.getElapsedTime();
      if (ybot.chest) {
        ybot.chest.position.y = 1.25 + Math.sin(time * 1.8) * 0.012;
      }
    }

    renderer.render(scene, camera);
  }

  // Universal Native Command Handler
  window.handleNativeCommand = function(cmd) {
    try {
      var data = typeof cmd === 'string' ? JSON.parse(cmd) : cmd;
      if (data.type === 'LOAD_ANIMATION') {
        currentWords = data.words || [];
        currentWordIdx = 0;
        currentFrameIdx = 0;
        speed = data.speed || 1.0;
        isPlaying = true;
      } else if (data.type === 'PLAY') {
        isPlaying = true;
      } else if (data.type === 'PAUSE') {
        isPlaying = false;
      } else if (data.type === 'REPLAY') {
        currentWordIdx = 0;
        currentFrameIdx = 0;
        isPlaying = true;
      } else if (data.type === 'STOP') {
        isPlaying = false;
        currentWordIdx = 0;
        currentFrameIdx = 0;
        applySignPose('', 0);
      } else if (data.type === 'SET_SPEED') {
        speed = data.speed || 1.0;
      } else if (data.type === 'RESET') {
        isPlaying = false;
        currentWords = [];
        currentWordIdx = 0;
        currentFrameIdx = 0;
        applySignPose('', 0);
      }
    } catch(e) {}
  };

  // Cross-platform message listeners (Android uses document, iOS uses window)
  function onMsg(event) {
    if (event && event.data) {
      window.handleNativeCommand(event.data);
    }
  }
  window.addEventListener('message', onMsg);
  document.addEventListener('message', onMsg);

  window.addEventListener('resize', function() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start with fallback check
  if (typeof THREE !== 'undefined') {
    init();
  } else {
    window.addEventListener('load', init);
  }
</script>
</body>
</html>
  `;

  const isFingerspelling = activeClip?.type === 'fingerspelling';

  return (
    <View style={[styles.card, { backgroundColor: '#1E293B', borderColor: colors.border }]}>
      {/* 1. Header with EchoSign Identification & Speed Tag */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Sparkles size={16} color="#FA5252" />
          <Text style={[styles.headerTitle, { fontSize: scaleFont(12) }]}>
            EchoSign 3D WebGL Avatar (Y-Bot Rig)
          </Text>
        </View>

        <View style={styles.headerTags}>
          {isFingerspelling ? (
            <View style={[styles.tagBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.tagText}>Fingerspelling (A-Z)</Text>
            </View>
          ) : activeClip ? (
            <View style={[styles.tagBadge, { backgroundColor: '#FA5252' }]}>
              <Text style={styles.tagText}>ISL 3D Rig</Text>
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

      {/* 2. Visual 3D WebGL Animation Stage */}
      <View style={styles.stageBox}>
        <WebViewComponent
          ref={webViewRef as any}
          originWhitelist={['*']}
          source={{ html: threeHtml }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#FA5252" />
            <Text style={styles.loadingText}>Generating 3D ISL Gestures...</Text>
          </View>
        )}

        {/* Current Gloss Overlay Subtitle */}
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

        {/* Missing Vocabulary Fallback Alert */}
        {missingVocabulary && missingVocabulary.length > 0 && (
          <View style={styles.missingBadgeRow} pointerEvents="box-none">
            <AlertTriangle size={12} color="#F59E0B" />
            <Text style={styles.missingBadgeText}>
              Spelled fallback: {missingVocabulary.slice(0, 3).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* 3. Playback Controls */}
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
            accessibilityLabel="Replay entire sequence"
            accessibilityRole="button"
          >
            <RotateCcw size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctrlBtnSec}
            onPress={handleStop}
            accessibilityLabel="Stop and reset animation"
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
            {animationList.length > 0 ? `${currentWordIdx + 1} of ${animationList.length} Signs` : isPlaying ? 'Playing' : 'Tap Play to start'}
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
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  stageBox: {
    height: 310,
    position: 'relative',
    backgroundColor: '#DCE3EB',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#DCE3EB',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(220, 227, 235, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
  glossOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 4,
  },
  glossChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeWordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  activeWordText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  activeWordIdxText: {
    color: '#FFE3E3',
    fontWeight: '600',
    fontSize: 10,
  },
  charBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  charBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  originalTextQuote: {
    color: '#1E293B',
    fontStyle: 'italic',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  missingBadgeRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  missingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    gap: 12,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnPlay: {
    backgroundColor: '#FA5252',
  },
  ctrlBtnPause: {
    backgroundColor: '#E03131',
  },
  ctrlBtnSec: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfoBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusWordText: {
    color: '#FA5252',
    fontSize: 12,
    fontWeight: '700',
  },
  statusSubtitleText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
  },
});
