/*
  Infinite Gradient 3D Carousel
  A smooth, infinite-scrolling 3D carousel with dynamic gradient backgrounds
  that change based on the active card's colors.
*/

// ============================================================================
// CONFIGURATION
// ============================================================================

const IMAGES = [
  './assets/img/turtle_1.webp',
  './assets/img/turtle_2.webp',
  './assets/img/turtle_3.webp',
  './assets/img/turtle_4.webp',
  './assets/img/turtle_5.webp',
  './assets/img/turtle_6.webp',
  './assets/img/img07.webp',
  './assets/img/img08.webp',
  './assets/img/img09.webp',
  './assets/img/diep_rua.webp',
];

// Physics constants
const FRICTION = 0.9;           // Velocity decay (0-1, lower = more friction)
const WHEEL_SENS = 0.6;         // Mouse wheel sensitivity
const DRAG_SENS = 1.0;          // Drag sensitivity

// Visual constants
const MAX_ROTATION = 28;        // Maximum card rotation in degrees
const MAX_DEPTH = 140;          // Maximum Z-axis depth in pixels
const MIN_SCALE = 0.92;         // Minimum card scale
const SCALE_RANGE = 0.1;        // Scale variation range
const GAP = 28;                 // Gap between cards in pixels

// ============================================================================
// DOM REFERENCES
// ============================================================================

const stage = document.querySelector('.stage');
const cardsRoot = document.getElementById('cards');
const bgCanvas = document.getElementById('bg');
const bgCtx = bgCanvas?.getContext('2d', { alpha: false });
const loader = document.getElementById('loader');

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Carousel state
let items = [];                 // Array of {el: HTMLElement, x: number}
let positions = [];             // Float32Array for wrapped positions
let activeIndex = -1;           // Currently centered card index
let isEntering = true;          // Prevents interaction during entry animation

// Layout measurements
let CARD_W = 300;               // Card width (measured dynamically)
let CARD_H = 400;               // Card height (measured dynamically)
let STEP = CARD_W + GAP;        // Distance between card centers
let TRACK = 0;                  // Total carousel track length
let SCROLL_X = 0;               // Current scroll position
let VW_HALF = window.innerWidth * 0.5;

// Physics state
let vX = 0;                     // Velocity in X direction

// Animation frame IDs
let rafId = null;               // Carousel animation frame
let bgRAF = null;               // Background animation frame
let lastTime = 0;               // Last frame timestamp
let lastBgDraw = 0;             // Last background draw time

// Background gradient state
let gradPalette = [];           // Extracted colors from each image
let gradCurrent = {             // Current interpolated gradient colors
  r1: 240, g1: 240, b1: 240,    // First gradient color (RGB)
  r2: 235, g2: 235, b2: 235     // Second gradient color (RGB)
};
let bgFastUntil = 0;            // Timestamp until which to render at high FPS

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safe modulo operation that handles negative numbers correctly
 * @param {number} n - The dividend
 * @param {number} m - The divisor
 * @returns {number} The positive remainder
 */
function mod(n, m) {
  return ((n % m) + m) % m;
}

// ============================================================================
// IMAGE PRELOADING
// ============================================================================

/**
 * Preload images using link tags for browser optimization
 * @param {string[]} srcs - Array of image URLs
 */
function preloadImageLinks(srcs) {
  if (!document.head) return;
  
  srcs.forEach((href) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  });
}

/**
 * Wait for all card images to finish loading
 * @returns {Promise<void>}
 */
function waitForImages() {
  const promises = items.map((it) => {
    const img = it.el.querySelector('img');
    if (!img || img.complete) return Promise.resolve();

    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  });

  return Promise.all(promises);
}

/**
 * Decode all images to prevent jank during first interaction
 * @returns {Promise<void>}
 */
async function decodeAllImages() {
  const tasks = items.map((it) => {
    const img = it.el.querySelector('img');
    if (!img) return Promise.resolve();

    if (typeof img.decode === 'function') {
      return img.decode().catch(() => {});
    }

    return Promise.resolve();
  });

  await Promise.allSettled(tasks);
}

// ============================================================================
// CAROUSEL SETUP
// ============================================================================

/**
 * Create card DOM elements from image array
 */
