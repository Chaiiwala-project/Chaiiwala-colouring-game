// --- CONFIGURATION ---
const images = [

    { id: 'scene', srcColored: 'assets/images/sceneColoured.png', srcBW: 'assets/images/sceneBW.png' },
    { id: 'scene', srcColored: 'assets/images/sheet 0007Coloured.png', srcBW: 'assets/images/sheet 0007BW.png' },
    { id: 'sticker1', srcColored: 'assets/images/STICKER SHEET 0001.png', srcBW: 'assets/images/STICKER SHEET 0001.png' },
    { id: 'sticker2', srcColored: 'assets/images/STICKER SHEET 0002.png', srcBW: 'assets/images/STICKER SHEET 0002BW.png' },
    { id: 'sticker3', srcColored: 'assets/images/STICKER SHEET 0003 bb.png', srcBW: 'assets/images/STICKER SHEET 0003 bbBW.png' },
    { id: 'sticker5', srcColored: 'assets/images/STICKER SHEET 0005 B.png', srcBW: 'assets/images/STICKER SHEET 0005 BBW.png' },
    { id: 'sticker6', srcColored: 'assets/images/STICKER SHEET 0006 b.png', srcBW: 'assets/images/STICKER SHEET 0006 bBW.png' },
    { id: 'img1', srcColored: 'assets/images/image1coloured.jpg', srcBW: 'assets/images/blackandwhiteimage1.png' },
    { id: 'img2', srcColored: 'assets/images/image2coloured.jpg', srcBW: 'assets/images/blackandwhiteimage2.png' },
    { id: 'img3', srcColored: 'assets/images/image3coloured.jpg', srcBW: 'assets/images/blackandwhiteimage3.png' },
    { id: 'img4', srcColored: 'assets/images/CW Blackburn Drive ThruCL.png', srcBW: 'assets/images/CW Stratford RoadBW.png' },
    { id: 'img5', srcColored: 'assets/images/CW Star CityCL.png', srcBW: 'assets/images/CW Star CityBW.png' },
    { id: 'img6', srcColored: 'assets/images/CW Stratford Road.png', srcBW: 'assets/images/CW Blackbum Drive ThruBW.png' },
    { id: 'img7', srcColored: 'assets/images/BIKE.png', srcBW: 'assets/images/BIKEBW.png' },
    { id: 'img8', srcColored: 'assets/images/BIKE2CL.png', srcBW: 'assets/images/BIKE2.png' },

    { id: 'img8', srcColored: 'assets/images/cup.png', srcBW: 'assets/images/cup.png' }
    
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
    const confirmReset = confirm("Are you sure you want to delete all your drawings AND your custom photos? You can't undo this!");
    if (confirmReset) {
        // 1. Clear the drawing memory and canvas
        savedDrawings = {}; 
        if (canvas) ctx.clearRect(0, 0, canvas.width, canvas.height); 
        
        // 2. Erase the custom selfies from the gallery screen
        document.querySelectorAll('.custom-photo').forEach(photo => photo.remove());
        
        // 3. Delete the custom selfies from the game's brain
        for (let i = images.length - 1; i >= 0; i--) {
            if (images[i].id.startsWith('custom_')) {
                images.splice(i, 1);
            }
        }
        
        alert("All clean! Your drawings and photos have been erased.");
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
// --- TRUE LIVE CAMERA LOGIC ---
// --- TRUE LIVE CAMERA LOGIC ---
const cameraModal = document.getElementById('camera-modal');
const cameraFeed = document.getElementById('camera-feed');
let cameraStream = null;
let currentFacingMode = 'user'; // Starts with the selfie camera

function stopCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
}

// 1. Turn on the camera!
window.openCameraModal = async function(facingMode = currentFacingMode) {
    cameraModal.classList.add('active');
    stopCameraStream(); // Turn off the old camera before starting the new one

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: facingMode } } 
        });
        cameraFeed.srcObject = cameraStream;
        currentFacingMode = facingMode;

        // THE FIX: If it's a selfie, act like a mirror. If back camera, show normally!
        if (currentFacingMode === 'user') {
            cameraFeed.style.transform = 'scaleX(-1)';
        } else {
            cameraFeed.style.transform = 'scaleX(1)';
        }
    } catch (err) {
        alert("Oops! We couldn't access that camera.");
        closeCameraModal();
    }
};

