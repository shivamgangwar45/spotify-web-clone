const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(publicPath)) res.sendFile(publicPath);
    else if (fs.existsSync(rootPath)) res.sendFile(rootPath);
    else res.status(404).send('index.html not found');
});

// In-Memory Search Cache (0ms response for repeated queries)
const searchCache = new Map();

// Optimized Fast Search API
app.get('/api/search', async (req, res) => {
    try {
        const query = (req.query.q || '').trim().toLowerCase();
        if (!query) return res.status(400).json({ error: 'Query required' });

        if (searchCache.has(query)) {
            return res.json(searchCache.get(query));
        }

        const r = await yts(query);
        const videos = (r.videos || []).slice(0, 12).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author ? v.author.name : 'Unknown Artist',
            duration: v.timestamp,
            thumbnail: v.thumbnail
        }));

        if (searchCache.size > 100) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }
        searchCache.set(query, videos);

        res.json(videos);
    } catch (err) {
        console.error('[Search Error]:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Authenticated MP3 Downloader using cookies.txt
app.get('/api/download', (req, res) => {
    const videoId = req.query.id;
    let cleanTitle = (req.query.title || 'song')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!videoId) return res.status(400).send('Video ID is required');

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const cookiesPath = path.join(__dirname, 'cookies.txt');

    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    // yt-dlp arguments with authenticated session cookies
    const args = [
        '-x',
        '--audio-format', 'mp3',
        '-o', '-', // Stream to stdout
        videoUrl
    ];

    if (fs.existsSync(cookiesPath)) {
        args.unshift('--cookies', cookiesPath);
    }

    const ytdlp = spawn('yt-dlp', args);

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on('data', (data) => {
        console.error(`[yt-dlp stderr]: ${data}`);
    });

    ytdlp.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp process exited with code ${code}`);
        }
    });

    req.on('close', () => {
        ytdlp.kill();
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});