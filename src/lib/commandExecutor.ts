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
      bridgeListeners.forEach((l) => l(false));
    };

    bridgeSocket.onerror = () => {
      isBridgeConnected = false;
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

export function sendCommandToBridge(command: { action: string; app?: string; cmd?: string }) {
  if (bridgeSocket && bridgeSocket.readyState === WebSocket.OPEN) {
    bridgeSocket.send(JSON.stringify(command));
    return true;
  }
  return false;
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

  // 1. YOUTUBE COMMAND IDENTIFICATION
  const isYouTubeCommand =
    lower.includes('youtube') ||
    lower.startsWith('play ') ||
    lower.includes('play song') ||
    lower.includes('gana chalao') ||
    lower.includes('gaana chalao') ||
    lower.includes('song chalao') ||
    lower.includes('gana play') ||
    lower.includes('bajao') ||
    lower.includes('sunao') ||
    text.includes('یوٹیوب') ||
    text.includes('یو ٹیوب') ||
    text.includes('گانا') ||
    text.includes('گانے') ||
    text.includes('نغمہ') ||
    text.includes('موسیقی') ||
    text.includes('چلاؤ') ||
    text.includes('چلاو') ||
    text.includes('بجاؤ') ||
    text.includes('سناؤ') ||
    text.includes('यूट्यूब') ||
    text.includes('गाना') ||
    text.includes('गीत');

  if (
    isYouTubeCommand &&
    !lower.includes('chrome') &&
    !text.includes('کروم') &&
    !lower.includes('android') &&
    !text.includes('اینڈرائیڈ')
  ) {
    let cleanQuery = text
      .replace(/یوٹیوب/g, '')
      .replace(/یو ٹیوب/g, '')
      .replace(/پر/g, '')
      .replace(/پہ/g, '')
      .replace(/میں/g, '')
      .replace(/گانا/g, '')
      .replace(/گانے/g, '')
      .replace(/نغمہ/g, '')
      .replace(/چلاؤ/g, '')
      .replace(/چلاو/g, '')
      .replace(/بجاؤ/g, '')
      .replace(/سناؤ/g, '')
      .replace(/پلے/g, '')
      .replace(/کرو/g, '')
      .replace(/کوئی/g, '')
      .replace(/اچھا/g, '')
      .replace(/यूट्यूब/g, '')
      .replace(/पर/g, '')
      .replace(/गाना/g, '')
      .replace(/गीत/g, '')
      .replace(/चलाओ/g, '')
      .replace(/बजाओ/g, '')
      .replace(/सुनाओ/g, '')
      .replace(/play/gi, '')
      .replace(/on youtube/gi, '')
      .replace(/youtube par/gi, '')
      .replace(/youtube pe/gi, '')
      .replace(/youtube/gi, '')
      .replace(/song/gi, '')
      .replace(/chalao/gi, '')
      .replace(/karo/gi, '')
      .replace(/bajao/gi, '')
      .replace(/sunao/gi, '')
      .replace(/gana/gi, '')
      .replace(/gaana/gi, '')
      .trim();

    if (!cleanQuery) {
      cleanQuery = isUrduScript ? 'پاسوری' : 'Pasoori';
    }

    const queryLower = cleanQuery.toLowerCase();
    let exactVideoId: string | undefined = undefined;
    let exactTitle: string | undefined = undefined;

    for (const [key, item] of Object.entries(CURATED_YOUTUBE_VIDEOS)) {
      if (queryLower.includes(key)) {
        exactVideoId = item.id;
        exactTitle = item.title;
        break;
      }
    }

    const isExact = Boolean(exactVideoId);
    const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;

    // Try to open YouTube search immediately in new tab for user
    try {
      window.open(targetUrl, '_blank');
    } catch (e) {
      // browser popup might be blocked; UI action card provides button
    }

    const spokenFeedback = isExact
      ? isUrduScript
        ? `یوٹیوب پر "${exactTitle}" چلایا جا رہا ہے!`
        : `Playing "${exactTitle}" on YouTube.`
      : isUrduScript
      ? `یوٹیوب پر "${cleanQuery}" تلاش کر کے نتائج کھولے جا رہے ہیں!`
      : `Searching YouTube for "${cleanQuery}" and opening search results.`;

    const actionCard: ExecutedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'youtube',
      title: isExact ? `YouTube: ${exactTitle}` : `YouTube Search: "${cleanQuery}"`,
      details: isExact
        ? `Matched official video. Playing in Hammad AI Theater Player.`
        : `Opened YouTube search results for "${cleanQuery}". Click button to view in YouTube.`,
      status: 'success',
      url: targetUrl,
      youtubeVideoId: exactVideoId,
    };

    return {
      intent: 'youtube',
      query: cleanQuery,
      videoId: exactVideoId,
      isExactMatch: isExact,
      spokenFeedback,
      actionCard,
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
      bridgeSent = sendCommandToBridge({ action: 'launch', app: 'chrome' });
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
    } else {
      spokenFeedback = isUrduScript
        ? 'لوکل برج کنیکٹ نہیں ہے، اس لیے براؤزر میں گوگل کھولا گیا ہے۔ لیپ ٹاپ کی اصل ایپ چلانے کے لیے python hammad_bridge.py چلائیں۔'
        : 'Desktop Bridge is offline. Opened Google in a new browser tab. Run "python hammad_bridge.py" to launch the native app on your laptop.';
      detailsMessage = 'Web tab opened. Native desktop process was NOT launched because Desktop Bridge is offline.';
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
      bridgeSent = sendCommandToBridge({ action: 'launch', app: 'android-studio' });
    }

    let spokenFeedback = '';
    let detailsMessage = '';

    if (bridgeSent) {
      spokenFeedback = isUrduScript
        ? 'لوکل برج کے ذریعے آپ کے لیپ ٹاپ پر اینڈرائیڈ اسٹوڈیو چلایا جا رہا ہے!'
        : 'Launching Android Studio native app on your laptop via Desktop Bridge.';
      detailsMessage = 'Native Android Studio (studio64.exe) launch signal dispatched via Desktop Bridge.';
    } else {
      spokenFeedback = isUrduScript
        ? 'اینڈرائیڈ اسٹوڈیو چلانے کے لیے لوکل برج کنیکٹ کریں۔ ٹرمینل میں python hammad_bridge.py رن کریں۔'
        : 'Desktop Bridge is offline. To launch Android Studio on your laptop, start python hammad_bridge.py in your terminal.';
      detailsMessage = 'Desktop Bridge (ws://localhost:8765) is offline. Android Studio requires the companion bridge to start on Windows/Mac.';
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
      bridgeSent = sendCommandToBridge({ action: 'launch', app: 'vscode' });
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
      : 'Triggered vscode:// protocol. For direct executable launch, connect Desktop Bridge.';

    return {
      intent: 'app_launch',
      target: 'vscode',
      spokenFeedback,
      actionCard: {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'app',
        title: 'Visual Studio Code',
        details: bridgeSent ? 'Dispatched native code launch.' : 'Triggered vscode:// scheme. Bridge is offline.',
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
      bridgeSent = sendCommandToBridge({ action: 'launch', app: 'calculator' });
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
        details: bridgeSent ? 'Launched native calculator.' : 'Desktop Bridge offline; run python hammad_bridge.py to start local tools.',
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
