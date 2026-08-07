const fs = require('fs');

// ==========================================
// 1. HTML: BUNGKUS HORIZONTAL (About & Arsenal HANYA)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  '  <!-- ===================== ABOUT ===================== -->\n  <section id="about">',
  '  <!-- === HORIZONTAL WRAPPER === -->\n  <div id="horizontal-track">\n  <!-- ===================== ABOUT ===================== -->\n  <section id="about" class="h-panel">'
);

html = html.replace(
  '  <!-- ===================== ARSENAL ===================== -->\n  <section id="arsenal">',
  '  <!-- ===================== ARSENAL ===================== -->\n  <section id="arsenal" class="h-panel">'
);

// Close wrapper AFTER arsenal, BEFORE grimoire.
html = html.replace(
  '  <!-- ===================== GRIMOIRE ===================== -->\n  <section id="grimoire">',
  '  </div><!-- /#horizontal-track -->\n\n  <!-- ===================== GRIMOIRE ===================== -->\n  <section id="grimoire">'
);

fs.writeFileSync('index.html', html);


// ==========================================
// 2. CSS: SIMPLE & ELEGAN 
// ==========================================
let css = fs.readFileSync('src/style.css', 'utf8');

const appendCss = `
/* === HORIZONTAL WRAPPER === */
#horizontal-track {
  display: flex;
  flex-wrap: nowrap;
  width: 200vw; /* About + Arsenal */
  position: relative;
  z-index: 2;
}

.h-panel {
  width: 100vw;
  min-height: 100vh;
  flex-shrink: 0;
  display: flex;
  align-items: center; /* Center vertikal */
}
.h-panel .section-inner { width: 100%; }

/* Biar canvas roots tetep di belakang */
#roots-canvas { z-index: 0; }

/* === STICKY CARDS DI GRIMOIRE === */
#grimoire {
  position: relative;
  z-index: 2;
  /* Grimoire dibiarkan natural flow, tinggi akan otomatis menyesuaikan isi */
}

/* Supaya sticky bekerja sempurna, kita ubah project-list menjadi flex column */
.projects-list {
  display: flex;
  flex-direction: column;
  position: relative;
  /* Tambah jarak bawah supaya project terakhir punya ruang untuk dibaca */
  padding-bottom: 50vh; 
}

.project-item {
  position: sticky;
  top: 15vh; /* Berhenti agak ke tengah atas layar, bukan mentok di 0 */
  /* Kita batasi tinggi item agar tidak makan layar penuh */
  padding: 3rem max(2rem, 5vw) !important;
  background: rgba(15, 15, 15, 0.4); /* Sangat transparan, elegan */
  backdrop-filter: blur(8px);
  border: 1px solid rgba(240, 237, 232, 0.05);
  border-radius: 12px;
  margin-bottom: 50vh; /* Jarak antar project: JEDA BACA yang elegan */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
`;

fs.writeFileSync('src/style.css', css + appendCss);


// ==========================================
// 3. JS: LOGIKA SCROLLTRIGGER YANG MANTAP
// ==========================================
let main = fs.readFileSync('src/main.js', 'utf8');

const appendJs = `
// ==========================================
// 1. HORIZONTAL SLIDE (Dengan Delay/Jeda Baca)
// ==========================================
const track = document.getElementById('horizontal-track');

// Kita pin track lebih lama dari jarak slidenya (durasi scroll diperpanjang)
// Total pin = 3 viewport height. 
// - 1 viewport pertama: Diam (baca About)
// - 1 viewport kedua: Geser (slide ke Arsenal)
// - 1 viewport ketiga: Diam (baca Arsenal)
const slideTl = gsap.timeline({
  scrollTrigger: {
    trigger: track,
    pin: true,
    scrub: 1.5, // Sedikit lebih smooth
    start: 'top top',
    end: () => '+=' + (window.innerHeight * 3), 
    invalidateOnRefresh: true
  }
});

// Delay 1: Diam di About
slideTl.to(track, { x: 0, duration: 1, ease: 'none' }); 
// Slide 2: Geser ke Arsenal
slideTl.to(track, { x: () => -window.innerWidth, duration: 1, ease: 'power2.inOut' });
// Delay 3: Diam di Arsenal
slideTl.to(track, { x: () => -window.innerWidth, duration: 1, ease: 'none' });

// Hero content pudar saat track naik
gsap.to('#hero .hero-content', {
  opacity: 0,
  y: -50,
  ease: 'none',
  scrollTrigger: {
    trigger: track,
    start: 'top 80%',
    end: 'top top',
    scrub: true
  }
});


// ==========================================
// 2. STICKY CARDS (Dengan Efek Meredup/Skala)
// ==========================================
// Karena kita pakai CSS position: sticky + margin-bottom: 50vh,
// kita cukup pasang ScrollTrigger untuk mengecilkan card yang tertinggal di belakang.
const cards = gsap.utils.toArray('.project-item');

cards.forEach((card, i) => {
  if (i < cards.length - 1) {
    gsap.to(card, {
      scale: 0.9,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: {
        trigger: card,
        // Mulai redupkan card ini ketika card *berikutnya* mulai menyentuh bagian bawah layar
        start: () => 'top top-=' + (window.innerHeight * 0.1),
        // Selesai redup ketika card ini tertimpa penuh
        end: () => 'bottom top',
        scrub: true
      }
    });
  }
});
`;

fs.writeFileSync('src/main.js', main + appendJs);
console.log('Implementation applied.');
