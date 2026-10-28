// ==========================================
// Spotify Clone - Pure YouTube Web Engine
// ==========================================

let ytPlayer = null;
let ytReady = false;
let ytProgressTimer = null;
let pendingTrackToPlay = null;

let currentTrack = null;
let currentPlaylist = [];
let currentTrackIndex = 0;

// Persistent Data Storage
let likedSongs = JSON.parse(localStorage.getItem('sp_liked_songs') || '[]');
let userPlaylists = JSON.parse(localStorage.getItem('sp_user_playlists') || '[]');
let activePlaylistId = 'liked';
let trackToAddToPlaylist = null;

// Feature: Play Queue State
let playQueue = [];
let isQueueViewActive = false;
let isShuffle = false;

// Feature: Web Audio Equalizer State
let audioCtx = null;
let eqSource = null;
let bassFilter = null;
let midFilter = null;
let trebleFilter = null;
const audioElem = document.getElementById('nativeAudioEngine');

// Feature: Lyrics State
let isLyricsViewActive = false;
let parsedLyrics = [];
let currentLyricsIndex = -1;

// Feature: Sleep Timer State
let sleepTimerId = null;
let sleepTimerEndTime = null;
let sleepMode = null;

// ================= ROBUST BACKGROUND AUDIO ENGINE =================
// Active Wake-Lock Audio Track: 1-second inaudible audio loop that registers in Android Audio Mixer
const silentAudioBridge = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
silentAudioBridge.loop = true;

function enableBackgroundAudio() {
  if (silentAudioBridge.paused) {
    silentAudioBridge.play().catch(() => {});
  }
}

// Keep-Alive Visibility Guard: Prevents Android Chrome from killing background playback
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    enableBackgroundAudio();
    if (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === 2) {
      // Agar Chrome ne background hide par pause kar diya, toh resume karo
      setTimeout(() => {
        if (ytPlayer && ytPlayer.playVideo) {
          ytPlayer.playVideo();
        }
      }, 150);
    }
  }
});

// ================= YOUTUBE IFRAME ENGINE INITIALIZER =================

function initYouTubeEngine() {
  if (ytPlayer) return;
  const engineDiv = document.getElementById('hiddenYtEngine');
  if (!engineDiv) return;

  ytPlayer = new YT.Player('hiddenYtEngine', {
    height: '200',
    width: '200',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      playsinline: 1, // Crucial for iOS/Android inline background
      rel: 0
    },
    events: {
      onReady: () => {
        ytReady = true;
        if (pendingTrackToPlay) {
          playTrackIdNow(pendingTrackToPlay);
          pendingTrackToPlay = null;
        }
      },
      onStateChange: onYtPlayerStateChange
    }
  });
}

window.onYouTubeIframeAPIReady = function() {
  initYouTubeEngine();
};

if (window.YT && window.YT.Player) {
  initYouTubeEngine();
}

