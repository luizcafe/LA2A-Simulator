import React, { useState, useEffect } from 'react';
import { Knob } from './components/Knob';
import { VUMeter } from './components/VUMeter';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { ChatInterface } from './components/ChatInterface';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { AudioSourceType } from './types';
import { Power, Info, Settings2, Mic, Activity, Disc, CircleDot, Play } from 'lucide-react';

// Internal Logo Component to avoid broken images
const MixComLogo = () => (
  <div className="flex flex-col items-center justify-center group cursor-default mb-4">
    <div className="relative w-24 h-24 drop-shadow-xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Saucer */}
        <circle cx="100" cy="100" r="96" fill="#dedede" stroke="#aaa" strokeWidth="1" />
        <circle cx="100" cy="100" r="80" fill="#f5f5f5" />
        
        {/* Cup Shadow */}
        <ellipse cx="102" cy="102" rx="70" ry="70" fill="rgba(0,0,0,0.15)" />
        
        {/* Cup Handle */}
        <path d="M 160 85 C 185 85 185 115 160 115" stroke="#f0f0f0" strokeWidth="16" fill="none" strokeLinecap="round" />

        {/* Cup Body */}
        <circle cx="100" cy="100" r="70" fill="#f0f0f0" stroke="#ccc" strokeWidth="1" />
        
        {/* Coffee Liquid */}
        <circle cx="100" cy="100" r="62" fill="#cd853f" stroke="#a05a29" strokeWidth="2" />
        
        {/* Abstract Art in Coffee (Blue/Red/White strokes) */}
        <g opacity="0.9">
             {/* Left Red/Orange Stroke */}
             <path d="M 65 65 Q 55 100 65 135" stroke="#d35400" strokeWidth="12" fill="none" strokeLinecap="round" />
             {/* Middle Blue Stroke */}
             <path d="M 85 60 Q 75 100 85 140" stroke="#2980b9" strokeWidth="12" fill="none" strokeLinecap="round" />
             {/* Right White Shape */}
             <path d="M 115 75 Q 135 100 115 125" stroke="#fff" strokeWidth="14" fill="none" strokeLinecap="round" />
             <circle cx="125" cy="100" r="6" fill="#fff" />
        </g>
        
        {/* Reflection/Shine */}
        <path d="M 60 40 Q 100 20 140 40" stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none" />
      </svg>
    </div>
    <div className="mt-2 text-center">
      <h1 className="text-sm font-bold text-[#8a6a2e] tracking-[0.15em] font-serif uppercase drop-shadow-sm whitespace-nowrap">
        MIX<span className="text-[0.8em] align-top lowercase opacity-80">com</span> LUIZ CAFÉ
      </h1>
    </div>
  </div>
);

