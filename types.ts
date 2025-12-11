export enum AudioSourceType {
  OSCILLATOR = 'OSCILLATOR',
  MICROPHONE = 'MICROPHONE',
  SAMPLE = 'SAMPLE'
}

export interface AudioState {
  peakReduction: number; // 0-100
  gain: number; // 0-100
  threshold: number; // -60 to 0
  meterMode: 'GR' | 'OUTPUT';
  isPowered: boolean;
  sourceType: AudioSourceType;
}

export interface CompressionData {
  inputLevel: number;
  outputLevel: number;
  gainReduction: number; // Positive value representing dB reduction
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}