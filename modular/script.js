/* ============================================
   PART 2: JAVASCRIPT
   ============================================ */

// Global variable to hold fetched data
let physicsData = {};

// --- CORE FUNCTION: Fetch data and build the page ---
document.addEventListener('DOMContentLoaded', () => {
    fetch('content.json')
        .then(response => response.json())
        .then(data => {
            physicsData = data;
            buildPage(data);
            setupEventListeners();
            initVisualizations();
            addConsoleEasterEgg();
        })
        .catch(error => {
            console.error('Error fetching content:', error);
            document.getElementById('main-container').innerHTML = `<p style="color:var(--warning);">Failed to load page content. Please check the console for errors.</p>`;
        });
});

// --- BUILDER FUNCTIONS ---

function buildPage(data) {
    const mainContainer = document.getElementById('main-container');
    const navSidebar = document.getElementById('nav-sidebar');
    mainContainer.innerHTML = ''; // Clear any existing content
    navSidebar.innerHTML = '';    // Clear any existing nav

    data.sections.forEach((sectionData, index) => {
        // Build Navigation
        const navDot = document.createElement('div');
        navDot.className = `nav-dot ${index === 0 ? 'active' : ''}`;
        navDot.dataset.section = index;
        navDot.innerHTML = `<span class="nav-tooltip">${sectionData.nav_title}</span>`;
        navSidebar.appendChild(navDot);
        
        // Build Section Content
        const section = document.createElement('section');
        section.className = `content-section ${sectionData.type === 'hero' ? 'hero' : ''}`;
        section.dataset.section = index;

        if (sectionData.type === 'hero') {
            section.innerHTML = `
                <div>
                    <h1>${sectionData.title}</h1>
                    <p class="hero-subtitle">${sectionData.subtitle}</p>
                    <div class="interactive-demo">
                        <p>${sectionData.demo_text}</p>
                    </div>
                </div>
                <div class="scroll-indicator">
                    <i class="fas fa-chevron-down fa-2x" style="color: var(--primary);"></i>
                </div>`;
        } else {
            section.innerHTML = `
                <div class="section-header">
                    <span class="section-number">${sectionData.number}</span>
                    <h2 class="section-title">${sectionData.title}</h2>
                </div>
            `;
            sectionData.cards.forEach(cardData => {
                section.appendChild(createCard(cardData));
            });
        }
        mainContainer.appendChild(section);
    });
}

function createCard(cardData) {
    const card = document.createElement('div');
    card.className = cardData.type === 'mnemonic' ? 'mnemonic' : 'concept-card';

    let contentHTML = `<h3>${cardData.title}</h3>`;
    
    cardData.content.forEach(paragraph => {
        contentHTML += `<p>${paragraph}</p>`;
    });

    if(cardData.list_items) {
        contentHTML += `<ul style="line-height: 2; margin-left: 2rem;">
            ${cardData.list_items.map(item => `<li>${item}</li>`).join('')}
        </ul>`;
    }

    if (cardData.has_canvas) {
        contentHTML += `
            <div class="interactive-demo">
                <canvas id="${cardData.canvas_id}" class="demo-canvas"></canvas>
            </div>`;
    }

    if (cardData.has_particle_grid) {
        contentHTML += createParticleGrid(physicsData.particleData);
    }
    
    if (cardData.expandable) {
        contentHTML += `
            <button class="expand-btn" onclick="toggleExpand(this)">
                ${cardData.expandable.button_text} <i class="fas fa-chevron-down"></i>
            </button>
            <div class="expandable">${createExpandableContent(cardData.expandable.content)}</div>`;
    }

    card.innerHTML = contentHTML;
    return card;
}

function createParticleGrid(particles) {
    let gridHTML = '<div class="particle-grid">';
    for (const key in particles) {
        const p = particles[key];
        gridHTML += `
            <div class="particle-tile ${p.group}" onclick="showParticleDetail('${key}')">
                <div class="particle-symbol">${p.symbol}</div>
                <div class="particle-name">${p.name.replace(' Quark', '').replace(' Neutrino', '-neutrino')}</div>
            </div>`;
    }
    gridHTML += '</div>';
    return gridHTML;
}

function createExpandableContent(contentArray) {
    return contentArray.map(item => {
        switch(item.type) {
            case 'depth-indicator':
                return `<div class="depth-indicator depth-${item.depth}">${item.text}</div>`;
            case 'paragraph':
                return `<p>${item.text}</p>`;
            case 'list':
                return `<ul style="line-height: 2.5; margin: 1rem 0;">${item.items.map(li => `<li>${li}</li>`).join('')}</ul>`;
            case 'equation-box':
                return `<div class="equation-box">${createExpandableContent(item.content)}</div>`;
            case 'equation':
                return `<div class="equation">${item.text}</div>`;
            case 'cern-reference':
                return `<div class="cern-reference"><h4>${item.title}</h4><p>${item.text}</p></div>`;
            default:
                return '';
        }
    }).join('');
}


// --- INTERACTIVITY FUNCTIONS (from original file) ---

