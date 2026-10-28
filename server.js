const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend static assets serve karein
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(publicPath)) res.sendFile(publicPath);
    else if (fs.existsSync(rootPath)) res.sendFile(rootPath);
    else res.status(404).send('index.html not found');
});

// Search API
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Query required' });
        const r = await yts(query);
        const videos = (r.videos || []).slice(0, 20).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author ? v.author.name : 'Unknown Artist',
            duration: v.timestamp,
            thumbnail: v.thumbnail
        }));
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// External High-Speed Audio Stream Route (Zero Bot Block)
app.get('/api/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).send('Video ID is required');

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        // Fast processing via public converter instance
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: videoUrl,
                downloadMode: 'audio',
                audioFormat: 'mp3'
            })
        });

        const data = await response.json();

        if (data && data.url) {
            // Direct MP3 stream redirect
            return res.redirect(data.url);
        } else {
            // Safe fallback redirect agar API busy ho
            return res.redirect(`https://www.y2mate.com/youtube/${videoId}`);
        }
    } catch (err) {
        console.error('[Download error]:', err.message);
        return res.redirect(`https://www.y2mate.com/youtube/${videoId}`);
    }
});

// Dynamic PORT for cloud hosts (Render/Railway/Heroku/VPS)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});