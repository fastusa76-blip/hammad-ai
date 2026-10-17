import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Youtube,
  Laptop,
  Play,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X,
  Radio,
  CheckCircle2,
  Send,
  AlertTriangle,
  Activity,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  startAudioLevelMeter,
  stopAudioLevelMeter,
} from '../lib/voice';
import {
  processVoiceCommand,
  initDesktopBridge,
  onBridgeStatusChange,
  isDesktopBridgeActive,
} from '../lib/commandExecutor';
import { AppSettings, ExecutedAction } from '../types';

interface VoiceAssistantViewProps {
  settings: AppSettings;
  openBridgeModal: () => void;
}

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  settings,
  openBridgeModal,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState(settings.voiceLanguage || 'ur-PK');
  const [autoSpeak, setAutoSpeak] = useState(settings.autoSpeak ?? true);

  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [lastAssistantSpeech, setLastAssistantSpeech] = useState('');
  const [textCommandInput, setTextCommandInput] = useState('');

  const [voiceError, setVoiceError] = useState<{ code: string; message: string } | null>(null);
  const [actionHistory, setActionHistory] = useState<ExecutedAction[]>([]);
  const [activeYouTube, setActiveYouTube] = useState<{ query: string; videoId?: string; isExact: boolean } | null>(null);
  const [isBridgeConnected, setIsBridgeConnected] = useState(isDesktopBridgeActive());

  const transcriptDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize desktop bridge WebSocket on mount
  useEffect(() => {
    initDesktopBridge(settings.bridgePort || 8765);
    const unsubscribe = onBridgeStatusChange((status) => {
      setIsBridgeConnected(status);
    });
    return () => {
      stopSpeechRecognition();
      stopAudioLevelMeter();
      stopSpeaking();
      unsubscribe();
    };
  }, []);

  const handleCommandExecution = async (transcript: string) => {
    if (!transcript.trim()) return;

    setLastUserSpeech(transcript);
    setCurrentTranscript('');
    setIsProcessing(true);
    setVoiceError(null);

    try {
      const result = await processVoiceCommand(transcript, settings.apiKey);

      setLastAssistantSpeech(result.spokenFeedback);

      if (result.actionCard) {
        setActionHistory((prev) => [result.actionCard!, ...prev.slice(0, 9)]);
      }

      // Handle YouTube video embed or search trigger
      if (result.intent === 'youtube' && result.query) {
        setActiveYouTube({
          query: result.query,
          videoId: result.videoId,
          isExact: Boolean(result.isExactMatch),
        });
      }

      // Speak back if autoSpeak enabled
      if (autoSpeak) {
        speakText({
          text: result.spokenFeedback,
          language: language.startsWith('ur') ? 'ur-PK' : language.startsWith('hi') ? 'hi-IN' : 'en-US',
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } catch (err: any) {
      console.error('Error handling command:', err);
      const errMsg = 'معذرت، اس کمانڈ کو چلانے میں مسئلہ پیش آیا ہے۔';
      setLastAssistantSpeech(errMsg);
      if (autoSpeak) {
        speakText({ text: errMsg, onStart: () => setIsSpeaking(true), onEnd: () => setIsSpeaking(false) });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopSpeechRecognition();
      stopAudioLevelMeter();
      setIsListening(false);
      setMicAudioLevel(0);
      setCurrentTranscript('');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceError({
        code: 'not_supported',
        message:
          'آپ کے براؤزر میں Speech Recognition سپورٹ نہیں ہے۔ براہ کرم Google Chrome یا Microsoft Edge استعمال کریں، یا نیچے دی گئی کمانڈ بار میں لکھیں۔',
      });
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    setVoiceError(null);

    // Start audio level visualizer so user sees mic hardware activity
    startAudioLevelMeter((level) => {
      setMicAudioLevel(level);
    });

    // Start recognition directly without destructive getUserMedia track stops
    const recognition = startSpeechRecognition({
      language,
      onListeningStateChange: (active) => {
        setIsListening(active);
      },
      onInterim: (interim) => {
        setCurrentTranscript(interim);
      },
      onResult: (finalText) => {
        setCurrentTranscript(finalText);
        if (transcriptDebounceRef.current) clearTimeout(transcriptDebounceRef.current);
        transcriptDebounceRef.current = setTimeout(() => {
          handleCommandExecution(finalText);
        }, 500);
      },
      onError: (errDetails) => {
        setVoiceError(errDetails);
        setIsListening(false);
        stopAudioLevelMeter();
        setMicAudioLevel(0);
      },
      onEnd: () => {
        setIsListening(false);
        stopAudioLevelMeter();
        setMicAudioLevel(0);
      },
    });

    if (recognition) {
      setIsListening(true);
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textCommandInput.trim()) return;
    const cmd = textCommandInput.trim();
    setTextCommandInput('');
    handleCommandExecution(cmd);
  };

  const quickCommands = [
    { label: '🎵 یوٹیوب پر گانا چلاؤ', text: 'یوٹیوب پر گانا چلاؤ' },
    { label: '🌐 کروم چلاؤ (Open Chrome)', text: 'کروم چلاؤ' },
    { label: '📱 اینڈرائیڈ اسٹوڈیو کھولو', text: 'اینڈرائیڈ اسٹوڈیو چلاؤ' },
    { label: '💻 وی ایس کوڈ چلاؤ', text: 'وی ایس کوڈ چلاؤ' },
    { label: '❓ AI کیا ہے؟', text: 'آرٹیفیشل انٹیلیجنس کیا ہے؟' },
    { label: '⚡ Play Pasoori on YouTube', text: 'Play Pasoori on YouTube' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top bar controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-100">Hammad Voice AI Assistant</h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                اردو، ہندی، اور انگریزی میں وائس کمانڈز سنتا ہے اور ایپس لانچ کرتا ہے۔
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Language dropdown */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ur-PK">Urdu (اردو / Roman)</option>
              <option value="hi-IN">Hindi (हिन्दी / Hinglish)</option>
              <option value="en-US">English (United States)</option>
            </select>

            {/* Auto speak toggle */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                autoSpeak
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title={autoSpeak ? 'Voice output enabled' : 'Voice output muted'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="text-[11px] hidden sm:inline">{autoSpeak ? 'Audio On' : 'Muted'}</span>
            </button>

            {/* Laptop Bridge status indicator */}
            <button
              onClick={openBridgeModal}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                isBridgeConnected
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>{isBridgeConnected ? 'Laptop Connected' : 'Laptop Bridge Offline'}</span>
              <span className={`w-2 h-2 rounded-full ${isBridgeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>
          </div>
        </div>

        {/* Clear Error Notification Banner */}
        {voiceError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-300">
                  وائس ریکگنیشن ایرر ({voiceError.code}):
                </div>
                <div className="text-[11px] text-rose-200/90 mt-0.5">{voiceError.message}</div>
                <div className="text-[10px] text-rose-300/80 mt-1.5 flex items-center gap-2">
                  <span>💡 براؤزر ایڈریس بار میں لاک/سیٹنگ آئیکون پر کلک کر کے Microphone کو Allow کریں۔</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setVoiceError(null)}
              className="text-rose-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Central Glowing AI Voice Orb & Mic Control */}
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-center">
          {/* Subtle background glow */}
          <div
            className={`absolute w-72 h-72 rounded-full blur-3xl transition-opacity duration-1000 -z-0 pointer-events-none ${
              isListening
                ? 'bg-rose-500/25 opacity-100'
                : isSpeaking
                ? 'bg-cyan-500/25 opacity-100'
                : 'bg-indigo-600/15 opacity-60'
            }`}
          />

          {/* Sound waves animation bars reacting to REAL mic audio level */}
          <div className="flex items-center gap-1.5 h-12 mb-6">
            {[40, 80, 60, 100, 70, 90, 50, 85, 65, 45].map((baseH, i) => {
              const dynamicHeight = isListening
                ? Math.max(15, Math.min(100, (micAudioLevel * (baseH / 50))))
                : isSpeaking
                ? baseH
                : 10;

              return (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isListening
                      ? 'bg-rose-500 shadow-sm shadow-rose-500'
                      : isSpeaking
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: `${dynamicHeight}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Big Voice Button */}
          <button
            onClick={toggleListening}
            className={`relative group z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-rose-600/40 ring-4 ring-rose-500/40 animate-pulse'
                : isSpeaking
                ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-cyan-600/40 ring-4 ring-cyan-500/30'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-indigo-600/30 hover:scale-105'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 sm:w-12 sm:h-12" />
            ) : (
              <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
            )}
          </button>

          {/* Status Label & Live Mic VU-Meter */}
          <div className="mt-5 space-y-1.5 z-10">
            <div className="text-sm sm:text-base font-bold text-slate-100 flex items-center justify-center gap-2">
              {isListening ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Listening... بولیں، مائیکروفون آن ہے</span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Hammad AI بول رہا ہے...</span>
                </>
              ) : isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>کمانڈ پر عمل ہو رہا ہے...</span>
                </>
              ) : (
                'مائیکروفون پر کلک کر کے بولیں'
              )}
            </div>

            {/* Live mic decibel meter bar when listening */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Mic Level: {micAudioLevel}%</span>
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-100"
                    style={{ width: `${micAudioLevel}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 max-w-md mx-auto">
              کہیں: <span className="text-indigo-300 font-semibold">"کروم چلاؤ"</span>،{' '}
              <span className="text-indigo-300 font-semibold">"اینڈرائیڈ اسٹوڈیو کھولو"</span>، یا{' '}
              <span className="text-indigo-300 font-semibold">"یوٹیوب پر گانا چلاؤ"</span>
            </p>
          </div>

          {/* Text Command Fallback Bar */}
          <form
            onSubmit={handleManualSubmit}
            className="mt-6 w-full max-w-xl z-10 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-1.5 focus-within:border-indigo-500 shadow-inner"
          >
            <input
              type="text"
              value={textCommandInput}
              onChange={(e) => setTextCommandInput(e.target.value)}
              placeholder="یا یہاں کمانڈ لکھیں (مثلاً: کروم چلاؤ / Play Pasoori on YouTube)..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textCommandInput.trim() || isProcessing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Live transcript bubble */}
          {(currentTranscript || lastUserSpeech || lastAssistantSpeech) && (
            <div className="mt-6 w-full max-w-xl bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3 z-10 shadow-inner">
              {/* User transcript */}
              {(currentTranscript || lastUserSpeech) && (
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 shrink-0 mt-0.5">
                    You Said
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium">
                    {currentTranscript || lastUserSpeech}
                  </p>
                </div>
              )}

              {/* Assistant response */}
              {lastAssistantSpeech && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 shrink-0 mt-0.5">
                    Hammad AI
                  </span>
                  <div className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
                    {lastAssistantSpeech}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Embedded YouTube Theater Player (Honest & Accurate) */}
        {activeYouTube && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-bold text-slate-200">
                  {activeYouTube.isExact ? 'Playing Video: ' : 'YouTube Results for: '}
                  <span className="text-rose-400">{activeYouTube.query}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeYouTube.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 transition-colors font-medium shadow-sm"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setActiveYouTube(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {activeYouTube.videoId ? (
                <iframe
                  title="YouTube Video Player"
                  className="w-full h-full border-0"
                  src={`https://www.youtube.com/embed/${activeYouTube.videoId}?autoplay=1&enablejsapi=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Youtube className="w-12 h-12 text-rose-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-200">
                    YouTube Search Opened in New Tab
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Search query for "{activeYouTube.query}" was launched directly on YouTube.
                  </p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(activeYouTube.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    <span>Click to view results on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Voice Command Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Voice Commands (Click to Test Instantly)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleCommandExecution(cmd.text)}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                  {cmd.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                  "{cmd.text}"
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action History Log */}
        {actionHistory.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Executed Actions & App Signals
            </div>
            <div className="space-y-2">
              {actionHistory.map((act) => (
                <div
                  key={act.id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        act.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {act.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">{act.title}</div>
                      <div className="text-slate-400 text-[11px]">{act.details}</div>
                    </div>
                  </div>

                  {act.url && (
                    <a
                      href={act.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
