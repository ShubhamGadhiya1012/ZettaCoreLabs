// =================================
// ABOUT PAGE — about.js
// Dynamic Leadership Team · Firebase · SVG Logo Loader
// =================================
'use strict';

let allTeamMembers = [];

// =================================
// PAGE INIT
// =================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('About page loaded with Firebase');
    showBlockchainLoader();
    loadTeamMembersFromFirestore();
});

// =================================
// LOAD TEAM MEMBERS FROM FIRESTORE
// =================================
async function loadTeamMembersFromFirestore() {
    try {
        console.log('📂 Loading team members from Firestore...');

        const snapshot = await db.collection('teamMembers')
            .orderBy('createdAt', 'asc')
            .get();

        allTeamMembers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('✅ Loaded', allTeamMembers.length, 'team members');

        // Hide loader immediately when data is ready
        hideBlockchainLoader();

        if (allTeamMembers.length > 0) {
            renderTeamMembers();
        } else {
            renderTeamEmpty();
        }

    } catch (error) {
        console.error('❌ Error loading team members:', error);
        hideBlockchainLoader();
        renderTeamEmpty();
    }
}

// =================================
// RENDER TEAM MEMBERS GRID
// =================================
function renderTeamMembers() {
    const container = document.getElementById('teamGridDynamic');
    if (!container) return;

    // Remove loading state if still present
    const loadingState = document.getElementById('teamLoadingState');
    if (loadingState) loadingState.remove();

    container.innerHTML = allTeamMembers.map((member, index) => buildTeamCard(member, index)).join('');

    setupTeamCardAnimations();
}

function buildTeamCard(member, index) {
    const initials = getTeamInitials(member.name);
    const delay = (index * 0.07).toFixed(2);

    const imageContent = member.imageUrl
        ? `<img class="team-card-img" src="${escHtml(member.imageUrl)}" alt="${escHtml(member.name)}"
               loading="lazy"
               onerror="this.parentElement.innerHTML = '<div class=\\'team-card-avatar\\'>${escHtml(initials)}</div>'">`
        : `<div class="team-card-avatar">${escHtml(initials)}</div>`;

    return `
        <article class="team-card-dynamic" style="animation-delay:${delay}s" data-member-id="${member.id}">
            <div class="team-card-image-wrap">
                ${imageContent}
                <div class="team-card-badge">${escHtml(member.designation)}</div>
            </div>
            <div class="team-card-body">
                <h3 class="team-card-name">${escHtml(member.name)}</h3>
                <div class="team-card-role">${escHtml(member.designation)}</div>
                <div class="team-card-exp">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    ${escHtml(member.experience)}
                </div>
            </div>
        </article>
    `;
}

function renderTeamEmpty() {
    const container = document.getElementById('teamGridDynamic');
    if (!container) return;

    // Remove loading state if still present
    const loadingState = document.getElementById('teamLoadingState');
    if (loadingState) loadingState.remove();

    container.innerHTML = `
        <div class="team-empty">
            <div class="team-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
            </div>
            <h3>Team Coming Soon</h3>
            <p>Our leadership team profiles will be available shortly.</p>
        </div>
    `;
}

// =================================
// INTERSECTION OBSERVER — CARD ANIMATIONS
// =================================
function setupTeamCardAnimations() {
    const cards = document.querySelectorAll('.team-card-dynamic');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(card => {
        observer.observe(card);
    });
}

// =================================
// HELPERS
// =================================
function getTeamInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(w => w[0] || '')
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function escHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

console.log('✅ about.js with dynamic team members loaded');