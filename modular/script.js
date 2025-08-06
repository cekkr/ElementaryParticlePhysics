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