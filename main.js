const app = (() => {
    const els = {
        audio: document.getElementById('audio-core'),
        grid: document.getElementById('folder-grid'),
        trackList: document.getElementById('track-list'),
        views: {
            library: document.getElementById('library-view'),
            detail: document.getElementById('detail-view')
        },
        detail: {
            title: document.getElementById('detail-title'),
            author: document.getElementById('detail-author'),
            desc: document.getElementById('detail-desc'),
            cover: document.getElementById('detail-cover')
        },
        player: {
            bar: document.getElementById('player-bar'),
            title: document.getElementById('p-title'),
            author: document.getElementById('p-author'),
            cover: document.getElementById('p-cover'),
            playIcon: document.getElementById('p-play-icon'),
            slider: document.getElementById('p-slider'),
            fill: document.getElementById('p-progress-fill'),
            current: document.getElementById('p-current'),
            duration: document.getElementById('p-duration'),
            speedText: document.getElementById('current-speed-text'),
            speedPopup: document.getElementById('speed-popup')
        },
        search: document.getElementById('search-input')
    };

    let state = {
        currentFolder: null,
        playlist: [],
        currentIndex: 0,
        isPlaying: false,
        isDragging: false,
        currentSort: 'newest',
        speed: 1.0
    };

    // Touch gesture variables
    let touchStartX = 0;
    let touchEndX = 0;

    function init() {
        document.getElementById('site-name').innerText = CONFIG.siteName;
        document.getElementById('user-avatar').src = CONFIG.avatar;
        handleSort('newest');

        const savedSpeed = sessionStorage.getItem('audioSpeed');
        if (savedSpeed) {
            state.speed = parseFloat(savedSpeed);
            updateSpeedUI(state.speed);
        }

        els.audio.addEventListener('timeupdate', onTimeUpdate);
        els.audio.addEventListener('ended', onTrackEnd);
        els.audio.addEventListener('loadedmetadata', onMetadataLoaded);
        els.audio.addEventListener('play', () => updatePlayState(true));
        els.audio.addEventListener('pause', () => updatePlayState(false));
        els.audio.addEventListener('ratechange', () => {
            if (els.audio.playbackRate !== state.speed) els.audio.playbackRate = state.speed;
        });

        els.player.slider.addEventListener('input', onSeekInput);
        els.player.slider.addEventListener('change', onSeekChange);

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.speed-menu-container')) els.player.speedPopup.classList.remove('active');
        });

        document.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    skip(-5);
                    break;
                case 'ArrowRight':
                    skip(5);
                    break;
            }
        });

        // Swipe Gesture
        const detailView = document.getElementById('detail-view');
        detailView.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {
            passive: true
        });
        detailView.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX - touchStartX > 100) goHome();
        }, {
            passive: true
        });
    }

    function renderLibrary(data) {
        const countEl = document.getElementById('book-count');
        const emptyEl = document.getElementById('empty-state');
        countEl.innerText = `${data.length}`;
        if (data.length === 0) {
            els.grid.innerHTML = '';
            emptyEl.classList.remove('hidden');
            return;
        }
        emptyEl.classList.add('hidden');

        els.grid.innerHTML = data.map(folder => `
                    <div class="glass-panel book-card p-3 pb-4 group" onclick="app.openFolder(${folder.id})">
                        <div class="aspect-[1/1] rounded-2xl overflow-hidden mb-3 relative bg-gray-800 border border-white/5">
                            <img src="${folder.cover}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'" loading="lazy" class="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out">
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <div class="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition duration-300">
                                    <i class="ph-fill ph-list-dashes text-white text-xl"></i>
                                </div>
                            </div>
                        </div>
                        <h3 class="font-bold text-lg leading-tight mb-1 truncate px-1 text-white group-hover:text-blue-400 transition">${folder.title}</h3>
                        <p class="text-xs font-medium text-gray-400 px-1">${folder.author}</p>
                        <p class="text-[10px] text-gray-500 mt-2 px-1 flex items-center gap-1">
                            <i class="ph-fill ph-files"></i> ${folder.tracks.length} phần
                        </p>
                    </div>
                `).join('');
    }

    function handleSort(criteria) {
        state.currentSort = criteria;
        let sorted = [...LIBRARY];
        if (criteria === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title));
        if (criteria === 'za') sorted.sort((a, b) => b.title.localeCompare(a.title));
        if (criteria === 'newest') sorted.sort((a, b) => b.id - a.id);
        if (criteria === 'oldest') sorted.sort((a, b) => a.id - b.id);
        renderLibrary(sorted);
    }

    function openFolder(id) {
        const folder = LIBRARY.find(f => f.id === id);
        if (!folder) return;
        state.currentFolder = folder;
        state.playlist = folder.tracks.map(t => ({
            ...t,
            src: `${CONFIG.rootPath}/${folder.folderName}/${t.fileName}`
        }));

        els.detail.title.innerText = folder.title;
        els.detail.author.innerText = folder.author;
        els.detail.desc.innerText = folder.desc;
        els.detail.cover.src = folder.cover;

        renderTrackList();
        els.views.library.classList.add('hidden');
        els.views.detail.classList.remove('hidden');
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function renderTrackList() {
        els.trackList.innerHTML = state.playlist.map((track, idx) => `
                    <div id="track-${idx}" onclick="app.playTrack(${idx})" class="track-item glass-panel !bg-white/5 border-transparent p-4 rounded-2xl flex items-center gap-4 cursor-pointer group">
                        
                        <!-- STT -->
                        <div class="w-8 h-8 flex items-center justify-center font-bold text-gray-500 group-hover:text-blue-400 text-sm">${idx + 1}</div>
                        
                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-sm md:text-base text-gray-200 truncate group-hover:text-blue-400 transition">${track.title}</h4>
                            <p class="text-xs text-gray-500 truncate font-mono mt-0.5"><i class="ph-fill ph-clock"></i> <span id="duration-text-${idx}">--:--</span></p>
                        </div>
                        
                        <!-- Action Buttons (UPDATE: Thêm nút Download) -->
                        <div class="flex items-center gap-3">
                            <!-- Nút Download: Ngăn sự kiện click cha (stopPropagation) -->
                            <a href="${track.src}" download target="_blank" onclick="event.stopPropagation()" 
                               class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition shadow-sm" title="Tải xuống">
                                <i class="ph-bold ph-download-simple text-lg"></i>
                            </a>
                            
                            <!-- Nút Play -->
                            <button class="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition shadow-sm">
                                <i class="ph-fill ph-play"></i>
                            </button>
                        </div>

                    </div>
                `).join('');

        state.playlist.forEach((track, idx) => {
            const tempAudio = new Audio(track.src);
            tempAudio.addEventListener('loadedmetadata', () => {
                const el = document.getElementById(`duration-text-${idx}`);
                if (el) el.innerText = formatTime(tempAudio.duration);
            });
        });
    }

    function highlightCurrentTrack(index) {
        document.querySelectorAll('#track-list > div').forEach(el => {
            el.classList.remove('track-active');
            // Reset Play Icon
            const playBtn = el.querySelector('button:last-child'); // Nút Play là nút cuối cùng
            if (playBtn) {
                playBtn.querySelector('i').classList.replace('ph-pause', 'ph-play');
                playBtn.classList.remove('bg-blue-500', 'text-white');
            }
        });

        const el = document.getElementById(`track-${index}`);
        if (el) {
            el.classList.add('track-active');
            const btn = el.querySelector('button:last-child');
            if (btn) {
                btn.classList.add('bg-blue-500', 'text-white');
                if (state.isPlaying) btn.querySelector('i').classList.replace('ph-play', 'ph-pause');
            }
        }
    }

    function playTrack(index) {
        state.currentIndex = index;
        const track = state.playlist[index];
        els.audio.src = track.src;
        els.audio.playbackRate = state.speed;
        els.audio.load();

        els.player.title.innerText = track.title;
        els.player.author.innerText = state.currentFolder.title;
        els.player.cover.src = state.currentFolder.cover;

        els.player.bar.classList.remove('translate-y-[150%]');

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: `${state.currentFolder.title} - ${state.currentFolder.author}`,
                artwork: [{
                    src: state.currentFolder.cover,
                    sizes: '512x512',
                    type: 'image/jpeg'
                }]
            });
            navigator.mediaSession.setActionHandler('play', play);
            navigator.mediaSession.setActionHandler('pause', pause);
            navigator.mediaSession.setActionHandler('seekbackward', () => skip(-5));
            navigator.mediaSession.setActionHandler('seekforward', () => skip(5));
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (index > 0) playTrack(index - 1);
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (index < state.playlist.length - 1) playTrack(index + 1);
            });
        }

        play();
        highlightCurrentTrack(index);
    }

    function togglePlay() {
        if (els.audio.paused) {
            (!els.audio.src && state.playlist.length > 0) ? playTrack(0): play();
        } else pause();
    }

    function playAll() {
        if (state.playlist.length > 0) playTrack(0);
    }

    function play() {
        els.audio.playbackRate = state.speed;
        els.audio.play().catch(e => console.log("Play prevented"));
    }

    function pause() {
        els.audio.pause();
    }

    function nextTrack() {
        if (state.currentIndex < state.playlist.length - 1) playTrack(state.currentIndex + 1);
    }

    function prevTrack() {
        if (state.currentIndex > 0) playTrack(state.currentIndex - 1);
    }

    function updatePlayState(isPlaying) {
        state.isPlaying = isPlaying;
        if (isPlaying) {
            els.player.playIcon.classList.replace('ph-play', 'ph-pause');
            els.player.cover.style.animationPlayState = 'running';
        } else {
            els.player.playIcon.classList.replace('ph-pause', 'ph-play');
            els.player.cover.style.animationPlayState = 'paused';
        }
        highlightCurrentTrack(state.currentIndex);
    }

    function skip(seconds) {
        els.audio.currentTime += seconds;
    }

    function setSpeed(val) {
        const newSpeed = parseFloat(val);
        state.speed = newSpeed;
        els.audio.playbackRate = newSpeed;
        sessionStorage.setItem('audioSpeed', newSpeed);
        updateSpeedUI(newSpeed);
        els.player.speedPopup.classList.remove('active');
    }

    function updateSpeedUI(val) {
        els.player.speedText.innerText = val;
        document.querySelectorAll('.speed-item').forEach(item => {
            item.classList.remove('selected');
            if (item.innerText === String(val)) item.classList.add('selected');
        });
    }

    function toggleSpeedMenu() {
        els.player.speedPopup.classList.toggle('active');
    }

    function onTimeUpdate() {
        if (state.isDragging) return;
        const curr = els.audio.currentTime;
        const dur = els.audio.duration || 1;
        els.player.slider.value = (curr / dur) * 100;
        els.player.fill.style.width = `${els.player.slider.value}%`;
        els.player.current.innerText = formatTime(curr);
        els.player.duration.innerText = formatTime(dur);
    }

    function onSeekInput() {
        state.isDragging = true;
        els.player.fill.style.width = `${els.player.slider.value}%`;
        els.player.current.innerText = formatTime((els.player.slider.value / 100) * els.audio.duration);
    }

    function onSeekChange() {
        state.isDragging = false;
        els.audio.currentTime = (els.player.slider.value / 100) * els.audio.duration;
    }

    function onMetadataLoaded() {
        els.player.duration.innerText = formatTime(els.audio.duration);
        els.audio.playbackRate = state.speed;
    }

    function onTrackEnd() {
        if (state.currentIndex < state.playlist.length - 1) playTrack(state.currentIndex + 1);
        else {
            state.isPlaying = false;
            updatePlayState(false);
        }
    }

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}` : `${m}:${s < 10 ? '0' + s : s}`;
    }

    function removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function handleSearch(query) {
        if (!query) {
            handleSort(state.currentSort);
            return;
        }
        const term = removeAccents(query);
        renderLibrary(LIBRARY.filter(item => removeAccents(item.title).includes(term) || removeAccents(item.author).includes(term)));
    }

    function goHome() {
        els.views.detail.classList.add('hidden');
        els.views.library.classList.remove('hidden');
        state.currentFolder = null;
        handleSearch(els.search.value);
        touchStartX = 0;
        touchEndX = 0;
    }

    return {
        init,
        openFolder,
        playTrack,
        togglePlay,
        playAll,
        skip,
        nextTrack,
        prevTrack,
        handleSearch,
        goHome,
        toggleSpeedMenu,
        setSpeed,
        handleSort
    };
})();

document.addEventListener('DOMContentLoaded', app.init);