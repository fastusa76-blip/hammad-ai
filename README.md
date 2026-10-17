# 🎙️ Hammad AI — Intelligent Voice Command Assistant & Studio

> **مکمل فنکشنل وائس اے آئی اسسٹنٹ**، ایپلی کیشن لانچر (Chrome، Android Studio وغیرہ) اور یوٹیوب تھیٹر پلیئر۔  
> A full-stack, multilingual Voice AI Assistant powered by Google Gemini, capable of launching local laptop applications, playing YouTube videos, answering questions with speech, and running advanced prompt/flow engineering pipelines.

---

## 🌟 اہم خصوصیات (Key Capabilities)

1. **مکمل وائس کمانڈ سسٹم (Speech-to-Text & Text-to-Speech)**:
   - قدرتی آواز کی شناخت (Speech Recognition) برائے **اردو (Urdu)**، **ہندی (Hindi)** اور **انگریزی (English)**۔
   - خودکار بولنے والا اسسٹنٹ (Text-to-Speech) جو قدرتی آواز میں جواب سناتا ہے۔
   - متحرک نیین ساؤنڈ ویوز اور پلزنگ AI Voice Orb۔

2. **لیپ ٹاپ کی ایپلی کیشنز چلانا (Laptop Application Launcher)**:
   - **Google Chrome**: کہیں *"کروم چلاؤ"* یا *"Laptop ka Chrome chalao"* اور کروم کھل جائے گا۔
   - **Android Studio**: کہیں *"اینڈرائیڈ اسٹوڈیو کھولو"* یا *"Launch Android Studio"* اور اسٹوڈیو لانچ ہو جائے گا۔
   - **VS Code & Calculator**: کوڈ ایڈیٹر اور دیگر ٹولز کو وائس کمانڈ سے لانچ کریں۔
   - **Local Desktop Companion Bridge**: ایک محفوظ لوکل WebSocket پل جو ویب براؤزر کو آپ کے کمپیوٹر کی مقامی ایپس سے جوڑتا ہے۔

3. **YouTube میڈیا اور وائس کمانڈز (YouTube Voice Commands)**:
   - صرف *"Open YouTube"* یا *"یوٹیوب کھولو"* کہیں تو نیا ٹیب YouTube ہوم پیج کھولے گا؛ کوئی ڈیفالٹ گانا تلاش نہیں ہوگا۔
   - *"Play Pasoori on YouTube"* یا *"Open YouTube and play Enifeslam"* کہیں تو مطلوبہ گانا کھولنے کی کوشش کرے گا۔
   - کسی بھی گانے کو خودکار طور پر چلانے کے لیے Local Desktop Bridge اور `yt-dlp` درکار ہیں؛ یہ صرف YouTube کا watch page کھولتا ہے، ویڈیو ڈاؤن لوڈ نہیں کرتا۔

4. **Gemini 2.5 AI انٹیلیجنس**:
   - عام سوالات، کوڈنگ، منطق اور تحقیق کے تمام سوالات کے فوری اور درست جوابات۔

---

## 💻 پاور شیل کے ذریعے مکمل انسٹالیشن (PowerShell Setup Guide)

ونڈوز (Windows) پر **PowerShell** کو **Run as Administrator** یا نارمل کھولیں اور نیچے دیے گئے مراحل پر عمل کریں:

### مرحلہ 1: ریپوزٹری کلون کریں (Clone Repository)

```powershell
# گٹ ہب ریپوزٹری کو کلون کریں
git clone https://github.com/fastusa76-blip/hammad-ai.git

# پروجیکٹ کے فولڈر میں داخل ہوں
cd hammad-ai
```

---

### مرحلہ 2: نوڈ پیکجز انسٹال کریں (Install Dependencies)

> **نوٹ:** یقینی بنائیں کہ آپ کے پاس **Node.js (v20 یا v22)** انسٹال ہے۔ چیک کرنے کے لیے `node -v` لکھیں۔

```powershell
# تمام ضروری لائبریریز انسٹال کریں
npm install
```

---

### مرحلہ 3: ماحول کی سیٹنگز (.env Setup)

```powershell
# .env فائل تیار کریں
Copy-Item .env.example .env

# آپ اپنی Gemini API Key اس میں شامل کر سکتے ہیں (اختیاری)
# notepad .env
```

---

### مرحلہ 4: ایپ چلائیں (Run Development Server)

```powershell
# سرور اور ری ایکٹ فرنٹ اینڈ کو چلائیں
npm run dev
```

اب اپنے براؤزر میں کھولیں:  
👉 **`http://localhost:3000`**

---

## ⚡ لیپ ٹاپ ایپس کو کنٹرول کرنے کا طریقہ (Local Desktop Bridge)

اگر آپ چاہتے ہیں کہ ویب اسسٹنٹ آپ کے لیپ ٹاپ پر حقیقی **Google Chrome**، **Android Studio** اور **VS Code** کھولے، تو لوکل برج کو ایک نئے PowerShell ٹیب میں چلائیں:

