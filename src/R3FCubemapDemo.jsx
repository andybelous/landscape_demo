import React, { useMemo, useEffect, useState, useRef } from 'react'
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  CubeTextureLoader,
  TextureLoader,
  RepeatWrapping,
  Vector2,
  MeshStandardMaterial,
  LinearMipmapLinearFilter,
  LinearFilter
} from 'three'
import { Mesh, BoxGeometry, BackSide, DoubleSide, MeshBasicMaterial, SRGBColorSpace  } from 'three'
import { GUI } from 'dat.gui'

import './index.css'



function Skybox({ urls, scale = 1000 }) {
  const meshRef = useRef()
  const { camera, scene } = useThree()
  const zOffset = useRef(0)
  const [materials, setMaterials] = useState(null)

  useEffect(() => {
    const loader = new TextureLoader()
    let isMounted = true

    Promise.all(urls.map((url) => new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject))))
      .then((textures) => {
        if (!isMounted) return

        const mats = textures.map((tex) => {
          // tex.magFilter = LinearFilter
          // tex.minFilter = LinearMipmapLinearFilter
          // tex.flipY = true
          tex.needsUpdate = true

          tex.colorSpace = SRGBColorSpace;
          return new MeshBasicMaterial({
            map: tex,
            side: BackSide,
            depthWrite: false,
            fog: false, // 🚀 выключаем влияние тумана
          })
        })

        setMaterials(mats)
      })
      .catch((err) => console.error('Skybox load error:', err))

    // dat.GUI
    const gui = new GUI()
    const settings = { zOffset: 0 }
    gui
      .add(settings, 'zOffset', -500, 500, 0.1)
      .name('Skybox Z Offset')
      .onChange((val) => (zOffset.current = val))

    return () => {
      gui.destroy()
      isMounted = false
      if (meshRef.current) {
        scene.remove(meshRef.current)
        meshRef.current.geometry.dispose()
        meshRef.current.material.forEach((m) => m.dispose())
      }
    }
  }, [urls, scene])

  // создаём куб, когда материалы загружены
  useEffect(() => {
    if (!materials) return

    const geometry = new BoxGeometry(1, 1, 1)
    const mesh = new Mesh(geometry, materials)
    mesh.scale.setScalar(scale)
    scene.add(mesh)
    meshRef.current = mesh

    return () => {
      scene.remove(mesh)
      geometry.dispose()
      materials.forEach((m) => m.dispose())
    }
  }, [materials, scale, scene])

  // следим за камерой и добавляем смещение по Z
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position)
      meshRef.current.position.z += zOffset.current
    }
  })

  return null
}



function CubeBackground({ urls }) {
  const { scene } = useThree()
  useEffect(() => {
    const loader = new CubeTextureLoader()
    loader.load(urls, (texture) => {
      scene.background = texture
    })
  }, [scene, urls])
  return null
}

