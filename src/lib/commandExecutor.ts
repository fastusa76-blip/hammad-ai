// Multilingual Voice & Text Command Dispatcher for Applications, YouTube, and AI
import { ExecutedAction } from '../types';
import { sendChatMessage } from './api';

// Desktop WebSocket Bridge connection
let bridgeSocket: WebSocket | null = null;
let isBridgeConnected = false;
let bridgeListeners: Array<(connected: boolean) => void> = [];

export function initDesktopBridge(port = 8765) {
  try {
    if (bridgeSocket) {
      bridgeSocket.close();
    }
    bridgeSocket = new WebSocket(`ws://localhost:${port}`);

    bridgeSocket.onopen = () => {
      console.log('[Hammad AI Bridge] Connected to local desktop agent on port', port);
      isBridgeConnected = true;
      bridgeListeners.forEach((l) => l(true));
    };

    bridgeSocket.onclose = () => {
      isBridgeConnected = false;
      failPendingBridgeRequests();
      bridgeListeners.forEach((l) => l(false));
    };

    bridgeSocket.onmessage = (event) => {
      try {
        const response = JSON.parse(String(event.data)) as { requestId?: string; status?: string };
        if (!response.requestId) return;
        const pending = pendingBridgeRequests.get(response.requestId);
        if (!pending) return;
        clearTimeout(pending.timeout);
        pendingBridgeRequests.delete(response.requestId);
        pending.resolve(response.status === 'ok');
      } catch (err) {
        console.warn('[Hammad AI Bridge] Invalid response:', err);
      }
    };

    bridgeSocket.onerror = () => {
      isBridgeConnected = false;
      failPendingBridgeRequests();
      bridgeListeners.forEach((l) => l(false));
    };
  } catch (err) {
    isBridgeConnected = false;
    bridgeListeners.forEach((l) => l(false));
  }
}

export function onBridgeStatusChange(listener: (connected: boolean) => void) {
  bridgeListeners.push(listener);
  listener(isBridgeConnected);
  return () => {
    bridgeListeners = bridgeListeners.filter((l) => l !== listener);
  };
}

export function isDesktopBridgeActive(): boolean {
  return isBridgeConnected;
}

