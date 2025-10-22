let albums = [];
let currentAlbumId = null;
let selectedColor = 'black';
let albumFiltrado = false;

function loadData() {
    const savedAlbums = localStorage.getItem('musicLibrary');
    const savedCurrentAlbum = localStorage.getItem('currentAlbumId');
    
    if (savedAlbums) {
        albums = JSON.parse(savedAlbums);
        renderAlbumList();
    }
    
    if (savedCurrentAlbum && albums.length > 0) {
        const albumExists = albums.find(a => a.id === parseInt(savedCurrentAlbum));
        if (albumExists) {
            showAlbum(parseInt(savedCurrentAlbum));
        }
    }
}

function saveData() {
    localStorage.setItem('musicLibrary', JSON.stringify(albums));
    localStorage.setItem('currentAlbumId', currentAlbumId);
}

window.addEventListener('DOMContentLoaded', loadData);

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

function openModal() {
    document.getElementById('modal').classList.add('active');
    switchTab('buscar');
    document.getElementById('artistInput').value = '';
    document.getElementById('albumInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'buscar') {
        document.querySelector('.tab:nth-child(1)').classList.add('active');
        document.getElementById('tab-buscar').classList.add('active');
    } else if (tabName === 'manual') {
        document.querySelector('.tab:nth-child(2)').classList.add('active');
        document.getElementById('tab-manual').classList.add('active');
    }
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-color="${color}"]`).classList.add('selected');
}

function getColorGradient(color) {
    const colors = {
        red: 'linear-gradient(135deg, #F57445 0%, #A30D0D 100%)',
        pink: 'linear-gradient(135deg, #FA82E6 0%, #AD0776 100%)',
        purple: 'linear-gradient(135deg, #BD4EF5 0%, #470FB8 100%)',
        royalblue: 'linear-gradient(135deg, #5094FA 0%, #2125A3 100%)',
        skyblue: 'linear-gradient(135deg, #5AFADF 0%, #0A71AD 100%)',
        green: 'linear-gradient(135deg, #8FCC49 0%, #106616 100%)',
        yellow: 'linear-gradient(135deg, #FAD750 0%, #AD5E03 100%)',
        brown: 'linear-gradient(135deg, #755621 0%, #331E06 100%)',
        black: 'linear-gradient(135deg, #3E4347 0%, #1B1D1F 100%)',
        white: 'linear-gradient(135deg, #FFFFFF 0%, #B4B5B8 100%)'
    };
    return colors[color] || colors.black;
}

function generateColorImage(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    const colorMap = {
        red: ['#F57445', '#A30D0D'],
        pink: ['#FA82E6', '#AD0776'],
        purple: ['#BD4EF5', '#470FB8'],
        royalblue: ['#5094FA', '#2125A3'],
        skyblue: ['#5AFADF', '#0A71AD'],
        green: ['#8FCC49', '#106616'],
        yellow: ['#FAD750', '#AD5E03'],
        brown: ['#755621', '#331E06'],
        black: ['#3E4347', '#1B1D1F'],
        white: ['#FFFFFF', '#B4B5B8']
    };
    
    const [color1, color2] = colorMap[color] || colorMap.black;
    
    const gradient = ctx.createLinearGradient(0, 0, 600, 600);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);
    
    return canvas.toDataURL('image/png');
}

function createManualAlbum(event) {
    event.preventDefault();
    
    const artist = document.getElementById('manualArtist').value.trim();
    const albumName = document.getElementById('manualAlbum').value.trim();
    const tracksText = document.getElementById('manualTracks').value.trim();
    
    if (!artist || !albumName || !tracksText) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    const trackLines = tracksText.split('\n').filter(line => line.trim() !== '');
    
    if (trackLines.length === 0) {
        alert('Por favor ingresa al menos una canción');
        return;
    }
    
    const newAlbumId = Date.now();
    const artworkUrl = generateColorImage(selectedColor);
    
    const newAlbum = {
        id: newAlbumId,
        artistName: artist,
        collectionName: albumName,
        artworkUrl: artworkUrl,
        isManual: true,
        color: selectedColor,
        score: 0,
        tracks: trackLines.map((trackName, index) => ({
            id: newAlbumId + index + 1,
            number: index + 1,
            name: trackName.trim(),
            status: null
        }))
    };
    
    albums.unshift(newAlbum);
    renderAlbumList();
    saveData();
    showAlbum(newAlbumId);
    closeModal();
    
    document.getElementById('manualArtist').value = '';
    document.getElementById('manualAlbum').value = '';
    document.getElementById('manualTracks').value = '';
}

async function searchAlbum(event) {
    event.preventDefault();
    
    const artist = document.getElementById('artistInput').value;
    const album = document.getElementById('albumInput').value;
    const resultsDiv = document.getElementById('searchResults');
    
    resultsDiv.innerHTML = '<div class="loading">Buscando...</div>';
    
    let searchTerm = artist;
    if (album) {
        searchTerm += ' ' + album;
    }
    
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=album&limit=50`);
        const data = await response.json();
        
        if (data.results.length === 0) {
            resultsDiv.innerHTML = '<div class="loading">No se encontraron resultados</div>';
            return;
        }
        
        const groupedByArtist = {};
        data.results.forEach(item => {
            if (!groupedByArtist[item.artistName]) {
                groupedByArtist[item.artistName] = [];
            }
            groupedByArtist[item.artistName].push(item);
        });
        
        let html = '';
        for (const artistName in groupedByArtist) {
            html += `<div class="result-artist">${artistName}</div>`;
            html += '<div class="search-results">';
            groupedByArtist[artistName].forEach(item => {
                html += `
                    <div class="result-item" onclick="selectAlbum(${item.collectionId})">
                        <img src="${item.artworkUrl100}" alt="${item.collectionName}" class="result-cover">
                        <div class="result-name">${item.collectionName}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        resultsDiv.innerHTML = html;
    } catch (error) {
        resultsDiv.innerHTML = '<div class="loading">Error al buscar. Intenta de nuevo.</div>';
    }
}

async function selectAlbum(collectionId) {
    try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${collectionId}&entity=song`);
        const data = await response.json();
        
        const albumData = data.results[0];
        const tracks = data.results.slice(1).filter(item => item.wrapperType === 'track');
        
        const existingAlbum = albums.find(a => a.id === collectionId);
        
        if (!existingAlbum) {
            const newAlbum = {
                id: collectionId,
                artistName: albumData.artistName,
                collectionName: albumData.collectionName,
                artworkUrl: albumData.artworkUrl100.replace('100x100', '600x600'),
                score: 0,
                tracks: tracks.map(track => ({
                    id: track.trackId,
                    number: track.trackNumber,
                    name: track.trackName,
                    status: null
                }))
            };
            albums.unshift(newAlbum);
            renderAlbumList();
            saveData();
        }
        
        showAlbum(collectionId);
        closeModal();
    } catch (error) {
        alert('Error al cargar el álbum. Intenta de nuevo.');
    }
}

