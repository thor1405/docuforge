# DocuForge 2.0 - Raspberry Pi Docker & MongoDB Atlas Hosting Guide 🍓☁️

This guide explains how to deploy and host **DocuForge 2.0** on a **Raspberry Pi** (Pi 5, Pi 4, or Pi 3) using Docker and **MongoDB Atlas** (cloud database).

---

## ☁️ Why MongoDB Atlas with Raspberry Pi?
- **Zero Database Load on Pi**: Offloads memory and CPU from your Raspberry Pi.
- **MicroSD Card Protection**: Eliminates continuous write wear on the Pi's storage.
- **Global Availability & Cloud Backups**: Your user accounts, saved workflows, and payment records are safely persisted in the cloud.

---

## 🚀 Step 1: Get Your MongoDB Atlas Connection String (Free)

1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create or open your free M0 cluster.
3. Click **Connect** → **Drivers** (Node.js).
4. Copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/docuforge?retryWrites=true&w=majority
   ```
5. In **Network Access** tab on Atlas, click **Add IP Address** → **Allow Access from Anywhere (`0.0.0.0/0`)** so your Raspberry Pi can connect.

---

## 📂 Step 2: Configure Environment on Raspberry Pi

On your Raspberry Pi, inside the `docuforge` folder, edit or create `.env`:

```bash
nano .env
```

Paste the following:

```env
APP_PORT=7070
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/docuforge?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_jwt_secret_key_2026
```

*(Replace `<username>`, `<password>`, and your cluster host with your real MongoDB Atlas credentials)*

Press `Ctrl + O`, `Enter` to save, then `Ctrl + X` to exit nano.

---

## 🏗️ Step 3: Launch DocuForge with Docker

Run:

```bash
docker compose up -d
```

### Check Container Status:
```bash
docker compose ps
```

### View Live Logs:
```bash
docker compose logs -f app
```

---

## 🌐 Step 4: Access DocuForge

Open your browser on any device on your Wi-Fi:

```
http://<raspberry-pi-ip>:7070
```
*(e.g., `http://192.168.1.50:7070` or `http://pi5.local:7070`)*
