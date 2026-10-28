const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Root route - Serve UI
app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(publicPath)) res.sendFile(publicPath);
    else if (fs.existsSync(rootPath)) res.sendFile(rootPath);
    else res.status(404).send('index.html not found');
});

// Search API (YouTube search via yt-search)
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
        console.error('[Search API Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Direct Audio Download Route
app.get('/api/download', async (req, res) => {
    const videoId = req.query.id;
    let cleanTitle = (req.query.title || 'song')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!cleanTitle) cleanTitle = `track_${videoId}`;
    if (!videoId) return res.status(400).send('Video ID is required');

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        // Direct loader instance request
        const convUrl = `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=mp3&url=${encodeURIComponent(videoUrl)}`;
        const initialRes = await fetch(convUrl);
        const initialData = await initialRes.json();

        if (initialData && initialData.id) {
            let downloadUrl = null;

            // Poll progress until audio file is ready (up to ~18 seconds)
            for (let i = 0; i < 12; i++) {
                await new Promise(r => setTimeout(r, 1500));
                const progressRes = await fetch(`https://loader.to/ajax/progress.php?id=${initialData.id}`);
                const progressData = await progressRes.json();

                if (progressData && progressData.download_url) {
                    downloadUrl = progressData.download_url;
                    break;
                }
            }

            if (downloadUrl) {
                return res.redirect(downloadUrl);
            }
        }

        // Secondary direct fallback endpoint
        const fallbackRes = await fetch(`https://api.vevioz.com/api/button/mp3/${videoId}`);
        if (fallbackRes.ok) {
            return res.redirect(`https://api.vevioz.com/api/button/mp3/${videoId}`);
        }

        res.status(500).send('Conversion service timed out. Please try again.');
    } catch (err) {
        console.error('[Download error]:', err.message);
        res.status(500).send('Download server busy. Please retry.');
    }
});

// Dynamic PORT assignment for Render / Railway / Localhost
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});