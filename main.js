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
        // Thêm các element của mini player
        mini: {
            cover: document.getElementById('mini-p-cover'),
            title: document.getElementById('mini-p-title'),
            author: document.getElementById('mini-p-author'),
            playIcon: document.getElementById('mini-p-play-icon')
        },
        search: document.getElementById('search-input'),
        badge: document.getElementById('last-played-info'),
        sortPopup: document.getElementById('sort-popup'),
        currentSortText: document.getElementById('current-sort-text'),
        timerText: document.getElementById('current-timer-text'),
        timerPopup: document.getElementById('timer-popup')
    };

    let state = {
        currentFolder: null,
        playlist: [],
        currentIndex: 0,
        isPlaying: false,
        isDragging: false,
        currentSort: 'newest',
        speed: 1.0,
        timer: 0, // 0 = tắt, -1 = hết chương, >0 = số phút
        timerId: null,
        timerRemaining: 0, // thời gian còn lại (giây)
        timerStartTime: 0,
        sortMenuOpen: false,
        speedMenuOpen: false,
        timerMenuOpen: false,
        durationCache: {}, // Cache for durations
        lastPlayedData: null, // Thêm state lưu thông tin audio đã nghe
        isMiniPlayer: false // Thêm state cho mini player
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

        // Restore timer
        const savedTimer = sessionStorage.getItem('audioTimer');
        if (savedTimer) {
            state.timer = parseInt(savedTimer);
            updateTimerUI(state.timer);
        }

        // Load last played audio từ localStorage
        loadLastPlayedAudio();

        // Khôi phục trạng thái mini player
        restorePlayerMode();

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
            if (!e.target.closest('.timer-menu-container')) {
                els.timerPopup.classList.remove('active');
                state.timerMenuOpen = false;
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

        // Cập nhật timer UI mỗi giây
        setInterval(updateTimerDisplay, 1000);

        // Thêm event listeners cho nút toggle player
        document.querySelectorAll('.toggle-player-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                togglePlayerMode();
            });
        });
    }

    // Hàm chuyển đổi giữa full player và mini player
    function togglePlayerMode() {
        state.isMiniPlayer = !state.isMiniPlayer;
        els.player.bar.classList.toggle('mini');
        
        // Lưu trạng thái vào localStorage
        localStorage.setItem('playerMode', state.isMiniPlayer ? 'mini' : 'full');
    }

    // Khôi phục trạng thái player khi load trang
    function restorePlayerMode() {
        const savedMode = localStorage.getItem('playerMode');
        if (savedMode === 'mini') {
            state.isMiniPlayer = true;
            els.player.bar.classList.add('mini');
        }
    }

    // === HÀM HẸN GIỜ TẮT NHẠC ===
    function setTimer(minutes) {
        // Xóa timer cũ nếu có
        clearTimer();
        
        state.timer = minutes;
        sessionStorage.setItem('audioTimer', minutes);
        updateTimerUI(minutes);
        
        // Nếu đang phát và có timer
        if (state.isPlaying && minutes !== 0) {
            startTimer(minutes);
        }
        
        els.timerPopup.classList.remove('active');
        state.timerMenuOpen = false;
    }
    
    function startTimer(minutes) {
        if (state.timerId) {
            clearTimeout(state.timerId);
            state.timerId = null;
        }
        
        if (minutes === -1) {
            // Hết chương: tính thời gian còn lại của track hiện tại
            const remaining = els.audio.duration - els.audio.currentTime;
            if (remaining > 0) {
                state.timerId = setTimeout(() => {
                    pause();
                    showToast('⏰ Hẹn giờ: Đã hết chương, dừng phát.');
                    setTimer(0); // Reset timer
                }, remaining * 1000);
                state.timerStartTime = Date.now();
                state.timerRemaining = remaining;
            }
        } else if (minutes > 0) {
            // Tính thời gian theo phút
            const ms = minutes * 60 * 1000;
            state.timerId = setTimeout(() => {
                pause();
                showToast(`⏰ Hẹn giờ: Đã hết ${minutes} phút, dừng phát.`);
                setTimer(0); // Reset timer
            }, ms);
            state.timerStartTime = Date.now();
            state.timerRemaining = minutes * 60;
        }
        
        // Cập nhật UI
        updateTimerButton();
    }
    
    function clearTimer() {
        if (state.timerId) {
            clearTimeout(state.timerId);
            state.timerId = null;
        }
        state.timerRemaining = 0;
        updateTimerButton();
    }
    
    function updateTimerUI(minutes) {
        const textMap = {
            0: 'Tắt',
            '-1': 'Hết chương',
            15: '15p',
            30: '30p',
            45: '45p',
            60: '60p'
        };
        els.timerText.innerText = textMap[minutes] || 'Tắt';
        
        // Cập nhật selected cho menu
        document.querySelectorAll('.timer-item').forEach(item => {
            item.classList.remove('selected');
            const itemText = item.innerText;
            if ((minutes === -1 && itemText === 'Hết chương') ||
                (minutes === 15 && itemText === '15 phút') ||
                (minutes === 30 && itemText === '30 phút') ||
                (minutes === 45 && itemText === '45 phút') ||
                (minutes === 60 && itemText === '60 phút') ||
                (minutes === 0 && itemText === 'Tắt')) {
                item.classList.add('selected');
            }
        });
        
        updateTimerButton();
    }
    
    function updateTimerDisplay() {
        if (state.timerId && state.timerRemaining > 0) {
            const elapsed = (Date.now() - state.timerStartTime) / 1000;
            const remaining = Math.max(0, state.timerRemaining - elapsed);
            
            if (remaining <= 0) {
                // Timer đã hết, sẽ được xử lý trong timeout
                return;
            }
            
            // Cập nhật tooltip với thời gian còn lại
            const timerTrigger = document.querySelector('.timer-menu-trigger');
            if (timerTrigger) {
                if (state.timer === -1) {
                    timerTrigger.title = `Hẹn giờ: Hết chương (còn ${formatTime(remaining)})`;
                } else {
                    timerTrigger.title = `Hẹn giờ: Còn ${formatTime(remaining)}`;
                }
            }
        }
    }
    
    function updateTimerButton() {
        const timerTrigger = document.querySelector('.timer-menu-trigger');
        if (!timerTrigger) return;
        
        if (state.timer === 0 || !state.timerId) {
            timerTrigger.classList.remove('timer-active');
            timerTrigger.title = 'Hẹn giờ tắt nhạc';
        } else {
            timerTrigger.classList.add('timer-active');
        }
    }
    
    function toggleTimerMenu() {
        state.timerMenuOpen = !state.timerMenuOpen;
        state.speedMenuOpen = false;
        state.sortMenuOpen = false;
        els.player.speedPopup.classList.remove('active');
        els.sortPopup.classList.remove('active');
        
        if (state.timerMenuOpen) els.timerPopup.classList.add('active');
        else els.timerPopup.classList.remove('active');
    }
    
    function showToast(message) {
        // Tạo toast thông báo
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            z-index: 10000;
            font-size: 14px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: toastSlideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideDown 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // === HÀM LƯU VÀ TẢI AUDIO ĐÃ NGHE (ĐÃ CẢI THIỆN) ===
    function saveCurrentAudioProgress() {
        if (!state.currentFolder || !els.audio.src || isNaN(els.audio.currentTime)) return;
        
        const audioData = {
            folderId: state.currentFolder.id,
            folderName: state.currentFolder.folderName,
            trackIndex: state.currentIndex,
            currentTime: els.audio.currentTime,
            timestamp: Date.now(),
            folderTitle: state.currentFolder.title,
            trackTitle: state.playlist[state.currentIndex]?.title || '',
            author: state.currentFolder.author,
            src: els.audio.src,
            duration: els.audio.duration,
            totalTracks: state.playlist.length
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
            
            // Cập nhật tooltip content
            const tooltipContent = document.getElementById('resume-tooltip-content');
            if (tooltipContent) {
                tooltipContent.innerHTML = `
                    <div><strong>${state.lastPlayedData.folderTitle}</strong></div>
                    <div>${state.lastPlayedData.trackTitle}</div>
                    <div class="text-green-300">${formatTime(state.lastPlayedData.currentTime)} • ${timeAgo}</div>
                `;
            }
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
            showToast('Không tìm thấy truyện đã nghe. Có thể nó đã bị xóa hoặc thay đổi.');
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
                
                // So sánh tên file thay vì toàn bộ URL (vì rootPath có thể thay đổi)
                const savedFileName = savedSrc ? savedSrc.split('/').pop() : '';
                const currentFileName = currentSrc ? currentSrc.split('/').pop() : '';
                
                if (savedFileName && currentFileName && savedFileName !== currentFileName) {
                    console.log('File đã thay đổi, tìm track phù hợp...');
                    // Tìm track có cùng title hoặc gần giống
                    const matchingTrack = state.playlist.find((track, idx) => 
                        track.title === state.lastPlayedData.trackTitle || 
                        idx === state.lastPlayedData.trackIndex
                    );
                    
                    if (matchingTrack) {
                        const newIndex = state.playlist.indexOf(matchingTrack);
                        playTrackFromTime(newIndex, 0); // Phát từ đầu nếu file khác
                        showToast('File đã thay đổi, phát từ đầu chương.');
                    } else {
                        playTrack(state.lastPlayedData.trackIndex); // Phát từ đầu
                        showToast('Không tìm thấy chương chính xác, phát từ đầu.');
                    }
                } else {
                    // Phát từ vị trí đã lưu - đảm bảo không vượt quá duration
                    const startTime = Math.min(
                        state.lastPlayedData.currentTime,
                        els.audio.duration - 5 // Đảm bảo còn ít nhất 5 giây
                    );
                    playTrackFromTime(state.lastPlayedData.trackIndex, Math.max(0, startTime));
                }
            } else {
                // Nếu trackIndex không hợp lệ, phát từ đầu
                playTrack(0);
            }
        }, 300);
    }

    // Hàm mới: phát track từ thời điểm cụ thể
    function playTrackFromTime(index, startTime) {
        // Hủy timer cũ
        if (state.timer === -1) {
            clearTimer();
        }
        
        state.currentIndex = index;
        const track = state.playlist[index];

        els.audio.src = track.src;
        els.audio.playbackRate = state.speed;
        els.audio.load();

        // Cập nhật thông tin cho cả full player và mini player
        els.player.title.innerText = track.title;
        els.player.author.innerText = state.currentFolder.title;
        els.player.cover.src = state.currentFolder.cover;
        
        // Cập nhật mini player
        els.mini.title.innerText = track.title;
        els.mini.author.innerText = state.currentFolder.title;
        els.mini.cover.src = state.currentFolder.cover;

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
            // Đảm bảo startTime hợp lệ
            const safeStartTime = Math.max(0, Math.min(startTime, els.audio.duration - 1));
            if (safeStartTime > 0) {
                els.audio.currentTime = safeStartTime;
            }
            
            // Khởi động lại timer nếu cần
            if (state.timer !== 0 && state.isPlaying) {
                startTimer(state.timer);
            }
            
            play();
            els.audio.removeEventListener('loadedmetadata', onLoaded);
        };

        if (els.audio.readyState >= 1) {
            // Metadata đã được load
            const safeStartTime = Math.max(0, Math.min(startTime, els.audio.duration - 1));
            if (safeStartTime > 0) {
                els.audio.currentTime = safeStartTime;
            }
            
            // Khởi động lại timer nếu cần
            if (state.timer !== 0 && state.isPlaying) {
                startTimer(state.timer);
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
                        <div class="flex-1 px-1">
                            <h3 class="font-bold text-sm leading-tight mb-1 truncate text-white group-hover:text-blue-400 transition" title="${folder.title}">${folder.title}</h3>
                            <p class="text-[10px] font-medium text-gray-400 truncate mb-2" title="${folder.author}">${folder.author}</p>
                            <div class="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                                <span class="flex items-center gap-1">
                                    <i class="ph-fill ph-files"></i> ${folder.chapters || folder.tracks.length} chương
                                </span>
                            </div>
                        </div>
                        ${state.lastPlayedData && state.lastPlayedData.folderId === folder.id ? 
                            `<div class="mt-2 px-1">
                                <span class="text-[8px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <i class="ph-fill ph-headphones"></i> Đang nghe
                                </span>
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
        
        // Khởi động lại timer nếu cần
        if (state.timer !== 0 && !state.timerId) {
            startTimer(state.timer);
        }
    }

    function pause() {
        els.audio.pause();
        // Lưu khi tạm dừng
        saveCurrentAudioProgress();
        
        // Dừng timer nhưng không xóa cài đặt
        if (state.timerId) {
            clearTimeout(state.timerId);
            state.timerId = null;
        }
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
            // Cập nhật mini player
            els.mini.playIcon.classList.replace('ph-play', 'ph-pause');
        } else {
            els.player.playIcon.classList.replace('ph-pause', 'ph-play');
            els.player.cover.style.animationPlayState = 'paused';
            // Cập nhật mini player
            els.mini.playIcon.classList.replace('ph-pause', 'ph-play');
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
        state.timerMenuOpen = false;
        els.sortPopup.classList.remove('active');
        els.timerPopup.classList.remove('active');
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
        // Xử lý timer "hết chương"
        if (state.timer === -1 && state.timerId) {
            clearTimer();
            setTimer(0);
        }
        
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
        state.timerMenuOpen = false;
        els.player.speedPopup.classList.remove('active');
        els.timerPopup.classList.remove('active');
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
        resumeLastAudio,
        setTimer,
        toggleTimerMenu,
        togglePlayerMode // Xuất hàm này để có thể gọi từ ngoài nếu cần
    };
})();

document.addEventListener('DOMContentLoaded', app.init);

// Thêm CSS animation cho toast
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideUp {
        from { transform: translateX(-50%) translateY(20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes toastSlideDown {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(20px); opacity: 0; }
    }
`;
document.head.appendChild(style);