// =================================
// ADMIN PANEL WITH FIREBASE (FREE PLAN - BASE64 IMAGES)
// =================================

// Admin credentials
const ADMIN_USERNAME = 'ADMIN';
const ADMIN_PASSWORD = 'Admin@123';

// State
let blogs = [];
let editingBlogId = null;
let deleteTargetId = null;
let datepickerInstance = null;

// =================================
// CUSTOM DATEPICKER
// =================================
class CustomDatepicker {
    constructor(inputId, dropdownId) {
        this.input = document.getElementById(inputId);
        this.dropdown = document.getElementById(dropdownId);
        this.currentMonth = new Date();
        this.selectedDate = null;
        this.init();
    }
    
    init() {
        if (!this.input || !this.dropdown) return;
        this.setDate(new Date());
        
        this.input.addEventListener('click', () => this.toggle());
        
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const todayBtn = document.getElementById('todayBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
                this.render();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
                this.render();
            });
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.setDate(new Date());
                this.hide();
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.selectedDate = null;
                this.input.value = '';
                this.hide();
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hide();
            }
        });
        
        this.render();
    }
    
    toggle() {
        this.dropdown.classList.toggle('show');
        if (this.dropdown.classList.contains('show')) {
            this.render();
        }
    }
    
    show() {
        this.dropdown.classList.add('show');
        this.render();
    }
    
    hide() {
        this.dropdown.classList.remove('show');
    }
    
    setDate(date) {
        this.selectedDate = date;
        this.currentMonth = new Date(date);
        this.input.value = this.formatDate(date);
        this.render();
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    render() {
        const titleEl = document.getElementById('datepickerTitle');
        const daysContainer = document.getElementById('datepickerDays');
        
        if (!titleEl || !daysContainer) return;
        
        const monthYear = this.currentMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        titleEl.textContent = monthYear;
        
        daysContainer.innerHTML = '';
        
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        
        const lastDay = new Date(year, month + 1, 0);
        const lastDate = lastDay.getDate();
        
        const prevMonthLastDay = new Date(year, month, 0);
        const prevMonthLastDate = prevMonthLastDay.getDate();
        
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDate - i;
            const dayEl = this.createDayElement(day, 'other-month');
            daysContainer.appendChild(dayEl);
        }
        
        const today = new Date();
        for (let day = 1; day <= lastDate; day++) {
            const date = new Date(year, month, day);
            const dayEl = this.createDayElement(day, '');
            
            if (this.isSameDate(date, today)) {
                dayEl.classList.add('today');
            }
            
            if (this.selectedDate && this.isSameDate(date, this.selectedDate)) {
                dayEl.classList.add('selected');
            }
            
            dayEl.addEventListener('click', () => {
                this.setDate(date);
                this.hide();
            });
            
            daysContainer.appendChild(dayEl);
        }
        
        const totalDays = firstDayOfWeek + lastDate;
        const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
        
        for (let day = 1; day <= remainingDays; day++) {
            const dayEl = this.createDayElement(day, 'other-month');
            daysContainer.appendChild(dayEl);
        }
    }
    
    createDayElement(day, className) {
        const dayEl = document.createElement('div');
        dayEl.className = `datepicker-day ${className}`;
        dayEl.textContent = day;
        return dayEl;
    }
    
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

// =================================
// INITIALIZE ON PAGE LOAD
// =================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin panel loaded with Firebase');
    
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        console.log('✅ User already logged in');
        showAdminPanel();
    } else {
        console.log('🔒 User needs to login');
        showLoginSection();
    }
});

// =================================
// SHOW/HIDE SECTIONS
// =================================
function showLoginSection() {
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginSection) loginSection.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
}

function showAdminPanel() {
    const loginSection = document.getElementById('loginSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginSection) loginSection.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'grid';
    
    loadBlogs();
    
    if (!datepickerInstance) {
        datepickerInstance = new CustomDatepicker('blogDate', 'datepickerDropdown');
    }
}

// =================================
// LOGIN FUNCTIONALITY
// =================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('loginError');
        
        console.log('🔐 Login attempt for:', username);
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            console.log('✅ Login successful');
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
        } else {
            console.log('❌ Login failed');
            if (errorMsg) {
                errorMsg.textContent = 'Invalid username or password';
                errorMsg.classList.add('show');
                setTimeout(() => {
                    errorMsg.classList.remove('show');
                }, 3000);
            }
        }
    });
}

// =================================
// SIDEBAR TOGGLE
// =================================
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.querySelector('.sidebar');

if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', function() {
        sidebar.classList.add('open');
    });
}

if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', function() {
        sidebar.classList.remove('open');
    });
}

document.addEventListener('click', function(e) {
    if (!sidebar) return;
    
    const toggleBtn = document.getElementById('toggleSidebar');
    
    if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// =================================
// LOGOUT
// =================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('👋 Logging out');
        sessionStorage.removeItem('adminLoggedIn');
        showLoginSection();
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
    });
}

