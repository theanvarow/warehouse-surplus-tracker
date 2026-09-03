# VP Pershot - Ortiqcha Tovarlarni Fiksatsiya Qilish Tizimi (Google Sheets Integratsiyasi)

Ushbu dastur omborxona xodimlari va **Muammoli otdel (Problem Department)** uchun mo'ljallangan bo'lib, koruplardan chiqqan ortiqcha tovarlarni apparatli shtrix-kod skaner (yoki kamera) orqali fiksatsiya qilish va real vaqtda **Google Sheets** jadvaliga avtomatik kiritish imkonini beradi.

---

## 🚀 Asosiy Imkoniyatlar

1. **🌐 Ko'p tilli interfeys:** O'zbekcha 🇺🇿 va Ruscha 🇷🇺 (1-klikda almashtirish).
2. **👤 Xodim Avtorizatsiyasi:** Tezkor xodim tanlash va tizimga kirish.
3. **⏰ 4 ta Smena:** Smena 1, Smena 2, Smena 3, Smena 4.
4. **📦 Korup & Tovar Skanerlash:**
   - Apparatli laser shtrix-kod skanerlar uchun avtofokus va tezkor buferlash.
   - Skanerlanganda yoqimli audio effektlar (Web Audio API).
   - Tovar korup ichida takrorlansa, avtomatik sonini oshirish (+1).
   - Smartfon/Planshet kamerasi orqali skanerlash imkoniyati.
5. **🎉 "Zavershit Korup" Tugmasi:**
   - Korupni yopish, xulosa va konfetti animatsiyasi.
   - Fonda Google Sheets ga xavfsiz sinxronizatsiya.
   - Avtomatik keyingi korupni skanerlash oynasiga qaytish.
6. **📊 Muammoli Otdel (Problem Dept) Paneli:**
   - Barcha koruplar va tovarlarni real vaqtda ko'rish.
   - Korup raqami, barcode yoki xodim bo'yicha qidirish.
   - Holatlarni yangilash (*Yangi*, *Tekshirilmoqda*, *Qayta ishlandi*, *Muammo hal qilindi*).
   - Excel (.xlsx) formatida hisobot yuklab olish.
7. **☁️ Offline Rejim:** Internet uzilsa ham skanerlangan ma'lumotlar saqlanib qoladi va tarmoq tiklangach yuboriladi.

---

## 📊 Google Sheets Jadvali bilan Integratsiya

Berilgan Google Jadval:
👉 `https://docs.google.com/spreadsheets/d/1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A/edit?gid=0#gid=0`

### 1-Daqiqalik O'rnatish Qo'llanmasi (Google Apps Script):
1. Google Jadvalingizga kiring: [Google Sheets](https://docs.google.com/spreadsheets/d/1ITy_OER1O6YIjoopZUR31rBxj9v8bwsBfp1rUalJO3A/edit)
2. Yuqori menyudan **Kengaytmalar (Extensions)** -> **Apps Script** bo'limiga kiring.
3. Loyihadagi `src/google-apps-script/Code.gs` kodini to'liq nusxalab, u yerga qo'ying va saqlang (Ctrl+S / Cmd+S).
4. O'ng yuqoridagi ko'k **Deploy (Развернуть)** -> **New deployment (Новое развертывание)** tugmasini bosing:
   - Turini tanlang: **Web app (Веб-приложение)**
   - Description: `VP Pershot API`
   - Execute as: **Me (Mening nomimdan)**
   - Who has access: **Anyone (Hamma)**
5. **Deploy** tugmasini bosing va berilgan **Web app URL** manzilini nusxalang.
6. Dasturimizning **⚙️ Sozlamalar (Настройки)** bo'limiga kirib, ushbu URL manzilni qo'ying va **"Aloqani tekshirish"** tugmasini bosing!

---

## ⚡ Vercel-ga Joylash (Deploy)

Ushbu dastur Vercel uchun 100% optimallashtirilgan.

### 1-usul: GitHub orqali
1. Loyihani GitHub repozitoriyingizga push qiling:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for VP Pershot app"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```
2. [Vercel Dashboard](https://vercel.com/dashboard) ga kiring -> **Add New...** -> **Project**.
3. Repozitoriyangizni tanlang va **Deploy** tugmasini bosing!

### 2-usul: Vercel CLI orqali
```bash
npx vercel
```

---

## 🛠 Lokal Ishga Tushirish
```bash
npm install
npm run dev
```
Brauzerda `http://localhost:3000` manzilini oching.
