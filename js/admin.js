// ============================================
// ZETTACORELAB ADMIN — admin.js
// Blog · Category Master · Technology Master · Project Master
// + Year Picker · Pagination (10/page) · Loading States
// ============================================
'use strict';

const ADMIN_USER = 'ADMIN';
const ADMIN_PASS = 'Admin@123';

// ---- State ----
let blogs             = [];
let categoryList      = [];
let techList          = [];
let projects          = [];
let editingBlogId     = null;
let editingCategoryId = null;
let editingTechId     = null;
let editingProjectId  = null;
let deleteTarget      = null;
let deleteType        = null;
let dp                = null;
let yp                = null;
let sbExpanded        = true;
let compressedB64Blog    = null;
let compressedB64Project = null;
let formBound         = false;
let selectedTechs     = [];

// ---- Pagination state ----
const PAGE_SIZE = 10;
let blogPage    = 1;
let catPage     = 1;
let techPage    = 1;
let projectPage = 1;

// ============================================
// IMAGE COMPRESSION (<=500 KB)
// ============================================
const LIMIT = 500 * 1024;
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Cannot load image'));
      img.onload = () => {
        const origKB = Math.round(file.size / 1024);
        if (file.size <= LIMIT) { resolve({ base64: e.target.result, origKB, finalKB: origKB, compressed: false }); return; }
        let w = img.width, h = img.height;
        const maxDim = 1920;
        if (w > maxDim || h > maxDim) { const r = Math.min(maxDim/w, maxDim/h); w = Math.round(w*r); h = Math.round(h*r); }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        function tryEncode(cw, ch, q) {
          canvas.width = cw; canvas.height = ch;
          ctx.clearRect(0,0,cw,ch); ctx.drawImage(img,0,0,cw,ch);
          const data64 = canvas.toDataURL('image/jpeg', q);
          const bytes  = Math.round((data64.length - 'data:image/jpeg;base64,'.length) * 0.75);
          return { data64, bytes };
        }
        let quality = 0.85, best = null, bestKB = origKB;
        for (let i = 0; i < 9 && quality >= 0.10; i++, quality = +(quality-0.1).toFixed(2)) {
          const { data64, bytes } = tryEncode(w, h, quality);
          best = data64; bestKB = Math.round(bytes/1024);
          if (bytes <= LIMIT) break;
        }
        if (bestKB > Math.round(LIMIT/1024)) {
          let scale = 0.85;
          while (scale >= 0.25) {
            const { data64, bytes } = tryEncode(Math.round(w*scale), Math.round(h*scale), 0.70);
            best = data64; bestKB = Math.round(bytes/1024);
            if (bytes <= LIMIT) break;
            scale = +(scale-0.10).toFixed(2);
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
// DATEPICKER (Blog)
// ============================================
class Datepicker {
  constructor() {
    this.input  = document.getElementById('blogDate');
    this.pop    = document.getElementById('dpPop');
    this.moEl   = document.getElementById('dpMo');
    this.gridEl = document.getElementById('dpGrid');
    this.current = new Date(); this.selected = null;
    if (!this.input || !this.pop) return;
    this._bind(); this.pick(new Date());
  }
  _bind() {
    this.input.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
    document.getElementById('dpPrev')?.addEventListener('click', () => { this.current.setMonth(this.current.getMonth()-1); this.render(); });
    document.getElementById('dpNext')?.addEventListener('click', () => { this.current.setMonth(this.current.getMonth()+1); this.render(); });
    document.getElementById('dpToday')?.addEventListener('click', () => { this.pick(new Date()); this.hide(); });
    document.getElementById('dpClear')?.addEventListener('click', () => { this.selected=null; this.input.value=''; this.hide(); });
    document.addEventListener('click', e => { if (!this.pop.contains(e.target) && !this.input.contains(e.target)) this.hide(); });
  }
  toggle() { this.pop.classList.toggle('show'); if (this.isOpen()) this.render(); }
  hide()   { this.pop.classList.remove('show'); }
  isOpen() { return this.pop.classList.contains('show'); }
  fmt(d)   { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  same(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
  pick(d)  { this.selected=d; this.current=new Date(d); this.input.value=this.fmt(d); this.render(); }
  setStr(s){ if(!s)return; const d=new Date(s+'T00:00:00'); if(!isNaN(d)) this.pick(d); }
  reset()  { this.pick(new Date()); }
  render() {
    if (!this.moEl||!this.gridEl) return;
    this.moEl.textContent = this.current.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    this.gridEl.innerHTML = '';
    const yr=this.current.getFullYear(), mo=this.current.getMonth();
    const firstDow=new Date(yr,mo,1).getDay(), lastDate=new Date(yr,mo+1,0).getDate(), prevLast=new Date(yr,mo,0).getDate();
    const today=new Date(), trailing=(firstDow+lastDate)%7===0?0:7-(firstDow+lastDate)%7;
    const mk=(n,cls)=>{ const el=document.createElement('div'); el.className=`dp-day${cls?' '+cls:''}`; el.textContent=n; return el; };
    for (let i=firstDow-1;i>=0;i--) this.gridEl.appendChild(mk(prevLast-i,'other'));
    for (let d=1;d<=lastDate;d++) {
      const date=new Date(yr,mo,d); let cls='';
      if(this.same(date,today)) cls+=' today';
      if(this.selected&&this.same(date,this.selected)) cls+=' sel';
      const el=mk(d,cls.trim());
      el.addEventListener('click',()=>{ this.pick(date); this.hide(); });
      this.gridEl.appendChild(el);
    }
    for (let d=1;d<=trailing;d++) this.gridEl.appendChild(mk(d,'other'));
  }
}

// ============================================
// YEAR PICKER (Project Master) — Custom popup
// ============================================
class YearPicker {
  constructor() {
    this.input   = document.getElementById('projectYearDisplay');
    this.hidden  = document.getElementById('projectYear');
    this.pop     = document.getElementById('ypPop');
    this.rangeEl = document.getElementById('ypRange');
    this.gridEl  = document.getElementById('ypGrid');
    this.selected  = null;
    this.pageSize  = 12;
    this.pageStart = Math.floor(new Date().getFullYear() / this.pageSize) * this.pageSize;
    if (!this.input||!this.pop) return;
    this._bind();
    this.pick(new Date().getFullYear());
  }
  _bind() {
    this.input.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
    document.getElementById('ypPrev')?.addEventListener('click', e => { e.stopPropagation(); this.pageStart -= this.pageSize; if (this.pageStart < 1900) this.pageStart = 1900; this.render(); });
    document.getElementById('ypNext')?.addEventListener('click', e => { e.stopPropagation(); this.pageStart += this.pageSize; this.render(); });
    document.getElementById('ypClear')?.addEventListener('click', e => { e.stopPropagation(); this.clear(); });
    document.getElementById('ypNow')?.addEventListener('click',  e => { e.stopPropagation(); this.pick(new Date().getFullYear()); this.hide(); });
    document.addEventListener('click', e => { if (this.pop&&!this.pop.contains(e.target)&&!this.input.contains(e.target)) this.hide(); });
  }
  toggle() {
    if (this.pop.classList.contains('show')) { this.hide(); return; }
    const ref = this.selected || new Date().getFullYear();
    this.pageStart = Math.floor(ref / this.pageSize) * this.pageSize;
    this.pop.classList.add('show');
    this.render();
  }
  hide()  { this.pop.classList.remove('show'); }
  pick(y) { this.selected=y; this.input.value=y; this.hidden.value=y; this.render(); }
  clear() { this.selected=null; this.input.value=''; this.hidden.value=''; this.hide(); }
  reset() { this.pick(new Date().getFullYear()); }
  setVal(v) { if(v) this.pick(parseInt(v,10)); }
  render() {
    if (!this.rangeEl||!this.gridEl) return;
    const end = this.pageStart + this.pageSize - 1;
    this.rangeEl.textContent = `${this.pageStart} – ${end}`;
    const cur = new Date().getFullYear();
    this.gridEl.innerHTML = '';
    for (let y=this.pageStart; y<=end; y++) {
      const el = document.createElement('div');
      el.className = 'yp-year';
      if (y===this.selected) el.classList.add('sel');
      if (y===cur)           el.classList.add('current');
      el.textContent = y;
      el.addEventListener('click', e => { e.stopPropagation(); this.pick(y); this.hide(); });
      this.gridEl.appendChild(el);
    }
  }
}

// ============================================
// LOADING HELPERS
// ============================================
function showTableLoader(tbodyId, emptyId, colSpan) {
  const tbody = document.getElementById(tbodyId);
  const empty = document.getElementById(emptyId);
  if (empty) empty.style.display = 'none';
  if (tbody) {
    tbody.innerHTML = `<tr class="loader-row"><td colspan="${colSpan}">
      <div class="tbl-loader">
        <div class="tbl-loader-inner">
          <div class="tbl-spinner"></div>
          <span class="tbl-loader-txt">Loading data from database…</span>
        </div>
      </div>
    </td></tr>`;
  }
}

// ============================================
// PAGINATION
// ============================================
function paginate(list, page) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const p     = Math.min(Math.max(1, page), pages);
  return { items: list.slice((p-1)*PAGE_SIZE, p*PAGE_SIZE), page: p, pages, total };
}

function buildPagination(containerId, page, pages, total, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!total) { el.innerHTML=''; return; }

  const s = (page-1)*PAGE_SIZE+1, e = Math.min(page*PAGE_SIZE, total);
  let html = `<div class="pg-info">Showing <strong>${s}–${e}</strong> of <strong>${total}</strong> records</div><div class="pg-btns">`;

  const fnStr = `function(p){${onPageChange.toString().replace(/^.*?{/, '').replace(/}$/, '')}renderBlogTable&&0}`;

  // Build inline handlers using a global helper approach
  const cbKey = '_pgCb_' + containerId;
  window[cbKey] = onPageChange;

  html += `<button class="pg-btn pg-nav${page===1?' disabled':''}" ${page===1?'disabled':''} onclick="window['${cbKey}'](${page-1})">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
  </button>`;

  let startP = Math.max(1,page-2), endP = Math.min(pages,page+2);
  if (page<=3) endP=Math.min(pages,5);
  if (page>=pages-2) startP=Math.max(1,pages-4);

  if (startP>1) {
    html += `<button class="pg-btn" onclick="window['${cbKey}'](1)">1</button>`;
    if (startP>2) html += `<span class="pg-dots">•••</span>`;
  }
  for (let i=startP;i<=endP;i++) {
    html += `<button class="pg-btn${i===page?' active':''}" onclick="window['${cbKey}'](${i})">${i}</button>`;
  }
  if (endP<pages) {
    if (endP<pages-1) html += `<span class="pg-dots">•••</span>`;
    html += `<button class="pg-btn" onclick="window['${cbKey}'](${pages})">${pages}</button>`;
  }

  html += `<button class="pg-btn pg-nav${page===pages?' disabled':''}" ${page===pages?'disabled':''} onclick="window['${cbKey}'](${page+1})">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
  </button></div>`;

  el.innerHTML = html;
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') { initPanel(); } else { showLogin(); }
  bindLogin(); bindSidebar(); bindModal(); bindSearchAll(); bindDragDrop();
});

// ============================================
// LOGIN
// ============================================
function bindLogin() {
  document.getElementById('loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const u=document.getElementById('username').value.trim(), p=document.getElementById('password').value;
    const err=document.getElementById('loginErr');
    if (u===ADMIN_USER&&p===ADMIN_PASS) { sessionStorage.setItem('adminLoggedIn','true'); initPanel(); }
    else { err.textContent='Invalid username or password.'; err.classList.add('show'); setTimeout(()=>err.classList.remove('show'),3500); }
  });
}
function showLogin() {
  document.getElementById('loginSection').style.display='flex';
  document.getElementById('adminPanel').style.display='none';
}
function initPanel() {
  document.getElementById('loginSection').style.display='none';
  document.getElementById('adminPanel').style.display='flex';
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('mainArea')?.classList.add('shifted');
  if (!dp) dp = new Datepicker();
  if (!yp) yp = new YearPicker();
  if (!formBound) { bindBlogForm(); bindCategoryForm(); bindTechForm(); bindProjectForm(); formBound=true; }
  loadBlogs(); loadCategoryList(); loadTechList(); loadProjects();
}

// ============================================
// SIDEBAR + NAVIGATION
// ============================================
function bindSidebar() {
  const sidebar=document.getElementById('sidebar'), back=document.getElementById('sbBack'),
        mobBtn=document.getElementById('mobMenuBtn'), deskBtn=document.getElementById('deskToggle'),
        sbTog=document.getElementById('sbToggle'), main=document.getElementById('mainArea');
  mobBtn?.addEventListener('click',()=>{ sidebar.classList.add('mobile-open'); back.classList.add('show'); });
  back?.addEventListener('click', closeMobile);
  function closeMobile(){ sidebar.classList.remove('mobile-open'); back.classList.remove('show'); }
  deskBtn?.addEventListener('click', toggleDesktop);
  sbTog?.addEventListener('click', toggleDesktop);
  function toggleDesktop(){ sbExpanded=!sbExpanded; sidebar.classList.toggle('open',sbExpanded); main?.classList.toggle('shifted',sbExpanded); }
  document.querySelectorAll('.sb-item[data-section]').forEach(item=>{
    item.addEventListener('click',e=>{
      e.preventDefault();
      const sid=item.dataset.section, title=item.querySelector('.sb-lbl')?.textContent||'';
      document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
      document.getElementById(sid)?.classList.add('active');
      document.getElementById('pageTitle').textContent=title;
      closeMobile();
    });
  });
  document.getElementById('logoutBtn')?.addEventListener('click',e=>{
    e.preventDefault(); sessionStorage.removeItem('adminLoggedIn'); showLogin();
    document.getElementById('loginForm')?.reset(); closeMobile();
  });
}

// ============================================
// DRAG & DROP
// ============================================
function bindDragDrop() {
  bindZoneDrop('fileZone','blogImage',f=>processImageFor(f,'blog'));
  bindZoneDrop('projFileZone','projectImage',f=>processImageFor(f,'project'));
}
function bindZoneDrop(zoneId, inputId, handler) {
  const zone=document.getElementById(zoneId); if(!zone)return;
  ['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('drag');}));
  zone.addEventListener('drop',e=>{ const f=e.dataTransfer?.files?.[0]; if(f?.type.startsWith('image/')) handler(f); });
}

// ============================================
// BLOG FORM
// ============================================
function bindBlogForm() {
  document.getElementById('blogImage')?.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f) processImageFor(f,'blog'); });
  document.getElementById('blogForm')?.addEventListener('submit',async e=>{ e.preventDefault(); await saveBlog(); });
  document.getElementById('cancelBtn')?.addEventListener('click',resetBlogForm);
}
async function processImageFor(file, target) {
  const prevId=target==='blog'?'imgPrev':'projImgPrev', imgId=target==='blog'?'prevImg':'projPrevImg', metaId=target==='blog'?'prevMeta':'projPrevMeta';
  const prev=document.getElementById(prevId), img=document.getElementById(imgId), meta=document.getElementById(metaId);
  if(!prev||!img)return;
  prev.classList.add('show'); img.style.opacity='0.3'; meta.innerHTML='<span>⏳ Compressing…</span>';
  try {
    const r=await compressImage(file);
    if(target==='blog') compressedB64Blog=r.base64; else compressedB64Project=r.base64;
    img.src=r.base64; img.style.opacity='1';
    meta.innerHTML=r.compressed
      ?`<span>📦 ${r.origKB} KB → ${r.finalKB} KB</span><span class="ctag">✓ Compressed</span>`
      :`<span>📦 ${r.origKB} KB</span><span class="ctag" style="background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.25);color:var(--info)">✓ Ready</span>`;
  } catch(err) {
    if(target==='blog') compressedB64Blog=null; else compressedB64Project=null;
    prev.classList.remove('show'); toast('Image error: '+err.message,'err');
  }
}
async function saveBlog() {
  const btn=document.getElementById('submitBtn'), txt=document.getElementById('submitTxt');
  btn.disabled=true; txt.innerHTML='<span class="spin"></span>&nbsp;Saving…';
  try {
    const data={ title:val('blogTitle'),category:val('blogCategory'),author:val('blogAuthor'),date:val('blogDate'),readTime:val('blogReadTime'),featured:val('blogFeatured'),excerpt:val('blogExcerpt'),content:val('blogContent'),updatedAt:firebase.firestore.FieldValue.serverTimestamp() };
    if(compressedB64Blog) data.imageUrl=compressedB64Blog;
    else if(editingBlogId) data.imageUrl=blogs.find(b=>b.id===editingBlogId)?.imageUrl||null;
    if(!editingBlogId) data.createdAt=firebase.firestore.FieldValue.serverTimestamp();
    if(editingBlogId) { await db.collection('blogs').doc(editingBlogId).update(data); toast('Blog updated!','ok'); }
    else { await db.collection('blogs').add(data); toast('Blog published!','ok'); }
    resetBlogForm(); await loadBlogs(true);
  } catch(e) { toast('Error: '+e.message,'err'); txt.textContent=editingBlogId?'Update Blog Post':'Add Blog Post'; }
  finally { btn.disabled=false; }
}
function val(id){ return document.getElementById(id)?.value?.trim()||''; }
function resetBlogForm() {
  document.getElementById('blogForm')?.reset(); compressedB64Blog=null; editingBlogId=null;
  const prev=document.getElementById('imgPrev');
  if(prev){ prev.classList.remove('show'); document.getElementById('prevImg').src=''; document.getElementById('prevMeta').innerHTML=''; }
  document.getElementById('formTitle').textContent='Add New Blog Post';
  document.getElementById('submitTxt').textContent='Add Blog Post';
  document.getElementById('cancelBtn').style.display='none';
  dp?.reset();
}

