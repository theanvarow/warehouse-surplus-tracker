# 📖 VP Pereshot: Tovar Fiksatsiyasi — To'liq Qo'llanma va Yo'riqnoma

Ushbu qo'llanma **VP Pereshot (Qaytarilgan tovarlar oqimi)** stansiyasi operatorlari, smena boshliqlari va nazoratchilari uchun mo'ljallangan.

---

## 📑 Mundarija
1. [Tizimga Kirish va Avtorizatsiya](#1-tizimga-kirish-va-avtorizatsiya)
2. [Skanerlash Ish Stoli va Qadamlar](#2-skanerlash-ish-stoli-va-qadamlar)
3. [PVZ Qidiruv Tizimidan Foydalanish (2 464 ta Uzum PVZ)](#3-pvz-qidiruv-tizimidan-foydalanish)
4. [Muammo Sababini Belgilash (8 ta Sabab)](#4-muammo-sababini-belgilash)
5. [Monitoring va Statistika Bo'limi (Parol bilan)](#5-monitoring-va-statistika-bolimi)
6. [Avtomatik Xavfsizlik Qoidalari](#6-avtomatik-xavfsizlik-qoidalari)

---

## 1. Tizimga Kirish va Avtorizatsiya

Har bir operator o'z ish o'rnini ochish uchun tizimga kirishi kerak:

![01_auth_modal](./screenshots/01_auth_modal.png)

1. **Xodim F.I.O:** Ism va familiyangizni kiriting (masalan, `Алиев Сардор`).
2. **Stol Raqami:** Ishlayotgan stolingiz raqamini yozing yoki stol shtrix-kodini skanerlang (masalan, `STOL-04`).
3. **Smenani tanlang:** `1`, `2`, `3` yoki `4`-smena tugmasini bosing.
4. **Tizimga kirish:** Tugmani bosib asosiy ish oynasiga o'ting.

> ⏰ **Eslatma:** Har kuni soat **09:00** va **21:00** da smena almashganda xavfsizlik va yangi smena hisoboti uchun tizim avtomatik ravishda tizimdan chiqaradi.

---

## 2. Skanerlash Ish Stoli va Qadamlar

Skanerlash oynasi operatsiyalarni eng tez va xatosiz bajarish uchun optimallashtirilgan:

![02_scanner_main](./screenshots/02_scanner_main.png)

### Ketma-ketlik:
1. **1. Qaysi Gruzamestadan chiqdi?**  
   Gruzamesta shtrix-kodini skanerlang (masalan, `85-000...` yoki `KOROB-78421`).
2. **2. PVZ (Punkt):**  
   Tovar tegishli bo'lgan PVZ kodini yozing yoki qidiring (masalan, `ТАШ-14`).
3. **3. Tovar Barkodi:**  
   Lazer skaner bilan tovar barkodini skanerlang. Skanerlanganda ovozli signal chalinadi va sabablar oynasi ochiladi.
4. **4. Sababni tanlang:**  
   Muammo turiga mos sababni bosing. Tovar pastdagi ro'yxatga qo'shiladi.
5. **5. Qayta joylangan korup (Куда переложен):**  
   Muammoli tovar qaysi qutiga solingan bo'lsa, o'sha quti shtrix-kodini skanerlang. Tizim faqat **80** yoki **85** bilan boshlanadigan koruplarni qabul qiladi (masalan: `80-002` yoki `85-001`). Boshqa raqam qabul qilinmaydi.
6. **6. Qutini yakunlash (Завершить):**  
   Katta **Завершить** tugmasini bosing. Barcha ma'lumotlar Google Sheets jadvaliga bir zumda yuklanadi.

---

## 3. PVZ Qidiruv Tizimidan Foydalanish

Tizimda **2 464 ta rasmiy Uzum PVZ** bazasi mavjud bo'lib, qidiruv aqlli transliteratsiya bilan ishlaydi:

![03_pvz_search](./screenshots/03_pvz_search.png)

* **Lotincha yozish:** `tash 14` yoki `tash-14` deb yozsangiz ham birinchi bo'lib `ТАШ-14` chiqadi.
* **Qisqartmalar:** `kkd` yozsangiz `ККД-1`, `ККД-2`, `mrg` yozsangiz `МРГ-1` chiqadi.
* **Faqat raqam yozish:** Masalan `14` yozsangiz, barcha 14-raqamli PVZlar (`ТАШ-14`, `СМК-14`, `ФЕР-14`) chiqadi.
* **Franshiza va yangi punktlar:** `fr` yoki `ipnew` deb qidirishingiz mumkin.
* **Klaviaturada tezkor tanlash:** Klaviatura strelkalari (↓ va ↑) orqali kerakli PVZni tanlab, **Enter** tugmasini bosish kifoya.

---

## 4. Muammo Sababini Belgilash

Tovar skanerlangandan so'ng 9 ta rasmiy sababdan biri tanlanadi:

![04_reasons_modal](./screenshots/04_reasons_modal.png)

| № | Sabab nomi (Причина) | Tavsif |
|---|----------------------|--------|
| **1** | **Лишний товар в коробе** | Qutida ko'rsatilgan ro'yxatdan ortiqcha chiqqan tovar |
| **2** | **QR / IMEI** | QR kodi yoki IMEI kodi o'qilmagan yoki muammoli tovar |
| **3** | **Товар без акта** | Akt hujjati mavjud bo'lmagan tovar |
| **4** | **Ранее отменен** | Buyurtmasi avval bekor qilingan tovar |
| **5** | **Неверный товар** | Qutiga noto'g'ri solingan boshqa tovar |
| **6** | **Пустая упаковка без товара внутри** | Ichida tovari yo'q bo'sh qadoq |
| **7** | **Заказ в статусе "Выдан / К выдаче / Доставляется"** | Statusi berilgan yoki yetkazilmoqda bo'lgan tovar |
| **8** | **Товар уже пересчитан** | Avval qayta sanalgan tovar |
| **9** | **Недокомплект** | Butun to'plamdan qismlari yetishmaydigan (chala) tovar |

---

## 5. Monitoring va Statistika Bo'limi

Monitoring bo'limi real vaqtda ombordagi barcha fiksatsiyalar statistikasini ko'rsatib turadi:

![05_monitoring_dashboard](./screenshots/05_monitoring_dashboard.png)

### Imkoniyatlari:
* **Bugungi tovarlar soni:** Bugun fiksatsiya qilingan jami tovarlar miqdori.
* **Bugungi qutilar soni:** Qayta ishlangan qutilar soni.
* **Top PVZ lar reytingi:** Eng ko'p muammoli tovar chiqqan punktlar (masalan, `FrШЕР-3`, `ТАШ-63`...).
* **Top sabablar statistikasi:** Qaysi sabab bo'yicha ko'p tovar tushayotgani (foizlarda).
* **Real vaqt jadvali:** Har bir xodim va stol bo'yicha barcha yozuvlar ro'yxati.

### Xavfsizlik:
* Monitoring oynasiga kirish uchun maxsus parol o'rnatilgan: **`Sardor 12345`**.
* **Avto-qulf:** Agar 2 daqiqa harakatsiz turilsa yoki boshqa oynaga o'tilsa, monitoring avtomatik tarzda qayta qulflanadi.

---

## 6. Foydali Maslahatlar

1. **Lazer Skaner:** Barkod skanerlaganda avtomatik ravishda Enter yuboruvchi har qanday shtrix-kod skaneri bilan 100% mos keladi.
2. **Skaner Buferini Tozalash:** Agar skanerdan noto'g'ri kod o'qilsa, `$BT#CLEAR` shtrix-kodi bilan buferni tozalash mumkin.
3. **Tilni Almashtirish:** Ekranning yuqori o'ng burchagidagi `UZ / RU` tugmasi orqali interfeys tilini istalgan paytda o'zgartirish mumkin.
4. **Oflayn Ishlash:** Agar internet uzilib qolsa, ma'lumotlar brauzer xotirasida to'planadi va internet tiklanishi bilan Google Sheetsga avtomatik yuklanadi.
