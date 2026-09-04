# Warehouse Surplus Tracker 📦

> **High-Performance Warehouse Surplus & Discrepancy Recording System**  
> Built for return stream sorting stations (VP Recount), featuring hardware laser barcode scanner integration, real-time Google Sheets synchronization, and live concurrency control for 50+ simultaneous operators.

---

## 🌟 Key Features

1. **⚡ Fast Hardware Scanner Integration:**
   - Automatic input buffering and laser scanner event listener (with instant reset via `$BT#CLEAR` command).
   - Dynamic audio feedback via Web Audio API for fast operational workflows.
   - Dual-input mode: Keyboard/Laser Barcode Scanner or Mobile/Tablet Camera.

2. **📊 Real-Time Analytics & Monitoring Dashboard:**
   - **Today's Summary:** Total items and total boxes recorded today.
   - **Top PVZ Distribution:** Live ranking of pickup points with the most surplus items.
   - **Discrepancy Reasons Breakdown:** Instant statistics on reasons (*Surplus in Box*, *QR/IMEI Defect*, *Item without Act*, *Previously Cancelled*, *Wrong Item*, *Empty Package*, *Order Already Delivered*, *Already Recounted*).

3. **☁️ Real-Time Google Sheets Sync:**
   - Direct two-way integration with Google Apps Script Web App.
   - Server-side in-memory caching (15s TTL) to prevent rate limits under heavy traffic.
   - Automatic background retries (3x) and Offline Queue for network resilience.

4. **👥 Multi-Operator Concurrency (50+ Simultaneous Users):**
   - Individual session management per workstation (Operator Name, Table/Desk Number, Shift 1–4).
   - Concurrency locking mechanism (`LockService.waitLock(30000)`) preventing row overwrite conflicts.

5. **🌐 Bilingual Interface:**
   - Instant 1-click switching between Uzbek 🇺🇿 and Russian 🇷🇺.

---

## 🚀 Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **State & Storage:** LocalStorage + Offline Sync Queue + Server-side In-Memory Cache
- **Backend & Database:** Google Sheets API + Google Apps Script Web App
- **Language:** TypeScript 5

---

## 📦 Deployment Guide

### Deploying to Vercel (Recommended & 100% Free)

This project is optimized for deployment on Vercel:

1. **Via Vercel CLI:**
   ```bash
   npx vercel
   ```
2. **Via GitHub Integration:**
   - Import this repository on [vercel.com](https://vercel.com/new).
   - Click **Deploy**. Vercel will automatically build and assign a global HTTPS domain.

---

## 📊 Google Apps Script Setup

1. Open your target Google Sheet.
2. Navigate to **Extensions (Расширения)** ➔ **Apps Script**.
3. Copy and paste the code from [`src/google-apps-script/Code.gs`](./src/google-apps-script/Code.gs).
4. Click **Deploy (Развернуть)** ➔ **New deployment (Новое развертывание)**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the generated Web App URL and configure it in the application.

---

## 🛠 Local Development

```bash
# Clone the repository
git clone https://github.com/theanvarow/warehouse-surplus-tracker.git

# Navigate to project folder
cd warehouse-surplus-tracker

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License

MIT License © 2026 Sirojiddin Anvarov
