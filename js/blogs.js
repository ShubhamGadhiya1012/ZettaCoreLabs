// =================================
// BLOG PAGE WITH FIREBASE
// =================================

let allBlogs = [];

// =================================
// BLOCKCHAIN LOADER FUNCTIONS
// =================================
function showBlockchainLoader() {
    const loader = document.createElement('div');
    loader.className = 'blockchain-loader-overlay';
    loader.id = 'blockchainLoader';
    loader.innerHTML = `
        <div class="blockchain-loader-container">
            <div class="blockchain-network">
                <div class="connection-line connection-line-1"></div>
                <div class="connection-line connection-line-2"></div>
                <div class="block-center"></div>
                <div class="block-orbit block-orbit-1"></div>
                <div class="block-orbit block-orbit-2"></div>
                <div class="block-orbit block-orbit-3"></div>
                <div class="block-orbit block-orbit-4"></div>
            </div>
            <div class="loading-text">
                Loading Blogs
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideBlockchainLoader() {
    const loader = document.getElementById('blockchainLoader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.remove();
        }, 500);
    }
}

// =================================
// LOAD BLOGS ON PAGE LOAD
// =================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Blog page loaded with Firebase');
    showBlockchainLoader();
    loadBlogsFromFirestore();
    setupNewsletterForm();
});

// =================================
// LOAD BLOGS FROM FIRESTORE
// =================================
async function loadBlogsFromFirestore() {
    try {
        console.log('📂 Loading blogs from Firestore...');
        
        const snapshot = await db.collection('blogs')
            .orderBy('createdAt', 'desc')
            .get();
        
        allBlogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('✅ Loaded', allBlogs.length, 'blogs from Firestore');
        
        // Add delay for loader animation
        setTimeout(() => {
            hideBlockchainLoader();
            
            if (allBlogs.length > 0) {
                renderFeaturedPost();
                renderBlogGrid();
            } else {
                showEmptyState();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error loading blogs:', error);
        hideBlockchainLoader();
        showEmptyState();
        showErrorMessage('Error loading blog posts. Please try refreshing the page.');
    }
}

// =================================
// RENDER FEATURED POST
// =================================
function renderFeaturedPost() {
    const featuredContainer = document.getElementById('featuredPostContainer');
    
    const featuredBlog = allBlogs.find(blog => blog.featured === 'yes') || allBlogs[0];
    
    if (!featuredBlog) {
        featuredContainer.innerHTML = '';
        return;
    }
    
    const imageUrl = featuredBlog.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'400\'%3E%3Crect fill=\'%23252530\' width=\'800\' height=\'400\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%237c3aed\' font-family=\'Arial\' font-size=\'48\'%3E📝%3C/text%3E%3C/svg%3E';
    
    featuredContainer.innerHTML = `
        <div class="featured-card fade-in">
            <div class="featured-image">
                <img src="${imageUrl}" alt="${escapeHtml(featuredBlog.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'400\'%3E%3Crect fill=\'%23252530\' width=\'800\' height=\'400\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%237c3aed\' font-family=\'Arial\' font-size=\'48\'%3E📝%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="featured-content">
                <span class="featured-badge">Featured Article</span>
                <div class="blog-meta">
                    <span class="blog-category">${escapeHtml(featuredBlog.category)}</span>
                    <span class="blog-date">${formatDate(featuredBlog.date)}</span>
                    <span class="blog-read">${escapeHtml(featuredBlog.readTime)} min read</span>
                </div>
                <h2>${escapeHtml(featuredBlog.title)}</h2>
                <p>${escapeHtml(featuredBlog.excerpt)}</p>
                <button class="btn btn-primary" onclick="viewFullPost('${featuredBlog.id}')">Read Full Article</button>
            </div>
        </div>
    `;
}

// =================================
// RENDER BLOG GRID
// =================================
function renderBlogGrid() {
    const gridContainer = document.getElementById('blogGridContainer');
    
    const featuredBlog = allBlogs.find(blog => blog.featured === 'yes');
    const gridBlogs = allBlogs.filter(blog => blog.id !== (featuredBlog?.id));
    
    if (gridBlogs.length === 0 && !featuredBlog) {
        gridContainer.innerHTML = '<div class="empty-blog-state" style="grid-column: 1 / -1;"><p>More articles coming soon!</p></div>';
        return;
    }
    
    if (gridBlogs.length === 0) {
        gridContainer.innerHTML = '';
        return;
    }
    
    gridContainer.innerHTML = gridBlogs.map((blog, index) => {
        const imageUrl = blog.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'200\'%3E%3Crect fill=\'%23252530\' width=\'400\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%237c3aed\' font-family=\'Arial\' font-size=\'32\'%3E📝%3C/text%3E%3C/svg%3E';
        
        return `
        <article class="blog-card slide-up" style="animation-delay: ${index * 0.1}s">
            <div class="blog-image">
                <img src="${imageUrl}" alt="${escapeHtml(blog.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'200\'%3E%3Crect fill=\'%23252530\' width=\'400\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%237c3aed\' font-family=\'Arial\' font-size=\'32\'%3E📝%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-category category-badge ${getCategoryClass(blog.category)}">${escapeHtml(blog.category)}</span>
                    <span class="blog-date">${formatDate(blog.date)}</span>
                </div>
                <h3>${escapeHtml(blog.title)}</h3>
                <p>${escapeHtml(blog.excerpt)}</p>
                <div class="blog-footer">
                    <div class="blog-author">
                        <div class="author-avatar-small">${getInitials(blog.author)}</div>
                        <span>By ${escapeHtml(blog.author)}</span>
                    </div>
                    <a href="#" class="blog-link" onclick="viewFullPost('${blog.id}'); return false;">Read More →</a>
                </div>
            </div>
        </article>
    `}).join('');
}

// =================================
// SHOW EMPTY STATE
// =================================
function showEmptyState() {
    const featuredContainer = document.getElementById('featuredPostContainer');
    const gridContainer = document.getElementById('blogGridContainer');
    
    featuredContainer.innerHTML = '';
    gridContainer.innerHTML = `
        <div class="empty-blog-state" style="grid-column: 1 / -1;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
            <h3>No Blog Posts Yet</h3>
            <p>Check back soon for insightful articles about blockchain technology and Web3!</p>
        </div>
    `;
}

// =================================
// VIEW FULL POST - MAGAZINE LAYOUT
// =================================
function viewFullPost(blogId) {
    const blog = allBlogs.find(b => b.id === blogId);
    
    if (!blog) {
        showErrorMessage('Blog post not found!');
        return;
    }
    
    const imageUrl = blog.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'250\'%3E%3Crect fill=\'%23252530\' width=\'300\' height=\'250\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%237c3aed\' font-family=\'Arial\' font-size=\'32\'%3E📝%3C/text%3E%3C/svg%3E';
    
    const modal = document.createElement('div');
    modal.className = 'blog-modal';
    modal.innerHTML = `
        <div class="blog-modal-overlay" onclick="closeBlogModal()"></div>
        <div class="blog-modal-wrapper">
            <button class="blog-modal-close" onclick="closeBlogModal()" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="blog-modal-scroll">
                <article class="full-blog-post">
                    <div class="blog-post-content-wrapper">
                        <div class="blog-post-image-float">
                            <img src="${imageUrl}" alt="${escapeHtml(blog.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'250\'%3E%3Crect fill=\'%23252530\' width=\'300\' height=\'250\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%237c3aed\' font-family=\'Arial\' font-size=\'32\'%3E📝%3C/text%3E%3C/svg%3E'">
                        </div>
                        <div class="blog-modal-meta">
                            <span class="blog-modal-category category-badge ${getCategoryClass(blog.category)}">${escapeHtml(blog.category)}</span>
                            <span class="blog-modal-date">${formatDate(blog.date)}</span>
                            <span class="blog-modal-read">${escapeHtml(blog.readTime)} min read</span>
                        </div>
                        <div class="blog-modal-author-info">
                            <div class="blog-modal-author-avatar">${getInitials(blog.author)}</div>
                            <span class="blog-modal-author-name">By ${escapeHtml(blog.author)}</span>
                        </div>
                        <h1 class="blog-modal-title">${escapeHtml(blog.title)}</h1>
                        <div class="blog-modal-content-text">
                            ${formatBlogContent(blog.content)}
                        </div>
                    </div>
                </article>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    if (!document.getElementById('blogModalStyles')) {
        addBlogModalStyles();
    }
}

