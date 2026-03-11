// --- CONFIGURATION ---
const images = [
    { id: 'chaii', srcColored: 'assets/images/Chaii Character.png', srcBW: 'assets/images/Chaii Character.png' },
    { id: 'scene', srcColored: 'assets/images/sceneColoured.png', srcBW: 'assets/images/sceneBW.png' },
    { id: 'scene', srcColored: 'assets/images/sheet 0007Coloured.png', srcBW: 'assets/images/sheet 0007BW.png' },
    { id: 'sticker1', srcColored: 'assets/images/STICKER SHEET 0001.png', srcBW: 'assets/images/STICKER SHEET 0001.png' },
    { id: 'sticker2', srcColored: 'assets/images/STICKER SHEET 0002.png', srcBW: 'assets/images/STICKER SHEET 0002BW.png' },
    { id: 'sticker3', srcColored: 'assets/images/STICKER SHEET 0003 bb.png', srcBW: 'assets/images/STICKER SHEET 0003 bbBW.png' },
    { id: 'sticker5', srcColored: 'assets/images/STICKER SHEET 0005 B.png', srcBW: 'assets/images/STICKER SHEET 0005 BBW.png' },
    { id: 'sticker6', srcColored: 'assets/images/STICKER SHEET 0006 b.png', srcBW: 'assets/images/STICKER SHEET 0006 bBW.png' },
    { id: 'img1', srcColored: 'assets/images/image1coloured.jpg', srcBW: 'assets/images/blackandwhiteimage1.png' },
    { id: 'img2', srcColored: 'assets/images/image2coloured.jpg', srcBW: 'assets/images/blackandwhiteimage2.png' },
    { id: 'img3', srcColored: 'assets/images/image3coloured.jpg', srcBW: 'assets/images/blackandwhiteimage3.png' }
];

const mainColors = ['#E45E25', '#06D6A0', '#118AB2', '#EF476F', '#FFD166', '#000000', '#FFFFFF', '#9D4EDD', '#8AC926', '#FF9F1C'];

// --- STATE MANAGEMENT ---
let currentImageId = null;
let selectedImgData = null; 
let savedDrawings = {};
let undoStack = []; // Remembers drawing history for the Undo button
let isDrawing = false;
let currentTool = 'pencil';
let currentColor = '#E45E25';
let currentSize = 15;
let currentZoom = 1;
const ZOOM_INCREMENT = 0.5;
const MAX_ZOOM = 4;
const MIN_ZOOM = 1;
let panX = 0, panY = 0;
let isPanning = false;
let startPanX = 0, startPanY = 0;
let initialPanX = 0, initialPanY = 0;

// DOM Elements
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const zoomWrapper = document.getElementById('zoom-wrapper');

// --- PAGE NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

document.getElementById('btn-go-settings').addEventListener('click', () => showPage('page-settings'));
document.getElementById('btn-go-leave').addEventListener('click', () => showPage('page-leave'));
// Starts the music and goes to the picture selection screen
document.getElementById('btn-go-play').addEventListener('click', () => {
    if (bgMusic) {
        bgMusic.play().catch(err => console.log("Music waiting for interaction")); 
    }
    showPage('page-selection');
});

// --- SETTINGS LOGIC ---
document.getElementById('slider-brightness').addEventListener('input', (e) => {
    const opacity = (100 - e.target.value) / 100;
    document.getElementById('brightness-overlay').style.backgroundColor = `rgba(0,0,0,${opacity})`;
});

// --- MUSIC VOLUME LOGIC ---
const bgMusic = document.getElementById('bg-music');
const sliderMusic = document.getElementById('slider-music');

// --- SOUND EFFECTS LOGIC & GLOBAL CLICK ---
const sfxClick = document.getElementById('sfx-click');
const sliderSfx = document.getElementById('slider-sfx');

