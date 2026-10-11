import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { artistArt } from '../../lib/assets/cast'
import './Underground3D.css'

interface Portrait { src: string; label: string }
interface Prop { object: THREE.Group; side: -1 | 1; y: number; scale: number; speed: number; phase: number }
const DEFAULT_PORTRAITS: Portrait[] = [
  { src: artistArt.slayr.src, label: 'SLAYR.BURGER' },
  { src: artistArt.bleood.src, label: 'BLEOOD.EXE' },
  { src: artistArt.carti.src, label: 'SLATT.ZIP' },
]

const material = (color: string, emissive = '#000000') => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.3, roughness: 0.42, metalness: 0.16, flatShading: true })
function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, paint: THREE.Material, x = 0, y = 0, z = 0) {
  const part = new THREE.Mesh(geometry, paint)
  part.position.set(x, y, z)
  group.add(part)
  return part
}

function burger() {
  const group = new THREE.Group()
  const bun = material('#fb9918', '#7f2f00')
  const meat = material('#542519')
  mesh(group, new THREE.CylinderGeometry(0.75, 0.67, 0.2, 16), bun, 0, -0.35)
  mesh(group, new THREE.CylinderGeometry(0.76, 0.76, 0.17, 16), meat, 0, -0.14)
  const cheese = mesh(group, new THREE.BoxGeometry(1.48, 0.05, 1.48), material('#ffef00', '#847800'), 0, 0.0)
  cheese.rotation.y = 0.25
  const lettuce = mesh(group, new THREE.CylinderGeometry(0.85, 0.79, 0.07, 9), material('#82ff12', '#235800'), 0, 0.09)
  lettuce.rotation.y = 0.45
  mesh(group, new THREE.SphereGeometry(0.78, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), bun, 0, 0.16)
  const seed = material('#fff7ca')
  for (let i = 0; i < 12; i++) {
    const angle = i * 2.4
    const r = 0.15 + i % 4 * 0.135
    const dot = mesh(group, new THREE.SphereGeometry(0.037, 5, 4), seed, Math.cos(angle) * r, 0.16 + Math.sqrt(0.78 ** 2 - r ** 2), Math.sin(angle) * r)
    dot.scale.z = 0.45
  }
  const white = material('#ffffff')
  const black = material('#100016')
  for (const x of [-0.22, 0.22]) {
    mesh(group, new THREE.SphereGeometry(0.15, 9, 7), white, x, 0.39, 0.69)
    mesh(group, new THREE.SphereGeometry(0.075, 7, 5), black, x + 0.035, 0.4, 0.815)
  }
  const grill = mesh(group, new THREE.BoxGeometry(0.48, 0.13, 0.1), material('#ebf4ff', '#7279ff'), 0, -0.17, 0.77)
  grill.rotation.z = -0.12
  return group
}

function cheese() {
  const group = new THREE.Group()
  const shape = new THREE.Shape()
  shape.moveTo(-0.78, -0.5)
  shape.lineTo(0.78, -0.5)
  shape.lineTo(0.78, 0.48)
  shape.closePath()
  const block = new THREE.ExtrudeGeometry(shape, { depth: 0.85, bevelEnabled: false })
  block.translate(0, 0, -0.425)
  mesh(group, block, material('#fff100', '#977a00'))
  const hole = material('#c28400')
  for (const [x, y, r] of [[0.53, -0.28, 0.13], [0.3, 0.01, 0.095], [-0.29, -0.34, 0.07], [0.59, 0.23, 0.07]]) {
    mesh(group, new THREE.CircleGeometry(r, 10), hole, x, y, 0.43)
  }
  // A grossly oversized iced-out chain is part of the joke, still real mesh.
  const chain = mesh(group, new THREE.TorusGeometry(0.51, 0.05, 5, 16), material('#ffad00', '#795300'), 0.05, -0.36, 0.55)
  chain.scale.y = 0.7
  mesh(group, new THREE.BoxGeometry(0.2, 0.3, 0.07), material('#b8fffe', '#3484bb'), 0.06, -0.82, 0.57)
  return group
}

