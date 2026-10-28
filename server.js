const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');

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

// 1. Rock-Solid Search API (yt-search: Never fails on Render/Cloud)
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Query required' });

        const r = await yts(query);
        const videos = (r.videos || []).slice(0, 25).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author ? v.author.name : 'Unknown Artist',
            duration: v.timestamp,
            thumbnail: v.thumbnail,
            // Empty audioUrl triggers seamless YouTube IFrame streaming
            audioUrl: '' 
        }));

        res.json(videos);
    } catch (err) {
        console.error('[Search API Error]:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// 2. Direct MP3 Downloader Engine (JioSaavn CDN Search + Fast Fallback)
app.get('/api/download', async (req, res) => {
    const videoId = req.query.id;
    let cleanTitle = (req.query.title || 'song')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!videoId) return res.status(400).send('Video ID is required');

    // Strategy 1: Saavn CDN se 320kbps MP3 link dhoondo
    try {
        const searchTitle = (req.query.title || '').replace(/\(.*?\)|\[.*?\]|Official|Video|Audio/gi, '').trim();
        const saavnRes = await fetch(`https://saavn.me/api/search/songs?query=${encodeURIComponent(searchTitle)}&limit=1`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const saavnData = await saavnRes.json();

        if (saavnData?.data?.results?.[0]?.downloadUrl?.length > 0) {
            const urls = saavnData.data.results[0].downloadUrl;
            const bestLink = urls.find(u => u.quality === '320kbps') || urls[urls.length - 1];
            if (bestLink?.url) {
                return res.redirect(bestLink.url);
            }
        }
    } catch (e) {
        console.log('[Saavn resolver skipped, using stream pipeline]');
    }

    // Strategy 2: Fast Direct Stream Pipeline (Invidious / CDN proxy)
    const instances = [
        'https://inv.nadeko.net',
        'https://invidious.nerdvpn.de',
        'https://vid.puffyan.us'
    ];

    for (const host of instances) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const vRes = await fetch(`${host}/api/v1/videos/${videoId}`, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            clearTimeout(timeout);

            if (!vRes.ok) continue;
            const vData = await vRes.json();
            const audioFormats = (vData.adaptiveFormats || []).filter(f => f.type && f.type.startsWith('audio/'));

            if (audioFormats.length > 0) {
                audioFormats.sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));
                return res.redirect(audioFormats[0].url);
            }
        } catch (err) {}
    }

    // Strategy 3: Direct safe audio bridge
    return res.redirect(`https://api.vevioz.com/api/button/mp3/${videoId}`);
});

// Dynamic PORT assignment for Render / Localhost
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});