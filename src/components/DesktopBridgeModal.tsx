import React, { useState, useEffect } from 'react';
import { X, Laptop, Terminal, Copy, Check, Play, ShieldCheck, RefreshCw } from 'lucide-react';
import { initDesktopBridge, isDesktopBridgeActive } from '../lib/commandExecutor';

interface DesktopBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BRIDGE_PYTHON_CODE = `# hammad_bridge.py
# Run this on your local laptop (Windows, Mac, Linux) to allow Hammad AI
# to launch local desktop apps like Google Chrome and Android Studio!

import asyncio
import websockets
import json
import subprocess
import platform
import os

PORT = 8765
OS_NAME = platform.system().lower()

def launch_application(app_name):
    print(f"[Hammad Bridge] Received command to launch: {app_name}")
    try:
        if app_name == "chrome":
            if "windows" in OS_NAME:
                os.system("start chrome")
            elif "darwin" in OS_NAME: # Mac
                subprocess.Popen(["open", "-a", "Google Chrome"])
            else: # Linux
                subprocess.Popen(["google-chrome"])

        elif app_name == "android-studio":
            if "windows" in OS_NAME:
                # Common Android Studio paths on Windows
                possible_paths = [
                    r"C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe",
                    r"C:\\Program Files (x86)\\Android\\Android Studio\\bin\\studio64.exe"
                ]
                launched = False
                for p in possible_paths:
                    if os.path.exists(p):
                        subprocess.Popen([p])
                        launched = True
                        break
                if not launched:
                    os.system("start studio64")
            elif "darwin" in OS_NAME:
                subprocess.Popen(["open", "-a", "Android Studio"])
            else:
                subprocess.Popen(["android-studio"])

        elif app_name == "vscode":
            if "windows" in OS_NAME:
                os.system("start code")
            else:
                subprocess.Popen(["code"])

        elif app_name == "calculator":
            if "windows" in OS_NAME:
                os.system("start calc")
            elif "darwin" in OS_NAME:
                subprocess.Popen(["open", "-a", "Calculator"])
            else:
                subprocess.Popen(["gnome-calculator"])
                
        return True
    except Exception as e:
        print(f"Error launching {app_name}: {e}")
        return False

async def handler(websocket):
    print(f"[Hammad Bridge] Browser connected successfully!")
    async for message in websocket:
        try:
            data = json.loads(message)
            if data.get("action") == "launch":
                app = data.get("app")
                launch_application(app)
                await websocket.send(json.dumps({"status": "launched", "app": app}))
        except Exception as e:
            print("Message error:", e)

async def main():
    print(f"==================================================")
    print(f"   HAMMAD AI LOCAL DESKTOP COMPANION BRIDGE       ")
    print(f"   Listening on ws://localhost:{PORT}            ")
    print(f"==================================================")
    async with websockets.serve(handler, "localhost", PORT):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
`;

export const DesktopBridgeModal: React.FC<DesktopBridgeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(isDesktopBridgeActive());

  useEffect(() => {
    const timer = setInterval(() => {
      setIsConnected(isDesktopBridgeActive());
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(BRIDGE_PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    initDesktopBridge(8765);
    setTimeout(() => setIsConnected(isDesktopBridgeActive()), 600);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Laptop className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-100">Local Laptop Companion Bridge</h2>
              <p className="text-[11px] text-slate-400">Launch Chrome, Android Studio, and native software directly from voice commands</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status bar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Bridge Status:</span>
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to Laptop (ws://localhost:8765)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Standby (Web protocol active)
              </span>
            )}
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <RefreshCw className="w-3 h-3" /> Check Connection
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              How it works (2-Minute Setup):
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Save the Python script below as <code className="text-indigo-300 font-mono">hammad_bridge.py</code> on your laptop.</li>
              <li>Make sure websockets is installed: <code className="text-indigo-300 font-mono">pip install websockets</code></li>
              <li>Run it in your terminal: <code className="text-indigo-300 font-mono">python hammad_bridge.py</code></li>
              <li>Now whenever you say <em>"Chrome chalao"</em> or <em>"Android Studio open karo"</em>, it launches instantly on your laptop!</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-300">hammad_bridge.py</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Script!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
              {BRIDGE_PYTHON_CODE}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
