"""
Hammad AI - Local Desktop Companion Bridge
Allows Hammad AI Web Voice Assistant to launch native desktop software (Google Chrome, Android Studio, VS Code, etc.) on your laptop.
"""

import asyncio
import json
import os
import platform
import shutil
import subprocess
import sys
import webbrowser
from urllib.parse import urlparse

PORT = 8765
OS_NAME = platform.system().lower()

def print_banner():
    print("=" * 60)
    print("   HAMMAD AI - LOCAL DESKTOP COMPANION BRIDGE")
    print(f"   Platform: {platform.system()} ({platform.release()})")
    print(f"   WebSocket Server: ws://localhost:{PORT}")
    print("=" * 60)
    print("[*] Waiting for Hammad Voice AI browser connection...\n")

def open_allowed_url(url):
    """Open only explicitly allowlisted YouTube URLs in a new browser tab."""
    if not isinstance(url, str) or len(url) > 2048:
        print("[!] Rejected invalid URL.")
        return False
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in {
        "youtube.com", "www.youtube.com", "music.youtube.com"
    }:
        print("[!] Rejected URL outside the YouTube allowlist.")
        return False
    opened = webbrowser.open(url, new=2, autoraise=True)
    if opened:
        print(f"[+] Opened YouTube URL in a new browser tab: {parsed.hostname}")
        return True
    print("[!] The default browser did not confirm opening the URL.")
    return False


def play_youtube_search(query):
    """Resolve the first YouTube search result to a watch page and open it in a new tab."""
    if not isinstance(query, str) or not query.strip() or len(query) > 200:
        print("[!] Rejected empty or overly long YouTube search query.")
        return False
    try:
        import yt_dlp
    except ImportError:
        print("[!] Automatic song playback requires yt-dlp. Run: python -m pip install yt-dlp")
        return False

    try:
        options = {"quiet": True, "no_warnings": True, "skip_download": True}
        with yt_dlp.YoutubeDL(options) as ydl:
            result = ydl.extract_info("ytsearch1:" + query.strip(), download=False)
        entries = result.get("entries") or []
        if not entries:
            print(f"[!] No YouTube results found for: {query!r}")
            return False
        video = entries[0]
        video_id = video.get("id")
        video_url = video.get("webpage_url") or (
            "https://www.youtube.com/watch?v=" + video_id if video_id else None
        )
        parsed = urlparse(video_url or "")
        if parsed.scheme != "https" or parsed.hostname not in {"youtube.com", "www.youtube.com"}:
            print("[!] YouTube search did not return a trusted watch URL.")
            return False
        opened = webbrowser.open(video_url, new=2, autoraise=True)
        if opened:
            print(f"[+] Opened YouTube video for query: {query!r}")
            return True
        print("[!] The default browser did not confirm opening the video.")
        return False
    except Exception as exc:
        print(f"[!] YouTube search/playback failed: {exc}")
        return False


def launch_application(app_name):
    """Launch only explicitly supported applications and report failures honestly."""
    print(f"[>] Command received to launch: '{app_name}'")
    try:
        if app_name == "chrome":
            if "windows" in OS_NAME:
                candidates = [
                    shutil.which("chrome"),
                    os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
                    os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
                    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
                ]
                executable = next((p for p in candidates if p and os.path.isfile(p)), None)
                if not executable:
                    print("[!] Google Chrome was not found in PATH or standard install folders.")
                    return False
                subprocess.Popen([executable])
            elif "darwin" in OS_NAME:
                subprocess.Popen(["open", "-a", "Google Chrome"])
            else:
                executable = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
                if not executable:
                    print("[!] Chrome/Chromium was not found in PATH.")
                    return False
                subprocess.Popen([executable])

        elif app_name == "android-studio":
            if "windows" in OS_NAME:
                candidates = [
                    shutil.which("studio64"),
                    os.path.expandvars(r"%ProgramFiles%\Android\Android Studio\bin\studio64.exe"),
                    os.path.expandvars(r"%ProgramFiles(x86)%\Android\Android Studio\bin\studio64.exe"),
                    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe"),
                ]
                executable = next((p for p in candidates if p and os.path.isfile(p)), None)
                if not executable:
                    print("[!] Android Studio was not found in standard install folders or PATH.")
                    return False
                subprocess.Popen([executable])
            elif "darwin" in OS_NAME:
                subprocess.Popen(["open", "-a", "Android Studio"])
            else:
                executable = shutil.which("android-studio") or shutil.which("studio")
                if not executable:
                    print("[!] Android Studio was not found in PATH.")
                    return False
                subprocess.Popen([executable])

        elif app_name == "vscode":
            if "windows" in OS_NAME:
                candidates = [
                    shutil.which("code"),
                    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
                    os.path.expandvars(r"%ProgramFiles%\Microsoft VS Code\Code.exe"),
                ]
                executable = next((p for p in candidates if p and os.path.isfile(p)), None)
                if not executable:
                    print("[!] Visual Studio Code was not found in PATH or standard install folders.")
                    return False
                subprocess.Popen([executable])
            else:
                executable = shutil.which("code")
                if not executable:
                    print("[!] Visual Studio Code command 'code' was not found in PATH.")
                    return False
                subprocess.Popen([executable])

        elif app_name == "calculator":
            if "windows" in OS_NAME:
                subprocess.Popen(["calc.exe"])
            elif "darwin" in OS_NAME:
                subprocess.Popen(["open", "-a", "Calculator"])
            else:
                executable = shutil.which("gnome-calculator") or shutil.which("kcalc") or shutil.which("xcalc")
                if not executable:
                    print("[!] No supported calculator application was found.")
                    return False
                subprocess.Popen([executable])

        else:
            print(f"[!] Unsupported application: {app_name!r}")
            return False

        print(f"[+] Launch request dispatched for {app_name}.")
        return True
    except (OSError, subprocess.SubprocessError) as e:
        print(f"[!] Error launching {app_name}: {e}")
        return False

async def handler(websocket):
    print("[+] Browser client connected successfully!")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                action = data.get("action")
                request_id = data.get("requestId")
                if action == "launch":
                    app = data.get("app")
                    success = isinstance(app, str) and launch_application(app)
                    response = {
                        "requestId": request_id,
                        "status": "ok" if success else "failed",
                        "app": app,
                    }
                    if not success:
                        response["error"] = "Application launch failed; check the bridge console and app installation."
                    await websocket.send(json.dumps(response))
                elif action == "open_url":
                    url = data.get("url")
                    success = open_allowed_url(url)
                    await websocket.send(json.dumps({
                        "requestId": request_id,
                        "status": "ok" if success else "failed",
                        "error": None if success else "URL could not be opened; check the bridge console."
                    }))
                elif action == "youtube_play":
                    query = data.get("query")
                    success = play_youtube_search(query)
                    await websocket.send(json.dumps({
                        "requestId": request_id,
                        "status": "ok" if success else "failed",
                        "error": None if success else "Could not automatically play this song. Install yt-dlp and check the bridge console."
                    }))
                else:
                    await websocket.send(json.dumps({
                        "requestId": request_id,
                        "status": "failed",
                        "error": "Unsupported action."
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
    async with websockets.serve(
        handler,
        "localhost",
        PORT,
        origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        max_size=64 * 1024,
    ):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[*] Hammad AI Bridge stopped by user.")