function setupEventListeners() {
    // Progress bar update on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrolled / maxScroll) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        
        updateActiveNavDot();
    });

    // Navigation dots click
    document.querySelectorAll('.nav-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const sectionIndex = e.currentTarget.getAttribute('data-section');
            const section = document.querySelector(`.content-section[data-section="${sectionIndex}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function updateActiveNavDot() {
    const sections = document.querySelectorAll('.content-section');
    const navDots = document.querySelectorAll('.nav-dot');
    
    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            navDots.forEach(dot => dot.classList.remove('active'));
            if (navDots[index]) navDots[index].classList.add('active');
        }
    });
}

// Expand/Collapse functionality
function toggleExpand(button) {
    const expandable = button.nextElementSibling;
    if (expandable) {
        expandable.classList.toggle('expanded');
        button.classList.toggle('expanded');
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    }
}

// Particle detail popup
function showParticleDetail(particleKey) {
    const p = physicsData.particleData[particleKey];
    if (!p) return;

    // Remove existing popups
    const existingPopup = document.getElementById('particlePopup');
    if(existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'particlePopup';
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1f3a, #0a0e27);
        border: 2px solid var(--primary); border-radius: 20px; padding: 2rem;
        z-index: 10000; max-width: 400px; box-shadow: 0 20px 60px rgba(0, 212, 255, 0.5);
    `;
    
    popup.innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 1rem;">${p.name}</h2>
        <div style="color: var(--text-primary); line-height: 1.8;">
            <p><strong>Mass:</strong> ${p.mass}</p>
            <p><strong>Charge:</strong> ${p.charge}e</p>
            <p><strong>Spin:</strong> ${p.spin}</p>
            <p><strong>Discovered:</strong> ${p.discovered}</p>
            <p style="margin-top: 1rem; color: var(--text-secondary);">${p.info}</p>
        </div>
        <button onclick="this.parentElement.remove()" style="
            margin-top: 1.5rem; padding: 0.5rem 1.5rem;
            background: linear-gradient(45deg, var(--primary), var(--accent));
            border: none; border-radius: 25px; color: white; cursor: pointer;
            width: 100%; font-size: 1rem;
        ">Close</button>
    `;
    
    document.body.appendChild(popup);
}

// --- VISUALIZATION & ANIMATION FUNCTIONS ---

function initVisualizations() {
    if (document.getElementById('scaleVisualization')) {
        drawScaleVisualization(document.getElementById('scaleVisualization'));
    }
    if (document.getElementById('atomModel')) {
        animateAtom(document.getElementById('atomModel'));
    }
    const heroDemo = document.querySelector('.hero .interactive-demo');
    if (heroDemo) {
        const collisionCanvas = createParticleCollision();
        collisionCanvas.style.width = '100%';
        collisionCanvas.style.height = '200px';
        collisionCanvas.style.borderRadius = '15px';
        collisionCanvas.style.marginTop = '2rem';
        heroDemo.appendChild(collisionCanvas);
    }
}

function drawScaleVisualization(canvas) { /* ... original canvas code ... */ }
function animateAtom(canvas) { /* ... original canvas code ... */ }
function createParticleCollision() { /* ... original canvas code ... */ return document.createElement('canvas'); }
// NOTE: The canvas drawing functions from the original file would be pasted here unchanged.
// I have omitted them for brevity but they are required for the visualizations to work.


function addConsoleEasterEgg() {
    console.log('%c⚛️ Welcome to the Quantum Realm! ⚛️', 'font-size: 20px; color: #00d4ff; font-weight: bold;');
    console.log('%cYou\'ve discovered the hidden console! Here are some particle physics facts:', 'color: #06ffa5;');
    console.log('%c• A teaspoon of neutron star material would weigh 6 billion tons', 'color: #8892b0;');
    console.log('%c• The LHC accelerates protons to 99.9999991% the speed of light', 'color: #8892b0;');
    console.log('%c• There are more atoms in a glass of water than glasses of water in all the oceans', 'color: #8892b0;');
}

////
////
////

/* ============================================
   ENHANCED SCRIPT.JS - Complete Implementation
   ============================================ */

// Global variable to hold fetched data
let physicsData = {};

// --- CORE FUNCTION: Fetch data and build the page ---
document.addEventListener('DOMContentLoaded', () => {
    fetch('content.json')
        .then(response => response.json())
        .then(data => {
            physicsData = data;
            buildPage(data);
            setupEventListeners();
            initVisualizations();
            addConsoleEasterEgg();
        })
        .catch(error => {
            console.error('Error fetching content:', error);
            document.getElementById('main-container').innerHTML = `<p style="color:var(--warning);">Failed to load page content. Please check the console for errors.</p>`;
        });
});

// --- ENHANCED BUILDER FUNCTIONS ---

function buildPage(data) {
    const mainContainer = document.getElementById('main-container');
    const navSidebar = document.getElementById('nav-sidebar');
    mainContainer.innerHTML = '';
    navSidebar.innerHTML = '';

    data.sections.forEach((sectionData, index) => {
        // Build Navigation
        const navDot = document.createElement('div');
        navDot.className = `nav-dot ${index === 0 ? 'active' : ''}`;
        navDot.dataset.section = index;
        navDot.innerHTML = `<span class="nav-tooltip">${sectionData.nav_title}</span>`;
        navSidebar.appendChild(navDot);
        
        // Build Section Content
        const section = document.createElement('section');
        section.className = `content-section ${sectionData.type === 'hero' ? 'hero' : ''}`;
        section.dataset.section = index;

        if (sectionData.type === 'hero') {
            section.innerHTML = `
                <div>
                    <h1>${sectionData.title}</h1>
                    <p class="hero-subtitle">${sectionData.subtitle}</p>
                    <div class="interactive-demo">
                        <p>${sectionData.demo_text}</p>
                        ${sectionData.has_animation ? '<div id="heroAnimation"></div>' : ''}
                    </div>
                </div>
                <div class="scroll-indicator">
                    <i class="fas fa-chevron-down fa-2x" style="color: var(--primary);"></i>
                </div>`;
        } else {
            section.innerHTML = `
                <div class="section-header">
                    <span class="section-number">${sectionData.number}</span>
                    <h2 class="section-title">${sectionData.title}</h2>
                </div>
            `;
            if (sectionData.cards) {
                sectionData.cards.forEach(cardData => {
                    section.appendChild(createCard(cardData));
                });
            }
        }
        mainContainer.appendChild(section);
    });
}

function createCard(cardData) {
    const card = document.createElement('div');
    
    // Handle different card types
    if (cardData.type === 'mnemonic') {
        card.className = 'mnemonic';
    } else if (cardData.type === 'cern-reference') {
        card.className = 'cern-reference';
    } else if (cardData.type === 'summary') {
        card.className = 'concept-card summary-card';
    } else if (cardData.type === 'resources') {
        card.className = 'concept-card resources-card';
    } else {
        card.className = 'concept-card';
    }

    let contentHTML = `<h3>${cardData.title}</h3>`;
    
    // Handle content array
    if (cardData.content) {
        cardData.content.forEach(paragraph => {
            contentHTML += `<p>${paragraph}</p>`;
        });
    }

    // Handle list items
    if (cardData.list_items) {
        contentHTML += `<ul style="line-height: 2; margin-left: 2rem;">
            ${cardData.list_items.map(item => `<li>${item}</li>`).join('')}
        </ul>`;
    }

    // Handle canvas
    if (cardData.has_canvas) {
        contentHTML += `
            <div class="interactive-demo">
                <canvas id="${cardData.canvas_id}" class="demo-canvas" data-type="${cardData.canvas_type || ''}"></canvas>
            </div>`;
    }

    // Handle interactive buttons
    if (cardData.interactive_buttons) {
        contentHTML += `<div class="button-group" style="text-align: center; margin: 1rem 0;">`;
        cardData.interactive_buttons.forEach(btn => {
            contentHTML += `<button class="expand-btn" style="margin: 0.5rem;" onclick="handleInteractiveButton('${cardData.canvas_id}', '${btn}')">${btn}</button>`;
        });
        contentHTML += `</div>`;
    }

    // Handle interactive elements (for Higgs field)
    if (cardData.interactive_elements) {
        contentHTML += `<div class="interactive-elements" style="text-align: center; margin: 1rem 0;">`;
        cardData.interactive_elements.forEach(elem => {
            contentHTML += `<span class="particle-example" style="margin: 0 1rem; cursor: pointer; color: var(--primary);" onclick="showParticleMass('${elem}')">${elem}</span>`;
        });
        contentHTML += `</div>`;
    }

    // Handle particle grid
    if (cardData.has_particle_grid) {
        contentHTML += createParticleGrid(physicsData.particleData);
    }

    // Handle tables
    if (cardData.has_table && cardData.table_data) {
        contentHTML += createTable(cardData.table_data);
    }

    // Handle equations
    if (cardData.equations) {
        cardData.equations.forEach(eq => {
            contentHTML += `
                <div class="equation-box">
                    <h4>${eq.name}</h4>
                    <div class="equation">${eq.equation}</div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">${eq.description}</p>
                </div>`;
        });
    }

    // Handle resource links
    if (cardData.links) {
        contentHTML += '<div class="resource-links">';
        cardData.links.forEach(link => {
            contentHTML += `
                <div class="resource-link" style="margin: 1rem 0;">
                    <a href="${link.url}" target="_blank" style="color: var(--primary); text-decoration: none;">
                        <strong>${link.text}</strong>
                    </a>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-left: 1rem;">${link.description}</p>
                </div>`;
        });
        contentHTML += '</div>';
    }
    
    // Handle expandable content
    if (cardData.expandable) {
        contentHTML += `
            <button class="expand-btn" onclick="toggleExpand(this)">
                ${cardData.expandable.button_text} <i class="fas fa-chevron-down"></i>
            </button>
            <div class="expandable">${createExpandableContent(cardData.expandable.content)}</div>`;
    }

    card.innerHTML = contentHTML;
    return card;
}

function createTable(tableData) {
    let tableHTML = '<table style="width: 100%; margin: 1rem 0; border-collapse: collapse;">';
    
    // Headers
    tableHTML += '<tr style="background: rgba(0, 212, 255, 0.1);">';
    tableData.headers.forEach(header => {
        tableHTML += `<th style="padding: 0.75rem; border: 1px solid var(--primary); text-align: left;">${header}</th>`;
    });
    tableHTML += '</tr>';
    
    // Rows
    tableData.rows.forEach(row => {
        tableHTML += '<tr>';
        row.forEach(cell => {
            tableHTML += `<td style="padding: 0.75rem; border: 1px solid rgba(0, 212, 255, 0.3);">${cell}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</table>';
    return tableHTML;
}

function createParticleGrid(particles) {
    let gridHTML = '<div class="particle-grid">';
    for (const key in particles) {
        const p = particles[key];
        gridHTML += `
            <div class="particle-tile ${p.group}" onclick="showParticleDetail('${key}')">
                <div class="particle-symbol">${p.symbol}</div>
                <div class="particle-name">${p.name.replace(' Quark', '').replace(' Boson', '').replace(' Neutrino', '')}</div>
            </div>`;
    }
    gridHTML += '</div>';
    return gridHTML;
}

function createExpandableContent(contentArray) {
    return contentArray.map(item => {
        switch(item.type) {
            case 'depth-indicator':
                return `<div class="depth-indicator depth-${item.depth}">${item.text}</div>`;
            case 'paragraph':
                return `<p>${item.text}</p>`;
            case 'list':
                return `<ul style="line-height: 2.5; margin: 1rem 0;">${item.items.map(li => `<li>${li}</li>`).join('')}</ul>`;
            case 'table':
                return createTable(item.data);
            case 'equation-box':
                return `<div class="equation-box">${createExpandableContent(item.content)}</div>`;
            case 'equation':
                return `<div class="equation">${item.text}</div>`;
            case 'cern-reference':
                return `<div class="cern-reference"><h4>${item.title}</h4><p>${item.text}</p></div>`;
            case 'canvas':
                return `<canvas id="${item.id}" class="demo-canvas" data-type="${item.type}"></canvas>`;
            default:
                return '';
        }
    }).join('');
}

// --- INTERACTION HANDLERS ---

function handleInteractiveButton(canvasId, buttonText) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const canvasType = canvas.dataset.type;
    
    switch(canvasType) {
        case 'quark_builder':
            if (buttonText.includes('Proton')) showQuarkCombination(canvas, 'proton');
            else if (buttonText.includes('Neutron')) showQuarkCombination(canvas, 'neutron');
            else if (buttonText.includes('Pion')) showQuarkCombination(canvas, 'pion');
            else if (buttonText.includes('Kaon')) showQuarkCombination(canvas, 'kaon');
            break;
        case 'force_animation':
            if (buttonText.includes('Electromagnetic')) showForce(canvas, 'em');
            else if (buttonText.includes('Strong')) showForce(canvas, 'strong');
            else if (buttonText.includes('Weak')) showForce(canvas, 'weak');
            break;
        case 'feynman_builder':
            drawFeynmanDiagram(canvas, buttonText.toLowerCase().replace(' ', '_'));
            break;
    }
}