function createCards() {
  cardsRoot.innerHTML = '';
  items = [];

  const fragment = document.createDocumentFragment();

  IMAGES.forEach((src, i) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.willChange = 'transform'; // Force GPU compositing

    const img = document.createElement('div');
    img.className = 'card__img';
    img.style.backgroundImage = `url(${src})`;
    img.style.backgroundSize = 'cover';
    img.style.backgroundPosition = 'center';
    img.dataset.src = src;

    // Gắn ID để link với bảng chi tiết
    card.dataset.id = i;

    card.appendChild(img);
    fragment.appendChild(card);
    items.push({ el: card, x: i * STEP });
  });

  cardsRoot.appendChild(fragment);

  // Khởi tạo hiệu ứng gợn sóng nước (ripples)
  if (window.jQuery && $.fn.ripples) {
    try {
      $(cardsRoot).find('.card__img').ripples({
        perturbance: 0.04,
        resolution: 425
      });
    } catch (e) {
      console.error("Ripples error:", e);
    }
  }
}

/**
 * Measure card dimensions and calculate layout
 */
function measure() {
  const sample = items[0]?.el;
  if (!sample) return;

  const r = sample.getBoundingClientRect();
  CARD_W = r.width || CARD_W;
  CARD_H = r.height || CARD_H;
  STEP = CARD_W + GAP;
  TRACK = items.length * STEP;

  // Set initial positions
  items.forEach((it, i) => {
    it.x = i * STEP;
  });

  positions = new Float32Array(items.length);
}

// ============================================================================
// TRANSFORM CALCULATIONS
// ============================================================================

function computeTransformComponents(screenX) {
  const norm = Math.max(-1, Math.min(1, screenX / VW_HALF));
  const absNorm = Math.abs(norm);
  const invNorm = 1 - absNorm;

  const ry = -norm * MAX_ROTATION;
  const tz = invNorm * MAX_DEPTH;
  const scale = MIN_SCALE + invNorm * SCALE_RANGE;

  return { norm, absNorm, invNorm, ry, tz, scale };
}


/**
 * Calculate 3D transform for a card based on its screen position
 * @param {number} screenX - Card's X position relative to viewport center
 * @returns {{transform: string, z: number}} Transform string and Z-depth
 */
function transformForScreenX(screenX) {
  const { ry, tz, scale } = computeTransformComponents(screenX);

  return {
    transform: `translate3d(${screenX}px,-50%,${tz}px) rotateY(${ry}deg) scale(${scale})`,
    z: tz,
  };
}

/**
 * Update all card transforms based on current scroll position
 */
function updateCarouselTransforms() {
  const half = TRACK / 2;
  let closestIdx = -1;
  let closestDist = Infinity;

  // Calculate wrapped positions for infinite scroll
  for (let i = 0; i < items.length; i++) {
    let pos = items[i].x - SCROLL_X;
    
    // Wrap position to nearest equivalent position
    if (pos < -half) pos += TRACK;
    if (pos > half) pos -= TRACK;
    
    positions[i] = pos;

    // Track closest card to center
    const dist = Math.abs(pos);
    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = i;
    }
  }

  // Get adjacent cards for selective blur
  const prevIdx = (closestIdx - 1 + items.length) % items.length;
  const nextIdx = (closestIdx + 1) % items.length;

  // Apply transforms to all cards
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const pos = positions[i];
    const norm = Math.max(-1, Math.min(1, pos / VW_HALF));
    const { transform, z } = transformForScreenX(pos);

    it.el.style.transform = transform;
    it.el.style.zIndex = String(1000 + Math.round(z)); // Higher z-index for cards in front

    // Apply subtle blur to non-core cards
    const isCore = i === closestIdx || i === prevIdx || i === nextIdx;
    const blur = isCore ? 0 : 2 * Math.pow(Math.abs(norm), 1.1);
    it.el.style.filter = `blur(${blur.toFixed(2)}px)`;
  }

  // Update gradient if active card changed
  if (closestIdx !== activeIndex) {
    setActiveGradient(closestIdx);
  }
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

/**
 * Main animation loop for carousel movement
 * @param {number} t - Current timestamp
 */
function tick(t) {
  const dt = lastTime ? (t - lastTime) / 1000 : 0;
  lastTime = t;

  // Apply velocity to scroll position
  SCROLL_X = mod(SCROLL_X + vX * dt, TRACK);

  // Apply friction to velocity
  const decay = Math.pow(FRICTION, dt * 60);
  vX *= decay;
  if (Math.abs(vX) < 0.02) vX = 0;

  updateCarouselTransforms();
  rafId = requestAnimationFrame(tick);
}

/**
 * Start the carousel animation loop
 */