function closeBlogModal() {
    const modal = document.querySelector('.blog-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// =================================
// ADD BLOG MODAL STYLES - MAGAZINE LAYOUT
// =================================
function addBlogModalStyles() {
    const style = document.createElement('style');
    style.id = 'blogModalStyles';
    style.textContent = `
        .blog-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .blog-modal.active {
            opacity: 1;
        }
        
        .blog-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(5, 5, 8, 0.95);
            backdrop-filter: blur(10px);
        }
        
        .blog-modal-wrapper {
            position: relative;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            z-index: 1;
            transform: scale(0.9) translateY(50px);
            transition: transform 0.3s ease;
            overflow: hidden;
        }
        
        .blog-modal.active .blog-modal-wrapper {
            transform: scale(1) translateY(0);
        }
        
        .blog-modal-close {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            width: 42px;
            height: 42px;
            background: rgba(124, 58, 237, 0.15);
            border: 1px solid var(--primary-purple);
            border-radius: 50%;
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        
        .blog-modal-close svg {
            width: 20px;
            height: 20px;
        }
        
        .blog-modal-close:hover {
            background: var(--primary-purple);
            transform: rotate(90deg);
        }
        
        .blog-modal-scroll {
            height: 90vh;
            max-height: 90vh;
            overflow-y: auto;
            padding: 3rem;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        
        .blog-modal-scroll::-webkit-scrollbar {
            display: none;
        }
        
        .blog-post-content-wrapper {
            max-width: 100%;
        }
        
        .blog-post-image-float {
            float: left;
            width: 300px;
            height: 250px;
            margin: 0 2rem 1.5rem 0;
            border-radius: 12px;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(109, 40, 217, 0.2));
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .blog-post-image-float img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }
        
        .blog-modal-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        
        .blog-modal-category {
            padding: 0.5rem 1rem;
            background: rgba(124, 58, 237, 0.2);
            border: 1px solid var(--primary-purple);
            border-radius: 20px;
            color: var(--primary-purple-light);
            font-weight: 600;
        }
        
        .blog-modal-date,
        .blog-modal-read {
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .blog-modal-author-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .blog-modal-author-avatar {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(109, 40, 217, 0.3));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1rem;
            flex-shrink: 0;
        }
        
        .blog-modal-author-name {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .blog-modal-title {
            font-size: 2.25rem;
            line-height: 1.3;
            color: var(--text-primary);
            margin: 0 0 1.5rem 0;
        }
        
        .blog-modal-content-text {
            color: var(--text-secondary);
            line-height: 1.8;
            font-size: 1.05rem;
            clear: both;
        }
        
        .blog-modal-content-text::after {
            content: "";
            display: table;
            clear: both;
        }
        
        .blog-modal-content-text p {
            margin-bottom: 1.5rem;
        }
        
        .blog-modal-content-text h2 {
            margin: 2.5rem 0 1rem;
            color: var(--text-primary);
            font-size: 1.75rem;
            clear: both;
        }
        
        .blog-modal-content-text h3 {
            margin: 2rem 0 0.75rem;
            color: var(--text-primary);
            font-size: 1.375rem;
        }
        
        .blog-modal-content-text ul,
        .blog-modal-content-text ol {
            margin-bottom: 1.5rem;
            padding-left: 2rem;
        }
        
        .blog-modal-content-text li {
            margin-bottom: 0.5rem;
        }
        
        .blog-modal-content-text code {
            background: rgba(124, 58, 237, 0.1);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: var(--primary-purple-light);
        }
        
        @media (max-width: 768px) {
            .blog-modal-wrapper {
                width: 95%;
            }
            
            .blog-modal-scroll {
                padding: 2rem 1.5rem;
            }
            
            .blog-post-image-float {
                float: none;
                width: 100%;
                height: 220px;
                margin: 0 0 1.5rem 0;
            }
            
            .blog-modal-title {
                font-size: 1.75rem;
            }
            
            .blog-modal-close {
                width: 38px;
                height: 38px;
                top: 1rem;
                right: 1rem;
            }
        }
        
        @media (max-width: 480px) {
            .blog-modal-scroll {
                padding: 1.5rem 1rem;
            }
            
            .blog-modal-title {
                font-size: 1.5rem;
            }
            
            .blog-modal-content-text {
                font-size: 1rem;
            }
            
            .blog-post-image-float {
                height: 200px;
            }
        }
    `;
    document.head.appendChild(style);
}

// =================================
// NEWSLETTER FORM
// =================================
function setupNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const button = newsletterForm.querySelector('button');
            const input = newsletterForm.querySelector('input');
            const originalText = button.textContent;
            
            button.textContent = 'Subscribing...';
            button.disabled = true;
            
            setTimeout(() => {
                button.textContent = 'Subscribed!';
                button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                
                input.value = '';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    button.style.background = '';
                }, 3000);
            }, 1500);
        });
    }
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

