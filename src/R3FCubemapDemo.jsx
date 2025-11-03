import React, { useEffect, useState } from 'react'
import { Canvas, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  CubeTextureLoader,
  TextureLoader,
  ClampToEdgeWrapping,
  RepeatWrapping
} from 'three'
import './index.css'

// === КОМПОНЕНТ CUBEMAP ===
function CubeBackground({ urls }) {
  const { scene } = useThree()

  useEffect(() => {
    const loader = new CubeTextureLoader()
    loader.load(
      urls,
      texture => {
        scene.background = texture
      },
      undefined,
      err => console.error('CubeTextureLoader error:', err)
    )
  }, [scene, urls])

  return null
}

// === СЦЕНА ===
function Scene({ cubemapUrls, groundTextureUrl }) {
  const groundTexture = useLoader(TextureLoader, groundTextureUrl)

  // Настроим повторение текстуры, чтобы не была растянута
  useEffect(() => {
    if (groundTexture) {
    // Не повторяем, просто растягиваем текстуру
    // groundTexture.wrapS = groundTexture.wrapT = ClampToEdgeWrapping
    // groundTexture.offset.set(0, 0)
    // groundTexture.repeat.set(1, 1)

  groundTexture.wrapS = groundTexture.wrapT = RepeatWrapping;
  groundTexture.repeat.set(320,320); // например 4×4 повторения 


    }
  }, [groundTexture])

  return (
    <>
      <ambientLight intensity={0.6} />
      <fog attach="fog" args={['#fcd28f', 10, 200]} />

      <directionalLight
        castShadow
        position={[5, 10, 7.5]}
        intensity={1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <CubeBackground urls={cubemapUrls} />

      {/* Тестовый объект */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Плоскость с выбранной текстурой */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={groundTexture} metalness={0} roughness={1} />
      </mesh>

      <OrbitControls
      enableDamping dampingFactor={0.08}
  enablePan={false}
  maxPolarAngle={Math.PI / 2.2}
  minPolarAngle={Math.PI / 4}
/>
    </>
  )
}

// === ГЛАВНОЕ ПРИЛОЖЕНИЕ ===
export default function R3FCubemapDemo() {
  const [selectedCubemap, setSelectedCubemap] = useState('cubemap1')
  const [selectedGround, setSelectedGround] = useState('ground1')

  // Cubemap URLs
  const getCubemapUrls = name => [
    `/assets/${name}/posx.jpg`,
    `/assets/${name}/negx.jpg`,
    `/assets/${name}/posy.jpg`,
    `/assets/${name}/negy.jpg`,
    `/assets/${name}/posz.jpg`,
    `/assets/${name}/negz.jpg`,
  ]

  // Ground texture URL
  const getGroundTextureUrl = name => `/assets/textures/${name}.jpg`

  const cubemapUrls = getCubemapUrls(selectedCubemap)
  const groundTextureUrl = getGroundTextureUrl(selectedGround)

  const cubemapOptions = ['cubemap1', 'cubemap2', 'cubemap3', 'cubemap4', 'cubemap5']
  const groundOptions = ['ground1', 'ground2', 'ground3', 'ground4', 'ground5']

  return (
    <div id="canvas-container">
      {/* --- Меню Scenery --- */}
      <div className="menu" style={{ top: '20px', left: '20px' }}>
        <h3>Scenery</h3>
        {cubemapOptions.map(name => (
          <label key={name} style={{ display: 'block', margin: '5px 0' }}>
            <input
              type="checkbox"
              checked={selectedCubemap === name}
              onChange={() => setSelectedCubemap(name)}
            />{' '}
            {name}
          </label>
        ))}
      </div>

      {/* --- Меню Landscape --- */}
      <div className="menu" style={{ top: '20px', right: '20px' }}>
        <h3>Landscape</h3>
        {groundOptions.map(name => (
          <label key={name} style={{ display: 'block', margin: '5px 0' }}>
            <input
              type="checkbox"
              checked={selectedGround === name}
              onChange={() => setSelectedGround(name)}
            />{' '}
            {name}
          </label>
        ))}
      </div>

      {/* --- Canvas --- */}
      <Canvas shadows camera={{ position: [0, 15, 30], fov: 60 }}>
        <Scene cubemapUrls={cubemapUrls} groundTextureUrl={groundTextureUrl} />
      </Canvas>
    </div>
  )
}