function startCarousel() {
  cancelCarousel();
  lastTime = 0;
  rafId = requestAnimationFrame((t) => {
    updateCarouselTransforms();
    tick(t);
  });
}

/**
 * Stop the carousel animation loop
 */
function cancelCarousel() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

// ============================================================================
// COLOR EXTRACTION & UTILITIES
// ============================================================================

/**
 * Convert RGB to HSL color space
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {[number, number, number]} [hue (0-360), saturation (0-1), lightness (0-1)]
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0; // Achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

/**
 * Convert HSL to RGB color space
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {[number, number, number]} [red (0-255), green (0-255), blue (0-255)]
 */
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Generate fallback colors when extraction fails
 * @param {number} idx - Card index
 * @returns {{c1: number[], c2: number[]}} Two RGB colors
 */
function fallbackFromIndex(idx) {
  const h = (idx * 37) % 360; // Spread hues across spectrum
  const s = 0.65;
  const c1 = hslToRgb(h, s, 0.52);
  const c2 = hslToRgb(h, s, 0.72);
  return { c1, c2 };
}

/**
 * Extract dominant colors from an image using histogram analysis
 * @param {HTMLImageElement} img - Image element to analyze
 * @param {number} idx - Card index (for fallback)
 * @returns {{c1: number[], c2: number[]}} Two dominant RGB colors
 */
function extractColors(img, idx) {
  try {
    // Downscale image for faster processing
    const MAX = 48;
    const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    const tw = ratio >= 1 ? MAX : Math.max(16, Math.round(MAX * ratio));
    const th = ratio >= 1 ? Math.max(16, Math.round(MAX / ratio)) : MAX;

    // Draw image to temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, tw, th);
    const data = ctx.getImageData(0, 0, tw, th).data;

    // Create 2D histogram bins (hue × saturation)
    const H_BINS = 36; // 10° hue increments
    const S_BINS = 5;  // 20% saturation increments
    const SIZE = H_BINS * S_BINS;
    const wSum = new Float32Array(SIZE); // Weighted pixel count
    const rSum = new Float32Array(SIZE); // Weighted red sum
    const gSum = new Float32Array(SIZE); // Weighted green sum
    const bSum = new Float32Array(SIZE); // Weighted blue sum

    // Analyze each pixel
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      if (a < 0.05) continue; // Skip transparent pixels

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const [h, s, l] = rgbToHsl(r, g, b);

      // Skip near-white, near-black, and desaturated colors
      if (l < 0.1 || l > 0.92 || s < 0.08) continue;

      // Weight by saturation and mid-tone preference
      const w = a * (s * s) * (1 - Math.abs(l - 0.5) * 0.6);
      
      // Calculate bin indices
      const hi = Math.max(0, Math.min(H_BINS - 1, Math.floor((h / 360) * H_BINS)));
      const si = Math.max(0, Math.min(S_BINS - 1, Math.floor(s * S_BINS)));
      const bidx = hi * S_BINS + si;

      // Accumulate weighted values
      wSum[bidx] += w;
      rSum[bidx] += r * w;
      gSum[bidx] += g * w;
      bSum[bidx] += b * w;
    }

    // Find primary color (bin with highest weight)
    let pIdx = -1;
    let pW = 0;
    for (let i = 0; i < SIZE; i++) {
      if (wSum[i] > pW) {
        pW = wSum[i];
        pIdx = i;
      }
    }

    if (pIdx < 0 || pW <= 0) return fallbackFromIndex(idx);

    const pHue = Math.floor(pIdx / S_BINS) * (360 / H_BINS);

    // Find secondary color (sufficiently different hue)
    let sIdx = -1;
    let sW = 0;
    for (let i = 0; i < SIZE; i++) {
      const w = wSum[i];
      if (w <= 0) continue;
      
      const h = Math.floor(i / S_BINS) * (360 / H_BINS);
      let dh = Math.abs(h - pHue);
      dh = Math.min(dh, 360 - dh); // Shortest distance on color wheel
      
      if (dh >= 25 && w > sW) { // At least 25° different
        sW = w;
        sIdx = i;
      }
    }

    // Calculate weighted average RGB for a bin
    const avgRGB = (idx) => {
      const w = wSum[idx] || 1e-6;
      return [
        Math.round(rSum[idx] / w),
        Math.round(gSum[idx] / w),
        Math.round(bSum[idx] / w)
      ];
    };

    // Build primary color
    const [pr, pg, pb] = avgRGB(pIdx);
    let [h1, s1] = rgbToHsl(pr, pg, pb);
    s1 = Math.max(0.45, Math.min(1, s1 * 1.15)); // Boost saturation
    const c1 = hslToRgb(h1, s1, 0.5);

    // Build secondary color
    let c2;
    if (sIdx >= 0 && sW >= pW * 0.6) {
      // Use distinct secondary color
      const [sr, sg, sb] = avgRGB(sIdx);
      let [h2, s2] = rgbToHsl(sr, sg, sb);
      s2 = Math.max(0.45, Math.min(1, s2 * 1.05));
      c2 = hslToRgb(h2, s2, 0.72);
    } else {
      // Use lighter version of primary
      c2 = hslToRgb(h1, s1, 0.72);
    }

    return { c1, c2 };
  } catch {
    return fallbackFromIndex(idx);
  }
}

