# ⚠️ URGENT: Setup Environment Variables di Vercel

## Error yang Terjadi:
Server error di `/api/auth/error` karena **environment variables belum diset di Vercel**.

---

## ✅ LANGKAH WAJIB - Setup di Vercel Dashboard

### 1. Login ke Vercel
Buka: https://vercel.com/

### 2. Pilih Project
Klik project: **smartgen-cvmaker**

### 3. Masuk ke Settings
- Klik **"Settings"** di menu atas
- Klik **"Environment Variables"** di sidebar kiri

### 4. Tambahkan 4 Variables Ini:

#### Variable #1: NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://smartgen-cvmaker-nobluu.vercel.app
Environment: Production, Preview, Development (centang semua)
```
⚠️ **PENTING**: Tanpa `/` di akhir!

#### Variable #2: NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: 088dcbabb335ac9bfc610fb0e91ba8a872becffd42f12192c1860686226485d6
Environment: Production, Preview, Development (centang semua)
```

#### Variable #3: GOOGLE_CLIENT_ID
```
Key: GOOGLE_CLIENT_ID
Value: [Copy dari Google Cloud Console]
Environment: Production, Preview, Development (centang semua)
```

📝 **Cara dapat Client ID:**
1. Buka https://console.cloud.google.com/
2. Pilih project Anda
3. Pergi ke: **APIs & Services > Credentials**
4. Copy **Client ID** yang sudah Anda buat

#### Variable #4: GOOGLE_CLIENT_SECRET
```
Key: GOOGLE_CLIENT_SECRET
Value: [Copy dari Google Cloud Console]
Environment: Production, Preview, Development (centang semua)
```

📝 **Cara dapat Client Secret:**
- Ada di tempat yang sama dengan Client ID
- Jika lupa, bisa create new credentials atau regenerate

---

## 🔄 5. Redeploy Setelah Tambah Variables

**WAJIB REDEPLOY** setelah menambahkan environment variables!

### Cara 1: Auto (via Git Push) - SUDAH DILAKUKAN
Code sudah di-push, Vercel akan auto-deploy dalam 2-3 menit.

### Cara 2: Manual (via Vercel Dashboard)
1. Pergi ke tab **"Deployments"**
2. Klik **titik tiga (⋯)** di deployment terakhir
3. Klik **"Redeploy"**
4. **JANGAN centang** "Use existing Build Cache"
5. Klik **"Redeploy"**

---

## 🧪 6. Test Setelah Deploy Selesai

Tunggu 2-3 menit, lalu:

1. Buka: https://smartgen-cvmaker-nobluu.vercel.app
2. Klik **"Continue with Google"**
3. **Harusnya** redirect ke Google OAuth (accounts.google.com)
4. Pilih akun Google
5. Redirect kembali ke aplikasi → masuk Dashboard

### Jika Masih Error:
- Cek apakah semua 4 environment variables sudah disave
- Pastikan NEXTAUTH_URL tidak ada typo
- Redeploy manual dari Vercel dashboard
- Clear browser cache atau test di incognito

---

## 📋 Checklist Verifikasi:

- [ ] Login ke Vercel
- [ ] Masuk ke project smartgen-cvmaker
- [ ] Buka Settings > Environment Variables
- [ ] Tambah NEXTAUTH_URL
- [ ] Tambah NEXTAUTH_SECRET
- [ ] Tambah GOOGLE_CLIENT_ID (dari Google Cloud Console)
- [ ] Tambah GOOGLE_CLIENT_SECRET (dari Google Cloud Console)
- [ ] Save semua variables
- [ ] Tunggu auto-deploy selesai (atau redeploy manual)
- [ ] Test di browser: klik "Continue with Google"
- [ ] ✅ Berhasil login dengan Google!

---

## 🆘 Troubleshooting

### Error: "Configuration" atau "Server error"
**Penyebab:** Environment variables belum diset atau belum redeploy  
**Solusi:** 
1. Cek apakah 4 variables sudah ada di Vercel
2. Redeploy aplikasi
3. Tunggu 2-3 menit
4. Test lagi

### Error: "redirect_uri_mismatch"
**Penyebab:** Google Cloud Console redirect URI belum diset  
**Solusi:** Tambahkan di Google Cloud Console:
```
https://smartgen-cvmaker-nobluu.vercel.app/api/auth/callback/google
```

### Redirect loop (kembali ke login terus)
**Penyebab:** NEXTAUTH_URL salah atau ada trailing slash  
**Solusi:** Pastikan NEXTAUTH_URL = `https://smartgen-cvmaker-nobluu.vercel.app` (tanpa `/`)

---

## 🎯 Yang Sudah Diperbaiki di Code:

✅ NextAuth sekarang punya fallback handling  
✅ Tidak akan crash jika env vars kosong  
✅ Auto-detect apakah Google OAuth tersedia  
✅ Error handling lebih baik  

**TAPI** tetap butuh environment variables diset di Vercel agar Google OAuth berfungsi!

---

## 📞 Butuh Bantuan?

Setelah setup:
1. Screenshot tab Environment Variables di Vercel (blur sensitive values)
2. Share jika masih error
3. Check Vercel deployment logs: Deployments → klik deployment → View Function Logs
