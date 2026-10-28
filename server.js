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

// 1. YouTube Live Search API
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
            thumbnail: v.thumbnail
        }));

        res.json(videos);
    } catch (err) {
        console.error('[YouTube Search Error]:', err.message);
        res.status(500).json({ error: 'YouTube search failed' });
    }
});

// 2. YouTube MP3 Download Route (Direct Safe Stream Resolver)
app.get('/api/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).send('YouTube Video ID is required');

    // Direct universal YouTube MP3 stream redirect (No datacenter server-side conversion)
    return res.redirect(`https://mp3-download.cc/api/download?id=${videoId}`);
});

// Port binding for Render & Localhost
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});