// Web Speech API wrapper for Recognition & Synthesis with robust permission handling

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    __currentUtterance?: SpeechSynthesisUtterance;
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

/**
 * Explicitly request microphone stream from user to trigger browser permission dialog
 */
export async function requestMicrophoneAccess(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error: 'Media devices API is not supported in this browser environment.'
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all audio tracks immediately once permission is verified
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    console.warn('Microphone permission error:', err);
    let msg = 'Microphone access denied.';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg = 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg = 'No microphone device was found on this computer.';
    } else if (err.name === 'NotReadableError') {
      msg = 'Microphone hardware is currently in use by another application.';
    }
    return { granted: false, error: msg };
  }
}

let activeRecognition: any = null;
let keepListeningLoop = false;

export function startSpeechRecognition({
  language = 'ur-PK',
  onResult,
  onInterim,
  onError,
  onEnd,
}: {
  language?: string;
  onResult: (finalTranscript: string) => void;
  onInterim?: (interimTranscript: string) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}) {
  stopSpeechRecognition();

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (onError) onError('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    return null;
  }

  keepListeningLoop = true;

  try {
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

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
        // Normal silence timeout; do not terminate if user intends continuous listening
        return;
      }

      let errorExplanation = `Voice error: ${err}`;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        errorExplanation = 'Microphone blocked. Please click the lock or settings icon in your browser address bar and choose "Allow" for Microphone.';
        keepListeningLoop = false;
      } else if (err === 'audio-capture') {
        errorExplanation = 'No microphone detected. Please check your mic connection.';
        keepListeningLoop = false;
      } else if (err === 'network') {
        errorExplanation = 'Speech recognition network error. Please verify internet connection.';
      }

      if (onError) onError(errorExplanation);
    };

    recognition.onend = () => {
      if (keepListeningLoop) {
        try {
          recognition.start();
          return;
        } catch (e) {
          // ignore restart collision
        }
      }
      if (onEnd) onEnd();
    };

    recognition.start();
    activeRecognition = recognition;
    return recognition;
  } catch (err: any) {
    console.error('Failed to instantiate speech recognition:', err);
    if (onError) onError(err.message || 'Failed to initialize microphone recognition.');
    return null;
  }
}

export function stopSpeechRecognition() {
  keepListeningLoop = false;
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

  // Strip markdown formatting before speaking
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

  // Auto-detect Urdu or Hindi text to choose suitable voice if available
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

  // Keep reference on window to prevent Chrome garbage collector bug
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