// 1. Hook up the SFX Volume Slider so parents can turn it down!
if (sfxClick && sliderSfx) {
    sfxClick.volume = sliderSfx.value / 100;
    sliderSfx.addEventListener('input', (e) => {
        sfxClick.volume = e.target.value / 100;
    });
}

// 2. The Global Button Listener!
document.addEventListener('click', (e) => {
    // This looks at what the user clicked and checks if it's a button, a tool, a color, or a picture!
    const isButton = e.target.closest('button, .btn, .thumb, .mode-card, .tool-btn, .color-swatch, .extended-color-swatch, .modal-size-btn');
    
    if (isButton && sfxClick) {
        sfxClick.currentTime = 0; // Rewinds the sound so it can play rapidly if they tap fast!
        sfxClick.play().catch(err => console.log("SFX waiting for interaction"));
    }
});

// 1. Make sure the volume matches the slider right when the game loads
if (bgMusic && sliderMusic) {
    bgMusic.volume = sliderMusic.value / 100;

    // 2. Change the volume instantly when the kid drags the slider
    sliderMusic.addEventListener('input', (e) => {
        bgMusic.volume = e.target.value / 100;
    });
}

// --- AUTO-PLAY MENU MUSIC ---
let hasMusicStarted = false;

// Listens for the VERY FIRST click anywhere on the screen to start the music
document.body.addEventListener('pointerdown', () => {
    if (!hasMusicStarted && bgMusic) {
        bgMusic.play().catch(err => console.log("Waiting for interaction"));
        hasMusicStarted = true;
    }
}, { once: true }); // "once: true" means it only runs one time!

document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => { console.log(err); });
        document.getElementById('btn-fullscreen').textContent = "⬛ Exit Fullscreen";
    } else {
        if (document.exitFullscreen) { document.exitFullscreen(); document.getElementById('btn-fullscreen').textContent = "🔲 Fullscreen Mode"; }
    }
});

document.getElementById('btn-reset-drawings').addEventListener('click', () => {
    const confirmReset = confirm("Are you sure you want to delete all your colored pictures? You can't undo this!");
    if (confirmReset) {
        savedDrawings = {}; 
        if (canvas) ctx.clearRect(0, 0, canvas.width, canvas.height); 
        alert("All clean! Your drawings have been erased.");
    }
});

// --- IMAGE SELECTION & MODE CHOICE ---
const gallery = document.getElementById('image-gallery');
images.forEach(img => {
    const el = document.createElement('img');
    el.src = img.srcColored; 
    el.className = 'thumb bubble-animate';
    
    el.addEventListener('click', () => { 
    selectedImgData = img; 
    if (bgMusic) bgMusic.pause(); // THE FIX: Stops music when a picture is clicked!
    showPage('page-mode'); 
    });

    gallery.appendChild(el);
});

// --- UPLOAD PICTURE LOGIC ---
document.getElementById('custom-image-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const newImgData = { id: 'custom_' + Date.now(), srcColored: event.target.result, srcBW: event.target.result };
        images.unshift(newImgData);
        const newEl = document.createElement('img');
        newEl.src = newImgData.srcColored; 
        newEl.className = 'thumb bubble-animate';
        
        newEl.addEventListener('click', () => { 
        selectedImgData = newImgData; 
        if (bgMusic) bgMusic.pause(); // THE FIX: Stops music for uploaded photos!
        showPage('page-mode'); 
    });



        gallery.insertBefore(newEl, gallery.firstChild); 
        selectedImgData = newImgData;
        showPage('page-mode');
    };
    reader.readAsDataURL(file); 
    e.target.value = '';
});

// --- CANVAS SETUP & DRAWING ---
window.startDrawing = function(mode) {
    currentImageId = selectedImgData.id + (mode === 'blank' ? '_blank' : '_outline');
    const template = document.getElementById('coloring-template');
    document.getElementById('ref-thumbnail').src = selectedImgData.srcColored;
    document.getElementById('ref-large').src = selectedImgData.srcColored;
    undoStack = []; // Clear undo memory for new picture

    if (mode === 'blank') {
        template.style.display = 'none'; 
        setupCanvas(window.innerWidth, window.innerHeight);
        finishCanvasSetup();
    } else {
        template.style.display = 'block'; 
        template.src = selectedImgData.srcBW; 
        template.onload = () => { setupCanvas(template.naturalWidth, template.naturalHeight); finishCanvasSetup(); };
    }
    showPage('page-coloring');
};