/**
 * Extract colors from all card images
 */
function buildPalette() {
  gradPalette = items.map((it, i) => {
    const img = it.el.querySelector('img');
    return extractColors(img, i);
  });
}

/**
 * Set the active gradient based on the centered card
 * @param {number} idx - Card index
 */
function setActiveGradient(idx) {
  if (!bgCtx || idx < 0 || idx >= items.length || idx === activeIndex) return;

  activeIndex = idx;
  const pal = gradPalette[idx] || { c1: [240, 240, 240], c2: [235, 235, 235] };
  const to = {
    r1: pal.c1[0],
    g1: pal.c1[1],
    b1: pal.c1[2],
    r2: pal.c2[0],
    g2: pal.c2[1],
    b2: pal.c2[2],
  };

  // Animate transition with GSAP if available
  if (window.gsap) {
    bgFastUntil = performance.now() + 800; // High FPS for smooth transition
    window.gsap.to(gradCurrent, { ...to, duration: 0.45, ease: 'power2.out' });
  } else {
    Object.assign(gradCurrent, to);
  }
}

// ============================================================================
// BACKGROUND RENDERING
// ============================================================================

/**
 * Resize background canvas to match viewport
 */
function resizeBG() {
  if (!bgCanvas || !bgCtx) return;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = bgCanvas.clientWidth || stage.clientWidth;
  const h = bgCanvas.clientHeight || stage.clientHeight;
  const tw = Math.floor(w * dpr);
  const th = Math.floor(h * dpr);

  if (bgCanvas.width !== tw || bgCanvas.height !== th) {
    bgCanvas.width = tw;
    bgCanvas.height = th;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

/**
 * Render animated gradient background
 */
function drawBackground() {
  if (!bgCanvas || !bgCtx) return;

  const now = performance.now();
  const minInterval = now < bgFastUntil ? 16 : 33; // 60fps or 30fps

  // Throttle rendering based on transition state
  if (now - lastBgDraw < minInterval) {
    bgRAF = requestAnimationFrame(drawBackground);
    return;
  }

  lastBgDraw = now;
  resizeBG();

  const w = bgCanvas.clientWidth || stage.clientWidth;
  const h = bgCanvas.clientHeight || stage.clientHeight;

  // Fill base color
  bgCtx.fillStyle = '#f6f7f9';
  bgCtx.fillRect(0, 0, w, h);

  // Animate gradient centers
  const time = now * 0.0002;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const a1 = Math.min(w, h) * 0.35; // Amplitude for first gradient
  const a2 = Math.min(w, h) * 0.28; // Amplitude for second gradient

  // Calculate floating positions using trigonometry
  const x1 = cx + Math.cos(time) * a1;
  const y1 = cy + Math.sin(time * 0.8) * a1 * 0.4;
  const x2 = cx + Math.cos(-time * 0.9 + 1.2) * a2;
  const y2 = cy + Math.sin(-time * 0.7 + 0.7) * a2 * 0.5;

  const r1 = Math.max(w, h) * 0.75; // First gradient radius
  const r2 = Math.max(w, h) * 0.65; // Second gradient radius

  // Draw first radial gradient
  const g1 = bgCtx.createRadialGradient(x1, y1, 0, x1, y1, r1);
  g1.addColorStop(0, `rgba(${gradCurrent.r1},${gradCurrent.g1},${gradCurrent.b1},0.85)`);
  g1.addColorStop(1, 'rgba(255,255,255,0)');
  bgCtx.fillStyle = g1;
  bgCtx.fillRect(0, 0, w, h);

  // Draw second radial gradient
  const g2 = bgCtx.createRadialGradient(x2, y2, 0, x2, y2, r2);
  g2.addColorStop(0, `rgba(${gradCurrent.r2},${gradCurrent.g2},${gradCurrent.b2},0.70)`);
  g2.addColorStop(1, 'rgba(255,255,255,0)');
  bgCtx.fillStyle = g2;
  bgCtx.fillRect(0, 0, w, h);

  bgRAF = requestAnimationFrame(drawBackground);
}

/**
 * Start background animation loop
 */
function startBG() {
  if (!bgCanvas || !bgCtx) return;
  cancelBG();
  bgRAF = requestAnimationFrame(drawBackground);
}

/**
 * Stop background animation loop
 */
function cancelBG() {
  if (bgRAF) cancelAnimationFrame(bgRAF);
  bgRAF = null;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle window resize
 */
function onResize() {
  const prevStep = STEP || 1;
  const ratio = SCROLL_X / (items.length * prevStep);
  measure();
  VW_HALF = window.innerWidth * 0.5;
  SCROLL_X = mod(ratio * TRACK, TRACK);
  updateCarouselTransforms();
  resizeBG();
}

// Mouse wheel scrolling
stage.addEventListener(
  'wheel',
  (e) => {
    if (isEntering) return;
    e.preventDefault();

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    vX += delta * WHEEL_SENS * 20;
  },
  { passive: false }
);

// Prevent default drag behavior
stage.addEventListener('dragstart', (e) => e.preventDefault());

// Drag state
let dragging = false;
let lastX = 0;
let lastT = 0;
let lastDelta = 0;
let dragStartX = 0;
let dragStartY = 0;

// Pointer down - start dragging
stage.addEventListener('pointerdown', (e) => {
  if (isEntering) return;
  if (e.target.closest('.frame')) return;
  
  dragging = true;
  lastX = e.clientX;
  lastT = performance.now();
  lastDelta = 0;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  stage.setPointerCapture(e.pointerId);
  stage.classList.add('dragging');
});

// Pointer move - update scroll position
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;

  const now = performance.now();
  const dx = e.clientX - lastX;
  const dt = Math.max(1, now - lastT) / 1000;

  SCROLL_X = mod(SCROLL_X - dx * DRAG_SENS, TRACK);
  lastDelta = dx / dt; // Track velocity for momentum
  lastX = e.clientX;
  lastT = now;
});

// Pointer up - apply momentum
stage.addEventListener('pointerup', (e) => {
  if (!dragging) return;
  dragging = false;
  stage.releasePointerCapture(e.pointerId);
  vX = -lastDelta * DRAG_SENS; // Apply final velocity
  stage.classList.remove('dragging');
  
  // Phát hiện drag hay click
  const dist = Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY);
  if (dist > 10) {
    window.wasDragged = true;
    setTimeout(() => { window.wasDragged = false; }, 50); // Reset nhanh sau sự kiện drag
  } else {
    // Là thao tác click! 
    // Chúng ta phải xử lý click thủ công ở đây vì sự kiện pointerCapture đã chặn native click
    window.ignoreNativeClick = true;
    setTimeout(() => { window.ignoreNativeClick = false; }, 50);
    
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const card = target ? target.closest('.card') : null;
    
    if (window.detailsHandler) {
      if (card) {
        if (window.detailsHandler.SHOW_DETAILS) {
          // Nếu click vào chính ảnh đang mở (hoặc clone), thì đóng bảng
          if (card === window.detailsHandler.currentProduct || card === window.detailsHandler.placeholderClone) {
            window.detailsHandler.hideDetails();
          } else {
            // Đổi sang ảnh khác ngay lập tức (không chạy animation bay về của ảnh cũ)
            window.detailsHandler.unFlipProduct(true);
            window.detailsHandler.titles.forEach(title => gsap.set(title.querySelectorAll('.char'), { y: "100%" }));
            window.detailsHandler.texts.forEach(text => gsap.set(text.querySelectorAll('.line'), { y: "100%" }));
            window.detailsHandler.showDetails(card);
          }
        } else {
          // Mở bảng
          window.detailsHandler.showDetails(card);
        }
      } else {
        // Click vào khoảng trống của vòng xoay khi đang mở bảng
        if (window.detailsHandler.SHOW_DETAILS) {
          window.detailsHandler.hideDetails();
        }
      }
    }
  }
});

