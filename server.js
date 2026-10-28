const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets reliably
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});