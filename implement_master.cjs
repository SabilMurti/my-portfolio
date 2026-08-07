const fs = require('fs');

// 1. REWRITE HTML: We DO NOT change the sections. 
// We only wrap ALL sections EXCEPT hero and contact in a single container.
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  '  <!-- ===================== ABOUT ===================== -->\n  <section id="about">',
  '  <!-- ===================== MASTER CONTAINER ===================== -->\n  <div id="master-pin">\n    <div id="horizontal-track">\n      <!-- ===================== ABOUT ===================== -->\n      <section id="about" class="h-section">'
);

html = html.replace(
  '  <!-- ===================== ARSENAL ===================== -->\n  <section id="arsenal">',
  '  <!-- ===================== ARSENAL ===================== -->\n      <section id="arsenal" class="h-section">'
);

html = html.replace(
  '  <!-- ===================== GRIMOIRE ===================== -->\n  <section id="grimoire">',
  '  <!-- ===================== GRIMOIRE ===================== -->\n      <section id="grimoire" class="h-section">'
);

html = html.replace(
  '  </section>\n\n  <!-- ===================== CONTACT ===================== -->',
  '      </section>\n    </div>\n  </div>\n\n  <!-- ===================== CONTACT ===================== -->'
);

fs.writeFileSync('index.html', html);


// 2. CSS: Only absolute bare minimum for GSAP horizontal pinning. No backgrounds, no sticky!
let css = fs.readFileSync('src/style.css', 'utf8');

const appendCss = `
/* ===================== MASTER PIN ===================== */
#master-pin {
  width: 100vw;
  height: 100vh;
  overflow: hidden; /* Hide horizontal scrollbar */
  position: relative;
  z-index: 2;
}

#horizontal-track {
  display: flex;
  flex-wrap: nowrap;
  width: 300vw; /* 3 sections */
  height: 100vh;
  will-change: transform;
}

.h-section {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  position: relative;
  /* NO BACKGROUND - TRANSPARENT */
}

/* Let section inner fill the width */
.h-section .section-inner {
  width: 100%;
}

/* Canvas z-index fix */
#roots-canvas { z-index: 0; }

/* In Grimoire, we will GSAP-animate the projects, so they need to be stacked absolutely */
#grimoire .projects-list {
  position: relative;
  width: 100%;
  height: 60vh; /* space for cards */
}

.project-item {
  position: absolute; /* Stack them all on top of each other */
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0; /* Hidden initially, GSAP will show them */
  transform: translateY(100px);
  background: rgba(15, 15, 15, 0.95); /* We MUST have a background if they overlap, but a blurred/transparent one looks better */
  backdrop-filter: blur(10px);
  padding: 2rem !important;
  border-left: 2px solid var(--blood) !important;
}
`;

fs.writeFileSync('src/style.css', css + appendCss);


// 3. JS: Complete GSAP Timeline!
let main = fs.readFileSync('src/main.js', 'utf8');

const appendJs = `
// ===================== MASTER GSAP TIMELINE =====================
const track = document.getElementById('horizontal-track');
const projects = gsap.utils.toArray('.project-item');

// Create one giant timeline that controls EVERYTHING
const masterTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#master-pin',
    pin: true,
    scrub: 1,
    start: 'top top',
    // 200vw for horizontal + (100vh * number of projects) for vertical stacking
    end: () => '+=' + (window.innerWidth * 2 + window.innerHeight * projects.length),
    invalidateOnRefresh: true
  }
});

// PHASE 1: Slide About -> Arsenal
masterTl.to(track, {
  x: () => -window.innerWidth,
  ease: 'none',
  duration: 1 // 1 part of time
});

// PHASE 2: Slide Arsenal -> Grimoire
masterTl.to(track, {
  x: () => -(window.innerWidth * 2),
  ease: 'none',
  duration: 1
});

// PHASE 3: While in Grimoire (track is stopped), animate the cards!
// We reveal them one by one from the bottom, stacking on top of each other.
projects.forEach((proj, i) => {
  // 1. Bring card up and fade in
  masterTl.to(proj, {
    y: i * 20, // Stack them slightly offset like a deck of cards
    opacity: 1,
    ease: 'power2.out',
    duration: 1
  });
  
  // 2. If it's not the last card, we wait a bit so the user can read it, 
  // then dim it as the NEXT card comes up.
  if (i < projects.length - 1) {
    masterTl.to(proj, {
      opacity: 0.3,
      scale: 0.95,
      ease: 'none',
      duration: 1 // This duration overlaps with the NEXT card's entrance
    }, '>'); // Start immediately after it appeared
  }
});

// Hero fade out when pin starts
gsap.to('#hero', {
  opacity: 0,
  filter: 'blur(10px)',
  scrollTrigger: {
    trigger: '#master-pin',
    start: 'top 80%',
    end: 'top top',
    scrub: true
  }
});

// Contact fade in from bottom
gsap.from('#contact', {
  opacity: 0,
  y: 100,
  scrollTrigger: {
    trigger: '#contact',
    start: 'top bottom',
    end: 'top 60%',
    scrub: true
  }
});
`;

fs.writeFileSync('src/main.js', main + appendJs);

console.log('Master Timeline built successfully.');