// ============================================
// LOAD & RENDER BLOGS
// ============================================
async function loadBlogs(showError=false) {
  showTableLoader('blogTbody','emptyBlogState',7);
  try {
    const snap=await db.collection('blogs').orderBy('createdAt','desc').get();
    blogs=snap.docs.map(d=>({id:d.id,...d.data()}));
    blogPage=1; renderBlogTable(blogs);
  } catch(e) { if(showError)toast('Load error: '+e.message,'err'); blogs=[]; renderBlogTable([]); }
}
function renderBlogTable(list) {
  const tbody=document.getElementById('blogTbody'), empty=document.getElementById('emptyBlogState');
  if(!tbody||!empty)return;
  if(!list.length){ tbody.innerHTML=''; empty.style.display='block'; document.getElementById('blogPagination').innerHTML=''; return; }
  empty.style.display='none';
  const {items,page,pages,total}=paginate(list,blogPage); blogPage=page;
  tbody.innerHTML=items.map(b=>{
    const thumb=b.imageUrl?`<img class="thumb" src="${b.imageUrl}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<div class="thumb-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>`;
    const feat=b.featured==='yes'?`<span class="badge badge-feat"><svg viewBox="0 0 24 24" fill="currentColor" style="width:10px;height:10px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Featured</span>`:`<span style="color:var(--t3)">—</span>`;
    return `<tr><td>${thumb}</td><td class="ttl-cell" title="${esc(b.title)}">${esc(b.title)}</td><td><span class="badge badge-cat">${esc(b.category)}</span></td><td style="color:var(--t2)">${esc(b.author)}</td><td style="color:var(--t2);white-space:nowrap">${fmtDate(b.date)}</td><td>${feat}</td><td><div class="act-cell"><button class="ibtn edit" onclick="editBlog('${b.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button class="ibtn del" onclick="openDelete('${b.id}','blog')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button></div></td></tr>`;
  }).join('');
  buildPagination('blogPagination',page,pages,total,p=>{ blogPage=p; renderBlogTable(list); });
}
window.editBlog=function(id){
  const b=blogs.find(x=>x.id===id); if(!b)return toast('Post not found','err');
  editingBlogId=id; compressedB64Blog=null;
  const mapped={blogTitle:'title',blogCategory:'category',blogAuthor:'author',blogReadTime:'readTime',blogFeatured:'featured',blogExcerpt:'excerpt',blogContent:'content'};
  Object.entries(mapped).forEach(([fid,key])=>{ const el=document.getElementById(fid); if(el&&b[key]!==undefined)el.value=b[key]; });
  dp?.setStr(b.date);
  const prev=document.getElementById('imgPrev');
  if(b.imageUrl&&prev){ document.getElementById('prevImg').src=b.imageUrl; document.getElementById('prevMeta').innerHTML='<span style="color:var(--t2)">Existing image</span>'; prev.classList.add('show'); }
  document.getElementById('formTitle').textContent='Edit Blog Post';
  document.getElementById('submitTxt').textContent='Update Blog Post';
  document.getElementById('cancelBtn').style.display='inline-flex';
  switchSection('blogSection','navBlog','Blog Management');
  document.getElementById('blogForm')?.scrollIntoView({behavior:'smooth',block:'start'});
};