// Debounced resize handler
window.addEventListener('resize', () => {
  clearTimeout(onResize._t);
  onResize._t = setTimeout(onResize, 80);
});

// Pause animations when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelCarousel();
    cancelBG();
  } else {
    startCarousel();
    startBG();
  }
});

// ============================================================================
// INITIALIZATION & ENTRY ANIMATION
// ============================================================================

/**
 * Animate visible cards entering the scene
 * @param {Array} visibleCards - Cards to animate
 */
async function animateEntry(visibleCards) {
  await new Promise((r) => requestAnimationFrame(r));

  const tl = window.gsap.timeline();

  visibleCards.forEach(({ item, screenX }, idx) => {
    const state = { p: 0 }; // 0 -> 1
    const { ry, tz, scale: baseScale } = computeTransformComponents(screenX);

    const START_SCALE = 0.92;
    const START_Y = 40;

    item.el.style.opacity = '0';
    item.el.style.transform =
      `translate3d(${screenX}px,-50%,${tz}px) ` +
      `rotateY(${ry}deg) ` +
      `scale(${START_SCALE}) ` +
      `translateY(${START_Y}px)`;

    tl.to(
      state,
      {
        p: 1,
        duration: 0.6,
        ease: 'power3.out',
        onUpdate: () => {
          const t = state.p;

          const currentScale = START_SCALE + (baseScale - START_SCALE) * t;
          const currentY = START_Y * (1 - t);
          const opacity = t;

          item.el.style.opacity = opacity.toFixed(3);

          if (t >= 0.999) {
            const { transform } = transformForScreenX(screenX);
            item.el.style.transform = transform;
          } else {
            item.el.style.transform =
              `translate3d(${screenX}px,-50%,${tz}px) ` +
              `rotateY(${ry}deg) ` +
              `scale(${currentScale}) ` +
              `translateY(${currentY}px)`;
          }
        },
      },
      idx * 0.05
    );
  });

  await new Promise((resolve) => {
    tl.eventCallback('onComplete', resolve);
  });
}


