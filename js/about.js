// =================================
// ABOUT PAGE — about.js
// Dynamic Leadership Team · Firebase · Slider Style
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
// RENDER TEAM MEMBERS — Slider
// =================================
function renderTeamMembers() {
    const container = document.getElementById('teamGridDynamic');
    if (!container) return;

    const loadingState = document.getElementById('teamLoadingState');
    if (loadingState) loadingState.remove();

    container.classList.remove('team-grid-dynamic');
    container.classList.add('team-slider-wrapper');

    container.innerHTML = `
        <div class="team-slider-row">
            <button class="team-arrow team-arrow-prev" id="teamPrev" aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <div class="team-slider-viewport" id="teamSliderViewport">
                <div class="team-slider-track" id="teamSliderTrack">
                    ${allTeamMembers.map((member, index) => buildTeamCard(member, index)).join('')}
                </div>
            </div>

            <button class="team-arrow team-arrow-next" id="teamNext" aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
        </div>

        <div class="team-slider-nav" id="teamSliderNav">
            ${allTeamMembers.map((_, i) => `<button class="team-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Go to member ${i + 1}"></button>`).join('')}
        </div>
    `;

    initSlider();
    setupTeamCardAnimations();
}

// =================================
// SLIDER LOGIC
// =================================
function initSlider() {
    const track       = document.getElementById('teamSliderTrack');
    const dots        = document.querySelectorAll('.team-dot');
    const prevBtn     = document.getElementById('teamPrev');
    const nextBtn     = document.getElementById('teamNext');
    const viewport    = document.getElementById('teamSliderViewport');

    if (!track) return;

    let current    = 0;
    let autoTimer  = null;
    const total    = allTeamMembers.length;
    const AUTO_DELAY = 3500;

    function getVisibleCount() {
        const w = window.innerWidth;
        if (w >= 1200) return Math.min(4, total);
        if (w >= 900)  return Math.min(3, total);
        if (w >= 576)  return Math.min(2, total);
        return 1;
    }

    function getMaxIndex() {
        return Math.max(0, total - getVisibleCount());
    }

    function goTo(index, resetAuto) {
        const maxIndex = getMaxIndex();
        // Wrap around
        if (index < 0) index = maxIndex;
        if (index > maxIndex) index = 0;
        current = index;

        const cards = track.querySelectorAll('.team-card');
        if (!cards.length) return;

        const gap    = parseInt(getComputedStyle(track).gap) || 32;
        const cardW  = cards[0].offsetWidth;
        track.style.transform = `translateX(-${current * (cardW + gap)}px)`;

        // Dots
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));

        if (resetAuto !== false) startAuto();
    }

    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo(current + 1, false), AUTO_DELAY);
    }

    // Dot clicks
    dots.forEach(dot => dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index))));

    // Arrow clicks
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

    // Pause on hover
    if (viewport) {
        viewport.addEventListener('mouseenter', () => clearInterval(autoTimer));
        viewport.addEventListener('mouseleave', () => startAuto());
    }

    // Touch swipe
    let touchStartX = 0;
    if (viewport) {
        viewport.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        viewport.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
        });
    }

    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
    });

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => goTo(current, false), 100);
    });

    goTo(0, false);
    startAuto();
}

// =================================
// BUILD TEAM CARD — Static Style (unchanged)
// =================================
function buildTeamCard(member, index) {
    const delay = (index * 0.07).toFixed(2);

    const imageContent = member.imageUrl
        ? `<img
                src="${escHtml(member.imageUrl)}"
                alt="${escHtml(member.name)}"
                loading="lazy"
                style="width:100%;height:100%;object-fit:cover;object-position:center top;border-radius:50%;"
                onerror="this.style.display='none'"
           >`
        : '';

    return `
        <div class="team-card" style="animation-delay:${delay}s; opacity:0; transform:translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease;" data-member-id="${escHtml(member.id)}">
            <div class="team-image">
                ${imageContent}
            </div>
            <h3>${escHtml(member.name)}</h3>
            <p class="team-role">${escHtml(member.designation)}</p>
            <p>${escHtml(member.experience)}</p>
        </div>
    `;
}

// =================================
// RENDER EMPTY STATE
// =================================
function renderTeamEmpty() {
    const container = document.getElementById('teamGridDynamic');
    if (!container) return;

    const loadingState = document.getElementById('teamLoadingState');
    if (loadingState) loadingState.remove();

    container.innerHTML = `
        <div class="team-empty" style="grid-column:1/-1; padding:5rem 2rem; text-align:center; color:var(--text-muted);">
            <div class="team-empty-icon" style="width:72px;height:72px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:36px;height:36px;color:rgba(124,58,237,0.5);">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
            </div>
            <h3 style="font-size:1.35rem;color:var(--text-secondary);margin-bottom:0.5rem;">Team Coming Soon</h3>
            <p>Our leadership team profiles will be available shortly.</p>
        </div>
    `;
}

// =================================
// INTERSECTION OBSERVER — CARD ANIMATIONS
// =================================
function setupTeamCardAnimations() {
    const cards = document.querySelectorAll('.team-card[data-member-id]');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(card => observer.observe(card));
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

console.log('✅ about.js with auto-slider loaded');