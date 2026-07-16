import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─────────────────────────────────────────────
// Seeded PRNG — mulberry32
// ─────────────────────────────────────────────
function seededRandom(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rootsConfig = {
  seed: 64673492,
  baseRadius: 3.8,
  totalLengthMultiplier: 2.6,
  trunkSpawns: 3,
  gravity: -0.2
};

export function initProceduralRoots() {
  const canvas = document.getElementById('roots-canvas')
  if (!canvas) return

  // 1. Scene, Camera, Renderer Setup
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 100

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)

  // Unified groups for parallax synchronization and additive animation
  const scrollGroup = new THREE.Group()
  const rootsGroup = new THREE.Group()
  scrollGroup.add(rootsGroup)
  scene.add(scrollGroup)

  // Flat Vector Materials — solid opaque gothic tones
  const vectorMaterial = new THREE.MeshBasicMaterial({
    color: 0x222222,
    side: THREE.FrontSide
  })

  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x080808,
    side: THREE.BackSide,
    depthWrite: false
  })

  // Calculate viewport boundaries in Three.js units at z=0
  let vHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
  let vWidth = vHeight * camera.aspect

  // ─────────────────────────────────────────────
  // Helper: generate crooked/organic path points
  // ─────────────────────────────────────────────
  function generateBranchPoints(start, direction, length, random, segments = 8) {
    const points = [start.clone()]
    let current = start.clone()
    const step = length / segments
    const dirNorm = direction.clone().normalize()

    for (let i = 1; i <= segments; i++) {
      const next = current.clone().addScaledVector(dirNorm, step)

      // Organic noise increases toward the tip
      const noiseFactor = i / segments
      const noise = length * 0.14 * noiseFactor
      next.x += (random() - 0.5) * noise
      next.y += (random() - 0.5) * (noise * 0.4)
      next.z += (random() - 0.5) * noise

      points.push(next)
      current = next
    }
    return points
  }

  // ─────────────────────────────────────────────
  // Helper: create a curved/crooked thorn geometry
  // Builds a tapered tube along a 3-point curved spline
  // for organic briar-claw shapes instead of stiff cones
  // ─────────────────────────────────────────────
  function createCurvedThornGeometry(height, baseRadius, random) {
    // Build a 3-point spline: base → curved midpoint → tip
    const mid = height * 0.5

    // Random perpendicular bend at mid-height
    const bendX = (random() - 0.5) * height * 0.35
    const bendZ = (random() - 0.5) * height * 0.35

    const spline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(bendX, mid, bendZ),
      new THREE.Vector3(bendX * 0.6, height, bendZ * 0.6)
    ])

    const tubularSegments = 6
    const radialSegments = 4
    const tubeGeo = new THREE.TubeGeometry(spline, tubularSegments, baseRadius, radialSegments, false)

    // Taper vertices along UV progress to a needle point at the tip
    const pos = tubeGeo.attributes.position
    const uv = tubeGeo.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i)
      const factor = 1.0 - u // 1 at base → 0 at tip

      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)

      const curvePoint = spline.getPointAt(Math.min(u, 1.0))

      pos.setX(i, curvePoint.x + (x - curvePoint.x) * factor)
      pos.setY(i, curvePoint.y + (y - curvePoint.y) * factor)
      pos.setZ(i, curvePoint.z + (z - curvePoint.z) * factor)
    }
    tubeGeo.computeVertexNormals()
    return tubeGeo
  }

  // ─────────────────────────────────────────────
  // Generate a single 3D tapered root/branch mesh
  // Tapers to exactly 0 radius for needle-sharp tips
  // ─────────────────────────────────────────────
  function create3DBranch(points, baseRadius, depth, random) {
    const curve = new THREE.CatmullRomCurve3(points)

    const radialSegments = 6
    const tubularSegments = depth === 1 ? 80 : depth === 2 ? 40 : depth === 3 ? 24 : 12

    const tubeGeometry = new THREE.TubeGeometry(curve, tubularSegments, baseRadius, radialSegments, false)

    // Taper to exactly 0 radius — ultra-sharp needle tip
    const pos = tubeGeometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const u = tubeGeometry.attributes.uv.getX(i)
      const factor = Math.pow(1.0 - u, 0.38) // Holds thickness longer, tapering only at the tip

      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)

      const curvePoint = curve.getPointAt(u)

      pos.setX(i, curvePoint.x + (x - curvePoint.x) * factor)
      pos.setY(i, curvePoint.y + (y - curvePoint.y) * factor)
      pos.setZ(i, curvePoint.z + (z - curvePoint.z) * factor)
    }
    tubeGeometry.computeVertexNormals()

    // Main Mesh
    const branchMesh = new THREE.Mesh(tubeGeometry, vectorMaterial)
    branchMesh.renderOrder = 2
    rootsGroup.add(branchMesh)

    // Outline Mesh — inflate along normals
    const outlineGeometry = tubeGeometry.clone()
    const oPos = outlineGeometry.attributes.position
    const oNorm = outlineGeometry.attributes.normal
    const outlineThickness = depth === 1 ? 0.45 : depth === 2 ? 0.28 : depth === 3 ? 0.12 : 0.06

    for (let i = 0; i < oPos.count; i++) {
      oPos.setX(i, oPos.getX(i) + oNorm.getX(i) * outlineThickness)
      oPos.setY(i, oPos.getY(i) + oNorm.getY(i) * outlineThickness)
      oPos.setZ(i, oPos.getZ(i) + oNorm.getZ(i) * outlineThickness)
    }

    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial)
    outlineMesh.renderOrder = 1
    rootsGroup.add(outlineMesh)

    // ── Thorns — flush on branch surface, pointing directly outward ──
    // Skip thorns on the thinnest twigs (depth 4)
    if (depth >= 4) return

    const numThorns = Math.max(4, Math.floor(14 / depth))
    for (let i = 2; i < numThorns - 1; i++) {
      const u = i / numThorns
      const point = curve.getPointAt(u)
      const tangent = curve.getTangentAt(u).normalize()

      // Compute a perpendicular normal to the tangent for outward placement
      const normal = new THREE.Vector3()
      if (Math.abs(tangent.x) > Math.abs(tangent.z)) {
        normal.set(-tangent.y, tangent.x, 0).normalize()
      } else {
        normal.set(0, -tangent.z, tangent.y).normalize()
      }
      // Random spin around the tangent axis for natural distribution
      const rotationAngle = random() * Math.PI * 2

      const currentRadiusFactor = 1 - u
      const currentTubeRadius = baseRadius * currentRadiusFactor
      // Skip if radius is negligible (near tip)
      if (currentTubeRadius < 0.05) continue

      const thornHeight = (4.5 + random() * 4.0) * currentTubeRadius * Math.pow(0.65, depth - 1)
      const thornBaseRadius = 0.5 * currentTubeRadius

      const thornGeo = createCurvedThornGeometry(thornHeight, thornBaseRadius, random)

      const thornMesh = new THREE.Mesh(thornGeo, vectorMaterial)
      thornMesh.renderOrder = 2
      const thornOutlineGeo = thornGeo.clone()
      const thornOutline = new THREE.Mesh(thornOutlineGeo, outlineMaterial)
      thornOutline.renderOrder = 1
      thornOutline.scale.set(1.5, 1.15, 1.5)
      thornMesh.add(thornOutline)

      // Position: place base flush on branch surface by offsetting along normal
      thornMesh.position.copy(point).addScaledVector(normal, currentTubeRadius)

      // Orient thorn along the outward normal
      const quaternion = new THREE.Quaternion()
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      thornMesh.quaternion.copy(quaternion)

      rootsGroup.add(thornMesh)
    }
  }

  // ─────────────────────────────────────────────
  // Recursive Branching Generator (depth up to 4)
  // ─────────────────────────────────────────────
  function growRootRecursively(start, direction, length, radius, depth, random, maxDepth = 4) {
    if (depth > maxDepth) return

    const segments = depth === 1 ? 12 : 8
    const points = generateBranchPoints(start, direction, length, random, segments)
    create3DBranch(points, radius, depth, random)

    if (depth < maxDepth) {
      const curve = new THREE.CatmullRomCurve3(points)
      // More sub-branches near the trunk, fewer at depth
      const numSpawns = depth === 1 ? rootsConfig.trunkSpawns : (depth === 2 ? 2 : 1)

      for (let i = 0; i < numSpawns; i++) {
        // Spawn along 10%-85% of parent length (avoid clustering at base/tip)
        const u = depth === 1
          ? 0.35 + (random() * 0.55)   // trunk: spawn only between 35%-90%
          : 0.1 + (random() * 0.75)     // deeper: original 10%-85% range
        const spawnPoint = curve.getPointAt(u)
        const parentTangent = curve.getTangentAt(u).normalize()

        // Side direction perpendicular to parent tangent
        const sideDir = new THREE.Vector3()
        if (Math.abs(parentTangent.x) > Math.abs(parentTangent.z)) {
          sideDir.set(-parentTangent.y, parentTangent.x, (random() - 0.5) * 0.5).normalize()
        } else {
          sideDir.set((random() - 0.5) * 0.5, -parentTangent.z, parentTangent.y).normalize()
        }

        // Alternate left/right with organic randomness
        const rotAngle = (i % 2 === 0 ? 0.8 : -0.8) + (random() - 0.5) * 0.4
        sideDir.applyAxisAngle(parentTangent, rotAngle)

        // ── Gravity-influenced downward growth ──
        sideDir.y = -Math.abs(sideDir.y) + rootsConfig.gravity
        sideDir.x += (i % 2 === 0 ? 0.35 : -0.35)
        sideDir.z *= 0.4
        sideDir.normalize()

        // Compute parent's actual tapered radius at spawn point (using matching power curve)
        const parentRadiusAtU = radius * Math.pow(1.0 - u, 0.38)
        let childLength, childRadius, childMaxDepth

        if (depth === 1 && u < 0.4) {
          // Upper trunk: thick but shallow — clean, no sub-twigs
          childRadius = parentRadiusAtU * 0.58
          childLength = length * (0.35 + random() * 0.30) * (1.0 - (u * 0.25))
          childMaxDepth = 2
        } else if (depth === 1 && u >= 0.4) {
          // Lower trunk: full recursive twigs — populate bottom elegantly
          childRadius = parentRadiusAtU * 0.62
          childLength = length * (0.58 + random() * 0.30) * (1.0 - (u * 0.25))
          childMaxDepth = 4
        } else {
          // Deeper branches: inherit parent maxDepth
          childLength = length * (0.35 + random() * 0.30) * (1.0 - (u * 0.25))
          childRadius = parentRadiusAtU * 0.42
          childMaxDepth = maxDepth
        }

        growRootRecursively(spawnPoint, sideDir, childLength, childRadius, depth + 1, random, childMaxDepth)
      }
    }
  }

  // ─────────────────────────────────────────────
  // Build Root Scene — single continuous spine
  // from top-left creeping down the page
  // ─────────────────────────────────────────────
  function buildRootScene() {
    // Clear old meshes — dispose geometries to avoid memory leaks
    while (rootsGroup.children.length > 0) {
      const child = rootsGroup.children[0]
      if (child.geometry) child.geometry.dispose()
      rootsGroup.remove(child)
    }

    // Instantiate deterministic PRNG from current seed
    const random = seededRandom(rootsConfig.seed)

    // ── Main root spine: top-left corner, creeping diagonally down the page ──
    const startPoint = new THREE.Vector3(-vWidth * 0.45, vHeight * 0.52, 0)
    const initialDir = new THREE.Vector3(0.35, -0.92, -0.08)
    const totalLength = vHeight * rootsConfig.totalLengthMultiplier
    const baseRadius = rootsConfig.baseRadius

    growRootRecursively(startPoint, initialDir, totalLength, baseRadius, 1, random)
  }

  buildRootScene()

  // 4. Parallax Scroll Trigger
  gsap.to(scrollGroup.position, {
    y: vHeight * 1.5,
    z: -12,
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2
    }
  })

  gsap.to(scrollGroup.rotation, {
    y: 1.1,
    x: 0.25,
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2
    }
  })

  // 5. Animation Render Loop
  let time = 0
  function animate() {
    requestAnimationFrame(animate)
    time += 0.004

    rootsGroup.rotation.y = Math.sin(time) * 0.05
    rootsGroup.rotation.z = Math.cos(time * 0.85) * 0.02
    renderer.render(scene, camera)
  }
  animate()

  // 6. Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)

    vHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
    vWidth = vHeight * camera.aspect

    buildRootScene()
    ScrollTrigger.refresh()
  })

  // ─────────────────────────────────────────────
  // Debug Panel Bindings
  // ─────────────────────────────────────────────
  const debugSeed = document.getElementById('debug-seed')
  const debugRadius = document.getElementById('debug-radius')
  const btnRandomize = document.getElementById('btn-randomize')
  const btnCopy = document.getElementById('btn-copy')

  if (debugSeed) {
    debugSeed.addEventListener('change', () => {
      rootsConfig.seed = parseInt(debugSeed.value, 10) || 0
      buildRootScene()
    })
  }

  if (debugRadius) {
    debugRadius.addEventListener('input', () => {
      rootsConfig.baseRadius = parseFloat(debugRadius.value)
      buildRootScene()
    })
  }

  if (btnRandomize) {
    btnRandomize.addEventListener('click', () => {
      const newSeed = Math.floor(Math.random() * 100000000)
      rootsConfig.seed = newSeed
      if (debugSeed) debugSeed.value = newSeed
      buildRootScene()
    })
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(String(rootsConfig.seed)).then(() => {
        btnCopy.textContent = 'Copied!'
        setTimeout(() => { btnCopy.textContent = 'Copy Seed' }, 1500)
      })
    })
  }
}
