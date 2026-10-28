const express = require('express');
const cors = require('cors');
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

// 1. Permanent Search API (Direct Audio Tracks with Instant MP3 Links)
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Query required' });

        // Jamendo Open API: Client ID 'c0f339eb' public testing ID hai
        const url = `https://api.jamendo.com/v3.0/tracks/?client_id=c0f339eb&format=jsonpretty&limit=25&namesearch=${encodeURIComponent(query)}&include=musicinfo`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.results) {
            return res.json([]);
        }

        const songs = data.results.map(t => {
            const sec = parseInt(t.duration) || 0;
            const minStr = Math.floor(sec / 60);
            const secStr = String(sec % 60).padStart(2, '0');

            return {
                id: t.id,
                title: t.name,
                artist: t.artist_name || 'Independent Artist',
                duration: `${minStr}:${secStr}`,
                thumbnail: t.image || 'https://via.placeholder.com/300',
                audioUrl: t.audio // Direct official 128-320kbps MP3 CDN stream
            };
        });

        res.json(songs);
    } catch (err) {
        console.error('[Search API Error]:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// 2. 1-Click Direct MP3 Downloader (100% Uptime, Never Blocked)
app.get('/api/download', (req, res) => {
    const trackId = req.query.id;
    let cleanTitle = (req.query.title || 'track')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!trackId) return res.status(400).send('Track ID is required');

    // Jamendo official direct MP3 download redirect
    const directDownloadUrl = `https://prod-1.storage.jamendo.com/download/track/${trackId}/mp32/`;
    return res.redirect(directDownloadUrl);
});

// Port binding for Render & Localhost
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});