// 2. Switch the camera!
window.switchCamera = function() {
    // If it's on front, switch to back. If on back, switch to front!
    const newMode = currentFacingMode === 'user' ? 'environment' : 'user';
    openCameraModal(newMode);
};

// 3. Turn off the camera!
window.closeCameraModal = function() {
    cameraModal.classList.remove('active');
    stopCameraStream();
};

// 4. Take the picture!
document.getElementById('btn-snap-photo').addEventListener('click', () => {
    if (!cameraStream) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cameraFeed.videoWidth;
    tempCanvas.height = cameraFeed.videoHeight;
    const tCtx = tempCanvas.getContext('2d');
    
    // THE FIX: Only flip the final picture if they took a selfie!
    if (currentFacingMode === 'user') {
        tCtx.translate(tempCanvas.width, 0);
        tCtx.scale(-1, 1);
    }
    
    tCtx.drawImage(cameraFeed, 0, 0, tempCanvas.width, tempCanvas.height);
    const photoData = tempCanvas.toDataURL('image/jpeg', 0.8);
    
    const newImgData = { id: 'custom_' + Date.now(), srcColored: photoData, srcBW: photoData };
    images.unshift(newImgData);
    
    const newEl = document.createElement('img');
    newEl.src = newImgData.srcColored; 
    newEl.className = 'thumb bubble-animate custom-photo';
    
    newEl.addEventListener('click', () => { 
        selectedImgData = newImgData; 
        if (bgMusic) bgMusic.pause();
        showPage('page-mode'); 
    });

    document.getElementById('image-gallery').insertBefore(newEl, document.getElementById('image-gallery').firstChild);
    
    closeCameraModal();
    if (sfxClick) sfxClick.play().catch(()=>{});
    
    selectedImgData = newImgData;
    showPage('page-mode');
});

