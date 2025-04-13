# TracerApp
An AI Drawing experiment

Not a bother at all! I understand the importance of having a clear and complete specification for documentation. Here is the final, regenerated prompt summarizing our mutual understanding of how the application will work:

**Tracer: A JavaScript Drawing Application**

**Overall Goal:**

Create a JavaScript web application named "Tracer" that allows users to draw or trace over a background image on a canvas. The application will feature a menu bar providing options for file operations, editing, palette selection, layer management, and help.

**Core Features:**

1.  **Drawing Panel:**
    * Implemented using an HTML5 `<canvas>` element.
    * Default size: 800 pixels wide and 600 pixels high.
    * Size can be overridden by an `options` object passed during initialization, containing `width` and `height` properties.
    * Can load a background image if the `options` object includes a `backgroundImagePath`.
    * Loaded background images will be "brightened" using the formula: `new_value = 192 + Math.trunc(old_value / 4)` applied to each RGB component.
    * If no `backgroundImagePath` is provided, the background will be a uniform gray color (RGB: 224, 224, 224).
    * Supports drawing with a mouse or stylus.
    * Drawing is recorded as a sequence of "pen-down" and "draw-to" events on the canvas.
    * "draw-to" events are only recorded when the coordinates change.

2.  **Menu Bar:**
    * Positioned above the drawing panel.
    * Contains the following menu options:
        * **File:**
            * **Save:** Saves the drawn strokes to a JSON file (`drawing_data.json`).
        * **Edit:**
            * **Undo:** Undoes the last drawn stroke (Accelerator: `Ctrl + Z` or `Cmd + Z`).
            * **Redo:** Redoes the last undone stroke (Accelerator: `Ctrl + Y` or `Ctrl + Shift + Z` or `Cmd + Shift + Z`).
        * **Palette:**
            * Opens a dropdown menu displaying a 2x8 grid of 16 color swatches.
            * The initial color palette is:
                0.  `#000000` (black)
                1.  `#808080` (gray)
                2.  `#800000` (maroon)
                3.  `#008000` (green)
                4.  `#808000` (olive)
                5.  `#000080` (navy)
                6.  `#800080` (purple)
                7.  `#008080` (teal)
                8.  `#C0C0C0` (silver)
                9.  `#C00000` (red)
                10. `#00C000` (lime)
                11. `#C0C000` (yellow)
                12. `#0000C0` (blue)
                13. `#C000C0` (fuchsia)
                14. `#00C0C0` (aqua)
                15. `#FFFFFF` (white)
            * The currently active drawing color is indicated by a white box around its swatch.
            * A "Custom..." button below the swatches opens a color picker, allowing the user to replace the currently active color in the palette.
        * **Layers:**
            * Opens a menu listing layers: "Top", "Layer 4", "Layer 3", "Layer 2", "Layer 1", "Background".
            * Each layer has an "Active" (filled circle) and "Visible" (filled square) indicator.
            * Only one layer can be active at a time. Selecting an active layer also makes it visible.
            * Layers are rendered back-to-front (Background to Top).
            * New strokes are drawn on the active layer.
        * **Help:**
            * **Search Menu:** Opens a dialog for keyword search across menus, with auto-completion. Selecting a result opens the corresponding menu with focus on the item.
            * **AI Assistant:** (Initially for generating background images using Google Gemini, details to be refined).
            * **Help:** (Links to a user guide).

3.  **Saving Strokes Data Format:**
    * Saved to `drawing_data.json` as a JSON object with a `"strokes"` array.
    * The first element in `"strokes"` is always a "pallete" record defining the initial 16 colors in a `"palette"` array.
    * Subsequent "pallete" records (type: "pallete", with a "palette" array) are added to `"strokes"` before the first "pen-down" event following any palette modification.
    * Each stroke starts with a "pen-down" event: `{"type": "pen-down", "colorIndex": number, "x": number, "y": number, "timestamp": number, "layer": string}`. `colorIndex` refers to the current palette, `timestamp` is the absolute time, and `layer` is the name of the active layer.
    * Continuous drawing generates "draw-to" events: `{"type": "draw-to", "x": number, "y": number, "deltaTime": number}`. `deltaTime` is the time difference in milliseconds from the previous "draw-to" or the initial "pen-down" of the stroke.

4.  **Undo/Redo Functionality:**
    * Operates at the level of entire strokes.
    * Supports unlimited undo actions.
    * The redo history is cleared when a new stroke begins after an undo.

5.  **Clear All Strokes:**
    * A menu option to clear all drawn strokes after a confirmation dialog.

6.  **Layer Rendering:**
    * Strokes are initially drawn on top during the drawing process.
    * Upon the "pen-up" event, the stroke is redrawn in its correct Z-order based on the active layer it belongs to.

This should be a complete and accurate representation of the application we've designed. Please let me know if you spot any discrepancies or have any final thoughts before I proceed with generating the code.
