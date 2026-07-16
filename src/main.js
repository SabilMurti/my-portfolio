import './style.css'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initProceduralRoots } from './roots.js'
import { initCursor } from './cursor.js'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// ============ LENIS SMOOTH SCROLL ============
const lenis = new Lenis({
  lerp: 0.085,
  smoothWheel: true,
  syncTouch: false,
})

lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

// ============ NAV SCROLL STATE ============
const nav = document.getElementById('main-nav')
ScrollTrigger.create({
  start: 'top -80px',
  onUpdate: (self) => {
    nav.classList.toggle('scrolled', self.scroll() > 80)
  },
})

// ============ INIT MODULES ============
initCursor()
initProceduralRoots()

// ============ HERO ANIMATIONS ============
// Split hero name into chars
const heroName = document.querySelector('.hero-name')
if (heroName) {
  const text = heroName.textContent
  heroName.innerHTML = ''
  text.split('').forEach((char) => {
    const span = document.createElement('span')
    span.textContent = char === ' ' ? '\u00a0' : char
    span.style.display = 'inline-block'
    heroName.appendChild(span)
  })

  const chars = heroName.querySelectorAll('span')
  gsap.fromTo(
    chars,
    { opacity: 0, y: 55, skewX: 8 },
    {
      opacity: 1,
      y: 0,
      skewX: 0,
      stagger: 0.045,
      duration: 1,
      ease: 'power3.out',
      delay: 0.4,
    }
  )
}

// Hero subtitle & tagline
gsap.fromTo(
  '.hero-sub',
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 1.4 }
)

gsap.fromTo(
  '.hero-tagline',
  { opacity: 0, y: 15 },
  { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 1.7 }
)

gsap.fromTo(
  '.hero-cta',
  { opacity: 0, y: 15 },
  { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 2.0 }
)

gsap.fromTo(
  '.hero-scroll-hint',
  { opacity: 0 },
  { opacity: 1, duration: 1, ease: 'power2.out', delay: 2.5 }
)

// ============ SECTION REVEALS ============
gsap.utils.toArray('.section-reveal').forEach((el) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 82%',
        toggleActions: 'play none none none',
      },
    }
  )
})

// ============ PROJECT HOVER ANIMATIONS ============
document.querySelectorAll('.project-item').forEach((item) => {
  const name = item.querySelector('.project-name')

  item.addEventListener('mouseenter', () => {
    gsap.to(name, { x: 12, duration: 0.35, ease: 'power2.out' })
  })
  item.addEventListener('mouseleave', () => {
    gsap.to(name, { x: 0, duration: 0.35, ease: 'power2.out' })
  })
})

// Project rows slide in
gsap.utils.toArray('.project-item').forEach((item, i) => {
  gsap.fromTo(
    item,
    { opacity: 0, x: -30 },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: i * 0.12,
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    }
  )
})

// ============ SECTION LABEL GLITCH EFFECT ============
// Subtle: on hover over section labels, brief glitch
document.querySelectorAll('.section-label').forEach((label) => {
  label.addEventListener('mouseenter', () => {
    gsap.to(label, {
      skewX: 3,
      duration: 0.08,
      yoyo: true,
      repeat: 3,
      ease: 'power1.inOut',
      onComplete: () => gsap.set(label, { skewX: 0 }),
    })
  })
})

// ============ CONTACT LINK ARROWS ============
document.querySelectorAll('.contact-link').forEach((link) => {
  const arrow = link.querySelector('.link-arrow')
  link.addEventListener('mouseenter', () => {
    gsap.to(arrow, { x: 6, duration: 0.3, ease: 'power2.out' })
  })
  link.addEventListener('mouseleave', () => {
    gsap.to(arrow, { x: 0, duration: 0.3, ease: 'power2.out' })
  })
})
