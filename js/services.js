'use strict';

let allServices = [];

const SVC_ICONS = [
    `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`,
    `<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
    `<path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>`,
    `<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>`,
    `<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>`,
    `<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>`,
];

// ── Config ────────────────────────────────────────────────────────────────────
const SCROLL_PER_CARD = 700;
const STACK_OFFSET    = 20;
const EASING          = 0.1;

// ── State ─────────────────────────────────────────────────────────────────────
let cardWraps    = [];
let currentY     = [];
let targetY      = [];
let stackTrackEl = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadServicesFromFirestore);

// ── Firestore ─────────────────────────────────────────────────────────────────
async function loadServicesFromFirestore() {
    try {
        const snapshot = await db.collection('services').orderBy('createdAt', 'asc').get();
        allServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof hideBlockchainLoader === 'function') hideBlockchainLoader();
        allServices.length > 0 ? renderServices() : renderEmpty();
    } catch (err) {
        console.error('Services load error:', err);
        if (typeof hideBlockchainLoader === 'function') hideBlockchainLoader();
        renderEmpty();
    }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderServices() {
    const container = document.getElementById('servicesDynamicContainer');
    if (!container) return;

    const total = allServices.length;

    container.innerHTML = `
        <div class="zcl-svc-stack-track" id="zclStackTrack">
            <div class="zcl-svc-stack-window" id="zclStackWindow">
                ${allServices.map((svc, i) => `
                    <div class="zcl-svc-card-wrap" id="zclWrap${i}" data-index="${i}">
                        ${buildCard(svc, i)}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    stackTrackEl = document.getElementById('zclStackTrack');
    cardWraps    = allServices.map((_, i) => document.getElementById(`zclWrap${i}`));

    stackTrackEl.style.height = `${total * SCROLL_PER_CARD + window.innerHeight}px`;

    const wh = window.innerHeight;
    cardWraps.forEach((wrap, i) => {
        const y = i === 0 ? 0 : wh;
        currentY[i] = y;
        targetY[i]  = y;
        wrap.style.transform = `translateY(calc(-50% + ${y}px))`;
        wrap.style.zIndex    = String(i + 1);
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    onScroll();
    rafLoop();
}

// ── Scroll logic ──────────────────────────────────────────────────────────────
function onScroll() {
    if (!stackTrackEl) return;

    const total    = allServices.length;
    const wh       = window.innerHeight;
    const scrolled = -stackTrackEl.getBoundingClientRect().top;

    cardWraps.forEach((wrap, i) => {
        const settleAt  = i * SCROLL_PER_CARD;
        const slideFrom = settleAt - SCROLL_PER_CARD;

        let y, zIndex;

        if (i === 0) {
            if (scrolled <= 0) {
                y = 0; zIndex = 1;
            } else if (scrolled < SCROLL_PER_CARD) {
                y = 0; zIndex = 1;
            } else {
                const above = Math.min(
                    Math.floor((scrolled - SCROLL_PER_CARD) / SCROLL_PER_CARD),
                    total - 1
                );
                y = above * STACK_OFFSET; zIndex = 1;
            }
        } else {
            if (scrolled < slideFrom) {
                y = wh + 100; zIndex = i + 1;
            } else if (scrolled < settleAt) {
                const progress = (scrolled - slideFrom) / SCROLL_PER_CARD;
                y      = wh * (1 - progress);
                zIndex = total + 10 + i;
            } else {
                const above = Math.min(
                    Math.floor((scrolled - settleAt) / SCROLL_PER_CARD),
                    total - 1 - i
                );
                y = above * STACK_OFFSET; zIndex = i + 1;
            }
        }

        targetY[i]        = y;
        wrap.style.zIndex = String(zIndex);
    });
}

// ── rAF lerp ──────────────────────────────────────────────────────────────────
function rafLoop() {
    requestAnimationFrame(rafLoop);
    cardWraps.forEach((wrap, i) => {
        const diff = targetY[i] - currentY[i];
        currentY[i] += Math.abs(diff) > 0.05 ? diff * EASING : diff;
        wrap.style.transform = `translateY(calc(-50% + ${currentY[i]}px))`;
    });
}

// ── Resize ────────────────────────────────────────────────────────────────────
function onResize() {
    if (!stackTrackEl) return;
    stackTrackEl.style.height = `${allServices.length * SCROLL_PER_CARD + window.innerHeight}px`;
    onScroll();
}

// ── Build card HTML ───────────────────────────────────────────────────────────
function buildCard(svc, index) {
    const iconPath = SVC_ICONS[index % SVC_ICONS.length];

    const pointsHtml = (svc.points || []).map(pt => `
        <li class="zcl-svc-point">
            <span class="zcl-svc-tick">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span>${esc(pt)}</span>
        </li>
    `).join('');

    const techsHtml = (svc.technologies || []).map(t =>
        `<span class="zcl-svc-chip">${esc(t)}</span>`
    ).join('');

    return `
        <div class="zcl-svc-card" data-index="${index}">
            <div class="zcl-svc-icon">
                <svg viewBox="0 0 24 24">${iconPath}</svg>
            </div>
            <div class="zcl-svc-content">
                <h2 class="zcl-svc-title">${esc(svc.name)}</h2>
                ${svc.description ? `<p class="zcl-svc-desc">${esc(svc.description)}</p>` : ''}
                ${pointsHtml     ? `<ul class="zcl-svc-points">${pointsHtml}</ul>` : ''}
                ${techsHtml      ? `<div class="zcl-svc-techs">${techsHtml}</div>` : ''}
                <a href="contact.html" class="zcl-svc-btn">
                    Get Started
                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
            </div>
        </div>
    `;
}

// ── Empty state ───────────────────────────────────────────────────────────────
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

// ── XSS-safe escape ───────────────────────────────────────────────────────────
function esc(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
}