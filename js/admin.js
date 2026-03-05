// ============================================
// ZETTACORELAB ADMIN — admin.js
// Blog · Category · Technology · Project · Team Member · Service Management
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
let teamMembers       = [];
let services          = [];
let editingBlogId     = null;
let editingCategoryId = null;
let editingTechId     = null;
let editingProjectId  = null;
let editingMemberId   = null;
let editingServiceId  = null;
let deleteTarget      = null;
let deleteType        = null;
let dp                = null;
let yp                = null;
let sbExpanded        = true;
let compressedB64Blog    = null;
let compressedB64Project = null;
let compressedB64Member  = null;
let formBound         = false;
let selectedTechs     = [];
let selectedServiceTechs = [];
let servicePoints     = [];
const MIN_POINTS = 3;
const MAX_POINTS = 6;

// ---- Pagination state ----
const PAGE_SIZE = 10;
let blogPage    = 1;
let catPage     = 1;
let techPage    = 1;
let projectPage = 1;
let memberPage  = 1;
let servicePage = 1;

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
// YEAR PICKER (Project Master)
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
  const cbKey = '_pgCb_' + containerId;
  window[cbKey] = onPageChange;

  let html = `<div class="pg-info">Showing <strong>${s}–${e}</strong> of <strong>${total}</strong> records</div><div class="pg-btns">`;
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
  if (!formBound) {
    bindBlogForm(); bindCategoryForm(); bindTechForm();
    bindProjectForm(); bindMemberForm(); bindServiceForm();
    formBound=true;
  }
  loadBlogs(); loadCategoryList(); loadTechList(); loadProjects(); loadTeamMembers(); loadServices();
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
  bindZoneDrop('memberFileZone','memberImage',f=>processImageFor(f,'member'));
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
  const prevId = target==='blog'?'imgPrev': target==='project'?'projImgPrev':'memberImgPrev';
  const imgId  = target==='blog'?'prevImg':  target==='project'?'projPrevImg':'memberPrevImg';
  const metaId = target==='blog'?'prevMeta': target==='project'?'projPrevMeta':'memberPrevMeta';
  const prev=document.getElementById(prevId), img=document.getElementById(imgId), meta=document.getElementById(metaId);
  if(!prev||!img)return;
  prev.classList.add('show'); img.style.opacity='0.3'; meta.innerHTML='<span>⏳ Compressing…</span>';
  try {
    const r=await compressImage(file);
    if(target==='blog') compressedB64Blog=r.base64;
    else if(target==='project') compressedB64Project=r.base64;
    else compressedB64Member=r.base64;
    img.src=r.base64; img.style.opacity='1';
    meta.innerHTML=r.compressed
      ?`<span>📦 ${r.origKB} KB → ${r.finalKB} KB</span><span class="ctag">✓ Compressed</span>`
      :`<span>📦 ${r.origKB} KB</span><span class="ctag" style="background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.25);color:var(--info)">✓ Ready</span>`;
    // Update avatar preview for member
    if(target==='member') updateMemberAvatarPreview(r.base64);
  } catch(err) {
    if(target==='blog') compressedB64Blog=null;
    else if(target==='project') compressedB64Project=null;
    else compressedB64Member=null;
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
    techPage=1; renderTechTable(techList); buildTechDropdown(); buildServiceTechDropdown();
  }catch(e){ if(showError)toast('Tech load error: '+e.message,'err'); techList=[]; renderTechTable([]); buildTechDropdown(); buildServiceTechDropdown(); }
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
  switchSection('projectSection','navProject','Project Management');
  document.getElementById('projectForm')?.scrollIntoView({behavior:'smooth',block:'start'});
};

