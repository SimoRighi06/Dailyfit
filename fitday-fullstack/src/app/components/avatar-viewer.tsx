"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Float } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";

// Skin shader con subsurface scattering simulato
const skinMaterial = {
  color: "#c99372",
  roughness: 0.6,
  metalness: 0.05,
  clearcoat: 0.1,
  clearcoatRoughness: 0.4,
};

// Capelli più realistici
const hairMaterial = {
  color: "#4a392f",
  roughness: 0.8,
  metalness: 0.1,
};

function AvatarModel({ topColor, bottomColor, shoeColor, topPhoto, bottomPhoto, shoePhoto, wireframe }: {
  topColor: string; bottomColor: string; shoeColor: string;
  topPhoto?: string | null; bottomPhoto?: string | null; shoePhoto?: string | null; wireframe: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animazione idle (respiro leggero)
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = -1.05 + Math.sin(t * 1.5) * 0.01;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.05, 0]}>
      {/* Testa */}
      <mesh position={[0, 2.08, 0]} castShadow>
        <sphereGeometry args={[0.19, 64, 64]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      
      {/* Capelli (più voluminosi) */}
      <mesh position={[0, 2.15, -0.02]} scale={[1.05, 0.7, 1.05]} castShadow>
        <sphereGeometry args={[0.19, 32, 32]} />
        <meshPhysicalMaterial {...hairMaterial} wireframe={wireframe} />
      </mesh>
      
      {/* Orecchie */}
      <mesh position={[-0.19, 2.08, 0]} castShadow>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      <mesh position={[0.19, 2.08, 0]} castShadow>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      
      {/* Collo */}
      <mesh position={[0, 1.86, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.15, 16]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      
      {/* Torso (top) */}
      <mesh position={[0, 1.43, 0]} castShadow>
        <capsuleGeometry args={[0.29, 0.55, 16, 32]} />
        <meshPhysicalMaterial 
          color={topColor} 
          roughness={0.85} 
          metalness={0.05}
          wireframe={wireframe} 
        />
      </mesh>
      
      {/* Braccia (top) */}
      <mesh position={[-0.36, 1.47, 0]} rotation={[0, 0, -0.24]} castShadow>
        <capsuleGeometry args={[0.105, 0.44, 12, 24]} />
        <meshPhysicalMaterial color={topColor} roughness={0.85} wireframe={wireframe} />
      </mesh>
      <mesh position={[0.36, 1.47, 0]} rotation={[0, 0, 0.24]} castShadow>
        <capsuleGeometry args={[0.105, 0.44, 12, 24]} />
        <meshPhysicalMaterial color={topColor} roughness={0.85} wireframe={wireframe} />
      </mesh>
      
      {/* Avambracci (pelle) */}
      <mesh position={[-0.38, 0.87, 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.55, 12, 24]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      <mesh position={[0.38, 0.87, 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.55, 12, 24]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      
      {/* Mani */}
      <mesh position={[-0.38, 0.52, 0.05]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      <mesh position={[0.38, 0.52, 0.05]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshPhysicalMaterial {...skinMaterial} wireframe={wireframe} />
      </mesh>
      
      {/* Gambe (bottom) */}
      <mesh position={[-0.145, 0.49, 0]} castShadow>
        <capsuleGeometry args={[0.135, 0.71, 16, 32]} />
        <meshPhysicalMaterial 
          color={bottomColor} 
          roughness={0.9} 
          metalness={0.02}
          wireframe={wireframe} 
        />
      </mesh>
      <mesh position={[0.145, 0.49, 0]} castShadow>
        <capsuleGeometry args={[0.135, 0.71, 16, 32]} />
        <meshPhysicalMaterial 
          color={bottomColor} 
          roughness={0.9} 
          metalness={0.02}
          wireframe={wireframe} 
        />
      </mesh>
      
      {/* Scarpe */}
      <mesh position={[-0.15, -0.02, 0.07]} castShadow>
        <boxGeometry args={[0.23, 0.13, 0.4]} />
        <meshPhysicalMaterial 
          color={shoeColor} 
          roughness={0.7} 
          metalness={0.1}
          clearcoat={0.3}
          wireframe={wireframe} 
        />
      </mesh>
      <mesh position={[0.15, -0.02, 0.07]} castShadow>
        <boxGeometry args={[0.23, 0.13, 0.4]} />
        <meshPhysicalMaterial 
          color={shoeColor} 
          roughness={0.7} 
          metalness={0.1}
          clearcoat={0.3}
          wireframe={wireframe} 
        />
      </mesh>
    </group>
  );
}

const DEFAULTS = { rotate: true, speed: 0.8, dist: 4.2, light: 2.4, textures: true, wire: false, bg: "#f2f2ee" };
const BGS = [
  { v: "#f2f2ee", l: "PAPER" },
  { v: "#ffffff", l: "WHITE" },
  { v: "#0b0b0b", l: "INK" },
  { v: "#d8ff00", l: "VOLT" },
  { v: "#1a1a1a", l: "DARK" },
];

export function AvatarViewer({ 
  topColor = "#1c1c1c", 
  bottomColor = "#2e2e2e", 
  shoeColor = "#d8ff00", 
  topPhoto, 
  bottomPhoto, 
  shoePhoto, 
  height = 350, 
  controls = false 
}: {
  topColor?: string; bottomColor?: string; shoeColor?: string;
  topPhoto?: string | null; bottomPhoto?: string | null; shoePhoto?: string | null;
  height?: number; controls?: boolean;
}) {
  const [rotate, setRotate] = useState(DEFAULTS.rotate);
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [dist, setDist] = useState(DEFAULTS.dist);
  const [light, setLight] = useState(DEFAULTS.light);
  const [textures, setTextures] = useState(DEFAULTS.textures);
  const [wire, setWire] = useState(DEFAULTS.wire);
  const [bg, setBg] = useState(DEFAULTS.bg);
  const orbit = useRef<any>(null);

  useEffect(() => {
    const c = orbit.current; if (!c) return;
    const dir = c.object.position.clone().sub(c.target).normalize();
    c.object.position.copy(c.target.clone().add(dir.multiplyScalar(dist)));
    c.update();
  }, [dist]);

  const reset = () => { 
    setRotate(DEFAULTS.rotate); setSpeed(DEFAULTS.speed); setDist(DEFAULTS.dist); 
    setLight(DEFAULTS.light); setTextures(DEFAULTS.textures); setWire(DEFAULTS.wire); 
    setBg(DEFAULTS.bg); orbit.current?.reset(); 
  };

  return (
    <div className="avatar-wrap">
      <div className="avatar-canvas" style={{ height }}>
        <Canvas shadows camera={{ position: [0, 0.85, 4.2], fov: 37 }} dpr={[1, 2]}>
          <color attach="background" args={[bg]} />
          <fog attach="fog" args={[bg, 7, 13]} />
          
          {/* Illuminazione migliorata */}
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[5, 8, 5]} 
            intensity={light} 
            castShadow 
            shadow-mapSize-width={2048} 
            shadow-mapSize-height={2048}
            shadow-camera-far={20}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <directionalLight position={[-3, 4, -3]} intensity={0.5} color="#b4c6e7" />
          <pointLight position={[0, 3, 3]} intensity={0.8} color="#fff5e6" />
          
          {/* Environment map per riflessi realistici */}
          <Environment preset="city" />
          
          <Suspense fallback={null}>
            <AvatarModel 
              topColor={topColor} 
              bottomColor={bottomColor} 
              shoeColor={shoeColor}
              topPhoto={textures ? topPhoto : null} 
              bottomPhoto={textures ? bottomPhoto : null} 
              shoePhoto={textures ? shoePhoto : null} 
              wireframe={wire} 
            />
          </Suspense>
          
          <ContactShadows 
            position={[0, -1.08, 0]} 
            opacity={0.4} 
            scale={4} 
            blur={2.5} 
            frames={1} 
          />
          
          <OrbitControls 
            ref={orbit} 
            enablePan={false} 
            enableDamping 
            dampingFactor={0.08}
            autoRotate={controls ? rotate : false} 
            autoRotateSpeed={speed}
            minPolarAngle={Math.PI / 3} 
            maxPolarAngle={Math.PI / 1.7} 
            minDistance={3.3} 
            maxDistance={5.2} 
          />
        </Canvas>
      </div>
      
      {controls && (
        <div className="viewer-controls">
          <label className="vc-item">
            <span>ROTAZIONE</span>
            <button className={`vc-toggle ${rotate ? "on" : ""}`} onClick={() => setRotate(v => !v)}>
              {rotate ? "ON" : "OFF"}
            </button>
          </label>
          <label className="vc-item">
            <span>VELOCITÀ {speed.toFixed(1)}</span>
            <input type="range" min={0.2} max={3} step={0.1} value={speed} onChange={e => setSpeed(+e.target.value)} />
          </label>
          <label className="vc-item">
            <span>DISTANZA {dist.toFixed(1)}</span>
            <input type="range" min={3.3} max={5.2} step={0.1} value={dist} onChange={e => setDist(+e.target.value)} />
          </label>
          <label className="vc-item">
            <span>LUCE {light.toFixed(1)}</span>
            <input type="range" min={0.5} max={3.5} step={0.1} value={light} onChange={e => setLight(+e.target.value)} />
          </label>
          <label className="vc-item">
            <span>TEXTURE</span>
            <button className={`vc-toggle ${textures ? "on" : ""}`} onClick={() => setTextures(v => !v)}>
              {textures ? "ON" : "OFF"}
            </button>
          </label>
          <label className="vc-item">
            <span>WIREFRAME</span>
            <button className={`vc-toggle ${wire ? "on" : ""}`} onClick={() => setWire(v => !v)}>
              {wire ? "ON" : "OFF"}
            </button>
          </label>
          <label className="vc-item">
            <span>SFONDO</span>
            <select value={bg} onChange={e => setBg(e.target.value)}>
              {BGS.map(b => <option key={b.v} value={b.v}>{b.l}</option>)}
            </select>
          </label>
          <button className="btn btn-primary vc-reset" onClick={reset}>RESET</button>
        </div>
      )}
    </div>
  );
}