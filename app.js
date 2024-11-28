const pigments = [
    'White', 'Black', 'Cobalt Blue', 'Quinacridone Magenta',
    'Phthalo Blue (Green Shade)', 'Hansa Yellow', 'Phthalo Green',
    'Pyrrole Red', 'Ultramarine Blue', 'Dioxazine Purple', 'Pyrrole Orange'
];

// Pigments and other illuminant data, 10 nm intervals
let pigmentData = [];
// To draw the xy chromaticity diagram boundary, 1 nm intervals
let detailedCMFD65 = [];

// Load JSON data file
async function loadData() {
    pigmentData = await fetch('prepared_data_3i.json').then(res => res.json());
    detailedCMFD65 = await fetch('CMF_D65.json').then(res => res.json());

    // Extract color matching functions and illuminant data from the pigmentData
    x_bar = pigmentData.map(row => row.x_bar);
    y_bar = pigmentData.map(row => row.y_bar);
    z_bar = pigmentData.map(row => row.z_bar);

    delta_lambda = pigmentData[1].wavelength - pigmentData[0].wavelength;

    changeIlluminant();
}

async function changeIlluminant() {
    const illuminant = document.getElementById('illuminant-select').value;
    let illuminantData;

    if (illuminant === 'D65') {
        illuminantData = pigmentData.map(row => row.d65_power);
    } else if (illuminant === 'D50') {
        illuminantData = pigmentData.map(row => row.d50_power);
    } else if (illuminant === 'A') {
        illuminantData = pigmentData.map(row => row.a_power);
    }

    I = illuminantData;

    displayPigments();
}