// Default Home Screen Collections
const defaultStations = [
  { id: 'station1', title: 'Ava Max', desc: 'With David Guetta, Shawn Mendes, Tiësto...', thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', query: 'Ava Max popular songs' },
  { id: 'station2', title: 'Lana Del Rey', desc: 'Taylor Swift, The Weeknd, Lana Del Rey...', thumb: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80', query: 'Lana Del Rey hits' },
  { id: 'station3', title: 'The Weeknd', desc: 'With Doja Cat, Drake, Ariana Grande...', thumb: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80', query: 'The Weeknd hits' }
];

const defaultMixes = [
  { id: 'mix1', title: '2000s Mix', desc: 'Akon, Rihanna, Alka Yagnik and more', thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80', query: 'Best of 2000s hindi english hits' },
  { id: 'mix2', title: 'Alka Yagnik Mix', desc: 'Roop Kumar Rathod, Vinod Rathod and Anand...', thumb: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80', query: 'Alka Yagnik 90s evergreen songs' }
];

const defaultAlbums = [
  { id: 'alb1', title: 'Aarzoo', desc: 'Anu Malik', thumb: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&q=80', query: 'Aarzoo movie songs' },
  { id: 'alb2', title: 'Dhurandhar', desc: 'Shashwat Sachdev', thumb: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=200&q=80', query: 'Dhurandhar song Shashwat Sachdev' },
  { id: 'alb3', title: 'Barfi!', desc: 'Pritam', thumb: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200&q=80', query: 'Barfi movie songs Pritam' }
];

const defaultArtistRecs = [
  { id: 'art1', title: 'Majboor', desc: 'Single • Sheheryar Rehan, Zoha...', thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80', query: 'Majboor song' },
  { id: 'art2', title: 'Tere Ishk Mein', desc: 'Album • A.R. Rahman, Irshad Kamil', thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80', query: 'Tere Ishk Mein AR Rahman' }
];

window.addEventListener('DOMContentLoaded', () => {
  renderHomeRows();
  setupMediaSession();
  initEqualizer();

  const searchInput = document.getElementById('mobileSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(searchTimer);
        handleLiveSearch(searchInput.value.trim(), true);
      }
    });
  }
});

function renderHomeRows() {
  renderCarousel('recommendedStationsRow', defaultStations);
  renderCarousel('topMixesRow', defaultMixes);
  renderCarousel('likedAlbumsRow', defaultAlbums);
  renderCarousel('artistRecommendationsRow', defaultArtistRecs);
}

function renderCarousel(elementId, items) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'track-item-card';
    card.onclick = () => quickPlayTerm(item.query);
    card.innerHTML = `
      <div class="card-cover-wrapper">
        <img src="${item.thumb}" alt="${item.title}" loading="lazy">
      </div>
      <div class="card-title-text">${item.title}</div>
      <div class="card-subtitle-text">${item.desc}</div>
    `;
    container.appendChild(card);
  });
}

async function quickPlayTerm(query) {
  switchNavTab('search');
  const input = document.getElementById('mobileSearchInput');
  if (input) input.value = query;
  await handleLiveSearch(query, true);
  const firstRow = document.querySelector('.result-row-item');
  if (firstRow) firstRow.click();
}

// ================= ULTRA-FAST LIVE SEARCH =================

let searchTimer = null;
let searchAbortController = null;

async function handleLiveSearch(val, immediate = false) {
  const query = val.trim();
  const catWrap = document.getElementById('browseCategoriesWrap');
  const resultsWrap = document.getElementById('liveSearchResultsWrap');

  if (!query) {
    if (catWrap) catWrap.style.display = 'flex';
    if (resultsWrap) resultsWrap.style.display = 'none';
    return;
  }

  if (catWrap) catWrap.style.display = 'none';
  if (resultsWrap) {
    resultsWrap.style.display = 'flex';
    resultsWrap.innerHTML = '<p style="color:#1ed760; font-size:13px; padding:10px 0;">Searching songs on YouTube...</p>';
  }

  clearTimeout(searchTimer);

  const executeFetch = async () => {
    if (searchAbortController) {
      searchAbortController.abort();
    }
    searchAbortController = new AbortController();

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: searchAbortController.signal
      });
      const songs = await res.json();

      if (!resultsWrap) return;
      resultsWrap.innerHTML = '';
      if (!songs || songs.length === 0) {
        resultsWrap.innerHTML = '<p style="color:#b3b3b3; font-size:13px;">No tracks found.</p>';
        return;
      }

      currentPlaylist = songs;
      songs.forEach((song, idx) => {
        const isLiked = likedSongs.some(l => l.id === song.id);
        const row = document.createElement('div');
        row.className = 'result-row-item';
        row.onclick = () => playSongByIndex(idx);
        row.innerHTML = `
          <img class="result-row-img" src="${song.thumbnail}" alt="${song.title}" loading="lazy">
          <div class="result-row-info">
            <div class="result-row-title">${escapeHtml(song.title)}</div>
            <div class="result-row-desc">Song • ${escapeHtml(song.artist)}</div>
          </div>
          <div class="result-actions" onclick="event.stopPropagation()">
            <i class="fa-solid fa-layer-group" title="Add to Queue" onclick="addToQueue('${song.id}', '${encodeURIComponent(song.title)}', '${encodeURIComponent(song.artist)}', '${song.thumbnail}')"></i>
            <i class="fa-solid fa-folder-plus" title="Add to Playlist" onclick="openAddToPlaylistModal('${song.id}', '${encodeURIComponent(song.title)}', '${encodeURIComponent(song.artist)}', '${song.thumbnail}')"></i>
            <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color:#1ed760;' : ''}" onclick="toggleLike('${song.id}', '${encodeURIComponent(song.title)}', '${encodeURIComponent(song.artist)}', '${song.thumbnail}', this)"></i>
          </div>
        `;
        resultsWrap.appendChild(row);
      });
    } catch (e) {
      if (e.name !== 'AbortError' && resultsWrap) {
        resultsWrap.innerHTML = '<p style="color:#ff5555; font-size:13px;">Search failed. Ensure server is running.</p>';
      }
    }
  };

  if (immediate) {
    executeFetch();
  } else {
    searchTimer = setTimeout(executeFetch, 380);
  }
}

// ================= TRACK PLAYBACK =================

function playSongByIndex(idx) {
  if (!currentPlaylist || !currentPlaylist[idx]) return;
  currentTrackIndex = idx;
  const track = currentPlaylist[idx];
  currentTrack = track;

  const miniTitle = document.getElementById('miniTitle');
  const miniArtist = document.getElementById('miniArtist');
  const miniThumb = document.getElementById('miniThumb');
  if (miniTitle) miniTitle.innerText = track.title;
  if (miniArtist) miniArtist.innerText = track.artist;
  if (miniThumb) miniThumb.src = track.thumbnail;

  const fullTitle = document.getElementById('fullTrackTitle');
  const fullArtist = document.getElementById('fullTrackArtist');
  const fullCover = document.getElementById('fullCoverArt');
  const fullAlbum = document.getElementById('fullAlbumSub');
  if (fullTitle) fullTitle.innerText = track.title;
  if (fullArtist) fullArtist.innerText = track.artist;
  if (fullCover) fullCover.src = track.thumbnail;
  if (fullAlbum) fullAlbum.innerText = track.artist;

  updateFullHeartIcon();

  resetLyricsState();
  fetchSongLyrics(track.title, track.artist);

  extractVibrantColor(track.thumbnail);
  updateMediaSessionMetadata(track);
  renderQueueView();

  if (ytPlayer && ytReady && ytPlayer.loadVideoById) {
    playTrackIdNow(track.id);
  } else {
    pendingTrackToPlay = track.id;
    if (!ytPlayer && window.YT && window.YT.Player) {
      initYouTubeEngine();
    }
  }
}

function playTrackIdNow(id) {
  try {
    ytPlayer.loadVideoById({ videoId: id, startSeconds: 0 });
    ytPlayer.playVideo();
    updatePlayIcons(true);
    startYtTracker();
    enableBackgroundAudio();
  } catch (err) {
    console.warn("Player play error:", err);
  }
}

function onYtPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    updatePlayIcons(true);
    startYtTracker();
    enableBackgroundAudio();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  } else if (event.data === YT.PlayerState.PAUSED) {
    // Agar screen off ho chuki hai aur track automatically pause hua hai, background audio chalate rahein
    if (document.hidden) {
      enableBackgroundAudio();
    } else {
      updatePlayIcons(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
  } else if (event.data === YT.PlayerState.ENDED) {
    if (sleepMode === 'end_of_track') {
      pauseOnSleep();
    } else {
      playNextTrack();
    }
  }
}

function startYtTracker() {
  if (ytProgressTimer) clearInterval(ytProgressTimer);
  ytProgressTimer = setInterval(() => {
    if (!ytPlayer || !ytPlayer.getCurrentTime) return;
    const cur = ytPlayer.getCurrentTime() || 0;
    const dur = ytPlayer.getDuration() || 0;
    if (dur > 0) {
      const pct = (cur / dur) * 100;
      const miniFill = document.getElementById('miniProgressFill');
      const fullFill = document.getElementById('fullScrubFill');
      const curTime = document.getElementById('fullCurrentTime');
      const totTime = document.getElementById('fullTotalTime');

      if (miniFill) miniFill.style.width = `${pct}%`;
      if (fullFill) fullFill.style.width = `${pct}%`;
      if (curTime) curTime.innerText = formatTime(cur);
      if (totTime) totTime.innerText = formatTime(dur);

      updateLyricsProgress(cur);
    }
  }, 250);
}

function togglePlayState() {
  if (!ytPlayer || !ytPlayer.getPlayerState) return;
  const state = ytPlayer.getPlayerState();
  if (state === 1) {
    ytPlayer.pauseVideo();
    updatePlayIcons(false);
    if (!silentAudioBridge.paused) silentAudioBridge.pause();
  } else {
    enableBackgroundAudio();
    ytPlayer.playVideo();
    updatePlayIcons(true);
  }
}

function updatePlayIcons(isPlaying) {
  const miniIcon = document.getElementById('miniPlayIcon');
  const fullIcon = document.getElementById('fullPlayIcon');
  if (miniIcon) miniIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  if (fullIcon) fullIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
}

function playNextTrack() {
  if (playQueue.length > 0) {
    const nextSong = playQueue.shift();
    renderQueueView();
    currentPlaylist.splice(currentTrackIndex + 1, 0, nextSong);
    playSongByIndex(currentTrackIndex + 1);
    return;
  }

  if (isShuffle && currentPlaylist.length > 1) {
    let randIdx = Math.floor(Math.random() * currentPlaylist.length);
    playSongByIndex(randIdx);
    return;
  }

  if (currentPlaylist.length > currentTrackIndex + 1) {
    playSongByIndex(currentTrackIndex + 1);
  }
}

function playPreviousTrack() {
  if (currentTrackIndex > 0) {
    playSongByIndex(currentTrackIndex - 1);
  }
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById('shuffleBtn');
  if (btn) btn.style.color = isShuffle ? '#1ed760' : '#ffffff';
}

function seekAudioTime(e) {
  const bar = e.currentTarget;
  const rect = bar.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  if (ytPlayer && ytPlayer.getDuration) {
    const targetSec = pos * ytPlayer.getDuration();
    ytPlayer.seekTo(targetSec, true);
    updateLyricsProgress(targetSec);
  }
}

function formatTime(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

// ================= NAVIGATION & FULLSCREEN VIEW =================

function switchNavTab(tab) {
  document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('homeViewContainer').style.display = 'none';
  document.getElementById('searchViewContainer').style.display = 'none';
  document.getElementById('libraryViewContainer').style.display = 'none';

  if (tab === 'home') {
    document.getElementById('navHomeBtn').classList.add('active');
    document.getElementById('homeViewContainer').style.display = 'flex';
  } else if (tab === 'search') {
    document.getElementById('navSearchBtn').classList.add('active');
    document.getElementById('searchViewContainer').style.display = 'flex';
  } else if (tab === 'library') {
    document.getElementById('navLibraryBtn').classList.add('active');
    document.getElementById('libraryViewContainer').style.display = 'flex';
    renderLibraryView();
  }
}

function expandFullScreenPlayer() {
  const modal = document.getElementById('fullscreenPlayerModal');
  const header = document.getElementById('topHeader');
  const viewport = document.getElementById('mainViewport');
  const miniBar = document.getElementById('miniPlayerBar');
  const bottomNav = document.querySelector('.bottom-nav-bar');

  if (header) header.style.setProperty('display', 'none', 'important');
  if (viewport) viewport.style.setProperty('display', 'none', 'important');
  if (miniBar) miniBar.style.setProperty('display', 'none', 'important');
  if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');

  document.body.style.overflow = 'hidden';

  if (modal) {
    modal.classList.add('open');
    modal.scrollTop = 0;
  }

  if (currentTrack) {
    extractVibrantColor(currentTrack.thumbnail);
  }
}

function closeFullScreenPlayer() {
  const modal = document.getElementById('fullscreenPlayerModal');
  const header = document.getElementById('topHeader');
  const viewport = document.getElementById('mainViewport');
  const miniBar = document.getElementById('miniPlayerBar');
  const bottomNav = document.querySelector('.bottom-nav-bar');

  if (modal) modal.classList.remove('open');

  if (header) header.style.removeProperty('display');
  if (viewport) viewport.style.removeProperty('display');
  if (miniBar) miniBar.style.removeProperty('display');
  if (bottomNav) bottomNav.style.removeProperty('display');

  document.body.style.overflow = '';
}

// ================= LIKED SONGS & PLAYLISTS =================

function toggleLike(id, titleEnc, artistEnc, thumb, iconElem) {
  const title = decodeURIComponent(titleEnc);
  const artist = decodeURIComponent(artistEnc);
  const idx = likedSongs.findIndex(s => s.id === id);

  if (idx > -1) {
    likedSongs.splice(idx, 1);
    if (iconElem) {
      iconElem.className = 'fa-regular fa-heart';
      iconElem.style.color = '';
    }
  } else {
    likedSongs.unshift({ id, title, artist, thumbnail: thumb });
    if (iconElem) {
      iconElem.className = 'fa-solid fa-heart';
      iconElem.style.color = '#1ed760';
    }
  }

  localStorage.setItem('sp_liked_songs', JSON.stringify(likedSongs));
  updateFullHeartIcon();
  if (activePlaylistId === 'liked') renderActivePlaylistTracks();
}

function toggleLikeCurrentSong() {
  if (!currentTrack) return;
  toggleLike(
    currentTrack.id,
    encodeURIComponent(currentTrack.title),
    encodeURIComponent(currentTrack.artist),
    currentTrack.thumbnail
  );
}

function updateFullHeartIcon() {
  const fullHeart = document.getElementById('fullHeartBtn');
  if (!fullHeart || !currentTrack) return;
  const isLiked = likedSongs.some(s => s.id === currentTrack.id);
  fullHeart.className = isLiked ? 'fa-solid fa-heart full-heart-icon liked' : 'fa-regular fa-heart full-heart-icon';
}

function openLikedSongsView() {
  activePlaylistId = 'liked';
  switchNavTab('library');
}

function openCreatePlaylistModal() {
  document.getElementById('newPlaylistInput').value = '';
  document.getElementById('createPlaylistModal').style.display = 'flex';
}

function closeCreatePlaylistModal() {
  document.getElementById('createPlaylistModal').style.display = 'none';
}

function submitNewPlaylist() {
  const name = document.getElementById('newPlaylistInput').value.trim();
  if (!name) return alert('Please enter a playlist name');

  const newPl = {
    id: 'pl_' + Date.now(),
    name: name,
    tracks: []
  };

  userPlaylists.push(newPl);
  localStorage.setItem('sp_user_playlists', JSON.stringify(userPlaylists));
  closeCreatePlaylistModal();
  activePlaylistId = newPl.id;
  switchNavTab('library');
}

function selectPlaylistView(plId) {
  activePlaylistId = plId;
  renderLibraryView();
}

function renderLibraryView() {
  renderPlaylistPills();
  renderActivePlaylistTracks();
}

function renderPlaylistPills() {
  const pillsWrap = document.getElementById('playlistsListWrap');
  if (!pillsWrap) return;
  pillsWrap.innerHTML = '';

  const likedPill = document.createElement('div');
  likedPill.className = `playlist-card-pill ${activePlaylistId === 'liked' ? 'active' : ''}`;
  likedPill.onclick = () => selectPlaylistView('liked');
  likedPill.innerHTML = `
    <div class="playlist-card-icon" style="background: linear-gradient(135deg, #450af5, #8e8ee5); color: #fff;">
      <i class="fa-solid fa-heart"></i>
    </div>
    <div class="playlist-card-info">
      <span class="playlist-card-title">Liked Songs</span>
      <span class="playlist-card-count">${likedSongs.length} songs</span>
    </div>
  `;
  pillsWrap.appendChild(likedPill);

  userPlaylists.forEach(pl => {
    const plPill = document.createElement('div');
    plPill.className = `playlist-card-pill ${activePlaylistId === pl.id ? 'active' : ''}`;
    plPill.onclick = () => selectPlaylistView(pl.id);
    plPill.innerHTML = `
      <div class="playlist-card-icon">
        <i class="fa-solid fa-music"></i>
      </div>
      <div class="playlist-card-info">
        <span class="playlist-card-title">${escapeHtml(pl.name)}</span>
        <span class="playlist-card-count">${pl.tracks.length} songs</span>
      </div>
    `;
    pillsWrap.appendChild(plPill);
  });
}

function renderActivePlaylistTracks() {
  const container = document.getElementById('libraryTracksList');
  const heading = document.getElementById('librarySectionHeading');
  if (!container || !heading) return;
  container.innerHTML = '';

  let tracksToRender = [];
  if (activePlaylistId === 'liked') {
    heading.innerText = 'Liked Songs';
    tracksToRender = likedSongs;
  } else {
    const pl = userPlaylists.find(p => p.id === activePlaylistId);
    heading.innerText = pl ? pl.name : 'Playlist';
    tracksToRender = pl ? pl.tracks : [];
  }

  if (tracksToRender.length === 0) {
    container.innerHTML = '<p style="color:#a7a7a7; font-size:13px; padding:10px 0;">No songs in this playlist yet. Add songs using Search!</p>';
    return;
  }

  tracksToRender.forEach((song, idx) => {
    const isLiked = likedSongs.some(l => l.id === song.id);
    const row = document.createElement('div');
    row.className = 'result-row-item';
    row.onclick = () => {
      currentPlaylist = tracksToRender;
      playSongByIndex(idx);
    };
    row.innerHTML = `
      <img class="result-row-img" src="${song.thumbnail}" alt="${song.title}">
      <div class="result-row-info">
        <div class="result-row-title">${escapeHtml(song.title)}</div>
        <div class="result-row-desc">${escapeHtml(song.artist)}</div>
      </div>
      <div class="result-actions" onclick="event.stopPropagation()">
        ${activePlaylistId !== 'liked' ? `<i class="fa-solid fa-trash" title="Remove" style="font-size:14px; color:#ff5555;" onclick="removeSongFromPlaylist('${song.id}')"></i>` : ''}
        <i class="fa-solid fa-layer-group" title="Add to Queue" onclick="addToQueue('${song.id}', '${encodeURIComponent(song.title)}', '${encodeURIComponent(song.artist)}', '${song.thumbnail}')"></i>
        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color:#1ed760;' : ''}" onclick="toggleLike('${song.id}', '${encodeURIComponent(song.title)}', '${encodeURIComponent(song.artist)}', '${song.thumbnail}', this)"></i>
      </div>
    `;
    container.appendChild(row);
  });
}

function openAddToPlaylistModal(id, titleEnc, artistEnc, thumb) {
  trackToAddToPlaylist = {
    id: id,
    title: decodeURIComponent(titleEnc),
    artist: decodeURIComponent(artistEnc),
    thumbnail: thumb
  };

  const listContainer = document.getElementById('playlistSelectionList');
  listContainer.innerHTML = '';

  if (userPlaylists.length === 0) {
    listContainer.innerHTML = `
      <p style="color:#b3b3b3; font-size:13px;">No custom playlists created yet.</p>
      <button class="bitrate-btn-option" style="justify-content:center; background:#1ed760; color:#000;" onclick="closeAddToPlaylistModal(); openCreatePlaylistModal();">
        + Create Playlist First
      </button>
    `;
  } else {
    userPlaylists.forEach(pl => {
      const btn = document.createElement('button');
      btn.className = 'playlist-select-item';
      btn.innerHTML = `<span>${escapeHtml(pl.name)}</span> <i class="fa-solid fa-plus"></i>`;
      btn.onclick = () => addCurrentTrackToSpecificPlaylist(pl.id);
      listContainer.appendChild(btn);
    });
  }

  document.getElementById('addToPlaylistModal').style.display = 'flex';
}

function closeAddToPlaylistModal() {
  document.getElementById('addToPlaylistModal').style.display = 'none';
  trackToAddToPlaylist = null;
}

function addCurrentTrackToSpecificPlaylist(plId) {
  if (!trackToAddToPlaylist) return;
  const pl = userPlaylists.find(p => p.id === plId);
  if (!pl) return;

  const exists = pl.tracks.some(t => t.id === trackToAddToPlaylist.id);
  if (exists) {
    alert(`"${trackToAddToPlaylist.title}" already exists in ${pl.name}!`);
    return;
  }

  pl.tracks.push(trackToAddToPlaylist);
  localStorage.setItem('sp_user_playlists', JSON.stringify(userPlaylists));
  alert(`Added to "${pl.name}"!`);
  closeAddToPlaylistModal();
}

function removeSongFromPlaylist(songId) {
  const pl = userPlaylists.find(p => p.id === activePlaylistId);
  if (!pl) return;
  pl.tracks = pl.tracks.filter(t => t.id !== songId);
  localStorage.setItem('sp_user_playlists', JSON.stringify(userPlaylists));
  renderLibraryView();
}

// ================= UP NEXT QUEUE =================

function toggleQueueView() {
  isQueueViewActive = !isQueueViewActive;
  isLyricsViewActive = false;

  const cover = document.getElementById('fullCoverContainer');
  const lyricsView = document.getElementById('lyricsViewContainer');
  const queueView = document.getElementById('queueViewContainer');
  const qBtn = document.getElementById('queueToggleBtn');
  const lBtn = document.getElementById('lyricsToggleBtn');

  if (lyricsView) lyricsView.style.display = 'none';
  if (lBtn) lBtn.classList.remove('active');

  if (isQueueViewActive) {
    if (cover) cover.style.display = 'none';
    if (queueView) queueView.style.display = 'flex';
    if (qBtn) qBtn.classList.add('active');
    renderQueueView();
  } else {
    if (cover) cover.style.display = 'block';
    if (queueView) queueView.style.display = 'none';
    if (qBtn) qBtn.classList.remove('active');
  }
}

function addToQueue(id, titleEnc, artistEnc, thumb) {
  const item = {
    id: id,
    title: decodeURIComponent(titleEnc),
    artist: decodeURIComponent(artistEnc),
    thumbnail: thumb
  };
  playQueue.push(item);
  renderQueueView();
}

function clearPlayQueue() {
  playQueue = [];
  renderQueueView();
}

function renderQueueView() {
  const box = document.getElementById('queueScrollBox');
  if (!box) return;
  box.innerHTML = '';

  if (playQueue.length === 0) {
    box.innerHTML = '<p class="queue-placeholder">Queue is empty. Tap the layer icon in Search to add songs!</p>';
    return;
  }

  playQueue.forEach((track, qIdx) => {
    const row = document.createElement('div');
    row.className = 'queue-item-row';
    row.onclick = () => {
      playQueue.splice(qIdx, 1);
      currentPlaylist.splice(currentTrackIndex + 1, 0, track);
      playSongByIndex(currentTrackIndex + 1);
    };
    row.innerHTML = `
      <img class="queue-item-img" src="${track.thumbnail}" alt="${track.title}">
      <div class="queue-item-info">
        <div class="queue-item-title">${escapeHtml(track.title)}</div>
        <div class="queue-item-artist">${escapeHtml(track.artist)}</div>
      </div>
      <i class="fa-solid fa-xmark" style="color:#a7a7a7; font-size:14px; padding:4px;" onclick="event.stopPropagation(); removeQueueItem(${qIdx})"></i>
    `;
    box.appendChild(row);
  });
}

function removeQueueItem(idx) {
  playQueue.splice(idx, 1);
  renderQueueView();
}

// ================= EQUALIZER & BASS BOOST =================

function initEqualizer() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();

    bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 60;

    midFilter = audioCtx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;

    trebleFilter = audioCtx.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 10000;

    if (audioElem) {
      eqSource = audioCtx.createMediaElementSource(audioElem);
      eqSource.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(audioCtx.destination);
    }
  } catch (err) {
    console.warn("Equalizer initialized safely:", err);
  }
}

