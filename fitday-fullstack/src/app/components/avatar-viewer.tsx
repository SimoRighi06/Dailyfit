"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

function usePhotoTexture(url?: string | null) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) { setTex(null); return; }
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(url,
      (t) => { if (!alive) { t.dispose(); return; } t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; setTex(t); console.log("🧵 [avatar] texture applicata:", url.slice(0, 80)); },
      undefined,
      () => { if (alive) { setTex(null); console.warn("⚠️ [avatar] texture non caricata, fallback colore:", url.slice(0, 80)); } });
    return () => { alive = false; };
  }, [url]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  return tex;
}

function Fabric({ color, photo, wireframe }: { color: string; photo?: string | null; wireframe: boolean }) {
  const tex = usePhotoTexture(photo);
  return <meshStandardMaterial color={tex ? "#ffffff" : color} map={tex ?? undefined} roughness={0.86} wireframe={wireframe} />;
}

function AvatarModel({ topColor, bottomColor, shoeColor, topPhoto, bottomPhoto, shoePhoto, wireframe }: {
  topColor: string; bottomColor: string; shoeColor: string;
  topPhoto?: string | null; bottomPhoto?: string | null; shoePhoto?: string | null; wireframe: boolean;
}) {
  const skin = "#c99372";
  return (
    <group position={[0, -1.05, 0]}>
      <mesh position={[0, 2.08, 0]} castShadow><sphereGeometry args={[0.19, 32, 32]} /><meshStandardMaterial color={skin} wireframe={wireframe} /></mesh>
      <mesh position={[0, 2.18, -0.025]} scale={[1.02, 0.62, 1.02]} castShadow><sphereGeometry args={[0.19, 32, 32]} /><meshStandardMaterial color="#4a392f" wireframe={wireframe} /></mesh>
      <mesh position={[0, 1.86, 0]}><cylinderGeometry args={[0.07, 0.07, 0.15, 16]} /><meshStandardMaterial color={skin} wireframe={wireframe} /></mesh>
      <mesh position={[0, 1.43, 0]} castShadow><capsuleGeometry args={[0.29, 0.55, 8, 18]} /><Fabric color={topColor} photo={topPhoto} wireframe={wireframe} /></mesh>
      <mesh position={[-0.36, 1.47, 0]} rotation={[0, 0, -0.24]} castShadow><capsuleGeometry args={[0.105, 0.44, 6, 12]} /><Fabric color={topColor} photo={topPhoto} wireframe={wireframe} /></mesh>
      <mesh position={[0.36, 1.47, 0]} rotation={[0, 0, 0.24]} castShadow><capsuleGeometry args={[0.105, 0.44, 6, 12]} /><Fabric color={topColor} photo={topPhoto} wireframe={wireframe} /></mesh>
      <mesh position={[-0.38, 0.87, 0]} castShadow><capsuleGeometry args={[0.075, 0.55, 6, 12]} /><meshStandardMaterial color={skin} wireframe={wireframe} /></mesh>
      <mesh position={[0.38, 0.87, 0]} castShadow><capsuleGeometry args={[0.075, 0.55, 6, 12]} /><meshStandardMaterial color={skin} wireframe={wireframe} /></mesh>
      <mesh position={[-0.145, 0.49, 0]} castShadow><capsuleGeometry args={[0.135, 0.71, 8, 16]} /><Fabric color={bottomColor} photo={bottomPhoto} wireframe={wireframe} /></mesh>
      <mesh position={[0.145, 0.49, 0]} castShadow><capsuleGeometry args={[0.135, 0.71, 8, 16]} /><Fabric color={bottomColor} photo={bottomPhoto} wireframe={wireframe} /></mesh>
      <mesh position={[-0.15, -0.02, 0.07]} castShadow><boxGeometry args={[0.23, 0.13, 0.4]} /><Fabric color={shoeColor} photo={shoePhoto} wireframe={wireframe} /></mesh>
      <mesh position={[0.15, -0.02, 0.07]} castShadow><boxGeometry args={[0.23, 0.13, 0.4]} /><Fabric color={shoeColor} photo={shoePhoto} wireframe={wireframe} /></mesh>
    </group>
  );
}

