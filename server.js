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

// 1. Search API (JioSaavn Engine)
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Query required' });

        const apiRes = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=25`);
        const data = await apiRes.json();

        if (!data.success || !data.data || !data.data.results) {
            return res.json([]);
        }

        const songs = data.data.results.map(s => {
            // Pick highest quality image (500x500)
            const thumb = (s.image && s.image.length > 0) 
                ? (s.image.find(img => img.quality === '500x500') || s.image[s.image.length - 1]).url 
                : '';

            // Pick 320kbps or best available download/stream link
            let downloadUrl = '';
            if (s.downloadUrl && s.downloadUrl.length > 0) {
                const bestAudio = s.downloadUrl.find(a => a.quality === '320kbps') || s.downloadUrl[s.downloadUrl.length - 1];
                downloadUrl = bestAudio.url;
            }

            // Duration in seconds to mm:ss format
            const sec = parseInt(s.duration) || 0;
            const minStr = Math.floor(sec / 60);
            const secStr = String(sec % 60).padStart(2, '0');

            return {
                id: s.id,
                title: s.name.replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
                artist: (s.artists && s.artists.primary && s.artists.primary.length > 0) 
                    ? s.artists.primary.map(a => a.name).join(', ') 
                    : 'Unknown Artist',
                duration: `${minStr}:${secStr}`,
                thumbnail: thumb,
                audioUrl: downloadUrl // Direct CDN audio link
            };
        });

        res.json(songs);
    } catch (err) {
        console.error('Search API error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Direct Instant Download Route (Direct Browser Stream)
app.get('/api/download', async (req, res) => {
    const audioUrl = req.query.url;
    let cleanTitle = (req.query.title || 'song')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!audioUrl) return res.status(400).send('Audio URL required');

    try {
        // Direct stream pipe to user browser with forced download headers
        const streamRes = await fetch(audioUrl);
        if (!streamRes.ok) return res.redirect(audioUrl);

        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Fast chunk streaming without loading entire file in RAM
        const reader = streamRes.body.getReader();
        const pump = async () => {
            const { done, value } = await reader.read();
            if (done) return res.end();
            res.write(Buffer.from(value));
            return pump();
        };
        return pump();
    } catch (err) {
        // Fallback: direct CDN redirect if proxy fails
        return res.redirect(audioUrl);
    }
});

// Dynamic PORT assignment for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});