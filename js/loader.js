// =================================
// LOADER.JS — SVG Logo Loader
// Shared across all pages
// =================================
'use strict';

let _loaderInterval = null;
let _loaderVisible = false;

function showBlockchainLoader() {
    if (_loaderVisible) return;
    _loaderVisible = true;

    // Remove any existing loader
    const existing = document.getElementById('blockchainLoaderOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'blockchainLoaderOverlay';
    overlay.className = 'blockchain-loader-overlay';

    overlay.innerHTML = `
        <div class="logo-wrapper">
            <img
                src="assets/images/loader-logo.svg"
                class="logo-svg"
                alt="ZettaCoreLab"
                onerror="this.style.display='none'"
            />
            <div class="logo-counter" id="loaderCounter">0</div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate counter 0 → 21, then loop back to 0
    let count = 0;
    const counter = overlay.querySelector('#loaderCounter');

    _loaderInterval = setInterval(() => {
        if (!counter) return;
        
        count++;
        
        // Reset to 0 after reaching 21
        if (count > 21) {
            count = 0;
        }
        
        counter.textContent = count;

        // Flash animation reset trick
        counter.style.animation = 'none';
        void counter.offsetWidth;
        counter.style.animation = 'counterFlash 0.12s ease-out';
        
    }, 100); // Adjust timing as needed (100ms per count)
}

function hideBlockchainLoader() {
    // Always stop the counter immediately
    if (_loaderInterval) {
        clearInterval(_loaderInterval);
        _loaderInterval = null;
    }

    _loaderVisible = false;

    const overlay = document.getElementById('blockchainLoaderOverlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        }, 500);
    }
}