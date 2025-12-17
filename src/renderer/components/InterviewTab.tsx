// Interview Tab Component - Functional Recording Studio with Audio Editing
// EVIDENRA Ultimate Exclusive Feature - Camtasia-style Audio Editor

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconMicrophone as Mic,
  IconMicrophoneOff as MicOff,
  IconPlayerStop as Square,
  IconPlayerPause as Pause,
  IconPlayerPlay as Play,
  IconDownload as Download,
  IconTrash as Trash,
  IconFileText as FileText,
  IconCheck as Check,
  IconX as X,
  IconLoader as Loader,
  IconClock as Clock,
  IconVolume2 as Volume2,
  IconSettings as Settings,
  IconHeadphones as Headphones,
  IconBrandOpenai as OpenAI,
  IconDeviceFloppy as Save,
  IconCut as Cut,
  IconScissors as Scissors,
  IconArrowsLeftRight as ArrowsLeftRight,
  IconZoomIn as ZoomIn,
  IconZoomOut as ZoomOut,
  IconPlayerSkipBack as SkipBack,
  IconPlayerSkipForward as SkipForward,
  IconCopy as Copy,
  IconRestore as Undo,
  IconArrowBack as ArrowBack,
  IconFileDownload as FileDownload
} from '@tabler/icons-react';

interface InterviewTabProps {
  language: 'de' | 'en';
  apiKey?: string;
  onAddDocument?: (doc: any) => void;
}

interface Recording {
  id: string;
  title: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  recordedAt: Date;
  transcription?: string;
  isTranscribed: boolean;
  waveformData?: number[]; // For waveform visualization in editor
}

// Cut Region for multi-segment cutting
interface CutRegion {
  id: string;
  start: number; // 0-1 percentage
  end: number;   // 0-1 percentage
}

// Audio Editor State Interface
interface EditorState {
  isOpen: boolean;
  recordingId: string | null;
  audioBuffer: AudioBuffer | null;
  waveformData: number[];
  trimStart: number; // 0-1 percentage
  trimEnd: number;   // 0-1 percentage
  playheadPosition: number; // 0-1 percentage
  isPlaying: boolean;
  zoom: number; // 1-10
  selection: { start: number; end: number } | null;
  history: { trimStart: number; trimEnd: number; cutRegions: CutRegion[] }[];
  cutRegions: CutRegion[]; // Regions to be cut out (removed)
  isSelectingCut: boolean; // Currently selecting a cut region
  cutSelectionStart: number | null; // Start of cut selection
}