function openEqModal() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  document.getElementById('equalizerModal').style.display = 'flex';
}

function closeEqModal() {
  document.getElementById('equalizerModal').style.display = 'none';
}

function updateEqBand(band, val) {
  const num = parseFloat(val);
  if (band === 'bass' && bassFilter) {
    bassFilter.gain.value = num;
    document.getElementById('eqBassVal').innerText = `${num > 0 ? '+' : ''}${num} dB`;
  } else if (band === 'mid' && midFilter) {
    midFilter.gain.value = num;
    document.getElementById('eqMidVal').innerText = `${num > 0 ? '+' : ''}${num} dB`;
  } else if (band === 'treble' && trebleFilter) {
    trebleFilter.gain.value = num;
    document.getElementById('eqTrebleVal').innerText = `${num > 0 ? '+' : ''}${num} dB`;
  }
}

function applyEqPreset(preset, btn) {
  document.querySelectorAll('.eq-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (preset === 'bass') setEqValues(10, 0, -2);
  else if (preset === 'vocal') setEqValues(-2, 8, 4);
  else if (preset === 'rock') setEqValues(6, -1, 5);
  else if (preset === 'electronic') setEqValues(9, 2, 7);
  else setEqValues(0, 0, 0);
}

function setEqValues(b, m, t) {
  document.getElementById('eqBass').value = b;
  document.getElementById('eqMid').value = m;
  document.getElementById('eqTreble').value = t;
  updateEqBand('bass', b);
  updateEqBand('mid', m);
  updateEqBand('treble', t);
}

// ================= MEDIASESSION API (LOCK SCREEN CONTROLS) =================

function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.setActionHandler('play', () => {
    enableBackgroundAudio();
    togglePlayState();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    togglePlayState();
  });
  navigator.mediaSession.setActionHandler('previoustrack', () => playPreviousTrack());
  navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime && ytPlayer && ytPlayer.seekTo) {
      ytPlayer.seekTo(details.seekTime, true);
    }
  });
}