// ============================================
// CATEGORY MASTER
// ============================================
function bindCategoryForm(){
  document.getElementById('categoryForm')?.addEventListener('submit',async e=>{ e.preventDefault(); await saveCategory(); });
  document.getElementById('categoryCancelBtn')?.addEventListener('click',resetCategoryForm);
}
async function saveCategory(){
  const btn=document.getElementById('categorySubmitBtn'),txt=document.getElementById('categorySubmitTxt');
  btn.disabled=true; txt.innerHTML='<span class="spin"></span>&nbsp;Saving…';
  const name=val('categoryName');
  if(!name){ toast('Category name is required','err'); btn.disabled=false; txt.textContent=editingCategoryId?'Update Category':'Add Category'; return; }
  try {
    const data={name,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(editingCategoryId){ await db.collection('categories').doc(editingCategoryId).update(data); toast('Category updated!','ok'); }
    else{ data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); await db.collection('categories').add(data); toast('Category added!','ok'); }
    resetCategoryForm(); await loadCategoryList(true);
  } catch(e){ toast('Save error: '+e.message,'err'); txt.textContent=editingCategoryId?'Update Category':'Add Category'; }
  finally{ btn.disabled=false; }
}
function resetCategoryForm(){
  document.getElementById('categoryForm')?.reset(); editingCategoryId=null;
  document.getElementById('categoryFormTitle').textContent='Add New Category';
  document.getElementById('categorySubmitTxt').textContent='Add Category';
  document.getElementById('categoryCancelBtn').style.display='none';
}
async function loadCategoryList(showError=false){
  showTableLoader('categoryTbody','emptyCategoryState',2);
  try{
    const snap=await db.collection('categories').orderBy('name','asc').get();
    categoryList=snap.docs.map(d=>({id:d.id,...d.data()}));
    catPage=1; renderCategoryTable(categoryList); buildBlogCategoryDropdown(); buildProjectCategoryDropdown();
  }catch(e){ if(showError)toast('Category load error: '+e.message,'err'); categoryList=[]; renderCategoryTable([]); buildBlogCategoryDropdown(); buildProjectCategoryDropdown(); }
}
function renderCategoryTable(list){
  const tbody=document.getElementById('categoryTbody'),empty=document.getElementById('emptyCategoryState');
  if(!tbody||!empty)return;
  if(!list.length){ tbody.innerHTML=''; empty.style.display='block'; document.getElementById('catPagination').innerHTML=''; return; }
  empty.style.display='none';
  const {items,page,pages,total}=paginate(list,catPage); catPage=page;
  tbody.innerHTML=items.map(c=>`<tr><td style="font-weight:600;font-size:.95rem;">${esc(c.name)}</td><td><div class="act-cell"><button class="ibtn edit" onclick="editCategory('${c.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button class="ibtn del" onclick="openDelete('${c.id}','category')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button></div></td></tr>`).join('');
  buildPagination('catPagination',page,pages,total,p=>{ catPage=p; renderCategoryTable(list); });
}
window.editCategory=function(id){
  const c=categoryList.find(x=>x.id===id); if(!c)return;
  editingCategoryId=id; document.getElementById('categoryName').value=c.name;
  document.getElementById('categoryFormTitle').textContent='Edit Category';
  document.getElementById('categorySubmitTxt').textContent='Update Category';
  document.getElementById('categoryCancelBtn').style.display='inline-flex';
  switchSection('categoryMasterSection','navCategoryMaster','Category Master');
  document.getElementById('categoryForm')?.scrollIntoView({behavior:'smooth',block:'start'});
};
function buildBlogCategoryDropdown(){
  const sel=document.getElementById('blogCategory'); if(!sel)return;
  const cur=sel.value; sel.innerHTML='<option value="">Select Category</option>';
  categoryList.forEach(c=>{ const o=document.createElement('option'); o.value=c.name; o.textContent=c.name; sel.appendChild(o); });
  if(cur)sel.value=cur;
}
function buildProjectCategoryDropdown(){
  const sel=document.getElementById('projectCategory'); if(!sel)return;
  const cur=sel.value; sel.innerHTML='<option value="">Select Category</option>';
  categoryList.forEach(c=>{ const o=document.createElement('option'); o.value=c.name; o.textContent=c.name; sel.appendChild(o); });
  if(cur)sel.value=cur;
}

