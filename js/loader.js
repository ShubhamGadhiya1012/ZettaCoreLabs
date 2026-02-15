// =================================
// ANIMATED SVG LOGO LOADER
// =================================

let counterInterval = null; // Store interval reference globally

/**
 * Show the animated SVG logo loader
 * Call this function when you want to display the loader
 */
function showBlockchainLoader() {
    const loader = document.createElement('div');
    loader.className = 'blockchain-loader-overlay';
    loader.id = 'blockchainLoader';
    loader.innerHTML = `
        <div class="logo-wrapper">
            <!-- SVG LOGO -->
            <img src="assets/images/loader-logo.svg" class="logo-svg" alt="ZettaCore Logo">
            
            <!-- DYNAMIC COUNTER -->
            <div class="logo-counter" id="logoCounter">1</div>
        </div>
    `;
    document.body.appendChild(loader);
    
    // Start counter animation
    startLoaderCounter();
}

/**
 * Start the animated counter that counts from 1 to 21
 * Can be stopped early when data loads
 */
function startLoaderCounter() {
    const counter = document.getElementById("logoCounter");
    if (!counter) return;
    
    const MAX = 21;
    const DURATION = 1500;
    const STEP = DURATION / MAX;
    
    let value = 1;
    
    counterInterval = setInterval(() => {
        counter.textContent = value;
        
        // Flash animation - reset and retrigger
        counter.style.animation = "none";
        void counter.offsetWidth; // Force reflow to restart animation
        counter.style.animation = "counterFlash 0.12s ease-out";
        
        value++;
        if (value > MAX) {
            clearInterval(counterInterval);
            counterInterval = null;
        }
    }, STEP);
}

/**
 * Stop the counter immediately
 */
function stopLoaderCounter() {
    if (counterInterval) {
        clearInterval(counterInterval);
        counterInterval = null;
    }
}

/**
 * Hide the loader with fade-out animation
 * Call this function when content is ready to be displayed
 * Stops counter immediately and hides loader
 */
function hideBlockchainLoader() {
    // Stop counter immediately
    stopLoaderCounter();
    
    const loader = document.getElementById('blockchainLoader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.remove();
        }, 500);
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showBlockchainLoader,
        hideBlockchainLoader,
        startLoaderCounter,
        stopLoaderCounter
    };
}