function showParticleMass(particleName) {
    const massInfo = {
        "Photon (no mass)": "Massless - doesn't interact with Higgs field",
        "Electron (small mass)": "0.511 MeV/c² - weak Higgs coupling",
        "W boson (large mass)": "80.4 GeV/c² - strong Higgs coupling",
        "Top quark (huge mass)": "173 GeV/c² - strongest Higgs coupling!"
    };
    
    alert(massInfo[particleName] || "Unknown particle");
}

// --- ENHANCED VISUALIZATIONS ---

function initVisualizations() {
    // Initialize all canvases based on their type
    document.querySelectorAll('canvas[data-type]').forEach(canvas => {
        const type = canvas.dataset.type;
        switch(type) {
            case 'scale_zoom':
                drawScaleVisualization(canvas);
                break;
            case 'atom_animation':
                animateAtom(canvas);
                break;
            case 'quark_builder':
                showQuarkCombination(canvas, 'proton');
                break;
            case 'force_animation':
                animateForceExchange(canvas);
                break;
            case 'higgs_field_sim':
                animateHiggsField(canvas);
                break;
            case 'spin_visualization':
                animateSpinDemo(canvas);
                break;
            case 'detector_cross_section':
                drawDetectorView(canvas);
                break;
            case 'feynman_builder':
                drawFeynmanDiagram(canvas, 'beta_decay');
                break;
            case 'pie_chart_3d':
                drawUniverseComposition(canvas);
                break;
            case 'potential_3d':
                drawMexicanHat(canvas);
                break;
        }
    });
    
    // Add particle collision to hero
    const heroAnimation = document.getElementById('heroAnimation');
    if (heroAnimation) {
        const collisionCanvas = createParticleCollision();
        collisionCanvas.style.width = '100%';
        collisionCanvas.style.height = '200px';
        collisionCanvas.style.borderRadius = '15px';
        collisionCanvas.style.marginTop = '1rem';
        heroAnimation.appendChild(collisionCanvas);
    }
}