// ============================================
// TECHNOLOGY MASTER
// ============================================
function bindTechForm(){
  document.getElementById('techForm')?.addEventListener('submit',async e=>{ e.preventDefault(); await saveTech(); });
  document.getElementById('techCancelBtn')?.addEventListener('click',resetTechForm);
}
async function saveTech(){
  const btn=document.getElementById('techSubmitBtn'),txt=document.getElementById('techSubmitTxt');
  btn.disabled=true; txt.innerHTML='<span class="spin"></span>&nbsp;Saving…';
  const name=val('techName');
  if(!name){ toast('Technology name is required','err'); btn.disabled=false; txt.textContent=editingTechId?'Update Technology':'Add Technology'; return; }
  try{
    const data={name,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(editingTechId){ await db.collection('technologies').doc(editingTechId).update(data); toast('Technology updated!','ok'); editingTechId=null; }
    else{ data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); await db.collection('technologies').add(data); toast('Technology added!','ok'); }
    resetTechForm(); await loadTechList(true);
  }catch(e){ toast('Save error: '+e.message,'err'); txt.textContent=editingTechId?'Update Technology':'Add Technology'; }
  finally{ btn.disabled=false; }
}
function resetTechForm(){
  document.getElementById('techForm')?.reset(); editingTechId=null;
  document.getElementById('techFormTitle').textContent='Add New Technology';
  document.getElementById('techSubmitTxt').textContent='Add Technology';
  document.getElementById('techCancelBtn').style.display='none';
}
async function loadTechList(showError=false){
  showTableLoader('techTbody','emptyTechState',2);
  try{
    const snap=await db.collection('technologies').orderBy('name','asc').get();
    techList=snap.docs.map(d=>({id:d.id,...d.data()}));
    techPage=1; renderTechTable(techList); buildTechDropdown();
  }catch(e){ if(showError)toast('Tech load error: '+e.message,'err'); techList=[]; renderTechTable([]); buildTechDropdown(); }
}
function renderTechTable(list){
  const tbody=document.getElementById('techTbody'),empty=document.getElementById('emptyTechState');
  if(!tbody||!empty)return;
  if(!list.length){ tbody.innerHTML=''; empty.style.display='block'; document.getElementById('techPagination').innerHTML=''; return; }
  empty.style.display='none';
  const {items,page,pages,total}=paginate(list,techPage); techPage=page;
  tbody.innerHTML=items.map(t=>`<tr><td style="font-weight:600;font-size:.95rem;">${esc(t.name)}</td><td><div class="act-cell"><button class="ibtn edit" onclick="editTech('${t.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button class="ibtn del" onclick="openDelete('${t.id}','tech')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button></div></td></tr>`).join('');
  buildPagination('techPagination',page,pages,total,p=>{ techPage=p; renderTechTable(list); });
}
window.editTech=function(id){
  const t=techList.find(x=>x.id===id); if(!t)return;
  editingTechId=id; document.getElementById('techName').value=t.name;
  document.getElementById('techFormTitle').textContent='Edit Technology';
  document.getElementById('techSubmitTxt').textContent='Update Technology';
  document.getElementById('techCancelBtn').style.display='inline-flex';
  switchSection('techMasterSection','navTechMaster','Technology Master');
  document.getElementById('techForm')?.scrollIntoView({behavior:'smooth',block:'start'});
};

