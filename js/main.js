// =================================
// GLOBAL VARIABLES
// =================================
let scene, camera, renderer, blockchainGroup;
let animationId;

// =================================
// NAVBAR SCROLL BEHAVIOR
// =================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const scrollPosition = window.scrollY;
    
    if (scrollPosition > 100) {
        navbar.classList.add('scrolled');
        navbar.classList.add('floating');
    } else {
        navbar.classList.remove('scrolled');
        navbar.classList.remove('floating');
    }
});

// =================================
// MOBILE NAVIGATION TOGGLE
// =================================
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// =================================
// 3D BLOCKCHAIN ANIMATION (THREE.JS)
// =================================
function init3DBlockchain() {
    const canvas = document.getElementById('blockchain-canvas');
    if (!canvas) return;
    
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 15;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Blockchain group
    blockchainGroup = new THREE.Group();
    scene.add(blockchainGroup);
    
    // Create blockchain nodes
    createBlockchainStructure();
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x7c3aed, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x8b5cf6, 2, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x6d28d9, 1.5, 50);
    pointLight2.position.set(-10, -10, 5);
    scene.add(pointLight2);
    
    // Start animation
    animate3DBlockchain();
    
    // Fade in canvas
    setTimeout(() => {
        canvas.style.opacity = '1';
    }, 300);
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function createBlockchainStructure() {
    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
        color: 0x7c3aed,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.5,
        wireframe: false,
        transparent: true,
        opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    blockchainGroup.add(core);
    
    // Orbiting nodes (blockchain blocks)
    const nodeCount = 12;
    const orbitRadius = 5;
    
    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        
        // Node (cube)
        const nodeGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const nodeMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b5cf6,
            emissive: 0x6d28d9,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        
        // Position in circular orbit
        node.position.x = Math.cos(angle) * orbitRadius;
        node.position.y = Math.sin(angle) * orbitRadius;
        node.position.z = Math.sin(angle * 2) * 2;
        
        // Add node to group
        blockchainGroup.add(node);
        
        // Create connection lines between nodes and core
        const points = [];
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(
            node.position.x,
            node.position.y,
            node.position.z
        ));
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x7c3aed,
            transparent: true,
            opacity: 0.3
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        blockchainGroup.add(line);
    }
    
    // Add rotating rings
    createRotatingRings();
    
    // Add particle field
    createParticleField();
}

function createRotatingRings() {
    const ringCount = 3;
    
    for (let i = 0; i < ringCount; i++) {
        const radius = 6 + i * 1.5;
        const points = [];
        const segments = 64;
        
        for (let j = 0; j <= segments; j++) {
            const angle = (j / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            ));
        }
        
        const ringGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const ringMaterial = new THREE.LineBasicMaterial({
            color: 0x7c3aed,
            transparent: true,
            opacity: 0.2
        });
        const ring = new THREE.Line(ringGeometry, ringMaterial);
        
        // Rotate each ring differently
        ring.rotation.x = Math.PI / 2 + (i * Math.PI / 6);
        ring.rotation.y = i * Math.PI / 4;
        
        blockchainGroup.add(ring);
    }
}

function createParticleField() {
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 20;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x8b5cf6,
        size: 0.05,
        transparent: true,
        opacity: 0.6
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
}

function animate3DBlockchain() {
    animationId = requestAnimationFrame(animate3DBlockchain);
    
    if (blockchainGroup) {
        // Slow rotation of entire blockchain structure
        blockchainGroup.rotation.y += 0.002;
        blockchainGroup.rotation.x += 0.001;
        
        // Pulse effect on nodes
        const time = Date.now() * 0.001;
        blockchainGroup.children.forEach((child, index) => {
            if (child.geometry && child.geometry.type === 'BoxGeometry') {
                child.rotation.x += 0.01;
                child.rotation.y += 0.01;
                
                // Subtle pulse
                const scale = 1 + Math.sin(time + index) * 0.1;
                child.scale.set(scale, scale, scale);
            }
        });
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const canvas = document.getElementById('blockchain-canvas');
    if (!canvas) return;
    
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

// =================================
// PAGE LOAD ANIMATIONS (ANIME.JS)
// =================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D blockchain if on home page
    if (document.getElementById('blockchain-canvas')) {
        init3DBlockchain();
    }
    
    // Hero text animations
    if (document.querySelector('.hero-title')) {
        anime({
            targets: '.hero-title .line',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: anime.stagger(100, {start: 300}),
            easing: 'easeOutExpo'
        });
        
        anime({
            targets: '.hero-description',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: 800,
            easing: 'easeOutExpo'
        });
        
        anime({
            targets: '.hero-buttons',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: 1000,
            easing: 'easeOutExpo'
        });
        
        anime({
            targets: '.hero-stats',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800,
            delay: 1200,
            easing: 'easeOutExpo'
        });
    }
    
    // Scroll reveal animations for cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anime({
                    targets: entry.target,
                    translateY: [30, 0],
                    opacity: [0, 1],
                    duration: 800,
                    easing: 'easeOutExpo'
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all cards
    document.querySelectorAll('.feature-card, .service-card-large, .project-card, .blog-card, .value-item, .team-card, .process-step').forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });
});

