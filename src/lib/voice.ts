// Web Speech API wrapper and Audio Visualizer for robust microphone handling

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    __currentUtterance?: SpeechSynthesisUtterance;
    webkitAudioContext: typeof AudioContext;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

// Live Audio Meter using Web Audio API
let activeAudioStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let meterAnimationId: number | null = null;

export async function startAudioLevelMeter(
  onLevelChange: (levelPercent: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    stopAudioLevelMeter();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { success: false, error: 'MediaDevices API not supported in this browser.' };
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeAudioStream = stream;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const percent = Math.min(100, Math.round((avg / 128) * 100));

      onLevelChange(percent);
      meterAnimationId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
    return { success: true };
  } catch (err: any) {
    console.warn('Could not start audio level meter:', err);
    let errorMsg = 'Microphone permission denied or hardware unavailable.';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMsg = 'Microphone access blocked. Click lock icon in browser URL bar to allow.';
    }
    return { success: false, error: errorMsg };
  }
}

export function stopAudioLevelMeter() {
  if (meterAnimationId) {
    cancelAnimationFrame(meterAnimationId);
    meterAnimationId = null;
  }
  if (activeAudioStream) {
    activeAudioStream.getTracks().forEach((track) => track.stop());
    activeAudioStream = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  analyser = null;
}

let activeRecognition: any = null;
let isUserListeningActive = false;

export function startSpeechRecognition({
  language = 'ur-PK',
  onListeningStateChange,
  onResult,
  onInterim,
  onError,
  onEnd,
}: {
  language?: string;
  onListeningStateChange?: (active: boolean) => void;
  onResult: (finalTranscript: string) => void;
  onInterim?: (interimTranscript: string) => void;
  onError?: (errorDetails: { code: string; message: string }) => void;
  onEnd?: () => void;
}) {
  stopSpeechRecognition();

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (onError) {
      onError({
        code: 'not_supported',
        message: 'Speech Recognition is not supported by your browser engine. Use Chrome, Edge, or use text commands below.',
      });
    }
    return null;
  }

  isUserListeningActive = true;

  try {
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (onListeningStateChange) onListeningStateChange(true);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim && onInterim) {
        onInterim(interim);
      }
      if (final) {
        onResult(final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      const err = event.error;
      console.warn('Speech recognition error event:', err);

      if (err === 'no-speech') {
        // Normal silence timeout; ignore and continue if user hasn't explicitly stopped
        return;
      }

      let errorMsg = `Voice Recognition error: ${err}`;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        errorMsg = 'Microphone permission blocked. Please click the lock or settings icon in your browser address bar and select "Allow" for Microphone.';
        isUserListeningActive = false;
      } else if (err === 'audio-capture') {
        errorMsg = 'No audio detected. Please check if your microphone is plugged in and unmuted.';
        isUserListeningActive = false;
      } else if (err === 'network') {
        errorMsg = 'Speech network connectivity error. Please ensure internet access is active.';
      }

      if (onError) {
        onError({ code: err, message: errorMsg });
      }
    };

    recognition.onend = () => {
      // Auto restart if user intended continuous listening and it wasn't a hard permission block
      if (isUserListeningActive) {
        try {
          recognition.start();
          return;
        } catch (e) {
          // Restart collision; proceed to cleanup
        }
      }
      if (onListeningStateChange) onListeningStateChange(false);
      if (onEnd) onEnd();
    };

    recognition.start();
    activeRecognition = recognition;
    return recognition;
  } catch (err: any) {
    isUserListeningActive = false;
    console.error('Failed to start speech recognition:', err);
    if (onError) {
      onError({
        code: 'init_error',
        message: err.message || 'Could not initialize speech recognition. Check browser permissions.',
      });
    }
    return null;
  }
}

export function stopSpeechRecognition() {
  isUserListeningActive = false;
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // ignore
    }
    activeRecognition = null;
  }
}

export function speakText({
  text,
  language = 'ur-PK',
  rate = 1.0,
  pitch = 1.0,
  onStart,
  onEnd,
}: {
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
}) {
  if (!isSpeechSynthesisSupported()) return;

  stopSpeaking();

  const cleanText = text
    .replace(/[#*_`~\[\]\(\)>]/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/http[s]?:\/\/\S+/g, 'link')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = rate;
  utterance.pitch = pitch;

  const hasUrdu = /[\u0600-\u06FF]/.test(cleanText);
  const hasHindi = /[\u0900-\u097F]/.test(cleanText);

  if (hasUrdu) {
    utterance.lang = 'ur-PK';
  } else if (hasHindi) {
    utterance.lang = 'hi-IN';
  } else {
    utterance.lang = language;
  }

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0, 2)) ||
      (utterance.lang.startsWith('en') && v.lang.startsWith('en'))
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    window.__currentUtterance = undefined;
    if (onEnd) onEnd();
  };

  utterance.onerror = (err) => {
    console.warn('Speech synthesis error:', err);
    window.__currentUtterance = undefined;
    if (onEnd) onEnd();
  };

  window.__currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
      window.__currentUtterance = undefined;
    } catch (e) {
      // ignore
    }
  }
}