const DEFAULTS = { rotate: true, speed: 0.8, dist: 4.2, light: 2.4, textures: true, wire: false, bg: "#ffffff" };
const BGS = [{ v: "#ffffff", l: "WHITE" }, { v: "#f2f2ee", l: "PAPER" }, { v: "#0b0b0b", l: "INK" }, { v: "#d8ff00", l: "VOLT" }];

export function AvatarViewer({ topColor = "#1c1c1c", bottomColor = "#2e2e2e", shoeColor = "#d8ff00", topPhoto, bottomPhoto, shoePhoto, height = 350, controls = false }: {
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

  const reset = () => { setRotate(DEFAULTS.rotate); setSpeed(DEFAULTS.speed); setDist(DEFAULTS.dist); setLight(DEFAULTS.light); setTextures(DEFAULTS.textures); setWire(DEFAULTS.wire); setBg(DEFAULTS.bg); orbit.current?.reset(); };

  return (
    <div className="avatar-wrap">
      <div className="avatar-canvas" style={{ height }}>
        <Canvas shadows camera={{ position: [0, 0.85, 4.2], fov: 37 }} dpr={[1, 1.75]}>
          <color attach="background" args={[bg]} />
          <fog attach="fog" args={[bg, 7, 13]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[3, 5, 4]} intensity={light} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <directionalLight position={[-3, 2, -2]} intensity={0.7} />
          <pointLight position={[-2, 1.2, -2.4]} intensity={0.5} color="#d8ff00" />
          <Suspense fallback={null}>
            <AvatarModel topColor={topColor} bottomColor={bottomColor} shoeColor={shoeColor}
              topPhoto={textures ? topPhoto : null} bottomPhoto={textures ? bottomPhoto : null} shoePhoto={textures ? shoePhoto : null} wireframe={wire} />
          </Suspense>
          <ContactShadows position={[0, -1.08, 0]} opacity={0.26} scale={3.8} blur={2.4} frames={1} />
          <OrbitControls ref={orbit} enablePan={false} enableDamping dampingFactor={0.08}
            autoRotate={controls ? rotate : false} autoRotateSpeed={speed}
            minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} minDistance={3.3} maxDistance={5.2} />
        </Canvas>
      </div>
      {controls && (
        <div className="viewer-controls">
          <label className="vc-item"><span>ROTAZIONE</span><button className={`vc-toggle ${rotate ? "on" : ""}`} onClick={() => setRotate(v => !v)}>{rotate ? "ON" : "OFF"}</button></label>
          <label className="vc-item"><span>VELOCITÀ {speed.toFixed(1)}</span><input type="range" min={0.2} max={3} step={0.1} value={speed} onChange={e => setSpeed(+e.target.value)} /></label>
          <label className="vc-item"><span>DISTANZA {dist.toFixed(1)}</span><input type="range" min={3.3} max={5.2} step={0.1} value={dist} onChange={e => setDist(+e.target.value)} /></label>
          <label className="vc-item"><span>LUCE {light.toFixed(1)}</span><input type="range" min={0.5} max={3.5} step={0.1} value={light} onChange={e => setLight(+e.target.value)} /></label>
          <label className="vc-item"><span>FOTO CAPI</span><button className={`vc-toggle ${textures ? "on" : ""}`} onClick={() => setTextures(v => !v)}>{textures ? "ON" : "OFF"}</button></label>
          <label className="vc-item"><span>WIREFRAME</span><button className={`vc-toggle ${wire ? "on" : ""}`} onClick={() => setWire(v => !v)}>{wire ? "ON" : "OFF"}</button></label>
          <label className="vc-item"><span>SFONDO</span><select value={bg} onChange={e => setBg(e.target.value)}>{BGS.map(b => <option key={b.v} value={b.v}>{b.l}</option>)}</select></label>
          <button className="btn btn-primary vc-reset" onClick={reset}>RESET</button>
        </div>
      )}
    </div>
  );
}