// ============================================
// PROJECT MASTER
// ============================================
function bindProjectForm(){
  document.getElementById('projectImage')?.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f)processImageFor(f,'project'); });
  document.getElementById('projectForm')?.addEventListener('submit',async e=>{ e.preventDefault(); await saveProject(); });
  document.getElementById('projectCancelBtn')?.addEventListener('click',resetProjectForm);
  const input=document.getElementById('techTagsInput'), dropdown=document.getElementById('techDropdown');
  input?.addEventListener('input',()=>{ renderTechDropdown(input.value.toLowerCase()); dropdown.classList.add('show'); });
  input?.addEventListener('focus',()=>{ renderTechDropdown(input.value.toLowerCase()); dropdown.classList.add('show'); });
  document.addEventListener('click',e=>{ if(!document.getElementById('techTagsWrap')?.contains(e.target)) dropdown?.classList.remove('show'); });
}
function buildTechDropdown(){ renderTechDropdown(''); }
function renderTechDropdown(query){
  const dropdown=document.getElementById('techDropdown'); if(!dropdown)return;
  const filtered=techList.filter(t=>t.name.toLowerCase().includes(query)&&!selectedTechs.includes(t.name));
  if(!filtered.length){ dropdown.innerHTML=`<div class="tech-dropdown-item" style="color:var(--t3);cursor:default">No technologies found</div>`; return; }
  dropdown.innerHTML=filtered.map(t=>`<div class="tech-dropdown-item" onclick="selectTech('${esc(t.name)}')">${esc(t.name)}</div>`).join('');
}
window.selectTech=function(name){
  if(!selectedTechs.includes(name)){ selectedTechs.push(name); renderTechTags(); }
  const input=document.getElementById('techTagsInput'), dropdown=document.getElementById('techDropdown');
  if(input)input.value=''; dropdown?.classList.remove('show');
};
window.removeTech=function(name){ selectedTechs=selectedTechs.filter(t=>t!==name); renderTechTags(); };
function renderTechTags(){
  const wrap=document.getElementById('selectedTechTags'); if(!wrap)return;
  wrap.innerHTML=selectedTechs.map(name=>`<div class="tag-chip"><span>${esc(name)}</span><span class="tag-chip-del" onclick="removeTech('${esc(name)}')" title="Remove">×</span></div>`).join('');
}
async function saveProject(){
  const btn=document.getElementById('projectSubmitBtn'),txt=document.getElementById('projectSubmitTxt');
  btn.disabled=true; txt.innerHTML='<span class="spin"></span>&nbsp;Saving…';
  try{
    const data={name:val('projectName'),category:val('projectCategory'),description:val('projectDescription'),details:val('projectDetails'),technologies:[...selectedTechs],year:val('projectYear'),updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(compressedB64Project) data.imageUrl=compressedB64Project;
    else if(editingProjectId) data.imageUrl=projects.find(p=>p.id===editingProjectId)?.imageUrl||null;
    if(!editingProjectId) data.createdAt=firebase.firestore.FieldValue.serverTimestamp();
    if(editingProjectId){ await db.collection('projects').doc(editingProjectId).update(data); toast('Project updated!','ok'); }
    else{ await db.collection('projects').add(data); toast('Project added!','ok'); }
    resetProjectForm(); await loadProjects(true);
  }catch(e){ toast('Error: '+e.message,'err'); txt.textContent=editingProjectId?'Update Project':'Add Project'; }
  finally{ btn.disabled=false; }
}
function resetProjectForm(){
  document.getElementById('projectForm')?.reset(); compressedB64Project=null; editingProjectId=null;
  selectedTechs=[]; renderTechTags(); yp?.reset();
  const prev=document.getElementById('projImgPrev');
  if(prev){ prev.classList.remove('show'); document.getElementById('projPrevImg').src=''; document.getElementById('projPrevMeta').innerHTML=''; }
  document.getElementById('projectFormTitle').textContent='Add New Project';
  document.getElementById('projectSubmitTxt').textContent='Add Project';
  document.getElementById('projectCancelBtn').style.display='none';
}
async function loadProjects(showError=false){
  showTableLoader('projectTbody','emptyProjectState',6);
  try{
    const snap=await db.collection('projects').orderBy('createdAt','desc').get();
    projects=snap.docs.map(d=>({id:d.id,...d.data()}));
    projectPage=1; renderProjectTable(projects);
  }catch(e){ if(showError)toast('Projects load error: '+e.message,'err'); projects=[]; renderProjectTable([]); }
}
function renderProjectTable(list){
  const tbody=document.getElementById('projectTbody'),empty=document.getElementById('emptyProjectState');
  if(!tbody||!empty)return;
  if(!list.length){ tbody.innerHTML=''; empty.style.display='block'; document.getElementById('projectPagination').innerHTML=''; return; }
  empty.style.display='none';
  const {items,page,pages,total}=paginate(list,projectPage); projectPage=page;
  tbody.innerHTML=items.map(p=>{
    const thumb=p.imageUrl?`<img class="thumb" src="${p.imageUrl}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<div class="thumb-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>`;
    const techs=(p.technologies||[]).slice(0,3).map(t=>`<span class="badge badge-tech" style="margin-right:2px;margin-bottom:2px">${esc(t)}</span>`).join('');
    return `<tr><td>${thumb}</td><td class="ttl-cell" title="${esc(p.name)}">${esc(p.name)}</td><td><span class="badge badge-cat">${esc(p.category)}</span></td><td style="max-width:180px">${techs}</td><td><span class="badge badge-year">${esc(p.year)}</span></td><td><div class="act-cell"><button class="ibtn edit" onclick="editProject('${p.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button class="ibtn del" onclick="openDelete('${p.id}','project')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button></div></td></tr>`;
  }).join('');
  buildPagination('projectPagination',page,pages,total,p=>{ projectPage=p; renderProjectTable(list); });
}
window.editProject=function(id){
  const p=projects.find(x=>x.id===id); if(!p)return toast('Project not found','err');
  editingProjectId=id; compressedB64Project=null;
  const mapped={projectName:'name',projectCategory:'category',projectDescription:'description',projectDetails:'details'};
  Object.entries(mapped).forEach(([fid,key])=>{ const el=document.getElementById(fid); if(el&&p[key]!==undefined)el.value=p[key]; });
  yp?.setVal(p.year);
  selectedTechs=[...(p.technologies||[])]; renderTechTags();
  const prev=document.getElementById('projImgPrev');
  if(p.imageUrl&&prev){ document.getElementById('projPrevImg').src=p.imageUrl; document.getElementById('projPrevMeta').innerHTML='<span style="color:var(--t2)">Existing image</span>'; prev.classList.add('show'); }
  document.getElementById('projectFormTitle').textContent='Edit Project';
  document.getElementById('projectSubmitTxt').textContent='Update Project';
  document.getElementById('projectCancelBtn').style.display='inline-flex';
  switchSection('projectSection','navProject','Project Master');
  document.getElementById('projectForm')?.scrollIntoView({behavior:'smooth',block:'start'});
};

// ============================================
// DELETE (shared)
// ============================================
window.openDelete=function(id,type){
  deleteTarget=id; deleteType=type;
  const titles={blog:'Delete Blog Post',category:'Delete Category',tech:'Delete Technology',project:'Delete Project'};
  document.getElementById('deleteModalTitle').textContent=titles[type]||'Confirm Delete';
  document.getElementById('deleteModal').classList.add('show');
};
function bindModal(){
  document.getElementById('confirmDelete')?.addEventListener('click',async()=>{
    if(!deleteTarget||!deleteType)return;
    const confirmBtn=document.getElementById('confirmDelete');
    confirmBtn.disabled=true; confirmBtn.innerHTML='<span class="spin"></span>&nbsp;Deleting…';
    try{
      const collMap={blog:'blogs',category:'categories',tech:'technologies',project:'projects'};
      await db.collection(collMap[deleteType]).doc(deleteTarget).delete();
      toast('Deleted successfully','ok'); closeModal();
      if(deleteType==='blog'){ blogs=blogs.filter(x=>x.id!==deleteTarget); renderBlogTable(blogs); }
      if(deleteType==='category'){ categoryList=categoryList.filter(x=>x.id!==deleteTarget); renderCategoryTable(categoryList); buildBlogCategoryDropdown(); buildProjectCategoryDropdown(); }
      if(deleteType==='tech'){ techList=techList.filter(x=>x.id!==deleteTarget); renderTechTable(techList); buildTechDropdown(); }
      if(deleteType==='project'){ projects=projects.filter(x=>x.id!==deleteTarget); renderProjectTable(projects); }
    }catch(e){
      toast('Delete failed: '+e.message,'err'); confirmBtn.disabled=false;
      confirmBtn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete`;
    }
  });
  document.getElementById('cancelDelete')?.addEventListener('click',closeModal);
  document.getElementById('modalClose')?.addEventListener('click',closeModal);
  document.getElementById('deleteModal')?.addEventListener('click',e=>{ if(e.target===document.getElementById('deleteModal'))closeModal(); });
}
function closeModal(){
  document.getElementById('deleteModal').classList.remove('show');
  const confirmBtn=document.getElementById('confirmDelete');
  if(confirmBtn){ confirmBtn.disabled=false; confirmBtn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Delete`; }
  deleteTarget=null; deleteType=null;
}

// ============================================
// SEARCH
// ============================================
function bindSearchAll(){
  document.getElementById('searchBlogs')?.addEventListener('input',e=>{ const q=e.target.value.toLowerCase().trim(); blogPage=1; renderBlogTable(!q?blogs:blogs.filter(b=>[b.title,b.category,b.author,b.excerpt].some(f=>f?.toLowerCase().includes(q)))); });
  document.getElementById('searchCategories')?.addEventListener('input',e=>{ const q=e.target.value.toLowerCase().trim(); catPage=1; renderCategoryTable(!q?categoryList:categoryList.filter(c=>c.name?.toLowerCase().includes(q))); });
  document.getElementById('searchTech')?.addEventListener('input',e=>{ const q=e.target.value.toLowerCase().trim(); techPage=1; renderTechTable(!q?techList:techList.filter(t=>t.name?.toLowerCase().includes(q))); });
  document.getElementById('searchProjects')?.addEventListener('input',e=>{ const q=e.target.value.toLowerCase().trim(); projectPage=1; renderProjectTable(!q?projects:projects.filter(p=>[p.name,p.category,p.description,...(p.technologies||[])].some(f=>f?.toLowerCase().includes(q)))); });
}

// ============================================
// HELPERS
// ============================================
function switchSection(sectionId,navId,title){
  document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
  document.getElementById(sectionId)?.classList.add('active');
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  document.getElementById(navId)?.classList.add('active');
  document.getElementById('pageTitle').textContent=title;
}
function fmtDate(s){ if(!s)return'—'; try{return new Date(s+'T00:00:00').toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});}catch{return s;} }
function esc(s){ if(!s)return''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

// ============================================
// TOAST
// ============================================
function toast(msg,type='ok'){
  const tray=document.getElementById('toastTray'); if(!tray)return;
  const icons={ ok:`<svg class="t-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, err:`<svg class="t-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` };
  const el=document.createElement('div'); el.className=`toast ${type}`; el.innerHTML=`${icons[type]||''}<span>${msg}</span>`;
  tray.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),300); },3500);
}

console.log('ZettaCoreLab admin.js loaded — Year Picker + Pagination + Loading States');