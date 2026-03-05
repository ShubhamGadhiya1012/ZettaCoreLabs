// =================================
// SERVICES PAGE — services.js
// Dynamic · Firebase · SVG Logo Loader
// =================================
'use strict';

let allServices = [];

// =================================
// PAGE INIT
// =================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Services page loaded with Firebase');
    showBlockchainLoader();
    loadServicesFromFirestore();
});

// =================================
// LOAD SERVICES FROM FIRESTORE
// =================================
async function loadServicesFromFirestore() {
    try {
        console.log('📂 Loading services from Firestore...');

        const snapshot = await db.collection('services')
            .orderBy('createdAt', 'asc')
            .get();

        allServices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('✅ Loaded', allServices.length, 'services from Firestore');

        // Hide loader immediately when data is ready
        hideBlockchainLoader();

        if (allServices.length > 0) {
            renderServices();
        } else {
            renderServicesEmpty();
        }

    } catch (error) {
        console.error('❌ Error loading services:', error);
        hideBlockchainLoader();
        renderServicesEmpty();
    }
}

// =================================
// RENDER SERVICE CARDS
// =================================
function renderServices() {
    const container = document.getElementById('servicesDynamicContainer');
    if (!container) return;

    container.innerHTML = allServices.map((svc, index) => buildServiceCard(svc, index)).join('');
}

function buildServiceCard(svc, index) {
    const delay = (index * 0.07).toFixed(2);

    // Feature points with tick marks
    const pointsHtml = (svc.points || []).map(pt => `
        <div class="service-point-item">
            <span class="service-point-tick">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </span>
            <span>${escHtml(pt)}</span>
        </div>
    `).join('');

    // Technology chips
    const techsHtml = (svc.technologies || []).map(t =>
        `<span class="service-tech-chip">${escHtml(t)}</span>`
    ).join('');

    return `
        <div class="service-card-dyn" style="animation-delay:${delay}s">
            <div class="service-card-header">
                <div class="service-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <div class="service-card-titles">
                    <h3 class="service-card-name">${escHtml(svc.name)}</h3>
                </div>
            </div>
            <div class="service-card-body">
                <p class="service-card-desc">${escHtml(svc.description)}</p>
                ${pointsHtml ? `<div class="service-card-points">${pointsHtml}</div>` : ''}
                ${techsHtml ? `<div class="service-card-techs">${techsHtml}</div>` : ''}
            </div>
            <div class="service-card-footer">
                <a href="contact.html" class="service-cta-btn">
                    Get Started
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </a>
            </div>
        </div>
    `;
}

function renderServicesEmpty() {
    const container = document.getElementById('servicesDynamicContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="services-empty">
            <div class="services-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <h3>Services Coming Soon</h3>
            <p>Our service offerings will be available shortly. Check back soon!</p>
        </div>
    `;
}

// =================================
// HELPERS
// =================================
function escHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

console.log('✅ services.js with dynamic services loaded');