// =================================
// PROJECT FILTERING
// =================================
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            
            // Filter projects
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    anime({
                        targets: card,
                        scale: [0.8, 1],
                        opacity: [0, 1],
                        duration: 400,
                        easing: 'easeOutExpo'
                    });
                } else {
                    anime({
                        targets: card,
                        scale: [1, 0.8],
                        opacity: [1, 0],
                        duration: 400,
                        easing: 'easeOutExpo',
                        complete: () => {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    });
}

// =================================
// CONTACT FORM HANDLING
// =================================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Animate button
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
            submitButton.textContent = 'Message Sent!';
            submitButton.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            
            // Reset form
            contactForm.reset();
            
            // Reset button after delay
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                submitButton.style.background = '';
            }, 3000);
        }, 2000);
    });
}

// =================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// =================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// =================================
// BUTTON HOVER ANIMATIONS
// =================================
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function() {
        anime({
            targets: this,
            scale: 1.05,
            duration: 300,
            easing: 'easeOutExpo'
        });
    });
    
    button.addEventListener('mouseleave', function() {
        anime({
            targets: this,
            scale: 1,
            duration: 300,
            easing: 'easeOutExpo'
        });
    });
});

// =================================
// STATS COUNTER ANIMATION
// =================================
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + (element.dataset.suffix || '');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Observer for stats
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number, .stat-number-large');
            if (statNumber && !statNumber.classList.contains('animated')) {
                statNumber.classList.add('animated');
                const text = statNumber.textContent;
                const value = parseInt(text.replace(/\D/g, ''));
                const suffix = text.replace(/[0-9]/g, '');
                statNumber.dataset.suffix = suffix;
                animateValue(statNumber, 0, value, 2000);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item, .stat-card').forEach(stat => {
    statsObserver.observe(stat);
});

// =================================
// FORM INPUT FOCUS ANIMATIONS
// =================================
document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(input => {
    input.addEventListener('focus', function() {
        anime({
            targets: this,
            scale: [1, 1.02],
            duration: 300,
            easing: 'easeOutExpo'
        });
    });
    
    input.addEventListener('blur', function() {
        anime({
            targets: this,
            scale: [1.02, 1],
            duration: 300,
            easing: 'easeOutExpo'
        });
    });
});

// =================================
// CLEANUP ON PAGE UNLOAD
// =================================
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (renderer) {
        renderer.dispose();
    }
});

// =================================
// NEWSLETTER FORM
// =================================
const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const button = newsletterForm.querySelector('button');
        const originalText = button.textContent;
        
        button.textContent = 'Subscribing...';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = 'Subscribed!';
            button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            
            newsletterForm.querySelector('input').value = '';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 3000);
        }, 1500);
    });
}

// =================================
// PARALLAX EFFECT ON MOUSE MOVE
// =================================
if (document.getElementById('blockchain-canvas')) {
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        
        if (camera) {
            anime({
                targets: camera.position,
                x: mouseX * 2,
                y: mouseY * 2,
                duration: 1000,
                easing: 'easeOutExpo'
            });
        }
    });
}

// =================================
// LOADING OPTIMIZATION
// =================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});


// =================================
// LOAD AND DISPLAY TECHNOLOGIES FROM FIREBASE
// =================================
async function loadTechnologies() {
    try {
        const snapshot = await db.collection('technologies')
            .orderBy('name', 'asc')
            .get();
        
        const technologies = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (technologies.length > 0) {
            renderTechnologies(technologies);
        } else {
            // Fallback to static technologies if none in database
            const fallbackTechs = [
                { name: 'Ethereum' },
                { name: 'Solidity' },
                { name: 'Polygon' },
                { name: 'Hyperledger' },
                { name: 'Web3.js' },
                { name: 'IPFS' },
                { name: 'Rust' },
                { name: 'Solana' }
            ];
            renderTechnologies(fallbackTechs);
        }
    } catch (error) {
        console.error('Error loading technologies:', error);
        // Fallback technologies
        const fallbackTechs = [
            { name: 'Ethereum' },
            { name: 'Solidity' },
            { name: 'Polygon' },
            { name: 'Hyperledger' },
            { name: 'Web3.js' },
            { name: 'IPFS' },
            { name: 'Rust' },
            { name: 'Solana' }
        ];
        renderTechnologies(fallbackTechs);
    }
}

function renderTechnologies(technologies) {
    const row1 = document.getElementById('techScrollRow1');
    const row2 = document.getElementById('techScrollRow2');
    
    if (!row1 || !row2) return;
    
    // Split technologies into two rows
    const midpoint = Math.ceil(technologies.length / 2);
    const row1Techs = technologies.slice(0, midpoint);
    const row2Techs = technologies.slice(midpoint);
    
    // Create tech items HTML
    const createTechItems = (techs) => {
        return techs.map(tech => 
            `<div class="tech-item">${escapeHtml(tech.name)}</div>`
        ).join('');
    };
    
    // Duplicate content for seamless loop
    const row1Content = createTechItems(row1Techs);
    const row2Content = createTechItems(row2Techs);
    
    row1.innerHTML = row1Content + row1Content;
    row2.innerHTML = row2Content + row2Content;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load technologies when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to initialize
    setTimeout(() => {
        loadTechnologies();
    }, 500);
});