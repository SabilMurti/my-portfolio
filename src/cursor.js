import { gsap } from 'gsap'

export function initCursor() {
  const cursor = document.getElementById('cursor')
  if (!cursor || window.matchMedia('(pointer: coarse)').matches) {
    // Touch device — restore default cursor
    document.body.style.cursor = 'auto'
    if (cursor) cursor.style.display = 'none'
    return
  }

  let mouseX = 0
  let mouseY = 0

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
    gsap.to(cursor, {
      x: mouseX,
      y: mouseY,
      duration: 0.12,
      ease: 'power2.out',
    })
  })

  // Hover states
  const interactiveEls = document.querySelectorAll('a, button, .project-item, #constellation-canvas')

  interactiveEls.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      gsap.to(cursor, {
        width: 32,
        height: 32,
        opacity: 0.4,
        duration: 0.25,
        ease: 'power2.out',
      })
    })
    el.addEventListener('mouseleave', () => {
      gsap.to(cursor, {
        width: 10,
        height: 10,
        opacity: 0.9,
        duration: 0.25,
        ease: 'power2.out',
      })
    })
  })

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    gsap.to(cursor, { opacity: 0, duration: 0.2 })
  })
  document.addEventListener('mouseenter', () => {
    gsap.to(cursor, { opacity: 0.9, duration: 0.2 })
  })
}
