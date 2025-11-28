# SmartGen CV Maker - MySQL Database Setup

## 🚀 Quick Deploy ke Vercel dengan MySQL

### 1️⃣ Setup MySQL Database (Railway - Gratis)

1. **Buat akun di Railway**: https://railway.app/
2. **Buat MySQL Database**:
   - Klik "New Project"
   - Pilih "Provision MySQL"
   - Copy connection string

### 2️⃣ Deploy ke Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login ke Vercel
vercel login

# 3. Deploy
vercel --prod
```

### 3️⃣ Setup Environment Variables di Vercel

Tambahkan di **Vercel Dashboard** > **Settings** > **Environment Variables**:

```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=smartgen-cv-maker-secret-key-2024

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

DATABASE_URL=mysql://root:password@host.railway.app:port/railway

OPENAI_API_KEY=your-openai-api-key
```

### 4️⃣ Run Database Migration di Vercel

Setelah deploy pertama kali:

```bash
# Push schema ke database
npx prisma db push
```

Atau tambahkan di `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

---

## 🗄️ Alternatif MySQL Hosting Gratis

### Option 1: Railway (Rekomendasi)
- **Free**: $5 credit (cukup untuk 500 jam/bulan)
- **Setup**: 2 menit
- **URL**: https://railway.app/

### Option 2: PlanetScale
- **Free**: 5GB storage
- **Setup**: 5 menit  
- **URL**: https://planetscale.com/

### Option 3: Aiven
- **Free**: 1 node, 25GB
- **Setup**: 5 menit
- **URL**: https://aiven.io/

---

## 📝 Setup Manual (Jika Sudah Punya MySQL)

```bash
# 1. Update DATABASE_URL di .env.local
DATABASE_URL="mysql://user:pass@host:port/database"

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migration
npx prisma migrate dev --name init

# 4. Start app
npm run dev
```

---

## ✅ Checklist Deploy

- [ ] MySQL database sudah dibuat
- [ ] DATABASE_URL sudah di-set di Vercel
- [ ] NEXTAUTH_URL sudah di-update ke production URL
- [ ] Google OAuth sudah dikonfigurasi dengan production URL
- [ ] OPENAI_API_KEY sudah di-set
- [ ] Prisma migration sudah dijalankan (`prisma db push`)
- [ ] Deploy ke Vercel berhasil

---

## 🔧 Troubleshooting

**Error: Can't reach database**
- Pastikan DATABASE_URL format benar: `mysql://user:pass@host:port/database`
- Cek firewall/whitelist IP di database hosting

**Error: Prisma Client not generated**
- Run: `npx prisma generate`
- Atau tambahkan `postinstall` script: `"postinstall": "prisma generate"`

**Error: NextAuth session tidak persist**
- Pastikan `NEXTAUTH_SECRET` sama di semua environment
- Pastikan `NEXTAUTH_URL` sesuai dengan domain production