type PendingBridgeRequest = {
  resolve: (success: boolean) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const pendingBridgeRequests = new Map<string, PendingBridgeRequest>();

function failPendingBridgeRequests() {
  for (const [requestId, pending] of pendingBridgeRequests) {
    clearTimeout(pending.timeout);
    pending.resolve(false);
    pendingBridgeRequests.delete(requestId);
  }
}

export function sendCommandToBridge(
  command: { action: string; app?: string; cmd?: string; url?: string; query?: string }
): Promise<boolean> {
  if (!bridgeSocket || bridgeSocket.readyState !== WebSocket.OPEN) {
    return Promise.resolve(false);
  }

  const requestId = crypto.randomUUID();
  return new Promise((resolve) => {
    const timeoutMs = command.action === 'youtube_play' ? 20000 : 5000;
    const timeout = setTimeout(() => {
      pendingBridgeRequests.delete(requestId);
      resolve(false);
    }, timeoutMs);

    pendingBridgeRequests.set(requestId, { resolve, timeout });
    try {
      bridgeSocket!.send(JSON.stringify({ ...command, requestId }));
    } catch {
      clearTimeout(timeout);
      pendingBridgeRequests.delete(requestId);
      resolve(false);
    }
  });
}

// Curated verified YouTube video IDs ONLY for exact, known popular titles
const CURATED_YOUTUBE_VIDEOS: Record<string, { id: string; title: string }> = {
  pasoori: { id: '5Eqb_-j3FDA', title: 'Pasoori - Ali Sethi & Shae Gill (Coke Studio)' },
  'ali sethi': { id: '5Eqb_-j3FDA', title: 'Pasoori - Ali Sethi & Shae Gill' },
  'coke studio': { id: 'JFcgOboErgk', title: 'Coke Studio Season Hits' },
  'cokestudio': { id: 'JFcgOboErgk', title: 'Coke Studio Season Hits' },
  'lofi': { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio' },
  'lo-fi': { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio' },
};

export interface ParseResult {
  intent: 'youtube' | 'app_launch' | 'question_answer';
  target?: string;
  query?: string;
  videoId?: string;
  isExactMatch?: boolean;
  spokenFeedback: string;
  actionCard?: ExecutedAction;
}

export async function processVoiceCommand(
  rawTranscript: string,
  apiKey?: string
): Promise<ParseResult> {
  const text = rawTranscript.trim();
  const lower = text.toLowerCase();

  const isUrduScript = /[\u0600-\u06FF]/.test(text);
  const isHindiScript = /[\u0900-\u097F]/.test(text);

  // 1. YOUTUBE COMMANDS: opening YouTube is separate from playing/searching a song.
  const normalized = lower.replace(/[.!?]+/g, '').trim();
  const mentionsYouTube =
    /\byoutube\b/i.test(text) ||
    text.includes('یوٹیوب') ||
    text.includes('یو ٹیوب') ||
    text.includes('यूट्यूब');

  const isBareYouTubeCommand =
    /^(youtube|open youtube|open up youtube|launch youtube|start youtube|go to youtube|show youtube|youtube please)$/i.test(normalized) ||
    /^(youtube|یوٹیوب|یو ٹیوب|यूट्यूब)\s*(کھولو|کھولیں|کھول دو|اوپن کرو|چلاو|چلاؤ|اوپن|کھول دو)?$/i.test(normalized) ||
    /^(youtube|youtube ko)\s+(kholo|khol do|open karo|chalao)$/i.test(normalized) ||
    /^(यूट्यूब|यूट्यूब को)\s*(खोलो|खोल दो|ओपन करो)?$/i.test(normalized);

  const hasSongAction =
    /\b(play|playing|song|music|listen|search|find)\b/i.test(lower) ||
    /\b(gana|gaana|bajao|sunao|chalao|chala do)\b/i.test(lower) ||
    /گانا|گانے|نغمہ|موسیقی|چلاؤ|چلاو|بجاؤ|سناؤ|پلے|سناؤ/.test(text) ||
    /गाना|गीत|बजाओ|सुनाओ|चलाओ|प्ले/.test(text);

  const isYouTubeCommand = isBareYouTubeCommand || (mentionsYouTube && hasSongAction) ||
    /^(play|playing)\s+/i.test(lower) ||
    /\b(gana chalao|gaana chalao|song chalao|gana play)\b/i.test(lower) ||
    /^(گانا|گانے|موسیقی|نغمہ|गाना|गीत)/.test(text);

  if (isYouTubeCommand && !lower.includes('chrome') && !text.includes('کروم') &&
      !lower.includes('android') && !text.includes('اینڈرائیڈ')) {
    const bridgeActive = isDesktopBridgeActive();

    // "Open YouTube" must only open the homepage. Never invent a default song.
    if (isBareYouTubeCommand || (mentionsYouTube && !hasSongAction)) {
      const homeUrl = 'https://www.youtube.com/';
      let openedByBridge = false;
      if (bridgeActive) {
        openedByBridge = await sendCommandToBridge({ action: 'open_url', url: homeUrl });
      }
      if (!openedByBridge) {
        try { window.open(homeUrl, '_blank', 'noopener,noreferrer'); } catch { /* popup may be blocked */ }
      }

      return {
        intent: 'youtube',
        query: '',
        spokenFeedback: isUrduScript
          ? 'یوٹیوب کھول رہا ہوں۔ ابھی کوئی گانا تلاش نہیں کیا گیا۔'
          : isHindiScript
          ? 'YouTube खोल रहा हूँ। अभी कोई गाना सर्च नहीं किया गया।'
          : 'Opening YouTube in a new tab. I have not searched for or played a song.',
        actionCard: {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'youtube',
          title: 'Open YouTube',
          details: openedByBridge
            ? 'Opened the YouTube homepage in your default browser.'
            : 'Requested a new browser tab for the YouTube homepage.',
          status: 'success',
          url: homeUrl,
        },
      };
    }

    let cleanQuery = text
      .replace(/open up youtube|open youtube|launch youtube|start youtube|go to youtube/gi, ' ')
      .replace(/youtube|یوٹیوب|یو ٹیوب|यूट्यूब/gi, ' ')
      .replace(/on youtube|youtube par|youtube pe/gi, ' ')
      .replace(/please|play|playing|song|music|listen to|search for|search|find|open|the|a|on|and|then/gi, ' ')
      .replace(/gana|gaana|bajao|sunao|chalao|chala do|karo|kar do|par|pe/gi, ' ')
      .replace(/گانا|گانے|نغمہ|موسیقی|چلاؤ|چلاو|بجاؤ|سناؤ|پلے|کرو|کوئی|اچھا|پر|پہ|میں/g, ' ')
      .replace(/गाना|गीत|बजाओ|सुनाओ|चलाओ|प्ले|करो|पर/g, ' ')
      .replace(/[,:;.!?]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanQuery) {
      const homeUrl = 'https://www.youtube.com/';
      try { window.open(homeUrl, '_blank', 'noopener,noreferrer'); } catch { /* popup may be blocked */ }
      return {
        intent: 'youtube',
        query: '',
        spokenFeedback: isUrduScript ? 'یوٹیوب کھول رہا ہوں۔ گانے کا نام بھی بتا دیں۔' : 'Opening YouTube. Please also say the song title if you want music played.',
        actionCard: {
          id: crypto.randomUUID(), timestamp: Date.now(), type: 'youtube',
          title: 'Open YouTube', details: 'No song title was detected; opened the YouTube homepage.',
          status: 'info', url: homeUrl,
        },
      };
    }

    const queryLower = cleanQuery.toLowerCase();
    let exactVideoId: string | undefined;
    let exactTitle: string | undefined;
    for (const [key, item] of Object.entries(CURATED_YOUTUBE_VIDEOS)) {
      if (queryLower.includes(key)) {
        exactVideoId = item.id;
        exactTitle = item.title;
        break;
      }
    }

    const isExact = Boolean(exactVideoId);
    const targetUrl = exactVideoId
      ? 'https://www.youtube.com/watch?v=' + exactVideoId + '&autoplay=1'
      : 'https://www.youtube.com/results?search_query=' + encodeURIComponent(cleanQuery);
    let playedByBridge = false;

    // The local bridge can resolve arbitrary song names to a YouTube watch URL using yt-dlp,
    // then open that video in a new browser tab. This avoids requiring a Google API key.
    if (bridgeActive) {
      playedByBridge = await sendCommandToBridge({
        action: 'youtube_play',
        query: cleanQuery,
      });
    }

    if (!playedByBridge) {
      try { window.open(targetUrl, '_blank', 'noopener,noreferrer'); } catch { /* popup may be blocked */ }
    }

    const playingConfirmed = isExact || playedByBridge;
    const spokenFeedback = playingConfirmed
      ? isUrduScript
        ? 'یوٹیوب پر "' + (exactTitle || cleanQuery) + '" چلانے کے لیے کھول دیا ہے۔'
        : isHindiScript
        ? 'YouTube पर "' + (exactTitle || cleanQuery) + '" चलाने के लिए खोल दिया है।'
        : 'Opening "' + (exactTitle || cleanQuery) + '" to play on YouTube.'
      : isUrduScript
      ? 'گانے کے نتائج کھول دیے ہیں۔ خودکار پلے کے لیے Desktop Bridge چلائیں اور "pip install websockets yt-dlp" انسٹال کریں۔'
      : 'Opened YouTube search results. For automatic playback, start the Desktop Bridge and install "pip install websockets yt-dlp".';

    return {
      intent: 'youtube',
      query: cleanQuery,
      videoId: exactVideoId,
      isExactMatch: isExact,
      spokenFeedback,
      actionCard: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'youtube',
        title: playingConfirmed ? 'YouTube: ' + (exactTitle || cleanQuery) : 'YouTube Search: "' + cleanQuery + '"',
        details: playedByBridge
          ? 'Desktop Bridge resolved the requested song and opened its YouTube watch page.'
          : isExact
          ? 'Known video opened directly with autoplay requested.'
          : 'Search results opened. Automatic playback requires the local bridge and yt-dlp.',
        status: playingConfirmed ? 'success' : 'info',
        url: targetUrl,
        youtubeVideoId: exactVideoId,
      },
    };
  }

  // 2. CHECK FOR APPLICATION LAUNCH COMMANDS WITH HONEST STATUS REPORTING
  const bridgeActive = isDesktopBridgeActive();

  // A. GOOGLE CHROME
  const isChromeCommand =
    lower.includes('chrome') ||
    lower.includes('google chrome') ||
    lower.includes('browser') ||
    text.includes('کروم') ||
    text.includes('گوگل کروم') ||
    text.includes('براؤزر') ||
    text.includes('क्रोम');

  if (isChromeCommand) {
    let bridgeSent = false;
    if (bridgeActive) {
      bridgeSent = await sendCommandToBridge({ action: 'launch', app: 'chrome' });
    }

    // Always attempt web trigger as fallback
    try {
      window.open('https://www.google.com', '_blank');
    } catch (e) {
      // ignore
    }

    let spokenFeedback = '';
    let detailsMessage = '';

    if (bridgeSent) {
      spokenFeedback = isUrduScript
        ? 'لوکل برج کے ذریعے آپ کے لیپ ٹاپ پر گوگل کروم چلایا جا رہا ہے!'
        : 'Launching Google Chrome native process on your laptop via Desktop Bridge.';
      detailsMessage = 'Native Google Chrome process launched via Desktop Bridge (ws://localhost:8765).';
    } else if (!bridgeActive) {
      spokenFeedback = isUrduScript
        ? 'لوکل برج کنیکٹ نہیں ہے، اس لیے براؤزر میں گوگل کھولا گیا ہے۔ اصل کروم چلانے کے لیے python hammad_bridge.py چلائیں۔'
        : 'Desktop Bridge is offline. Opened Google in a browser tab. Run "python hammad_bridge.py" to launch the native Chrome app.';
      detailsMessage = 'Web tab opened. Native Chrome was not launched because Desktop Bridge is offline.';
    } else {
      spokenFeedback = isUrduScript
        ? 'اصل کروم نہیں چل سکا، اس لیے براؤزر میں گوگل کھولا گیا ہے۔ برج کنسول میں خرابی دیکھیں۔'
        : 'Native Chrome launch was not confirmed. Opened Google in a browser tab; check the bridge console.';
      detailsMessage = 'Web tab opened as fallback. The Desktop Bridge did not confirm native Chrome launch.';
    }

    const actionCard: ExecutedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'app',
      title: bridgeSent ? 'Google Chrome (Native App)' : 'Google (Web Fallback)',
      details: detailsMessage,
      status: bridgeSent ? 'success' : 'info',
      url: 'https://www.google.com',
    };

    return {
      intent: 'app_launch',
      target: 'chrome',
      spokenFeedback,
      actionCard,
    };
  }

  // B. ANDROID STUDIO
  const isAndroidStudioCommand =
    lower.includes('android studio') ||
    lower.includes('androidstudio') ||
    lower.includes('android') ||
    text.includes('اینڈرائیڈ اسٹوڈیو') ||
    text.includes('اینڈروئیڈ اسٹوڈیو') ||
    text.includes('اینڈرائیڈ') ||
    text.includes('اینڈروئیڈ') ||
    text.includes('एंड्रॉयड स्टूडियो');

  if (isAndroidStudioCommand) {
    let bridgeSent = false;
    if (bridgeActive) {
      bridgeSent = await sendCommandToBridge({ action: 'launch', app: 'android-studio' });
    }

    let spokenFeedback = '';
    let detailsMessage = '';

    if (bridgeSent) {
      spokenFeedback = isUrduScript
        ? 'لوکل برج کے ذریعے آپ کے لیپ ٹاپ پر اینڈرائیڈ اسٹوڈیو چلایا جا رہا ہے!'
        : 'Launching Android Studio native app on your laptop via Desktop Bridge.';
      detailsMessage = 'Native Android Studio (studio64.exe) launch signal dispatched via Desktop Bridge.';
    } else if (!bridgeActive) {
      spokenFeedback = isUrduScript
        ? 'اینڈرائیڈ اسٹوڈیو چلانے کے لیے لوکل برج کنیکٹ کریں۔ ٹرمینل میں python hammad_bridge.py رن کریں۔'
        : 'Desktop Bridge is offline. Start python hammad_bridge.py in your terminal.';
      detailsMessage = 'Desktop Bridge is offline; native Android Studio launch was not attempted.';
    } else {
      spokenFeedback = isUrduScript
        ? 'اینڈرائیڈ اسٹوڈیو نہیں کھل سکا۔ برج کنسول میں خرابی دیکھیں اور انسٹالیشن چیک کریں۔'
        : 'Android Studio did not launch. Check the bridge console and installation path.';
      detailsMessage = 'Bridge did not confirm Android Studio launch. Check whether the app is installed.';
    }

    const actionCard: ExecutedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'app',
      title: bridgeSent ? 'Android Studio (Native App)' : 'Android Studio (Bridge Required)',
      details: detailsMessage,
      status: bridgeSent ? 'success' : 'info',
      url: 'https://developer.android.com/studio',
    };

    return {
      intent: 'app_launch',
      target: 'android-studio',
      spokenFeedback,
      actionCard,
    };
  }

  // C. VS CODE
  const isVsCodeCommand =
    lower.includes('vs code') ||
    lower.includes('vscode') ||
    text.includes('وی ایس کوڈ') ||
    text.includes('کوڈ');

  if (isVsCodeCommand) {
    let bridgeSent = false;
    if (bridgeActive) {
      bridgeSent = await sendCommandToBridge({ action: 'launch', app: 'vscode' });
    }

    try {
      window.open('vscode://', '_self');
    } catch (e) {
      // ignore
    }

    const spokenFeedback = bridgeSent
      ? isUrduScript
        ? 'لوکل برج کے ذریعے وی ایس کوڈ چلایا جا رہا ہے!'
        : 'Launching Visual Studio Code on your laptop.'
      : isUrduScript
      ? 'وی ایس کوڈ کا پروٹوکول اوپن کیا گیا ہے۔ مکمل لانچ کے لیے لوکل برج چلائیں۔'
      : bridgeActive ? 'VS Code launch was not confirmed. Check the bridge console.' : 'Triggered vscode:// protocol. For direct executable launch, connect Desktop Bridge.';

    return {
      intent: 'app_launch',
      target: 'vscode',
      spokenFeedback,
      actionCard: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'app',
        title: 'Visual Studio Code',
        details: bridgeSent ? 'Desktop Bridge confirmed the VS Code launch request.' : bridgeActive ? 'Desktop Bridge did not confirm the VS Code launch.' : 'Triggered vscode:// scheme. Bridge is offline.',
        status: bridgeSent ? 'success' : 'info',
        url: 'vscode://',
      },
    };
  }

  // D. CALCULATOR
  const isCalcCommand =
    lower.includes('calc') ||
    lower.includes('calculator') ||
    text.includes('کیلکولیٹر');

  if (isCalcCommand) {
    let bridgeSent = false;
    if (bridgeActive) {
      bridgeSent = await sendCommandToBridge({ action: 'launch', app: 'calculator' });
    }

    const spokenFeedback = bridgeSent
      ? isUrduScript
        ? 'کیلکولیٹر کھولا جا رہا ہے!'
        : 'Opening Calculator on your laptop.'
      : isUrduScript
      ? 'کیلکولیٹر چلانے کے لیے لوکل برج کنیکٹ کریں۔'
      : 'Calculator requires the local bridge to open on Windows/Mac.';

    return {
      intent: 'app_launch',
      target: 'calculator',
      spokenFeedback,
      actionCard: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'app',
        title: 'Calculator',
        details: bridgeSent ? 'Desktop Bridge confirmed the calculator launch request.' : bridgeActive ? 'Desktop Bridge did not confirm calculator launch.' : 'Desktop Bridge offline; run python hammad_bridge.py to start local tools.',
        status: bridgeSent ? 'success' : 'info',
      },
    };
  }

  // 3. GENERAL AI QUESTION & ANSWER (Gemini 2.5 with transparent fallback)
  try {
    const promptInstruction = isUrduScript
      ? 'آپ حماد اے آئی کے وائس اسسٹنٹ ہیں۔ صارف کے سوال کا جواب اردو میں شستہ، براہِ راست، درست اور قدرتی آواز میں 1 سے 2 جملوں میں دیں۔'
      : isHindiScript
      ? 'आप हम्माद एआई वॉयس असिस्टेंट हैं। पूछे गए सवाल का सटीक, विनम्र और संक्षिप्त (1-2 वाक्यों में) जवाब हिन्दी में दें।'
      : 'You are Hammad AI Voice Assistant. Answer the question accurately, naturally, and concisely (1-2 sentences) in a polite, engaging tone.';

    const aiResponse = await sendChatMessage({
      messages: [{ role: 'user', content: text }],
      systemInstruction: promptInstruction,
      apiKey,
    });

    const reply = aiResponse.text;

    const actionCard: ExecutedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'answer',
      title: text.slice(0, 35) + (text.length > 35 ? '...' : ''),
      details: reply,
      status: 'success',
    };

    return {
      intent: 'question_answer',
      query: text,
      spokenFeedback: reply,
      actionCard,
    };
  } catch (err: any) {
    const fallbackReply = isUrduScript
      ? `میں نے آپ کی بات سن لی ہے: "${text}"۔ میں کروم، اینڈرائیڈ اسٹوڈیو، یا یوٹیوب پر گانے چلا سکتا ہوں۔`
      : `I heard: "${text}". I can launch Chrome, Android Studio, or search YouTube for you!`;

    return {
      intent: 'question_answer',
      query: text,
      spokenFeedback: fallbackReply,
      actionCard: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'answer',
        title: 'Voice Assistant Response',
        details: fallbackReply,
        status: 'info',
      },
    };
  }
}
