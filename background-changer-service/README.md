# Background Changer Service

Service Node.js untuk mengganti background foto menggunakan OpenAI Images API (gpt-image-1).

## 📁 Struktur Folder

```
background-changer-service/
├── server.js              # File utama server Express
├── package.json           # Dependencies dan scripts
├── .env.example          # Contoh environment variables
├── .env                  # Environment variables (buat sendiri, jangan commit)
├── uploads/              # Folder temporary untuk file upload (auto-created)
├── output/               # Folder hasil gambar (auto-created)
└── README.md            # Dokumentasi ini
```

## 🚀 Cara Penggunaan

### 1. Install Dependencies

```bash
cd background-changer-service
npm install
```

### 2. Setup Environment Variables

Buat file `.env` dari `.env.example`:

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan OpenAI API key Anda:

```
OPENAI_API_KEY=sk-your-actual-openai-key
PORT=3000
```

### 3. Jalankan Server

**Development (dengan auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📡 API Endpoint

### POST /api/change-background

Endpoint untuk mengganti background foto.

**Request:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Fields:**
  - `photo` (file): File gambar (JPEG, JPG, atau PNG, max 10MB)
  - `background` (string): Deskripsi background yang diinginkan

**Example dengan cURL:**

```bash
curl -X POST http://localhost:3000/api/change-background \
  -F "photo=@/path/to/your/photo.jpg" \
  -F "background=luxury office with bookshelves and warm lighting"
```

**Example dengan JavaScript (fetch):**

```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);
formData.append('background', 'luxury office with bookshelves and warm lighting');

const response = await fetch('http://localhost:3000/api/change-background', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**Success Response:**

```json
{
  "success": true,
  "url": "/output/result-1234567890-abc123.png",
  "filename": "result-1234567890-abc123.png",
  "message": "Background changed successfully"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Background changer service is running"
}
```

## 🎨 Contoh Background Descriptions

- `"luxury office with bookshelves and warm lighting"`
- `"modern studio with white background"`
- `"professional blue gradient background"`
- `"cozy living room with plants"`
- `"outdoor garden with green trees"`
- `"corporate office environment"`

## ⚙️ Teknologi

- **Express.js** - Web framework
- **Multer** - File upload handling
- **OpenAI API** - Image editing (gpt-image-1 model)
- **dotenv** - Environment variables management

## 📝 Catatan

1. **API Key**: Pastikan Anda memiliki OpenAI API key yang valid dengan akses ke Images API.
2. **Rate Limits**: OpenAI Images API memiliki rate limits. Perhatikan usage Anda.
3. **File Size**: Maximum file upload adalah 10MB.
4. **Image Format**: Hanya menerima JPEG, JPG, dan PNG.
5. **Auto Cleanup**: File upload otomatis dihapus setelah diproses.
6. **Output Files**: Hasil gambar disimpan di folder `output/` dan dapat diakses via `/output/filename.png`.

## 🛠️ Development

**Auto-reload dengan nodemon:**
```bash
npm run dev
```

**Test endpoint:**
```bash
# Health check
curl http://localhost:3000/health

# Change background (gunakan path foto Anda)
curl -X POST http://localhost:3000/api/change-background \
  -F "photo=@photo.jpg" \
  -F "background=modern office"
```

## 🔒 Security Notes

- Jangan commit file `.env` ke repository
- Simpan OpenAI API key dengan aman
- Pertimbangkan menambahkan rate limiting untuk production
- Validasi input dengan ketat
- Gunakan HTTPS di production

## 📄 License

ISC