// Display each pigment as a selectable color swatch
function displayPigments() {
    const container = document.getElementById('pigment-container');
    container.innerHTML = ''; // Clear previous content
    pigments.forEach(pigment => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('pigment-box');
        colorBox.style.width = '100px';
        colorBox.style.height = '100px';
        colorBox.style.display = 'inline-block';
        colorBox.style.margin = '5px';
        colorBox.style.border = '1px solid #000';
        colorBox.style.cursor = 'pointer';
        colorBox.style.position = 'relative';
        colorBox.dataset.pigment = pigment;

        // Calculate the pigment color and related values
        const xyz = calculateColor(pigment);
        const rgb = xyz_to_rgb(xyz);

        // Apply the background color
        colorBox.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

        // Create a label for the pigment name
        const label = document.createElement('div');
        label.textContent = pigment;
        label.style.position = 'absolute';
        label.style.bottom = '40px'; // Adjusted to make room for XYZ and RGB values
        label.style.width = '100%';
        label.style.textAlign = 'center';
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';

        //change font
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontSize = '14px';

        // Create a label for the XYZ values
        const xyzLabel = document.createElement('div');
        xyzLabel.textContent = `XYZ: (${xyz[0].toFixed(2)}, ${xyz[1].toFixed(2)}, ${xyz[2].toFixed(2)})`;
        xyzLabel.style.position = 'absolute';
        xyzLabel.style.bottom = '20px';
        xyzLabel.style.width = '100%';
        xyzLabel.style.textAlign = 'center';
        xyzLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        xyzLabel.style.fontSize = '10px';

        // Create a label for the RGB values
        const rgbLabel = document.createElement('div');
        rgbLabel.textContent = `RGB: (${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        rgbLabel.style.position = 'absolute';
        rgbLabel.style.bottom = '0';
        rgbLabel.style.width = '100%';
        rgbLabel.style.textAlign = 'center';
        rgbLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        rgbLabel.style.fontSize = '10px';

        // Append labels to the color box
        colorBox.appendChild(label);
        colorBox.appendChild(xyzLabel);
        colorBox.appendChild(rgbLabel);

        // Add click event for pigment selection
        colorBox.addEventListener('click', () => togglePigmentSelection(colorBox));

        // Append the color box to the container
        container.appendChild(colorBox);
    });
}

// Toggle selection state for a pigment and manage individual ratio input fields
function togglePigmentSelection(element) {
    element.classList.toggle('selected');

    if (element.classList.contains('selected')) {
        element.style.border = '3px solid #ff0000';
    } else {
        element.style.border = '1px solid #000';
    }

    // Get all selected pigments and clear the container
    const selectedElements = document.querySelectorAll('.pigment-box.selected');
    const selectedPigmentsContainer = document.getElementById('selected-pigments');
    selectedPigmentsContainer.innerHTML = '<h3>Selected Pigments and Ratios</h3>';

    // Iterate through all selected pigments and recreate the ratio fields in the correct order
    selectedElements.forEach(selectedElement => {
        const selectedPigmentName = selectedElement.dataset.pigment;
        const ratioField = document.createElement('div');
        ratioField.id = `ratio-${selectedPigmentName}`;
        ratioField.innerHTML = `
            <label>${selectedPigmentName} Ratio:</label>
            <input type="number" class="pigment-ratio" data-pigment="${selectedPigmentName}" min="0" value="1" style="width: 50px; margin-left: 5px; margin-top: 4px;" placeholder="0">
        `;
        selectedPigmentsContainer.appendChild(ratioField);
    });

    // update the fraction and dot size input fields based on the number of selected pigments
    if (selectedElements.length == 1) {
        updateGamutContainers(null, null, null);
    } else if (selectedElements.length == 2) {
        updateGamutContainers(16, 2, null);
    } else if (selectedElements.length == 3) {
        updateGamutContainers(35, 2, 8);
    } else if (selectedElements.length == 4) {
        updateGamutContainers(18, 2, null);
    } else if (selectedElements.length < 8) {
        updateGamutContainers(13, 1, null);
    } else {
        updateGamutContainers(8, 1, null);
    }
}

function updateGamutContainers(fractionValue, dotSizeXYValue, dotSizeTValue) {
    const fractionContainer = document.getElementById('fraction-input-div');
    const dotsizeXYContainer = document.getElementById('dotsize-xychromaticity-input-div');
    const dotsizeTContainer = document.getElementById('dotsize-triangle-input-div');

    if (fractionValue !== null) {
        fractionContainer.innerHTML = `
            <label for="fraction-input">Fraction/Density:</label>
            <input type="number" id="fraction-input" value="${fractionValue}">
        `;
    } else {
        fractionContainer.innerHTML = '';
    }

    if (dotSizeTValue !== null) {
        dotsizeTContainer.innerHTML = `
            <label for="dotsize-t-input">- <br> Dot Size for Ternary Plot:</label>
            <input type="number" id="dotsize-t-input" value="${dotSizeTValue}">
            <br>
            <text>Hover/Click the points on Ternary Plot to show ratios.</text>
        `;
    } else {
        dotsizeTContainer.innerHTML = '';
    }

    if (dotSizeXYValue !== null) {
        // the toggle-coordinates for change coordinate color  
        dotsizeXYContainer.innerHTML = `
        <div>
            <label for="dotsize-xychromaticity-input">Dot Size for XY Chromaticity Diagram:</label>
            <input type="number" id="dotsize-xychromaticity-input" value="${dotSizeXYValue}">
            <br>
            <label for="toggle-gamut-boundary">Colorful Gamut Boundary:</label>
            <input type="checkbox" id="toggle-gamut-boundary">
            <text>(Reclick Calculate to apply.)</text>
            <br>
            <text style="display: block; margin-top: 3px;">Hover/Click the points on XY Chromaticity Diagram to show coordinates.</text>
        </div>
        `;
    } else {
        dotsizeXYContainer.innerHTML = '';
    }
}

// Compute pigment mixture/single pigment XYZ values giveh pigment name(s)
function calculateColor(pigments, ratios = [1]) {
    // Mapping of pigment names to column names in the pigment data
    const pigment_mapping = {
        'White': 'white',
        'Black': 'black',
        'Cobalt Blue': 'cobalt b',
        'Quinacridone Magenta': 'quinacridone Magenta',
        'Phthalo Blue (Green Shade)': 'phthalo blue (green shade)',
        'Hansa Yellow': 'hansa Yellow',
        'Phthalo Green': 'phthalo Green',
        'Pyrrole Red': 'pyrrole Red',
        'Ultramarine Blue': 'ultramarine Blue',
        'Dioxazine Purple': 'dioxazine Purple',
        'Pyrrole Orange': 'pyrrole Orange'
    };
    // Check if pigments is a single string (single pigment) or an array (multiple pigments)
    if (typeof pigments === 'string') {
        pigments = [pigments]; // Convert to array for uniform processing
    }

    // Initialize variables to hold the weighted sum of K and S values
    let weightedK = Array(pigmentData.length).fill(0);
    let weightedS = Array(pigmentData.length).fill(0);
    let totalRatio = ratios.reduce((sum, r) => sum + r, 0);

    // Loop through each pigment and add its weighted K and S values
    pigments.forEach((pigmentName, index) => {
        const pigmentKey = pigment_mapping[pigmentName];
        const k_col = `k ${pigmentKey}`;
        const s_col = `s ${pigmentKey}`;
        
        // Retrieve K and S values for the current pigment
        const K = pigmentData.map(row => row[k_col]);
        const S = pigmentData.map(row => row[s_col]);
        const ratio = ratios[index] / totalRatio;  // Normalize the ratio

        // Add the weighted K and S values to the total
        K.forEach((k, i) => {
            weightedK[i] += k * ratio;
            weightedS[i] += S[i] * ratio;
        });
    });

    // Calculate R_inf based on the weighted K and S values
    const ks_ratio = weightedK.map((k, i) => k / weightedS[i]);
    const R_inf = ks_ratio
    .map(ks => 1 + ks - Math.sqrt(ks * (ks + 2)))
    .map(r => clip(r, 0, 1));

    // Calculate XYZ tristimulus values
    const X_num = R_inf.reduce((acc, R, i) => acc + R * I[i] * x_bar[i], 0) * delta_lambda;
    const Y_num = R_inf.reduce((acc, R, i) => acc + R * I[i] * y_bar[i], 0) * delta_lambda;
    const Z_num = R_inf.reduce((acc, R, i) => acc + R * I[i] * z_bar[i], 0) * delta_lambda;
    const Y_norm = I.reduce((acc, I, i) => acc + I * y_bar[i], 0) * delta_lambda;

    const X = X_num / Y_norm;
    const Y = Y_num / Y_norm;
    const Z = Z_num / Y_norm;
    XYZ = [X, Y, Z];

    return XYZ;
}

function gammaCorrect(c) {
    if (c <= 0) {
        return 0;
    } else if (c <= 0.0031308) {
        return 12.92 * c;
    } else if (c < 1) {
        return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    } else {
        return 1;
    }
}

// Mix colors based on selected pigments and given ratios
function mixColors() {
    const selectedElements = document.querySelectorAll('.pigment-box.selected');
    const selectedPigments = Array.from(selectedElements).map(el => el.dataset.pigment);
    
    if (selectedPigments.length < 2) {
        alert("Please select (click) at least two pigments to mix.");
        return;
    }

    const ratioFields = document.querySelectorAll('.pigment-ratio');
    const ratios = Array.from(ratioFields).map(input => Number(input.value));

    // RGB Light Mixing
    // should be no different from the XYZ mixing mathematically
    let mixedXYZ = [0, 0, 0];
    let totalRatio = ratios.reduce((sum, r) => sum + r, 0);
    selectedPigments.forEach((pigment, index) => {
        const xyz = calculateColor(pigment);
        mixedXYZ[0] += xyz[0] * (ratios[index] / totalRatio);
        mixedXYZ[1] += xyz[1] * (ratios[index] / totalRatio);
        mixedXYZ[2] += xyz[2] * (ratios[index] / totalRatio);
    });
    mixedRGB = xyz_to_rgb(mixedXYZ);
    displayMixedColor(mixedRGB);

    displayMixedColorKM(xyz_to_rgb(calculateColor(selectedPigments, ratios)));
}

function calculateGamut() {
    const stepsInput = document.getElementById('fraction-input');
    const dotsizeTInput = document.getElementById('dotsize-t-input');
    const dotsizeXYInput = document.getElementById('dotsize-xychromaticity-input');
    // const toggleCoordinates = document.getElementById('toggle-coordinates');

    const selectedElements = document.querySelectorAll('.pigment-box.selected');
    const selectedPigments = Array.from(selectedElements).map(el => el.dataset.pigment);

    if (selectedPigments.length < 2) {
        alert("Please select at least two pigments to calculate the gamut.");
        return;
    }

    const steps = parseInt(stepsInput.value);
    const dotsizeT = dotsizeTInput ? parseInt(dotsizeTInput.value) : 0;
    const dotsizeXY = parseInt(dotsizeXYInput.value);
    // const whiteCoordinates = toggleCoordinates ? toggleCoordinates.checked : false;
    whiteCoordinates = false;

    const ratioCombinations = generateRatioCombinations(selectedPigments.length, steps);

    const bundle = ratioCombinations.map(ratios => ({
        xyz: calculateColor(selectedPigments, ratios),
        ratios: ratios
    }));

    displayGamut(bundle, selectedPigments, dotsizeT, dotsizeXY, whiteCoordinates);
}

// Function to generate all combinations of ratios that sum to 1
function generateRatioCombinations(n, steps) {
    const combinations = [];

    function recurse(current, remainingSteps, depth) {
        if (depth === n - 1) {
            // Last pigment gets the remaining fraction
            current.push(remainingSteps / steps);
            combinations.push([...current]);
            current.pop();
        } else {
            for (let i = 0; i <= remainingSteps; i++) {
                current.push(i / steps);
                recurse(current, remainingSteps - i, depth + 1);
                current.pop();
            }
        }
    }

    recurse([], steps, 0);

    return combinations;
}

// Mapping functions from x, y to canvas coordinates
function xToCanvasX(x, xMin, xMax, drawableWidth, padding) {
    return padding + ((x - xMin) / (xMax - xMin)) * drawableWidth;
}

function yToCanvasY(y, yMin, yMax, drawableHeight, padding) {
    return padding + ((yMax - y) / (yMax - yMin)) * drawableHeight;
}

// Function to plot the chromaticity diagram boundary with padding
function plotChromaticityDiagramBoundary(ctx, xMin, xMax, yMin, yMax, padding) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const drawableWidth = canvasWidth - 2 * padding;
    const drawableHeight = canvasHeight - 2 * padding;

    // Draw x and y axes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    // Draw x-axis
    const xAxisY = yToCanvasY(0, yMin, yMax, drawableHeight, padding);
    ctx.beginPath();
    ctx.moveTo(padding, xAxisY);
    ctx.lineTo(canvasWidth - padding, xAxisY);
    ctx.stroke();

    // Draw y-axis
    const yAxisX = xToCanvasX(0, xMin, xMax, drawableWidth, padding);
    ctx.beginPath();
    ctx.moveTo(yAxisX, padding);
    ctx.lineTo(yAxisX, canvasHeight - padding);
    ctx.stroke();

    // Add tick marks and labels on x-axis
    for (let x = xMin; x <= xMax; x += 0.1) {
        const canvasX = xToCanvasX(x, xMin, xMax, drawableWidth, padding);
        ctx.beginPath();
        ctx.moveTo(canvasX, xAxisY - 5);
        ctx.lineTo(canvasX, xAxisY + 5);
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText(x.toFixed(1), canvasX - 10, xAxisY + 15);
    }

    // Add tick marks and labels on y-axis
    for (let y = yMin; y <= yMax; y += 0.1) {
        const canvasY = yToCanvasY(y, yMin, yMax, drawableHeight, padding);
        ctx.beginPath();
        ctx.moveTo(yAxisX - 5, canvasY);
        ctx.lineTo(yAxisX + 5, canvasY);
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText(y.toFixed(1), yAxisX - 25, canvasY + 5);
    }

    // Draw the boundary of the CIE 1931 chromaticity diagram
    const wavelengths = [];
    for (let wl = 380; wl <= 730; wl += 1) {
        wavelengths.push(wl);
    }

    const boundaryXY = [];

    for (let wl of wavelengths) {
        const XYZ = getXYZFromWavelength(wl);
        const [x, y] = xyz_to_xy(XYZ);
        boundaryXY.push([x, y]);
    }

    // Begin drawing the boundary path
    ctx.beginPath();
    for (let i = 0; i < boundaryXY.length; i++) {
        const [x, y] = boundaryXY[i];
        const canvasX = xToCanvasX(x, xMin, xMax, drawableWidth, padding);
        const canvasY = yToCanvasY(y, yMin, yMax, drawableHeight, padding);

        if (i === 0) {
            ctx.moveTo(canvasX, canvasY);
        } else {
            ctx.lineTo(canvasX, canvasY);
        }
    }
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Now, add the wavelength labels and marks
    for (let i = 0; i < boundaryXY.length; i++) {
        const wl = wavelengths[i];
        if (wl % 20 === 0 && wl >= 460 && wl <= 620) {
            const [x, y] = boundaryXY[i];
            const canvasX = xToCanvasX(x, xMin, xMax, drawableWidth, padding);
            const canvasY = yToCanvasY(y, yMin, yMax, drawableHeight, padding);

            // Draw a mark on the curve at this point
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();

            // Add wavelength label
            ctx.fillStyle = 'blue';
            ctx.font = '10px Arial';
            ctx.fillText(wl, canvasX + 5, canvasY - 5);
        }
    }
}

// Helper function for `plotChromaticityDiagramBoundary`
// Function to get XYZ from a specific wavelength
function getXYZFromWavelength(wl) {
    const index = detailedCMFD65.findIndex(d => d.wavelength >= wl);
    if (index === -1) {
        return [0, 0, 0];
    }
    const entry = detailedCMFD65[index];

    const xBar = entry.x_bar;
    const yBar = entry.y_bar;
    const zBar = entry.z_bar;
    const I = entry.power; // Illuminant

    const X = I * xBar;
    const Y = I * yBar;
    const Z = I * zBar;

    return [X, Y, Z];
}

function displayGamut(bundle, selectedPigments, dotsizeT, dotsizeXY, whiteCoordinates) {
    const gamutContainer = document.getElementById('gamut-container');
    gamutContainer.innerHTML = ''; // Clear previous content

    if (selectedPigments.length == 2) {
        // Existing code for two pigments
        bundle.forEach((obj, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.style.width = '40px';
            colorDiv.style.height = '40px';
            colorDiv.style.margin = '1px auto';
            const [r, g, b] = xyz_to_rgb(obj.xyz);
            colorDiv.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        
            const ratioDiv = document.createElement('div');
            ratioDiv.style.fontSize = '16px';
            ratioDiv.style.textAlign = 'center';
            ratioDiv.innerHTML = obj.ratios.map(r => `<div>${r.toFixed(2)}</div>`).join('');
        
            const containerDiv = document.createElement('div');
            containerDiv.style.flex = '1 0 auto'; // Allow items to grow and shrink
            containerDiv.style.boxSizing = 'border-box';
            containerDiv.style.margin = '5px';
            containerDiv.style.display = 'flex';
            containerDiv.style.flexDirection = 'column';
            containerDiv.style.alignItems = 'center';
            containerDiv.appendChild(colorDiv);
            containerDiv.appendChild(ratioDiv);
        
            // Display first six and last six items, hide others
            if (index >= 6 && index < bundle.length - 6) {
                containerDiv.style.display = 'none';
                containerDiv.classList.add('extra-item');
            }
        
            gamutContainer.appendChild(containerDiv);
        });
        
        // Add "..." and a button to toggle the visibility of extra items if there are more than 12 items
        if (bundle.length > 12) {
            const ellipsisDiv = document.createElement('div');
            ellipsisDiv.innerText = '..................';
            ellipsisDiv.style.fontSize = '16px';
            ellipsisDiv.style.textAlign = 'center';
            gamutContainer.insertBefore(ellipsisDiv, gamutContainer.children[6]);

            const toggleButton = document.createElement('button');
            toggleButton.style.maxHeight = '40px';
            toggleButton.innerText = 'Expand';
            toggleButton.style.margin = '10px auto';
            toggleButton.style.display = 'block';
            toggleButton.addEventListener('click', () => {
                const extraItems = document.querySelectorAll('.extra-item');
                const isExpanded = toggleButton.innerText === 'Collapse';
                extraItems.forEach(item => {
                    item.style.display = isExpanded ? 'none' : 'flex';
                });
                ellipsisDiv.style.display = isExpanded ? 'block' : 'none';
                toggleButton.innerText = isExpanded ? 'Expand' : 'Collapse';
            });
            gamutContainer.appendChild(toggleButton);
        }
    } else if (selectedPigments.length == 3) {
        // Create a canvas for the ternary plot
        const canvas = document.createElement('canvas');
        const canvasWidth = 500;
        const canvasHeight = Math.floor(canvasWidth * Math.sqrt(3) / 2);
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        // Draw the ternary plot background (triangle)
        drawTernaryBackground(ctx, canvasWidth, canvasHeight, selectedPigments);

        const points = [];

        // Build the points array
        bundle.forEach(obj => {
            const [r, g, b] = xyz_to_rgb(obj.xyz);
            const ratios = obj.ratios;

            // Convert ternary ratios to Cartesian coordinates
            const [x, y] = ternaryToCartesian(ratios, canvasWidth, canvasHeight);

            points.push({
                x: x,
                y: canvasHeight - y, // because we inverted y-axis in plotting
                ratios: ratios,
                r: r,
                g: g,
                b: b,
            });
        });

        // Function to draw the canvas
        function drawCanvas(hoveredPoint, clickedPoint) {
            // Clear the canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Draw the ternary plot background (triangle)
            drawTernaryBackground(ctx, canvasWidth, canvasHeight, selectedPigments);

            // Draw each color point
            points.forEach(point => {
                ctx.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, dotsizeT, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Draw proportions for hovered and clicked points
            [hoveredPoint, clickedPoint].forEach((point) => {
                if (point) {
                    ctx.fillStyle = 'black';
                    ctx.font = '12px Arial';
                    const ratiosText = point.ratios.map(r => r.toFixed(2)).join(', ');
                    ctx.fillText(
                        `(${ratiosText})`,
                        point.x + 5,
                        point.y - 5
                    );
                }
            });
        }

        // Initialize
        drawCanvas(null, null);

        // Add event listeners
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleClick);

        function handleMouseMove(event) {
            const mousePos = getMousePos(canvas, event);
            let hoveredPoint = null;

            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                const dx = mousePos.x - point.x;
                const dy = mousePos.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= dotsizeT * 2) {
                    hoveredPoint = point;
                    break;
                }
            }

            // Redraw the canvas with the hovered point
            drawCanvas(hoveredPoint, clickedPoint);
        }

        let clickedPoint = null;

        function handleClick(event) {
            const mousePos = getMousePos(canvas, event);
            clickedPoint = null;

            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                const dx = mousePos.x - point.x;
                const dy = mousePos.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= dotsizeT * 2) {
                    clickedPoint = point;
                    break;
                }
            }

            // Redraw the canvas with the clicked point
            drawCanvas(null, clickedPoint);
        }

        function getMousePos(canvas, evt) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (evt.clientX - rect.left) * (canvas.width / rect.width),
                y: (evt.clientY - rect.top) * (canvas.height / rect.height),
            };
        }

        // Create a container for the ternary plot and its label
        const ternaryContainer = document.createElement('div');
        ternaryContainer.style.display = 'inline-block'; // or 'block' if you prefer
        ternaryContainer.style.textAlign = 'center';
        ternaryContainer.style.margin = '10px';
        // Append the ternary plot canvas to the container
        ternaryContainer.appendChild(canvas);
        // Add a label for the ternary plot
        const ternaryLabel = document.createElement('div');
        ternaryLabel.textContent = 'Ternary Plot (by Ratios)';
        ternaryLabel.style.marginTop = '10px';
        ternaryContainer.appendChild(ternaryLabel);
        // Append the ternary container to the gamut container
        gamutContainer.appendChild(ternaryContainer);
    } else if (selectedPigments.length >= 4) {}

    // Display the XY chromaticity diagram
    const xyContainer = document.createElement('div');
    xyContainer.style.display = 'inline-block'; // or 'block' if you prefer
    xyContainer.style.textAlign = 'center';
    xyContainer.style.margin = '10px';
    // Display the XY chromaticity diagram and append it to the xyContainer
    const xyCanvas = generateGamutXYChromacity(bundle.map(obj => obj.xyz), dotsizeXY, whiteCoordinates);
    xyContainer.appendChild(xyCanvas);
    // Add a label for the XY chromaticity diagram
    const xyLabel = document.createElement('div');
    xyLabel.textContent = 'CIE 1931 XY Chromaticity Diagram (X, Y)';
    xyLabel.style.marginTop = '10px';
    xyContainer.appendChild(xyLabel);
    // Append the xy container to the gamut container
    gamutContainer.appendChild(xyContainer);
}

// XY Chromaticity Diagram
// white coordinates is for the coordinate text color
function displayInXYChromacity(ctx, offscreenCanvas, colors, xMin, xMax, yMin, yMax, dotsize, padding, whiteCoordinates) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const drawableWidth = canvasWidth - 2 * padding;
    const drawableHeight = canvasHeight - 2 * padding;

    const points = [];

    function drawCanvas(hoveredPoint, clickedPoint) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the off-screen canvas onto the main canvas
        ctx.drawImage(offscreenCanvas, 0, 0);

        // Draw each color point on the chromaticity diagram
        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            // Draw the point
            ctx.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b})`;
            ctx.beginPath();
            ctx.arc(point.canvasX, point.canvasY, dotsize, 0, 2 * Math.PI);
            ctx.fill();
        }

        [hoveredPoint, clickedPoint].forEach((point) => {
            if (point) {
                if (whiteCoordinates) {
                    ctx.fillStyle = 'white';
                } else {
                    ctx.fillStyle = 'black';
                }
                ctx.font = '12px Arial';
                ctx.fillText(
                    `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
                    point.canvasX + 5,
                    point.canvasY - 5
                );
            }
        });
    }

    // Initialize the points array
    function init() {
        for (let i = 0; i < colors.length; i++) {
            const [x, y] = xyz_to_xy(colors[i]);
            const [r, g, b] = xyz_to_rgb(colors[i]);

            // Convert x, y to canvas coordinates
            const canvasX = xToCanvasX(x, xMin, xMax, drawableWidth, padding);
            const canvasY = yToCanvasY(y, yMin, yMax, drawableHeight, padding);

            points.push({
                canvasX: canvasX,
                canvasY: canvasY,
                x: x,
                y: y,
                r: r,
                g: g,
                b: b,
            });
        }

        // Initial draw
        drawCanvas(null, null);

        // Add event listeners
        ctx.canvas.addEventListener('mousemove', handleMouseMove);
        ctx.canvas.addEventListener('click', handleClick);
    }

    function handleMouseMove(event) {
        const mousePos = getMousePos(ctx.canvas, event);
        let hoveredPoint = null;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const dx = mousePos.x - point.canvasX;
            const dy = mousePos.y - point.canvasY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= dotsize * 2) {  // Adjust the threshold as needed
                hoveredPoint = point;
                break;
            }
        }

        // Redraw the canvas with the hovered point
        drawCanvas(hoveredPoint, clickedPoint);
    }

    let clickedPoint = null;

    function handleClick(event) {
        const mousePos = getMousePos(ctx.canvas, event);
        clickedPoint = null;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const dx = mousePos.x - point.canvasX;
            const dy = mousePos.y - point.canvasY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= dotsize * 2) {
                clickedPoint = point;
                break;
            }
        }

        // Redraw the canvas with the clicked point
        drawCanvas(null, clickedPoint);
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (canvas.height / rect.height),
        };
    }

    init();
}

function generateGamutBoundary(offscreenCtx, xMin, xMax, yMin, yMax, dotsize, padding) {
    const selectedElements = document.querySelectorAll('.pigment-box.selected');
    const selectedPigments = Array.from(selectedElements).map(el => el.dataset.pigment);

    const colorfulToggle = document.getElementById('toggle-gamut-boundary').checked;

    const ratioCombinations = generateRatioCombinations(2, 1600);
    const bundle = [];

    for (let i = 0; i < selectedPigments.length; i++) {
        for (let j = i + 1; j < selectedPigments.length; j++) {
            const pigmentPair = [selectedPigments[i], selectedPigments[j]];
            const pairBundle = [];
            ratioCombinations.forEach(ratios => {
                pairBundle.push({
                    xyz: calculateColor(pigmentPair, ratios),
                    ratios: ratios
                });
            });
            bundle.push({
                pairBundle: pairBundle,
                pigments: pigmentPair
            });
        }
    }

    const canvasWidth = offscreenCtx.canvas.width;
    const canvasHeight = offscreenCtx.canvas.height;

    const drawableWidth = canvasWidth - 2 * padding;
    const drawableHeight = canvasHeight - 2 * padding;

    let points = [];
    const pointsByPair = [];

    // Initialize the points array
    function init() {
        for (let b = 0; b < bundle.length; b++) {
            const pairBundle = bundle[b].pairBundle;
            const pigments = bundle[b].pigments;
            const pairPoints = [];
            for (let i = 0; i < pairBundle.length; i++) {
                const colorXYZ = pairBundle[i].xyz;
                const [x, y] = xyz_to_xy(colorXYZ);
                const [r, g, b] = xyz_to_rgb(colorXYZ);

                // Convert x, y to canvas coordinates
                const canvasX = xToCanvasX(x, xMin, xMax, drawableWidth, padding);
                const canvasY = yToCanvasY(y, yMin, yMax, drawableHeight, padding);

                pairPoints.push({
                    canvasX: canvasX,
                    canvasY: canvasY,
                    x: x,
                    y: y,
                    r: r,
                    g: g,
                    b: b,
                    pigments: pigments,
                    ratio: pairBundle[i].ratios[0] // Ratio of the first pigment
                });
            }
            pointsByPair.push(pairPoints);
        }
        // Flatten pointsByPair to a single array for drawing points
        points = [].concat(...pointsByPair);
        // Initial draw
        drawCanvas(pointsByPair);
    }

    function drawCanvas(pointsByPair) {
        if (colorfulToggle) {
            // Draw each color point on the chromaticity diagram
            for (let i = 0; i < points.length; i++) {
                const point = points[i];

                // Draw the point
                offscreenCtx.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b})`;
                offscreenCtx.beginPath();
                offscreenCtx.arc(point.canvasX, point.canvasY, dotsize, 0, 2 * Math.PI);
                offscreenCtx.fill();
            }
        } else {
            // Connect points generated by the same pigmentPair
            offscreenCtx.strokeStyle = 'black';
            offscreenCtx.lineWidth = 1;
            for (let i = 0; i < pointsByPair.length; i++) {
                const pairPoints = pointsByPair[i];
                // Sort
                // pairPoints.sort((a, b) => a.ratio - b.ratio);
                offscreenCtx.beginPath();
                offscreenCtx.moveTo(pairPoints[0].canvasX, pairPoints[0].canvasY);
                for (let j = 1; j < pairPoints.length; j++) {
                    offscreenCtx.lineTo(pairPoints[j].canvasX, pairPoints[j].canvasY);
                }
                offscreenCtx.stroke();
            }
        }
    }

    init();
}


// XY Chromaticity Diagram
function generateGamutXYChromacity(xyzlist, dotsize, whiteCoordinates) {
    const canvas = document.createElement('canvas');
    const canvasWidth = 500;
    const canvasHeight = 500;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // Set background color to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Define the coordinate mapping
    const xMin = 0;
    const xMax = 0.8;
    const yMin = 0;
    const yMax = 0.9;
    const padding = 34;

    // **Create an off-screen canvas**
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // **Draw static elements onto the off-screen canvas**
    // Set background color
    offscreenCtx.fillStyle = 'white';
    offscreenCtx.fillRect(0, 0, canvasWidth, canvasHeight);

    plotChromaticityDiagramBoundary(offscreenCtx, xMin, xMax, yMin, yMax, padding);

    generateGamutBoundary(offscreenCtx, xMin, xMax, yMin, yMax, 0.1, padding);

    // **Now call the modified display function with off-screen canvas**
    displayInXYChromacity(ctx, offscreenCanvas, xyzlist, xMin, xMax, yMin, yMax, dotsize, padding, whiteCoordinates);

    return canvas;
}

// helper function for Ternary Plot
function ternaryToCartesian(ratios, canvasWidth, canvasHeight, padding = 34) {
    const [a, b, c] = ratios;
    const sum = a + b + c || 1; // Prevent division by zero
    const x = (0.5 * (2 * b + c)) / sum;
    const y = (Math.sqrt(3) / 2) * c / sum;

    // Scale to canvas size with padding
    const effectiveWidth = canvasWidth - 2 * padding;
    const effectiveHeight = canvasHeight - 2 * padding;

    const scaledX = padding + x * effectiveWidth;
    const scaledY = padding + y * effectiveHeight / (Math.sqrt(3) / 2);

    return [scaledX, scaledY];
}
function drawTernaryBackground(ctx, canvasWidth, canvasHeight, pigmentNames) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // Label positions
    const fontSize = 14;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#000';

    // Left corner (Pigment A)
    const colorA = xyz_to_rgb(calculateColor(pigmentNames[0]));
    ctx.fillStyle = `rgb(${colorA[0]}, ${colorA[1]}, ${colorA[2]})`;
    ctx.fillText(pigmentNames[0], 0, canvasHeight);

    // Right corner (Pigment B)
    const colorB = xyz_to_rgb(calculateColor(pigmentNames[1]));
    ctx.fillStyle = `rgb(${colorB[0]}, ${colorB[1]}, ${colorB[2]})`;
    const textWidthB = ctx.measureText(pigmentNames[1]).width;
    ctx.fillText(pigmentNames[1], canvasWidth - textWidthB, canvasHeight);

    // Top corner (Pigment C)
    const colorC = xyz_to_rgb(calculateColor(pigmentNames[2]));
    ctx.fillStyle = `rgb(${colorC[0]}, ${colorC[1]}, ${colorC[2]})`;
    const textWidthC = ctx.measureText(pigmentNames[2]).width;
    ctx.fillText(pigmentNames[2], (canvasWidth / 2) - (textWidthC / 2), fontSize);
}