/**
 * Pre-composite all card positions to prevent first-interaction jank
 */
async function warmupCompositing() {
  const originalScrollX = SCROLL_X;
  const stepSize = STEP * 0.5;
  const numSteps = Math.ceil(TRACK / stepSize);

  // Scroll through entire carousel to force GPU compositing
  for (let i = 0; i < numSteps; i++) {
    SCROLL_X = mod(originalScrollX + i * stepSize, TRACK);
    updateCarouselTransforms();

    // Force paint every few steps (optimization)
    if (i % 3 === 0) {
      await new Promise((r) => requestAnimationFrame(r));
    }
  }

  // Return to original position
  SCROLL_X = originalScrollX;
  updateCarouselTransforms();
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
}

/**
 * Initialize the carousel application
 */
async function init() {
  // Preload images for faster loading
  preloadImageLinks(IMAGES);
  
  // Create DOM elements
  createCards();
  measure();
  updateCarouselTransforms();
  stage.classList.add('carousel-mode');

  // Wait for all images to load
  await waitForImages();

  // Decode images to prevent jank
  await decodeAllImages();

  // Force browser to paint images
  items.forEach((it) => {
    const img = it.el.querySelector('img');
    if (img) void img.offsetHeight;
  });

  // Extract colors from images for gradients
  buildPalette();

  // Find and set initial centered card
  const half = TRACK / 2;
  let closestIdx = 0;
  let closestDist = Infinity;

  for (let i = 0; i < items.length; i++) {
    let pos = items[i].x - SCROLL_X;
    if (pos < -half) pos += TRACK;
    if (pos > half) pos -= TRACK;
    const d = Math.abs(pos);
    if (d < closestDist) {
      closestDist = d;
      closestIdx = i;
    }
  }

  setActiveGradient(closestIdx);

  // Initialize background canvas
  resizeBG();
  if (bgCtx) {
    const w = bgCanvas.clientWidth || stage.clientWidth;
    const h = bgCanvas.clientHeight || stage.clientHeight;
    bgCtx.fillStyle = '#f6f7f9';
    bgCtx.fillRect(0, 0, w, h);
  }

  // Warmup GPU compositing
  await warmupCompositing();

  // Wait for browser idle time
  if ('requestIdleCallback' in window) {
    await new Promise((r) => requestIdleCallback(r, { timeout: 100 }));
  }

  // Start background animation
  startBG();
  await new Promise((r) => setTimeout(r, 100)); // Let background settle

  // Prepare entry animation for visible cards
  const viewportWidth = window.innerWidth;
  const visibleCards = [];
  
  for (let i = 0; i < items.length; i++) {
    let pos = items[i].x - SCROLL_X;
    if (pos < -half) pos += TRACK;
    if (pos > half) pos -= TRACK;

    const screenX = pos;
    if (Math.abs(screenX) < viewportWidth * 0.6) {
      visibleCards.push({ item: items[i], screenX, index: i });
    }
  }

  // Sort cards left to right
  visibleCards.sort((a, b) => a.screenX - b.screenX);

  // Hide loader
  if (loader) loader.classList.add('loader--hide');

  // Animate cards entering
  await animateEntry(visibleCards);

  // Enable user interaction
  isEntering = false;

  // Start main carousel loop
  startCarousel();
  
  // Khởi tạo hiệu ứng Details (Flip & SplitText) sau khi card đã load
  window.detailsHandler = new DetailsHandler();
}

