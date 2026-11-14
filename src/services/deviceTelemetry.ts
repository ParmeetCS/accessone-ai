import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { Camera } from 'expo-camera';

export interface DeviceTelemetryData {
  batteryLevel: number | null; // e.g. 85 or null if unavailable
  batteryState: string; // 'Charging', 'Unplugged', 'Full', 'Not Available'
  cameraPermission: 'Granted' | 'Denied' | 'Not Determined';
  micPermission: 'Granted' | 'Denied' | 'Not Determined';
  networkType: string; // 'Wi-Fi', 'Cellular', 'Offline', 'Not Available'
  isConnected: boolean;
  bluetoothStatus: string; // 'Not Available' (per prompt: never fabricate)
  neuralEngineStatus: string; // 'Not Available' (per prompt: never fabricate)
  lastSyncAt: string;
}

export const getDeviceTelemetry = async (): Promise<DeviceTelemetryData> => {
  let batteryLevel: number | null = null;
  let batteryState = 'Not Available';

  try {
    const isBatteryAvailable = await Battery.isAvailableAsync();
    if (isBatteryAvailable) {
      const rawLevel = await Battery.getBatteryLevelAsync();
      if (rawLevel !== -1) {
        batteryLevel = Math.round(rawLevel * 100);
      }

      const state = await Battery.getBatteryStateAsync();
      switch (state) {
        case Battery.BatteryState.CHARGING:
          batteryState = 'Charging';
          break;
        case Battery.BatteryState.UNPLUGGED:
          batteryState = 'Discharging';
          break;
        case Battery.BatteryState.FULL:
          batteryState = 'Full (100%)';
          break;
        default:
          batteryState = batteryLevel !== null ? 'Battery Active' : 'Not Available';
          break;
      }
    }
  } catch {
    batteryLevel = null;
    batteryState = 'Not Available';
  }

  // Camera & Mic Permissions
  let cameraPermission: 'Granted' | 'Denied' | 'Not Determined' = 'Not Determined';
  let micPermission: 'Granted' | 'Denied' | 'Not Determined' = 'Not Determined';

  try {
    const camPerm = await Camera.getCameraPermissionsAsync();
    cameraPermission = camPerm.granted ? 'Granted' : camPerm.canAskAgain ? 'Not Determined' : 'Denied';

    const micPerm = await Camera.getMicrophonePermissionsAsync();
    micPermission = micPerm.granted ? 'Granted' : micPerm.canAskAgain ? 'Not Determined' : 'Denied';
  } catch {
    cameraPermission = 'Not Determined';
    micPermission = 'Not Determined';
  }

  // Network State
  let networkType = 'Not Available';
  let isConnected = true;

  try {
    const net = await Network.getNetworkStateAsync();
    isConnected = !!net.isConnected && !!net.isInternetReachable;

    if (!net.isConnected) {
      networkType = 'Offline';
    } else {
      switch (net.type) {
        case Network.NetworkStateType.WIFI:
          networkType = 'Wi-Fi Active';
          break;
        case Network.NetworkStateType.CELLULAR:
          networkType = 'Cellular Active';
          break;
        case Network.NetworkStateType.ETHERNET:
          networkType = 'Ethernet Active';
          break;
        default:
          networkType = 'Online';
          break;
      }
    }
  } catch {
    networkType = 'Not Available';
  }

  return {
    batteryLevel,
    batteryState,
    cameraPermission,
    micPermission,
    networkType,
    isConnected,
    bluetoothStatus: 'Not Available', // Never fabricated without native BLE hardware paired
    neuralEngineStatus: 'Not Available', // Never fabricated
    lastSyncAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};