function finishCanvasSetup() {
    resetZoom(); updateCursor(); 
    if(savedDrawings[currentImageId]) {
        let img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = savedDrawings[currentImageId];
    }
}

function goBackFromColoring() {
    if(currentImageId && canvas) savedDrawings[currentImageId] = canvas.toDataURL();
    closeToolModal(); closeColorModal(); showPage('page-selection');
}

window.openRefModal = function() { document.getElementById('ref-modal').classList.add('active'); };
window.closeRefModal = function() { document.getElementById('ref-modal').classList.remove('active'); };

function setupCanvas(w, h) {
    canvas.width = w || window.innerWidth;
    canvas.height = h || window.innerHeight;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateZoomPan() { zoomWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`; zoomWrapper.style.transformOrigin = "center center"; }
function resetZoom() { currentZoom = MIN_ZOOM; panX = 0; panY = 0; updateZoomPan(); }
function updateCursor() {
    canvas.className = ''; 
    if (currentTool === 'pencil') canvas.classList.add('cursor-pencil');
    if (currentTool === 'brush') canvas.classList.add('cursor-brush');
    if (currentTool === 'eraser') canvas.classList.add('cursor-eraser');
}

// --- NEW UNDO LOGIC ---
function saveState() {
    if (undoStack.length > 15) undoStack.shift(); 
    undoStack.push(canvas.toDataURL());
}

window.undoLastStroke = function() {
    if (undoStack.length === 0) return; 
    let lastState = undoStack.pop(); 
    let img = new Image();
    img.src = lastState;
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0); 
    };
};

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    if (currentTool === 'eraser') { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = currentSize; ctx.globalAlpha = 1.0; } 
    else if (currentTool === 'brush') { ctx.strokeStyle = currentColor; ctx.lineWidth = 40; ctx.globalAlpha = 1.0; } 
    else { ctx.strokeStyle = currentColor; ctx.lineWidth = currentSize; ctx.globalAlpha = 1.0; }

    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
}

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2 || e.shiftKey) { isPanning = true; startPanX = e.clientX; startPanY = e.clientY; initialPanX = panX; initialPanY = panY; } 
    else { saveState(); isDrawing = true; draw(e); }
});
canvas.addEventListener('mousemove', (e) => {
    if (isPanning) { panX = initialPanX + (e.clientX - startPanX); panY = initialPanY + (e.clientY - startPanY); updateZoomPan(); } 
    else if (isDrawing) { draw(e); }
});
canvas.addEventListener('mouseup', () => { isDrawing = false; isPanning = false; ctx.beginPath(); });

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) { isPanning = true; isDrawing = false; startPanX = (e.touches[0].clientX + e.touches[1].clientX) / 2; startPanY = (e.touches[0].clientY + e.touches[1].clientY) / 2; initialPanX = panX; initialPanY = panY; e.preventDefault(); } 
    else if (e.touches.length === 1) { saveState(); isDrawing = true; draw(e); }
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    if (isPanning && e.touches.length === 2) { const currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2; const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2; panX = initialPanX + (currentX - startPanX); panY = initialPanY + (currentY - startPanY); updateZoomPan(); e.preventDefault(); } 
    else if (isDrawing && e.touches.length === 1) { draw(e); e.preventDefault(); }
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) isPanning = false;
    if (e.touches.length === 0) { isDrawing = false; ctx.beginPath(); }
});

document.getElementById('zoom-in').addEventListener('click', () => { if (currentZoom < MAX_ZOOM) { currentZoom += ZOOM_INCREMENT; updateZoomPan(); } });
document.getElementById('zoom-out').addEventListener('click', () => { if (currentZoom > MIN_ZOOM) { currentZoom -= ZOOM_INCREMENT; updateZoomPan(); } });
document.getElementById('zoom-reset').addEventListener('click', resetZoom);

// --- TOOLBAR & COLORS ---
const colorsContainer = document.getElementById('main-colors');
colorsContainer.innerHTML = ''; 
mainColors.forEach(color => {
    const btn = document.createElement('div');
    btn.className = 'color-swatch bubble-animate';
    btn.style.backgroundColor = color;
    btn.addEventListener('click', () => {
        currentColor = color;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        if(currentTool === 'eraser') document.getElementById('tool-pencil').click();
    });
    colorsContainer.appendChild(btn);
});
if(colorsContainer.firstChild) colorsContainer.firstChild.classList.add('active');

const modal = document.getElementById('tool-modal');
const sizeOptions = document.getElementById('size-options');
const sizesMap = { 'pencil': [5, 15, 30], 'eraser': [10, 30, 60] };

window.openToolModal = function(toolName) {
    currentTool = toolName;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tool-${toolName}`).classList.add('active');
    updateCursor(); 
    if(toolName === 'brush') { closeToolModal(); return; }

    document.getElementById('modal-title').textContent = toolName.charAt(0).toUpperCase() + toolName.slice(1) + " Size";
    sizeOptions.innerHTML = '';
    sizesMap[toolName].forEach((size, index) => {
        const labels = ['Small', 'Medium', 'Big'];
        const btn = document.createElement('button');
        btn.className = 'modal-size-btn bubble-animate';
        const dotSize = size + (toolName === 'pencil' ? 5 : 0);
        btn.innerHTML = `<div class="size-preview-dot" style="width: ${dotSize}px; height: ${dotSize}px; background: currentColor;"></div><span>${labels[index]}</span>`;
        btn.addEventListener('click', () => { currentSize = size; closeToolModal(); });
        sizeOptions.appendChild(btn);
    });
    modal.classList.add('active');
};
window.closeToolModal = function() { modal.classList.remove('active'); };