function updateMediaSessionMetadata(track) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: 'Spotify Web Clone',
    artwork: [
      { src: track.thumbnail, sizes: '96x96', type: 'image/jpeg' },
      { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
      { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
      { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }
    ]
  });
}

// ================= LYRICS ENGINE (LRCLIB API) =================

function toggleLyricsView() {
  isLyricsViewActive = !isLyricsViewActive;
  isQueueViewActive = false;

  const cover = document.getElementById('fullCoverContainer');
  const lyricsView = document.getElementById('lyricsViewContainer');
  const queueView = document.getElementById('queueViewContainer');
  const lBtn = document.getElementById('lyricsToggleBtn');
  const qBtn = document.getElementById('queueToggleBtn');

  if (queueView) queueView.style.display = 'none';
  if (qBtn) qBtn.classList.remove('active');

  if (isLyricsViewActive) {
    if (cover) cover.style.display = 'none';
    if (lyricsView) lyricsView.style.display = 'flex';
    if (lBtn) lBtn.classList.add('active');
  } else {
    if (cover) cover.style.display = 'block';
    if (lyricsView) lyricsView.style.display = 'none';
    if (lBtn) lBtn.classList.remove('active');
  }
}

function resetLyricsState() {
  parsedLyrics = [];
  currentLyricsIndex = -1;
  const box = document.getElementById('lyricsScrollBox');
  if (box) box.innerHTML = '<p class="lyrics-placeholder">Fetching lyrics...</p>';
}