function doubleCup() {
  const group = new THREE.Group()
  const foam = material('#faf7ef')
  mesh(group, new THREE.CylinderGeometry(0.49, 0.34, 0.99, 15), foam, 0, -0.17)
  mesh(group, new THREE.CylinderGeometry(0.53, 0.43, 0.65, 15), foam, 0, 0.34)
  for (const y of [-0.23, 0.025, 0.66]) {
    const rim = mesh(group, new THREE.TorusGeometry(y === 0.66 ? 0.53 : 0.45, 0.027, 5, 17), material('#d1c8dc'), 0, y)
    rim.rotation.x = Math.PI / 2
  }
  const liquid = mesh(group, new THREE.CircleGeometry(0.51, 18), material('#bd00ff', '#7a00a5'), 0, 0.667)
  liquid.rotation.x = -Math.PI / 2
  const straw = mesh(group, new THREE.CylinderGeometry(0.048, 0.048, 1.3, 7), material('#ff00c8', '#970050'), 0.25, 1.0)
  straw.rotation.z = -0.27
  const badge = mesh(group, new THREE.BoxGeometry(0.6, 0.37, 0.055), material('#781aff', '#44008a'), 0, 0.23, 0.51)
  badge.rotation.z = 0.13
  return group
}

function labelTexture(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 27px Comic Sans MS, monospace'
  ctx.textAlign = 'center'
  ctx.fillText(text, 128, 41, 242)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** A deliberately tasteless 2008 screensaver, made of actual WebGL meshes. */
export function Underground3D({ portraits = DEFAULT_PORTRAITS }: { portraits?: readonly Portrait[] }) {
  const host = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const container = host.current
    if (!container) return
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' })
    if (!context) { setFallback(true); return }
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: false, powerPreference: 'low-power' })
    } catch { setFallback(true); return }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 640 ? 1 : 1.25))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.append(canvas)
    setFallback(false)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-6, 6, 3.4, -3.4, 0.1, 40)
    camera.position.set(0, 0, 16)
    scene.add(new THREE.AmbientLight(0xffffff, 2.1))
    const pinkLight = new THREE.DirectionalLight(0xff27d3, 3.6)
    pinkLight.position.set(-4, 5, 7)
    const greenLight = new THREE.DirectionalLight(0x9cff00, 2.5)
    greenLight.position.set(5, -1, 6)
    scene.add(pinkLight, greenLight)
    const props: Prop[] = [
      { object: burger(), side: -1, y: 1.65, scale: 0.91, speed: 0.8, phase: 0 },
      { object: cheese(), side: -1, y: -2.08, scale: 0.79, speed: -0.85, phase: 1.8 },
      { object: doubleCup(), side: 1, y: -1.95, scale: 0.8, speed: 0.75, phase: 0.6 },
    ]
    const photoTextures = new Set<THREE.Texture>()
    let disposed = false
    let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const textureLoader = new THREE.TextureLoader()
    portraits.slice(0, 3).forEach((portrait, i) => {
      const frame = new THREE.Group()
      mesh(frame, new THREE.BoxGeometry(1.43, 1.65, 0.18), material(i % 2 ? '#00ff22' : '#ff00db', '#72003f'))
      // Sprites are transparent, so they sit on a solid neon card.
      mesh(frame, new THREE.PlaneGeometry(1.27, 1.21), new THREE.MeshBasicMaterial({ color: '#fffc13', side: THREE.DoubleSide }), 0, 0.09, 0.1)
      const photoMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, transparent: true, opacity: 0 })
      mesh(frame, new THREE.PlaneGeometry(1.2, 1.15), photoMaterial, 0, 0.09, 0.106)
      const texture = textureLoader.load(portrait.src, (loaded) => {
        if (disposed) { loaded.dispose(); return }
        loaded.colorSpace = THREE.SRGBColorSpace
        loaded.minFilter = THREE.LinearFilter
        loaded.magFilter = THREE.LinearFilter
        photoMaterial.opacity = 1
        photoMaterial.map = loaded
        photoMaterial.needsUpdate = true
        if (reduced && !document.hidden) renderer.render(scene, camera)
      }, undefined, () => { /* The neon card still works if a sprite fails. */ })
      photoTextures.add(texture)
      const label = labelTexture(portrait.label)
      photoTextures.add(label)
      mesh(frame, new THREE.PlaneGeometry(1.28, 0.31), new THREE.MeshBasicMaterial({ map: label }), 0, -0.61, 0.11)
      props.push({ object: frame, side: i === 1 ? -1 : 1, y: [1.78, -0.25, -0.15][i], scale: i === 2 ? 0.62 : 0.76, speed: i % 2 ? -0.6 : 0.55, phase: i + 2 })
    })
    props.forEach((prop) => {
      prop.object.scale.setScalar(prop.scale)
      scene.add(prop.object)
    })

    let raf = 0
    let last = performance.now()
    let lastRender = -Infinity
    let elapsed = 0
    let viewWidth = 12
    const pointer = { x: 0, y: 0 }
    const draw = () => {
      for (const prop of props) {
        const small = window.innerWidth < 640
        prop.object.position.x = prop.side * viewWidth * (small ? 0.47 : 0.435) + (reduced ? 0 : Math.sin(elapsed * 0.48 + prop.phase) * 0.16 + pointer.x * 0.1)
        prop.object.position.y = prop.y + (reduced ? 0 : Math.sin(elapsed * 1.1 + prop.phase) * 0.16 + pointer.y * 0.07)
        prop.object.scale.setScalar(prop.scale * (small ? 0.72 : 1))
        prop.object.rotation.set(reduced ? 0.12 : Math.sin(elapsed * 0.6 + prop.phase) * 0.25, reduced ? 0.34 * prop.side : elapsed * prop.speed + prop.phase, reduced ? 0.13 * prop.side : Math.sin(elapsed * 0.8 + prop.phase) * 0.32)
      }
      renderer.render(scene, camera)
    }
    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      viewWidth = 6.8 * width / height
      camera.left = -viewWidth / 2
      camera.right = viewWidth / 2
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      if (!document.hidden) draw()
    }
    const tick = (now: number) => {
      if (disposed || document.hidden || reduced || context.isContextLost()) return
      elapsed += Math.min(0.08, (now - last) / 1000)
      last = now
      if (now - lastRender >= 1000 / 30) { draw(); lastRender = now }
      raf = requestAnimationFrame(tick)
    }
    const restart = () => {
      cancelAnimationFrame(raf)
      if (disposed || document.hidden || context.isContextLost()) return
      last = performance.now()
      draw()
      if (!reduced) raf = requestAnimationFrame(tick)
    }
    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth * 2 - 1
      pointer.y = 1 - e.clientY / window.innerHeight * 2
    }
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionPreference = () => { reduced = motionPreference.matches; restart() }
    const onContextLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      setFallback(true)
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('visibilitychange', restart)
    motionPreference.addEventListener('change', onMotionPreference)
    resize()
    restart()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', restart)
      motionPreference.removeEventListener('change', onMotionPreference)
      const geometries = new Set<THREE.BufferGeometry>()
      const paints = new Set<THREE.Material>()
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        geometries.add(object.geometry)
        const list = Array.isArray(object.material) ? object.material : [object.material]
        list.forEach((paint) => paints.add(paint))
      })
      geometries.forEach((geometry) => geometry.dispose())
      paints.forEach((paint) => paint.dispose())
      photoTextures.forEach((texture) => texture.dispose())
      scene.clear()
      renderer.dispose()
      if (!context.isContextLost()) renderer.forceContextLoss()
      canvas.remove()
    }
  }, [portraits])

  return (
    <div className="underground-3d" aria-hidden="true" data-troll-ui data-testid="underground-3d" data-renderer={fallback ? 'fallback' : 'webgl'}>
      <div ref={host} className="underground-3d-canvas" />
      <span className="underground-3d-wordart underground-3d-wordart-left">REAL 3D<br />FAKE AURA</span>
      <span className="underground-3d-wordart underground-3d-wordart-right">2008 CALLED<br />WE DECLINED</span>
      <span className="underground-3d-sticker">GRAPHICS: EXTREMELY UNNECESSARY</span>
      {fallback ? (
        <div className="underground-3d-fallback">
          <span className="underground-3d-burger">🍔</span><span className="underground-3d-cheese">🧀</span><span className="underground-3d-cup">🥤</span>
          {portraits.slice(0, 2).map((portrait, i) => <img key={portrait.src} src={portrait.src} alt="" className={`underground-3d-photo underground-3d-photo-${i}`} />)}
        </div>
      ) : null}
    </div>
  )
}