const colorModal = document.getElementById('color-modal');
const extendedColorsGrid = document.getElementById('extended-colors-grid');
const extendedColors = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93', '#F15BB5', '#00BBF9', '#00F5D4', '#FEE440', '#9B5DE5', '#FB5607', '#FF006E', '#8338EC', '#3A86FF', '#8CB369'];

document.getElementById('tool-colorpicker').addEventListener('click', () => {
    extendedColorsGrid.innerHTML = '';
    extendedColors.forEach(color => {
        const btn = document.createElement('div');
        btn.className = 'extended-color-swatch bubble-animate';
        btn.style.backgroundColor = color;
        btn.addEventListener('click', () => {
            currentColor = color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            if(currentTool === 'eraser') document.getElementById('tool-pencil').click();
            colorModal.classList.remove('active');
        });
        extendedColorsGrid.appendChild(btn);
    });
    colorModal.classList.add('active');
});
window.closeColorModal = function() { colorModal.classList.remove('active'); };

// --- MAGIC CONFETTI LOGIC ---
window.finishAndCelebrate = function() {
    const colors = ['#E45E25', '#06D6A0', '#118AB2', '#EF476F', '#FFD166', '#9D4EDD'];
    for (let i = 0; i < 100; i++) {
        let confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = (Math.random() * 10 + 10) + 'px';
        confetti.style.height = (Math.random() * 10 + 10) + 'px';
        if(Math.random() > 0.5) confetti.style.borderRadius = '50%';
        let duration = Math.random() * 2 + 2; 
        let delay = Math.random() * 1;
        confetti.style.animationDuration = duration + 's';
        confetti.style.animationDelay = delay + 's';
        document.body.appendChild(confetti);
        setTimeout(() => { confetti.remove(); }, (duration + delay) * 1000);
    }
};