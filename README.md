# AccessOne AI — Mobile Frontend (React Native + Expo SDK 52)

Clinical-grade multimodal assistive intelligence mobile client for patients and healthcare providers, configured for 100% Expo Go compatibility on Android and iOS.

---

## 🚀 Quick Start (Expo Go on Android)

1. **Start the development server:**
   ```bash
   npx expo start
   ```
2. **Scan the QR Code:**
   - Open the **Expo Go** app on your Android phone.
   - Tap **Scan QR code** and point your camera at the QR code displayed in your terminal.
   - The app will bundle and run directly on your phone.

---

## 📱 Implemented Architecture & Screens

### 1. Persistent Top Header (Global)
- **AccessOne Clinical AI Branding** with direct navigation shortcut to Dashboard.
- **Font Scale Stepper (`A-` / `Std` / `A+`):** Dynamically scales font sizes across all screens and components in real time.
- **High-Contrast Mode Toggle:** Instant switch between Clinical Light (`#F8FAFC`) and true High-Contrast Black (`#000000`, pure `#FFFFFF` typography, `#1ABC9C` cyan-teal accents).
- **Quick-Trigger SOS Button:** Immediate access to emergency dispatch from anywhere in the app.

---

### 2. Screens & Interactive Flows

| Screen | Route | Key Interactive Features |
|---|---|---|
| **Dashboard** | `HomeScreen` | System Operational Telemetry Banner (Certified AI v4.2), Active Care Ring card, 4 primary module launch cards (Vision, Hearing, Bridge, Safety), Active Adaptation Matrix summary, Device Telemetry (battery, neural latency, lapel BLE status), and Recent Activity log. |
| **Vision Assist** | `VisionScreen` | Live `expo-camera` viewfinder with HUD (480 Lux, 18 cm distance, torch toggle), AI bounding box overlay (99.4% confidence), "Scan Text (OCR)" & "Describe Scene" buttons, prescription bottle readout, and working **"Read Aloud"** via `expo-speech`. |
| **Hearing Assist** | `HearingScreen` | Live microphone toggle, real-time scrolling large-text captions with speaker roles (Dr. Evans, Nurse Chloe, Sarah), **360° Spatial Acoustic Radar** widget, Neural Filter Frequency Spectrum visualizer, and haptic sound alerts (Door Knock, Siren 84dB). |
| **Bridge Comm** | `BridgeScreen` | Dual-channel chat bubbles (Dr. Patel & Sarah), ASL Visual Assist status banner with collapsible 3D avatar preview drawer, **Instant Vocalization Pills** (audibly vocalizes with `expo-speech`), Partner Mic capture with animated waveform, Counter Flip View (180° rotation for provider across desk), and Typed Voice with TTS. |
| **Safety Assist** | `SafetyScreen` | Large **3-Second Hold-to-Trigger Emergency SOS** button with circular SVG countdown ring, screen flash alert, haptic pulse feedback, live `expo-location` GPS coordinates (±1.4m accuracy), Immediate Categorical Distress pills (Medical, Fall, Disoriented, Silent), and Medical Dispatch Profile. |
| **Settings** | `ProfileScreen` | Sensory Mode profile selector (Vision Focus, Hearing & Deaf Assist, Combined Dual-Sensory, Cognitive), Display & Typography controls, Speech Rate selector (`0.85x` – `1.5x`), Emergency SOS countdown timer, and Haptic feedback intensity. |

---

## 🎨 Design System & Accessibility (WCAG 2.1 AA)

- **Palette:** Clinical Light background (`#F8FAFC`), crisp white cards (`#FFFFFF`), primary clinical teal (`#0D7A5F`), emergency SOS red (`#DC2626`), and slate text (`#0F172A`).
- **High-Contrast Mode:** Pure black (`#000000`), white (`#FFFFFF`), high-visibility teal (`#1ABC9C`).
- **Touch Targets:** Every interactive button and card satisfies the minimum `48x48dp` target size.
- **Accessibility Props:** Full `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, and `accessibilityState` attributes on all interactive elements.

---

## 📁 Project Structure

```
├── App.tsx                     # Main application entry with Navigation & Theme providers
├── index.ts                    # Expo root component registration
├── app.json                    # Expo SDK 52 configuration & hardware permissions
├── package.json                # Verified Expo Go compatible dependencies
├── src/
│   ├── components/
│   │   ├── PersistentHeader.tsx# Universal top bar with font scale, contrast & SOS
│   │   ├── SoundRadar.tsx      # 360° spatial acoustic radar with cardinal points & blips
│   │   └── WaveformBar.tsx     # Animated real-time acoustic waveform bars
│   ├── navigation/
│   │   └── RootNavigator.tsx   # 6-tab bottom navigation with accessible tabs
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Clinical dashboard & telemetry
│   │   ├── VisionScreen.tsx    # Live camera OCR, HUD, and Read Aloud
│   │   ├── HearingScreen.tsx   # Acoustic captions, radar & sound alert triggers
│   │   ├── BridgeScreen.tsx    # Dual-channel chat, ASL avatar, and quick vocalization
│   │   ├── SafetyScreen.tsx    # 3s hold-to-trigger SOS, GPS & dispatch profile
│   │   └── ProfileScreen.tsx   # Sensory calibration, speech speed & contrast
│   ├── services/
│   │   └── api.ts              # Cleanly typed FastAPI backend endpoints
│   ├── store/
│   │   ├── userStore.ts        # Global user profile, high contrast & font scale
│   │   ├── visionStore.ts      # Optical OCR state, scene memory & expo-speech
│   │   ├── hearingStore.ts     # Caption stream, acoustic radar & alert events
│   │   ├── bridgeStore.ts      # Two-way conversation, quick phrases & partner mic
│   │   └── safetyStore.ts      # Emergency SOS hold progress, GPS & CAD dispatch
│   └── theme/
│       ├── colors.ts           # Clinical Light & High-Contrast color themes
│       ├── typography.ts       # Font scaling system (sm, std, lg, xl)
│       └── ThemeContext.tsx    # React Context exposing dynamic colors & scaleFont
```
