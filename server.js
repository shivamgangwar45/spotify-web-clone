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

// Authenticated Direct Audio Stream Downloader
app.get('/api/download', (req, res) => {
    const videoId = req.query.id;
    let cleanTitle = (req.query.title || 'song')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!videoId) return res.status(400).send('Video ID is required');

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const cookiesPath = path.join(__dirname, 'cookies.txt');

    // yt-dlp arguments for direct stream piping without FFmpeg crash
    const args = [
        '-f', 'bestaudio',
        '--no-playlist',
        '--no-warnings',
        '-o', '-', // Stream binary straight to stdout
        videoUrl
    ];

    if (fs.existsSync(cookiesPath)) {
        args.unshift('--cookies', cookiesPath);
    }

    const ytdlp = spawn('yt-dlp', args);

    let streamStarted = false;

    ytdlp.stdout.on('data', (chunk) => {
        if (!streamStarted) {
            streamStarted = true;
            res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);
            res.setHeader('Content-Type', 'audio/mpeg');
        }
        res.write(chunk);
    });

    ytdlp.stderr.on('data', (data) => {
        console.error(`[yt-dlp stderr]: ${data.toString()}`);
    });

    ytdlp.on('close', (code) => {
        if (!streamStarted && !res.headersSent) {
            console.error(`[Download Error]: Process exited with code ${code} without sending audio.`);
            return res.status(500).send('Failed to stream audio. Check server logs.');
        }
        res.end();
    });

    req.on('close', () => {
        ytdlp.kill('SIGKILL');
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});