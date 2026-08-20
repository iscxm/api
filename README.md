# eDev YouTube Stream API 🚀

A high-performance, proxy-free, and cookie-less YouTube stream extraction API built specifically for Telegram Music Bots (Pyrogram/Telethon) and Web Apps. 

This API bypasses `yt-dlp` blocks, IP bans, and Cloudflare restrictions by directly extracting Google Video streams without requiring native proxies or YouTube sign-in cookies.

## ✨ Features
- **Zero Cookies Required:** Never worry about YouTube accounts getting banned.
- **No IP Blocks:** Safely runs on VPS (Ubuntu/Debian) or Serverless platforms without getting throttled.
- **Direct googlevideo.com URLs:** Perfect for streaming directly in voice chats via `pytgcalls`.
- **Built-in UI & Dashboard:** Comes with a beautiful Single Page Application (SPA) for testing and API documentation.
- **Custom Domain Ready:** Pre-configured for deployment with Nginx and SSL.

---

## 🛠 VPS Deployment Guide (Ubuntu)

Follow these step-by-step instructions to deploy this API on a fresh Ubuntu VPS with a custom domain (e.g., `edev.fun`).

### Step 1: System Update & Install Basics
Update your server and install required packages like `git` and `curl`.
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git build-essential -y
```

### Step 2: Install Node.js (v20)
Since a fresh VPS doesn't have Node.js, install the latest version:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
*(Verify installation by running `node -v` and `npm -v`)*

### Step 3: Clone Repository
Download the code from your GitHub to the VPS:
```bash
git clone <YOUR_GITHUB_REPO_URL> api-folder
cd api-folder
```

### Step 4: Install Packages & Start API
Install node modules and use **PM2** to keep the API running in the background forever:
```bash
npm install express cors node-fetch
sudo npm install -g pm2
pm2 start server.js --name "yt-api"
pm2 save
pm2 startup
```
*The API is now running locally on port 3000.*

---

## 🔒 Setup Nginx & Free SSL (HTTPS)

To expose your API securely on your custom domain, we use Nginx as a reverse proxy and Certbot for a free SSL certificate.

### Step 5: Install Nginx & Certbot
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Step 6: Configure Nginx
Create a configuration file for your domain:
```bash
sudo nano /etc/nginx/sites-available/edev.fun
```
Paste the following configuration inside the nano editor:
```nginx
server {
    listen 80;
    server_name edev.fun;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Save the file: Press `Ctrl+X`, then `Y`, and hit `Enter`.*

### Step 7: Enable Nginx Config
Create a symlink to enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/edev.fun /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Generate SSL Certificate (HTTPS)
Run Certbot to secure your domain:
```bash
sudo certbot --nginx -d edev.fun
```
*Follow the prompts: enter your email, agree to the terms (`Y`), and select option `2` to automatically redirect HTTP traffic to HTTPS.*

---

## 🤖 Telegram Bot Integration (`youtube.py`)

If you are using this API for a Telegram Music Bot (to bypass `yt-dlp`), simply update your `youtube.py` file with the custom API URL.

```python
import aiohttp
from pytgcalls.types import AudioPiped

async def download(self, video_id: str, video: bool = False):
    format_type = "video" if video else "audio"
    api_req_url = f"https://edev.fun/api/v1?query={video_id}&format={format_type}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(api_req_url) as resp:
            data = await resp.json()
            if data.get("success"):
                stream_url = data["stream_url"]
                # Pass stream_url to AudioPiped for immediate playback!
```
*No cookies needed. No downloading required!*

---
**Enjoy your lag-free, ban-free API! 🎉**
