const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const { generateToken, authenticate } = require('./auth');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// Daftar video (bisa diganti dengan database)
const videos = [
  { id: 1, title: "Video 1", path: "videos/video1.mp4" },
  { id: 2, title: "Video 2", path: "videos/video2.mp4" }
];

// Endpoint autentikasi
app.post('/api/login', (req, res) => {
  if (req.body.code === process.env.ACCESS_CODE) {
    const token = generateToken();
    res.cookie('token', token, { httpOnly: true, secure: true });
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// Endpoint streaming video (proteksi dengan JWT)
app.get('/api/video/:id', authenticate, (req, res) => {
  const video = videos.find(v => v.id === parseInt(req.params.id));
  if (!video) return res.status(404).send('Video tidak ditemukan');

  const videoPath = path.join(__dirname, video.path);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Handle streaming partial content (untuk play/pause)
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Jalankan server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