```powershell
# نیا PowerShell ونڈو کھولیں اور ریپو فولڈر میں جائیں
cd hammad-ai

# Python کے لیے WebSocket اور YouTube سرچ پیکجز انسٹال کریں
python -m pip install websockets yt-dlp

# لوکل ڈیسک ٹاپ برج چلائیں
python hammad_bridge.py
```

چلانے کے بعد اسکرین پر ظاہر ہوگا:
```text
============================================================
   HAMMAD AI - LOCAL DESKTOP COMPANION BRIDGE
   Platform: Windows (10/11)
   WebSocket Server: ws://localhost:8765
[*] Waiting for Hammad Voice AI browser connection...
============================================================
```

جیسے ہی آپ براؤزر میں بولیں گے *"کروم چلاؤ"* یا *"اینڈرائیڈ اسٹوڈیو کھولو"*، وہ فوراً آپ کے لیپ ٹاپ پر کھل جائیں گے!

---

## 🗣️ وائس کمانڈز کی فہرست (Voice Command Cheat Sheet)

| مطلوبہ کام | اردو میں بولیں (Urdu) | Roman / English |
|---|---|---|
| **کروم چلائیں** | *"کروم چلاؤ"* یا *"گوگل کروم کھولو"* | `Chrome chalao` / `Open Chrome` |
| **اینڈرائیڈ اسٹوڈیو** | *"اینڈرائیڈ اسٹوڈیو کھولو"* | `Android Studio chalao` / `Launch Android Studio` |
| **صرف YouTube کھولیں** | *"یوٹیوب کھولو"* | `Open YouTube` / `YouTube kholo` |
| **گانا خودکار چلائیں** | *"پاسوری چلاؤ"* | `Play Pasoori on YouTube` / `Open YouTube and play Enifeslam` |
| **وی ایس کوڈ** | *"وی ایس کوڈ چلاؤ"* | `VS Code chalao` / `Open VS Code` |
| **کیلکولیٹر** | *"کیلکولیٹر کھولو"* | `Calculator chalao` / `Open Calculator` |
| **عام سوالات** | *"آرٹیفیشل انٹیلیجنس کیا ہے؟"* | `What is Machine Learning?` |
| **تعارف** | *"آپ کون ہیں؟"* | `Who are you?` |

---

## 📁 پروجیکٹ کی ساخت (Project Structure)

```text
hammad-ai/
├── hammad_bridge.py          # لوکل ڈیسک ٹاپ برج برائے Chrome اور Android Studio
├── server.ts                 # Express API سرور + Gemini 2.5 پراکسی روٹس
├── src/
│   ├── components/
│   │   ├── VoiceAssistantView.tsx   # مرکزی وائس اے آئی انٹرفیس مع اورب اور تھیٹر پلیئر
│   │   ├── ChatView.tsx             # ملٹی ماڈل اے آئی چیٹ سسٹم
│   │   ├── PromptStudioView.tsx     # پرامپٹ آپٹیمائزر اور ٹیسٹر
│   │   ├── FlowBuilderView.tsx      # ملٹی اسٹیپ پائپ لائن بلڈر
│   │   ├── ScriptStudioView.tsx     # یوٹیوب و میڈیا اسکرپٹ جنریٹر
│   │   ├── DesktopBridgeModal.tsx   # برج سیٹ اپ گائیڈ اور اسٹیٹس
│   │   ├── Header.tsx               # نیویگیشن و کنٹرول بار
│   │   └── Sidebar.tsx              # ہسٹری اور سیشن مینیجر
│   ├── lib/
│   │   ├── voice.ts                 # مائیکروفون پرمیشن و Web Speech API ہینڈلر
│   │   ├── commandExecutor.ts       # کثیر اللسانی کمانڈ ڈسپیچر برائے ایپس و یوٹیوب
│   │   └── api.ts                   # کلائنٹ اے پی آئی کالز
│   ├── types.ts                     # ٹائپ اسکرپٹ انٹرفیسز
│   ├── App.tsx                      # مین ری ایکٹ ایپلی کیشن
│   └── main.tsx                     # انٹری پوائنٹ
├── package.json              # ڈیپینڈینسیز مینی فیسٹ
├── vite.config.ts            # وائٹ کنفیگریشن
└── README.md                 # مکمل دستاویزی گائیڈ
```

---

## 🔧 خرابیوں کا حل (Troubleshooting)

1. **براؤزر میں مائیکروفون کی اجازت نہ ملنا**:
   - ایڈریس بار (Address Bar) میں موجود **لاک آئیکون (Lock Icon)** پر کلک کریں اور **Microphone** کو **Allow** کریں۔
2. **پاور شیل اسکرپٹ ایگزیکیوشن پالیسی ایرر (ExecutionPolicy)**:
   - اگر پاور شیل میں ایرر آئے تو ایڈمن پاور شیل میں یہ چلائیں:
     ```powershell
     Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
     ```
3. **پورٹ 3000 یا 8765 کا مصروف ہونا**:
   - اگر پورٹ 3000 مصروف ہو تو چلائیں:
     ```powershell
     Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
     ```

---

## 📄 لائسنس (License)

یہ پروجیکٹ **Apache License 2.0** کے تحت اوپن سورس کیا گیا ہے۔ تفاصیل کے لیے `LICENSE` فائل ملاحظہ فرمائیں۔