async function fetchSongLyrics(rawTitle, rawArtist) {
  const box = document.getElementById('lyricsScrollBox');
  const badge = document.getElementById('lyricsModeBadge');

  const cleanTitle = rawTitle.replace(/\(.*?\)|\[.*?\]|Official|Music|Video|Audio|Lyric|Lyrics|HD|4K/gi, '').trim();
  const cleanArtist = rawArtist.replace(/Topic|VEVO/gi, '').trim();

  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const res = await fetch(url);
    if (!res.ok) {
      fallbackSearchLyrics(cleanTitle);
      return;
    }
    const data = await res.json();

    if (data && data.syncedLyrics) {
      if (badge) { badge.innerText = 'SYNCED'; badge.style.background = '#1ed760'; }
      parseSyncedLyrics(data.syncedLyrics);
    } else if (data && data.plainLyrics) {
      if (badge) { badge.innerText = 'PLAIN'; badge.style.background = '#888'; }
      renderPlainLyrics(data.plainLyrics);
    } else {
      fallbackSearchLyrics(cleanTitle);
    }
  } catch (err) {
    fallbackSearchLyrics(cleanTitle);
  }
}

async function fallbackSearchLyrics(query) {
  const box = document.getElementById('lyricsScrollBox');
  const badge = document.getElementById('lyricsModeBadge');

  try {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      if (box) box.innerHTML = '<p class="lyrics-placeholder">Lyrics not available for this song.</p>';
      return;
    }
    const results = await res.json();

    if (results && results.length > 0) {
      const match = results[0];
      if (match.syncedLyrics) {
        if (badge) { badge.innerText = 'SYNCED'; badge.style.background = '#1ed760'; }
        parseSyncedLyrics(match.syncedLyrics);
        return;
      } else if (match.plainLyrics) {
        if (badge) { badge.innerText = 'PLAIN'; badge.style.background = '#888'; }
        renderPlainLyrics(match.plainLyrics);
        return;
      }
    }
    if (box) box.innerHTML = '<p class="lyrics-placeholder">Lyrics not available for this song.</p>';
  } catch (e) {
    if (box) box.innerHTML = '<p class="lyrics-placeholder">Unable to load lyrics.</p>';
  }
}

