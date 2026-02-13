// ============================================
// ZETTACORELAB ADMIN — admin.js
// Deep Navy + Violet Theme
// Image Compression · Icon Rail Sidebar · Datepicker
// ============================================

'use strict';

// ---- Auth ----
const ADMIN_USER = 'ADMIN';
const ADMIN_PASS = 'Admin@123';

// ---- State ----
let blogs          = [];
let editingId      = null;
let deleteTarget   = null;
let dp             = null;
let sbExpanded     = true;
let compressedB64  = null;    // result of compressImage()
let formBound      = false;   // prevent duplicate listeners

// ============================================
// IMAGE COMPRESSION
// Target ≤ 500 KB — accepts any size
// Two-phase: quality reduction → dimension scaling
// ============================================
const LIMIT = 500 * 1024;   // 500 KB in bytes

/**
 * @param {File} file
 * @returns {Promise<{base64:string, origKB:number, finalKB:number, compressed:boolean}>}
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Cannot load image'));
      img.onload = () => {
        const origKB = Math.round(file.size / 1024);

        // Already within limit → return as-is
        if (file.size <= LIMIT) {
          resolve({ base64: e.target.result, origKB, finalKB: origKB, compressed: false });
          return;
        }

        // Start dimensions — cap at 1920px
        let w = img.width, h = img.height;
        const maxDim = 1920;
        if (w > maxDim || h > maxDim) {
          const r = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }

        const canvas = document.createElement('canvas');
        const ctx    = canvas.getContext('2d');

        function tryEncode(cw, ch, q) {
          canvas.width = cw; canvas.height = ch;
          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(img, 0, 0, cw, ch);
          const data64 = canvas.toDataURL('image/jpeg', q);
          // Estimate real bytes from base64 length
          const header = 'data:image/jpeg;base64,'.length;
          const bytes  = Math.round((data64.length - header) * 0.75);
          return { data64, bytes };
        }

        // Phase 1 — reduce quality 0.85 → 0.10
        let quality = 0.85;
        let best = null, bestKB = origKB;
        for (let i = 0; i < 9 && quality >= 0.10; i++, quality = +(quality - 0.1).toFixed(2)) {
          const { data64, bytes } = tryEncode(w, h, quality);
          best = data64; bestKB = Math.round(bytes / 1024);
          if (bytes <= LIMIT) break;
        }

        // Phase 2 — scale down dimensions if still too large
        if (bestKB > Math.round(LIMIT / 1024)) {
          let scale = 0.85;
          while (scale >= 0.25) {
            const sw = Math.round(w * scale), sh = Math.round(h * scale);
            const { data64, bytes } = tryEncode(sw, sh, 0.70);
            best = data64; bestKB = Math.round(bytes / 1024);
            if (bytes <= LIMIT) break;
            scale = +(scale - 0.10).toFixed(2);
          }
        }

        resolve({ base64: best, origKB, finalKB: bestKB, compressed: true });
      };
      img.src = e.target.result;
    };
    fr.onerror = () => reject(new Error('File read failed'));
    fr.readAsDataURL(file);
  });
}

// ============================================
// DATEPICKER
// ============================================
class Datepicker {
  constructor() {
    this.input    = document.getElementById('blogDate');
    this.pop      = document.getElementById('dpPop');
    this.moEl     = document.getElementById('dpMo');
    this.gridEl   = document.getElementById('dpGrid');
    this.current  = new Date();
    this.selected = null;
    if (!this.input || !this.pop) return;
    this._bind();
    this.pick(new Date());
  }

  _bind() {
    this.input.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
    document.getElementById('dpPrev')?.addEventListener('click', () => { this.current.setMonth(this.current.getMonth() - 1); this.render(); });
    document.getElementById('dpNext')?.addEventListener('click', () => { this.current.setMonth(this.current.getMonth() + 1); this.render(); });
    document.getElementById('dpToday')?.addEventListener('click', () => { this.pick(new Date()); this.hide(); });
    document.getElementById('dpClear')?.addEventListener('click', () => { this.selected = null; this.input.value = ''; this.hide(); });
    document.addEventListener('click', e => {
      if (!this.pop.contains(e.target) && !this.input.contains(e.target)) this.hide();
    });
  }

  toggle() { this.pop.classList.toggle('show'); if (this.isOpen()) this.render(); }
  hide()   { this.pop.classList.remove('show'); }
  isOpen() { return this.pop.classList.contains('show'); }

  fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  same(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  pick(d) { this.selected = d; this.current = new Date(d); this.input.value = this.fmt(d); this.render(); }

  setStr(s) { if (!s) return; const d = new Date(s+'T00:00:00'); if (!isNaN(d)) this.pick(d); }

  reset() { this.pick(new Date()); }

  render() {
    if (!this.moEl || !this.gridEl) return;
    this.moEl.textContent = this.current.toLocaleDateString('en-US', { month:'long', year:'numeric' });
    this.gridEl.innerHTML = '';

    const yr = this.current.getFullYear(), mo = this.current.getMonth();
    const firstDow = new Date(yr, mo, 1).getDay();
    const lastDate = new Date(yr, mo+1, 0).getDate();
    const prevLast = new Date(yr, mo, 0).getDate();
    const today    = new Date();
    const trailing = (firstDow + lastDate) % 7 === 0 ? 0 : 7 - ((firstDow + lastDate) % 7);

    const mk = (n, cls) => {
      const el = document.createElement('div');
      el.className = `dp-day${cls ? ' '+cls : ''}`;
      el.textContent = n;
      return el;
    };

    for (let i = firstDow-1; i >= 0; i--) this.gridEl.appendChild(mk(prevLast-i, 'other'));

    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(yr, mo, d);
      let cls = '';
      if (this.same(date, today)) cls += ' today';
      if (this.selected && this.same(date, this.selected)) cls += ' sel';
      const el = mk(d, cls.trim());
      el.addEventListener('click', () => { this.pick(date); this.hide(); });
      this.gridEl.appendChild(el);
    }

    for (let d = 1; d <= trailing; d++) this.gridEl.appendChild(mk(d, 'other'));
  }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    initPanel();
  } else {
    showLogin();
  }
  bindLogin();
  bindSidebar();
  bindModal();
  bindSearch();
  bindDragDrop();
});

// ============================================
// LOGIN
// ============================================
function bindLogin() {
  document.getElementById('loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    const err = document.getElementById('loginErr');
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem('adminLoggedIn', 'true');
      initPanel();
    } else {
      err.textContent = 'Invalid username or password. Please try again.';
      err.classList.add('show');
      setTimeout(() => err.classList.remove('show'), 3500);
    }
  });
}

function showLogin() {
  document.getElementById('loginSection').style.display = 'flex';
  document.getElementById('adminPanel').style.display   = 'none';
}

function initPanel() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminPanel').style.display   = 'flex';
  // Drawer open by default on desktop
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('mainArea')?.classList.add('shifted');
  if (!dp) dp = new Datepicker();
  if (!formBound) { bindBlogForm(); formBound = true; }
  loadBlogs();
}

// ============================================
// SIDEBAR
// ============================================
function bindSidebar() {
  const sidebar = document.getElementById('sidebar');
  const back    = document.getElementById('sbBack');
  const mobBtn  = document.getElementById('mobMenuBtn');
  const deskBtn = document.getElementById('deskToggle');
  const sbTog   = document.getElementById('sbToggle');
  const main    = document.getElementById('mainArea');

  // Mobile open
  mobBtn?.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
    back.classList.add('show');
  });

  // Close via backdrop
  back?.addEventListener('click', closeMobile);

  function closeMobile() {
    sidebar.classList.remove('mobile-open');
    back.classList.remove('show');
  }

  // Desktop icon-toggle in topbar
  deskBtn?.addEventListener('click', () => toggleDesktop());

  // Desktop toggle inside sidebar footer
  sbTog?.addEventListener('click', () => toggleDesktop());

  function toggleDesktop() {
    sbExpanded = !sbExpanded;
    sidebar.classList.toggle('open', sbExpanded);
    main?.classList.toggle('shifted', sbExpanded);
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', e => {
    e.preventDefault();
    sessionStorage.removeItem('adminLoggedIn');
    showLogin();
    document.getElementById('loginForm')?.reset();
    closeMobile();
  });
}

// ============================================
// DRAG & DROP
// ============================================
function bindDragDrop() {
  const zone = document.getElementById('fileZone');
  if (!zone) return;
  ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag'); }));
  zone.addEventListener('drop', e => {
    const f = e.dataTransfer?.files?.[0];
    if (f?.type.startsWith('image/')) processImage(f);
  });
}

// ============================================
// BLOG FORM
// ============================================
function bindBlogForm() {
  document.getElementById('blogImage')?.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (f) processImage(f);
  });

  document.getElementById('blogForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    await doSave();
  });

  document.getElementById('cancelBtn')?.addEventListener('click', resetForm);
}

// Image processing + preview
async function processImage(file) {
  const prev = document.getElementById('imgPrev');
  const img  = document.getElementById('prevImg');
  const meta = document.getElementById('prevMeta');
  if (!prev || !img) return;

  prev.classList.add('show');
  img.style.opacity = '0.3';
  meta.innerHTML = '<span>⏳ Compressing image…</span>';

  try {
    const r = await compressImage(file);
    compressedB64 = r.base64;
    img.src = r.base64;
    img.style.opacity = '1';

    if (r.compressed) {
      meta.innerHTML = `<span>📦 ${r.origKB} KB → ${r.finalKB} KB</span><span class="ctag">✓ Compressed</span>`;
    } else {
      meta.innerHTML = `<span>📦 ${r.origKB} KB</span><span class="ctag" style="background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.25);color:var(--info)">✓ Ready</span>`;
    }
    console.log(`🖼 Image: ${r.origKB}KB → ${r.finalKB}KB, compressed=${r.compressed}`);
  } catch (err) {
    compressedB64 = null;
    prev.classList.remove('show');
    toast('Image error: ' + err.message, 'err');
  }
}

// Save
async function doSave() {
  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('submitTxt');
  const orig = txt.textContent;
  btn.disabled = true;
  txt.innerHTML = '<span class="spin"></span>&nbsp;Saving…';

  try {
    const data = {
      title:    val('blogTitle'),
      category: val('blogCategory'),
      author:   val('blogAuthor'),
      date:     val('blogDate'),
      readTime: val('blogReadTime'),
      featured: val('blogFeatured'),
      excerpt:  val('blogExcerpt'),
      content:  val('blogContent'),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (compressedB64) {
      data.imageUrl = compressedB64;
    } else if (editingId) {
      data.imageUrl = blogs.find(b => b.id === editingId)?.imageUrl || null;
    }

    if (!editingId) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    if (editingId) {
      await db.collection('blogs').doc(editingId).update(data);
      toast('Blog updated!', 'ok');
    } else {
      await db.collection('blogs').add(data);
      toast('Blog published!', 'ok');
    }

    resetForm();
    await loadBlogs();
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  } finally {
    btn.disabled = false;
    txt.textContent = orig;
  }
}

function val(id) { return document.getElementById(id)?.value?.trim() || ''; }

function resetForm() {
  document.getElementById('blogForm')?.reset();
  compressedB64 = null; editingId = null;

  const prev = document.getElementById('imgPrev');
  if (prev) {
    prev.classList.remove('show');
    document.getElementById('prevImg').src = '';
    document.getElementById('prevMeta').innerHTML = '';
  }

  document.getElementById('formTitle').textContent = 'Add New Blog Post';
  document.getElementById('submitTxt').textContent  = 'Add Blog Post';
  document.getElementById('cancelBtn').style.display = 'none';

  dp?.reset();
}

// ============================================
// LOAD BLOGS
// ============================================
async function loadBlogs() {
  try {
    const snap = await db.collection('blogs').orderBy('createdAt','desc').get();
    blogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable(blogs);
  } catch (e) {
    toast('Load error: ' + e.message, 'err');
    blogs = [];
    renderTable([]);
  }
}

// ============================================
// RENDER TABLE
// ============================================
function renderTable(list) {
  const tbody = document.getElementById('blogTbody');
  const empty = document.getElementById('emptyState');
  if (!tbody || !empty) return;

  if (!list.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(b => {
    const thumb = b.imageUrl
      ? `<img class="thumb" src="${b.imageUrl}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="thumb-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>`;

    const feat = b.featured === 'yes'
      ? `<span class="badge badge-feat"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Featured</span>`
      : `<span style="color:var(--t3)">—</span>`;

    return `<tr>
      <td>${thumb}</td>
      <td class="ttl-cell" title="${esc(b.title)}">${esc(b.title)}</td>
      <td><span class="badge badge-cat">${esc(b.category)}</span></td>
      <td style="color:var(--t2)">${esc(b.author)}</td>
      <td style="color:var(--t2);white-space:nowrap">${fmtDate(b.date)}</td>
      <td>${feat}</td>
      <td>
        <div class="act-cell">
          <button class="ibtn edit" onclick="editBlog('${b.id}')" title="Edit post">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="ibtn del" onclick="openDelete('${b.id}')" title="Delete post">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ============================================
// EDIT
// ============================================
window.editBlog = function(id) {
  const b = blogs.find(x => x.id === id);
  if (!b) return toast('Post not found', 'err');

  editingId = id; compressedB64 = null;
  ['blogTitle','blogCategory','blogAuthor','blogReadTime','blogFeatured','blogExcerpt','blogContent']
    .forEach(fid => {
      const el = document.getElementById(fid);
      const key = fid.replace('blog','').charAt(0).toLowerCase() + fid.replace('blog','').slice(1);
      const mapped = { Title:'title',Category:'category',Author:'author',ReadTime:'readTime',Featured:'featured',Excerpt:'excerpt',Content:'content' };
      const k = mapped[fid.replace('blog','')];
      if (el && b[k] !== undefined) el.value = b[k];
    });

  dp?.setStr(b.date);

  const prev = document.getElementById('imgPrev');
  if (b.imageUrl && prev) {
    document.getElementById('prevImg').src = b.imageUrl;
    document.getElementById('prevMeta').innerHTML = '<span style="color:var(--t2)">Existing image</span>';
    prev.classList.add('show');
  }

  document.getElementById('formTitle').textContent = 'Edit Blog Post';
  document.getElementById('submitTxt').textContent  = 'Update Blog Post';
  document.getElementById('cancelBtn').style.display = 'inline-flex';
  document.getElementById('blogForm')?.scrollIntoView({ behavior:'smooth', block:'start' });
};

// ============================================
// DELETE
// ============================================
window.openDelete = function(id) {
  deleteTarget = id;
  document.getElementById('deleteModal').classList.add('show');
};

function bindModal() {
  document.getElementById('confirmDelete')?.addEventListener('click', async () => {
    if (!deleteTarget) return;
    try {
      await db.collection('blogs').doc(deleteTarget).delete();
      toast('Post deleted', 'ok');
      closeModal();
      await loadBlogs();
    } catch (e) { toast('Delete failed: ' + e.message, 'err'); }
  });
  document.getElementById('cancelDelete')?.addEventListener('click', closeModal);
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('deleteModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('deleteModal')) closeModal();
  });
}

function closeModal() {
  document.getElementById('deleteModal').classList.remove('show');
  deleteTarget = null;
}

// ============================================
// SEARCH
// ============================================
function bindSearch() {
  document.getElementById('searchBlogs')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderTable(!q ? blogs : blogs.filter(b =>
      [b.title, b.category, b.author, b.excerpt].some(f => f?.toLowerCase().includes(q))
    ));
  });
}

// ============================================
// UTILITIES
// ============================================
function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s+'T00:00:00').toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }
  catch { return s; }
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

// ============================================
// TOAST
// ============================================
function toast(msg, type = 'ok') {
  const tray = document.getElementById('toastTray');
  if (!tray) return;

  const icons = {
    ok:  `<svg class="t-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    err: `<svg class="t-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
  };

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type]||''}<span>${msg}</span>`;
  tray.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3500);
}

console.log('✅ ZettaCoreLab admin.js loaded — violet/navy theme');