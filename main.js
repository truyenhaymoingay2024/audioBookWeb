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
        swipeIndicator: document.getElementById('swipe-indicator'),
        resumeBtn: document.getElementById('resume-btn'),
        lastPlayedInfo: document.getElementById('last-played-info'),
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
        lastPosition: null,
        isSwiping: false,
        swipeStartX: 0,
        swipeStartY: 0,
        sortMenuOpen: false,
        speedMenuOpen: false,
        hasPlayedCurrentTrack: false,
        durationCache: new Map() // Cache durations để tránh tạo nhiều Audio object
    };

    // Touch gesture variables
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    const SWIPE_THRESHOLD = 60;

    function init() {
        document.getElementById('site-name').innerText = CONFIG.siteName;
        document.getElementById('user-avatar').src = CONFIG.avatar;
        
        // Set default sort
        setSort('newest');

        const savedSpeed = localStorage.getItem('audioSpeed');
        if (savedSpeed) {
            state.speed = parseFloat(savedSpeed);
            updateSpeedUI(state.speed);
        }

        // Load last playback position
        loadLastPosition();

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

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            // Close speed menu
            if (!e.target.closest('.speed-menu-container') && !e.target.closest('#speed-popup')) {
                els.player.speedPopup.classList.remove('active');
                state.speedMenuOpen = false;
            }
            
            // Close sort menu
            if (!e.target.closest('.sort-menu-container') && !e.target.closest('#sort-popup')) {
                els.sortPopup.classList.remove('active');
                state.sortMenuOpen = false;
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey || e.metaKey) prevTrack();
                    else skip(-5);
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey || e.metaKey) nextTrack();
                    else skip(5);
                    break;
                case 'KeyB':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        goHome();
                    }
                    break;
                case 'Escape':
                    // Close open dropdowns
                    els.player.speedPopup.classList.remove('active');
                    els.sortPopup.classList.remove('active');
                    state.sortMenuOpen = false;
                    state.speedMenuOpen = false;
                    break;
            }
        });

        // Swipe Gesture for mobile
        setupSwipeGestures();

        // Auto-save position every 3 seconds
        setInterval(() => {
            if (state.isPlaying && state.hasPlayedCurrentTrack) {
                saveCurrentPosition();
            }
        }, 3000);

        // Show swipe indicator on mobile
        if ('ontouchstart' in window) {
            setTimeout(() => {
                els.swipeIndicator.classList.add('opacity-100');
                setTimeout(() => {
                    els.swipeIndicator.classList.remove('opacity-100');
                }, 3000);
            }, 1000);
        }
        
        // Preload first book image for better UX
        if (LIBRARY.length > 0) {
            const img = new Image();
            img.src = LIBRARY[0].cover;
        }
    }

    function setupSwipeGestures() {
        const detailView = document.getElementById('detail-view');
        const playerBar = document.getElementById('player-bar');

        // 1. Swipe on detail view for back navigation
        if (detailView) {
            detailView.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
                state.isSwiping = true;
            }, { passive: true });

            detailView.addEventListener('touchmove', e => {
                if (!state.isSwiping) return;
                
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                // Only horizontal swipe with minimal vertical movement
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
                    e.preventDefault();
                    // Only show feedback for right swipe (back)
                    if (deltaX > 0) {
                        showSwipeFeedback('right');
                    }
                }
            }, { passive: false });

            detailView.addEventListener('touchend', e => {
                if (!state.isSwiping) return;
                
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                // Only process horizontal swipe
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    // Swipe right: back to library
                    if (deltaX > 0) {
                        goHome();
                    }
                }
                
                state.isSwiping = false;
                hideSwipeFeedback();
            }, { passive: true });
        }

        // 2. Swipe on player bar for track navigation
        if (playerBar) {
            playerBar.addEventListener('touchstart', e => {
                const touchX = e.changedTouches[0].screenX;
                const touchY = e.changedTouches[0].screenY;
                
                // Only handle swipe if there's a track playing
                if (state.playlist.length > 0 && els.audio.src) {
                    touchStartX = touchX;
                    touchStartY = touchY;
                    state.isSwiping = true;
                }
            }, { passive: true });

            playerBar.addEventListener('touchend', e => {
                if (!state.isSwiping || !state.playlist.length || !els.audio.src) return;
                
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                
                const deltaX = touchEndX - touchStartX;
                
                // Swipe on player bar: left/right for track navigation
                if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                    if (deltaX > 0) {
                        // Swipe right: previous track
                        prevTrack();
                    } else {
                        // Swipe left: next track
                        nextTrack();
                    }
                }
                
                state.isSwiping = false;
            }, { passive: true });
        }
    }

    function showSwipeFeedback(direction) {
        els.swipeIndicator.classList.add('opacity-100');
        const icon = els.swipeIndicator.querySelector('i.ph-arrow-left');
        const text = els.swipeIndicator.querySelector('div');
        if (icon && text) {
            if (direction === 'right') {
                icon.className = 'ph-bold ph-arrow-left mr-2';
                text.innerHTML = '<i class="ph-bold ph-arrow-left mr-2"></i> Vuốt để quay lại';
            }
        }
    }

    function hideSwipeFeedback() {
        setTimeout(() => {
            els.swipeIndicator.classList.remove('opacity-100');
        }, 300);
    }

    function saveCurrentPosition() {
        // Only save if there's a track playing and it has actually played for at least 3 seconds
        if (!state.currentFolder || !els.audio.src || !state.hasPlayedCurrentTrack) return;
        
        // Only save if played for at least 3 seconds to avoid saving when just starting
        if (els.audio.currentTime < 3) return;

        const position = {
            folderId: state.currentFolder.id,
            trackIndex: state.currentIndex,
            currentTime: els.audio.currentTime,
            duration: els.audio.duration,
            timestamp: Date.now(),
            title: state.playlist[state.currentIndex]?.title || '',
            folderTitle: state.currentFolder.title,
            folderName: state.currentFolder.folderName,
            author: state.currentFolder.author
        };

        localStorage.setItem('lastPlaybackPosition', JSON.stringify(position));
        state.lastPosition = position;
        
        // Update UI if in detail view
        updateLastPlayedInfo();
    }

    function loadLastPosition() {
        try {
            const saved = localStorage.getItem('lastPlaybackPosition');
            if (saved) {
                state.lastPosition = JSON.parse(saved);
                updateLastPlayedInfo();
                
                // Check if last position belongs to any existing folder
                const matchingFolder = LIBRARY.find(f => f.id === state.lastPosition.folderId);
                if (matchingFolder) {
                    console.log('Last played:', state.lastPosition.folderTitle, '-', state.lastPosition.title);
                }
            }
        } catch (e) {
            console.error('Failed to load last position:', e);
        }
    }

    function updateLastPlayedInfo() {
        if (!state.lastPosition || !els.lastPlayedInfo) return;
        
        const { folderTitle, title, timestamp } = state.lastPosition;
        const timeAgo = getTimeAgo(timestamp);
        
        els.lastPlayedInfo.textContent = `Đã nghe: ${title} (${timeAgo})`;
        
        // Only show resume button if we're in the correct folder
        if (state.currentFolder && state.lastPosition.folderId === state.currentFolder.id) {
            els.resumeBtn.classList.remove('hidden');
            els.resumeBtn.setAttribute('title', `Tiếp tục từ ${formatTime(state.lastPosition.currentTime)}`);
        } else {
            els.resumeBtn.classList.add('hidden');
        }
    }

    function getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes < 1) return 'vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;
        
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} tuần trước`;
        
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} tháng trước`;
        
        return 'lâu rồi';
    }

    function resumeLastPosition() {
        if (!state.lastPosition) return;
        
        // If in a different folder, open that folder first
        if (!state.currentFolder || state.currentFolder.id !== state.lastPosition.folderId) {
            const folder = LIBRARY.find(f => f.id === state.lastPosition.folderId);
            if (folder) {
                openFolder(folder.id);
                // Wait for folder to open then resume
                setTimeout(() => {
                    resumeTrackFromPosition();
                }, 500);
                return;
            }
        } else {
            // Already in correct folder, resume immediately
            resumeTrackFromPosition();
        }
    }

    function resumeTrackFromPosition() {
        if (!state.lastPosition || !state.currentFolder) return;
        
        const { trackIndex, currentTime } = state.lastPosition;
        
        if (trackIndex >= 0 && trackIndex < state.playlist.length) {
            playTrack(trackIndex);
            
            // Set time after audio has loaded
            const checkAudioLoaded = () => {
                if (els.audio.readyState > 0 && !isNaN(currentTime)) {
                    els.audio.currentTime = currentTime;
                    state.hasPlayedCurrentTrack = true;
                } else {
                    setTimeout(checkAudioLoaded, 100);
                }
            };
            setTimeout(checkAudioLoaded, 300);
        }
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

        els.grid.innerHTML = data.map(folder => {
            const hasLastPos = hasLastPosition(folder.id);
            return `
            <div class="glass-panel book-card p-3 pb-4 group" onclick="app.openFolder(${folder.id})" role="button" tabindex="0" aria-label="Mở ${folder.title}">
                <div class="aspect-[1/1] rounded-2xl overflow-hidden mb-3 relative bg-gray-800 border border-white/5">
                    <img src="${folder.cover}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'" loading="lazy" 
                         class="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out"
                         alt="${folder.title}">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div class="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition duration-300">
                            <i class="ph-fill ph-list-dashes text-white text-xl"></i>
                        </div>
                    </div>
                    ${hasLastPos ? `
                    <div class="absolute bottom-2 right-2 w-6 h-6 bg-blue-500/80 rounded-full flex items-center justify-center shadow-lg" title="Đã nghe dở">
                        <i class="ph-fill ph-history text-white text-xs"></i>
                    </div>` : ''}
                </div>
                <h3 class="font-bold text-lg leading-tight mb-1 truncate px-1 text-white group-hover:text-blue-400 transition">${folder.title}</h3>
                <p class="text-xs font-medium text-gray-400 px-1">${folder.author}</p>
                <p class="text-[10px] text-gray-500 mt-2 px-1 flex items-center gap-1">
                    <i class="ph-fill ph-files"></i> ${folder.tracks.length} phần
                </p>
            </div>
        `}).join('');
    }

    function hasLastPosition(folderId) {
        if (!state.lastPosition) return false;
        return state.lastPosition.folderId === folderId;
    }

    function setSort(value) {
        state.currentSort = value;
        
        // Update UI text
        let sortText = '';
        switch(value) {
            case 'az': sortText = 'Tên A-Z'; break;
            case 'za': sortText = 'Tên Z-A'; break;
            case 'newest': sortText = 'Mới nhất'; break;
            case 'oldest': sortText = 'Cũ nhất'; break;
        }
        els.currentSortText.textContent = sortText;
        
        // Update selected item in dropdown
        document.querySelectorAll('.sort-item').forEach(item => {
            item.classList.remove('selected');
            const itemValue = item.getAttribute('onclick').match(/setSort\('(.+?)'\)/)[1];
            if (itemValue === value) {
                item.classList.add('selected');
            }
        });
        
        // Close dropdown
        els.sortPopup.classList.remove('active');
        state.sortMenuOpen = false;
        
        // Apply sort
        handleSort(value);
    }

    function toggleSortMenu() {
        state.sortMenuOpen = !state.sortMenuOpen;
        state.speedMenuOpen = false;
        els.player.speedPopup.classList.remove('active');
        
        if (state.sortMenuOpen) {
            els.sortPopup.classList.add('active');
        } else {
            els.sortPopup.classList.remove('active');
        }
    }

    function handleSort(criteria) {
        state.currentSort = criteria;
        let sorted = [...LIBRARY];
        if (criteria === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title));
        if (criteria === 'za') sorted.sort((a, b) => b.title.localeCompare(a.title));
        if (criteria === 'newest') sorted.sort((a, b) => b.id - a.id);
        if (criteria === 'oldest') sorted.sort((a, b) => a.id - a.id);
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
        
        // Reset flag when opening new folder
        state.hasPlayedCurrentTrack = false;
        
        // Update resume button - only show if this folder has last position
        if (state.lastPosition && state.lastPosition.folderId === id) {
            els.resumeBtn.classList.remove('hidden');
        } else {
            els.resumeBtn.classList.add('hidden');
        }
        
        updateLastPlayedInfo();
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    async function getTrackDuration(src) {
        // Check cache first
        if (state.durationCache.has(src)) {
            return state.durationCache.get(src);
        }
        
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.src = src;
            
            audio.addEventListener('loadedmetadata', () => {
                state.durationCache.set(src, audio.duration);
                resolve(audio.duration);
            });
            
            audio.addEventListener('error', () => {
                resolve(0); // Default to 0 on error
            });
            
            // Timeout after 3 seconds
            setTimeout(() => {
                resolve(0);
            }, 3000);
        });
    }

    async function renderTrackList() {
        els.trackList.innerHTML = state.playlist.map((track, idx) => {
            const isLastPlayed = state.lastPosition && 
                state.lastPosition.folderId === state.currentFolder?.id && 
                state.lastPosition.trackIndex === idx;
            
            return `
            <div id="track-${idx}" onclick="app.playTrack(${idx})" 
                 class="track-item glass-panel !bg-white/5 border-transparent p-4 rounded-2xl flex items-center gap-4 cursor-pointer group transition-all duration-300 relative ${isLastPlayed ? 'border-l-4 border-l-blue-500' : ''}"
                 role="button" aria-label="Phát ${track.title}">
                
                ${isLastPlayed ? `
                <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full animate-pulse-subtle"></div>
                ` : ''}
                
                <div class="w-8 h-8 flex items-center justify-center font-bold text-gray-500 group-hover:text-blue-400 text-sm transition-colors">
                    ${idx + 1}
                </div>
                
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm md:text-base text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                        ${track.title}
                        ${isLastPlayed ? ' <span class="text-xs text-blue-400">(đang nghe)</span>' : ''}
                    </h4>
                    <p class="text-xs text-gray-500 truncate font-mono mt-0.5">
                        <i class="ph-fill ph-clock"></i> <span id="duration-text-${idx}">--:--</span>
                    </p>
                </div>
                
                <div class="flex items-center gap-3">
                    <a href="${track.src}" download target="_blank" onclick="event.stopPropagation()" 
                       class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
                       title="Tải xuống" aria-label="Tải xuống ${track.title}">
                        <i class="ph-bold ph-download-simple text-lg"></i>
                    </a>
                    
                    <button class="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
                            aria-label="Phát ${track.title}">
                        <i class="ph-fill ph-play"></i>
                    </button>
                </div>
            </div>
        `}).join('');

        // Load durations asynchronously
        state.playlist.forEach(async (track, idx) => {
            const duration = await getTrackDuration(track.src);
            const el = document.getElementById(`duration-text-${idx}`);
            if (el) el.innerText = formatTime(duration);
        });
    }

    function highlightCurrentTrack(index) {
        document.querySelectorAll('#track-list > div').forEach(el => {
            el.classList.remove('track-active');
            const playBtn = el.querySelector('button:last-child');
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
        els.player.bar.classList.add('show');

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

        // Mark that this track has been played
        state.hasPlayedCurrentTrack = true;
        
        play();
        highlightCurrentTrack(index);
        
        // Save position after 1 second (when playback has started)
        setTimeout(() => {
            saveCurrentPosition();
        }, 1000);
    }

    function togglePlay() {
        if (els.audio.paused) {
            if (!els.audio.src && state.playlist.length > 0) {
                playTrack(0);
            } else {
                play();
                // Mark as played if this is the first time
                if (!state.hasPlayedCurrentTrack && els.audio.currentTime > 0) {
                    state.hasPlayedCurrentTrack = true;
                }
            }
        } else {
            pause();
        }
        // Save position when changing play state
        setTimeout(() => {
            saveCurrentPosition();
        }, 500);
    }

    function playAll() {
        if (state.playlist.length > 0) playTrack(0);
    }

    function play() {
        els.audio.playbackRate = state.speed;
        els.audio.play().catch(e => console.log("Play prevented:", e));
    }

    function pause() {
        els.audio.pause();
    }

    function nextTrack() {
        if (state.currentIndex < state.playlist.length - 1) {
            playTrack(state.currentIndex + 1);
        }
    }

    function prevTrack() {
        if (state.currentIndex > 0) {
            playTrack(state.currentIndex - 1);
        }
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
        // Save position after skipping
        setTimeout(() => {
            saveCurrentPosition();
        }, 300);
    }

    function setSpeed(val) {
        const newSpeed = parseFloat(val);
        state.speed = newSpeed;
        els.audio.playbackRate = newSpeed;
        localStorage.setItem('audioSpeed', newSpeed);
        updateSpeedUI(newSpeed);
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
        
        if (state.speedMenuOpen) {
            els.player.speedPopup.classList.add('active');
        } else {
            els.player.speedPopup.classList.remove('active');
        }
    }

    function onTimeUpdate() {
        if (state.isDragging) return;
        const curr = els.audio.currentTime;
        const dur = els.audio.duration || 1;
        const percent = (curr / dur) * 100;
        els.player.slider.value = percent;
        els.player.fill.style.width = `${percent}%`;
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
        const newTime = (els.player.slider.value / 100) * els.audio.duration;
        els.audio.currentTime = newTime;
        
        // Save position after seeking
        if (state.hasPlayedCurrentTrack) {
            setTimeout(() => {
                saveCurrentPosition();
            }, 300);
        }
    }

    function onMetadataLoaded() {
        els.player.duration.innerText = formatTime(els.audio.duration);
        els.audio.playbackRate = state.speed;
    }

    function onTrackEnd() {
        if (state.currentIndex < state.playlist.length - 1) {
            playTrack(state.currentIndex + 1);
        } else {
            state.isPlaying = false;
            updatePlayState(false);
            // Save position when ending last track
            setTimeout(() => {
                saveCurrentPosition();
            }, 500);
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
        renderLibrary(LIBRARY.filter(item => 
            removeAccents(item.title).includes(term) || 
            removeAccents(item.author).includes(term)
        ));
    }

    function goHome() {
        els.views.detail.classList.add('hidden');
        els.views.library.classList.remove('hidden');
        state.currentFolder = null;
        state.hasPlayedCurrentTrack = false;
        handleSearch(els.search.value);
        touchStartX = 0;
        touchEndX = 0;
        
        // Hide resume button
        els.resumeBtn.classList.add('hidden');
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
        setSort,
        toggleSortMenu,
        handleSort,
        resumeLastPosition
    };
})();

document.addEventListener('DOMContentLoaded', app.init);