const App: React.FC = () => {
  const [peakReduction, setPeakReduction] = useState(30);
  const [gain, setGain] = useState(50);
  const [threshold, setThreshold] = useState(-30);
  const [meterMode, setMeterMode] = useState<'GR' | 'OUTPUT'>('GR');
  const [isPowered, setIsPowered] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [sourceType, setSourceType] = useState<AudioSourceType>(AudioSourceType.OSCILLATOR);

  const { 
    compressionData, 
    audioError, 
    startRecording, 
    isRecording, 
    recordingTime, 
    hasRecording 
  } = useAudioProcessor(
    peakReduction,
    gain,
    threshold,
    isPowered,
    isBypassed,
    sourceType
  );

  // Auto-switch to sample when recording finishes (optional UX improvement)
  useEffect(() => {
    if (hasRecording && !isRecording && sourceType !== AudioSourceType.SAMPLE) {
        setSourceType(AudioSourceType.SAMPLE);
    }
  }, [hasRecording, isRecording]);

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Main Rack Unit */}
      <div className="w-full max-w-6xl bg-gray-300 rounded-md shadow-2xl overflow-hidden border-t border-white/20 relative">
        
        {/* Faceplate Header / Screws */}
        <div className="h-4 flex justify-between px-4 py-2 opacity-50">
           <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-500 shadow-inner"></div>
           <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-500 shadow-inner"></div>
        </div>

        {/* Main Controls Area */}
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative bg-gradient-to-b from-gray-200 to-gray-300">
          
          {/* Left: Input / Power */}
          <div className="flex flex-col items-center gap-6 w-full md:w-1/4">
             <div className="bg-gray-800 p-4 rounded-lg shadow-inner w-full border border-gray-600">
                <h3 className="text-gray-400 text-xs font-bold mb-3 flex items-center gap-2">
                    <Settings2 size={14}/> SIGNAL SOURCE
                </h3>
                
                {/* Source Selection Buttons */}
                <div className="flex gap-2 mb-2">
                    <button 
                        onClick={() => setSourceType(AudioSourceType.OSCILLATOR)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded ${sourceType === AudioSourceType.OSCILLATOR ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                        disabled={isRecording}
                    >
                        OSC
                    </button>
                    <button 
                        onClick={() => setSourceType(AudioSourceType.MICROPHONE)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded flex justify-center items-center gap-1 ${sourceType === AudioSourceType.MICROPHONE ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                        disabled={isRecording}
                    >
                        <Mic size={10}/> MIC
                    </button>
                    <button 
                        onClick={() => setSourceType(AudioSourceType.SAMPLE)}
                        disabled={!hasRecording || isRecording}
                        className={`flex-1 py-2 text-[10px] font-bold rounded flex justify-center items-center gap-1 ${sourceType === AudioSourceType.SAMPLE ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 disabled:opacity-30'}`}
                    >
                        <Play size={10}/> SMP
                    </button>
                </div>

                {/* Record Button */}
                <button 
                    onClick={startRecording}
                    disabled={isRecording}
                    className={`w-full py-2 rounded flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                        isRecording 
                        ? 'bg-red-900 text-red-200 border border-red-500 animate-pulse' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {isRecording ? (
                        <>
                           <div className="w-2 h-2 rounded-full bg-red-500"></div>
                           RECORDING ({recordingTime}s)
                        </>
                    ) : (
                        <>
                           <CircleDot size={12} className="text-red-500" />
                           REC (10s)
                        </>
                    )}
                </button>

                {audioError && <p className="text-red-400 text-[10px] mt-2 leading-tight">{audioError}</p>}
             </div>

             <div className="flex flex-col items-center">
                <span className="text-gray-600 font-bold mb-2">GAIN</span>
                <Knob 
                    value={gain} 
                    min={0} 
                    max={100} 
                    label="Gain" 
                    onChange={setGain} 
                    color="#222" 
                />
             </div>
          </div>

          {/* Center: Meter & Branding */}
          <div className="flex flex-col items-center justify-center w-full md:w-2/4">
             {/* Logo Placed Inside Faceplate */}
             <MixComLogo />

             <div className="mb-4 text-center">
                 <h1 className="text-3xl font-black text-gray-800 tracking-tighter">TELETRONIX</h1>
                 <h2 className="text-sm font-bold text-gray-600 tracking-[0.2em]">LEVELING AMPLIFIER</h2>
             </div>
             
             <VUMeter 
                value={meterMode === 'GR' ? compressionData.gainReduction : compressionData.outputLevel} 
                mode={meterMode} 
             />
             
             <div className="flex gap-4 mt-6">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-500 mb-1">METER</span>
                    <div className="bg-gray-800 p-1 rounded flex">
                         <button 
                             onClick={() => setMeterMode('GR')}
                             className={`px-3 py-1 text-[10px] font-bold rounded ${meterMode === 'GR' ? 'bg-yellow-600 text-white' : 'text-gray-400'}`}
                         >GR</button>
                         <button 
                             onClick={() => setMeterMode('OUTPUT')}
                             className={`px-3 py-1 text-[10px] font-bold rounded ${meterMode === 'OUTPUT' ? 'bg-yellow-600 text-white' : 'text-gray-400'}`}
                         >+10</button>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-500 mb-1">POWER</span>
                    <button 
                        onClick={() => setIsPowered(!isPowered)}
                        className={`w-12 h-8 rounded border-2 flex items-center justify-center transition-all ${isPowered ? 'bg-red-600 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-800 border-gray-600'}`}
                    >
                        <Power size={16} className="text-white" />
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-500 mb-1">BYPASS</span>
                    <button 
                        onClick={() => setIsBypassed(!isBypassed)}
                        className={`w-12 h-8 rounded border-2 flex items-center justify-center transition-all ${isBypassed ? 'bg-red-600 border-red-800' : 'bg-gray-800 border-gray-600'}`}
                    >
                        {isBypassed ? <span className="text-[10px] font-bold text-white">BYP</span> : <span className="text-[10px] font-bold text-green-500">ON</span>}
                    </button>
                </div>
             </div>
          </div>

          {/* Right: Compression Control (Threshold & Peak Reduction) */}
          <div className="flex flex-col items-center justify-end w-full md:w-1/4 gap-6">
             <div className="flex flex-col items-center relative group">
                {/* Mod Indicator */}
                <div className="absolute -top-4 -right-4 text-[10px] font-mono text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    INT MOD
                </div>
                <span className="text-gray-500 font-bold mb-1 text-xs">THRESHOLD (MOD)</span>
                <Knob 
                    value={threshold} 
                    min={-60} 
                    max={0} 
                    label="dB" 
                    onChange={setThreshold} 
                    color="#444" 
                    size={80}
                />
             </div>
             <div className="flex flex-col items-center">
                 <span className="text-gray-600 font-bold mb-2">PEAK REDUCTION</span>
                 <Knob 
                    value={peakReduction} 
                    min={0} 
                    max={100} 
                    label="Peak Reduction" 
                    onChange={setPeakReduction} 
                    color="#222" 
                    size={140}
                 />
             </div>
          </div>
          
        </div>

        {/* Bottom Screws */}
        <div className="h-4 flex justify-between px-4 py-2 opacity-50 bg-gray-300">
           <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-500 shadow-inner"></div>
           <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-500 shadow-inner"></div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="w-full max-w-6xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Visualizer Panel */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 shadow-lg">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-teal-400 font-bold flex items-center gap-2">
                    <Activity size={18}/> VISUALIZADOR DE SINAL
                 </h3>
                 <span className="text-xs text-gray-500 uppercase">Análise em Tempo Real</span>
             </div>
             <WaveformVisualizer peakReduction={isBypassed ? 0 : peakReduction} threshold={threshold} isPowered={isPowered} />
             
             <div className="mt-4 p-4 bg-gray-800/50 rounded text-sm text-gray-300 leading-relaxed border-l-4 border-teal-500">
                <p>
                    <span className="font-bold text-white">Conceito: </span>
                    "O controle <span className="text-teal-400">Peak Reduction</span> ajusta quanto do sinal de entrada é necessário para cruzar o limiar."
                </p>
                <p className="mt-2 text-xs text-gray-400">
                    Use o knob <strong>Threshold Mod</strong> para mudar o nível do "teto". Um limiar mais baixo comprime sinais mais baixos. Um limiar alto comprime apenas os picos.
                </p>
             </div>
          </div>

          {/* AI Chat Panel */}
          <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-blue-400 font-bold flex items-center gap-2">
                    <Info size={18}/> NOTAS DO ENGENHEIRO
                 </h3>
              </div>
              <ChatInterface />
          </div>

      </div>
    </div>
  );
};

export default App;