function parseSyncedLyrics(lrcText) {
  parsedLyrics = [];
  const lines = lrcText.split('\n');
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  lines.forEach((line) => {
    const match = line.match(regex);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = parseFloat('0.' + match[3]);
      const totalSeconds = min * 60 + sec + ms;
      const text = match[4].trim();
      if (text) parsedLyrics.push({ time: totalSeconds, text });
    }
  });

  renderParsedLyrics();
}

function renderParsedLyrics() {
  const box = document.getElementById('lyricsScrollBox');
  if (!box) return;
  box.innerHTML = '';

  parsedLyrics.forEach((item, idx) => {
    const p = document.createElement('div');
    p.className = 'lyrics-line';
    p.id = `lyric-line-${idx}`;
    p.innerText = item.text;
    p.onclick = () => {
      if (ytPlayer && ytPlayer.seekTo) {
        ytPlayer.seekTo(item.time, true);
      }
    };
    box.appendChild(p);
  });
}

function renderPlainLyrics(text) {
  parsedLyrics = [];
  const box = document.getElementById('lyricsScrollBox');
  if (!box) return;
  box.innerHTML = '';
  const lines = text.split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      const p = document.createElement('div');
      p.className = 'lyrics-line active';
      p.style.fontSize = '16px';
      p.innerText = line;
      box.appendChild(p);
    }
  });
}