function renderAlbumList() {
    const listDiv = document.getElementById('albumList');
    listDiv.innerHTML = albums.map(album => `
        <div class="album-item ${currentAlbumId === album.id ? 'active' : ''}" onclick="albumFiltrado=false; showAlbum(${album.id})">
            <img src="${album.artworkUrl}" alt="${album.collectionName}">
            <div class="album-item-info">
                <div class="album-item-artist">${album.artistName}</div>
                <div class="album-item-name">${album.collectionName}</div>
                <div class="album-item-score" ${album.score > 0 ? '' : 'style="display: none;"'} >${album.score}<span> / 10</span></div>
            </div>
        </div>
    `).join('');
}

function showAlbum(albumId, scrollPosition = 0) {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;
    
    currentAlbumId = albumId;
    saveData();
    renderAlbumList();
    closeSidebar();
    
    const favoriteCount = album.tracks.filter(t => t.status === 'favorite').length;
    const likedCount = album.tracks.filter(t => t.status === 'liked').length;
    const dislikedCount = album.tracks.filter(t => t.status === 'disliked').length;
    const totalSongs = album.tracks.length;
    const remainingSongs = totalSongs - favoriteCount - likedCount - dislikedCount;    
    let albumRanked = false;
    if(album.score > 0) albumRanked = true;

    const contenidoStatScore = `<div class="stat-item"><span class="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 6.99999C16.4183 6.99999 20 10.5817 20 15C20 19.4183 16.4183 23 12 23C7.58172 23 4 19.4183 4 15C4 10.5817 7.58172 6.99999 12 6.99999ZM12 8.99999C8.68629 8.99999 6 11.6863 6 15C6 18.3137 8.68629 21 12 21C15.3137 21 18 18.3137 18 15C18 11.6863 15.3137 8.99999 12 8.99999ZM12 10.5L13.3225 13.1797L16.2798 13.6094L14.1399 15.6953L14.645 18.6406L12 17.25L9.35497 18.6406L9.86012 15.6953L7.72025 13.6094L10.6775 13.1797L12 10.5ZM18 1.99999V4.99999L16.6366 6.13755C15.5305 5.5577 14.3025 5.17884 13.0011 5.04948L13 1.99899L18 1.99999ZM11 1.99899L10.9997 5.04939C9.6984 5.17863 8.47046 5.55735 7.36441 6.13703L6 4.99999V1.99999L11 1.99899Z"></path></svg></span><span>${album.score} / 10</span></div>`;

    const  contenidoStatRemainingSongs = `<div class="stat-item"><span class="stat-icon"><svg fill="currentColor" viewBox="0 0 256 256"><path d="M198.24,62.63l15.68-17.25a8,8,0,0,0-11.84-10.76L186.4,51.86A95.95,95.95,0,0,0,57.76,193.37L42.08,210.62a8,8,0,1,0,11.84,10.76L69.6,204.14A95.95,95.95,0,0,0,198.24,62.63ZM48,128A80,80,0,0,1,175.6,63.75l-107,117.73A79.63,79.63,0,0,1,48,128Zm80,80a79.55,79.55,0,0,1-47.6-15.75l107-117.73A79.95,79.95,0,0,1,128,208Z"></path></svg></span><span>${remainingSongs}</span></div>`;
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
    <div class="album-actions">
            <button class="btn-share" id="btn-filtrar-lista" ${albumRanked ? 'style="display: none;' : 'onclick="filtrarLista()"'}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z"></path></svg></button>
            <button class="btn-share" id="btn-mostrar-lista" onclick="quitarFiltroLista()">Mostrar Todo</button>
            <button class="btn-share" ${albumRanked ? 'onclick="openEstadisticasModal()"' : 'style="display: none;'}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18H4V10H9V18ZM15 18H10V6H15V18ZM21 18H16V2H21V18ZM22 22H3V20H22V22Z"></path></svg></button>
            <button class="btn-share" ${albumRanked ? 'onclick="openShareModal()"' : 'style="display: none;'}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5759 17.2714L8.46576 14.484C7.83312 15.112 6.96187 15.5 6 15.5C4.067 15.5 2.5 13.933 2.5 12C2.5 10.067 4.067 8.5 6 8.5C6.96181 8.5 7.83301 8.88796 8.46564 9.51593L13.5759 6.72855C13.5262 6.49354 13.5 6.24983 13.5 6C13.5 4.067 15.067 2.5 17 2.5C18.933 2.5 20.5 4.067 20.5 6C20.5 7.933 18.933 9.5 17 9.5C16.0381 9.5 15.1669 9.11201 14.5343 8.48399L9.42404 11.2713C9.47382 11.5064 9.5 11.7501 9.5 12C9.5 12.2498 9.47383 12.4935 9.42408 12.7285L14.5343 15.516C15.167 14.888 16.0382 14.5 17 14.5C18.933 14.5 20.5 16.067 20.5 18C20.5 19.933 18.933 21.5 17 21.5C15.067 21.5 13.5 19.933 13.5 18C13.5 17.7502 13.5262 17.5064 13.5759 17.2714Z"></path></svg></button>
        </div>
        <div class="album-header">
            <img src="${album.artworkUrl}" alt="${album.collectionName}" class="album-cover-large">
            <div class="album-info">
                <div class="album-details">
                    <div class="album-artist-name">${album.artistName}</div>
                    <div class="album-name">${album.collectionName}</div>
                </div>
                <div class="album-stats">
                ${albumRanked ? contenidoStatScore : contenidoStatRemainingSongs }
                    <div class="stat-item">
                        <span class="stat-icon">
                            <svg viewBox="0 0 640 512" fill="currentColor">
                                <path d="M320.1 32C329.1 32 337.4 37.1 341.5 45.1L415 189.3L574.9 214.7C583.8 216.1 591.2 222.4 594 231C596.8 239.6 594.5 249 588.2 255.4L473.7 369.9L499 529.8C500.4 538.7 496.7 547.7 489.4 553C482.1 558.3 472.4 559.1 464.4 555L320.1 481.6L175.8 555C167.8 559.1 158.1 558.3 150.8 553C143.5 547.7 139.8 538.8 141.2 529.8L166.4 369.9L52 255.4C45.6 249 43.4 239.6 46.2 231C49 222.4 56.3 216.1 65.3 214.7L225.2 189.3L298.8 45.1C302.9 37.1 311.2 32 320.2 32zM320.1 108.8L262.3 222C258.8 228.8 252.3 233.6 244.7 234.8L119.2 254.8L209 344.7C214.4 350.1 216.9 357.8 215.7 365.4L195.9 490.9L309.2 433.3C316 429.8 324.1 429.8 331 433.3L444.3 490.9L424.5 365.4C423.3 357.8 425.8 350.1 431.2 344.7L521 254.8L395.5 234.8C387.9 233.6 381.4 228.8 377.9 222L320.1 108.8z"/>
                            </svg>
                        </span>
                        <span>${favoriteCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.5998 8.00033H21C22.1046 8.00033 23 8.89576 23 10.0003V12.1047C23 12.3659 22.9488 12.6246 22.8494 12.8662L19.755 20.3811C19.6007 20.7558 19.2355 21.0003 18.8303 21.0003H2C1.44772 21.0003 1 20.5526 1 20.0003V10.0003C1 9.44804 1.44772 9.00033 2 9.00033H5.48184C5.80677 9.00033 6.11143 8.84246 6.29881 8.57701L11.7522 0.851355C11.8947 0.649486 12.1633 0.581978 12.3843 0.692483L14.1984 1.59951C15.25 2.12534 15.7931 3.31292 15.5031 4.45235L14.5998 8.00033ZM7 10.5878V19.0003H18.1606L21 12.1047V10.0003H14.5998C13.2951 10.0003 12.3398 8.77128 12.6616 7.50691L13.5649 3.95894C13.6229 3.73105 13.5143 3.49353 13.3039 3.38837L12.6428 3.0578L7.93275 9.73038C7.68285 10.0844 7.36341 10.3746 7 10.5878ZM5 11.0003H3V19.0003H5V11.0003Z"/>
                            </svg>
                        </span>
                        <span>${likedCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15H18.5182C18.1932 15 17.8886 15.1579 17.7012 15.4233L12.2478 23.149C12.1053 23.3508 11.8367 23.4184 11.6157 23.3078L9.80163 22.4008C8.74998 21.875 8.20687 20.6874 8.49694 19.548L9.40017 16ZM17 13.4125V5H5.83939L3 11.8957V14H9.40017C10.7049 14 11.6602 15.229 11.3384 16.4934L10.4351 20.0414C10.3771 20.2693 10.4857 20.5068 10.6961 20.612L11.3572 20.9425L16.0673 14.27C16.3172 13.9159 16.6366 13.6257 17 13.4125ZM19 13H21V5H19V13Z"/>
                            </svg>
                        </span>
                        <span>${dislikedCount}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="track-list">
            ${album.tracks.map(track => `
                <div class="track-item ${track.status === 'favorite' ? 'favorite' : ''} ${track.status === 'liked' ? 'liked' : ''} ${track.status === 'disliked' ? 'disliked' : ''}" id="${track.id}">
                    <div class="track-number">${track.number}</div>
                    <div class="track-name">${track.name}</div>
                    <div class="track-actions">
                        <button class="track-btn star ${track.status === 'favorite' ? 'active' : ''}" onclick="setTrackStatus(${albumId}, ${track.id}, 'favorite')">
                        ${track.status === 'favorite' ? '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"></path></svg>' : '<svg viewBox="0 0 640 512" fill="currentColor"><path d="M320.1 32C329.1 32 337.4 37.1 341.5 45.1L415 189.3L574.9 214.7C583.8 216.1 591.2 222.4 594 231C596.8 239.6 594.5 249 588.2 255.4L473.7 369.9L499 529.8C500.4 538.7 496.7 547.7 489.4 553C482.1 558.3 472.4 559.1 464.4 555L320.1 481.6L175.8 555C167.8 559.1 158.1 558.3 150.8 553C143.5 547.7 139.8 538.8 141.2 529.8L166.4 369.9L52 255.4C45.6 249 43.4 239.6 46.2 231C49 222.4 56.3 216.1 65.3 214.7L225.2 189.3L298.8 45.1C302.9 37.1 311.2 32 320.2 32zM320.1 108.8L262.3 222C258.8 228.8 252.3 233.6 244.7 234.8L119.2 254.8L209 344.7C214.4 350.1 216.9 357.8 215.7 365.4L195.9 490.9L309.2 433.3C316 429.8 324.1 429.8 331 433.3L444.3 490.9L424.5 365.4C423.3 357.8 425.8 350.1 431.2 344.7L521 254.8L395.5 234.8C387.9 233.6 381.4 228.8 377.9 222L320.1 108.8z"/></svg>'}    
                        </button>
                        <button class="track-btn thumbs-up ${track.status === 'liked' ? 'active' : ''}" onclick="setTrackStatus(${albumId}, ${track.id}, 'liked')">
                        ${track.status === 'liked' ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 8.99997H5V21H2C1.44772 21 1 20.5523 1 20V9.99997C1 9.44769 1.44772 8.99997 2 8.99997ZM7.29289 7.70708L13.6934 1.30661C13.8693 1.13066 14.1479 1.11087 14.3469 1.26016L15.1995 1.8996C15.6842 2.26312 15.9026 2.88253 15.7531 3.46966L14.5998 7.99997H21C22.1046 7.99997 23 8.8954 23 9.99997V12.1043C23 12.3656 22.9488 12.6243 22.8494 12.8658L19.755 20.3807C19.6007 20.7554 19.2355 21 18.8303 21H8C7.44772 21 7 20.5523 7 20V8.41419C7 8.14897 7.10536 7.89462 7.29289 7.70708Z"></path></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5998 8.00033H21C22.1046 8.00033 23 8.89576 23 10.0003V12.1047C23 12.3659 22.9488 12.6246 22.8494 12.8662L19.755 20.3811C19.6007 20.7558 19.2355 21.0003 18.8303 21.0003H2C1.44772 21.0003 1 20.5526 1 20.0003V10.0003C1 9.44804 1.44772 9.00033 2 9.00033H5.48184C5.80677 9.00033 6.11143 8.84246 6.29881 8.57701L11.7522 0.851355C11.8947 0.649486 12.1633 0.581978 12.3843 0.692483L14.1984 1.59951C15.25 2.12534 15.7931 3.31292 15.5031 4.45235L14.5998 8.00033ZM7 10.5878V19.0003H18.1606L21 12.1047V10.0003H14.5998C13.2951 10.0003 12.3398 8.77128 12.6616 7.50691L13.5649 3.95894C13.6229 3.73105 13.5143 3.49353 13.3039 3.38837L12.6428 3.0578L7.93275 9.73038C7.68285 10.0844 7.36341 10.3746 7 10.5878ZM5 11.0003H3V19.0003H5V11.0003Z"/></svg>'}
                        </button>
                        <button class="track-btn thumbs-down ${track.status === 'disliked' ? 'active' : ''}" onclick="setTrackStatus(${albumId}, ${track.id}, 'disliked')">
                        ${track.status === 'disliked' ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 15H19V3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15ZM16.7071 16.2929L10.3066 22.6934C10.1307 22.8693 9.85214 22.8891 9.65308 22.7398L8.8005 22.1004C8.3158 21.7369 8.09739 21.1174 8.24686 20.5303L9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H16C16.5523 3 17 3.44772 17 4V15.5858C17 15.851 16.8946 16.1054 16.7071 16.2929Z"></path></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15H18.5182C18.1932 15 17.8886 15.1579 17.7012 15.4233L12.2478 23.149C12.1053 23.3508 11.8367 23.4184 11.6157 23.3078L9.80163 22.4008C8.74998 21.875 8.20687 20.6874 8.49694 19.548L9.40017 16ZM17 13.4125V5H5.83939L3 11.8957V14H9.40017C10.7049 14 11.6602 15.229 11.3384 16.4934L10.4351 20.0414C10.3771 20.2693 10.4857 20.5068 10.6961 20.612L11.3572 20.9425L16.0673 14.27C16.3172 13.9159 16.6366 13.6257 17 13.4125ZM19 13H21V5H19V13Z"/></svg>'}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="album-actions">
            <button class="btn-delete" onclick="openConfirmModal()">Eliminar</button>
        </div>
    `;
    
    const mainContentElement = document.querySelector('.main-content');
    if (mainContentElement) {
        setTimeout(() => {
            mainContentElement.scrollTop = scrollPosition;
        }, 0);
    }
}

function quitarFiltroLista() {
    showAlbum(currentAlbumId);
    albumFiltrado = false;
}

// oculta las canciones que ya tienen calificacion
function filtrarLista() {
    if (!currentAlbumId) return;
    
    const album = albums.find(a => a.id === currentAlbumId);
    if (!album) return;

    // revisar que todas las canciones estén calificadas, si si, return
    if (album.tracks.filter(t => t.status === null) == 0) {
        albumFiltrado = false;
        return;
    }

    // que cuando cambie de album, albumFilter se cabmie a false

    const totalSongs = album.tracks.length;    

    for(let i=0; i < totalSongs; i++) {
        if(album.tracks[i].status != null) {
            document.getElementById(album.tracks[i].id).style.display = "none";
        }
    }
    
    document.getElementById("btn-mostrar-lista").style.display = "block";
    document.getElementById("btn-filtrar-lista").style.display = "none";

    albumFiltrado = true;

}

function setTrackStatus(albumId, trackId, status) {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;
    
    const track = album.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    if (track.status === status) {
        track.status = null;
    } else {
        track.status = status;
    }

    const totalSongs = album.tracks.length;
    const favoriteCount = album.tracks.filter(t => t.status === 'favorite').length;
    const likedCount = album.tracks.filter(t => t.status === 'liked').length;
    const dislikedCount = album.tracks.filter(t => t.status === 'disliked').length;

    //si el ranking está completo, calcular score de album
    if (totalSongs == favoriteCount+likedCount+dislikedCount) {
        const finalScore = calcularScore(favoriteCount, likedCount, dislikedCount);
        album.score = finalScore;
    } else {
        album.score = 0;
    }

    saveData();
    
    const mainContentElement = document.querySelector('.main-content');
    const scrollPosition = mainContentElement ? mainContentElement.scrollTop : 0;
    
    showAlbum(albumId, scrollPosition);


    if(albumFiltrado) {
        filtrarLista();
    }
}

function openConfirmModal() {
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

function confirmDelete() {
    if (!currentAlbumId) return;
    
    albums = albums.filter(a => a.id !== currentAlbumId);
    currentAlbumId = null;
    
    saveData();
    closeConfirmModal();
    renderAlbumList();
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="empty-state">
            <h2>Álbum eliminado</h2>
            <p>Selecciona otro álbum o agrega uno nuevo</p>
        </div>
    `;
}

function openShareModal() {
    if (!currentAlbumId) return;
    
    const album = albums.find(a => a.id === currentAlbumId);
    if (!album) return;
    
    const favorites = album.tracks.filter(t => t.status === 'favorite');
    const liked = album.tracks.filter(t => t.status === 'liked');
    const disliked = album.tracks.filter(t => t.status === 'disliked');
    
    let shareText = `${album.artistName}\n${album.collectionName}\n${album.score} / 10\n\n`;
    
    if (favorites.length > 0) {
        shareText += `--- ⭐ ---\n`;
        favorites.forEach(track => {
            shareText += `${track.name}\n`;
        });
        shareText += '\n';
    }
    
    if (liked.length > 0) {
        shareText += `--- 👍 ---\n`;
        liked.forEach(track => {
            shareText += `${track.name}\n`;
        });
        shareText += '\n';
    }
    
    if (disliked.length > 0) {
        shareText += `--- 👎 ---\n`;
        disliked.forEach(track => {
            shareText += `${track.name}\n`;
        });
    }
    
    const shareBody = document.getElementById('shareBody');
    let html = `
    <div class="share-header-container">
        <div class="share-artist">${album.artistName}</div>
        <div class="share-album">${album.collectionName}</div>
        <div class="share-score">${album.score} / 10</div>
    </div>
    `;
    
    if (favorites.length > 0) {
        html += `
            <div class="share-section">
                <div class="share-divider">⭐</div>
                ${favorites.map(track => `<div class="share-track">${track.name}</div>`).join('')}
            </div>
        `;
    }
    
    if (liked.length > 0) {
        html += `
            <div class="share-section">
                <div class="share-divider">👍</div>
                ${liked.map(track => `<div class="share-track">${track.name}</div>`).join('')}
            </div>
        `;
    }
    
    if (disliked.length > 0) {
        html += `
            <div class="share-section">
                <div class="share-divider">👎</div>
                ${disliked.map(track => `<div class="share-track">${track.name}</div>`).join('')}
            </div>
        `;
    }
    
    shareBody.innerHTML = html;
    shareBody.dataset.shareText = shareText;
    document.getElementById('shareModal').classList.add('active');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('active');
}

function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
    closeSidebar();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function calcularScore(favorites, likes, dislikes) {

    let pesoFavorite = 10;
    let pesoLiked = 7;
    let pesoDisliked = 3;
    const factor = 6;

    const totalSongs = favorites + likes + dislikes;

    const pStar = favorites / totalSongs;
    const pLiked = likes / totalSongs;
    const pDisliked = dislikes / totalSongs;

    pesoFavorite = pesoFavorite + (pStar - pDisliked) * (factor * 4);
    pesoLiked = pesoLiked + (pStar - pDisliked) * (factor / 2);
    pesoDisliked = pesoDisliked - (pStar - factor / 2);

    pesoFavorite = Math.min(10, Math.max(0, pesoFavorite));
    pesoLiked = Math.min(10, Math.max(0, pesoLiked));
    pesoDisliked = Math.min(10, Math.max(0, pesoDisliked));

    let finalScore = (favorites * pesoFavorite) + (likes * pesoLiked) + (dislikes * pesoDisliked);
    finalScore = finalScore / totalSongs;
    finalScore = Number(finalScore.toFixed(1));

    return finalScore;

}

function openEstadisticasModal() {
    if (!currentAlbumId) return;
    
    const album = albums.find(a => a.id === currentAlbumId);
    if (!album) return;

    const totalSongs = album.tracks.length;
    const favoriteCount = album.tracks.filter(t => t.status === 'favorite').length;
    const likedCount = album.tracks.filter(t => t.status === 'liked').length;
    const dislikedCount = album.tracks.filter(t => t.status === 'disliked').length;

    if (totalSongs != favoriteCount+likedCount+dislikedCount){
        alert("Aún hay canciones por calificar antes de ver estadísticas.");
        return;
    }

    const favoritePercentage = Math.ceil((favoriteCount * 100 / totalSongs) * 10) / 10;
    const likedPercentage = Math.ceil((likedCount * 100 / totalSongs) * 10) / 10;
    const dislikedPercentage = Math.ceil((dislikedCount * 100 / totalSongs) * 10) / 10;

    const finalScore = calcularScore(favoriteCount, likedCount, dislikedCount);

    // ponerle color al final score dependiendo si es bueno o malo
    let scoreColor = "#fff";
    if (finalScore >= 8.5) scoreColor = "#f1c40f";
    if (finalScore < 6) scoreColor = "#e74c3c";

    document.getElementById('estadisticasModal').classList.add('active');
    document.getElementById('estadisticas-finalScore').innerHTML = `
    <p style="color: #999; font-size: 14px;"><span style="color: ${scoreColor}; font-size: 28px; font-weight: bold;">${finalScore}</span> / 10</p>`;

    document.getElementById('estadisticas-favorites-count').innerText = favoriteCount;
    document.getElementById('estadisticas-favorites-percentage').innerText = favoritePercentage + "%";
    document.getElementById('estadisticas-likes-count').innerText = likedCount;
    document.getElementById('estadisticas-likes-percentage').innerText = likedPercentage + "%";
    document.getElementById('estadisticas-dislikes-count').innerText = dislikedCount;
    document.getElementById('estadisticas-dislikes-percentage').innerText = dislikedPercentage + "%";

}

function closeEstadisticasModal() {
    document.getElementById('estadisticasModal').classList.remove('active');
}

function exportData() {
    if (albums.length === 0) {
        alert('No hay álbumes para exportar');
        return;
    }
    
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        albums: albums
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `album-ranking-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Datos exportados correctamente');
}

function importData() {
    document.getElementById('importFileInput').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.albums || !Array.isArray(importedData.albums)) {
                alert('Archivo inválido. Por favor selecciona un archivo de respaldo válido.');
                return;
            }
            
            const confirmImport = confirm(
                `¿Estás seguro de importar los datos?\n\n` +
                `Se encontraron ${importedData.albums.length} álbumes.\n` +
                `Esto reemplazará todos tus datos actuales.`
            );
            
            if (!confirmImport) {
                event.target.value = '';
                return;
            }
            
            albums = importedData.albums;
            currentAlbumId = null;
            
            saveData();
            renderAlbumList();
            
            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = `
                <div class="empty-state">
                    <h2>Datos importados correctamente</h2>
                    <p>Se han cargado ${albums.length} álbumes. Selecciona uno para ver los detalles.</p>
                </div>
            `;
            
            closeSettingsModal();
            alert(`Importación exitosa: ${albums.length} álbumes cargados`);
            
        } catch (error) {
            alert('Error al leer el archivo. Asegúrate de que sea un archivo de respaldo válido.');
            console.error('Error al importar:', error);
        }
        
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

async function copyToClipboard() {
    const shareBody = document.getElementById('shareBody');
    const text = shareBody.dataset.shareText;
    
    try {
        await navigator.clipboard.writeText(text);
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    } catch (err) {
        alert('No se pudo copiar al portapapeles');
    }
}

document.getElementById('shareModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeShareModal();
    }
});

document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSettingsModal();
    }
});

document.getElementById('estadisticasModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEstadisticasModal();
    }
});