// Display the mixed color
function displayMixedColor(rgb) {
    const colorDisplayRGB = document.getElementById('RGB-mixed-color-display');
    colorDisplayRGB.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    const colorInfoRGB = document.getElementById('RGB-mixed-color-info');
    colorInfoRGB.innerHTML = `Mixed sRGB values:<br>${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
}
function displayMixedColorKM(rgb) {
    const colorDisplayKM = document.getElementById('KM-mixed-color-display');
    colorDisplayKM.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    const colorInfoKM = document.getElementById('KM-mixed-color-info');
    colorInfoKM.innerHTML = `Mixed sRGB values:<br>${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
}

// Converters
function xyz_to_rgb(XYZ) {
    const [X, Y, Z] = XYZ;
    const M = [
        [3.2406, -1.5372, -0.4986],
        [-0.9689, 1.8758, 0.0415],
        [0.0557, -0.2040, 1.0570]
    ];

    let [r, g, b] = [0, 1, 2].map(i => M[i][0] * X + M[i][1] * Y + M[i][2] * Z);
    [r, g, b] = [r, g, b].map(c => Math.max(0, Math.min(1, c)));

    return [r, g, b].map(gammaCorrect).map(c => Math.round(c * 255));
}
function xyz_to_xy(XYZ) {
    const [X, Y, Z] = XYZ;
    const sum = X + Y + Z;
    if (sum === 0) {
        return [0, 0];
    } else {
        const x = X / sum;
        const y = Y / sum;
        return [x, y];
    }
}

function clip(value, min, max) {
    if (value < min || value > max) {
        console.log(`Clipping value: ${value}`);
    }
    return Math.min(Math.max(value, min), max);
}

// Load all data on startup
loadData();