function updateLyricsProgress(currentTime) {
  if (parsedLyrics.length === 0) return;

  let activeIndex = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currentTime >= parsedLyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  if (activeIndex !== currentLyricsIndex && activeIndex !== -1) {
    if (currentLyricsIndex !== -1) {
      const prevElem = document.getElementById(`lyric-line-${currentLyricsIndex}`);
      if (prevElem) prevElem.classList.remove('active');
    }

    const curElem = document.getElementById(`lyric-line-${activeIndex}`);
    if (curElem) {
      curElem.classList.add('active');
      curElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    currentLyricsIndex = activeIndex;
  }
}

// ================= CANVAS COLOR EXTRACTION =================

function extractVibrantColor(imgUrl) {
  if (!imgUrl) return;
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = imgUrl;

  img.onload = function () {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 30;
      canvas.height = 30;

      ctx.drawImage(img, 0, 0, 30, 30);
      const imgData = ctx.getImageData(0, 0, 30, 30).data;

      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < imgData.length; i += 4) {
        const pr = imgData[i];
        const pg = imgData[i + 1];
        const pb = imgData[i + 2];

        const brightness = (pr + pg + pb) / 3;
        if (brightness > 30 && brightness < 225) {
          r += pr;
          g += pg;
          b += pb;
          count++;
        }
      }

      if (count > 0) {
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
      } else {
        r = 35; g = 55; b = 45;
      }

      const darkR = Math.max(16, Math.floor(r * 0.6));
      const darkG = Math.max(16, Math.floor(g * 0.6));
      const darkB = Math.max(16, Math.floor(b * 0.6));

      document.documentElement.style.setProperty('--dynamic-bg-solid', `rgb(${darkR}, ${darkG}, ${darkB})`);
      document.documentElement.style.setProperty('--dynamic-theme-color', `rgb(${r}, ${g}, ${b})`);
      document.documentElement.style.setProperty('--dynamic-theme-glow', `rgb(${r}, ${g}, ${b})`);
    } catch (e) {
      console.warn('Canvas color note:', e.message);
    }
  };
}

