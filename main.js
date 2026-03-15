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
            author: document.querySelector('.author-name'),
            desc: document.getElementById('detail-desc'),
            cover: document.getElementById('detail-cover'),
            coverGlow: document.getElementById('cover-glow'),
            favBtn: document.getElementById('detail-fav-btn'),
            trackCount: document.getElementById('detail-track-count')
        },
        player: {
            wrapper: document.getElementById('player-wrapper'),
            dragHandle: document.getElementById('player-drag-handle'),
            title: document.getElementById('p-title'),
            author: document.getElementById('p-author'),
            cover: document.getElementById('p-cover'),
            playIcon: document.getElementById('p-play-icon'),
            playIconMini: document.getElementById('p-play-icon-mini'),
            slider: document.getElementById('p-slider'),
            fill: document.getElementById('p-progress-fill'),
            miniFill: document.getElementById('p-mini-progress-fill'),
            current: document.getElementById('p-current'),
            duration: document.getElementById('p-duration'),
            speedText: document.getElementById('current-speed-text'),
            speedPopup: document.getElementById('speed-popup'),
            timerBtn: document.getElementById('timer-btn'),
            timerDot: document.querySelector('.timer-dot'),
            timerPopup: document.getElementById('timer-popup')
        },
        search: document.getElementById('search-input'),
        sortPopup: document.getElementById('sort-popup'),
        filterPopup: document.getElementById('filter-popup'),
        historyModal: document.getElementById('history-modal'),
        historyModalContent: document.getElementById('history-modal-content'),
        historyList: document.getElementById('history-list')
    };

    let state = {
        currentFolder: null,
        playlist:[],
        currentIndex: 0,
        isPlaying: false,
        isDragging: false,
        currentSort: 'newest',
        currentFilter: 'all', 
        speed: 1.0,
        timer: 0,
        timerId: null,
        favorites: JSON.parse(localStorage.getItem('favorites')) ||[],
        audioHistory: JSON.parse(localStorage.getItem('audioHistory')) ||[],
        durationCache: {},
        lastScrollY: 0
    };

    const metadataQueue = {
        queue:[], isProcessing: false,
        add(track, elementId) {
            if (state.durationCache[track.src]) {
                const el = document.getElementById(elementId);
                if (el) el.innerText = formatTime(state.durationCache[track.src]);
                return;
            }
            this.queue.push({ track, elementId });
            this.process();
        },
        clear() { this.queue =[]; this.isProcessing = false; },
        async process() {
            if (this.isProcessing || this.queue.length === 0) return;
            this.isProcessing = true;
            const item = this.queue.shift();
            try {
                const duration = await getTrackDuration(item.track.src);
                state.durationCache[item.track.src] = duration;
                const el = document.getElementById(item.elementId);
                if (el) el.innerText = formatTime(duration);
            } catch (e) {} finally {
                this.isProcessing = false;
                setTimeout(() => this.process(), 50);
            }
        }
    };

    function getTrackDuration(src) {
        return new Promise((resolve) => {
            const audio = new Audio(); audio.preload = 'metadata';
            const timeout = setTimeout(() => resolve(0), 5000);
            audio.onloadedmetadata = () => { clearTimeout(timeout); resolve(audio.duration === Infinity || isNaN(audio.duration) ? 0 : audio.duration); };
            audio.onerror = () => { clearTimeout(timeout); resolve(0); };
            audio.src = src;
        });
    }

    function init() {
        document.getElementById('site-name').innerText = CONFIG.siteName;
        document.getElementById('user-avatar').src = CONFIG.avatar;
        
        const savedSpeed = sessionStorage.getItem('audioSpeed');
        if (savedSpeed) setSpeed(parseFloat(savedSpeed));

        if(state.audioHistory.length > 0) {
            const last = state.audioHistory[0];
            els.player.title.innerText = last.trackTitle || last.folderTitle;
            els.player.author.innerText = last.folderTitle;
            els.player.cover.src = last.cover || 'https://via.placeholder.com/150';
        }

        els.player.wrapper.classList.add('is-paused');
        _doSort('newest');

        els.audio.addEventListener('timeupdate', onTimeUpdate);
        els.audio.addEventListener('timeupdate', debounce(saveCurrentAudioProgress, 3000));
        els.audio.addEventListener('ended', onTrackEnd);
        els.audio.addEventListener('loadedmetadata', onMetadataLoaded);
        els.audio.addEventListener('play', () => updatePlayState(true));
        els.audio.addEventListener('pause', () => updatePlayState(false));

        els.player.slider.addEventListener('input', onSeekInput);
        els.player.slider.addEventListener('change', onSeekChange);

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.relative')) {
                document.querySelectorAll('.dropdown-popup').forEach(p => p.classList.remove('active'));
            }
        });

        initSwipeGesture();

        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view === 'detail') openFolder(e.state.id, false);
            else goHome(false);
        });

        els.search.addEventListener('input', (e) => debounceSearch(e.target.value));
        
        // Trigger initial view animation
        setTimeout(() => els.views.library.classList.remove('opacity-0', 'translate-y-5'), 100);
    }

    function setFilter(type) {
        state.currentFilter = type;
        const textMap = { 'all': 'Tất cả truyện', 'H': 'Truyện H', 'nonH': 'Truyện không H', 'favorite': 'Yêu thích' };
        document.getElementById('current-filter-text').innerText = textMap[type];
        els.filterPopup.classList.remove('active');
        _doSort(state.currentSort); 
    }
    
    function toggleFilterMenu() { els.filterPopup.classList.toggle('active'); els.sortPopup.classList.remove('active'); }
    function toggleSortMenu() { els.sortPopup.classList.toggle('active'); els.filterPopup.classList.remove('active'); }

    function setSort(val) {
        state.currentSort = val;
        const texts = { 'az': 'Tên A-Z', 'za': 'Tên Z-A', 'newest': 'Mới nhất', 'oldest': 'Cũ nhất' };
        document.getElementById('current-sort-text').innerText = texts[val];
        els.sortPopup.classList.remove('active');
        _doSort(val);
    }

    function _doSort(criteria) {
        let data = [...LIBRARY];
        if (state.currentFilter === 'H') data = data.filter(i => i.isH);
        else if (state.currentFilter === 'nonH') data = data.filter(i => !i.isH);
        else if (state.currentFilter === 'favorite') data = data.filter(i => state.favorites.includes(i.id));

        if (criteria === 'az') data.sort((a, b) => a.title.localeCompare(b.title));
        if (criteria === 'za') data.sort((a, b) => b.title.localeCompare(a.title));
        if (criteria === 'newest') data.sort((a, b) => b.id - a.id);
        if (criteria === 'oldest') data.sort((a, b) => a.id - b.id);
        
        renderLibrary(data);
    }

    const debounceSearch = debounce((query) => {
        if (!query) return _doSort(state.currentSort);
        const term = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        let data = [...LIBRARY].filter(i => 
            i.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(term) || 
            i.author.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(term)
        );
        renderLibrary(data);
    }, 300);

    function handleSearch(query) { debounceSearch(query); }

    function renderLibrary(data) {
        document.getElementById('book-count').innerText = data.length;
        
        els.grid.style.transition = 'opacity 0.2s ease-out';
        els.grid.style.opacity = '0';
        
        setTimeout(() => {
            if (data.length === 0) {
                els.grid.innerHTML = '';
                document.getElementById('empty-state').classList.remove('hidden');
                setTimeout(() => document.getElementById('empty-state').style.opacity = '0.6', 50);
            } else {
                document.getElementById('empty-state').classList.add('hidden');
                
                els.grid.innerHTML = data.map((folder, index) => {
                    let progressHtml = '';
                    const history = state.audioHistory.find(h => h.folderId === folder.id);
                    if(history && history.totalTracks > 0) {
                        const pct = Math.min(100, (history.trackIndex / history.totalTracks) * 100);
                        progressHtml = `<div class="card-progress-bar"><div class="card-progress-fill" style="width: ${pct}%"></div></div>`;
                    }
                    const isFav = state.favorites.includes(folder.id);
                    
                    // Giảm độ delay của stagger để cuộn mượt hơn, nhanh hơn
                    const delay = Math.min(index * 0.025, 0.3);

                    return `
                    <div class="book-card grid-enter" style="animation-delay: ${delay}s" onclick="app.openFolder(${folder.id}, true)">
                        <div class="book-cover-container skeleton-loading">
                            <img src="${folder.cover}" loading="lazy" onload="this.parentElement.classList.remove('skeleton-loading')" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                            ${folder.isH ? `<div class="absolute top-2 right-2 z-10"><span class="tag-H">H</span></div>` : ''}
                            ${isFav ? `<div class="absolute top-2 left-2 z-10"><i class="ph-fill ph-heart text-red-500 text-xl drop-shadow-md"></i></div>` : ''}
                            ${progressHtml}
                            <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-sm">
                                <i class="ph-fill ph-play-circle text-white text-5xl shadow-2xl rounded-full transform scale-90 group-hover:scale-100 transition-transform duration-300"></i>
                            </div>
                        </div>
                        <div class="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 class="font-bold text-sm sm:text-base text-gray-100 leading-tight mb-1.5 line-clamp-2" title="${folder.title}">${folder.title}</h3>
                                <p class="text-xs font-medium text-blue-400/80 truncate mb-2" title="${folder.author}">${folder.author}</p>
                            </div>
                            <div class="flex items-center text-[11px] text-gray-500 font-bold mt-auto bg-white/5 w-fit px-2 py-1 rounded">
                                <i class="ph-fill ph-files mr-1.5"></i> ${folder.chapters || folder.tracks.length} chương
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }
            
            els.grid.style.opacity = '1';
            setTimeout(() => { els.grid.style.transition = ''; }, 200);

        }, 200);
    }

    // Logic thay đổi View mượt mà
    function switchView(hideView, showView, callback) {
        hideView.style.opacity = '0';
        hideView.style.pointerEvents = 'none';
        
        setTimeout(() => {
            hideView.classList.add('hidden');
            showView.classList.remove('hidden');
            
            if(callback) callback();
            
            // Trigger browser reflow
            void showView.offsetWidth;
            
            showView.style.opacity = '1';
            showView.style.pointerEvents = 'auto';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300); // Đợi CSS transition chạy
    }

    function openFolder(id, pushState = true) {
        state.lastScrollY = window.scrollY; 
        const folder = LIBRARY.find(f => f.id === id);
        if (!folder) return;
        state.currentFolder = folder;
        state.playlist = folder.tracks.map(t => ({
            ...t, src: `${CONFIG.rootPath}/${folder.folderName}/${t.fileName}`
        }));

        if (pushState) window.history.pushState({ view: 'detail', id: folder.id }, '', '?book=' + folder.id);

        switchView(els.views.library, els.views.detail, () => {
            els.detail.title.innerText = folder.title;
            els.detail.author.innerText = folder.author;
            els.detail.desc.innerText = folder.desc || 'Chưa có thông tin giới thiệu.';
            els.detail.cover.src = folder.cover;
            
            // Set cover glow backgroundImage for ambient depth
            els.detail.coverGlow.style.backgroundImage = `url(${folder.cover})`;
            els.detail.coverGlow.style.backgroundSize = 'cover';
            els.detail.coverGlow.style.backgroundPosition = 'center';
            
            els.detail.trackCount.innerText = `${state.playlist.length} phần`;
            
            updateFavBtnUI();
            metadataQueue.clear();
            renderTrackList();

            const resumeBtn = document.getElementById('resume-btn');
            const history = state.audioHistory.find(h => h.folderId === folder.id);
            if (history) {
                resumeBtn.classList.remove('hidden');
                resumeBtn.title = `Tiếp tục: ${history.trackTitle}`;
            } else {
                resumeBtn.classList.add('hidden');
            }
        });
    }

    function goHome(pushState = true) {
        state.currentFolder = null;
        if (pushState) window.history.pushState({ view: 'home' }, '', window.location.pathname);
        
        switchView(els.views.detail, els.views.library, () => {
            _doSort(state.currentSort); 
            // Trở về vị trí cuộn cũ mượt mà sau khi DOM hiện
            setTimeout(() => window.scrollTo({ top: state.lastScrollY, behavior: 'instant' }), 10);
        });
    }
    
    function goBack() {
        if (window.history.length > 1 && window.location.search.includes('book=')) window.history.back();
        else goHome(true);
    }

    function toggleFavoriteCurrent() {
        if (!state.currentFolder) return;
        const id = state.currentFolder.id;
        const idx = state.favorites.indexOf(id);
        if (idx > -1) {
            state.favorites.splice(idx, 1);
            showToast('Đã bỏ yêu thích');
        } else {
            state.favorites.push(id);
            showToast('Đã thêm vào yêu thích ♥');
        }
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        updateFavBtnUI();
    }

    function updateFavBtnUI() {
        if (!state.currentFolder) return;
        const icon = els.detail.favBtn.querySelector('i');
        if (state.favorites.includes(state.currentFolder.id)) {
            icon.classList.replace('ph', 'ph-fill');
            icon.classList.add('text-red-500');
        } else {
            icon.classList.replace('ph-fill', 'ph');
            icon.classList.remove('text-red-500');
        }
    }

    function saveCurrentAudioProgress() {
        if (!state.currentFolder || !els.audio.src || isNaN(els.audio.currentTime)) return;
        const data = {
            folderId: state.currentFolder.id,
            folderTitle: state.currentFolder.title,
            cover: state.currentFolder.cover,
            trackIndex: state.currentIndex,
            trackTitle: state.playlist[state.currentIndex]?.title || '',
            currentTime: els.audio.currentTime,
            duration: els.audio.duration,
            totalTracks: state.playlist.length,
            timestamp: Date.now()
        };
        state.audioHistory = state.audioHistory.filter(h => h.folderId !== data.folderId);
        state.audioHistory.unshift(data); 
        if (state.audioHistory.length > 20) state.audioHistory.pop(); 
        localStorage.setItem('audioHistory', JSON.stringify(state.audioHistory));
    }

    function toggleHistoryModal() {
        const modal = els.historyModal;
        const content = els.historyModalContent;
        if (modal.classList.contains('hidden')) {
            renderHistoryList();
            modal.classList.remove('hidden');
            // Timeout để trigger CSS Animation
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.add('active');
            }, 10);
        } else {
            modal.classList.add('opacity-0');
            content.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 400); // Dài hơn để spring curve chạy hết
        }
    }

    function renderHistoryList() {
        if (state.audioHistory.length === 0) {
            els.historyList.innerHTML = `<div class="p-8 text-center text-gray-400 font-medium text-sm">Chưa có lịch sử nghe</div>`;
            return;
        }
        els.historyList.innerHTML = state.audioHistory.map(h => {
            const pct = h.duration ? Math.min(100, (h.currentTime / h.duration) * 100) : 0;
            return `
            <div class="flex items-center gap-3 p-3 hover:bg-white/5 active:scale-[0.98] rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:border-white/10 mb-1" onclick="app.resumeFromHistory(${h.folderId})">
                <img src="${h.cover}" class="w-14 h-14 rounded-xl object-cover shadow-md border border-white/5">
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-sm text-gray-100 truncate">${h.folderTitle}</h4>
                    <p class="text-[11px] font-medium text-blue-400 truncate mt-1">${h.trackTitle}</p>
                    <div class="w-full h-1 bg-white/10 rounded-full mt-2"><div class="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" style="width:${pct}%"></div></div>
                </div>
                <button class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"><i class="ph-fill ph-play text-lg"></i></button>
            </div>`;
        }).join('');
    }

    function resumeFromHistory(folderId) {
        toggleHistoryModal();
        if(!state.currentFolder || state.currentFolder.id !== folderId) openFolder(folderId, true);
        setTimeout(resumeLastPosition, 300); 
    }

    function resumeLastPosition() {
        if (!state.currentFolder) return;
        const history = state.audioHistory.find(h => h.folderId === state.currentFolder.id);
        if (history && history.trackIndex < state.playlist.length) {
            playTrackFromTime(history.trackIndex, Math.max(0, history.currentTime - 2)); 
            showToast(`Tiếp tục: ${history.trackTitle}`);
        } else {
            playTrack(0);
        }
    }

    function renderTrackList() {
        els.trackList.innerHTML = state.playlist.map((track, idx) => `
            <div id="track-${idx}" onclick="app.playTrack(${idx})" class="track-item flex items-center gap-3 group">
                <div class="w-8 flex items-center justify-center font-bold text-gray-500 group-hover:text-blue-400 text-sm transition-colors duration-300">${idx + 1}</div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm text-gray-300 transition-colors duration-300 group-hover:text-white">${track.title}</h4>
                    <p class="text-[11px] text-gray-500 font-mono mt-1"><i class="ph-fill ph-clock"></i> <span id="dur-${idx}">--:--</span></p>
                </div>
                <div class="flex items-center gap-2 track-action-btn">
                    <button class="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-white/10 group-hover:scale-110 active:scale-90">
                        <i class="ph-fill ph-play text-sm ml-0.5"></i>
                    </button>
                </div>
            </div>`).join('');
        state.playlist.forEach((t, i) => metadataQueue.add(t, `dur-${i}`));
    }

    function highlightCurrentTrack(index) {
        document.querySelectorAll('.track-active').forEach(el => {
            el.classList.remove('track-active', 'is-paused-track');
            const btnContainer = el.querySelector('.track-action-btn');
            if(btnContainer) { 
                btnContainer.innerHTML = `<button class="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm border border-white/10 group-hover:scale-110 active:scale-90"><i class="ph-fill ph-play text-sm ml-0.5"></i></button>`;
            }
        });

        const el = document.getElementById(`track-${index}`);
        if (el) {
            el.classList.add('track-active');
            if (!state.isPlaying) el.classList.add('is-paused-track');
            
            const btnContainer = el.querySelector('.track-action-btn');
            if(btnContainer) { 
                if (state.isPlaying) {
                    btnContainer.innerHTML = `<div class="playing-eq mr-3"><span></span><span></span><span></span></div>`;
                } else {
                    btnContainer.innerHTML = `<button class="w-9 h-9 rounded-full flex items-center justify-center bg-blue-600 text-white transition-all duration-300 shadow-sm border border-white/10 active:scale-90"><i class="ph-fill ph-pause text-sm"></i></button>`;
                }
            }
            // Smoothly scroll active track into view
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    }

    function playTrack(index) { playTrackFromTime(index, 0); }
    
    function playTrackFromTime(index, startTime) {
        state.currentIndex = index;
        const track = state.playlist[index];
        els.audio.src = track.src;
        els.audio.playbackRate = state.speed;
        
        els.player.title.innerText = track.title;
        els.player.author.innerText = state.currentFolder.title;
        els.player.cover.src = state.currentFolder.cover;

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title, artist: state.currentFolder.title,
                artwork:[{ src: state.currentFolder.cover, sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', play);
            navigator.mediaSession.setActionHandler('pause', pause);
            navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
            navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
        }

        const onLoaded = () => {
            if (startTime > 0) els.audio.currentTime = startTime;
            play();
            els.audio.removeEventListener('loadedmetadata', onLoaded);
        };
        els.audio.readyState >= 1 ? onLoaded() : els.audio.addEventListener('loadedmetadata', onLoaded);
        saveCurrentAudioProgress();
    }

    function play() { els.audio.play().catch(e=>{}); }
    function pause() { els.audio.pause(); saveCurrentAudioProgress(); }
    
    function togglePlay(e) {
        if(e) e.stopPropagation();
        
        // Add a micro-animation to the mini play button wrapper
        if(e && e.target) {
            const btn = e.target.closest('button');
            if(btn) {
                btn.style.transform = 'scale(0.8)';
                setTimeout(() => btn.style.transform = '', 150);
            }
        }

        if (!els.audio.src) {
            if (state.audioHistory.length > 0) resumeFromHistory(state.audioHistory[0].folderId);
            else if (state.playlist.length > 0) playTrack(0);
            else showToast('Vui lòng chọn một truyện để nghe');
            return;
        }
        if (els.audio.paused) play();
        else pause();
    }
    
    function playAll() { if (state.playlist.length > 0) playTrack(0); }
    function nextTrack() { if (state.currentIndex < state.playlist.length - 1) playTrack(state.currentIndex + 1); }
    function prevTrack() { if (state.currentIndex > 0) playTrack(state.currentIndex - 1); }
    function skip(sec) { els.audio.currentTime += sec; saveCurrentAudioProgress(); }

    function updatePlayState(isPlaying) {
        state.isPlaying = isPlaying;
        const i1 = isPlaying ? 'ph-pause' : 'ph-play';
        const i2 = isPlaying ? 'ph-play' : 'ph-pause';
        els.player.playIcon.classList.replace(i2, i1);
        els.player.playIconMini.classList.replace(i2, i1);
        
        if (isPlaying) els.player.wrapper.classList.remove('is-paused');
        else els.player.wrapper.classList.add('is-paused');

        highlightCurrentTrack(state.currentIndex);
    }

    function onTimeUpdate() {
        if (state.isDragging) return;
        const curr = els.audio.currentTime; const dur = els.audio.duration || 1;
        const pct = (curr / dur) * 100;
        els.player.slider.value = pct;
        els.player.fill.style.width = `${pct}%`;
        els.player.miniFill.style.width = `${pct}%`;
        els.player.current.innerText = formatTime(curr);
    }
    
    function onSeekInput() {
        state.isDragging = true;
        els.player.fill.style.transition = 'none'; // Disable transition when dragging for raw feel
        els.player.miniFill.style.transition = 'none';
        els.player.fill.style.width = `${els.player.slider.value}%`;
        els.player.miniFill.style.width = `${els.player.slider.value}%`;
        els.player.current.innerText = formatTime((els.player.slider.value / 100) * els.audio.duration);
    }
    function onSeekChange() { 
        state.isDragging = false; 
        els.player.fill.style.transition = ''; // Restore transitions
        els.player.miniFill.style.transition = '';
        els.audio.currentTime = (els.player.slider.value / 100) * els.audio.duration; 
        saveCurrentAudioProgress(); 
    }
    function onMetadataLoaded() { els.player.duration.innerText = formatTime(els.audio.duration); }
    function onTrackEnd() { nextTrack(); }

    function formatTime(s) {
        if (!s || isNaN(s)) return "0:00";
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), secs = Math.floor(s%60);
        return h>0 ? `${h}:${m<10?'0':''}${m}:${secs<10?'0':''}${secs}` : `${m}:${secs<10?'0':''}${secs}`;
    }
    
    function debounce(f, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(()=>f(...args), wait); }; }

    function toggleSpeedMenu() { els.player.speedPopup.classList.toggle('active'); }
    function setSpeed(val) {
        state.speed = val; els.audio.playbackRate = val; sessionStorage.setItem('audioSpeed', val);
        els.player.speedText.innerText = val;
        els.player.speedPopup.classList.remove('active');
        els.player.speedPopup.querySelectorAll('.dropdown-item').forEach(i => i.classList.toggle('selected', parseFloat(i.innerText.split('x')[0]) === val));
    }

    function toggleTimerMenu() { els.player.timerPopup.classList.toggle('active'); }
    function setTimer(m) {
        state.timer = m; clearTimeout(state.timerId); els.player.timerPopup.classList.remove('active');
        
        if(m !== 0) {
            els.player.timerBtn.classList.add('text-amber-400');
            els.player.timerDot.classList.remove('hidden');
        } else {
            els.player.timerBtn.classList.remove('text-amber-400');
            els.player.timerDot.classList.add('hidden');
        }

        els.player.timerPopup.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        const activeItem = Array.from(els.player.timerPopup.querySelectorAll('.dropdown-item')).find(i => i.innerText.includes(m === -1 ? 'Hết' : (m===0 ? 'Tắt' : m)));
        if(activeItem) activeItem.classList.add('selected');

        if(m>0) { state.timerId = setTimeout(()=>{ pause(); showToast(`Hết hẹn giờ ${m} phút`); setTimer(0); }, m*60000); showToast(`Đã hẹn giờ ${m} phút`);}
        else if (m === -1) { els.audio.addEventListener('ended', ()=>{pause(); setTimer(0);}, {once:true}); showToast('Hẹn giờ hết chương này');}
    }

    function openPlayerMobile() {
        if(window.innerWidth <= 768) {
            els.player.wrapper.classList.remove('mini-player-mode');
            els.player.wrapper.classList.add('full-player-mode');
            document.body.style.overflow = 'hidden'; 
        }
    }
    
    function closePlayerMobile() {
        els.player.wrapper.classList.add('mini-player-mode');
        els.player.wrapper.classList.remove('full-player-mode');
        document.body.style.overflow = '';
    }

    function initSwipeGesture() {
        let startY = 0;
        let startX = 0;
        let isSwiping = false;

        els.player.wrapper.addEventListener('touchstart', e => {
            // Bỏ qua nếu người dùng đang thao tác với thanh tiến trình
            if (e.target.tagName.toLowerCase() === 'input') return;
            
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
            isSwiping = true;
        }, {passive: true});

        els.player.wrapper.addEventListener('touchmove', e => {
            if (!isSwiping) return;
            
            const currentY = e.touches[0].clientY;
            const currentX = e.touches[0].clientX;
            const deltaY = currentY - startY;
            const deltaX = currentX - startX;

            // Nếu người dùng vuốt ngang nhiều hơn vuốt dọc thì huỷ thao tác vuốt dọc
            if (Math.abs(deltaX) > Math.abs(deltaY) + 5) {
                isSwiping = false;
                return;
            }

            // Xử lý khi ở Full Player -> Vuốt xuống để thu nhỏ thành Mini Player
            if (els.player.wrapper.classList.contains('full-player-mode')) {
                if (deltaY > 60) {
                    closePlayerMobile();
                    isSwiping = false;
                }
            } 
            // Xử lý khi ở Mini Player -> Vuốt lên để phóng to thành Full Player
            else if (els.player.wrapper.classList.contains('mini-player-mode')) {
                if (deltaY < -30) {
                    openPlayerMobile();
                    isSwiping = false;
                }
            }
        }, {passive: true});

        els.player.wrapper.addEventListener('touchend', () => {
            isSwiping = false;
        }, {passive: true});
        
        // Cải thiện cuộn ẩn nav bar mượt mà
        let lastScrollTop = 0;
        const navbar = document.getElementById('main-nav');
        window.addEventListener('scroll', () => {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;
        }, { passive: true });
    }

    function showToast(msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'bg-zinc-800/95 backdrop-blur-xl border border-white/20 text-white px-5 py-3 rounded-full text-sm font-bold shadow-[0_15px_30px_rgba(0,0,0,0.8)] toast-enter flex items-center gap-3 tracking-wide';
        toast.innerHTML = `<i class="ph-fill ph-check-circle text-green-400 text-xl drop-shadow-md"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.replace('toast-enter', 'toast-exit');
            setTimeout(() => toast.remove(), 400); // Khớp với time animation
        }, 2500);
    }

    return {
        init, openFolder, goHome, goBack, playTrack, playAll, togglePlay, skip, nextTrack, prevTrack, resumeLastPosition,
        handleSearch, setSort, toggleSortMenu, setFilter, toggleFilterMenu,
        toggleSpeedMenu, setSpeed, toggleTimerMenu, setTimer,
        openPlayerMobile, closePlayerMobile, toggleHistoryModal, resumeFromHistory, toggleFavoriteCurrent
    };
})();

document.addEventListener('DOMContentLoaded', app.init);