// --- CANVAS ANIMATION FUNCTIONS ---

function drawScaleVisualization(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let zoom = 1;
    let targetZoom = 1;
    
    const scales = physicsData.visualizations?.scale_zoom?.scales || [
        { size: 26, label: "Observable Universe", color: "#8338ec" },
        { size: 21, label: "Galaxy", color: "#3a86ff" },
        { size: 12, label: "Solar System", color: "#00d4ff" },
        { size: 6, label: "Earth", color: "#06ffa5" },
        { size: 0, label: "Human", color: "#ffb700" },
        { size: -10, label: "Atom", color: "#ff006e" },
        { size: -15, label: "Nucleus", color: "#cc0055" },
        { size: -18, label: "Quark", color: "#990044" }
    ];
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        scales.forEach((scale, index) => {
            const radius = Math.max(10, (scale.size + 20) * zoom * 5);
            
            ctx.strokeStyle = scale.color || '#00d4ff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = Math.max(0.3, 1 - Math.abs(radius - 100) / 200);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
            ctx.stroke();
            
            if (Math.abs(radius - 100) < 50) {
                ctx.fillStyle = scale.color || '#00d4ff';
                ctx.font = '14px Arial';
                ctx.fillText(scale.label, centerX + radius + 10, centerY);
                ctx.fillText(`10^${scale.size} m`, centerX + radius + 10, centerY + 20);
            }
        });
        
        ctx.globalAlpha = 1;
        zoom += (targetZoom - zoom) * 0.1;
        requestAnimationFrame(draw);
    }
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetZoom *= e.deltaY > 0 ? 0.9 : 1.1;
        targetZoom = Math.max(0.1, Math.min(10, targetZoom));
    });
    
    draw();
}

