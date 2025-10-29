import React, { useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CubeTextureLoader } from 'three'
import './index.css' // твой CSS для full screen

// Компонент для cubemap
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

// Сцена с объектами
function Scene({ cubemapUrls }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow
        position={[5, 10, 7.5]}
        intensity={1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <CubeBackground urls={cubemapUrls} />

      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial metalness={0.3} roughness={0.4} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#7f7f7f" metalness={0} roughness={1} />
      </mesh>

      <OrbitControls enableDamping dampingFactor={0.08} />
    </>
  )
}

// Главное приложение с меню
export default function R3FCubemapDemo() {
  const [selectedCubemap, setSelectedCubemap] = useState('cubemap1')

  // Генерация массива URL для выбранного cubemap
  const getCubemapUrls = name => [
    `/assets/${name}/posx.jpg`,
    `/assets/${name}/negx.jpg`,
    `/assets/${name}/posy.jpg`,
    `/assets/${name}/negy.jpg`,
    `/assets/${name}/posz.jpg`,
    `/assets/${name}/negz.jpg`,
  ]

  const cubemapUrls = getCubemapUrls(selectedCubemap)

  const cubemapOptions = ['cubemap1', 'cubemap2', 'cubemap3', 'cubemap4', 'cubemap5']

  return (
    <div id="canvas-container">
      {/* Меню выбора Cubemap */}
      <div
        id="menu"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '10px',
          borderRadius: '8px',
          zIndex: 10,
        }}
      >
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

      {/* Canvas */}
      <Canvas shadows camera={{ position: [5, 5, 8], fov: 50 }}>
        <Scene cubemapUrls={cubemapUrls} />
      </Canvas>
    </div>
  )
}
