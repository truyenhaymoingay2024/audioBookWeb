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
        search: document.getElementById('search-input'),
        badge: document.getElementById('last-played-info'),
        sortPopup: document.getElementById('sort-popup'),
        currentSortText: document.getElementById('current-sort-text')
    };

    let state = {
        currentFolder: null,
        playlist: [],
        currentIndex: 0,
        isPlaying: false,
        isDragging: false,
        currentSort: 'newest',
        speed: 1.0,
        sortMenuOpen: false,
        speedMenuOpen: false,
        durationCache: {}, // Cache for durations
        lastPlayedData: null // Thêm state lưu thông tin audio đã nghe
    };

    // === METADATA QUEUE SYSTEM (FIX 0:00 ISSUE) ===
    const metadataQueue = {
        queue: [],
        isProcessing: false,

        add(track, elementId) {
            // Check cache first
            if (state.durationCache[track.src]) {
                const el = document.getElementById(elementId);
                if (el) el.innerText = formatTime(state.durationCache[track.src]);
                return;
            }
            this.queue.push({
                track,
                elementId
            });
            this.process();
        },

        clear() {
            this.queue = [];
            this.isProcessing = false;
        },

        async process() {
            if (this.isProcessing || this.queue.length === 0) return;

            this.isProcessing = true;
            const item = this.queue.shift();

            try {
                const duration = await getTrackDuration(item.track.src);
                state.durationCache[item.track.src] = duration; // Cache it
                const el = document.getElementById(item.elementId);
                if (el) el.innerText = formatTime(duration);
            } catch (e) {
                console.log("Queue skip:", e);
            } finally {
                this.isProcessing = false;
                // Delay small amount to be gentle on network
                setTimeout(() => this.process(), 50);
            }
        }
    };

    function getTrackDuration(src) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.preload = 'metadata';
            // Timeout safety: if metadata loading hangs, resolve 0
            const timeout = setTimeout(() => {
                resolve(0);
            }, 5000);

            audio.onloadedmetadata = () => {
                clearTimeout(timeout);
                if (audio.duration === Infinity || isNaN(audio.duration)) {
                    resolve(0);
                } else {
                    resolve(audio.duration);
                }
            };

            audio.onerror = () => {
                clearTimeout(timeout);
                resolve(0);
            };

            audio.src = src;
        });
    }

    let touchStartX = 0;
    let touchEndX = 0;

    function init() {
        document.getElementById('site-name').innerText = CONFIG.siteName;
        document.getElementById('user-avatar').src = CONFIG.avatar;
        handleSort('newest');

        // Restore state
        const savedSpeed = sessionStorage.getItem('audioSpeed');
        if (savedSpeed) {
            state.speed = parseFloat(savedSpeed);
            updateSpeedUI(state.speed);
        }

        // Load last played audio từ localStorage
        loadLastPlayedAudio();

        // Events
        els.audio.addEventListener('timeupdate', onTimeUpdate);
        els.audio.addEventListener('ended', onTrackEnd);
        els.audio.addEventListener('loadedmetadata', onMetadataLoaded);
        els.audio.addEventListener('play', () => updatePlayState(true));
        els.audio.addEventListener('pause', () => updatePlayState(false));
        els.audio.addEventListener('ratechange', () => {
            if (els.audio.playbackRate !== state.speed) els.audio.playbackRate = state.speed;
        });

        // Lưu thời gian phát hiện tại mỗi 5 giây
        els.audio.addEventListener('timeupdate', debounce(saveCurrentAudioProgress, 5000));

        els.player.slider.addEventListener('input', onSeekInput);
        els.player.slider.addEventListener('change', onSeekChange);

        // Click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.speed-menu-container')) {
                els.player.speedPopup.classList.remove('active');
                state.speedMenuOpen = false;
            }
            if (!e.target.closest('.sort-menu-container')) {
                els.sortPopup.classList.remove('active');
                state.sortMenuOpen = false;
            }
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

    // === HÀM LƯU VÀ TẢI AUDIO ĐÃ NGHE ===
    function saveCurrentAudioProgress() {
        if (!state.currentFolder || !els.audio.src || isNaN(els.audio.currentTime)) return;
        
        const audioData = {
            folderId: state.currentFolder.id,
            trackIndex: state.currentIndex,
            currentTime: els.audio.currentTime,
            timestamp: Date.now(),
            folderTitle: state.currentFolder.title,
            trackTitle: state.playlist[state.currentIndex]?.title || '',
            author: state.currentFolder.author,
            src: els.audio.src // Lưu cả đường dẫn file để kiểm tra
        };
        
        localStorage.setItem('lastPlayedAudio', JSON.stringify(audioData));
        state.lastPlayedData = audioData;
        
        // Cập nhật badge nếu đang ở detail view
        updateLastPlayedBadge();
        
        // Cập nhật nút tiếp tục trên header
        updateResumeButton();
    }

    function loadLastPlayedAudio() {
        try {
            const saved = localStorage.getItem('lastPlayedAudio');
            if (saved) {
                state.lastPlayedData = JSON.parse(saved);
                console.log('Đã tải audio đã nghe cuối cùng:', state.lastPlayedData);
                updateResumeButton();
            }
        } catch (e) {
            console.error('Lỗi khi tải audio đã nghe:', e);
        }
    }

    function updateResumeButton() {
        const resumeBtn = document.getElementById('resume-last-audio-btn');
        if (!resumeBtn) return;
        
        if (state.lastPlayedData) {
            resumeBtn.classList.remove('hidden');
            const timeAgo = getTimeAgo(state.lastPlayedData.timestamp);
            resumeBtn.title = `Tiếp tục: ${state.lastPlayedData.trackTitle} (${formatTime(state.lastPlayedData.currentTime)}/${timeAgo})`;
        } else {
            resumeBtn.classList.add('hidden');
        }
    }

    function updateLastPlayedBadge() {
        if (!state.lastPlayedData || !els.badge) return;
        
        const timeAgo = getTimeAgo(state.lastPlayedData.timestamp);
        els.badge.innerText = `Đã nghe: ${state.lastPlayedData.trackTitle} (${timeAgo})`;
        els.badge.title = `Tiếp tục từ ${formatTime(state.lastPlayedData.currentTime)}`;
    }

    function getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        return `${days} ngày trước`;
    }

    function resumeLastAudio() {
        if (!state.lastPlayedData) return;
        
        // Tìm folder tương ứng
        const folder = LIBRARY.find(f => f.id === state.lastPlayedData.folderId);
        if (!folder) {
            console.log('Không tìm thấy folder đã lưu');
            alert('Không tìm thấy truyện đã nghe. Có thể nó đã bị xóa hoặc thay đổi.');
            return;
        }
        
        // Mở folder
        openFolder(folder.id);
        
        // Đợi một chút để playlist được tạo, sau đó phát tiếp từ vị trí đã lưu
        setTimeout(() => {
            if (state.lastPlayedData.trackIndex < state.playlist.length) {
                // Kiểm tra xem có cùng file không (tránh trường hợp file bị thay đổi)
                const savedSrc = state.lastPlayedData.src;
                const currentSrc = state.playlist[state.lastPlayedData.trackIndex]?.src;
                
                if (savedSrc && currentSrc && savedSrc !== currentSrc) {
                    console.log('File đã thay đổi, phát từ đầu');
                    playTrack(state.lastPlayedData.trackIndex);
                } else {
                    // Phát từ vị trí đã lưu
                    playTrackFromTime(state.lastPlayedData.trackIndex, state.lastPlayedData.currentTime);
                }
            }
        }, 300);
    }

    // Hàm mới: phát track từ thời điểm cụ thể
    function playTrackFromTime(index, startTime) {
        state.currentIndex = index;
        const track = state.playlist[index];

        els.audio.src = track.src;
        els.audio.playbackRate = state.speed;
        els.audio.load();

        els.player.title.innerText = track.title;
        els.player.author.innerText = state.currentFolder.title;
        els.player.cover.src = state.currentFolder.cover;

        els.player.bar.classList.remove('translate-y-[150%]');

        // Media Session
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

        // Chờ metadata load xong rồi set currentTime
        const onLoaded = () => {
            if (startTime > 0) {
                els.audio.currentTime = startTime;
            }
            play();
            els.audio.removeEventListener('loadedmetadata', onLoaded);
        };

        if (els.audio.readyState >= 1) {
            // Metadata đã được load
            if (startTime > 0) {
                els.audio.currentTime = startTime;
            }
            play();
        } else {
            // Chờ metadata load
            els.audio.addEventListener('loadedmetadata', onLoaded);
        }

        highlightCurrentTrack(index);
        // Lưu ngay khi bắt đầu phát
        saveCurrentAudioProgress();
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // === RENDERERS ===
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
                        <div class="aspect-[1/1] rounded-xl overflow-hidden mb-3 relative bg-gray-900 border border-white/5">
                            <img src="${folder.cover}" loading="lazy" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-500 ease-out img-fade" onload="this.classList.add('img-loaded')" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <i class="ph-fill ph-list-dashes text-white text-3xl drop-shadow-lg transform scale-50 group-hover:scale-100 transition duration-300"></i>
                            </div>
                        </div>
                        <h3 class="font-bold text-sm leading-tight mb-1 truncate px-1 text-white group-hover:text-blue-400 transition">${folder.title}</h3>
                        <p class="text-[10px] font-medium text-gray-400 px-1 truncate">${folder.author}</p>
                        <p class="text-[9px] text-gray-500 mt-2 px-1 flex items-center gap-1 font-mono">
                            <i class="ph-fill ph-files"></i> ${folder.chapters || folder.tracks.length} chương
                        </p>
                        ${state.lastPlayedData && state.lastPlayedData.folderId === folder.id ? 
                            `<div class="mt-2 px-1">
                                <span class="text-[8px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Đang nghe</span>
                            </div>` 
                            : ''}
                    </div>
                `).join('');
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

        // Clear old queue before rendering new
        metadataQueue.clear();

        renderTrackList();
        els.views.library.classList.add('hidden');
        els.views.detail.classList.remove('hidden');

        // Hiển thị nút tiếp tục nếu có dữ liệu audio đã nghe cho folder này
        const resumeBtn = document.getElementById('resume-btn');
        if (state.lastPlayedData && state.lastPlayedData.folderId === folder.id) {
            resumeBtn.classList.remove('hidden');
            updateLastPlayedBadge();
        } else {
            resumeBtn.classList.add('hidden');
            els.badge.innerText = '';
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function renderTrackList() {
        els.trackList.innerHTML = state.playlist.map((track, idx) => `
                    <div id="track-${idx}" onclick="app.playTrack(${idx})" class="track-item glass-panel !bg-white/5 border-transparent p-3 rounded-xl flex items-center gap-3 cursor-pointer group">
                        <div class="w-8 h-8 flex items-center justify-center font-bold text-gray-500 group-hover:text-blue-400 text-xs">${idx + 1}</div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-sm text-gray-200 truncate group-hover:text-blue-400 transition">${track.title}</h4>
                            <p class="text-[10px] text-gray-500 truncate font-mono mt-0.5"><i class="ph-fill ph-clock"></i> <span id="duration-text-${idx}">--:--</span></p>
                        </div>
                        <div class="flex items-center gap-2">
                            <a href="${track.src}" download target="_blank" onclick="event.stopPropagation()" 
                               class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition" title="Tải xuống">
                                <i class="ph-bold ph-download-simple text-base"></i>
                            </a>
                            <button class="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                                <i class="ph-fill ph-play text-sm"></i>
                            </button>
                        </div>
                    </div>
                `).join('');

        // Add to queue for lazy loading
        state.playlist.forEach((track, idx) => {
            metadataQueue.add(track, `duration-text-${idx}`);
        });
    }

    function highlightCurrentTrack(index) {
        document.querySelectorAll('.track-active').forEach(el => {
            el.classList.remove('track-active');
            const btn = el.querySelector('button:last-child');
            if (btn) {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-white/5', 'text-gray-400');
                btn.querySelector('i').classList.replace('ph-pause', 'ph-play');
            }
        });

        const el = document.getElementById(`track-${index}`);
        if (el) {
            el.classList.add('track-active');
            const btn = el.querySelector('button:last-child');
            if (btn) {
                btn.classList.remove('bg-white/5', 'text-gray-400');
                btn.classList.add('bg-blue-600', 'text-white');
                if (state.isPlaying) btn.querySelector('i').classList.replace('ph-play', 'ph-pause');
            }
            setTimeout(() => {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
        }
    }

    function playTrack(index) {
        playTrackFromTime(index, 0); // Sử dụng hàm mới với startTime = 0
    }

    function play() {
        els.audio.playbackRate = state.speed;
        els.audio.play().catch(e => console.log("Play prevented"));
    }

    function pause() {
        els.audio.pause();
        // Lưu khi tạm dừng
        saveCurrentAudioProgress();
    }

    function togglePlay() {
        if (els.audio.paused) {
            (!els.audio.src && state.playlist.length > 0) ? playTrack(0): play();
        } else pause();
    }

    function playAll() {
        if (state.playlist.length > 0) playTrack(0);
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
        // Lưu sau khi tua
        setTimeout(saveCurrentAudioProgress, 100);
    }

    function setSpeed(val) {
        state.speed = parseFloat(val);
        els.audio.playbackRate = state.speed;
        sessionStorage.setItem('audioSpeed', state.speed);
        updateSpeedUI(state.speed);
        els.player.speedPopup.classList.remove('active');
        state.speedMenuOpen = false;
    }

    function updateSpeedUI(val) {
        els.player.speedText.innerText = val;
        document.querySelectorAll('.speed-item').forEach(item => {
            item.classList.remove('selected');
            if (parseFloat(item.innerText) === val) item.classList.add('selected');
        });
    }

    function toggleSpeedMenu() {
        state.speedMenuOpen = !state.speedMenuOpen;
        state.sortMenuOpen = false;
        els.sortPopup.classList.remove('active');
        if (state.speedMenuOpen) els.player.speedPopup.classList.add('active');
        else els.player.speedPopup.classList.remove('active');
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
        // Lưu sau khi seek
        saveCurrentAudioProgress();
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

    function setSort(val) {
        state.currentSort = val;
        const texts = {
            'az': 'Tên A-Z',
            'za': 'Tên Z-A',
            'newest': 'Mới nhất',
            'oldest': 'Cũ nhất'
        };
        els.currentSortText.innerText = texts[val];
        handleSort(val);
        els.sortPopup.classList.remove('active');
        state.sortMenuOpen = false;

        document.querySelectorAll('.sort-item').forEach(item => {
            item.classList.remove('selected');
            if (item.innerText === texts[val]) item.classList.add('selected');
        });
    }

    function toggleSortMenu() {
        state.sortMenuOpen = !state.sortMenuOpen;
        state.speedMenuOpen = false;
        els.player.speedPopup.classList.remove('active');
        if (state.sortMenuOpen) els.sortPopup.classList.add('active');
        else els.sortPopup.classList.remove('active');
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

    function resumeLastPosition() {
        if (state.lastPlayedData && state.currentFolder && 
            state.lastPlayedData.folderId === state.currentFolder.id) {
            // Sử dụng hàm playTrackFromTime để tiếp tục từ đúng vị trí
            playTrackFromTime(state.lastPlayedData.trackIndex, state.lastPlayedData.currentTime);
        }
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
        playTrackFromTime, // Xuất thêm hàm này để có thể gọi từ nút resume
        togglePlay,
        playAll,
        skip,
        nextTrack,
        prevTrack,
        handleSearch,
        goHome,
        toggleSpeedMenu,
        setSpeed,
        setSort,
        toggleSortMenu,
        handleSort,
        resumeLastPosition,
        resumeLastAudio
    };
})();

document.addEventListener('DOMContentLoaded', app.init);