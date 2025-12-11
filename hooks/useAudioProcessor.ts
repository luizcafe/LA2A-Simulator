import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioSourceType, CompressionData } from '../types';

export const useAudioProcessor = (
  peakReduction: number,
  gain: number,
  threshold: number,
  isPowered: boolean,
  isBypassed: boolean,
  sourceType: AudioSourceType
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const makeupGainNodeRef = useRef<GainNode | null>(null); 
  const wetGainRef = useRef<GainNode | null>(null); 
  const dryGainRef = useRef<GainNode | null>(null); 
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null); // Generalized ref
  const lfoRef = useRef<OscillatorNode | null>(null); 
  
  // Recording State
  const recordedBufferRef = useRef<AudioBuffer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [compressionData, setCompressionData] = useState<CompressionData>({ inputLevel: -60, outputLevel: -60, gainReduction: 0 });
  const [audioError, setAudioError] = useState<string | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    const initAudio = async () => {
      if (!audioContextRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new Ctx();
      }
    };
    initAudio();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Recording Functionality
  const startRecording = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const arrayBuffer = await blob.arrayBuffer();
        
        if (audioContextRef.current) {
           const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
           recordedBufferRef.current = decodedBuffer;
           setHasRecording(true);
        }
        
        setIsRecording(false);
        setRecordingTime(0);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(10); // Start countdown

      // Auto stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
      }, 10000);

      // Countdown timer logic
      const interval = setInterval(() => {
        setRecordingTime((prev) => {
            if (prev <= 1) {
                clearInterval(interval);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Recording Error:", err);
      setAudioError("Microphone access denied for recording.");
    }
  }, []);


  // Handle Source and Processing Chain Setup
  useEffect(() => {
    if (!audioContextRef.current || !isPowered) {
      // Cleanup
      if (sourceNodeRef.current) {
        try {
          if ('stop' in sourceNodeRef.current) (sourceNodeRef.current as any).stop();
        } catch(e) {}
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (lfoRef.current) {
        try { lfoRef.current.stop(); } catch(e) {}
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      return;
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // 1. Create Core Nodes (if not exists, but we recreate graph for simplicity in this demo)
    // Ideally we preserve nodes, but for the source switching logic, we rebuild the connections.
    // To avoid glitches, we should only rebuild if nodes don't exist, but we need to update params.
    // For this specific React pattern, we will recreate the graph to ensure clean switching.
    
    // Disconnect old
    if (compressorNodeRef.current) compressorNodeRef.current.disconnect();
    if (makeupGainNodeRef.current) makeupGainNodeRef.current.disconnect();
    if (wetGainRef.current) wetGainRef.current.disconnect();
    if (dryGainRef.current) dryGainRef.current.disconnect();
    
    const compressor = ctx.createDynamicsCompressor();
    const makeupGain = ctx.createGain(); 
    const analyser = ctx.createAnalyser(); // We can reuse analyser ref if we wanted, but creating new is safe here
    const wetGain = ctx.createGain(); 
    const dryGain = ctx.createGain(); 
    const inputGain = ctx.createGain(); 

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;

    // Store Refs
    compressorNodeRef.current = compressor;
    makeupGainNodeRef.current = makeupGain;
    analyserRef.current = analyser;
    wetGainRef.current = wetGain;
    dryGainRef.current = dryGain;

    // Configure Compressor
    compressor.threshold.value = threshold; 
    compressor.knee.value = 0; 
    compressor.ratio.value = 12; 
    compressor.attack.value = 0.005; 
    compressor.release.value = 0.25; 

    // Build Graph
    inputGain.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(wetGain);
    wetGain.connect(analyser);
    dryGain.connect(analyser);
    analyser.connect(ctx.destination);

    (compressorNodeRef.current as any).inputGainNode = inputGain;

    // 5. Create and Connect Source
    const setupSource = async () => {
      try {
        // Stop previous source
        if (sourceNodeRef.current) {
            try{ (sourceNodeRef.current as any).stop?.(); } catch(e){}
            sourceNodeRef.current.disconnect();
        }
        if (lfoRef.current) {
            try { lfoRef.current.stop(); } catch(e) {}
            lfoRef.current.disconnect();
        }

        let sourceNode: AudioNode | null = null;

        if (sourceType === AudioSourceType.MICROPHONE) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          sourceNode = ctx.createMediaStreamSource(stream);
        } else if (sourceType === AudioSourceType.SAMPLE) {
            if (recordedBufferRef.current) {
                const bufferSource = ctx.createBufferSource();
                bufferSource.buffer = recordedBufferRef.current;
                bufferSource.loop = true;
                bufferSource.start();
                sourceNode = bufferSource;
                sourceNodeRef.current = bufferSource; // Store specifically to stop it later
            } else {
                // Fallback if no sample
                setAudioError("No recording found.");
            }
        } else {
          // OSCILLATOR
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, ctx.currentTime);
          
          const oscVCA = ctx.createGain();
          oscVCA.gain.value = 0.6; 

          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 2; 
          
          const lfoDepth = ctx.createGain();
          lfoDepth.gain.value = 0.3; 
          
          lfo.connect(lfoDepth);
          lfoDepth.connect(oscVCA.gain);
          osc.connect(oscVCA);

          lfo.start();
          osc.start();
          
          lfoRef.current = lfo;
          sourceNode = oscVCA;
          sourceNodeRef.current = osc;
        }

        if (sourceNode) {
            if (sourceType === AudioSourceType.MICROPHONE) {
               sourceNodeRef.current = sourceNode;
            }
            sourceNode.connect(inputGain); // To Wet path
            sourceNode.connect(dryGain);   // To Dry path
        }

        
      } catch (err) {
        console.error("Audio Setup Error:", err);
        setAudioError("Could not access microphone or audio device.");
      }
    };

    setupSource();

  }, [isPowered, sourceType]); 

  // Update Parameters
  useEffect(() => {
    if (!compressorNodeRef.current || !makeupGainNodeRef.current || !isPowered) return;
    const ctx = audioContextRef.current;
    if(!ctx) return;

    compressorNodeRef.current.threshold.setTargetAtTime(threshold, ctx.currentTime, 0.1);

    const inputGainNode = (compressorNodeRef.current as any).inputGainNode as GainNode;
    if (inputGainNode) {
       const val = Math.max(0, (peakReduction / 10)); 
       inputGainNode.gain.setTargetAtTime(val, ctx.currentTime, 0.1);
    }

    const gainVal = gain / 40;
    makeupGainNodeRef.current.gain.setTargetAtTime(gainVal, ctx.currentTime, 0.1);

    if (wetGainRef.current && dryGainRef.current) {
        const now = ctx.currentTime;
        wetGainRef.current.gain.setTargetAtTime(isBypassed ? 0 : 1, now, 0.05);
        dryGainRef.current.gain.setTargetAtTime(isBypassed ? 1 : 0, now, 0.05);
    }

  }, [peakReduction, gain, threshold, isPowered, isBypassed]);

  // Analysis Loop
  useEffect(() => {
    if (!isPowered) return;
    
    let rafId: number;
    const updateMeters = () => {
      if (analyserRef.current && compressorNodeRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const x = (dataArray[i] - 128) / 128.0;
          sum += x * x;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const db = 20 * Math.log10(rms + 0.0001); 

        let reduction = 0;
        if (!isBypassed) {
            reduction = compressorNodeRef.current.reduction;
        }
        
        setCompressionData({
            inputLevel: db, 
            outputLevel: db,
            gainReduction: reduction
        });
      }
      rafId = requestAnimationFrame(updateMeters);
    };
    updateMeters();
    return () => cancelAnimationFrame(rafId);
  }, [isPowered, isBypassed]);

  return { 
      compressionData, 
      audioError, 
      startRecording, 
      isRecording, 
      recordingTime, 
      hasRecording 
  };
};