"""
Hammad AI - Local Desktop Companion Bridge
Allows Hammad AI Web Voice Assistant to launch native desktop software (Google Chrome, Android Studio, VS Code, etc.) on your laptop.
"""

import asyncio
import json
import os
import platform
import subprocess
import sys

PORT = 8765
OS_NAME = platform.system().lower()

def print_banner():
    print("=" * 60)
    print("   HAMMAD AI - LOCAL DESKTOP COMPANION BRIDGE")
    print(f"   Platform: {platform.system()} ({platform.release()})")
    print(f"   WebSocket Server: ws://localhost:{PORT}")
    print("=" * 60)
    print("[*] Waiting for Hammad Voice AI browser connection...\n")

def launch_application(app_name):
    print(f"[>] Command received to launch: '{app_name}'")
    try:
        if app_name == "chrome":
            if "windows" in OS_NAME:
                os.system("start chrome")
            elif "darwin" in OS_NAME:  # macOS
                subprocess.Popen(["open", "-a", "Google Chrome"])
            else:  # Linux
                subprocess.Popen(["google-chrome"])
            print("[+] Successfully launched Google Chrome!")

        elif app_name == "android-studio":
            if "windows" in OS_NAME:
                possible_paths = [
                    r"C:\Program Files\Android\Android Studio\bin\studio64.exe",
                    r"C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe",
                    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe"),
                ]
                launched = False
                for p in possible_paths:
                    if os.path.exists(p):
                        subprocess.Popen([p])
                        launched = True
                        print(f"[+] Launched Android Studio from: {p}")
                        break
                if not launched:
                    os.system("start studio64")
                    print("[+] Dispatched 'start studio64'")
            elif "darwin" in OS_NAME:
                subprocess.Popen(["open", "-a", "Android Studio"])
                print("[+] Launched Android Studio on macOS")
            else:
                subprocess.Popen(["android-studio"])
                print("[+] Launched Android Studio on Linux")

        elif app_name == "vscode":
            if "windows" in OS_NAME:
                os.system("start code")
            else:
                subprocess.Popen(["code"])
            print("[+] Launched Visual Studio Code!")

        elif app_name == "calculator":
            if "windows" in OS_NAME:
                os.system("start calc")
            elif "darwin" in OS_NAME:
                subprocess.Popen(["open", "-a", "Calculator"])
            else:
                subprocess.Popen(["gnome-calculator"])
            print("[+] Launched Calculator!")

        return True
    except Exception as e:
        print(f"[!] Error launching {app_name}: {e}")
        return False

async def handler(websocket):
    print("[+] Browser client connected successfully!")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                action = data.get("action")
                if action == "launch":
                    app = data.get("app")
                    success = launch_application(app)
                    await websocket.send(json.dumps({
                        "status": "ok" if success else "failed",
                        "app": app
                    }))
            except Exception as e:
                print(f"[!] Invalid message payload: {e}")
    except Exception as e:
        print(f"[-] Client connection closed: {e}")

async def main():
    try:
        import websockets
    except ImportError:
        print("[!] Missing required package 'websockets'.")
        print("[*] Please run: pip install websockets")
        sys.exit(1)

    print_banner()
    async with websockets.serve(handler, "localhost", PORT):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[*] Hammad AI Bridge stopped by user.")
