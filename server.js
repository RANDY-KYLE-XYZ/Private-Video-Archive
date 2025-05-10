const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Konfigurasi middleware
app.use(cors({ credentials: true, origin: 'http://localhost:5500' })); // Sesuaikan dengan origin frontend
app.use(express.json());
app.use(
  session({
    secret: 'rahasia-anda',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 hari
  })
);

// Daftar kode akses valid
const validCodes = ['randy', 'clara'];

// Endpoint otentikasi
app.post('/api/login', (req, res) => {
  const { code } = req.body;
  if (validCodes.includes(code)) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Kode akses tidak valid' });
  }
});

// Middleware untuk memeriksa otentikasi
const checkAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak' });
  }
};

// Endpoint streaming video (dilindungi)
app.get('/api/video/:id', checkAuth, (req, res) => {
  const videoId = req.params.id;
  const videoPath = path.join(__dirname, 'videos', `video${videoId}.mp4`);
  
  // Pastikan file video ada
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ message: 'Video tidak ditemukan' });
  }

  // Header untuk mencegah cache dan download
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Stream video ke klien
  const videoStream = fs.createReadStream(videoPath);
  videoStream.pipe(res);
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
