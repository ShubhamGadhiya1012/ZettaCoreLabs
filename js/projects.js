// =================================
// PROJECTS PAGE — projects.js
// Firebase · Dynamic Filter Chips · Detail Modal · SVG Logo Loader
// =================================
'use strict';

let allProjects  = [];
let activeFilter = 'all';

// =================================
// PAGE INIT
// =================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Projects page loaded with Firebase');
    showBlockchainLoader();
    loadProjectsFromFirestore();
});

// =================================
// LOAD PROJECTS FROM FIRESTORE
// =================================
async function loadProjectsFromFirestore() {
    try {
        console.log('📂 Loading projects from Firestore...');
        
        const snapshot = await db.collection('projects')
            .orderBy('createdAt', 'desc')
            .get();

        allProjects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('✅ Loaded', allProjects.length, 'projects from Firestore');

        // Hide loader immediately when data loads (don't wait for counter)
        hideBlockchainLoader();
        
        buildFilterChips();
        renderProjects(allProjects);

    } catch (error) {
        console.error('❌ Error loading projects:', error);
        hideBlockchainLoader();
        showProjectsEmpty('Error loading projects. Please refresh the page.');
    }
}

// =================================
// BUILD DYNAMIC FILTER CHIPS
// =================================
function buildFilterChips() {
    const container = document.getElementById('filterChipsContainer');
    if (!container) return;

    const cats = [...new Set(allProjects.map(p => p.category).filter(Boolean))];
    const countMap = {};
    allProjects.forEach(p => {
        if (p.category) countMap[p.category] = (countMap[p.category] || 0) + 1;
    });

    const allChip = `
        <button class="filter-chip active" data-filter="all" onclick="filterProjects('all', this)">
            All Projects <span class="chip-count">${allProjects.length}</span>
        </button>
    `;

    const catChips = cats.map(cat => `
        <button class="filter-chip" data-filter="${escHtml(cat)}" onclick="filterProjects('${escHtml(cat)}', this)">
            ${escHtml(cat)} <span class="chip-count">${countMap[cat] || 0}</span>
        </button>
    `).join('');

    container.innerHTML = allChip + catChips;
}

// =================================
// FILTER PROJECTS
// =================================
window.filterProjects = function (filter, chipEl) {
    activeFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    if (chipEl) chipEl.classList.add('active');
    const filtered = filter === 'all' ? allProjects : allProjects.filter(p => p.category === filter);
    renderProjects(filtered);
};

// =================================
// RENDER PROJECT CARDS (no stats)
// =================================
function renderProjects(list) {
    const grid = document.getElementById('projectsGridContainer');
    if (!grid) return;
    if (!list.length) {
        showProjectsEmpty('No projects in this category yet.');
        return;
    }
    grid.innerHTML = list.map((p, i) => buildProjectCard(p, i)).join('');
}

function buildProjectCard(p, index) {
    const imageHtml = p.imageUrl
        ? `<img src="${escHtml(p.imageUrl)}" alt="${escHtml(p.name)}" loading="lazy"
               onerror="this.parentElement.innerHTML='<div class=\\'project-image-placeholder\\'><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1\\'><rect x=\\'2\\' y=\\'3\\' width=\\'20\\' height=\\'14\\' rx=\\'2\\'/></svg></div>'">`
        : `<div class="project-image-placeholder">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                   <rect x="2" y="3" width="20" height="14" rx="2"/>
                   <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
               </svg>
           </div>`;

    const techTags = (p.technologies || []).slice(0, 4).map(t =>
        `<span class="project-tag">${escHtml(t)}</span>`
    ).join('');

    return `
        <article class="project-card" data-category="${escHtml(p.category)}" style="animation-delay:${index * 0.07}s">
            <div class="project-image">${imageHtml}</div>
            <div class="project-content">
                <div class="project-tags">${techTags}</div>
                <h3>${escHtml(p.name)}</h3>
                <p>${escHtml(p.description)}</p>
                <div class="project-footer">
                    <span class="project-year">${escHtml(p.year || '')}</span>
                    <button class="project-view-btn" onclick="viewProjectDetails('${p.id}')">
                        View Details
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </div>
            </div>
        </article>
    `;
}

function showProjectsEmpty(msg) {
    const grid = document.getElementById('projectsGridContainer');
    if (!grid) return;
    grid.innerHTML = `
        <div class="projects-empty">
            <div class="projects-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
            </div>
            <h3>${msg || 'No projects found'}</h3>
            <p>Check back soon for exciting blockchain projects!</p>
        </div>
    `;
}

// =================================
// VIEW PROJECT DETAILS MODAL (no stats)
// =================================
window.viewProjectDetails = function (projectId) {
    const p = allProjects.find(x => x.id === projectId);
    if (!p) return showErrNotif('Project not found!');

    const imageHtml = p.imageUrl
        ? `<img src="${escHtml(p.imageUrl)}" alt="${escHtml(p.name)}">`
        : `<div class="project-modal-image-placeholder">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                   <rect x="2" y="3" width="20" height="14" rx="2"/>
                   <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
               </svg>
           </div>`;

    const techTagsHtml = (p.technologies || []).map(t =>
        `<span class="modal-tech-tag">${escHtml(t)}</span>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = `
        <div class="project-modal-overlay" onclick="closeProjectModal()"></div>
        <div class="project-modal-wrapper">
            <div class="project-modal-image">${imageHtml}</div>
            <div class="project-modal-body">
                <button class="project-modal-close" onclick="closeProjectModal()" title="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <div class="project-modal-meta">
                    ${p.category ? `<span class="project-modal-category">${escHtml(p.category)}</span>` : ''}
                    ${p.year ? `<span class="project-modal-year">📅 ${escHtml(p.year)}</span>` : ''}
                </div>
                <h1 class="project-modal-title">${escHtml(p.name)}</h1>
                ${techTagsHtml ? `<div class="project-modal-techs">${techTagsHtml}</div>` : ''}
                <div class="project-modal-details">
                    ${formatProjectDetails(p.details || p.description)}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
};

window.closeProjectModal = function () {
    const modal = document.querySelector('.project-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
    }, 300);
};

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeProjectModal();
});

// =================================
// HELPERS
// =================================
function formatProjectDetails(content) {
    if (!content) return '<p>No details available.</p>';
    try {
        content = escHtml(content);
        return content.split('\n\n').map(p => {
            p = p.trim();
            if (!p) return '';
            if (p.startsWith('## ')) return `<h2>${p.substring(3)}</h2>`;
            if (p.startsWith('### ')) return `<h3>${p.substring(4)}</h3>`;
            if (p.startsWith('- ')) {
                const items = p.split('\n').map(item =>
                    item.startsWith('- ') ? `<li>${item.substring(2)}</li>` : ''
                ).join('');
                return `<ul>${items}</ul>`;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');
    } catch (e) {
        return `<p>${escHtml(content)}</p>`;
    }
}

function escHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
}

function showErrNotif(message) {
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;top:20px;right:20px;
        padding:1rem 1.5rem;
        background:#ef4444;color:white;
        border-radius:10px;
        box-shadow:0 4px 12px rgba(0,0,0,.3);
        z-index:10001;max-width:300px;font-weight:600;
    `;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

console.log('✅ projects.js with SVG Logo Loader loaded');