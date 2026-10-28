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

// 1. YouTube Search Engine (yt-search: No external fetch, 0% failure on Render)
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
            audioUrl: '' 
        }));

        res.json(videos);
    } catch (err) {
        console.error('[YTS Error]:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// 2. Direct Audio Stream / Download Route
app.get('/api/download', async (req, res) => {
    const videoId = req.query.id;
    let cleanTitle = (req.query.title || 'song')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!videoId) return res.status(400).send('Video ID is required');

    // Strategy 1: Saavn direct CDN search
    try {
        const cleanName = (req.query.title || '').replace(/\(.*?\)|\[.*?\]|Official|Video|Audio/gi, '').trim();
        const sRes = await fetch(`https://saavn.me/api/search/songs?query=${encodeURIComponent(cleanName)}&limit=1`);
        const sData = await sRes.json();
        if (sData?.data?.results?.[0]?.downloadUrl?.length > 0) {
            const urls = sData.data.results[0].downloadUrl;
            const target = urls.find(u => u.quality === '320kbps') || urls[urls.length - 1];
            if (target?.url) return res.redirect(target.url);
        }
    } catch (e) {}

    // Strategy 2: Fast Invidious Audio Stream
    const instances = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de'];
    for (const host of instances) {
        try {
            const controller = new AbortController();
            const to = setTimeout(() => controller.abort(), 3000);
            const vRes = await fetch(`${host}/api/v1/videos/${videoId}`, { signal: controller.signal });
            clearTimeout(to);
            if (vRes.ok) {
                const vData = await vRes.json();
                const audios = (vData.adaptiveFormats || []).filter(f => f.type && f.type.startsWith('audio/'));
                if (audios.length > 0) {
                    audios.sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));
                    return res.redirect(audios[0].url);
                }
            }
        } catch (err) {}
    }

    // Strategy 3: Fast Audio Resolver Fallback
    return res.redirect(`https://api.vevioz.com/api/button/mp3/${videoId}`);
});

// Render dynamic PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});