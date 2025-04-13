const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const saveButton = document.getElementById('save-button');
const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');
const clearButton = document.getElementById('clear-button');
const paletteDropdown = document.getElementById('palette-dropdown');
const customColorButton = document.getElementById('custom-color-button');
const layersDropdown = document.getElementById('layers-dropdown');
const searchMenuButton = document.getElementById('search-menu-button');
const aiAssistantButton = document.getElementById('ai-assistant-button');
const helpButton = document.getElementById('help-button');

const defaultWidth = 800;
const defaultHeight = 600;
let currentWidth = defaultWidth;
let currentHeight = defaultHeight;
let backgroundImage = null;
let drawing = false;
let currentColor = '#000000';
let strokes = [];
let currentStroke = [];
let undoStack = [];
let redoStack = [];
let activeLayer = 'Top';
let layers = ['Top', 'Layer 4', 'Layer 3', 'Layer 2', 'Layer 1', 'Background'];
let layerVisibility = { 'Top': true, 'Layer 4': true, 'Layer 3': true, 'Layer 2': true, 'Layer 1': true, 'Background': true };

// Initial color palette
const initialPalette = [
    "#000000", "#808080", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080",
    "#C0C0C0", "#C00000", "#00C000", "#C0C000", "#0000C0", "#C000C0", "#00C0C0", "#FFFFFF"
];
let currentPalette = [...initialPalette];
let activePaletteColorIndex = 0; // Default to black
let paletteModified = false; // Flag to track if the palette has been modified

function initializeCanvas(options) {
    currentWidth = options?.width || defaultWidth;
    currentHeight = options?.height || defaultHeight;
    canvas.width = currentWidth;
    canvas.height = currentHeight;

    const imagePath = options?.backgroundImagePath;
    if (imagePath) {
        backgroundImage = new Image();
        backgroundImage.onload = () => {
            // Implement brightening logic here
            drawImageOnCanvas();
        };
        backgroundImage.src = imagePath;
    } else {
        ctx.fillStyle = 'rgb(224, 224, 224)';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
    }
}

function drawImageOnCanvas() {
    ctx.clearRect(0, 0, currentWidth, currentHeight);
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, currentWidth, currentHeight);
    } else {
        ctx.fillStyle = 'rgb(224, 224, 224)';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
    }
    // Redraw strokes based on layers and visibility
    drawStrokes();
}

function drawStrokes() {
    // Implement layer-based drawing here
    // Iterate through layers back to front, and draw visible strokes for each layer
    strokes.forEach(stroke => {
        // Check if stroke's layer is visible
        // Set stroke color and draw
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (stroke.points.length > 0) {
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        }
    });
}

function handleMouseDown(e) {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const timestamp = Date.now();

    // Check if the palette has been modified since the last stroke
    if (paletteModified) {
        strokes.push({ type: 'pallete', palette: [...currentPalette] });
        paletteModified = false; // Reset the flag
    }

    currentStroke = {
        layer: activeLayer,
        colorIndex: activePaletteColorIndex,
        points: [{ x, y, timestamp }]
    };
}

function handleMouseMove(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const timestamp = Date.now();
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    if (x !== lastPoint.x || y !== lastPoint.y) {
        currentStroke.points.push({ x, y, timestamp });
        ctx.strokeStyle = currentPalette[currentStroke.colorIndex];
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        drawImageOnCanvas(); // Move this line to the end of the if block
    }
}

function handleMouseUp() {
    if (!drawing) return;
    drawing = false;
    strokes.push(currentStroke);
    undoStack.push(currentStroke);
    redoStack = [];
    currentStroke = [];
    drawImageOnCanvas();
}

function saveDrawing() {
    const data = { palette: currentPalette, strokes: strokes };
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawing_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function undoDrawing() {
    if (undoStack.length > 0) {
        const lastStroke = undoStack.pop();
        redoStack.push(lastStroke);
        strokes = strokes.filter(stroke => stroke !== lastStroke);
        drawImageOnCanvas();
    }
}

function redoDrawing() {
    if (redoStack.length > 0) {
        const lastUndoneStroke = redoStack.pop();
        undoStack.push(lastUndoneStroke);
        strokes.push(lastUndoneStroke);
        drawImageOnCanvas();
    }
}

function clearDrawing() {
    strokes = [];
    undoStack = [];
    redoStack = [];
    drawImageOnCanvas();
}

function handlePaletteSelection(index) {
    activePaletteColorIndex = index;
    // Update visual indication of active color in the palette
    const paletteColors = document.querySelectorAll('.palette-color');
    paletteColors.forEach((colorDiv, i) => {
        colorDiv.classList.toggle('active', i === index);
    });
}

function handleCustomColor() {
    // Implement color picker logic here
    const color = prompt("Enter hex color code (e.g., #RRGGBB):");
    if (color) {
        currentPalette[activePaletteColorIndex] = color;
        paletteModified = true; // Set the flag when palette is modified
        // Update the displayed palette
        renderPalette();
    }
}

function handleLayerSelection(layer) {
    activeLayer = layer;
    // Update visual indication of active layer
    renderLayersDropdown();
}

function renderPalette() {
    paletteDropdown.innerHTML = '';
    currentPalette.forEach((color, index) => {
        const colorDiv = document.createElement('div');
        colorDiv.classList.add('palette-color');
        if (index === activePaletteColorIndex) {
            colorDiv.classList.add('active');
        }
        colorDiv.style.backgroundColor = color;
        colorDiv.addEventListener('click', () => handlePaletteSelection(index));
        paletteDropdown.appendChild(colorDiv);
    });
    const customButton = document.createElement('button');
    customButton.id = 'custom-color-button';
    customButton.textContent = 'Custom...';
    customButton.addEventListener('click', handleCustomColor);
    paletteDropdown.appendChild(customButton);
}

function renderLayersDropdown() {
    layersDropdown.innerHTML = '';
    layers.forEach(layer => {
        const layerItem = document.createElement('div');
        layerItem.classList.add('layer-item');
        const activeIndicator = document.createElement('span');
        activeIndicator.classList.add('layer-indicator');
        if (layer === activeLayer) {
            activeIndicator.classList.add('active');
        }
        const visibleIndicator = document.createElement('span');
        visibleIndicator.classList.add('layer-indicator', 'visible'); // Placeholder for visibility
        // Update visibility based on layerVisibility object

        const layerNameSpan = document.createElement('span');
        layerNameSpan.textContent = layer;
        layerItem.appendChild(activeIndicator);
        layerItem.appendChild(visibleIndicator);
        layerItem.appendChild(layerNameSpan);
        layerItem.addEventListener('click', () => handleLayerSelection(layer));
        layersDropdown.appendChild(layerItem);
    });
}

// Event listeners
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
saveButton.addEventListener('click', saveDrawing);
undoButton.addEventListener('click', undoDrawing);
redoButton.addEventListener('click', redoDrawing);
clearButton.addEventListener('click', clearDrawing);
searchMenuButton.addEventListener('click', () => alert('Search Menu clicked'));
aiAssistantButton.addEventListener('click', () => alert('AI Assistant clicked'));
helpButton.addEventListener('click', () => alert('Help clicked'));

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undoDrawing();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        redoDrawing();
    }
});

// Initialization
initializeCanvas({}); // You can pass options here if needed
renderPalette();
renderLayersDropdown();