document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = new Audio();
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressBar = document.getElementById('progressBar');
    const nowPlaying = document.getElementById('nowPlaying');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const directoryContainer = document.getElementById('directoryContainer');
    const repoNameEl = document.getElementById('repoName');
    const repoLinkEl = document.getElementById('repoLink');
    const downloadBtn = document.getElementById('downloadBtn');
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    
    let audioData = null;
    let currentAudio = null;
    let currentAudioUrl = null;
    
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    function updateProgress() {
        if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = progress;
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        }
    }
    
    function updateAudioInfo(audioElement, audioUrl) {
        if (audioElement) {
            const fileName = audioElement.getAttribute('data-file');
            const folderName = audioElement.getAttribute('data-folder');
            nowPlaying.textContent = `${folderName} / ${fileName}`;
            currentAudioUrl = audioUrl;
            document.querySelectorAll('.audio-link').forEach(link => {
                link.classList.remove('playing');
            });
            audioElement.classList.add('playing');
        }
    }
    
    function loadAudio(audioUrl, audioElement) {
        audioPlayer.src = audioUrl;
        currentAudio = audioElement;
        
        progressBar.value = 0;
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        
        updateAudioInfo(audioElement, audioUrl);
        
        audioPlayer.addEventListener('loadedmetadata', function() {
            durationEl.textContent = formatTime(audioPlayer.duration);
        }, { once: true });
        
        audioPlayer.play().then(() => {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'flex';
        }).catch(error => {
            console.log("自动播放被阻止:", error);
        });
    }
    
    function playAudio() {
        if (audioPlayer.src) {
            audioPlayer.play();
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'flex';
        }
    }
    
    function pauseAudio() {
        audioPlayer.pause();
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
    }
    
    function stopAudio() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
        progressBar.value = 0;
        currentTimeEl.textContent = '0:00';
    }
    
    function downloadCurrentAudio() {
        if (currentAudioUrl) {
            const downloadLink = document.createElement('a');
            downloadLink.href = currentAudioUrl;
            const urlParts = currentAudioUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            alert('请先选择要播放的音频文件');
        }
    }
    
    function generateDirectoryStructure(audioData) {
        let html = '';
        
        audioData.audioDirectories.forEach((directory, index) => {
            html += `
                <div class="directory" data-folder-id="folder-${index}">
                    <div class="dir-header">
                        <i class="fas fa-folder"></i>
                        <div class="dir-name">${directory.name}</div>
                        <i class="fas fa-chevron-down fold-icon"></i>
                        <span class="file-count">(${directory.files.length}个文件)</span>
                    </div>
                    <div class="file-list">
            `;
            
            directory.files.forEach(file => {
                const filePath = `${directory.path}/${file.filename}`;
                html += `
                    <div class="audio-file">
                        <i class="fas fa-file-audio"></i>
                        <a href="${filePath}" 
                           class="audio-link" 
                           data-file="${file.filename}"
                           data-folder="${directory.name}">
                            ${file.name}
                        </a>
                        <div class="file-info">
                            <span class="file-format">${file.format}</span>
                            <span class="file-duration">--:--</span>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        return html;
    }
    
    function initAudioLinks() {
        document.querySelectorAll('.audio-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const audioUrl = this.getAttribute('href');
                loadAudio(audioUrl, this);
            });
        });
    }
    
    function preloadAudioMetadata() {
        document.querySelectorAll('.audio-link').forEach(link => {
            const audioUrl = link.getAttribute('href');
            const audio = new Audio();
            
            audio.preload = 'metadata';
            audio.src = audioUrl;
            
            audio.addEventListener('loadedmetadata', function() {
                const durationSpan = link.parentElement.querySelector('.file-duration');
                if (durationSpan) {
                    durationSpan.textContent = formatTime(audio.duration);
                }
            });
            
            audio.addEventListener('error', function() {
                const durationSpan = link.parentElement.querySelector('.file-duration');
                if (durationSpan) {
                    durationSpan.textContent = "--:--";
                }
            });
        });
    }
    
    function initFolderCollapse() {
        document.querySelectorAll('.dir-header').forEach(header => {
            header.addEventListener('click', function(e) {
                if (e.target.classList.contains('fold-icon') || 
                    e.target.classList.contains('dir-name') ||
                    e.target.classList.contains('fa-folder') ||
                    e.target.classList.contains('file-count')) {
                    
                    const dir = this.closest('.directory');
                    const fileList = dir.querySelector('.file-list');
                    const foldIcon = this.querySelector('.fold-icon');
                    
                    // 切换折叠状态
                    if (fileList.style.display === 'none') {
                        fileList.style.display = '';
                        foldIcon.classList.remove('fa-chevron-right');
                        foldIcon.classList.add('fa-chevron-down');
                        dir.classList.remove('collapsed');
                    } else {
                        fileList.style.display = 'none';
                        foldIcon.classList.remove('fa-chevron-down');
                        foldIcon.classList.add('fa-chevron-right');
                        dir.classList.add('collapsed');
                    }
                }
            });
            
            const dir = header.closest('.directory');
            const fileList = dir.querySelector('.file-list');
            const foldIcon = header.querySelector('.fold-icon');
            fileList.style.display = '';
        });
    }
    
    function expandAllFolders() {
        document.querySelectorAll('.directory').forEach(dir => {
            const fileList = dir.querySelector('.file-list');
            const foldIcon = dir.querySelector('.fold-icon');
            fileList.style.display = '';
            foldIcon.classList.remove('fa-chevron-right');
            foldIcon.classList.add('fa-chevron-down');
            dir.classList.remove('collapsed');
        });
    }
    
    function collapseAllFolders() {
        document.querySelectorAll('.directory').forEach(dir => {
            const fileList = dir.querySelector('.file-list');
            const foldIcon = dir.querySelector('.fold-icon');
            fileList.style.display = 'none';
            foldIcon.classList.remove('fa-chevron-down');
            foldIcon.classList.add('fa-chevron-right');
            dir.classList.add('collapsed');
        });
    }
    
    function updateStats() {
        if (!audioData) return;
        
    }
    
    function loadAudioData() {
        directoryContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> 正在加载目录...
            </div>
        `;
        
        fetch('audio_list.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`网络响应不正常 (${response.status})`);
                }
                return response.json();
            })
            .then(data => {
                audioData = data;
                
                if (repoNameEl) repoNameEl.textContent = data.repositoryName;
                if (repoLinkEl) repoLinkEl.href = data.repositoryUrl;
                
                directoryContainer.innerHTML = generateDirectoryStructure(data);
                
                initAudioLinks();
                
                initFolderCollapse();
                
                preloadAudioMetadata();
                
                updateStats();
            })
            .catch(error => {
                console.error('加载音频失败:', error);
                directoryContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>加载音频目录失败: ${error.message}</p>
                        <button id="retryBtn" class="json-btn">重试</button>
                    </div>
                `;
                
                const retryBtn = document.getElementById('retryBtn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', loadAudioData);
                }
            });
    }
    
    playBtn.addEventListener('click', playAudio);
    pauseBtn.addEventListener('click', pauseAudio);
    stopBtn.addEventListener('click', stopAudio);
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCurrentAudio);
    }
    
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', expandAllFolders);
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', collapseAllFolders);
    }
    
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = volumeSlider.value;
    });
    
    progressBar.addEventListener('input', function() {
        if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
            const newTime = (progressBar.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = newTime;
        }
    });
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    
    audioPlayer.addEventListener('ended', function() {
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
    });
    
    pauseBtn.style.display = 'none';
    
    audioPlayer.volume = volumeSlider.value;
    
    loadAudioData();
    
    const style = document.createElement('style');
    style.textContent = `
        .playing {
            color: #6ee7b7 !important;
            font-weight: bold !important;
        }
        
        .playing:after {
            content: " \\25B6";
            font-size: 0.9em;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .control-btn.active {
            background: #10b981;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.7);
        }
    `;
    document.head.appendChild(style);
});