// ============================================
// TEAM MEMBER MASTER
// ============================================
function bindMemberForm(){
  document.getElementById('memberImage')?.addEventListener('change',e=>{ const f=e.target.files?.[0]; if(f)processImageFor(f,'member'); });
  document.getElementById('memberForm')?.addEventListener('submit',async e=>{ e.preventDefault(); await saveMember(); });
  document.getElementById('memberCancelBtn')?.addEventListener('click',resetMemberForm);
  // Live name → avatar preview
  document.getElementById('memberName')?.addEventListener('input',()=>{
    if(!compressedB64Member) updateMemberAvatarPreview(null);
  });
}
function updateMemberAvatarPreview(imgSrc){
  const ph=document.getElementById('memberAvatarPh');
  const img=document.getElementById('memberAvatarImg');
  if(!ph||!img)return;
  if(imgSrc){
    img.src=imgSrc; img.style.display='block'; ph.style.display='none';
  } else {
    const name=val('memberName');
    ph.textContent=getInitials(name)||'👤';
    img.style.display='none'; ph.style.display='flex';
  }
}
function getInitials(name){
  if(!name)return'';
  return name.split(' ').map(w=>w[0]||'').join('').toUpperCase().substring(0,2);
}
async function saveMember(){
  const btn=document.getElementById('memberSubmitBtn'),txt=document.getElementById('memberSubmitTxt');
  btn.disabled=true; txt.innerHTML='<span class="spin"></span>&nbsp;Saving…';
  const name=val('memberName'),designation=val('memberDesignation'),experience=val('memberExperience');
  if(!name||!designation||!experience){ toast('Name, designation and experience are required','err'); btn.disabled=false; txt.textContent=editingMemberId?'Update Member':'Add Member'; return; }
  try{
    const data={name,designation,experience,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(compressedB64Member) data.imageUrl=compressedB64Member;
    else if(editingMemberId) data.imageUrl=teamMembers.find(m=>m.id===editingMemberId)?.imageUrl||null;
    if(!editingMemberId) data.createdAt=firebase.firestore.FieldValue.serverTimestamp();
    if(editingMemberId){ await db.collection('teamMembers').doc(editingMemberId).update(data); toast('Member updated!','ok'); }
    else{ await db.collection('teamMembers').add(data); toast('Member added!','ok'); }
    resetMemberForm(); await loadTeamMembers(true);
  }catch(e){ toast('Error: '+e.message,'err'); txt.textContent=editingMemberId?'Update Member':'Add Member'; }
  finally{ btn.disabled=false; }
}
function resetMemberForm(){
  document.getElementById('memberForm')?.reset(); compressedB64Member=null; editingMemberId=null;
  const prev=document.getElementById('memberImgPrev');
  if(prev){ prev.classList.remove('show'); document.getElementById('memberPrevImg').src=''; document.getElementById('memberPrevMeta').innerHTML=''; }
  updateMemberAvatarPreview(null);
  document.getElementById('memberFormTitle').textContent='Add New Team Member';
  document.getElementById('memberSubmitTxt').textContent='Add Member';
  document.getElementById('memberCancelBtn').style.display='none';
}
async function loadTeamMembers(showError=false){
  showTableLoader('memberTbody','emptyMemberState',5);
  try{
    const snap=await db.collection('teamMembers').orderBy('createdAt','asc').get();
    teamMembers=snap.docs.map(d=>({id:d.id,...d.data()}));
    memberPage=1; renderMemberTable(teamMembers);
  }catch(e){ if(showError)toast('Members load error: '+e.message,'err'); teamMembers=[]; renderMemberTable([]); }
}
function renderMemberTable(list){
  const tbody=document.getElementById('memberTbody'),empty=document.getElementById('emptyMemberState');
  if(!tbody||!empty)return;
  if(!list.length){ tbody.innerHTML=''; empty.style.display='block'; document.getElementById('memberPagination').innerHTML=''; return; }
  empty.style.display='none';
  const {items,page,pages,total}=paginate(list,memberPage); memberPage=page;
  tbody.innerHTML=items.map(m=>{
    const thumb=m.imageUrl
      ?`<img class="member-thumb" src="${m.imageUrl}" alt="${esc(m.name)}" loading="lazy" onerror="this.outerHTML='<div class=\\'member-thumb-ph\\'>${esc(getInitials(m.name))}</div>'">`
      :`<div class="member-thumb-ph">${esc(getInitials(m.name))}</div>`;
    return `<tr>
      <td>${thumb}</td>
      <td style="font-weight:700;color:var(--t1)">${esc(m.name)}</td>
      <td><span class="badge badge-cat">${esc(m.designation)}</span></td>
      <td style="color:var(--t2)">${esc(m.experience)}</td>
      <td><div class="act-cell">
        <button class="ibtn edit" onclick="editMember('${m.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
        <button class="ibtn del" onclick="openDelete('${m.id}','member')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  buildPagination('memberPagination',page,pages,total,p=>{ memberPage=p; renderMemberTable(list); });
}
window.editMember=function(id){
  const m=teamMembers.find(x=>x.id===id); if(!m)return toast('Member not found','err');
  editingMemberId=id; compressedB64Member=null;
  document.getElementById('memberName').value=m.name||'';
  document.getElementById('memberDesignation').value=m.designation||'';
  document.getElementById('memberExperience').value=m.experience||'';
  const prev=document.getElementById('memberImgPrev');
  if(m.imageUrl&&prev){ document.getElementById('memberPrevImg').src=m.imageUrl; document.getElementById('memberPrevMeta').innerHTML='<span style="color:var(--t2)">Existing image</span>'; prev.classList.add('show'); updateMemberAvatarPreview(m.imageUrl); }
  else { updateMemberAvatarPreview(null); }
  document.getElementById('memberFormTitle').textContent='Edit Team Member';
  document.getElementById('memberSubmitTxt').textContent='Update Member';
  document.getElementById('memberCancelBtn').style.display='inline-flex';
  switchSection('teamMemberSection','navTeamMember','Team Member Master');
  document.getElementById('memberForm')?.scrollIntoView({behavior:'smooth',block:'start'});
};

// ============================================
// SERVICE MANAGEMENT
// ============================================
function bindServiceForm(){
  document.getElementById('serviceForm')?.addEventListener('submit',async e=>{ e.preventDefault(); await saveService(); });
  document.getElementById('serviceCancelBtn')?.addEventListener('click',resetServiceForm);
  document.getElementById('addPointBtn')?.addEventListener('click',addServicePoint);
  // Service tech dropdown
  const input=document.getElementById('serviceTechInput'), dropdown=document.getElementById('serviceTechDropdown');
  input?.addEventListener('input',()=>{ renderServiceTechDropdown(input.value.toLowerCase()); dropdown.classList.add('show'); });
  input?.addEventListener('focus',()=>{ renderServiceTechDropdown(input.value.toLowerCase()); dropdown.classList.add('show'); });
  document.addEventListener('click',e=>{ if(!document.getElementById('serviceTechWrap')?.contains(e.target)) dropdown?.classList.remove('show'); });
  // Init with 3 points
  servicePoints=[];
  for(let i=0;i<MIN_POINTS;i++) addServicePoint();
}
function addServicePoint(){
  if(servicePoints.length>=MAX_POINTS){ toast(`Maximum ${MAX_POINTS} points allowed`,'err'); return; }
  const id='pt_'+Date.now()+'_'+Math.random().toString(36).substr(2,5);
  servicePoints.push({id,value:''});
  renderServicePoints();
}
window.removeServicePoint=function(id){
  if(servicePoints.length<=MIN_POINTS){ toast(`Minimum ${MIN_POINTS} points required`,'err'); return; }
  servicePoints=servicePoints.filter(p=>p.id!==id);
  renderServicePoints();
};
function renderServicePoints(){
  const builder=document.getElementById('pointsBuilder'); if(!builder)return;
  const hint=document.getElementById('pointsCountHint');
  if(hint) hint.textContent=`${servicePoints.length} of ${MAX_POINTS} points (min ${MIN_POINTS}, max ${MAX_POINTS})`;
  const addBtn=document.getElementById('addPointBtn');
  if(addBtn) addBtn.disabled=servicePoints.length>=MAX_POINTS;
  builder.innerHTML=servicePoints.map((pt,i)=>`
    <div class="point-row" id="prow_${pt.id}">
      <span class="point-row-num">${i+1}</span>
      <input type="text" class="point-input" id="pinput_${pt.id}" value="${esc(pt.value)}"
        placeholder="e.g. Custom blockchain architecture design"
        oninput="updatePointValue('${pt.id}', this.value)" maxlength="120" />
      ${servicePoints.length>MIN_POINTS?`<button type="button" class="point-del-btn" onclick="removeServicePoint('${pt.id}')" title="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`:'<span style="width:32px"></span>'}
    </div>
  `).join('');
}
window.updatePointValue=function(id,val){
  const pt=servicePoints.find(p=>p.id===id);
  if(pt) pt.value=val;
};
function getServicePointsValues(){
  return servicePoints.map(p=>p.value.trim()).filter(Boolean);
}
function buildServiceTechDropdown(){ renderServiceTechDropdown(''); }
function renderServiceTechDropdown(query){
  const dropdown=document.getElementById('serviceTechDropdown'); if(!dropdown)return;
  const filtered=techList.filter(t=>t.name.toLowerCase().includes(query)&&!selectedServiceTechs.includes(t.name));
  if(!filtered.length){ dropdown.innerHTML=`<div class="tech-dropdown-item" style="color:var(--t3);cursor:default">No technologies found</div>`; return; }
  dropdown.innerHTML=filtered.map(t=>`<div class="tech-dropdown-item" onclick="selectServiceTech('${esc(t.name)}')">${esc(t.name)}</div>`).join('');
}
window.selectServiceTech=function(name){
  if(!selectedServiceTechs.includes(name)){ selectedServiceTechs.push(name); renderServiceTechTags(); }
  const input=document.getElementById('serviceTechInput'), dropdown=document.getElementById('serviceTechDropdown');
  if(input)input.value=''; dropdown?.classList.remove('show');
};
window.removeServiceTech=function(name){ selectedServiceTechs=selectedServiceTechs.filter(t=>t!==name); renderServiceTechTags(); };
function renderServiceTechTags(){
  const wrap=document.getElementById('selectedServiceTechTags'); if(!wrap)return;
  wrap.innerHTML=selectedServiceTechs.map(name=>`<div class="tag-chip"><span>${esc(name)}</span><span class="tag-chip-del" onclick="removeServiceTech('${esc(name)}')" title="Remove">×</span></div>`).join('');
}
async function saveService(){
  const btn=document.getElementById('serviceSubmitBtn'),txt=document.getElementById('serviceSubmitTxt');
  const name=val('serviceName'),description=val('serviceDescription');
  if(!name||!description){ toast('Service name and description are required','err'); return; }
  const points=getServicePointsValues();
  if(points.length<MIN_POINTS){ toast(`Please fill at least ${MIN_POINTS} feature points`,'err'); return; }
  btn.disabled=true; txt.innerHTML='<span class="spin"></span>&nbsp;Saving…';
  try{
    const data={name,description,points,technologies:[...selectedServiceTechs],updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    if(!editingServiceId) data.createdAt=firebase.firestore.FieldValue.serverTimestamp();
    if(editingServiceId){ await db.collection('services').doc(editingServiceId).update(data); toast('Service updated!','ok'); }
    else{ await db.collection('services').add(data); toast('Service added!','ok'); }
    resetServiceForm(); await loadServices(true);
  }catch(e){ toast('Error: '+e.message,'err'); txt.textContent=editingServiceId?'Update Service':'Add Service'; }
  finally{ btn.disabled=false; }
}
function resetServiceForm(){
  document.getElementById('serviceForm')?.reset(); editingServiceId=null;
  selectedServiceTechs=[]; renderServiceTechTags();
  servicePoints=[];
  for(let i=0;i<MIN_POINTS;i++) addServicePoint();
  document.getElementById('serviceFormTitle').textContent='Add New Service';
  document.getElementById('serviceSubmitTxt').textContent='Add Service';
  document.getElementById('serviceCancelBtn').style.display='none';
}
async function loadServices(showError=false){
  showTableLoader('serviceTbody','emptyServiceState',4);
  try{
    const snap=await db.collection('services').orderBy('createdAt','asc').get();
    services=snap.docs.map(d=>({id:d.id,...d.data()}));
    servicePage=1; renderServiceTable(services);
  }catch(e){ if(showError)toast('Services load error: '+e.message,'err'); services=[]; renderServiceTable([]); }
}
function renderServiceTable(list){
  const tbody=document.getElementById('serviceTbody'),empty=document.getElementById('emptyServiceState');
  if(!tbody||!empty)return;
  if(!list.length){ tbody.innerHTML=''; empty.style.display='block'; document.getElementById('servicePagination').innerHTML=''; return; }
  empty.style.display='none';
  const {items,page,pages,total}=paginate(list,servicePage); servicePage=page;
  tbody.innerHTML=items.map(s=>{
    const pts=(s.points||[]).slice(0,2).map(p=>`<div class="points-preview-item">${esc(p)}</div>`).join('');
    const more=(s.points||[]).length>2?`<div class="points-preview-more">+${(s.points.length-2)} more</div>`:'';
    const techs=(s.technologies||[]).slice(0,3).map(t=>`<span class="badge badge-tech" style="margin-right:2px;margin-bottom:2px">${esc(t)}</span>`).join('');
    return `<tr>
      <td class="ttl-cell" title="${esc(s.name)}" style="font-weight:700">${esc(s.name)}</td>
      <td><div class="points-preview">${pts}${more}</div></td>
      <td style="max-width:180px">${techs}</td>
      <td><div class="act-cell">
        <button class="ibtn edit" onclick="editService('${s.id}')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
        <button class="ibtn del" onclick="openDelete('${s.id}','service')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  buildPagination('servicePagination',page,pages,total,p=>{ servicePage=p; renderServiceTable(list); });
}
window.editService=function(id){
  const s=services.find(x=>x.id===id); if(!s)return toast('Service not found','err');
  editingServiceId=id;
  document.getElementById('serviceName').value=s.name||'';
  document.getElementById('serviceDescription').value=s.description||'';
  // Load points
  servicePoints=[];
  const pts=s.points||[];
  const total=Math.max(MIN_POINTS,Math.min(MAX_POINTS,pts.length));
  for(let i=0;i<total;i++){
    const ptId='pt_'+Date.now()+'_'+i;
    servicePoints.push({id:ptId, value:pts[i]||''});
  }
  renderServicePoints();
  // Load service techs
  selectedServiceTechs=[...(s.technologies||[])]; renderServiceTechTags();
  document.getElementById('serviceFormTitle').textContent='Edit Service';
  document.getElementById('serviceSubmitTxt').textContent='Update Service';
  document.getElementById('serviceCancelBtn').style.display='inline-flex';
  switchSection('serviceSection','navService','Service Management');
  document.getElementById('serviceForm')?.scrollIntoView({behavior:'smooth',block:'start'});
};

// ============================================
// DELETE (shared)
// ============================================
window.openDelete=function(id,type){
  deleteTarget=id; deleteType=type;
  const titles={blog:'Delete Blog Post',category:'Delete Category',tech:'Delete Technology',project:'Delete Project',member:'Delete Team Member',service:'Delete Service'};
  document.getElementById('deleteModalTitle').textContent=titles[type]||'Confirm Delete';
  document.getElementById('deleteModal').classList.add('show');
};
function bindModal(){
  document.getElementById('confirmDelete')?.addEventListener('click',async()=>{
    if(!deleteTarget||!deleteType)return;
    const confirmBtn=document.getElementById('confirmDelete');
    confirmBtn.disabled=true; confirmBtn.innerHTML='<span class="spin"></span>&nbsp;Deleting…';
    try{
      const collMap={blog:'blogs',category:'categories',tech:'technologies',project:'projects',member:'teamMembers',service:'services'};
      await db.collection(collMap[deleteType]).doc(deleteTarget).delete();
      toast('Deleted successfully','ok'); closeModal();
      if(deleteType==='blog'){ blogs=blogs.filter(x=>x.id!==deleteTarget); renderBlogTable(blogs); }
      if(deleteType==='category'){ categoryList=categoryList.filter(x=>x.id!==deleteTarget); renderCategoryTable(categoryList); buildBlogCategoryDropdown(); buildProjectCategoryDropdown(); }
      if(deleteType==='tech'){ techList=techList.filter(x=>x.id!==deleteTarget); renderTechTable(techList); buildTechDropdown(); buildServiceTechDropdown(); }
      if(deleteType==='project'){ projects=projects.filter(x=>x.id!==deleteTarget); renderProjectTable(projects); }
      if(deleteType==='member'){ teamMembers=teamMembers.filter(x=>x.id!==deleteTarget); renderMemberTable(teamMembers); }
      if(deleteType==='service'){ services=services.filter(x=>x.id!==deleteTarget); renderServiceTable(services); }
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
  document.getElementById('searchMembers')?.addEventListener('input',e=>{ const q=e.target.value.toLowerCase().trim(); memberPage=1; renderMemberTable(!q?teamMembers:teamMembers.filter(m=>[m.name,m.designation,m.experience].some(f=>f?.toLowerCase().includes(q)))); });
  document.getElementById('searchServices')?.addEventListener('input',e=>{ const q=e.target.value.toLowerCase().trim(); servicePage=1; renderServiceTable(!q?services:services.filter(s=>[s.name,s.description,...(s.points||[]),...(s.technologies||[])].some(f=>f?.toLowerCase().includes(q)))); });
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
function esc(s){ if(!s)return''; const d=document.createElement('div'); d.textContent=String(s); return d.innerHTML; }

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

console.log('ZettaCoreLab admin.js loaded — Team Member + Service Management + Year Picker + Pagination');