// ================= SLEEP TIMER ENGINE =================

function openSleepTimerModal() {
  const modal = document.getElementById('sleepTimerModal');
  const badge = document.getElementById('activeTimerBadge');
  const offBtn = document.getElementById('turnOffTimerBtn');

  if (sleepMode) {
    if (sleepMode === 'end_of_track') {
      if (badge) badge.innerText = 'End of Track';
    } else {
      const remainingMs = sleepTimerEndTime - Date.now();
      const remainingMins = Math.max(1, Math.ceil(remainingMs / 60000));
      if (badge) badge.innerText = `${remainingMins} min left`;
    }
    if (offBtn) offBtn.style.display = 'flex';
  } else {
    if (badge) badge.innerText = 'Off';
    if (offBtn) offBtn.style.display = 'none';
  }

  if (modal) modal.style.display = 'flex';
}

function closeSleepTimerModal() {
  const modal = document.getElementById('sleepTimerModal');
  if (modal) modal.style.display = 'none';
}

function setSleepTimer(val) {
  cancelSleepTimer(false);
  sleepMode = val;
  const icon = document.getElementById('sleepTimerIconBtn');

  if (val === 'end_of_track') {
    if (icon) icon.classList.add('active');
    closeSleepTimerModal();
    return;
  }

  const minutes = parseInt(val);
  const ms = minutes * 60 * 1000;
  sleepTimerEndTime = Date.now() + ms;
  if (icon) icon.classList.add('active');

  sleepTimerId = setTimeout(() => {
    executeSleepFadeOut();
  }, Math.max(0, ms - 5000));

  closeSleepTimerModal();
}

function cancelSleepTimer() {
  if (sleepTimerId) {
    clearTimeout(sleepTimerId);
    sleepTimerId = null;
  }
  sleepTimerEndTime = null;
  sleepMode = null;

  const icon = document.getElementById('sleepTimerIconBtn');
  if (icon) icon.classList.remove('active');
  closeSleepTimerModal();
}

function executeSleepFadeOut() {
  if (!ytPlayer || !ytPlayer.getVolume) {
    pauseOnSleep();
    return;
  }

  let vol = ytPlayer.getVolume() || 100;
  const originalVol = vol;
  const fadeStep = vol / 10;

  const fadeInterval = setInterval(() => {
    vol = Math.max(0, vol - fadeStep);
    if (ytPlayer.setVolume) ytPlayer.setVolume(vol);

    if (vol <= 0) {
      clearInterval(fadeInterval);
      pauseOnSleep();
      setTimeout(() => {
        if (ytPlayer.setVolume) ytPlayer.setVolume(originalVol);
      }, 1000);
    }
  }, 500);
}

function pauseOnSleep() {
  if (ytPlayer && ytPlayer.pauseVideo) {
    ytPlayer.pauseVideo();
  }
  updatePlayIcons(false);
  cancelSleepTimer();
}

// Helpers
function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function openTasteModal() {
  alert('Search any song or artist from the Search tab to play!');
}

function filterTab(category, btn) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (category === 'music') {
    quickPlayTerm('Top Bollywood Trending Music');
  } else if (category === 'podcasts') {
    quickPlayTerm('Trending Hindi Podcasts');
  } else {
    switchNavTab('home');
    renderHomeRows();
  }
}