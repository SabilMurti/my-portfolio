const fs = require('fs');

// 1. CSS FIX
let css = fs.readFileSync('src/style.css', 'utf8');

// Fix centering on About and Arsenal
const cssReplace = `
/* Remove vertical padding from section-inner when inside horizontal panel so it truly centers */
.h-panel .section-inner {
  padding-top: 0;
  padding-bottom: 0;
}

/* Cancel out the sticky cards - return to elegant normal flow */
.projects-list {
  display: flex;
  flex-direction: column;
  position: relative;
  gap: 4rem; /* normal spacing */
  padding-bottom: 4rem;
}

.project-item {
  position: relative; /* NO STICKY */
  padding: 3rem 0 !important; /* normal padding */
  background: transparent !important; /* completely transparent */
  backdrop-filter: none !important;
  border: none !important;
  border-bottom: 1px solid rgba(240, 237, 232, 0.08) !important;
  border-radius: 0 !important; /* NO ROUNDED */
  margin-bottom: 0 !important;
  box-shadow: none !important;
}

.project-item:hover {
  border-left: 2px solid var(--blood) !important;
  padding-left: 1rem !important;
}
`;

// Remove the old appended CSS that made it sticky
const oldCssStr = `/* === STICKY CARDS DI GRIMOIRE === */`;
const splitIdx = css.indexOf(oldCssStr);
if(splitIdx !== -1) {
    css = css.substring(0, splitIdx);
}
fs.writeFileSync('src/style.css', css + cssReplace);


// 2. JS FIX
let main = fs.readFileSync('src/main.js', 'utf8');

// Remove the old sticky JS logic
const oldJsStr = `// ==========================================
// 2. STICKY CARDS (Dengan Efek Meredup/Skala)`;
const splitJsIdx = main.indexOf(oldJsStr);
if (splitJsIdx !== -1) {
    main = main.substring(0, splitJsIdx);
}

// Add the elegant fade in/slide up for projects instead of sticky
const newJs = `// ==========================================
// 2. PROJECTS REVEAL (Elegant Fade & Slide, No Stacking)
// ==========================================
const cards = gsap.utils.toArray('.project-item');

cards.forEach((card, i) => {
  gsap.fromTo(card, 
    { opacity: 0, y: 50 },
    {
      opacity: 1, 
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%', // starts appearing when top of card hits 85% down viewport
        toggleActions: 'play none none reverse'
      }
    }
  );
});

// Section Parallax background for extra elegance
gsap.to('#roots-canvas', {
  y: 150, // Move canvas down slightly as you scroll to create parallax depth
  ease: 'none',
  scrollTrigger: {
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true
  }
});
`;

fs.writeFileSync('src/main.js', main + newJs);
console.log('Fixed CSS padding and changed to normal fade-in projects');