export const InterviewTab: React.FC<InterviewTabProps> = ({ language, apiKey, onAddDocument }) => {
  // Device State
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');

  // Audio Analysis State
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(50).fill(0));

  // Playback State
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Transcription State
  const [transcribing, setTranscribing] = useState<string | null>(null);

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Audio Editor State
  const [editor, setEditor] = useState<EditorState>({
    isOpen: false,
    recordingId: null,
    audioBuffer: null,
    waveformData: [],
    trimStart: 0,
    trimEnd: 1,
    playheadPosition: 0,
    isPlaying: false,
    zoom: 1,
    selection: null,
    history: [],
    cutRegions: [],
    isSelectingCut: false,
    cutSelectionStart: null
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRecordingRef = useRef(false); // Track recording state for animation loop

  // Editor Refs
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorAudioContextRef = useRef<AudioContext | null>(null);
  const editorSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const editorPlaybackRef = useRef<number | null>(null);
  const isDraggingRef = useRef<'start' | 'end' | 'playhead' | null>(null);

  // Load audio devices on mount
  useEffect(() => {
    loadAudioDevices();
    loadRecordingsFromStorage();

    return () => {
      cleanup();
    };
  }, []);

  const loadAudioDevices = async () => {
    try {
      // Request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        stream.getTracks().forEach(track => track.stop());
      });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      setAudioDevices(audioInputs);

      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error loading audio devices:', err);
      setError(language === 'de'
        ? 'Mikrofon-Zugriff verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.'
        : 'Microphone access denied. Please allow access in browser settings.');
    }
  };

  const loadRecordingsFromStorage = () => {
    try {
      const stored = localStorage.getItem('evidenra-interview-recordings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Recreate blob URLs for stored recordings
        const restored = parsed.map((r: any) => ({
          ...r,
          recordedAt: new Date(r.recordedAt),
          audioBlob: null, // Can't restore blob from localStorage
          audioUrl: '' // Will need to re-record
        }));
        setRecordings(restored.filter((r: Recording) => r.transcription)); // Only keep transcribed ones
      }
    } catch (err) {
      console.error('Error loading recordings:', err);
    }
  };

  const saveRecordingsToStorage = (recs: Recording[]) => {
    try {
      const toStore = recs.map(r => ({
        id: r.id,
        title: r.title,
        duration: r.duration,
        recordedAt: r.recordedAt.toISOString(),
        transcription: r.transcription,
        isTranscribed: r.isTranscribed
      }));
      localStorage.setItem('evidenra-interview-recordings', JSON.stringify(toStore));
    } catch (err) {
      console.error('Error saving recordings:', err);
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    // Only close if not already closed
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startWaveformAnimation = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateWaveform = () => {
      // Use ref instead of state for accurate tracking in animation loop
      if (!analyserRef.current || !isRecordingRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate volume level - using RMS for better accuracy
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      // Scale RMS to 0-100% (RMS typically 0-0.5 for normal speech)
      const level = Math.min(100, rms * 200);
      setVolumeLevel(level);

      // Update waveform display (sample 50 points)
      const samples = 50;
      const step = Math.floor(dataArray.length / samples);
      const newWaveform = [];
      for (let i = 0; i < samples; i++) {
        const val = dataArray[i * step];
        newWaveform.push((val - 128) / 128);
      }
      setWaveformData(newWaveform);

      animationRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  };

  const startRecording = async () => {
    setError(null);
    setSuccess(null);
    chunksRef.current = [];

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Setup audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start(100); // Get data every 100ms for smooth visualization
      setIsRecording(true);
      isRecordingRef.current = true; // Update ref for animation loop
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start waveform animation
      startWaveformAnimation();

      setSuccess(language === 'de' ? 'Aufnahme gestartet!' : 'Recording started!');
      setTimeout(() => setSuccess(null), 2000);

    } catch (err: any) {
      console.error('Recording error:', err);
      setError(language === 'de'
        ? `Mikrofon-Fehler: ${err.message}`
        : `Microphone error: ${err.message}`);
    }
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      isRecordingRef.current = true; // Resume animation
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      startWaveformAnimation();
    } else {
      mediaRecorderRef.current.pause();
      isRecordingRef.current = false; // Stop animation
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    setIsPaused(!isPaused);
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        // Create audio blob
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create recording object
        const title = currentTitle.trim() ||
          `Interview ${new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')} ${new Date().toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;

        const newRecording: Recording = {
          id: `rec-${Date.now()}`,
          title,
          audioBlob,
          audioUrl,
          duration: recordingTime,
          recordedAt: new Date(),
          isTranscribed: false
        };

        const updatedRecordings = [newRecording, ...recordings];
        setRecordings(updatedRecordings);
        saveRecordingsToStorage(updatedRecordings);

        // Stop animation first
        isRecordingRef.current = false;

        // Cleanup
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }

        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        setCurrentTitle('');
        setVolumeLevel(0);
        setWaveformData(new Array(50).fill(0));

        setSuccess(language === 'de' ? 'Aufnahme gespeichert!' : 'Recording saved!');
        setTimeout(() => setSuccess(null), 3000);

        resolve();
      };

      mediaRecorderRef.current.stop();
    });
  };

  const cancelRecording = () => {
    isRecordingRef.current = false; // Stop animation first

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    cleanup();
    chunksRef.current = [];

    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setCurrentTitle('');
    setVolumeLevel(0);
    setWaveformData(new Array(50).fill(0));
  };

  const playRecording = (recording: Recording) => {
    if (!recording.audioUrl || !audioRef.current) return;

    if (playingId === recording.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = recording.audioUrl;
      audioRef.current.play();
      setPlayingId(recording.id);
    }
  };

  const downloadRecording = (recording: Recording) => {
    if (!recording.audioUrl) return;

    const a = document.createElement('a');
    a.href = recording.audioUrl;
    a.download = `${recording.title.replace(/[^a-zA-Z0-9]/g, '_')}.webm`;
    a.click();
  };

  const transcribeRecording = async (recording: Recording) => {
    if (!apiKey) {
      setError(language === 'de'
        ? 'OpenAI API-Key erforderlich für Transkription (99+ Sprachen). Key hier erstellen: platform.openai.com/api-keys'
        : 'OpenAI API key required for transcription (99+ languages). Create key at: platform.openai.com/api-keys');
      return;
    }

    if (!recording.audioBlob) {
      setError(language === 'de'
        ? 'Audio-Daten nicht verfügbar. Bitte erneut aufnehmen.'
        : 'Audio data not available. Please re-record.');
      return;
    }

    setTranscribing(recording.id);

    try {
      const formData = new FormData();
      formData.append('file', recording.audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', language);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      const updatedRecordings = recordings.map(r =>
        r.id === recording.id
          ? { ...r, transcription: result.text, isTranscribed: true }
          : r
      );
      setRecordings(updatedRecordings);
      saveRecordingsToStorage(updatedRecordings);

      setSuccess(language === 'de' ? 'Transkription abgeschlossen!' : 'Transcription complete!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      setError(language === 'de'
        ? `Transkription fehlgeschlagen: ${err.message}`
        : `Transcription failed: ${err.message}`);
    } finally {
      setTranscribing(null);
    }
  };

  const addToDocuments = (recording: Recording) => {
    if (!recording.transcription || !onAddDocument) return;

    const doc = {
      id: `doc-interview-${recording.id}`,
      name: recording.title,
      content: recording.transcription,
      type: 'interview',
      createdAt: recording.recordedAt
    };

    onAddDocument(doc);
    setSuccess(language === 'de' ? 'Zu Dokumenten hinzugefügt!' : 'Added to documents!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Download transcript as text file
  const downloadTranscript = (recording: Recording) => {
    if (!recording.transcription) return;

    const content = `# ${recording.title}\n\n` +
      `Datum: ${recording.recordedAt.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}\n` +
      `Dauer: ${formatTime(recording.duration)}\n\n` +
      `---\n\n` +
      recording.transcription;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '_')}_Transkript.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setSuccess(language === 'de' ? 'Transkript heruntergeladen!' : 'Transcript downloaded!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const deleteRecording = (id: string) => {
    if (window.confirm(language === 'de' ? 'Aufnahme wirklich löschen?' : 'Really delete recording?')) {
      const recording = recordings.find(r => r.id === id);
      if (recording?.audioUrl) {
        URL.revokeObjectURL(recording.audioUrl);
      }
      const updatedRecordings = recordings.filter(r => r.id !== id);
      setRecordings(updatedRecordings);
      saveRecordingsToStorage(updatedRecordings);
    }
  };

  // ============================================================
  // AUDIO EDITOR FUNCTIONS - Camtasia-style Timeline Editor
  // ============================================================

  // Open editor for a recording
  const openEditor = async (recording: Recording) => {
    if (!recording.audioBlob) {
      setError(language === 'de'
        ? 'Audio-Daten nicht verfügbar für Bearbeitung'
        : 'Audio data not available for editing');
      return;
    }

    try {
      // Create AudioContext and decode audio
      const audioContext = new AudioContext();
      editorAudioContextRef.current = audioContext;

      const arrayBuffer = await recording.audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Generate waveform data for visualization
      const waveformData = generateWaveformData(audioBuffer, 500);

      setEditor({
        isOpen: true,
        recordingId: recording.id,
        audioBuffer,
        waveformData,
        trimStart: 0,
        trimEnd: 1,
        playheadPosition: 0,
        isPlaying: false,
        zoom: 1,
        selection: null,
        history: [],
        cutRegions: [],
        isSelectingCut: false,
        cutSelectionStart: null
      });

      // Draw waveform after state update
      setTimeout(() => drawWaveform(), 50);

    } catch (err: any) {
      console.error('Error opening editor:', err);
      setError(language === 'de'
        ? `Editor-Fehler: ${err.message}`
        : `Editor error: ${err.message}`);
    }
  };

  // Generate waveform data from audio buffer
  const generateWaveformData = (audioBuffer: AudioBuffer, samples: number): number[] => {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j]);
      }
      waveform.push(sum / blockSize);
    }

    // Normalize to 0-1 range
    const max = Math.max(...waveform);
    return waveform.map(v => v / (max || 1));
  };

  // Draw waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = editorCanvasRef.current;
    if (!canvas || editor.waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const { waveformData, trimStart, trimEnd, playheadPosition, zoom, selection, cutRegions, isSelectingCut, cutSelectionStart } = editor;

    // Helper: Check if position is in a cut region
    const isInCutRegion = (pos: number): boolean => {
      return cutRegions.some(region => pos >= region.start && pos <= region.end);
    };

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Calculate visible range based on zoom
    const visibleStart = Math.max(0, playheadPosition - 0.5 / zoom);
    const visibleEnd = Math.min(1, playheadPosition + 0.5 / zoom);
    const visibleRange = visibleEnd - visibleStart;

    // Draw trimmed-out regions (darker) - Start/End trim
    if (trimStart > visibleStart) {
      const trimStartX = ((trimStart - visibleStart) / visibleRange) * width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, trimStartX, height);
    }
    if (trimEnd < visibleEnd) {
      const trimEndX = ((trimEnd - visibleStart) / visibleRange) * width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(trimEndX, 0, width - trimEndX, height);
    }

    // Draw CUT REGIONS (red striped areas that will be removed)
    cutRegions.forEach(region => {
      if (region.end >= visibleStart && region.start <= visibleEnd) {
        const regionStartX = Math.max(0, ((region.start - visibleStart) / visibleRange) * width);
        const regionEndX = Math.min(width, ((region.end - visibleStart) / visibleRange) * width);

        // Red overlay for cut region
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(regionStartX, 0, regionEndX - regionStartX, height);

        // Striped pattern
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;
        for (let sx = regionStartX; sx < regionEndX; sx += 10) {
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx + 10, height);
          ctx.stroke();
        }
      }
    });

    // Draw current cut selection (while selecting) - MORE PROMINENT
    if (isSelectingCut && cutSelectionStart !== null) {
      const currentPos = playheadPosition;
      const selStart = Math.min(cutSelectionStart, currentPos);
      const selEnd = Math.max(cutSelectionStart, currentPos);
      const selStartX = ((selStart - visibleStart) / visibleRange) * width;
      const selEndX = ((selEnd - visibleStart) / visibleRange) * width;

      // Fill with animated pattern
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(selStartX, 0, selEndX - selStartX, height);

      // Dashed border around selection
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(selStartX, 2, selEndX - selStartX, height - 4);
      ctx.setLineDash([]);

      // Selection handles at start and end
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(selStartX - 3, 0, 6, height);
      ctx.fillRect(selEndX - 3, 0, 6, height);

      // Label showing duration
      const rec = recordings.find(r => r.id === editor.recordingId);
      if (rec) {
        const selDuration = ((selEnd - selStart) * rec.duration).toFixed(1);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px sans-serif';
        const labelText = `${selDuration}s`;
        const textWidth = ctx.measureText(labelText).width;
        const labelX = (selStartX + selEndX) / 2 - textWidth / 2;
        ctx.fillRect(labelX - 6, height / 2 - 12, textWidth + 12, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, labelX, height / 2 + 4);
      }
    }

    // Draw selection region (blue, for general selection)
    if (selection) {
      const selStartX = ((selection.start - visibleStart) / visibleRange) * width;
      const selEndX = ((selection.end - visibleStart) / visibleRange) * width;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(selStartX, 0, selEndX - selStartX, height);
    }

    // Draw waveform
    const barWidth = (width / (waveformData.length * visibleRange)) * zoom;
    const startIndex = Math.floor(visibleStart * waveformData.length);
    const endIndex = Math.ceil(visibleEnd * waveformData.length);

    for (let i = startIndex; i < endIndex && i < waveformData.length; i++) {
      const x = ((i / waveformData.length - visibleStart) / visibleRange) * width;
      const barHeight = waveformData[i] * height * 0.8;
      const y = (height - barHeight) / 2;

      // Color based on position
      const pos = i / waveformData.length;
      if (pos < trimStart || pos > trimEnd) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      } else if (isInCutRegion(pos)) {
        // Red for cut regions
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      } else {
        // Gradient from emerald to cyan
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#34d399');
        gradient.addColorStop(1, '#06b6d4');
        ctx.fillStyle = gradient;
      }

      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    }

    // Draw trim handles
    const trimStartX = ((trimStart - visibleStart) / visibleRange) * width;
    const trimEndX = ((trimEnd - visibleStart) / visibleRange) * width;

    // Start handle
    if (trimStartX >= 0 && trimStartX <= width) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(trimStartX - 4, 0, 8, height);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(trimStartX, 10);
      ctx.lineTo(trimStartX + 6, 20);
      ctx.lineTo(trimStartX, 30);
      ctx.fill();
    }

    // End handle
    if (trimEndX >= 0 && trimEndX <= width) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(trimEndX - 4, 0, 8, height);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(trimEndX, 10);
      ctx.lineTo(trimEndX - 6, 20);
      ctx.lineTo(trimEndX, 30);
      ctx.fill();
    }

    // Draw playhead
    const playheadX = ((playheadPosition - visibleStart) / visibleRange) * width;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead triangle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 8, 0);
      ctx.lineTo(playheadX + 8, 0);
      ctx.lineTo(playheadX, 12);
      ctx.fill();
    }

    // Draw time markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    const recording = recordings.find(r => r.id === editor.recordingId);
    if (recording) {
      for (let i = 0; i <= 10; i++) {
        const pos = visibleStart + (i / 10) * visibleRange;
        const time = pos * recording.duration;
        const x = (i / 10) * width;
        ctx.fillText(formatTimeDetailed(time), x + 2, height - 4);
      }
    }
  }, [editor, recordings]);

  // Format time with milliseconds
  const formatTimeDetailed = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // Update waveform when editor state changes
  useEffect(() => {
    if (editor.isOpen) {
      drawWaveform();
    }
  }, [editor, drawWaveform]);

  // Keyboard shortcuts for editor
  useEffect(() => {
    if (!editor.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Play/Pause
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (editor.isPlaying) {
          stopEditorAudio();
        } else {
          playEditorAudio();
        }
      }

      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoTrim();
      }

      // Escape: Cancel cut selection or close editor
      if (e.key === 'Escape') {
        if (editor.isSelectingCut) {
          cancelCutSelection();
        } else {
          closeEditor();
        }
      }

      // Arrow keys for fine-tuning playhead
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipBackward();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipForward();
      }

      // Delete/Backspace: Remove last cut region
      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.cutRegions.length > 0 && !e.ctrlKey) {
        const lastRegion = editor.cutRegions[editor.cutRegions.length - 1];
        removeCutRegion(lastRegion.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor.isOpen, editor.isPlaying, editor.isSelectingCut, editor.cutRegions]);

  // Ref to track cut selection dragging
  const isCutDraggingRef = useRef(false);
  const cutDragStartRef = useRef<number | null>(null);

  // Handle canvas mouse events for trim handles AND cut selection
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;

    // Calculate visible range
    const visibleStart = Math.max(0, editor.playheadPosition - 0.5 / editor.zoom);
    const visibleEnd = Math.min(1, editor.playheadPosition + 0.5 / editor.zoom);
    const visibleRange = visibleEnd - visibleStart;

    const clickPos = visibleStart + x * visibleRange;

    // Check if clicking on trim handles (within 2% tolerance)
    const tolerance = 0.02 / editor.zoom;

    if (Math.abs(clickPos - editor.trimStart) < tolerance) {
      isDraggingRef.current = 'start';
    } else if (Math.abs(clickPos - editor.trimEnd) < tolerance) {
      isDraggingRef.current = 'end';
    } else if (editor.isSelectingCut || e.shiftKey) {
      // CUT MODE: Start selecting a cut region with Shift+Drag or when in cut mode
      isCutDraggingRef.current = true;
      cutDragStartRef.current = clickPos;
      setEditor(prev => ({
        ...prev,
        isSelectingCut: true,
        cutSelectionStart: clickPos,
        playheadPosition: clickPos
      }));
    } else {
      // Move playhead
      isDraggingRef.current = 'playhead';
      setEditor(prev => ({ ...prev, playheadPosition: Math.max(0, Math.min(1, clickPos)) }));
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;

    const visibleStart = Math.max(0, editor.playheadPosition - 0.5 / editor.zoom);
    const visibleEnd = Math.min(1, editor.playheadPosition + 0.5 / editor.zoom);
    const visibleRange = visibleEnd - visibleStart;

    const newPos = Math.max(0, Math.min(1, visibleStart + x * visibleRange));

    // Handle cut region dragging
    if (isCutDraggingRef.current && cutDragStartRef.current !== null) {
      setEditor(prev => ({
        ...prev,
        playheadPosition: newPos
      }));
      return;
    }

    if (!isDraggingRef.current) return;

    if (isDraggingRef.current === 'start') {
      setEditor(prev => ({ ...prev, trimStart: Math.min(newPos, prev.trimEnd - 0.01) }));
    } else if (isDraggingRef.current === 'end') {
      setEditor(prev => ({ ...prev, trimEnd: Math.max(newPos, prev.trimStart + 0.01) }));
    } else if (isDraggingRef.current === 'playhead') {
      setEditor(prev => ({ ...prev, playheadPosition: newPos }));
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;

    // Handle cut region selection completion
    if (isCutDraggingRef.current && cutDragStartRef.current !== null && canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;

      const visibleStart = Math.max(0, editor.playheadPosition - 0.5 / editor.zoom);
      const visibleEnd = Math.min(1, editor.playheadPosition + 0.5 / editor.zoom);
      const visibleRange = visibleEnd - visibleStart;

      const endPos = Math.max(0, Math.min(1, visibleStart + x * visibleRange));
      const startPos = cutDragStartRef.current;

      const regionStart = Math.min(startPos, endPos);
      const regionEnd = Math.max(startPos, endPos);

      // Only create region if it's large enough (at least 1% of recording)
      if (regionEnd - regionStart >= 0.01) {
        const newRegion: CutRegion = {
          id: `cut-${Date.now()}`,
          start: regionStart,
          end: regionEnd
        };

        setEditor(prev => ({
          ...prev,
          history: [...prev.history, { trimStart: prev.trimStart, trimEnd: prev.trimEnd, cutRegions: [...prev.cutRegions] }],
          cutRegions: [...prev.cutRegions, newRegion],
          isSelectingCut: false,
          cutSelectionStart: null
        }));
      } else {
        // Too small, just cancel
        setEditor(prev => ({
          ...prev,
          isSelectingCut: false,
          cutSelectionStart: null
        }));
      }

      isCutDraggingRef.current = false;
      cutDragStartRef.current = null;
      return;
    }

    if (isDraggingRef.current === 'start' || isDraggingRef.current === 'end') {
      // Save to history when trim handle is released
      setEditor(prev => ({
        ...prev,
        history: [...prev.history, { trimStart: prev.trimStart, trimEnd: prev.trimEnd, cutRegions: prev.cutRegions }]
      }));
    }
    isDraggingRef.current = null;
  };

  // Editor playback
  const playEditorAudio = () => {
    if (!editor.audioBuffer || !editorAudioContextRef.current) return;

    // Stop any existing playback
    stopEditorAudio();

    const audioContext = editorAudioContextRef.current;
    const source = audioContext.createBufferSource();
    source.buffer = editor.audioBuffer;
    source.connect(audioContext.destination);
    editorSourceRef.current = source;

    const startTime = editor.playheadPosition * editor.audioBuffer.duration;
    const endTime = editor.trimEnd * editor.audioBuffer.duration;
    const duration = endTime - startTime;

    source.start(0, startTime, duration);
    setEditor(prev => ({ ...prev, isPlaying: true }));

    // Update playhead position during playback
    const startPos = editor.playheadPosition;
    const startRealTime = audioContext.currentTime;

    const updatePlayhead = () => {
      if (!editorSourceRef.current || !editorAudioContextRef.current) return;

      const elapsed = editorAudioContextRef.current.currentTime - startRealTime;
      const newPos = startPos + elapsed / editor.audioBuffer!.duration;

      if (newPos >= editor.trimEnd) {
        stopEditorAudio();
        return;
      }

      setEditor(prev => ({ ...prev, playheadPosition: Math.min(newPos, prev.trimEnd) }));
      editorPlaybackRef.current = requestAnimationFrame(updatePlayhead);
    };

    editorPlaybackRef.current = requestAnimationFrame(updatePlayhead);

    source.onended = () => {
      stopEditorAudio();
    };
  };

  const stopEditorAudio = () => {
    if (editorSourceRef.current) {
      try {
        editorSourceRef.current.stop();
      } catch (e) {}
      editorSourceRef.current = null;
    }
    if (editorPlaybackRef.current) {
      cancelAnimationFrame(editorPlaybackRef.current);
      editorPlaybackRef.current = null;
    }
    setEditor(prev => ({ ...prev, isPlaying: false }));
  };

  // Zoom controls
  const zoomIn = () => {
    setEditor(prev => ({ ...prev, zoom: Math.min(10, prev.zoom + 0.5) }));
  };

  const zoomOut = () => {
    setEditor(prev => ({ ...prev, zoom: Math.max(1, prev.zoom - 0.5) }));
  };

  // Undo trim
  const undoTrim = () => {
    if (editor.history.length === 0) return;

    const lastState = editor.history[editor.history.length - 1];
    setEditor(prev => ({
      ...prev,
      trimStart: lastState.trimStart,
      trimEnd: lastState.trimEnd,
      cutRegions: lastState.cutRegions,
      history: prev.history.slice(0, -1)
    }));
  };

  // ============================================================
  // CUT REGION FUNCTIONS - Cut anywhere in the recording
  // ============================================================

  // Start selecting a cut region
  const startCutSelection = () => {
    setEditor(prev => ({
      ...prev,
      isSelectingCut: true,
      cutSelectionStart: prev.playheadPosition
    }));
  };

  // Finish cut selection and add region
  const finishCutSelection = () => {
    if (!editor.isSelectingCut || editor.cutSelectionStart === null) return;

    const start = Math.min(editor.cutSelectionStart, editor.playheadPosition);
    const end = Math.max(editor.cutSelectionStart, editor.playheadPosition);

    // Don't create tiny regions
    if (end - start < 0.01) {
      setEditor(prev => ({
        ...prev,
        isSelectingCut: false,
        cutSelectionStart: null
      }));
      return;
    }

    const newRegion: CutRegion = {
      id: `cut-${Date.now()}`,
      start,
      end
    };

    // Save to history before adding
    setEditor(prev => ({
      ...prev,
      history: [...prev.history, { trimStart: prev.trimStart, trimEnd: prev.trimEnd, cutRegions: [...prev.cutRegions] }],
      cutRegions: [...prev.cutRegions, newRegion],
      isSelectingCut: false,
      cutSelectionStart: null
    }));
  };

  // Cancel cut selection
  const cancelCutSelection = () => {
    setEditor(prev => ({
      ...prev,
      isSelectingCut: false,
      cutSelectionStart: null
    }));
  };

  // Remove a cut region
  const removeCutRegion = (regionId: string) => {
    setEditor(prev => ({
      ...prev,
      history: [...prev.history, { trimStart: prev.trimStart, trimEnd: prev.trimEnd, cutRegions: [...prev.cutRegions] }],
      cutRegions: prev.cutRegions.filter(r => r.id !== regionId)
    }));
  };

  // Clear all cut regions
  const clearAllCutRegions = () => {
    if (editor.cutRegions.length === 0) return;
    setEditor(prev => ({
      ...prev,
      history: [...prev.history, { trimStart: prev.trimStart, trimEnd: prev.trimEnd, cutRegions: [...prev.cutRegions] }],
      cutRegions: []
    }));
  };

  // Apply trim and save (including cut regions)
  const applyTrim = async () => {
    if (!editor.audioBuffer || !editor.recordingId) return;

    const recording = recordings.find(r => r.id === editor.recordingId);
    if (!recording) return;

    try {
      const audioContext = new AudioContext();
      const { audioBuffer, trimStart, trimEnd, cutRegions } = editor;

      // Sort cut regions by start position
      const sortedCutRegions = [...cutRegions].sort((a, b) => a.start - b.start);

      // Build list of segments to KEEP (inverse of cut regions)
      type Segment = { start: number; end: number };
      const keepSegments: Segment[] = [];
      let currentStart = trimStart;

      for (const region of sortedCutRegions) {
        // Only consider cut regions within trim bounds
        const cutStart = Math.max(region.start, trimStart);
        const cutEnd = Math.min(region.end, trimEnd);

        if (cutStart < cutEnd && cutStart > currentStart) {
          keepSegments.push({ start: currentStart, end: cutStart });
        }
        currentStart = Math.max(currentStart, cutEnd);
      }

      // Add final segment after last cut
      if (currentStart < trimEnd) {
        keepSegments.push({ start: currentStart, end: trimEnd });
      }

      // If no cut regions, just do simple trim
      if (keepSegments.length === 0) {
        keepSegments.push({ start: trimStart, end: trimEnd });
      }

      // Calculate total samples needed
      let totalSamples = 0;
      for (const seg of keepSegments) {
        const startSample = Math.floor(seg.start * audioBuffer.length);
        const endSample = Math.floor(seg.end * audioBuffer.length);
        totalSamples += endSample - startSample;
      }

      // Create output buffer
      const outputBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        totalSamples,
        audioBuffer.sampleRate
      );

      // Copy segments to output
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel);
        const destData = outputBuffer.getChannelData(channel);
        let destOffset = 0;

        for (const seg of keepSegments) {
          const startSample = Math.floor(seg.start * audioBuffer.length);
          const endSample = Math.floor(seg.end * audioBuffer.length);
          const segLength = endSample - startSample;

          for (let i = 0; i < segLength; i++) {
            destData[destOffset + i] = sourceData[startSample + i];
          }
          destOffset += segLength;
        }
      }

      // Convert to blob
      const offlineContext = new OfflineAudioContext(
        outputBuffer.numberOfChannels,
        outputBuffer.length,
        outputBuffer.sampleRate
      );
      const source = offlineContext.createBufferSource();
      source.buffer = outputBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();

      // Convert AudioBuffer to WAV blob
      const wavBlob = await audioBufferToWav(renderedBuffer);
      const newUrl = URL.createObjectURL(wavBlob);

      // Calculate new duration (based on kept segments)
      let keptDuration = 0;
      for (const seg of keepSegments) {
        keptDuration += (seg.end - seg.start) * recording.duration;
      }
      const newDuration = Math.round(keptDuration);

      // Update recording
      const updatedRecordings = recordings.map(r =>
        r.id === editor.recordingId
          ? {
              ...r,
              audioBlob: wavBlob,
              audioUrl: newUrl,
              duration: newDuration,
              waveformData: generateWaveformData(outputBuffer, 500)
            }
          : r
      );

      setRecordings(updatedRecordings);
      saveRecordingsToStorage(updatedRecordings);

      // Revoke old URL
      if (recording.audioUrl) {
        URL.revokeObjectURL(recording.audioUrl);
      }

      setSuccess(language === 'de' ? 'Audio erfolgreich zugeschnitten!' : 'Audio trimmed successfully!');
      setTimeout(() => setSuccess(null), 3000);

      closeEditor();

    } catch (err: any) {
      console.error('Error applying trim:', err);
      setError(language === 'de'
        ? `Fehler beim Zuschneiden: ${err.message}`
        : `Trim error: ${err.message}`);
    }
  };

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const numChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;

      const bytesPerSample = bitDepth / 8;
      const blockAlign = numChannels * bytesPerSample;

      const dataLength = buffer.length * blockAlign;
      const bufferLength = 44 + dataLength;

      const arrayBuffer = new ArrayBuffer(bufferLength);
      const view = new DataView(arrayBuffer);

      // WAV header
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, bufferLength - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, format, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * blockAlign, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitDepth, true);
      writeString(36, 'data');
      view.setUint32(40, dataLength, true);

      // Write audio data
      let offset = 44;
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
          const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(offset, int16, true);
          offset += 2;
        }
      }

      resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
    });
  };

  // Close editor
  const closeEditor = () => {
    stopEditorAudio();
    if (editorAudioContextRef.current && editorAudioContextRef.current.state !== 'closed') {
      editorAudioContextRef.current.close().catch(() => {});
    }
    editorAudioContextRef.current = null;
    setEditor({
      isOpen: false,
      recordingId: null,
      audioBuffer: null,
      waveformData: [],
      trimStart: 0,
      trimEnd: 1,
      playheadPosition: 0,
      isPlaying: false,
      zoom: 1,
      selection: null,
      history: [],
      cutRegions: [],
      isSelectingCut: false,
      cutSelectionStart: null
    });
  };

  // Skip forward/backward
  const skipBackward = () => {
    setEditor(prev => ({
      ...prev,
      playheadPosition: Math.max(prev.trimStart, prev.playheadPosition - 0.05)
    }));
  };

  const skipForward = () => {
    setEditor(prev => ({
      ...prev,
      playheadPosition: Math.min(prev.trimEnd, prev.playheadPosition + 0.05)
    }));
  };

  // Reset trim and cut regions
  const resetTrim = () => {
    setEditor(prev => ({
      ...prev,
      trimStart: 0,
      trimEnd: 1,
      cutRegions: [],
      history: [...prev.history, { trimStart: prev.trimStart, trimEnd: prev.trimEnd, cutRegions: [...prev.cutRegions] }]
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tab-content space-y-6 h-full flex flex-col overflow-y-auto pb-8">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent flex items-center gap-3">
            <Headphones className="w-10 h-10 text-emerald-400" />
            {language === 'de' ? 'Interview Studio' : 'Interview Studio'}
          </h2>
          <p className="text-white/60">
            {language === 'de'
              ? 'Professionelle Aufnahme & KI-Transkription'
              : 'Professional recording & AI transcription'}
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          ULTIMATE
        </span>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
          <X className="w-5 h-5 text-red-400" />
          <span className="text-red-300 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300">{success}</span>
        </div>
      )}

      {/* Recording Studio Panel */}
      <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">

        {/* Microphone Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/70">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">
              {language === 'de' ? 'Mikrofon:' : 'Microphone:'}
            </span>
          </div>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isRecording}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          >
            {audioDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId} className="bg-gray-800">
                {device.label || `Mikrofon ${device.deviceId.slice(0, 8)}...`}
              </option>
            ))}
          </select>
          <button
            onClick={loadAudioDevices}
            disabled={isRecording}
            className="px-3 py-2 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 disabled:opacity-50"
            title={language === 'de' ? 'Geräte aktualisieren' : 'Refresh devices'}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Timer */}
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
            isRecording
              ? isPaused
                ? 'bg-yellow-500'
                : 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
              : 'bg-gradient-to-br from-emerald-500 to-cyan-600'
          }`}>
            {isRecording ? (
              isPaused ? <Pause className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              {isRecording
                ? isPaused
                  ? (language === 'de' ? 'Pausiert' : 'Paused')
                  : (language === 'de' ? 'Aufnahme läuft' : 'Recording')
                : (language === 'de' ? 'Bereit' : 'Ready')}
            </h3>
            <span className={`font-mono text-3xl ${isRecording ? 'text-red-400' : 'text-white/50'}`}>
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>

        {/* PROMINENT AUDIO LEVEL METER - PEGEL */}
        <div className={`rounded-2xl p-6 border-2 transition-all ${
          isRecording && !isPaused
            ? volumeLevel > 80
              ? 'bg-red-900/40 border-red-500/60 shadow-lg shadow-red-500/30'
              : volumeLevel > 50
                ? 'bg-yellow-900/30 border-yellow-500/50'
                : 'bg-emerald-900/30 border-emerald-500/50'
            : 'bg-black/40 border-white/10'
        }`}>
          {/* Level Label */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Volume2 className={`w-6 h-6 ${
                isRecording && !isPaused
                  ? volumeLevel > 80 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                  : 'text-white/40'
              }`} />
              <span className="text-white font-semibold">
                {language === 'de' ? 'Audio-Pegel' : 'Audio Level'}
              </span>
            </div>
            <span className={`text-2xl font-mono font-bold ${
              volumeLevel > 80 ? 'text-red-400' : volumeLevel > 50 ? 'text-yellow-400' : 'text-emerald-400'
            }`}>
              {volumeLevel.toFixed(0)}%
            </span>
          </div>

          {/* BIG Volume Meter Bar */}
          <div className="relative h-10 bg-black/60 rounded-xl overflow-hidden border border-white/10">
            {/* Segmented Background */}
            <div className="absolute inset-0 flex">
              <div className="w-1/2 border-r border-white/10" />
              <div className="w-1/4 border-r border-white/10" />
              <div className="w-1/4" />
            </div>
            {/* Level Bar */}
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-75 ${
                volumeLevel > 80
                  ? 'bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500'
                  : volumeLevel > 50
                    ? 'bg-gradient-to-r from-emerald-500 to-yellow-500'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, volumeLevel)}%` }}
            />
            {/* Tick Marks */}
            <div className="absolute inset-0 flex items-end justify-between px-2 pb-1 pointer-events-none">
              <span className="text-[10px] text-white/50">0</span>
              <span className="text-[10px] text-white/50">50</span>
              <span className="text-[10px] text-white/50">75</span>
              <span className="text-[10px] text-red-400/80">100</span>
            </div>
          </div>

          {/* Status Text */}
          <div className="mt-3 text-center">
            {isRecording && !isPaused ? (
              <span className={`text-sm font-medium ${
                volumeLevel > 80 ? 'text-red-400' : volumeLevel > 50 ? 'text-yellow-400' : volumeLevel > 20 ? 'text-emerald-400' : 'text-white/50'
              }`}>
                {volumeLevel > 80
                  ? (language === 'de' ? '⚠️ ZU LAUT - Mikrofon leiser stellen!' : '⚠️ TOO LOUD - Lower microphone!')
                  : volumeLevel > 50
                    ? (language === 'de' ? '✓ Guter Pegel' : '✓ Good level')
                    : volumeLevel > 20
                      ? (language === 'de' ? '✓ OK - etwas leise' : '✓ OK - a bit quiet')
                      : (language === 'de' ? '🔇 Sehr leise - näher ans Mikrofon' : '🔇 Very quiet - move closer to mic')}
              </span>
            ) : (
              <span className="text-sm text-white/40">
                {language === 'de' ? 'Starten Sie die Aufnahme um den Pegel zu sehen' : 'Start recording to see the level'}
              </span>
            )}
          </div>
        </div>

        {/* Live Waveform Visualizer */}
        <div className="bg-black/40 rounded-xl p-4">
          <div className="flex items-center justify-center gap-1 h-20">
            {waveformData.map((value, index) => (
              <div
                key={index}
                className={`w-2 rounded-full transition-all duration-75 ${
                  isRecording && !isPaused ? 'bg-gradient-to-t from-emerald-500 to-cyan-400' : 'bg-gray-600'
                }`}
                style={{
                  height: `${Math.max(4, Math.abs(value) * 80 + 20)}%`,
                  opacity: isRecording && !isPaused ? 1 : 0.3
                }}
              />
            ))}
          </div>
        </div>

        {/* Title Input (only when not recording) */}
        {!isRecording && (
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder={language === 'de' ? 'Interview-Titel eingeben (optional)...' : 'Enter interview title (optional)...'}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
          />
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={audioDevices.length === 0}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl text-white font-semibold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-6 h-6" />
              {language === 'de' ? 'Aufnahme starten' : 'Start Recording'}
            </button>
          ) : (
            <>
              <button
                onClick={pauseRecording}
                className={`flex-1 px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all ${
                  isPaused
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-600'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                }`}
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                {isPaused
                  ? (language === 'de' ? 'Fortsetzen' : 'Resume')
                  : (language === 'de' ? 'Pausieren' : 'Pause')}
              </button>
              <button
                onClick={stopRecording}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl text-white font-semibold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-red-500/25"
              >
                <Square className="w-6 h-6" />
                {language === 'de' ? 'Speichern' : 'Save'}
              </button>
              <button
                onClick={cancelRecording}
                className="px-4 py-4 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
                title={language === 'de' ? 'Abbrechen' : 'Cancel'}
              >
                <X className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions - Nach Aufnahme erscheint Zurück/Neue Aufnahme */}
      {recordings.length > 0 && !isRecording && (
        <div className="bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-medium">
                {language === 'de' ? 'Aufnahme gespeichert!' : 'Recording saved!'}
              </p>
              <p className="text-white/50 text-sm">
                {language === 'de'
                  ? `${recordings.length} Aufnahme${recordings.length > 1 ? 'n' : ''} vorhanden`
                  : `${recordings.length} recording${recordings.length > 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentTitle('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl text-white font-semibold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20"
          >
            <Mic className="w-5 h-5" />
            {language === 'de' ? 'Neue Aufnahme' : 'New Recording'}
          </button>
        </div>
      )}

      {/* Recordings List */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-emerald-400" />
          {language === 'de' ? 'Aufnahmen' : 'Recordings'}
          <span className="px-2 py-0.5 bg-white/10 rounded-full text-sm font-normal text-white/60">
            {recordings.length}
          </span>
        </h3>

        {recordings.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{language === 'de' ? 'Noch keine Aufnahmen' : 'No recordings yet'}</p>
            <p className="text-sm mt-2">
              {language === 'de'
                ? 'Starten Sie Ihre erste Interview-Aufnahme'
                : 'Start your first interview recording'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
              >
                {/* Recording Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Prominent Play/Anhören Button */}
                    <button
                      onClick={() => playRecording(recording)}
                      disabled={!recording.audioUrl}
                      className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all font-semibold ${
                        playingId === recording.id
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-400 hover:from-emerald-500/50 hover:to-cyan-500/50 border border-emerald-500/40'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {playingId === recording.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      <span className="text-sm">
                        {playingId === recording.id
                          ? (language === 'de' ? 'Stopp' : 'Stop')
                          : (language === 'de' ? 'Anhören' : 'Listen')}
                      </span>
                    </button>
                    <div>
                      <h4 className="font-semibold text-white">{recording.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(recording.duration)}
                        </span>
                        <span>
                          {recording.recordedAt.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {recording.isTranscribed && (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {language === 'de' ? 'Transkribiert' : 'Transcribed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Transcription Preview */}
                {recording.transcription && (
                  <div className="mt-3 p-3 bg-black/20 rounded-lg">
                    <p className="text-white/70 text-sm line-clamp-3">{recording.transcription}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Transcribe Button */}
                  {!recording.isTranscribed && recording.audioBlob && (
                    <button
                      onClick={() => transcribeRecording(recording)}
                      disabled={transcribing === recording.id}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs flex items-center gap-1.5 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                    >
                      {transcribing === recording.id ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          {language === 'de' ? 'Transkribiert...' : 'Transcribing...'}
                        </>
                      ) : (
                        <>
                          <OpenAI className="w-3 h-3" />
                          {language === 'de' ? 'KI-Transkription' : 'AI Transcribe'}
                        </>
                      )}
                    </button>
                  )}

                  {/* Add to Documents */}
                  {recording.transcription && onAddDocument && (
                    <button
                      onClick={() => addToDocuments(recording)}
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      {language === 'de' ? 'Zu Dokumenten' : 'To Documents'}
                    </button>
                  )}

                  {/* Download Transcript - NEW */}
                  {recording.transcription && (
                    <button
                      onClick={() => downloadTranscript(recording)}
                      className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs flex items-center gap-1.5 hover:bg-cyan-500/30 transition-colors"
                    >
                      <FileDownload className="w-3 h-3" />
                      {language === 'de' ? 'Transkript' : 'Transcript'}
                    </button>
                  )}

                  {/* Back to Editor Button - Nach Transkription sichtbar */}
                  {recording.isTranscribed && recording.audioBlob && (
                    <button
                      onClick={() => openEditor(recording)}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors"
                    >
                      <ArrowBack className="w-3 h-3" />
                      {language === 'de' ? 'Zurück (Schneiden)' : 'Back (Edit)'}
                    </button>
                  )}

                  {/* Audio Editor Button - Nur wenn noch nicht transkribiert */}
                  {recording.audioBlob && !recording.isTranscribed && (
                    <button
                      onClick={() => openEditor(recording)}
                      className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-xs flex items-center gap-1.5 hover:bg-orange-500/30 transition-colors"
                    >
                      <Scissors className="w-3 h-3" />
                      {language === 'de' ? 'Schneiden' : 'Edit'}
                    </button>
                  )}

                  {/* Download Audio */}
                  {recording.audioUrl && (
                    <button
                      onClick={() => downloadRecording(recording)}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs flex items-center gap-1.5 hover:bg-blue-500/30 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      {language === 'de' ? 'Audio' : 'Audio'}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => deleteRecording(recording.id)}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-1.5 hover:bg-red-500/30 transition-colors ml-auto"
                  >
                    <Trash className="w-3 h-3" />
                    {language === 'de' ? 'Löschen' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OpenAI API Key Info Box */}
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/40 rounded-2xl p-5">
        <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
          <OpenAI className="w-5 h-5" />
          {language === 'de' ? 'Transkription (99+ Sprachen)' : 'Transcription (99+ Languages)'}
        </h4>
        <p className="text-white/70 text-sm mb-3">
          {language === 'de'
            ? 'Für die automatische Transkription mit Whisper AI benötigen Sie einen OpenAI API-Key. Whisper unterstützt über 99 Sprachen mit exzellenter Erkennungsqualität.'
            : 'For automatic transcription with Whisper AI you need an OpenAI API key. Whisper supports 99+ languages with excellent recognition quality.'}
        </p>
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 text-purple-300 rounded-xl transition-colors text-sm font-medium"
        >
          <OpenAI className="w-4 h-4" />
          {language === 'de' ? 'OpenAI API-Key erstellen' : 'Create OpenAI API Key'}
          <span className="text-purple-400">→</span>
        </a>
        <p className="text-white/50 text-xs mt-2">
          {language === 'de'
            ? 'Kosten: ca. $0.006 pro Minute Audio'
            : 'Cost: ~$0.006 per minute of audio'}
        </p>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-2xl p-5">
        <h4 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
          <Headphones className="w-5 h-5" />
          {language === 'de' ? 'Pro-Tipps' : 'Pro Tips'}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2 text-white/70">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            {language === 'de'
              ? 'Externes USB-Mikrofon für beste Qualität'
              : 'External USB mic for best quality'}
          </div>
          <div className="flex items-start gap-2 text-white/70">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            {language === 'de'
              ? 'Pegel zwischen 30-70% halten'
              : 'Keep levels between 30-70%'}
          </div>
          <div className="flex items-start gap-2 text-white/70">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            {language === 'de'
              ? 'Ruhige Umgebung ohne Störgeräusche'
              : 'Quiet environment without noise'}
          </div>
          <div className="flex items-start gap-2 text-white/70">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            {language === 'de'
              ? 'Unterstützte Sprachen: Deutsch, Englisch, Spanisch, Französisch, Italienisch, Portugiesisch, Chinesisch, Japanisch, und 90+ weitere'
              : 'Supported languages: German, English, Spanish, French, Italian, Portuguese, Chinese, Japanese, and 90+ more'}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* AUDIO EDITOR MODAL - Camtasia-style Timeline Editor         */}
      {/* ============================================================ */}
      {editor.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/20 shadow-2xl w-[90%] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {language === 'de' ? 'Audio-Editor' : 'Audio Editor'}
                  </h3>
                  <p className="text-sm text-white/50">
                    {recordings.find(r => r.id === editor.recordingId)?.title || 'Recording'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditor}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Waveform Timeline Canvas */}
            <div className="p-4 flex-1 flex flex-col gap-4">
              {/* Zoom Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={zoomOut}
                    disabled={editor.zoom <= 1}
                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={language === 'de' ? 'Verkleinern' : 'Zoom Out'}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-white/60 text-sm px-2 min-w-[60px] text-center">
                    {editor.zoom.toFixed(1)}x
                  </span>
                  <button
                    onClick={zoomIn}
                    disabled={editor.zoom >= 10}
                    className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={language === 'de' ? 'Vergrößern' : 'Zoom In'}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Time Display */}
                <div className="flex items-center gap-4 text-white/70 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {(() => {
                      const rec = recordings.find(r => r.id === editor.recordingId);
                      if (!rec) return '0:00';
                      const currentTime = editor.playheadPosition * rec.duration;
                      return formatTimeDetailed(currentTime);
                    })()}
                  </span>
                  <span className="text-white/40">/</span>
                  <span>
                    {(() => {
                      const rec = recordings.find(r => r.id === editor.recordingId);
                      if (!rec) return '0:00';
                      const trimDuration = (editor.trimEnd - editor.trimStart) * rec.duration;
                      return formatTimeDetailed(trimDuration);
                    })()}
                  </span>
                </div>

                {/* Undo Button */}
                <button
                  onClick={undoTrim}
                  disabled={editor.history.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Undo className="w-4 h-4" />
                  <span className="text-sm">{language === 'de' ? 'Rückgängig' : 'Undo'}</span>
                </button>
              </div>

              {/* Waveform Canvas */}
              <div className="relative bg-black/40 rounded-xl overflow-hidden border border-white/10">
                <canvas
                  ref={editorCanvasRef}
                  width={900}
                  height={160}
                  className="w-full h-40 cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />

                {/* Trim Info Overlay */}
                <div className="absolute top-2 left-2 right-2 flex justify-between pointer-events-none">
                  <div className="px-2 py-1 bg-orange-500/80 rounded text-white text-xs font-mono">
                    {language === 'de' ? 'Start' : 'Start'}: {(editor.trimStart * 100).toFixed(1)}%
                  </div>
                  <div className="px-2 py-1 bg-orange-500/80 rounded text-white text-xs font-mono">
                    {language === 'de' ? 'Ende' : 'End'}: {(editor.trimEnd * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Playback Controls with Labels */}
              <div className="flex flex-col items-center gap-4">
                {/* Main Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={skipBackward}
                    className="flex flex-col items-center gap-1 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                  >
                    <SkipBack className="w-5 h-5" />
                    <span className="text-xs text-white/70">
                      {language === 'de' ? 'Zurück' : 'Back'}
                    </span>
                  </button>

                  <button
                    onClick={editor.isPlaying ? stopEditorAudio : playEditorAudio}
                    className={`flex flex-col items-center gap-1 px-6 py-3 rounded-xl text-white transition-all ${
                      editor.isPlaying
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-600 hover:scale-105 shadow-lg shadow-emerald-500/25'
                    }`}
                  >
                    {editor.isPlaying ? <Square className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                    <span className="text-sm font-semibold">
                      {editor.isPlaying
                        ? (language === 'de' ? 'Stopp' : 'Stop')
                        : (language === 'de' ? 'Anhören' : 'Listen')}
                    </span>
                  </button>

                  <button
                    onClick={skipForward}
                    className="flex flex-col items-center gap-1 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                    <span className="text-xs text-white/70">
                      {language === 'de' ? 'Vor' : 'Forward'}
                    </span>
                  </button>
                </div>

                {/* Volume Level Meter (during playback) */}
                {editor.isPlaying && (
                  <div className="w-full max-w-md flex items-center gap-3 px-4">
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1 h-3 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all animate-pulse"
                        style={{ width: '60%' }}
                      />
                    </div>
                    <span className="text-xs text-white/50 w-12 text-right">
                      {language === 'de' ? 'Pegel' : 'Level'}
                    </span>
                  </div>
                )}
              </div>

              {/* SIMPLIFIED CUT WORKFLOW - Direct Selection Mode */}
              <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/40 rounded-2xl p-5">
                {/* Header with mode indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      editor.isSelectingCut
                        ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/40'
                        : 'bg-red-500/30'
                    }`}>
                      <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {language === 'de' ? 'Bereiche Entfernen' : 'Remove Sections'}
                      </h4>
                      <p className="text-sm text-white/50">
                        {editor.cutRegions.length > 0
                          ? (language === 'de'
                              ? `${editor.cutRegions.length} Bereich${editor.cutRegions.length > 1 ? 'e' : ''} zum Entfernen markiert`
                              : `${editor.cutRegions.length} section${editor.cutRegions.length > 1 ? 's' : ''} marked for removal`)
                          : (language === 'de'
                              ? 'Markiere unerwünschte Bereiche'
                              : 'Mark unwanted sections')}
                      </p>
                    </div>
                  </div>

                  {editor.cutRegions.length > 0 && (
                    <button
                      onClick={clearAllCutRegions}
                      className="px-4 py-2 bg-white/10 hover:bg-red-500/30 border border-white/20 rounded-xl text-white/70 hover:text-red-300 text-sm flex items-center gap-2 transition-all"
                    >
                      <Trash className="w-4 h-4" />
                      {language === 'de' ? 'Alle löschen' : 'Clear all'}
                    </button>
                  )}
                </div>

                {/* Simple 3-Step Instructions - Always visible */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`p-3 rounded-xl border-2 transition-all ${
                    !editor.isSelectingCut && editor.cutSelectionStart === null
                      ? 'bg-emerald-500/20 border-emerald-500/60 shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                      <span className="text-white font-medium text-sm">
                        {language === 'de' ? 'Klicke' : 'Click'}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs pl-8">
                      {language === 'de' ? 'auf Start-Position in Waveform' : 'on start position in waveform'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border-2 transition-all ${
                    editor.isSelectingCut
                      ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/20 animate-pulse'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                      <span className="text-white font-medium text-sm">
                        {language === 'de' ? 'Ziehe' : 'Drag'}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs pl-8">
                      {language === 'de' ? 'zur End-Position (Shift gedrückt)' : 'to end position (hold Shift)'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border-2 border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
                      <span className="text-white font-medium text-sm">
                        {language === 'de' ? 'Loslassen' : 'Release'}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs pl-8">
                      {language === 'de' ? 'Bereich wird rot markiert' : 'Section gets marked red'}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex gap-3">
                  {!editor.isSelectingCut ? (
                    <button
                      onClick={startCutSelection}
                      className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-500/30 hover:scale-[1.02]"
                    >
                      <Cut className="w-5 h-5" />
                      {language === 'de' ? 'Schnitt-Modus aktivieren' : 'Activate Cut Mode'}
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-3">
                      <div className="flex-1 px-5 py-3 bg-red-500/30 border-2 border-red-500 border-dashed rounded-xl text-red-300 font-medium flex items-center justify-center gap-3 animate-pulse">
                        <Scissors className="w-5 h-5" />
                        {language === 'de'
                          ? 'Jetzt in Waveform klicken & ziehen!'
                          : 'Now click & drag in waveform!'}
                      </div>
                      <button
                        onClick={cancelCutSelection}
                        className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        {language === 'de' ? 'Abbrechen' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Cut Regions List - Visual Pills */}
                {editor.cutRegions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      {language === 'de'
                        ? 'Diese Bereiche werden beim Speichern entfernt:'
                        : 'These sections will be removed on save:'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editor.cutRegions.map((region, idx) => {
                        const rec = recordings.find(r => r.id === editor.recordingId);
                        const startTime = rec ? formatTimeDetailed(region.start * rec.duration) : '?';
                        const endTime = rec ? formatTimeDetailed(region.end * rec.duration) : '?';
                        const durationSec = rec ? ((region.end - region.start) * rec.duration).toFixed(1) : '?';
                        return (
                          <div
                            key={region.id}
                            className="group flex items-center gap-2 pl-3 pr-2 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-red-500/50 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-sm text-red-200 font-mono">
                                {startTime} → {endTime}
                              </span>
                              <span className="text-xs text-red-400/60">
                                ({durationSec}s)
                              </span>
                            </div>
                            <button
                              onClick={() => removeCutRegion(region.id)}
                              className="p-1 bg-red-500/30 hover:bg-red-500 rounded-lg text-red-300 hover:text-white transition-all opacity-60 group-hover:opacity-100"
                              title={language === 'de' ? 'Entfernen' : 'Remove'}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* PROMINENT SAVE BUTTON - Right here where the user expects it */}
                    <button
                      onClick={applyTrim}
                      className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 animate-pulse"
                    >
                      <Save className="w-6 h-6" />
                      {language === 'de'
                        ? `Jetzt speichern (${editor.cutRegions.length} Bereich${editor.cutRegions.length > 1 ? 'e' : ''} entfernen)`
                        : `Save now (remove ${editor.cutRegions.length} section${editor.cutRegions.length > 1 ? 's' : ''})`}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Help - Keyboard Shortcuts */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-white/70">Shift + Drag</kbd>
                      <span>{language === 'de' ? 'Bereich markieren' : 'Select region'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-white/70">Space</kbd>
                      <span>{language === 'de' ? 'Abspielen/Pause' : 'Play/Pause'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-white/70">Ctrl+Z</kbd>
                      <span>{language === 'de' ? 'Rückgängig' : 'Undo'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded" />
                    <span className="text-xs text-white/50">{language === 'de' ? 'Trim-Griffe' : 'Trim handles'}</span>
                    <div className="w-1 h-4 bg-red-500 rounded ml-3" />
                    <span className="text-xs text-white/50">{language === 'de' ? 'Playhead' : 'Playhead'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Footer - Action Buttons */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
              <button
                onClick={resetTrim}
                className="px-4 py-2 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition-colors flex items-center gap-2"
              >
                <Undo className="w-4 h-4" />
                {language === 'de' ? 'Zurücksetzen' : 'Reset'}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={closeEditor}
                  className="px-6 py-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                >
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  onClick={applyTrim}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white font-semibold hover:scale-105 transition-all shadow-lg shadow-orange-500/25 flex items-center gap-2"
                >
                  <Cut className="w-4 h-4" />
                  {language === 'de' ? 'Zuschneiden & Speichern' : 'Trim & Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewTab;
