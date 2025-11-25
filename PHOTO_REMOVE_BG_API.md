# 🎨 Photo Editor - Remove.bg API Integration

## ✅ Fitur Baru: Dual-Mode Background Removal

Photo Editor sekarang punya **2 metode** penghapusan background:

### 1️⃣ Remove.bg API (Production Quality)
- ✅ **Kualitas terbaik** - Professional background removal
- ✅ **Cepat** - ~3-5 detik per foto
- ✅ **Reliable** - Service stabil, production-ready
- ⚠️ **Berbayar** - $0.02 per foto (free tier: 50 foto/bulan)
- 📦 Requires: `REMOVE_BG_API_KEY` environment variable

### 2️⃣ AI Lokal (Client-Side)
- ✅ **Gratis 100%** - No API costs
- ✅ **Privacy** - Data tidak ke server
- ✅ **Offline** - Bekerja tanpa internet (setelah model didownload)
- ⚠️ **Lambat pertama kali** - ~30 detik download model AI (10-20MB)
- ⚠️ **Kualitas medium** - Bagus tapi tidak sepresisi Remove.bg
- 📦 No dependencies needed

---

## 🔧 Setup Remove.bg API

### Step 1: Get API Key
1. Daftar di https://www.remove.bg/api
2. Login → API → Get API Key
3. Copy API key Anda

### Step 2: Set Environment Variable

**Development (Local):**
```bash
# .env.local
REMOVE_BG_API_KEY=your_api_key_here
```

**Production (Vercel):**
1. Go to Project Settings → Environment Variables
2. Add variable:
   - Name: `REMOVE_BG_API_KEY`
   - Value: `your_api_key_here`
   - Environment: Production (and Preview if needed)

### Step 3: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 📝 API Endpoint Documentation

### `POST /api/photo/remove-bg`

**Request:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "credits_charged": "1"
}
```

**Error Responses:**

```json
// 400 - Invalid request
{
  "success": false,
  "error": "Invalid request",
  "details": "Image data URL is required"
}

// 500 - API key not set
{
  "success": false,
  "error": "Remove.bg API key not configured",
  "details": "Please set REMOVE_BG_API_KEY in environment variables"
}

// 402 - Insufficient credits
{
  "success": false,
  "error": "Insufficient credits",
  "details": "Status 402: ..."
}
```

---

## 💻 Usage Example (Node.js Function)

```typescript
/**
 * Remove background using Remove.bg API
 * @param imageBuffer - Image file as Buffer
 * @returns PNG image with transparent background as Buffer
 */
async function removeBackgroundRemoveBg(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY
  
  if (!apiKey) {
    throw new Error('REMOVE_BG_API_KEY not set')
  }

  // Convert buffer to base64 data URL
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  // Call our API endpoint
  const response = await fetch('http://localhost:3000/api/photo/remove-bg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || result.details)
  }

  // Extract base64 from data URL
  const base64Result = result.image.replace(/^data:image\/png;base64,/, '')
  
  // Convert back to Buffer
  return Buffer.from(base64Result, 'base64')
}

// Example usage
import fs from 'fs'

async function main() {
  // Read input image
  const inputBuffer = fs.readFileSync('./input.jpg')
  
  // Remove background
  const outputBuffer = await removeBackgroundRemoveBg(inputBuffer)
  
  // Save result
  fs.writeFileSync('./output.png', outputBuffer)
  
  console.log('✅ Background removed successfully!')
}

main().catch(console.error)
```

---

## 🎯 Direct Remove.bg API Usage (Alternative)

Jika Anda ingin bypass Next.js API dan call Remove.bg langsung:

```typescript
import FormData from 'form-data'
import fetch from 'node-fetch'

async function removeBackgroundDirect(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData()
  formData.append('image_file', imageBuffer, {
    filename: 'image.png',
    contentType: 'image/png',
  })
  formData.append('size', 'auto')

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY!,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Remove.bg error: ${error}`)
  }

  const resultBuffer = await response.arrayBuffer()
  return Buffer.from(resultBuffer)
}
```

---

## 🎨 Frontend Usage (React Component)

```tsx
'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRemoveBackground = async () => {
    if (!originalImage) return

    setIsProcessing(true)
    const loadingToast = toast.loading('Removing background...')

    try {
      const response = await fetch('/api/photo/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: originalImage }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.details || result.error)
      }

      setRemovedBgImage(result.image)
      toast.success('Background removed! 🎉', { id: loadingToast })
      console.log('Credits charged:', result.credits_charged)
    } catch (error: any) {
      console.error(error)
      toast.error(`Failed: ${error.message}`, { id: loadingToast })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => setOriginalImage(e.target?.result as string)
            reader.readAsDataURL(file)
          }
        }}
      />
      
      <button onClick={handleRemoveBackground} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Remove Background'}
      </button>

      {originalImage && (
        <div>
          <h3>Original</h3>
          <img src={originalImage} alt="Original" />
        </div>
      )}

      {removedBgImage && (
        <div>
          <h3>Background Removed</h3>
          <img src={removedBgImage} alt="Removed" />
        </div>
      )}
    </div>
  )
}
```

---

## 📊 Remove.bg Pricing

| Plan | Price | Credits | Cost per Image |
|------|-------|---------|----------------|
| Free | $0 | 50/month | Free |
| Subscription | $9/month | 500 | $0.018 |
| Pay-as-you-go | - | Variable | $0.02-$0.20 |

**Note:** Harga bervariasi berdasarkan resolusi output yang diminta.

---

## 🔍 Comparison: Remove.bg vs Local AI

| Feature | Remove.bg API | Local AI (@imgly) |
|---------|---------------|-------------------|
| **Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Speed** | ⚡ 3-5s | 🐢 10-30s (first time) |
| **Cost** | 💰 $0.02/image | 💚 Free |
| **Privacy** | ❌ Sends to server | ✅ 100% local |
| **Reliability** | ✅ Very stable | ⚠️ Depends on browser |
| **Setup** | 🔑 API key needed | ✅ No setup |
| **Hair/Edges** | ⭐⭐⭐⭐⭐ Perfect | ⭐⭐⭐ Good |

---

## 🎯 Recommendations

**Use Remove.bg API when:**
- ✅ You need professional quality
- ✅ Processing many images in production
- ✅ Speed is critical
- ✅ You have budget for API costs

**Use Local AI when:**
- ✅ You want zero costs
- ✅ Privacy is important (sensitive photos)
- ✅ Offline capability needed
- ✅ Quality is "good enough"

---

## 🐛 Troubleshooting

### Error: "Remove.bg API key not configured"
**Solution:** Set `REMOVE_BG_API_KEY` in `.env.local` and restart server

### Error: "Insufficient credits"
**Solution:** 
1. Check your Remove.bg account balance
2. Add more credits or wait for next month's free tier reset

### Error: "Image too large"
**Solution:** Remove.bg has max file size limits. Resize image before upload.

### Toggle not working after adding API key
**Solution:** Hard refresh browser (Ctrl+Shift+R) to clear cache

---

## 📚 Resources

- **Remove.bg API Docs:** https://www.remove.bg/api
- **Remove.bg Pricing:** https://www.remove.bg/pricing
- **Remove.bg Dashboard:** https://www.remove.bg/dashboard
- **@imgly/background-removal:** https://github.com/imgly/background-removal-js

---

## ✅ Summary

Sekarang PhotoEditor punya **dual-mode**:
1. **Remove.bg API** - Best quality, berbayar, production-ready
2. **Local AI** - Free, offline, good quality

User bisa pilih sesuai kebutuhan mereka! 🎉