function animateAtom(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let time = 0;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw nucleus with quarks
        ctx.fillStyle = '#ff006e';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff006e';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Quarks in nucleus
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i + time * 0.5;
            const x = centerX + Math.cos(angle) * 10;
            const y = centerY + Math.sin(angle) * 10;
            
            ctx.fillStyle = i < 2 ? '#ff4444' : '#4444ff';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        
        // Electron orbitals
        for (let orbit = 1; orbit <= 3; orbit++) {
            const radius = 40 + orbit * 35;
            
            ctx.strokeStyle = 'rgba(100, 255, 218, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            const electronAngle = time * (4 - orbit) * 0.5;
            const electronX = centerX + Math.cos(electronAngle) * radius;
            const electronY = centerY + Math.sin(electronAngle) * radius;
            
            // Electron trail
            for (let j = 0; j < 10; j++) {
                const trailAngle = electronAngle - j * 0.1;
                const trailX = centerX + Math.cos(trailAngle) * radius;
                const trailY = centerY + Math.sin(trailAngle) * radius;
                
                ctx.fillStyle = `rgba(0, 212, 255, ${0.5 - j * 0.05})`;
                ctx.beginPath();
                ctx.arc(trailX, trailY, 5 - j * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = '#00d4ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00d4ff';
            ctx.beginPath();
            ctx.arc(electronX, electronY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Labels
        ctx.fillStyle = '#e0e6ed';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Spin-1/2 (Fermion)', centerX - 100, centerY + 60);
        ctx.fillText('Spin-1 (Boson)', centerX + 100, centerY + 60);
        
        rotation += 0.02;
        requestAnimationFrame(draw);
    }
    
    draw();
}

function drawDetectorView(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw detector layers
    const layers = [
        { radius: 40, width: 15, color: 'rgba(255, 0, 110, 0.3)', label: 'Vertex' },
        { radius: 60, width: 20, color: 'rgba(0, 212, 255, 0.3)', label: 'Tracker' },
        { radius: 90, width: 25, color: 'rgba(255, 183, 0, 0.3)', label: 'ECAL' },
        { radius: 120, width: 30, color: 'rgba(255, 100, 0, 0.3)', label: 'HCAL' },
        { radius: 160, width: 20, color: 'rgba(6, 255, 165, 0.3)', label: 'Muon' }
    ];
    
    // Draw layers
    layers.forEach(layer => {
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.width;
        ctx.beginPath();
        ctx.arc(centerX, centerY, layer.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#e0e6ed';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(layer.label, centerX + layer.radius + layer.width/2 + 5, centerY);
    });
    
    // Draw particle tracks
    const tracks = [
        { type: 'electron', color: '#00d4ff', stops: 2 },
        { type: 'muon', color: '#06ffa5', stops: 5 },
        { type: 'hadron', color: '#ff006e', stops: 3 },
        { type: 'photon', color: '#ffb700', stops: 2, dashed: true }
    ];
    
    tracks.forEach((track, i) => {
        const angle = (Math.PI * 2 / tracks.length) * i;
        ctx.strokeStyle = track.color;
        ctx.lineWidth = 2;
        
        if (track.dashed) {
            ctx.setLineDash([5, 5]);
        }
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const endRadius = layers[track.stops].radius + layers[track.stops].width/2;
        ctx.lineTo(
            centerX + Math.cos(angle) * endRadius,
            centerY + Math.sin(angle) * endRadius
        );
        ctx.stroke();
        ctx.setLineDash([]);
    });
    
    // Central collision point
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawFeynmanDiagram(canvas, process) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    switch(process) {
        case 'beta_decay':
            // Neutron to proton
            drawParticleLine(ctx, 50, centerY - 50, centerX, centerY, 'n');
            drawParticleLine(ctx, centerX, centerY, canvas.width - 50, centerY - 50, 'p');
            
            // W boson
            ctx.strokeStyle = '#ff006e';
            drawWavyLine(ctx, centerX, centerY, centerX + 80, centerY + 60);
            
            // Electron and antineutrino
            ctx.strokeStyle = '#06ffa5';
            drawParticleLine(ctx, centerX + 80, centerY + 60, canvas.width - 50, centerY + 30, 'e⁻');
            drawParticleLine(ctx, centerX + 80, centerY + 60, canvas.width - 50, centerY + 90, 'ν̄ₑ');
            
            // Labels
            ctx.fillStyle = '#ff006e';
            ctx.font = '14px Arial';
            ctx.fillText('W⁻', centerX + 40, centerY + 35);
            break;
            
        case 'electron_scattering':
            // Incoming electrons
            drawParticleLine(ctx, 50, centerY - 50, centerX - 30, centerY, 'e⁻');
            drawParticleLine(ctx, 50, centerY + 50, centerX - 30, centerY, 'e⁺');
            
            // Photon exchange
            ctx.strokeStyle = '#ffb700';
            drawWavyLine(ctx, centerX - 30, centerY, centerX + 30, centerY);
            
            // Outgoing electrons
            ctx.strokeStyle = '#00d4ff';
            drawParticleLine(ctx, centerX + 30, centerY, canvas.width - 50, centerY - 50, 'e⁻');
            drawParticleLine(ctx, centerX + 30, centerY, canvas.width - 50, centerY + 50, 'e⁺');
            
            ctx.fillStyle = '#ffb700';
            ctx.font = '14px Arial';
            ctx.fillText('γ', centerX, centerY - 10);
            break;
            
        case 'higgs_production':
            // Gluon fusion
            ctx.strokeStyle = '#06ffa5';
            drawCurlyLine(ctx, 50, centerY - 30, centerX, centerY);
            drawCurlyLine(ctx, 50, centerY + 30, centerX, centerY);
            
            // Higgs
            ctx.strokeStyle = '#ff006e';
            ctx.setLineDash([10, 5]);
            drawParticleLine(ctx, centerX, centerY, canvas.width - 100, centerY, 'H');
            ctx.setLineDash([]);
            
            // Higgs decay to photons
            ctx.strokeStyle = '#ffb700';
            drawWavyLine(ctx, canvas.width - 100, centerY, canvas.width - 50, centerY - 30);
            drawWavyLine(ctx, canvas.width - 100, centerY, canvas.width - 50, centerY + 30);
            
            ctx.fillStyle = '#06ffa5';
            ctx.font = '14px Arial';
            ctx.fillText('g', 30, centerY - 30);
            ctx.fillText('g', 30, centerY + 30);
            ctx.fillStyle = '#ffb700';
            ctx.fillText('γ', canvas.width - 30, centerY - 30);
            ctx.fillText('γ', canvas.width - 30, centerY + 30);
            break;
    }
    
    function drawParticleLine(ctx, x1, y1, x2, y2, label) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        if (label) {
            ctx.fillStyle = '#e0e6ed';
            ctx.font = '14px Arial';
            ctx.fillText(label, x2 + 10, y2);
        }
    }
    
    function drawWavyLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + dx * t;
            const y = y1 + dy * t + Math.sin(t * Math.PI * 4) * 5;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    function drawCurlyLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        const dx = x2 - x1;
        const dy = y2 - y1;
        const loops = 6;
        for (let i = 0; i <= loops * 20; i++) {
            const t = i / (loops * 20);
            const x = x1 + dx * t;
            const y = y1 + dy * t + Math.sin(t * Math.PI * 2 * loops) * 8;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

function drawUniverseComposition(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const data = [
        { label: 'Dark Energy', value: 68, color: '#8338ec' },
        { label: 'Dark Matter', value: 27, color: '#ff006e' },
        { label: 'Ordinary Matter', value: 5, color: '#06ffa5' }
    ];
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach(segment => {
        const angle = (segment.value / 100) * Math.PI * 2;
        
        // Draw segment
        ctx.fillStyle = segment.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        const labelAngle = currentAngle + angle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(segment.label, labelX, labelY);
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${segment.value}%`, labelX, labelY + 20);
        
        currentAngle += angle;
    });
    
    // Title
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('What the Universe is Made Of', centerX, 30);
}

function drawMexicanHat_old(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Simple 2D representation of Mexican hat potential
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    // Draw the potential curve
    ctx.beginPath();
    for (let x = -100; x <= 100; x++) {
        const V = -0.01 * x * x + 0.000001 * x * x * x * x;
        const screenX = centerX + x * 1.5;
        const screenY = centerY - V * 100;
        
        if (x === -100) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();
    
    // Mark the minima
    ctx.fillStyle = '#06ffa5';
    ctx.beginPath();
    ctx.arc(centerX - 75, centerY + 55, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 75, centerY + 55, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Labels
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('V(φ)', 30, centerY);
    ctx.fillText('φ', centerX, canvas.height - 20);
    ctx.fillText('Vacuum expectation value', centerX, canvas.height - 40);
}

function createParticleCollision() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    const particles = [];
    const tracks = [];
    let time = 0;
    
    function collision() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        particles.length = 0;
        
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i + (Math.random() - 0.5) * 0.3;
            const speed = 2 + Math.random() * 2;
            
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                life: 1,
                type: Math.random() > 0.7 ? 'curved' : 'straight'
            });
        }
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update particles
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.type === 'curved') {
                p.vx *= 0.98;
                p.vy += 0.1;
            }
            
            p.life -= 0.008;
            
            if (p.life > 0 && p.x > 0 && p.x < canvas.width && p.y > 0 && p.y < canvas.height) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                tracks.push({ x: p.x, y: p.y, color: p.color, alpha: p.life * 0.5 });
            } else if (p.life <= 0) {
                particles.splice(index, 1);
            }
        });
        
        // Draw tracks
        tracks.forEach((t, index) => {
            t.alpha -= 0.003;
            if (t.alpha > 0) {
                ctx.fillStyle = t.color;
                ctx.globalAlpha = t.alpha;
                ctx.fillRect(t.x, t.y, 1, 1);
            } else {
                tracks.splice(index, 1);
            }
        });
        
        ctx.globalAlpha = 1;
        
        // Create new collision when particles are gone
        if (particles.length === 0 && time % 100 === 0) {
            collision();
        }
        
        time++;
        requestAnimationFrame(animate);
    }
    
    collision();
    animate();
    
    return canvas;
}

function showForce(canvas, forceType) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const forces = {
        em: { color: '#ffb700', carrier: 'γ', name: 'Electromagnetic' },
        strong: { color: '#06ffa5', carrier: 'g', name: 'Strong' },
        weak: { color: '#ff006e', carrier: 'W/Z', name: 'Weak' }
    };
    
    const force = forces[forceType];
    
    // Draw particles
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(100, centerY, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(canvas.width - 100, centerY, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw force carrier
    ctx.strokeStyle = force.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(125, centerY);
    ctx.lineTo(canvas.width - 125, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label
    ctx.fillStyle = force.color;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(force.carrier, centerX, centerY - 10);
    
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '16px Arial';
    ctx.fillText(force.name + ' Force', centerX, centerY + 40);
}

// --- UTILITY FUNCTIONS ---

function setupEventListeners() {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrolled / maxScroll) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        
        updateActiveNavDot();
    });

    document.querySelectorAll('.nav-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            const sectionIndex = e.currentTarget.getAttribute('data-section');
            const section = document.querySelector(`.content-section[data-section="${sectionIndex}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('resize', () => {
        initVisualizations();
    });
}

function updateActiveNavDot() {
    const sections = document.querySelectorAll('.content-section');
    const navDots = document.querySelectorAll('.nav-dot');
    
    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            navDots.forEach(dot => dot.classList.remove('active'));
            if (navDots[index]) navDots[index].classList.add('active');
        }
    });
}

function toggleExpand(button) {
    const expandable = button.nextElementSibling;
    if (expandable) {
        expandable.classList.toggle('expanded');
        button.classList.toggle('expanded');
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    }
}

function showParticleDetail(particleKey) {
    const p = physicsData.particleData[particleKey];
    if (!p) return;

    const existingPopup = document.getElementById('particlePopup');
    if(existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'particlePopup';
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1f3a, #0a0e27);
        border: 2px solid var(--primary); border-radius: 20px; padding: 2rem;
        z-index: 10000; max-width: 400px; box-shadow: 0 20px 60px rgba(0, 212, 255, 0.5);
        animation: modalSlide 0.3s ease;
    `;
    
    popup.innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 1rem;">${p.name}</h2>
        <div style="color: var(--text-primary); line-height: 1.8;">
            <p><strong>Symbol:</strong> ${p.symbol}</p>
            <p><strong>Mass:</strong> ${p.mass}</p>
            <p><strong>Charge:</strong> ${p.charge}e</p>
            <p><strong>Spin:</strong> ${p.spin}</p>
            ${p.generation ? `<p><strong>Generation:</strong> ${p.generation}</p>` : ''}
            ${p.force ? `<p><strong>Force:</strong> ${p.force}</p>` : ''}
            <p><strong>Discovered:</strong> ${p.discovered}</p>
            <p style="margin-top: 1rem; color: var(--text-secondary);">${p.info}</p>
        </div>
        <button onclick="this.parentElement.remove()" style="
            margin-top: 1.5rem; padding: 0.5rem 1.5rem;
            background: linear-gradient(45deg, var(--primary), var(--accent));
            border: none; border-radius: 25px; color: white; cursor: pointer;
            width: 100%; font-size: 1rem; transition: all 0.3s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Close</button>
    `;
    
    document.body.appendChild(popup);
}

function addConsoleEasterEgg() {
    console.log('%c⚛️ Welcome to the Quantum Realm! ⚛️', 'font-size: 20px; color: #00d4ff; font-weight: bold;');
    console.log('%cYou\'ve discovered the hidden console! Here are some particle physics facts:', 'color: #06ffa5;');
    console.log('%c• A teaspoon of neutron star material would weigh 6 billion tons', 'color: #8892b0;');
    console.log('%c• The LHC accelerates protons to 99.9999991% the speed of light', 'color: #8892b0;');
    console.log('%c• There are more atoms in a glass of water than glasses of water in all the oceans', 'color: #8892b0;');
    console.log('%c• Neutrinos are so elusive that 65 billion pass through every square centimeter of your body every second', 'color: #8892b0;');
    console.log('%c• The Higgs field gives particles mass, but the Higgs boson itself gets mass from... itself!', 'color: #8892b0;');
}

// Make functions globally accessible
window.toggleExpand = toggleExpand;
window.showParticleDetail = showParticleDetail;
window.handleInteractiveButton = handleInteractiveButton;
window.showParticleMass = showParticleMass;
        ctx.fillStyle = '#e0e6ed';
        ctx.font = '12px Arial';
        ctx.fillText('Nucleus (quarks)', centerX - 45, centerY + 45);
        
        time += 0.02;
        requestAnimationFrame(draw);
    }
    
    draw();
}

function showQuarkCombination(canvas, type) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const combinations = {
        proton: [
            { x: -50, y: 0, color: '#ff006e', label: 'u', charge: '+2/3' },
            { x: 50, y: 0, color: '#ff006e', label: 'u', charge: '+2/3' },
            { x: 0, y: -50, color: '#3a86ff', label: 'd', charge: '-1/3' }
        ],
        neutron: [
            { x: -50, y: 0, color: '#3a86ff', label: 'd', charge: '-1/3' },
            { x: 50, y: 0, color: '#3a86ff', label: 'd', charge: '-1/3' },
            { x: 0, y: -50, color: '#ff006e', label: 'u', charge: '+2/3' }
        ],
        pion: [
            { x: -40, y: 0, color: '#ff006e', label: 'u', charge: '+2/3' },
            { x: 40, y: 0, color: '#8338ec', label: 'd̄', charge: '+1/3' }
        ],
        kaon: [
            { x: -40, y: 0, color: '#ffb700', label: 's', charge: '-1/3' },
            { x: 40, y: 0, color: '#8338ec', label: 'ū', charge: '-2/3' }
        ]
    };
    
    const quarks = combinations[type] || combinations.proton;
    
    // Draw gluon lines
    ctx.strokeStyle = '#06ffa5';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06ffa5';
    
    if (type === 'proton' || type === 'neutron') {
        // Triangle for baryons
        for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 3; j++) {
                ctx.beginPath();
                ctx.moveTo(centerX + quarks[i].x, centerY + quarks[i].y);
                ctx.lineTo(centerX + quarks[j].x, centerY + quarks[j].y);
                ctx.stroke();
            }
        }
    } else {
        // Single line for mesons
        ctx.beginPath();
        ctx.moveTo(centerX + quarks[0].x, centerY + quarks[0].y);
        ctx.lineTo(centerX + quarks[1].x, centerY + quarks[1].y);
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    
    // Draw quarks
    quarks.forEach(q => {
        ctx.fillStyle = q.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = q.color;
        ctx.beginPath();
        ctx.arc(centerX + q.x, centerY + q.y, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(q.label, centerX + q.x, centerY + q.y);
        
        ctx.font = '12px Arial';
        ctx.fillText(q.charge, centerX + q.x, centerY + q.y + 20);
    });
    
    // Label
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    const charge = type === 'proton' ? '+1' : type === 'neutron' ? '0' : type === 'pion' ? '+1' : '-1';
    ctx.fillText(`${type.charAt(0).toUpperCase() + type.slice(1)} (charge: ${charge})`, centerX, canvas.height - 20);
}

function animateForceExchange(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let time = 0;
    const particles = [];
    
    function createExchange() {
        particles.push({
            x: 100,
            y: canvas.height / 2,
            vx: 3,
            color: '#06ffa5',
            life: 1
        });
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw source particles
        ctx.fillStyle = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00d4ff';
        ctx.beginPath();
        ctx.arc(100, canvas.height / 2, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(canvas.width - 100, canvas.height / 2, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Update and draw exchange particles
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.life -= 0.01;
            
            if (p.x > canvas.width - 100 || p.life <= 0) {
                particles.splice(index, 1);
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.globalAlpha = 1;
        
        if (time % 30 === 0) createExchange();
        
        time++;
        requestAnimationFrame(draw);
    }
    
    draw();
}

function animateHiggsField(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const gridSize = 30;
    let time = 0;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Higgs field
        for (let x = 0; x < canvas.width; x += gridSize) {
            for (let y = 0; y < canvas.height; y += gridSize) {
                const intensity = Math.sin(x * 0.01 + time) * Math.cos(y * 0.01 + time);
                ctx.fillStyle = `rgba(100, 255, 218, ${Math.abs(intensity) * 0.3})`;
                ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
            }
        }
        
        // Draw particles with different masses
        const particles = [
            { x: canvas.width * 0.25, label: 'γ', color: '#ffb700', speed: 3 },
            { x: canvas.width * 0.5, label: 'e', color: '#00d4ff', speed: 2 },
            { x: canvas.width * 0.75, label: 'W', color: '#ff006e', speed: 0.5 }
        ];
        
        particles.forEach(p => {
            const y = canvas.height / 2 + Math.sin(time * p.speed) * 50;
            
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x, y);
        });
        
        time += 0.02;
        requestAnimationFrame(draw);
    }
    
    draw();
}

// Complete Canvas Animation Functions for script.js

function animateSpinDemo(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let rotation = 0;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Draw spin-1/2 (fermion) on the left
        ctx.save();
        ctx.translate(centerX - 100, centerY);
        ctx.rotate(rotation);
        
        // Draw fermion spin arrow
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 30);
        ctx.stroke();
        
        // Arrow head
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(-10, -20);
        ctx.lineTo(10, -20);
        ctx.closePath();
        ctx.fill();
        
        // Draw sphere outline
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        
        // Draw spin-1 (boson) on the right
        ctx.save();
        ctx.translate(centerX + 100, centerY);
        ctx.rotate(rotation * 2); // Rotates twice as fast
        
        ctx.strokeStyle = '#06ffa5';
        ctx.lineWidth = 3;
        
        // Draw multiple arrows for spin-1
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((Math.PI / 2) * i);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -30);
            ctx.stroke();
            
            // Arrow heads
            ctx.fillStyle = '#06ffa5';
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(-5, -25);
            ctx.lineTo(5, -25);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        
        // Draw sphere outline
        ctx.strokeStyle = 'rgba(6, 255, 165, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
        
        // Labels
        ctx.fillStyle = '#e0e6ed';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Spin-1/2 (Fermion)', centerX - 100, centerY + 60);
        ctx.fillText('720° rotation to return', centerX - 100, centerY + 80);
        ctx.fillText('Spin-1 (Boson)', centerX + 100, centerY + 60);
        ctx.fillText('360° rotation to return', centerX + 100, centerY + 80);
        
        // Title
        ctx.font = '16px Arial';
        ctx.fillText('Quantum Spin Visualization', centerX, 30);
        
        rotation += 0.02;
        requestAnimationFrame(draw);
    }
    
    draw();
}