// =================================
// IMAGE PREVIEW
// =================================
const blogImageInput = document.getElementById('blogImage');
if (blogImageInput) {
    blogImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        
        if (!preview) return;
        
        if (file) {
            // Check file size (max 500KB for base64)
            if (file.size > 500 * 1024) {
                showNotification('Image size should be less than 500KB for optimal performance', 'error');
                this.value = '';
                preview.innerHTML = '';
                preview.classList.remove('show');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.classList.add('show');
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
            preview.classList.remove('show');
        }
    });
}

// =================================
// BLOG FORM SUBMIT
// =================================
const blogForm = document.getElementById('blogForm');
if (blogForm) {
    blogForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('📝 Submitting blog form...');
        
        const submitBtn = blogForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        try {
            const formData = {
                title: document.getElementById('blogTitle').value,
                category: document.getElementById('blogCategory').value,
                author: document.getElementById('blogAuthor').value,
                date: document.getElementById('blogDate').value,
                readTime: document.getElementById('blogReadTime').value,
                featured: document.getElementById('blogFeatured').value,
                excerpt: document.getElementById('blogExcerpt').value,
                content: document.getElementById('blogContent').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Only set createdAt for new blogs
            if (!editingBlogId) {
                formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            const imageInput = document.getElementById('blogImage');
            
            if (imageInput && imageInput.files[0]) {
                // Convert image to base64
                const base64Image = await convertImageToBase64(imageInput.files[0]);
                formData.imageUrl = base64Image;
            } else if (editingBlogId) {
                // Keep existing image if editing
                const existingBlog = blogs.find(b => b.id === editingBlogId);
                formData.imageUrl = existingBlog?.imageUrl || null;
            }
            
            await saveBlog(formData);
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
        } catch (error) {
            console.error('❌ Error submitting form:', error);
            showNotification('Error saving blog: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// =================================
// CONVERT IMAGE TO BASE64
// =================================
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('✅ Image converted to base64');
            resolve(e.target.result);
        };
        
        reader.onerror = function(error) {
            console.error('❌ Error converting image:', error);
            reject(new Error('Failed to convert image'));
        };
        
        reader.readAsDataURL(file);
    });
}

// =================================
// SAVE BLOG TO FIRESTORE
// =================================
async function saveBlog(blogData) {
    try {
        console.log('💾 Saving blog to Firestore:', blogData.title);
        
        if (editingBlogId) {
            // Update existing blog
            await db.collection('blogs').doc(editingBlogId).update(blogData);
            console.log('✏️ Updated blog:', editingBlogId);
            showNotification('Blog updated successfully!', 'success');
        } else {
            // Create new blog
            const docRef = await db.collection('blogs').add(blogData);
            console.log('➕ Added new blog:', docRef.id);
            showNotification('Blog added successfully!', 'success');
        }
        
        resetForm();
        await loadBlogs();
        
    } catch (error) {
        console.error('❌ Error saving blog:', error);
        throw error;
    }
}

// =================================
// LOAD BLOGS FROM FIRESTORE
// =================================
async function loadBlogs() {
    console.log('📂 Loading blogs from Firestore...');
    
    try {
        const snapshot = await db.collection('blogs')
            .orderBy('createdAt', 'desc')
            .get();
        
        blogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('✅ Loaded', blogs.length, 'blogs from Firestore');
        
        renderBlogTable();
        
    } catch (error) {
        console.error('❌ Error loading blogs:', error);
        showNotification('Error loading blogs: ' + error.message, 'error');
        blogs = [];
        renderBlogTable();
    }
}

// =================================
// RENDER BLOG TABLE
// =================================
function renderBlogTable() {
    const tbody = document.getElementById('blogTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody || !emptyState) {
        console.warn('⚠️ Table elements not found');
        return;
    }
    
    console.log('🎨 Rendering', blogs.length, 'blogs in table');
    
    if (blogs.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = blogs.map(blog => `
        <tr>
            <td>
                <img src="${blog.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Crect fill=\'%23252530\' width=\'60\' height=\'60\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%237c3aed\' font-family=\'Arial\' font-size=\'24\'%3E📝%3C/text%3E%3C/svg%3E'}" alt="${escapeHtml(blog.title)}" class="blog-thumbnail" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Crect fill=\'%23252530\' width=\'60\' height=\'60\'/%3E%3C/svg%3E'">
            </td>
            <td class="blog-title-cell">${escapeHtml(blog.title)}</td>
            <td><span class="category-badge">${escapeHtml(blog.category)}</span></td>
            <td>${escapeHtml(blog.author)}</td>
            <td>${formatDate(blog.date)}</td>
            <td>
                ${blog.featured === 'yes' ? '<span class="featured-badge">★ Featured</span>' : '-'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editBlog('${blog.id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="confirmDeleteBlog('${blog.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// =================================
// EDIT BLOG
// =================================
function editBlog(id) {
    console.log('✏️ Editing blog:', id);
    
    const blog = blogs.find(b => b.id === id);
    if (!blog) {
        showNotification('Blog not found', 'error');
        return;
    }
    
    editingBlogId = id;
    
    document.getElementById('blogTitle').value = blog.title;
    document.getElementById('blogCategory').value = blog.category;
    document.getElementById('blogAuthor').value = blog.author;
    document.getElementById('blogDate').value = blog.date;
    document.getElementById('blogReadTime').value = blog.readTime;
    document.getElementById('blogFeatured').value = blog.featured;
    document.getElementById('blogExcerpt').value = blog.excerpt;
    document.getElementById('blogContent').value = blog.content;
    
    if (blog.imageUrl) {
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `<img src="${blog.imageUrl}" alt="Preview">`;
            preview.classList.add('show');
        }
    }
    
    const formTitle = document.getElementById('formTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    const cancelButton = document.getElementById('cancelBtn');
    
    if (formTitle) formTitle.textContent = 'Edit Blog Post';
    if (submitBtnText) submitBtnText.textContent = 'Update Blog Post';
    if (cancelButton) cancelButton.style.display = 'inline-block';
    
    const form = document.getElementById('blogForm');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// =================================
// DELETE BLOG
// =================================
function confirmDeleteBlog(id) {
    deleteTargetId = id;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('show');
}

const confirmDeleteBtn = document.getElementById('confirmDelete');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async function() {
        if (deleteTargetId) {
            console.log('🗑️ Deleting blog:', deleteTargetId);
            
            try {
                await db.collection('blogs').doc(deleteTargetId).delete();
                
                console.log('✅ Deleted blog from Firestore');
                
                showNotification('Blog deleted successfully!', 'success');
                await loadBlogs();
                
            } catch (error) {
                console.error('❌ Delete error:', error);
                showNotification('Error deleting blog: ' + error.message, 'error');
            }
            
            closeDeleteModal();
        }
    });
}

const cancelDeleteBtn = document.getElementById('cancelDelete');
if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
}

const modalCloseBtn = document.querySelector('.modal-close');
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeDeleteModal);
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('show');
    deleteTargetId = null;
}

// =================================
// CANCEL EDIT
// =================================
const cancelBtn = document.getElementById('cancelBtn');
if (cancelBtn) {
    cancelBtn.addEventListener('click', resetForm);
}

function resetForm() {
    const form = document.getElementById('blogForm');
    if (form) form.reset();
    
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = '';
        preview.classList.remove('show');
    }
    
    // Safely update form elements
    const formTitle = document.getElementById('formTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    const cancelButton = document.getElementById('cancelBtn');
    
    if (formTitle) {
        formTitle.textContent = 'Add New Blog Post';
    }
    
    if (submitBtnText) {
        submitBtnText.textContent = 'Add Blog Post';
    }
    
    if (cancelButton) {
        cancelButton.style.display = 'none';
    }
    
    editingBlogId = null;
    
    if (datepickerInstance) {
        datepickerInstance.setDate(new Date());
    }
}

// =================================
// SEARCH FUNCTIONALITY
// =================================
const searchInput = document.getElementById('searchBlogs');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBlogs = blogs.filter(blog => 
            blog.title.toLowerCase().includes(searchTerm) ||
            blog.category.toLowerCase().includes(searchTerm) ||
            blog.author.toLowerCase().includes(searchTerm) ||
            blog.excerpt.toLowerCase().includes(searchTerm)
        );
        
        const tbody = document.getElementById('blogTableBody');
        if (!tbody) return;
        
        if (filteredBlogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No blogs found matching your search.</td></tr>';
            return;
        }
        
        tbody.innerHTML = filteredBlogs.map(blog => `
            <tr>
                <td>
                    <img src="${blog.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Crect fill=\'%23252530\' width=\'60\' height=\'60\'/%3E%3C/svg%3E'}" alt="${escapeHtml(blog.title)}" class="blog-thumbnail">
                </td>
                <td class="blog-title-cell">${escapeHtml(blog.title)}</td>
                <td><span class="category-badge">${escapeHtml(blog.category)}</span></td>
                <td>${escapeHtml(blog.author)}</td>
                <td>${formatDate(blog.date)}</td>
                <td>
                    ${blog.featured === 'yes' ? '<span class="featured-badge">★ Featured</span>' : '-'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit" onclick="editBlog('${blog.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="confirmDeleteBlog('${blog.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    });
}

// =================================
// UTILITY FUNCTIONS
// =================================
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 2000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Admin.js with Firebase loaded successfully');