// 3. Take the picture!
document.getElementById('btn-snap-photo').addEventListener('click', () => {
    if (!cameraStream) return;
    
    // Create a temporary canvas to freeze the frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cameraFeed.videoWidth;
    tempCanvas.height = cameraFeed.videoHeight;
    const tCtx = tempCanvas.getContext('2d');
    
    // Flip it so it acts like a real mirror!
    tCtx.translate(tempCanvas.width, 0);
    tCtx.scale(-1, 1);
    
    // Draw the video frame onto the canvas
    tCtx.drawImage(cameraFeed, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Turn it into a picture data file
    const photoData = tempCanvas.toDataURL('image/jpeg', 0.8);
    
    // Add it to our game's gallery
    const newImgData = { id: 'custom_' + Date.now(), srcColored: photoData, srcBW: photoData };
    images.unshift(newImgData);
    
    const newEl = document.createElement('img');
    newEl.src = newImgData.srcColored; 
    newEl.className = 'thumb bubble-animate custom-photo';
    
    newEl.addEventListener('click', () => { 
        selectedImgData = newImgData; 
        if (bgMusic) bgMusic.pause();
        showPage('page-mode'); 
    });

    document.getElementById('image-gallery').insertBefore(newEl, document.getElementById('image-gallery').firstChild);
    
    // Close the camera
    closeCameraModal();
    if (sfxClick) sfxClick.play().catch(()=>{});
    
    // Instantly select the new selfie and jump to the game mode screen!
    selectedImgData = newImgData;
    showPage('page-mode');
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

// --- BRUSH TRACKER LOGIC ---
const brushPointer = document.getElementById('brush-pointer');

function updateBrushPointer(x, y) {
    if (!brushPointer) return;
    
    brushPointer.style.display = 'block';
    brushPointer.style.left = x + 'px';
    brushPointer.style.top = y + 'px';
    
    // Match the exact size of the tool
    let pointerSize = currentSize;
    pointerSize = pointerSize * currentZoom;
    
    brushPointer.style.width = pointerSize + 'px';
    brushPointer.style.height = pointerSize + 'px';
    
    // Match the color (and turn it white if they use the eraser!)
    if (currentTool === 'eraser') {
        brushPointer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        brushPointer.style.border = '2px solid black';
    } else {
        brushPointer.style.backgroundColor = currentColor;
        brushPointer.style.border = '2px solid white';
    }
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    if (currentTool === 'eraser') { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = currentSize; ctx.globalAlpha = 1.0; } 
    else if (currentTool === 'brush') { ctx.strokeStyle = currentColor; ctx.lineWidth = currentSize; ctx.globalAlpha = 1.0; } 
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

// --- TABLET TOUCH CONTROLS WITH LAST POSITION TRACKING ---
// --- TUTORIAL LOGIC ---
const tutorialSteps = [
    { title: "Welcome! ✏️", text: "In this mode, you can draw whatever you imagine on a blank canvas!" },
    { title: "Magic Shapes! ✨", text: "Draw a circle, triangle, or straight line, and <b>HOLD your finger still</b> at the end..." },
    { title: "POOF! 🎩", text: "The game will magically turn it into a PERFECT shape! You can even drag it to change the size before letting go. Give it a try!" }
];
let currentTutStep = 0;

window.showTutorial = function() {
    currentTutStep = 0;
    document.getElementById('tutorial-modal').classList.add('active');
    updateTutorialUI();
};
window.closeTutorial = function() { document.getElementById('tutorial-modal').classList.remove('active'); };
window.nextTutorialStep = function() {
    currentTutStep++;
    if (currentTutStep >= tutorialSteps.length) closeTutorial();
    else updateTutorialUI();
};
function updateTutorialUI() {
    document.getElementById('tut-title').textContent = tutorialSteps[currentTutStep].title;
    document.getElementById('tut-desc').innerHTML = tutorialSteps[currentTutStep].text;
    document.getElementById('btn-tut-next').textContent = currentTutStep === tutorialSteps.length - 1 ? "Let's Draw! 🎨" : "Next ➡️";
}

// Override startDrawing to trigger the tutorial!
const originalStartDrawing = window.startDrawing;
window.startDrawing = function(mode) {
    originalStartDrawing(mode);
    if (mode === 'blank') {
        showTutorial();
        document.getElementById('btn-help-tutorial').style.display = 'block';
    } else {
        document.getElementById('btn-help-tutorial').style.display = 'none';
    }
};

// --- MAGIC SHAPES (DRAW AND HOLD) LOGIC ---
let holdTimer = null;
let currentStrokePoints = [];
let snappedShape = null; // 'line', 'circle', 'triangle'
const stateCanvas = document.createElement('canvas'); // Secret canvas to hold background
const stateCtx = stateCanvas.getContext('2d');

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
}

function startHoldTimer() {
    if (currentTool === 'eraser') return; // Don't snap erasers!
    holdTimer = setTimeout(() => {
        if (isDrawing && !snappedShape && currentStrokePoints.length > 5) {
            snappedShape = detectShape(currentStrokePoints);
            if (snappedShape) { redrawSnappedShape(); if(sfxClick) sfxClick.play().catch(()=>{}); }
        }
    }, 600); // Wait 600 milliseconds of stillness to snap
}

function detectShape(points) {
    const p1 = points[0], p2 = points[points.length - 1];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    const diag = Math.hypot(maxX - minX, maxY - minY);
    if (diag < 30) return null; // Too small

    if (dist < diag * 0.4) {
        // Closed loop -> Is it round or pointy?
        const cx = minX + (maxX - minX)/2, cy = minY + (maxY - minY)/2;
        let totalRad = 0; points.forEach(p => totalRad += Math.hypot(p.x - cx, p.y - cy));
        const avgRad = totalRad / points.length;
        let variance = 0; points.forEach(p => variance += Math.abs(Math.hypot(p.x - cx, p.y - cy) - avgRad));
        // High variance = Triangle, Low variance = Circle
        return (variance / points.length < avgRad * 0.2) ? 'circle' : 'triangle';
    } else { return 'line'; }
}

function redrawSnappedShape() {
    // 1. Wipe current messy stroke, restore background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(stateCanvas, 0, 0);

    // 2. Draw perfect shape
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const p1 = currentStrokePoints[0];
    const p2 = currentStrokePoints[currentStrokePoints.length - 1];

    if (snappedShape === 'line') {
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    } else if (snappedShape === 'circle') {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        currentStrokePoints.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
        const cx = minX + (maxX - minX)/2, cy = minY + (maxY - minY)/2;
        ctx.arc(cx, cy, Math.hypot(p2.x - cx, p2.y - cy), 0, Math.PI * 2);
    } else if (snappedShape === 'triangle') {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        currentStrokePoints.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
        const cx = minX + (maxX - minX)/2, cy = minY + (maxY - minY)/2;
        const r = Math.hypot(p2.x - cx, p2.y - cy);
        for(let i=0; i<3; i++) {
            const angle = -Math.PI/2 + (i * 2 * Math.PI / 3);
            if(i===0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        }
        ctx.closePath();
    }
    ctx.stroke();
}

function handleStart(e, clientX, clientY) {
    saveState();
    stateCanvas.width = canvas.width; stateCanvas.height = canvas.height;
    stateCtx.clearRect(0,0, canvas.width, canvas.height);
    stateCtx.drawImage(canvas, 0, 0); // Save snapshot for shape snapping
    isDrawing = true;
    snappedShape = null;
    currentStrokePoints = [getMousePos(e)];
    startHoldTimer();
    draw(e);
}
function handleMove(e, clientX, clientY) {
    if (!isDrawing) return;
    if (snappedShape) {
        currentStrokePoints[currentStrokePoints.length - 1] = getMousePos(e); // Stretch shape!
        redrawSnappedShape();
    } else {
        currentStrokePoints.push(getMousePos(e));
        clearTimeout(holdTimer); startHoldTimer();
        draw(e);
    }
}

// --- ALL TOUCH/MOUSE EVENTS ---
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2 || e.shiftKey) { isPanning = true; startPanX = e.clientX; startPanY = e.clientY; initialPanX = panX; initialPanY = panY; } 
    else handleStart(e, e.clientX, e.clientY);
});
canvas.addEventListener('mousemove', (e) => {
    updateBrushPointer(e.clientX, e.clientY);
    if (isPanning) { panX = initialPanX + (e.clientX - startPanX); panY = initialPanY + (e.clientY - startPanY); updateZoomPan(); } 
    else handleMove(e, e.clientX, e.clientY);
});
canvas.addEventListener('mouseup', () => { 
    clearTimeout(holdTimer); 
    isDrawing = false; 
    isPanning = false; 
    snappedShape = null; 
    ctx.beginPath(); 
    
    // THE FIX: Hide the dot when they let go!
    if (brushPointer) brushPointer.style.display = 'none'; 
});

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { updateBrushPointer(e.touches[0].clientX, e.touches[0].clientY); handleStart(e, e.touches[0].clientX, e.touches[0].clientY); } 
    else if (e.touches.length === 2) { isPanning = true; isDrawing = false; startPanX = (e.touches[0].clientX + e.touches[1].clientX) / 2; startPanY = (e.touches[0].clientY + e.touches[1].clientY) / 2; initialPanX = panX; initialPanY = panY; e.preventDefault(); } 
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (isDrawing && e.touches.length === 1) { updateBrushPointer(e.touches[0].clientX, e.touches[0].clientY); handleMove(e, e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } 
    else if (isPanning && e.touches.length === 2) { panX = initialPanX + (((e.touches[0].clientX + e.touches[1].clientX) / 2) - startPanX); panY = initialPanY + (((e.touches[0].clientY + e.touches[1].clientY) / 2) - startPanY); updateZoomPan(); e.preventDefault(); } 
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    clearTimeout(holdTimer); 
    snappedShape = null;
    if (e.touches.length < 2) isPanning = false;
    
    if (e.touches.length === 0) { 
        isDrawing = false; 
        ctx.beginPath(); 
        
        // THE FIX: Hide the dot when they lift their finger!
        if (brushPointer) brushPointer.style.display = 'none'; 
    }
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
// --- 4 SIZES FOR ALL TOOLS ---
const sizesMap = { 
    'pencil': [2, 5, 15, 30], 
    'brush': [10, 20, 40, 60], 
    'eraser': [5, 15, 30, 60] 
};

window.openToolModal = function(toolName) {
    currentTool = toolName;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tool-${toolName}`).classList.add('active');
    updateCursor(); 
    
    // We removed the 'brush bypass' so the brush gets a size menu too!
    document.getElementById('modal-title').textContent = toolName.charAt(0).toUpperCase() + toolName.slice(1) + " Size";
    sizeOptions.innerHTML = '';
    
    // Updated to 4 labels!
    const labels = ['Extra Small', 'Small', 'Medium', 'Big'];
    const dataIds = ['tiny', 'small', 'medium', 'big'];
    
    sizesMap[toolName].forEach((size, index) => {
        const btn = document.createElement('button');
        btn.className = 'modal-size-btn bubble-animate';
        btn.setAttribute('data-size-id', dataIds[index]);
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

// --- SHARE & CONFETTI LOGIC ---
window.shareAndCelebrate = function() {
    // 1. Throw the Confetti!
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

    // 2. Open the Email Modal!
    document.getElementById('email-modal').classList.add('active');
};

// --- EMAIL SENDING SIMULATION ---
window.closeEmailModal = function() {
    document.getElementById('email-modal').classList.remove('active');
    document.getElementById('share-email-input').value = ''; // Clear the box for next time
};

window.sendEmail = function() {
    const emailInput = document.getElementById('share-email-input');
    const email = emailInput.value;
    const sendButton = document.querySelector('.email-send-btn');
    
    if(!email || !email.includes('@')) {
        alert("Please enter a valid email address!");
        return;
    }

    sendButton.textContent = "Sending... ⏳";
    sendButton.disabled = true;

    // --- THE FIX: SHRINKING THE IMAGE FOR EMAILJS ---
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    
    // We shrink the canvas down to 600 pixels wide so the file size is tiny!
    const scale = 600 / canvas.width;
    tempCanvas.width = 600;
    tempCanvas.height = canvas.height * scale;

    // Fill white background
    tCtx.fillStyle = '#FFFFFF';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the kid's paint scaled down
    tCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the template scaled down
    const template = document.getElementById('coloring-template');
    if (template.style.display !== 'none') {
        tCtx.globalCompositeOperation = 'multiply'; 
        tCtx.drawImage(template, 0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.globalCompositeOperation = 'source-over'; 
    }

    // Compress it heavily (0.4 quality instead of 0.8) to fit the free email limit!
    const finishedArtworkData = tempCanvas.toDataURL("image/jpeg", 0.4);
    // ------------------------------------------------------

    const templateParams = {
        to_email: email,
        image_data: finishedArtworkData
    };

    // Kept your real Service ID and Template ID!
    emailjs.send('service_6x5d4s9', 'template_30mx2yp', templateParams)
        .then(function(response) {
            alert(`Woohoo! Masterpiece successfully sent to ${email}!`);
            closeEmailModal();
            sendButton.textContent = "Send ✉️";
            sendButton.disabled = false;
        }, function(error) {
            console.log('FAILED...', error);
            alert("Oops! Something went wrong sending the email. Check the console.");
            sendButton.textContent = "Send ✉️";
            sendButton.disabled = false;
        });
};