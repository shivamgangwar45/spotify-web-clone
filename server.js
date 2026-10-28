const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

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

// 100% Cross-Platform Audio Downloader (Linux & Windows)
app.get('/api/download', (req, res) => {
    const videoId = req.query.id;
    const bitrate = req.query.bitrate || '320';
    let cleanTitle = (req.query.title || 'song')
        .replace(/[^\w\s.-]/gi, '')
        .trim()
        .replace(/\s+/g, '_');

    if (!cleanTitle) cleanTitle = `track_${videoId}`;
    if (!videoId) return res.status(400).send('Video ID is required');

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Cross-platform binary resolution (Local Windows .exe vs Linux system path)
    const localWindowsExe = path.join(__dirname, 'yt-dlp.exe');
    const executable = (process.platform === 'win32' && fs.existsSync(localWindowsExe)) 
        ? localWindowsExe 
        : 'yt-dlp';

    const tempFile = path.join(os.tmpdir(), `${cleanTitle}_${Date.now()}.mp3`);

    const args = [
        '-f', 'ba/b',
        '--no-playlist',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', bitrate === '128' ? '5' : (bitrate === '256' ? '2' : '0'),
        '-o', tempFile,
        videoUrl
    ];

    console.log(`[Download] Starting: ${videoId} at ${bitrate}kbps using ${executable}`);
    const child = spawn(executable, args);

    child.stderr.on('data', (d) => {
        console.log(`[yt-dlp debug]: ${d.toString()}`);
    });

    child.on('close', (code) => {
        if (code === 0 && fs.existsSync(tempFile)) {
            res.download(tempFile, `${cleanTitle}_${bitrate}kbps.mp3`, () => {
                try { fs.unlinkSync(tempFile); } catch (e) {}
            });
        } else {
            // Fallback for partially matched temp filenames
            try {
                const matching = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(cleanTitle) && f.endsWith('.mp3'));
                if (matching.length > 0) {
                    const target = path.join(os.tmpdir(), matching[0]);
                    return res.download(target, `${cleanTitle}_${bitrate}kbps.mp3`, () => {
                        try { fs.unlinkSync(target); } catch (e) {}
                    });
                }
            } catch (err) {}

            if (!res.headersSent) {
                res.status(500).send('Audio conversion failed on server.');
            }
        }
    });

    child.on('error', (err) => {
        console.error('[Download error]:', err.message);
        if (!res.headersSent) res.status(500).send('Downloader process error: ' + err.message);
    });

    req.on('close', () => {
        child.kill();
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
    });
});

// Dynamic PORT for cloud hosts (Render/Railway/Heroku/VPS)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});