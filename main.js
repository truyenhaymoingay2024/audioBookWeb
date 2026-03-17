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
            circleFill: document.getElementById('p-mini-circle-fill'),
            current: document.getElementById('p-current'),
            duration: document.getElementById('p-duration'),
            speedText: document.getElementById('current-speed-text'),
            speedPopup: document.getElementById('speed-popup'),
            timerBtn: document.getElementById('timer-btn'),
            timerBadge: document.querySelector('.timer-badge'), // ĐÃ THÊM: Badge đếm ngược
            timerPopup: document.getElementById('timer-popup')
        },
        searchDesktop: document.getElementById('search-input-desktop'),
        searchMobile: document.getElementById('search-input-mobile'),
        sortPopup: document.getElementById('sort-popup'),
        filterPopup: document.getElementById('filter-popup'),
        historyModal: document.getElementById('history-modal'),
        historyModalContent: document.getElementById('history-modal-content'),
        historyList: document.getElementById('history-list'),
        mobileSearchModal: document.getElementById('mobile-search-modal'),
        mobileSearchResults: document.getElementById('mobile-search-results')
    };

    let state = {
        currentFolder: null,
        playlist:[],
        currentIndex: 0,
        isPlaying: false,
        isDragging: false,
        isPreloading: false,
        currentSort: 'newest',
        currentFilter: 'all', 
        speed: 1.0,
        timer: 0,
        timerInterval: null, // ĐÃ SỬA: Thay setTimeout bằng setInterval
        timerEndTime: 0,     // ĐÃ THÊM: Lưu thời gian kết thúc
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
        
        const savedSpeed = localStorage.getItem('audioSpeed');
        if (savedSpeed) setSpeed(parseFloat(savedSpeed));

        if(state.audioHistory.length > 0) {
            const last = state.audioHistory[0];
            els.player.title.innerText = last.trackTitle || last.folderTitle;
            els.player.author.innerText = last.folderTitle;
            els.player.cover.src = last.cover || 'https://via.placeholder.com/150';
            updateAmbientGlow(last.cover);
            checkMarquee();
        }

        els.player.wrapper.classList.add('is-paused');
        _doSort('newest');

        els.audio.addEventListener('timeupdate', onTimeUpdate);
        els.audio.addEventListener('timeupdate', debounce(saveCurrentAudioProgress, 3000));
        els.audio.addEventListener('ended', onTrackEnd); // Xử lý cả auto-next & timer
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
        initRippleEffect();

        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view === 'detail') openFolder(e.state.id, false);
            else goHome(false);
        });

        els.searchDesktop.addEventListener('input', (e) => debounceSearch(e.target.value));
        els.searchMobile.addEventListener('input', (e) => debounceSearch(e.target.value));
    }

    function updateAmbientGlow(imgSrc) {
        if (typeof ColorThief === 'undefined') return;
        const colorThief = new ColorThief();
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imgSrc + (imgSrc.includes('?') ? '&' : '?') + 'not-from-cache-please=' + new Date().getTime();
        
        img.onload = function() {
            try {
                const palette = colorThief.getPalette(img, 2);
                if (palette && palette.length >= 2) {
                    const c1 = `rgb(${palette[0][0]}, ${palette[0][1]}, ${palette[0][2]})`;
                    const c2 = `rgb(${palette[1][0]}, ${palette[1][1]}, ${palette[1][2]})`;
                    document.documentElement.style.setProperty('--ambient-color-1', c1);
                    document.documentElement.style.setProperty('--ambient-color-2', c2);
                }
            } catch(e) {}
        };
    }

    function checkMarquee() {
        const titleEl = els.player.title;
        const container = titleEl.parentElement;
        titleEl.classList.remove('is-scrolling');
        
        setTimeout(() => {
            if (titleEl.scrollWidth > container.clientWidth) {
                titleEl.classList.add('is-scrolling');
            }
        }, 100);
    }

    function observeScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
    }

    function initRippleEffect() {
        const createRipple = function(e, isTouch = false) {
            const target = e.target.closest('.ripple-target');
            if (!target) return;
            
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            
            const clientX = isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = isTouch ? e.touches[0].clientY : e.clientY;
            
            ripple.style.left = `${clientX - rect.left - size/2}px`;
            ripple.style.top = `${clientY - rect.top - size/2}px`;
            ripple.className = 'ripple';
            
            target.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        };

        document.addEventListener('mousedown', e => createRipple(e));
        document.addEventListener('touchstart', e => createRipple(e, true), {passive: true});
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
        els.grid.style.transition = 'opacity 0.15s ease-out';
        els.grid.style.opacity = '0';
        
        setTimeout(() => {
            if (data.length === 0) {
                els.grid.innerHTML = '';
                document.getElementById('empty-state').classList.remove('hidden');
                document.getElementById('empty-state').classList.add('animate-fade-in');
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

                    return `
                    <div class="book-card reveal-item ripple-target" onclick="app.openFolder(${folder.id}, true)">
                        <div class="book-cover-container skeleton-loading">
                            <img src="${folder.cover}" loading="lazy" onload="this.parentElement.classList.remove('skeleton-loading')" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                            ${folder.isH ? `<div class="absolute top-2 right-2 z-10"><span class="tag-H">H</span></div>` : ''}
                            ${isFav ? `<div class="absolute top-2 left-2 z-10"><i class="ph-fill ph-heart text-red-500 text-xl drop-shadow-md"></i></div>` : ''}
                            ${progressHtml}
                            <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition duration-300 flex items-center justify-center backdrop-blur-sm">
                                <i class="ph-fill ph-play-circle text-white text-5xl shadow-2xl rounded-full"></i>
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
                observeScrollReveal();
            }
            
            els.grid.style.opacity = '1';
            setTimeout(() => { els.grid.style.transition = ''; }, 150);

        }, 150);

        renderMobileSearch(data);
    }

    function renderMobileSearch(data) {
        const query = els.searchMobile.value.trim();
        if(!query) {
            els.mobileSearchResults.innerHTML = `<div class="text-center text-gray-500 text-sm mt-10">Nhập từ khóa để tìm kiếm...</div>`;
            return;
        }
        if(data.length === 0) {
            els.mobileSearchResults.innerHTML = `<div class="text-center text-gray-500 text-sm mt-10">Không tìm thấy kết quả nào.</div>`;
            return;
        }
        
        els.mobileSearchResults.innerHTML = data.map(folder => `
            <div class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer ripple-target" onclick="app.toggleMobileSearch(); app.openFolder(${folder.id}, true)">
                <img src="${folder.cover}" class="w-12 h-12 rounded-lg object-cover">
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-sm text-gray-100 truncate">${folder.title}</h4>
                    <p class="text-xs text-blue-400 truncate mt-0.5">${folder.author}</p>
                </div>
            </div>
        `).join('');
    }

    function toggleMobileSearch() {
        if (els.mobileSearchModal.classList.contains('hidden')) {
            els.mobileSearchModal.classList.remove('hidden');
            setTimeout(() => { els.mobileSearchModal.classList.remove('opacity-0'); els.searchMobile.focus(); }, 10);
            document.body.style.overflow = 'hidden';
        } else {
            els.mobileSearchModal.classList.add('opacity-0');
            setTimeout(() => { els.mobileSearchModal.classList.add('hidden'); }, 300);
            document.body.style.overflow = '';
        }
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

        els.detail.title.innerText = folder.title;
        els.detail.author.innerText = folder.author;
        els.detail.desc.innerText = folder.desc || 'Chưa có thông tin giới thiệu.';
        els.detail.cover.src = folder.cover;
        els.detail.trackCount.innerText = `${state.playlist.length} phần`;
        
        updateFavBtnUI();
        updateAmbientGlow(folder.cover);
        metadataQueue.clear();
        renderTrackList();
        
        els.views.library.classList.add('hidden');
        els.views.detail.classList.remove('hidden');

        const resumeBtn = document.getElementById('resume-btn');
        const history = state.audioHistory.find(h => h.folderId === folder.id);
        if (history) {
            resumeBtn.classList.remove('hidden');
            resumeBtn.title = `Tiếp tục: ${history.trackTitle}`;
        } else {
            resumeBtn.classList.add('hidden');
        }

        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function goHome(pushState = true) {
        els.views.detail.classList.add('hidden');
        els.views.library.classList.remove('hidden');
        state.currentFolder = null;
        if (pushState) window.history.pushState({ view: 'home' }, '', window.location.pathname);
        _doSort(state.currentSort); 
        window.scrollTo({ top: state.lastScrollY, behavior: 'instant' }); 
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
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.add('active');
            }, 10);
        } else {
            modal.classList.add('opacity-0');
            content.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 300);
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
            <div class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer ripple-target transition border border-transparent hover:border-white/10 mb-1" onclick="app.resumeFromHistory(${h.folderId})">
                <img src="${h.cover}" class="w-14 h-14 rounded-lg object-cover shadow-md border border-white/5">
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-sm text-gray-100 truncate">${h.folderTitle}</h4>
                    <p class="text-[11px] font-medium text-blue-400 truncate mt-1">${h.trackTitle}</p>
                    <div class="w-full h-1 bg-white/10 rounded-full mt-2"><div class="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" style="width:${pct}%"></div></div>
                </div>
                <button class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 hover:bg-blue-600 transition"><i class="ph-fill ph-play text-lg"></i></button>
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
            <div id="track-${idx}" onclick="app.playTrack(${idx})" class="track-item ripple-target flex items-center gap-3 group">
                <div class="w-8 flex items-center justify-center font-bold text-gray-500 group-hover:text-blue-400 text-sm">${idx + 1}</div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm text-gray-300 transition group-hover:text-white">${track.title}</h4>
                    <p class="text-[11px] text-gray-500 font-mono mt-1"><i class="ph-fill ph-clock"></i> <span id="dur-${idx}">--:--</span></p>
                </div>
                <div class="flex items-center gap-2 track-action-btn">
                    <button class="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition shadow-sm border border-white/10 group-hover:scale-105">
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
                btnContainer.innerHTML = `<button class="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition shadow-sm border border-white/10 group-hover:scale-105"><i class="ph-fill ph-play text-sm ml-0.5"></i></button>`;
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
                    btnContainer.innerHTML = `<button class="w-9 h-9 rounded-full flex items-center justify-center bg-blue-600 text-white transition shadow-sm border border-white/10"><i class="ph-fill ph-pause text-sm"></i></button>`;
                }
            }
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function playTrack(index) { playTrackFromTime(index, 0); }
    
    function playTrackFromTime(index, startTime) {
        state.currentIndex = index;
        state.isPreloading = false;
        const track = state.playlist[index];
        
        els.audio.src = track.src;
        els.audio.playbackRate = state.speed;
        
        els.player.title.innerText = track.title;
        els.player.author.innerText = state.currentFolder.title;
        els.player.cover.src = state.currentFolder.cover;

        updateAmbientGlow(state.currentFolder.cover);
        checkMarquee();

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `${state.currentFolder.title} - ${track.title}`,
                artist: state.currentFolder.author || CONFIG.siteName,
                album: state.currentFolder.title,
                artwork:[{ src: state.currentFolder.cover, sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', play);
            navigator.mediaSession.setActionHandler('pause', pause);
            navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
            navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
        }

        play(); // Ép trình duyệt load file ngay lập tức

        if (startTime > 0) {
            const onLoaded = () => {
                els.audio.currentTime = startTime;
                els.audio.removeEventListener('loadedmetadata', onLoaded);
            };
            if (els.audio.readyState >= 1) {
                onLoaded();
            } else {
                els.audio.addEventListener('loadedmetadata', onLoaded);
            }
        }

        saveCurrentAudioProgress();
    }

    function play() { els.audio.play().catch(e=>{}); }
    function pause() { els.audio.pause(); saveCurrentAudioProgress(); }
    
    function togglePlay(e) {
        if(e) e.stopPropagation();
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
        const iconMain = els.player.playIcon;
        const iconMini = els.player.playIconMini;
        
        [iconMain, iconMini].forEach(icon => {
            icon.style.transform = 'scale(0) rotate(-90deg)';
            icon.style.opacity = '0';
            setTimeout(() => {
                icon.className = isPlaying ? 'ph-fill ph-pause text-2xl md:text-xl icon-morph' : 'ph-fill ph-play text-2xl md:text-xl ml-1 icon-morph';
                if(icon === iconMini) icon.className = isPlaying ? 'ph-fill ph-pause text-base icon-morph' : 'ph-fill ph-play text-base ml-0.5 icon-morph';
                
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.opacity = '1';
            }, 150);
        });
        
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
        els.player.current.innerText = formatTime(curr);

        if (els.player.circleFill) {
            const offset = 125 - (pct / 100) * 125;
            els.player.circleFill.style.strokeDashoffset = offset;
        }

        if (!state.isPreloading && dur > 10 && curr >= dur - 10 && state.currentIndex < state.playlist.length - 1) {
            state.isPreloading = true;
            const nextTrack = state.playlist[state.currentIndex + 1];
            const preloader = new Audio();
            preloader.preload = 'auto'; 
            preloader.src = nextTrack.src;
        }
    }
    
    function onSeekInput() {
        state.isDragging = true;
        els.player.fill.style.width = `${els.player.slider.value}%`;
        els.player.current.innerText = formatTime((els.player.slider.value / 100) * els.audio.duration);
    }
    
    function onSeekChange() { 
        state.isDragging = false; 
        els.audio.currentTime = (els.player.slider.value / 100) * els.audio.duration; 
        saveCurrentAudioProgress(); 
    }
    
    function onMetadataLoaded() { 
        els.player.duration.innerText = formatTime(els.audio.duration); 
    }

    // ĐÃ FIX: Sửa lỗi ghi đè lệnh dừng của Hẹn giờ
    function onTrackEnd() {
        // Kiểm tra xem người dùng có đang hẹn giờ tắt "Khi hết chương (-1)" không?
        if (state.timer === -1) {
            setTimer(0);
            pause();
            showToast('Đã dừng vì hết chương (Hẹn giờ)');
            return; // Dừng hàm ngay lập tức, không cho nhảy bài tiếp theo
        }

        // Logic Auto-next bình thường
        if (state.currentIndex < state.playlist.length - 1) {
            const nextTrackTitle = state.playlist[state.currentIndex + 1].title;
            showNextTrackToast(
                `Đang chuyển: ${nextTrackTitle}`, 
                3000, 
                () => nextTrack(), 
                () => { showToast('Đã hủy tự động chuyển chương'); }
            );
        }
    }

    function showNextTrackToast(msg, delay, onComplete, onCancel) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'bg-zinc-800/95 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-full text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.8)] toast-enter flex items-center gap-3 tracking-wide pointer-events-auto';
        toast.innerHTML = `
            <div class="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0"></div>
            <span class="flex-1 truncate max-w-[150px] sm:max-w-[200px]">${msg}</span>
            <button id="cancel-next-btn" class="ml-2 text-[10px] font-bold text-white uppercase px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shrink-0">Hủy</button>
        `;
        container.appendChild(toast);
        
        let isCanceled = false;
        const timeout = setTimeout(() => {
            if(isCanceled) return;
            toast.classList.replace('toast-enter', 'toast-exit');
            setTimeout(() => toast.remove(), 300);
            onComplete();
        }, delay);

        toast.querySelector('#cancel-next-btn').onclick = () => {
            isCanceled = true;
            clearTimeout(timeout);
            toast.classList.replace('toast-enter', 'toast-exit');
            setTimeout(() => toast.remove(), 300);
            onCancel();
        };
    }

    function formatTime(s) {
        if (!s || isNaN(s)) return "0:00";
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), secs = Math.floor(s%60);
        return h>0 ? `${h}:${m<10?'0':''}${m}:${secs<10?'0':''}${secs}` : `${m}:${secs<10?'0':''}${secs}`;
    }
    
    function debounce(f, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(()=>f(...args), wait); }; }

    function toggleSpeedMenu() { els.player.speedPopup.classList.toggle('active'); }
    
    function setSpeed(val) {
        state.speed = val; 
        els.audio.playbackRate = val; 
        localStorage.setItem('audioSpeed', val); 
        els.player.speedText.innerText = val;
        els.player.speedPopup.classList.remove('active');
        els.player.speedPopup.querySelectorAll('.dropdown-item').forEach(i => i.classList.toggle('selected', parseFloat(i.innerText.split('x')[0]) === val));
    }

    function toggleTimerMenu() { els.player.timerPopup.classList.toggle('active'); }
    
    // ĐÃ FIX VÀ NÂNG CẤP: Chuyển setTimeout thành setInterval đếm ngược thời gian thực
    function setTimer(m) {
        state.timer = m; 
        clearInterval(state.timerInterval); 
        els.player.timerPopup.classList.remove('active');
        
        const badge = els.player.timerBadge;

        // Xóa class 'selected' trong Menu
        els.player.timerPopup.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        const activeItem = Array.from(els.player.timerPopup.querySelectorAll('.dropdown-item')).find(i => i.innerText.includes(m === -1 ? 'Hết' : (m===0 ? 'Tắt' : m)));
        if(activeItem) activeItem.classList.add('selected');

        // Logic khi tắt Hẹn giờ
        if (m === 0) {
            els.player.timerBtn.classList.remove('text-amber-400');
            badge.classList.add('hidden');
            badge.innerText = '';
            showToast('Đã tắt hẹn giờ');
            return;
        }

        // Bật UI trạng thái có hẹn giờ
        els.player.timerBtn.classList.add('text-amber-400');
        badge.classList.remove('hidden');

        // Logic hẹn giờ "Khi hết chương này"
        if (m === -1) {
            badge.innerText = '1 Ch';
            showToast('Sẽ dừng sau khi hết chương này');
            return;
        }

        // Logic hẹn giờ bằng số Phút
        if (m > 0) {
            showToast(`Đã hẹn giờ ${m} phút`);
            state.timerEndTime = Date.now() + (m * 60000); // Tính thời điểm kết thúc
            
            const updateCountdown = () => {
                const remain = state.timerEndTime - Date.now();
                if (remain <= 0) {
                    clearInterval(state.timerInterval);
                    pause();
                    setTimer(0);
                    showToast('Đã hết thời gian hẹn giờ');
                } else {
                    // Cập nhật text đồng hồ số
                    const totalSecs = Math.ceil(remain / 1000);
                    const mins = Math.floor(totalSecs / 60);
                    const secs = totalSecs % 60;
                    badge.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                }
            };
            
            updateCountdown(); // Cập nhật ngay 1 lần không cần đợi 1s
            state.timerInterval = setInterval(updateCountdown, 1000); // Cứ 1s cập nhật UI 1 lần
        }
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
        els.player.dragHandle.addEventListener('touchstart', e => startY = e.touches[0].clientY, {passive: true});
        els.player.dragHandle.addEventListener('touchmove', e => {
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 50) closePlayerMobile(); 
        }, {passive: true});

        let startYMini = 0;
        els.player.wrapper.addEventListener('touchstart', e => {
            if (els.player.wrapper.classList.contains('mini-player-mode')) startYMini = e.touches[0].clientY;
        }, {passive: true});
        els.player.wrapper.addEventListener('touchend', e => {
            if (els.player.wrapper.classList.contains('mini-player-mode')) {
                let endY = e.changedTouches[0].clientY;
                if (startYMini - endY > 20) openPlayerMobile();
            }
        }, {passive: true});
    }

    function showToast(msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'bg-zinc-800/95 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-full text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.8)] toast-enter flex items-center gap-3 tracking-wide';
        toast.innerHTML = `<i class="ph-fill ph-check-circle text-green-400 text-xl drop-shadow-md"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.replace('toast-enter', 'toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    return {
        init, openFolder, goHome, goBack, playTrack, playAll, togglePlay, skip, nextTrack, prevTrack, resumeLastPosition,
        handleSearch, setSort, toggleSortMenu, setFilter, toggleFilterMenu,
        toggleSpeedMenu, setSpeed, toggleTimerMenu, setTimer, toggleMobileSearch,
        openPlayerMobile, closePlayerMobile, toggleHistoryModal, resumeFromHistory, toggleFavoriteCurrent
    };
})();

document.addEventListener('DOMContentLoaded', app.init);