// ============================================================================
// DETAILS VIEW INTEGRATION (Draggable Grid Effect)
// ============================================================================

class DetailsHandler {
  constructor() {
    // Đăng ký plugins
    gsap.registerPlugin(Flip, SplitText);

    this.dom = document.querySelector('.stage');
    this.details = document.querySelector('.details');
    this.detailsThumb = this.details.querySelector('.details__thumb');
    this.cross = document.querySelector('.cross');
    this.cardsRoot = document.getElementById('cards');
    
    this.titles = this.details.querySelectorAll('.details__title p');
    this.texts = this.details.querySelectorAll('.details__body [data-text]');
    
    // Khởi tạo hiệu ứng chữ
    new SplitText(this.titles, { type: "lines, chars", mask: "lines", charsClass: "char" });
    new SplitText(this.texts, { type: "lines", mask: "lines", linesClass: "line" });
    
    this.SHOW_DETAILS = false;
    this.currentProduct = null;
    this.originalParent = null;
    
    this.initEvents();
  }
  
  initEvents() {
    // Mọi logic click thẻ bài đã được gộp chung vào sự kiện pointerup của vòng xoay 
    // (tại dòng ~768) vì pointerCapture ngăn chặn sự kiện click nguyên thủy.
    
    // Click bất kỳ đâu (trừ nút bấm) để đóng bảng chi tiết
    document.addEventListener('click', (e) => {
      if (window.wasDragged) return; // Bỏ qua nếu người dùng vừa kéo vòng xoay xong
      if (window.ignoreNativeClick) return; // Bỏ qua vì đã xử lý thủ công trong pointerup
      
      if (this.SHOW_DETAILS && e.target.tagName !== 'BUTTON') {
        this.hideDetails();
      }
    });
    
    // Hiệu ứng di chuột cho nút X
    window.addEventListener('mousemove', (e) => {
      if (this.SHOW_DETAILS) {
        gsap.to(this.cross, {
          x: e.clientX - this.cross.offsetWidth / 2,
          y: e.clientY - this.cross.offsetHeight / 2,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    });
  }
  
  showDetails(product) {
    // Nếu đang có thẻ ảnh cũ chưa kịp dọn (ví dụ đang đóng dở), dọn ngay lập tức
    if (this.currentProduct) {
      this.unFlipProduct(true);
    }
    
    this.SHOW_DETAILS = true;
    
    // (Bỏ lệnh cancelCarousel để vòng xoay vẫn tiếp tục xoay)
    
    this.cardsRoot.classList.add('transition-filters');
    
    requestAnimationFrame(() => {
      this.details.classList.add('--is-showing');
      this.dom.classList.add('--is-details-showing');
    });
    
    // Hiệu ứng đẩy nền sang trái một chút
    gsap.to(this.dom, { x: "-15vw", duration: 1.5, ease: "power4.inOut" });
    
    // Trượt bảng chi tiết vào
    gsap.to(this.details, { x: 0, duration: 1.5, ease: "power4.inOut" });
    
    this.flipProduct(product);
    
    // Chạy hiệu ứng chữ
    const id = product.dataset.id;
    const title = this.details.querySelector(`[data-title="${id}"]`);
    const text = this.details.querySelector(`[data-desc="${id}"]`);
    
    if (title) {
      gsap.to(title.querySelectorAll('.char'), {
        y: 0, duration: 1.2, delay: 0.5, ease: "power4.out", stagger: 0.03
      });
    }
    if (text) {
      gsap.to(text.querySelectorAll('.line'), {
        y: 0, duration: 1.2, delay: 0.5, ease: "power4.out", stagger: 0.05
      });
    }
  }
  
  hideDetails() {
    this.SHOW_DETAILS = false;
    this.dom.classList.remove('--is-details-showing');
    
    // Ẩn nút X ngay
    gsap.to(this.cross, { scale: 0, duration: 0.3 });
    
    // Đẩy nền về chỗ cũ
    gsap.to(this.dom, { x: 0, duration: 0.5, ease: "power2.out" });
    this.cardsRoot.classList.remove('transition-filters');
    
    // Đẩy bảng chi tiết ra ngoài (kéo theo cả thẻ ảnh bên trong)
    gsap.to(this.details, {
      x: "100%", duration: 0.5, ease: "power2.out",
      onComplete: () => {
        this.details.classList.remove('--is-showing');
        // Chỉ khi bảng đã trượt hẳn ra ngoài, ta mới âm thầm đưa ảnh về background
        if (!this.SHOW_DETAILS) {
          this.unFlipProduct(true);
        }
      }
    });
    
    // Ẩn chữ đi
    this.titles.forEach(title => {
      gsap.to(title.querySelectorAll('.char'), { y: "100%", duration: 0.4, ease: "power2.in" });
    });
    this.texts.forEach(text => {
      gsap.to(text.querySelectorAll('.line'), { y: "100%", duration: 0.4, ease: "power2.in" });
    });
  }
  
  flipProduct(product) {
    this.currentProduct = product;
    this.originalParent = product.parentNode;
    
    // Ghi lại trạng thái trước khi chuyển
    const state = Flip.getState(product);
    
    // Tạo bản sao để lấp chỗ trống trong vòng quay (để tự nhiên hòa vào các thẻ background)
    this.placeholderClone = product.cloneNode(true);
    this.originalParent.insertBefore(this.placeholderClone, product);
    
    // Đánh tráo phần tử trong mảng items để vòng quay tiếp tục quay bản sao này!
    const item = items.find(it => it.el === product);
    if (item) {
      item.el = this.placeholderClone;
      this.placeholderItem = item;
    }
    
    // Chuyển sang container mới
    this.detailsThumb.appendChild(product);
    
    // Ghi đè các thuộc tính CSS cố định của .card để vừa với .detailsThumb
    gsap.set(product, { 
      clearProps: "transform,filter,zIndex",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      margin: 0
    });
    
    // Flip animate
    Flip.from(state, {
      absolute: true,
      duration: 1.5,
      ease: "power4.inOut"
    });
    
    // Hiện dấu X
    gsap.to(this.cross, { scale: 1, duration: 0.4, delay: 0.5, ease: "power2.out" });
  }
  
  unFlipProduct(isSwitching = false) {
    if (!this.currentProduct || !this.originalParent) return;
    
    const productToUnflip = this.currentProduct;
    const cloneToRemove = this.placeholderClone;
    
    // Ẩn dấu X
    gsap.to(this.cross, { scale: 0, duration: 0.3 });
    
    const state = Flip.getState(productToUnflip);
    
    // Đưa về lại DOM ban đầu
    this.originalParent.appendChild(productToUnflip);
    
    // Xoá các thuộc tính ghi đè để CSS gốc của .card có tác dụng lại
    gsap.set(productToUnflip, { clearProps: "top,left,width,height,margin" });
    
    // Trả lại ảnh thật vào mảng items để nó tiếp tục quay
    if (this.placeholderItem) {
      this.placeholderItem.el = productToUnflip;
      this.placeholderItem = null;
    }
    
    // Cập nhật lại transform 3D cho đúng vị trí của carousel
    updateCarouselTransforms();
    
    // Giải phóng bộ nhớ toàn cục để nếu có switch thì thẻ mới không bị lỗi
    this.currentProduct = null;
    this.originalParent = null;
    this.placeholderClone = null;
    
    if (isSwitching) {
      // Nếu đang switch ảnh khác, cho ảnh cũ bay về ngay lập tức (không tạo hiệu ứng bay)
      if (cloneToRemove) cloneToRemove.remove();
    } else {
      // Nếu đóng bảng bình thường, bay về vị trí cũ với tốc độ 0.5s
      Flip.from(state, {
        absolute: true,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          if (cloneToRemove) {
            cloneToRemove.remove();
          }
        }
      });
    }
  }
}

// ============================================================================
// START APPLICATION
// ============================================================================

init();