function Scene({ cubemapUrls, groundTextureUrl }) {
  const groundTexture = useLoader(TextureLoader, groundTextureUrl)
  groundTexture.wrapS = groundTexture.wrapT = RepeatWrapping
  groundTexture.repeat.set(100,100); 

  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({
      map: groundTexture,
      roughness: 1.0,
      metalness: 0.0
    })

    mat.onBeforeCompile = (shader) => {
  // === добавляем repeat ===
  shader.uniforms.repeat = { value: new Vector2(100.0, 100.0) };


  // Назначаем vUv
  shader.vertexShader = shader.vertexShader.replace(
    'void main() {',
    `varying vec2 vUv;
     void main() {
       vUv = uv;`
  );

  // Вставляем наши функции после common
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
     varying vec2 vUv;
     uniform vec2 repeat;

     vec4 hash4(vec2 p) {
       vec4 p4 = fract(vec4(p.xyx * 0.1031, p.yxx * 0.11369));
       p4 += dot(p4, p4.wzxy + 33.33);
       return fract((p4.xxyz + p4.yzzw) * p4.zywx);
     }

     vec4 textureNoTile(sampler2D samp, vec2 uv) {
       vec2 p = floor(uv);
       vec2 f = fract(uv);
       vec2 ddx = dFdx(uv);
       vec2 ddy = dFdy(uv);

       vec4 va = vec4(0.0);
       float wt = 0.0;

       for (int j = -1; j <= 1; j++) {
         for (int i = -1; i <= 1; i++) {
           vec2 g = vec2(float(i), float(j));
           vec4 o = hash4(p + g);
           vec2 r = g - f + o.xy;
           float d = dot(r, r);
           float w = exp(-5.0 * d);
           vec4 c = textureGrad(samp, uv + o.zw, ddx, ddy);
           va += w * c;
           wt += w;
         }
       }
       return va / wt;
     }`
  );

  // Самое главное — подменяем diffuseColor в теле main
  shader.fragmentShader = shader.fragmentShader.replace(
    'vec4 diffuseColor = vec4( diffuse, opacity );',
    `
    vec4 diffuseColor = vec4( diffuse, opacity );
    vec2 tiledUv = vUv * repeat;
    vec4 texelColor = textureNoTile(map, tiledUv);
    diffuseColor *= texelColor;
    `
  );

  mat.userData.shader = shader;


    }

    return mat
  }, [groundTexture])


  groundTexture.anisotropy = 16;
  groundTexture.minFilter = LinearMipmapLinearFilter;
  groundTexture.magFilter = LinearFilter;
  groundTexture.needsUpdate = true;

  return (
    <>
      <ambientLight intensity={0.6} />
      <fog attach="fog" args={['#fcd28f', 200, 600]} />
      <directionalLight
        castShadow
        position={[5, 10, 7.5]}
        intensity={2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Skybox urls={cubemapUrls} position={[0, 500, 0]} />

      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial metalness={0.3} roughness={0.4} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        {material && <primitive object={material} attach="material" />}
      </mesh>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
    </>
  )
}

export default function R3FCubemapDemo() {
  const [selectedCubemap, setSelectedCubemap] = React.useState('cubemap1')
  const [selectedGround, setSelectedGround] = React.useState('ground1')

  const getCubemapUrls = (name) => [
    `/assets/${name}/posx.jpg`,
    `/assets/${name}/negx.jpg`,
    `/assets/${name}/posy.jpg`,
    `/assets/${name}/negy.jpg`,
    `/assets/${name}/posz.jpg`,
    `/assets/${name}/negz.jpg`,
  ]

  const cubemapUrls = getCubemapUrls(selectedCubemap)
  const groundTextureUrl = `/assets/textures/${selectedGround}.jpg`

  return (
    <div id="canvas-container">
      <div className="menu" style={{ top: '300px', right: '20px' }}>
        <h3>Scenery</h3>
        {['cubemap1','cubemap2','cubemap3','cubemap4','cubemap5'].map(name => (
          <label key={name} style={{ display: 'block', margin: '5px 0' }}>
            <input
              type="checkbox"
              checked={selectedCubemap === name}
              onChange={() => setSelectedCubemap(name)}
            /> {name}
          </label>
        ))}
      </div>

      <div className="menu" style={{ top: '60px', right: '20px' }}>
        <h3>Landscape</h3>
        {['ground1','ground2','ground3','ground4','ground5'].map(name => (
          <label key={name} style={{ display: 'block', margin: '5px 0' }}>
            <input
              type="checkbox"
              checked={selectedGround === name}
              onChange={() => setSelectedGround(name)}
            /> {name}
          </label>
        ))}
      </div>

      <Canvas shadows camera={{ position: [0, 15, 30], fov: 60 }}>
        <Scene cubemapUrls={cubemapUrls} groundTextureUrl={groundTextureUrl} />
      </Canvas>
    </div>
  )
}