function getInitials(name) {
    try {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    } catch (error) {
        return '??';
    }
}

function getCategoryClass(category) {
    const categoryMap = {
        'Blockchain': 'blockchain',
        'DeFi': 'defi',
        'NFT': 'nft',
        'Security': 'security',
        'Web3': 'blockchain',
        'Smart Contracts': 'blockchain',
        'AI': 'blockchain',
        'Enterprise': 'blockchain',
        'Tutorial': 'blockchain'
    };
    return categoryMap[category] || 'blockchain';
}

function formatBlogContent(content) {
    if (!content) return '<p>No content available.</p>';
    
    try {
        content = escapeHtml(content);
        
        const paragraphs = content.split('\n\n');
        return paragraphs.map(p => {
            p = p.trim();
            if (p.startsWith('## ')) {
                return `<h2>${p.substring(3)}</h2>`;
            } else if (p.startsWith('### ')) {
                return `<h3>${p.substring(4)}</h3>`;
            } else if (p.startsWith('- ')) {
                const items = p.split('\n').map(item => 
                    item.startsWith('- ') ? `<li>${item.substring(2)}</li>` : ''
                ).join('');
                return `<ul>${items}</ul>`;
            } else if (p) {
                return `<p>${p.replace(/\n/g, '<br>')}</p>`;
            }
            return '';
        }).join('');
    } catch (error) {
        console.error('Error formatting content:', error);
        return `<p>${escapeHtml(content)}</p>`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: #ef4444;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ESC key to close modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeBlogModal();
    }
});

console.log('✅ blogs.js with Firebase and Blockchain Loader loaded successfully');