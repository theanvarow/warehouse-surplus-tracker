# Warehouse Surplus Tracker 📦

> **High-Performance Warehouse Surplus & Discrepancy Recording System**  
> Built for return stream sorting stations (VP Pereshot / Возвратный поток пересчёт), featuring hardware laser barcode scanner integration, real-time Google Sheets synchronization, 2 464 official Uzum PVZs, and live concurrency control for 50+ simultaneous operators.

---

## 📸 Skrinshotlar va Tizim Ko'rinishi (Screenshots)

### 1. Xodim Avtorizatsiyasi (Operator Login)
Xodim F.I.O, Stol raqami (shtrix-kod skaneri orqali) va Smena (1–4) tanlash:
![01_auth_modal](./docs/screenshots/01_auth_modal.png)

### 2. Skanerlash Ish Stoli (Main Scanner Workstation)
Quti raqami, PVZ, tovar barkodi va sabablar bilan ishlash stoli:
![02_scanner_main](./docs/screenshots/02_scanner_main.png)

### 3. Aqlli PVZ Qidiruvi (2 464 ta Uzum PVZ)
Lotin va kirill transliteratsiyasi, prefikslar va raqamlar bo'yicha tezkor qidiruv:
![03_pvz_search](./docs/screenshots/03_pvz_search.png)

### 4. Muammo Sabablari Modali (8 Discrepancy Reasons)
QR / IMEI, Ortiqcha tovar, Akt yo'q, Avval bekor qilingan va h.k.:
![04_reasons_modal](./docs/screenshots/04_reasons_modal.png)

### 5. Real Vaqt Monitoringi (Analytics & Dashboard)
Kunlik jami tovarlar, qutilar statistikasi, Top PVZlar va sabablar tahlili:
![05_monitoring_dashboard](./docs/screenshots/05_monitoring_dashboard.png)

---

## 📖 To'liq Foydalanish Yo'riqnomasi

Operatorlar va smena boshliqlari uchun to'liq yo'riqnoma:  
👉 **[Qo'llanma: docs/INSTRUCTIONS_UZ.md](./docs/INSTRUCTIONS_UZ.md)**

---

## 🌟 Asosiy Imkoniyatlar (Key Features)

1. **⚡ Fast Hardware Scanner Integration:**
   - Automatic input buffering and laser scanner event listener (with instant reset via `$BT#CLEAR` command).
   - Dynamic audio feedback via Web Audio API for fast operational workflows.
   - Dual-input mode: Keyboard/Laser Barcode Scanner or Mobile/Tablet Camera.

2. **🏢 2 464 ta Rasmiy Uzum PVZ Bazasi:**
   - To'liq kompaniya punktlari ro'yxati bazaga kiritilgan (`ТАШ`, `ККД`, `МРГ`, `СМК`, `ФЕР`, `БХР`, `ipNEW-...`, `Fr...` va barcha viloyatlar).
   - Ultra-aqlli transliteratsiya (`tash 14` -> `ТАШ-14`, `kkd 1` -> `ККД-1`, `14` -> barcha 14-raqamli punktlar).

3. **📊 Real-Time Analytics & Monitoring Dashboard:**
   - **Today's Summary:** Total items and total boxes recorded today.
   - **Top PVZ Distribution:** Live ranking of pickup points with the most surplus items.
   - **Discrepancy Reasons Breakdown:** Instant statistics on reasons (*Surplus in Box*, *QR/IMEI*, *Item without Act*, *Previously Cancelled*, *Wrong Item*, *Empty Package*, *Order Already Delivered*, *Already Recounted*).
   - **Password Security:** Maxsus `Sardor 12345` paroli, 2 daqiqa harakatsizlikda avto-qulf.

4. **☁️ Real-Time Google Sheets Sync:**
   - Direct two-way integration with Google Apps Script Web App.
   - Server-side in-memory caching (15s TTL) to prevent rate limits under heavy traffic.
   - Automatic background retries (3x) and Offline Queue for network resilience.

5. **👥 Multi-Operator Concurrency (50+ Simultaneous Users):**
   - Individual session management per workstation (Operator Name, Table/Desk Number, Shift 1–4).
   - Shift auto-logout at **09:00** and **21:00** for secure shift handover.
   - Concurrency locking mechanism (`LockService.waitLock(30000)`) preventing row overwrite conflicts.

6. **🌐 Bilingual Interface:**
   - Instant 1-click switching between Uzbek 🇺🇿 and Russian 🇷🇺.

---

## 🚀 Texnologiyalar (Tech Stack)

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **State & Storage:** LocalStorage + Offline Sync Queue + Server-side In-Memory Cache
- **Backend & Database:** Google Sheets API + Google Apps Script Web App
- **Language:** TypeScript 5

---

## 🛠 O'rnatish va Ishga Tushirish (Local Development)

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

## 📄 Litsenziya

MIT License © 2026 Sirojiddin Anvarov
