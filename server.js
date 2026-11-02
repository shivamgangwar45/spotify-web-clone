const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

let ytdl;
try {
    ytdl = require('@distube/ytdl-core');
} catch (e) {
    console.error('[@distube/ytdl-core missing]: Ensure npm install has run');
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get('/style.css', (req, res) => {
    const publicCss = path.join(__dirname, 'public', 'style.css');
    const rootCss = path.join(__dirname, 'style.css');
    res.setHeader('Content-Type', 'text/css');
    if (fs.existsSync(publicCss)) return res.sendFile(publicCss);
    if (fs.existsSync(rootCss)) return res.sendFile(rootCss);
    res.status(404).send('style.css not found');
});

app.get('/app.js', (req, res) => {
    const publicJs = path.join(__dirname, 'public', 'app.js');
    const rootJs = path.join(__dirname, 'app.js');
    res.setHeader('Content-Type', 'application/javascript');
    if (fs.existsSync(publicJs)) return res.sendFile(publicJs);
    if (fs.existsSync(rootJs)) return res.sendFile(rootJs);
    res.status(404).send('app.js not found');
});

app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(publicPath)) return res.sendFile(publicPath);
    if (fs.existsSync(rootPath)) return res.sendFile(rootPath);
    res.status(404).send('index.html not found');
});

// Search Cache
const searchCache = new Map();

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

// Audio Stream Engine
const streamCache = new Map();
const STREAM_TTL_MS = 90 * 60 * 1000;

async function resolveAudio(id, force = false) {
    if (!ytdl) throw new Error('ytdl library not loaded');

    const hit = streamCache.get(id);
    if (!force && hit && hit.expires > Date.now()) return hit;

    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${id}`, {
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }
    });

    const audioOnly = info.formats.filter(f => f.hasAudio && !f.hasVideo && f.url);
    if (!audioOnly.length) throw new Error('No audio formats found');

    const mp4 = audioOnly.filter(f => f.container === 'mp4');
    const pool = mp4.length ? mp4 : audioOnly;
    pool.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
    const best = pool[0];

    const entry = {
        url: best.url,
        mime: (best.mimeType || 'audio/mp4').split(';')[0],
        expires: Date.now() + STREAM_TTL_MS
    };

    if (streamCache.size > 200) streamCache.delete(streamCache.keys().next().value);
    streamCache.set(id, entry);
    return entry;
}

app.get('/api/stream/:id', async (req, res) => {
    const id = req.params.id;
    if (!/^[\w-]{11}$/.test(id)) return res.status(400).send('Bad video id');

    const controller = new AbortController();
    res.on('close', () => controller.abort());

    try {
        let entry = await resolveAudio(id);
        const headers = {};
        if (req.headers.range) headers.Range = req.headers.range;

        let up = await fetch(entry.url, { headers, signal: controller.signal });

        if (!up.ok) {
            entry = await resolveAudio(id, true);
            up = await fetch(entry.url, { headers, signal: controller.signal });
        }
        if (!up.ok) return res.status(502).send('Upstream stream expired');

        res.status(up.status);
        res.setHeader('Content-Type', entry.mime);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-store');
        const len = up.headers.get('content-length');
        const crange = up.headers.get('content-range');
        if (len) res.setHeader('Content-Length', len);
        if (crange) res.setHeader('Content-Range', crange);

        if (Readable.fromWeb && up.body) {
            Readable.fromWeb(up.body).on('error', () => res.destroy()).pipe(res);
        } else {
            const buffer = await up.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[Stream Error]:', err.message);
        streamCache.delete(id);
        if (!res.headersSent) res.status(502).send('Stream error');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});