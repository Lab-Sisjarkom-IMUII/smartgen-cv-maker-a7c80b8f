# 🚀 Deploy SmartGen CV Maker ke Vercel dengan MySQL

## ✅ Status Deploy
- ✅ Code sudah di-push ke GitHub
- ✅ Vercel project sudah dibuat
- ⏳ **Sekarang: Setup Database & Environment Variables**

---

## 📋 Langkah Setup Database (Railway - GRATIS)

### 1. Buat MySQL Database di Railway

1. **Buka** https://railway.app/
2. **Sign up / Login** dengan GitHub
3. **Klik** "New Project"
4. **Pilih** "Provision MySQL"
5. **Tunggu** hingga database terbuat (~30 detik)

### 2. Copy Database Connection String

1. Klik database yang baru dibuat
2. Klik tab **"Connect"**
3. Copy **MySQL Connection URL** yang formatnya seperti:
   ```
   mysql://root:password@containers-us-west-xxx.railway.app:port/railway
   ```

---

## 🔧 Setup Environment Variables di Vercel

### Buka Vercel Dashboard

1. **Login** ke https://vercel.com/
2. **Pilih project** "smartgencvmaker"
3. **Klik** "Settings" > "Environment Variables"

### Tambahkan Variables Berikut:

#### 1. DATABASE_URL (WAJIB)
```
Name: DATABASE_URL
Value: mysql://root:password@host.railway.app:port/railway
Environment: Production, Preview, Development
```
**⚠️ Ganti dengan connection string dari Railway!**

#### 2. NEXTAUTH_URL (WAJIB)
```
Name: NEXTAUTH_URL
Value: https://smartgencvmaker-avpju03dl-nofal-izdihar-azmis-projects.vercel.app
Environment: Production, Preview, Development
```

#### 3. NEXTAUTH_SECRET (WAJIB)
```
Name: NEXTAUTH_SECRET
Value: smartgen-cv-maker-secret-key-2024
Environment: Production, Preview, Development
```

#### 4. GOOGLE_CLIENT_ID (WAJIB untuk Login)
```
Name: GOOGLE_CLIENT_ID
Value: your-google-client-id-here
Environment: Production, Preview, Development
```

#### 5. GOOGLE_CLIENT_SECRET (WAJIB untuk Login)
```
Name: GOOGLE_CLIENT_SECRET
Value: your-google-client-secret-here
Environment: Production, Preview, Development
```

#### 6. OPENAI_API_KEY (WAJIB untuk AI Features)
```
Name: OPENAI_API_KEY
Value: your-openai-api-key-here
Environment: Production, Preview, Development
```

---

## 🔄 Update Google OAuth untuk Production

1. **Buka** https://console.cloud.google.com/apis/credentials
2. **Pilih** OAuth 2.0 Client ID yang sudah dibuat
3. **Tambahkan** Authorized redirect URIs:
   ```
   https://smartgencvmaker-avpju03dl-nofal-izdihar-azmis-projects.vercel.app/api/auth/callback/google
   ```
4. **Save**

---

## 🚀 Redeploy Aplikasi

Setelah semua environment variables di-set:

### Option 1: Via Vercel Dashboard
1. Klik tab **"Deployments"**
2. Klik tombol **"Redeploy"** pada deployment terakhir
3. Centang **"Use existing build cache"** ❌ (JANGAN centang)
4. Klik **"Redeploy"**

### Option 2: Via Command Line
```bash
vercel --prod
```

### Option 3: Via Git Push
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

---

## ✅ Verifikasi Deploy Berhasil

1. **Tunggu** build selesai (~2-3 menit)
2. **Buka** URL production: https://smartgencvmaker-avpju03dl-nofal-izdihar-azmis-projects.vercel.app
3. **Test**:
   - ✅ Halaman terbuka tanpa error
   - ✅ Login dengan Google berfungsi
   - ✅ Buat CV baru dan save
   - ✅ AI Chat berfungsi
   - ✅ AI Photo Enhancer berfungsi

---

## 📊 Database Tables

Setelah deploy berhasil, tables berikut akan otomatis dibuat:

- ✅ `cvs` - Data CV
- ✅ `cv_history` - History perubahan CV
- ✅ `users` - User accounts
- ✅ `accounts` - OAuth accounts
- ✅ `sessions` - User sessions
- ✅ `verification_tokens` - Verification tokens

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"
**Solusi**: 
- Cek DATABASE_URL sudah benar
- Pastikan Railway database masih running
- Cek Railway credits belum habis

### Error: "Prisma Client not generated"
**Solusi**:
- Redeploy dengan clear cache
- Atau tambahkan build command: `prisma generate && next build`

### Error: "NextAuth session tidak persist"
**Solusi**:
- Pastikan NEXTAUTH_URL sama dengan domain production
- Pastikan NEXTAUTH_SECRET sudah di-set

### Error: "Google OAuth error"
**Solusi**:
- Update authorized redirect URIs di Google Console
- Format: `https://your-domain.vercel.app/api/auth/callback/google`

---

## 💰 Cost Estimate

- **Railway MySQL**: $5 free credit = ~500 jam/bulan (GRATIS untuk mulai)
- **Vercel Hosting**: Free tier (unlimited untuk hobby projects)
- **OpenAI API**: Pay per use (~$0.002 per request)
- **Total**: **FREE** untuk mulai! 🎉

---

## 📞 Support

Jika ada masalah:
1. Cek logs di Vercel Dashboard > Deployments > [latest] > Build Logs
2. Cek logs di Railway Dashboard > Database > Logs
3. Cek browser console untuk client-side errors

---

**Selamat! Aplikasi Anda siap production! 🎉**
