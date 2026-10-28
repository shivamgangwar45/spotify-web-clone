const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(publicPath)) res.sendFile(publicPath);
    else if (fs.existsSync(rootPath)) res.sendFile(rootPath);
    else res.status(404).send('index.html not found');
});

// Search API (Fast & Reliable on Cloud)
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
        console.error('[Search Error]:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// 100% Reliable Direct MP3 Download (JioSaavn Official CDN Engine)
app.get('/api/download', async (req, res) => {
    const title = req.query.title || '';
    const videoId = req.query.id;

    if (!videoId && !title) return res.status(400).send('Song title or ID required');

    // Clean song title for search
    const cleanQuery = title
        .replace(/\(.*?\)|\[.*?\]|Official|Music|Video|Audio|HD|4K|Remix/gi, '')
        .trim();

    try {
        // JioSaavn Public API call (No bot block, direct audio streams)
        const apiResponse = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQuery || title)}&limit=1`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const data = await apiResponse.json();

        if (data?.success && data?.data?.results?.length > 0) {
            const track = data.data.results[0];
            const downloadUrls = track.downloadUrl || [];
            
            // Highest quality available (320kbps or fallback)
            const targetAudio = downloadUrls.find(u => u.quality === '320kbps') || downloadUrls[downloadUrls.length - 1];

            if (targetAudio?.url) {
                // Direct high-speed CDN redirect: browser seedha file download karega
                return res.redirect(targetAudio.url);
            }
        }
    } catch (err) {
        console.error('[Saavn Download API Error]:', err.message);
    }

    // Fail-safe direct audio converter (No Method Not Allowed errors)
    return res.redirect(`https://mp3-download.cc/api/download?id=${videoId}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});