function animateLeptonInteraction(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let time = 0;
    const particles = [];
    
    function createNeutrino() {
        particles.push({
            x: 50,
            y: canvas.height / 2 + (Math.random() - 0.5) * 100,
            vx: 3 + Math.random() * 2,
            vy: (Math.random() - 0.5) * 0.5,
            type: 'neutrino',
            color: 'rgba(147, 51, 234, 0.6)',
            size: 3,
            life: 1
        });
    }
    
    function createElectron() {
        particles.push({
            x: 50,
            y: canvas.height / 2,
            vx: 2,
            vy: 0,
            type: 'electron',
            color: '#00d4ff',
            size: 8,
            life: 1
        });
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw matter block (detector)
        const blockX = canvas.width / 2 - 50;
        const blockWidth = 100;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(blockX, 50, blockWidth, canvas.height - 100);
        
        ctx.fillStyle = '#8892b0';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Matter', canvas.width / 2, 40);
        
        // Update and draw particles
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Check interaction with matter
            if (p.x > blockX && p.x < blockX + blockWidth) {
                if (p.type === 'electron') {
                    // Electron interacts - slows down and deflects
                    p.vx *= 0.95;
                    p.vy += (Math.random() - 0.5) * 0.5;
                    
                    // Create interaction flash
                    ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Neutrinos pass through unaffected
            }
            
            if (p.x > canvas.width || p.life <= 0) {
                particles.splice(index, 1);
            } else {
                // Draw particle
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                
                if (p.type === 'neutrino') {
                    // Dashed line for neutrino
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(p.x - 10, p.y);
                    ctx.lineTo(p.x + 10, p.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    // Solid circle for electron
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        
        ctx.globalAlpha = 1;
        
        // Labels
        ctx.fillStyle = '#e0e6ed';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Electrons interact', 20, 30);
        ctx.fillStyle = '#9333ea';
        ctx.fillText('Neutrinos ghost through', 20, 50);
        
        // Create new particles periodically
        if (time % 30 === 0) createElectron();
        if (time % 20 === 0) createNeutrino();
        
        time++;
        requestAnimationFrame(draw);
    }
    
    draw();
}

function drawMexicanHat(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, centerY);
    ctx.lineTo(canvas.width - 50, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, 50);
    ctx.lineTo(centerX, canvas.height - 50);
    ctx.stroke();
    
    // Draw the Mexican hat potential curve (2D cross-section)
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00d4ff';
    
    ctx.beginPath();
    for (let x = -150; x <= 150; x++) {
        // Mexican hat potential: V(φ) = -μ²|φ|² + λ|φ|⁴
        const phi = x / 50; // Scale factor
        const V = -phi * phi + 0.25 * phi * phi * phi * phi;
        
        const screenX = centerX + x;
        const screenY = centerY - V * 50; // Scale and flip for display
        
        if (x === -150) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Mark the minima (vacuum expectation values)
    const vev = Math.sqrt(2); // Minimum at ±√(μ²/2λ)
    ctx.fillStyle = '#06ffa5';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#06ffa5';
    
    // Left minimum
    ctx.beginPath();
    ctx.arc(centerX - vev * 50, centerY + 50, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Right minimum
    ctx.beginPath();
    ctx.arc(centerX + vev * 50, centerY + 50, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Draw unstable maximum at origin
    ctx.fillStyle = '#ff006e';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Add rolling ball animation
    const ballAngle = Date.now() * 0.001;
    const ballX = centerX + Math.cos(ballAngle) * vev * 50;
    const ballPhi = Math.cos(ballAngle) * vev;
    const ballV = -ballPhi * ballPhi + 0.25 * ballPhi * ballPhi * ballPhi * ballPhi;
    const ballY = centerY - ballV * 50;
    
    ctx.fillStyle = '#ffb700';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffb700';
    ctx.beginPath();
    ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Labels
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Axis labels
    ctx.fillText('φ (Higgs field)', centerX, canvas.height - 20);
    ctx.save();
    ctx.translate(20, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('V(φ)', 0, 0);
    ctx.restore();
    
    // Feature labels
    ctx.fillStyle = '#ff006e';
    ctx.fillText('Unstable', centerX, centerY - 15);
    
    ctx.fillStyle = '#06ffa5';
    ctx.fillText('vev', centerX - vev * 50, centerY + 75);
    ctx.fillText('vev', centerX + vev * 50, centerY + 75);
    
    // Title
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '16px Arial';
    ctx.fillText('Higgs Potential (Mexican Hat)', centerX, 30);
    ctx.font = '12px Arial';
    ctx.fillText('Spontaneous Symmetry Breaking', centerX, 50);
    
    // Animate
    requestAnimationFrame(() => drawMexicanHat(canvas));
}

// Additional helper function for Feynman diagram wavy/curly lines
function drawFeynmanElements(ctx, type, x1, y1, x2, y2, label) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    switch(type) {
        case 'fermion':
            // Straight line with arrow
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Draw arrow in middle
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const angle = Math.atan2(dy, dx);
            
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-8, -4);
            ctx.lineTo(-8, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            break;
            
        case 'photon':
            // Wavy line
            ctx.beginPath();
            const waveSteps = 20;
            for (let i = 0; i <= waveSteps; i++) {
                const t = i / waveSteps;
                const x = x1 + dx * t;
                const y = y1 + dy * t + Math.sin(t * Math.PI * 4) * 8;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            break;
            
        case 'gluon':
            // Curly line
            ctx.beginPath();
            const curlLoops = 6;
            for (let i = 0; i <= curlLoops * 10; i++) {
                const t = i / (curlLoops * 10);
                const x = x1 + dx * t;
                const perpX = -dy / Math.sqrt(dx * dx + dy * dy);
                const perpY = dx / Math.sqrt(dx * dx + dy * dy);
                const offset = Math.sin(t * Math.PI * 2 * curlLoops) * 10;
                if (i === 0) ctx.moveTo(x + perpX * offset, y1 + dy * t + perpY * offset);
                else ctx.lineTo(x + perpX * offset, y1 + dy * t + perpY * offset);
            }
            ctx.stroke();
            break;
            
        case 'massive_boson':
            // Dashed line
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
    }
    
    // Add label if provided
    if (label) {
        ctx.fillStyle = '#e0e6ed';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 10);
    }
}