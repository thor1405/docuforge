# DocuForge 2.0 - Raspberry Pi Docker Hosting Guide 🍓

This guide explains how to deploy and host **DocuForge 2.0** on a **Raspberry Pi** (Pi 4, Pi 5, or Pi 3 running 64-bit Raspberry Pi OS / Ubuntu) using Docker and Docker Compose.

---

## 📋 Requirements
- **Hardware**: Raspberry Pi 4 (4GB/8GB recommended) or Raspberry Pi 5 (or Pi 3 Model B+ with 64-bit OS).
- **OS**: Raspberry Pi OS (64-bit / Bookworm) or Ubuntu Server 22.04/24.04 LTS (64-bit).
- **Storage**: 16 GB+ MicroSD card or USB SSD.
- **Docker & Docker Compose**: Installed on the Pi.

---

## 🚀 Step 1: Install Docker on Raspberry Pi

If Docker is not already installed on your Raspberry Pi, run:

```bash
# 1. Update package list
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install official Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Add current user to docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER

# 4. Apply group changes (or reboot: sudo reboot)
newgrp docker

# 5. Verify Docker installation
docker --version
docker compose version
```

---

## 📂 Step 2: Copy or Clone DocuForge to Your Raspberry Pi

Transfer the project directory to your Raspberry Pi, for example via Git or SCP:

```bash
# Navigate to your home directory or /opt
cd ~

# If cloning via Git:
git clone https://github.com/your-username/docuforge.git
cd docuforge
```

---

## ⚙️ Step 3: Configure Environment (Optional)

Create a `.env` file if you want to set custom JWT secrets or Razorpay keys:

```bash
cat << 'EOF' > .env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
JWT_SECRET=your_super_secret_jwt_key_here
# Optional Razorpay Merchant Keys:
# RAZORPAY_KEY_ID=rzp_live_...
# RAZORPAY_KEY_SECRET=...
EOF
```

---

## 🏗️ Step 4: Build and Launch with Docker Compose

Run the single compose command to build the multi-stage image and start both the Next.js app and MongoDB:

```bash
# Build and start in detached (background) mode
docker compose up -d --build
```

### What Docker Does Automatically:
1. Starts **MongoDB 7.0** with persistent named volume storage (`mongodb_data`).
2. Builds the **DocuForge Next.js 15 Standalone** container with:
   - Headless **LibreOffice** (high-fidelity Word/Excel/PowerPoint conversions)
   - **Tesseract OCR** (image text recognition)
   - **PyMuPDF / Poppler / QPDF** (high-speed compression, watermarks, encryption)
3. Exposes the app on **port 3000**.

---

## 🌐 Step 5: Access DocuForge from Any Device

Find your Raspberry Pi's local IP address:

```bash
hostname -I
```
*(For example: `192.168.1.50` or `raspberrypi.local`)*

Open your browser on any laptop, tablet, or phone connected to the same Wi-Fi network:

- **Web App**: `http://192.168.1.50:3000` (or `http://raspberrypi.local:3000`)
- **Pricing & Upgrades**: `http://192.168.1.50:3000/pricing`
- **Smart Workspace**: `http://192.168.1.50:3000/workspace`
- **User Dashboard**: `http://192.168.1.50:3000/dashboard`

---

## 🛠️ Management & Useful Commands

### View Live Logs:
```bash
# View web application logs
docker compose logs -f app

# View MongoDB database logs
docker compose logs -f mongodb
```

### Check Container Status:
```bash
docker compose ps
```

### Restart Services:
```bash
docker compose restart
```

### Stop Containers:
```bash
docker compose down
```

### Update to Latest Code:
```bash
git pull
docker compose up -d --build
```

### Backup MongoDB Data:
MongoDB data is safely persisted in the Docker volume `mongodb_data`. To make an external backup:
```bash
docker exec docuforge_mongodb mongodump --db docuforge --out /data/db/backup_$(date +%F)
```

---

## 🔒 Optional: Remote Access (Cloudflare Tunnel / Tailscale)

To access your Raspberry Pi DocuForge instance from outside your home network securely without opening router ports:

1. **Tailscale (Easiest & Free)**:
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```
   Access your Pi via its Tailscale IP or MagicDNS URL from anywhere in the world.

2. **Cloudflare Tunnel (Custom Domain with Free SSL)**:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
   sudo dpkg -i cloudflared.deb
   cloudflared tunnel login
   ```
   Route `https://docuforge.yourdomain.com` directly to `localhost:3000` on your Raspberry Pi!
