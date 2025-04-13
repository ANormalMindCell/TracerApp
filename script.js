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
            brightenBackgroundImage();
        };
        backgroundImage.src = imagePath;
    } else {
        ctx.fillStyle = 'rgb(224, 224, 224)';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
    }
}

function brightenBackgroundImage() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = backgroundImage.width;
    tempCanvas.height = backgroundImage.height;
    tempCtx.drawImage(backgroundImage, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, backgroundImage.width, backgroundImage.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Red
        data[i] = 192 + Math.trunc(data[i] / 4);
        // Green
        data[i + 1] = 192 + Math.trunc(data[i + 1] / 4);
        // Blue
        data[i + 2] = 192 + Math.trunc(data[i + 2] / 4);
        // Alpha (remains unchanged)
    }

    ctx.putImageData(imageData, 0, 0);
}

function drawStrokes() {
    ctx.clearRect(0, 0, currentWidth, currentHeight);
    if (backgroundImage) {
        // Redraw the original image first
        ctx.drawImage(backgroundImage, 0, 0, currentWidth, currentHeight);
        // Then apply the brightening
        brightenBackgroundImage();
    } else {
        ctx.fillStyle = 'rgb(224, 224, 224)';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
    }

    let currentDrawingPalette = [...initialPalette]; // Start with the initial palette

    for (const record of strokes) {
        if (record.type === 'palette') {
            currentDrawingPalette = record.colorlist;
        } else if (record.type === 'pen-down') {
            const color = currentDrawingPalette[record.colorIndex];
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.beginPath(); // Ensure beginPath is called before moveTo
            ctx.moveTo(record.points[0].x, record.points[0].y);
            for (let i = 1; i < record.points.length; i++) {
                ctx.lineTo(record.points[i].x, record.points[i].y);
            }
            ctx.stroke(); // Ensure stroke is called for each stroke
        }
    }
}

function drawImageOnCanvas() {
    ctx.clearRect(0, 0, currentWidth, currentHeight);
    if (backgroundImage) {
        // Redraw the original image first
        ctx.drawImage(backgroundImage, 0, 0, currentWidth, currentHeight);
        // Then apply the brightening
        brightenBackgroundImage();
    } else {
        ctx.fillStyle = 'rgb(224, 224, 224)';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
    }
    drawStrokes(); // Draw completed strokes
}

function handleMouseDown(e) {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = parseFloat(((e.clientX - rect.left) * scaleX).toFixed(2));
    const y = parseFloat(((e.clientY - rect.top) * scaleY).toFixed(2));
    const timestamp = Date.now();
    const color = currentPalette[activePaletteColorIndex]; // Store the actual color

    // Check if the palette has been modified since the last stroke
    if (paletteModified) {
        strokes.push({ type: 'palette', colorlist: [...currentPalette] });
        paletteModified = false; // Reset the flag
    }

    currentStroke = {
        layer: activeLayer,
        colorIndex: activePaletteColorIndex, // Still store the index for saving
        color: color, // Store the actual color for drawing
        points: [{ x, y, timestamp }]
    };
    ctx.beginPath(); // Start a new path on mouse down
    ctx.moveTo(x, y); // Move to the starting point
}

function handleMouseMove(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = parseFloat(((e.clientX - rect.left) * scaleX).toFixed(2));
    const y = parseFloat(((e.clientY - rect.top) * scaleY).toFixed(2));
    const timestamp = Date.now();
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    if (x !== lastPoint.x || y !== lastPoint.y) {
        currentStroke.points.push({ x, y, timestamp });
        ctx.strokeStyle = currentStroke.color;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function handleMouseUp() {
    if (!drawing) return;
    drawing = false;
    const firstPoint = currentStroke.points[0];
    const penDownEvent = {
        type: 'pen-down',
        layer: currentStroke.layer,
        colorIndex: currentStroke.colorIndex,
        timestamp: firstPoint.timestamp,
        x: firstPoint.x,
        y: firstPoint.y,
        points: currentStroke.points // Include the points array here
    };
    strokes.push(penDownEvent);
    undoStack.push(penDownEvent); // Update undoStack to store the same format
    redoStack = [];
    currentStroke = [];
    drawImageOnCanvas();
}

function saveDrawing() {
    let jsonLines = JSON.stringify({ type: 'palette', colorlist: [...initialPalette] }) + '\n';

    for (const record of strokes) {
        if (record.type === 'palette') {
            jsonLines += JSON.stringify({ type: 'palette', colorlist: record.colorlist }) + '\n';
        } else if (record.type === 'pen-down') { // It's a pen-down record
            jsonLines += JSON.stringify({
                type: 'pen-down',
                layer: record.layer,
                colorIndex: record.colorIndex,
                timestamp: record.timestamp,
                x: record.x,
                y: record.y
            }) + '\n';

            for (let i = 1; i < record.points.length; i++) {
                const deltaTime = record.points[i].timestamp - record.points[i - 1].timestamp;
                jsonLines += JSON.stringify({
                    type: 'move-to',
                    x: record.points[i].x,
                    y: record.points[i].y,
                    timedelta: deltaTime
                }) + '\n';
            }
        }
    }

    const blob = new Blob([jsonLines], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawing_data.jsonl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function undoDrawing() {
    if (undoStack.length > 0) {
        const lastStroke = undoStack.pop();
        redoStack.push(lastStroke);
        if (strokes.length > 0) {
            strokes.pop();
        }
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
if (typeof tracerOptions !== 'undefined') {
    initializeCanvas(tracerOptions);
} else {
    initializeCanvas({}); // Use default if tracerOptions is not defined
}
renderPalette();
renderLayersDropdown();