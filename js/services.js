// =================================
// SERVICES PAGE — services.js
// Dynamic · Firebase · Scroll Reveal
// Uses zcl-svc-* class names (zero conflicts)
// =================================
'use strict';

let allServices = [];

// Icon paths pool — one per card, cycles
const SVC_ICONS = [
    // Blockchain layers
    `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`,
    // Document / Smart Contract
    `<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
    // Globe / Web3
    `<path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>`,
    // Lightbulb / AI
    `<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>`,
    // Lock / Security
    `<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>`,
    // Stack / Token
    `<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>`,
];

// =================================
// INIT
// =================================
document.addEventListener('DOMContentLoaded', function () {
    loadServicesFromFirestore();
});

// =================================
// FIRESTORE FETCH
// =================================
async function loadServicesFromFirestore() {
    try {
        const snapshot = await db.collection('services')
            .orderBy('createdAt', 'asc')
            .get();

        allServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Hide full-page loader (from loader.js)
        if (typeof hideBlockchainLoader === 'function') hideBlockchainLoader();

        if (allServices.length > 0) {
            renderServices();
        } else {
            renderEmpty();
        }

    } catch (err) {
        console.error('Services load error:', err);
        if (typeof hideBlockchainLoader === 'function') hideBlockchainLoader();
        renderEmpty();
    }
}

// =================================
// RENDER
// =================================
function renderServices() {
    const container = document.getElementById('servicesDynamicContainer');
    if (!container) return;

    container.innerHTML = allServices.map(buildCard).join('');

    // Kick off scroll observer after DOM is populated
    requestAnimationFrame(() => observeCards());
}

function buildCard(svc, index) {
    const iconPath = SVC_ICONS[index % SVC_ICONS.length];

    const pointsHtml = (svc.points || []).map(pt => `
        <li class="zcl-svc-point">
            <span class="zcl-svc-tick">
                <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </span>
            <span>${esc(pt)}</span>
        </li>
    `).join('');

    const techsHtml = (svc.technologies || []).map(t =>
        `<span class="zcl-svc-chip">${esc(t)}</span>`
    ).join('');

    return `
        <div class="zcl-svc-card" data-index="${index}">

            <!-- Icon -->
            <div class="zcl-svc-icon">
                <svg viewBox="0 0 24 24">
                    ${iconPath}
                </svg>
            </div>

            <!-- Content -->
            <div class="zcl-svc-content">
                <h2 class="zcl-svc-title">${esc(svc.name)}</h2>

                ${svc.description
                    ? `<p class="zcl-svc-desc">${esc(svc.description)}</p>`
                    : ''}

                ${pointsHtml
                    ? `<ul class="zcl-svc-points">${pointsHtml}</ul>`
                    : ''}

                ${techsHtml
                    ? `<div class="zcl-svc-techs">${techsHtml}</div>`
                    : ''}

                <a href="contact.html" class="zcl-svc-btn">
                    Get Started
                    <svg viewBox="0 0 24 24">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </a>
            </div>

        </div>
    `;
}

function renderEmpty() {
    const container = document.getElementById('servicesDynamicContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="zcl-svc-empty">
            <div class="zcl-svc-empty-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <h3>Services Coming Soon</h3>
            <p>Our service offerings will be available shortly. Check back soon!</p>
        </div>
    `;
}

// =================================
// SCROLL REVEAL — IntersectionObserver
// =================================
function observeCards() {
    const cards = document.querySelectorAll('.zcl-svc-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const card = entry.target;

            if (entry.isIntersecting) {
                card.classList.remove('zcl-svc-exit-up');
                card.classList.add('zcl-svc-visible');
            } else {
                if (entry.boundingClientRect.top < 0) {
                    card.classList.remove('zcl-svc-visible');
                    card.classList.add('zcl-svc-exit-up');
                } else {
                    card.classList.remove('zcl-svc-visible', 'zcl-svc-exit-up');
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    cards.forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.07}s`;
        observer.observe(card);
    });
}

// =================================
// HELPER — XSS-safe HTML escape
// =================================
function esc(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
}