"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";

type HairStyle = "short" | "long" | "curly";

function GarmentMaterial({
  color,
  photo,
  wireframe,
  roughness,
  metalness = 0,
  clearcoat = 0,
}: {
  color: string;
  photo?: string | null;
  wireframe: boolean;
  roughness: number;
  metalness?: number;
  clearcoat?: number;
}) {
  const [loaded, setLoaded] = useState<{ url: string; texture: THREE.Texture } | null>(null);

  useEffect(() => {
    if (!photo) return;

    let active = true;
    let texture: THREE.Texture | null = null;
    new THREE.TextureLoader().load(
      photo,
      (loadedTexture) => {
        if (!active) {
          loadedTexture.dispose();
          return;
        }
        texture = loadedTexture;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.needsUpdate = true;
        setLoaded({ url: photo, texture: loadedTexture });
      },
      undefined,
      (error) => {
        if (active) console.error("Unable to load avatar garment photo:", photo, error);
      },
    );

    return () => {
      active = false;
      texture?.dispose();
    };
  }, [photo]);

  const map = loaded && loaded.url === photo ? loaded.texture : null;

  return (
    <meshPhysicalMaterial
      color={map ? "#ffffff" : color}
      map={map}
      roughness={roughness}
      metalness={metalness}
      clearcoat={clearcoat}
      wireframe={wireframe}
    />
  );
}

function AvatarModel({
  topColor,
  bottomColor,
  shoeColor,
  topPhoto,
  bottomPhoto,
  shoePhoto,
  wireframe,
  skinColor,
  hairColor,
  hairStyle,
  bodyWidth,
  bodyHeight,
}: {
  topColor: string;
  bottomColor: string;
  shoeColor: string;
  topPhoto?: string | null;
  bottomPhoto?: string | null;
  shoePhoto?: string | null;
  wireframe: boolean;
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyle;
  bodyWidth: number;
  bodyHeight: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = -1.05 + Math.sin(t * 1.5) * 0.01;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.05, 0]} scale={[bodyWidth, bodyHeight, bodyWidth]}>
      <mesh position={[0, 2.08, 0]} castShadow>
        <sphereGeometry args={[0.19, 48, 40]} />
        <meshPhysicalMaterial color={skinColor} roughness={0.62} clearcoat={0.08} wireframe={wireframe} />
      </mesh>

      <mesh position={[0, 2.12, -0.005]} castShadow>
        <sphereGeometry args={[0.195, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.64]} />
        <meshPhysicalMaterial color={hairColor} roughness={0.78} wireframe={wireframe} />
      </mesh>
      {hairStyle === "long" && (
        <>
          <mesh position={[-0.15, 1.99, -0.045]} castShadow>
            <capsuleGeometry args={[0.065, 0.24, 8, 16]} />
            <meshPhysicalMaterial color={hairColor} roughness={0.78} wireframe={wireframe} />
          </mesh>
          <mesh position={[0.15, 1.99, -0.045]} castShadow>
            <capsuleGeometry args={[0.065, 0.24, 8, 16]} />
            <meshPhysicalMaterial color={hairColor} roughness={0.78} wireframe={wireframe} />
          </mesh>
        </>
      )}
      {hairStyle === "curly" &&
        [-0.13, -0.065, 0, 0.065, 0.13].map((x) => (
          <mesh key={x} position={[x, 2.24 - Math.abs(x) * 0.2, 0.025]} castShadow>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshPhysicalMaterial color={hairColor} roughness={0.78} wireframe={wireframe} />
          </mesh>
        ))}

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.19, 2.08, 0]} castShadow>
            <sphereGeometry args={[0.04, 20, 16]} />
            <meshPhysicalMaterial color={skinColor} roughness={0.62} wireframe={wireframe} />
          </mesh>
          <mesh position={[side * 0.068, 2.11, 0.168]} castShadow>
            <sphereGeometry args={[0.028, 20, 16]} />
            <meshPhysicalMaterial color="#f4eee7" roughness={0.28} wireframe={wireframe} />
          </mesh>
          <mesh position={[side * 0.068, 2.11, 0.192]} castShadow>
            <sphereGeometry args={[0.014, 16, 12]} />
            <meshPhysicalMaterial color="#70503c" roughness={0.3} wireframe={wireframe} />
          </mesh>
          <mesh position={[side * 0.068, 2.11, 0.203]} castShadow>
            <sphereGeometry args={[0.007, 12, 10]} />
            <meshPhysicalMaterial color="#211a17" roughness={0.25} wireframe={wireframe} />
          </mesh>
          <mesh position={[side * 0.068, 2.15, 0.166]} rotation={[0, 0, side * -0.12]} castShadow>
            <capsuleGeometry args={[0.009, 0.045, 4, 8]} />
            <meshPhysicalMaterial color={hairColor} roughness={0.8} wireframe={wireframe} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.055, 0.188]} scale={[0.035, 0.05, 0.035]} castShadow>
        <sphereGeometry args={[1, 20, 16]} />
        <meshPhysicalMaterial color={skinColor} roughness={0.62} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 1.995, 0.17]} scale={[0.045, 0.009, 0.01]} castShadow>
        <sphereGeometry args={[1, 20, 12]} />
        <meshPhysicalMaterial color="#874f4b" roughness={0.7} wireframe={wireframe} />
      </mesh>

      <mesh position={[0, 1.86, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.15, 20]} />
        <meshPhysicalMaterial color={skinColor} roughness={0.62} wireframe={wireframe} />
      </mesh>

      <mesh position={[0, 1.43, 0]} castShadow>
        <capsuleGeometry args={[0.29, 0.55, 16, 32]} />
        <GarmentMaterial color={topColor} photo={topPhoto} roughness={0.85} metalness={0.02} wireframe={wireframe} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.36, 1.47, 0]} rotation={[0, 0, side * 0.24]} castShadow>
          <capsuleGeometry args={[0.105, 0.44, 12, 24]} />
          <GarmentMaterial color={topColor} photo={topPhoto} roughness={0.85} wireframe={wireframe} />
        </mesh>
      ))}

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.38, 0.87, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.55, 12, 24]} />
            <meshPhysicalMaterial color={skinColor} roughness={0.62} wireframe={wireframe} />
          </mesh>
          <mesh position={[side * 0.38, 0.52, 0.05]} castShadow>
            <sphereGeometry args={[0.06, 20, 16]} />
            <meshPhysicalMaterial color={skinColor} roughness={0.62} wireframe={wireframe} />
          </mesh>
          {[-1, 0, 1].map((finger) => (
            <mesh
              key={finger}
              position={[side * 0.38 + finger * 0.022, 0.455, 0.075]}
              rotation={[0, 0, finger * -0.12]}
              castShadow
            >
              <capsuleGeometry args={[0.012, 0.055, 4, 8]} />
              <meshPhysicalMaterial color={skinColor} roughness={0.62} wireframe={wireframe} />
            </mesh>
          ))}
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.145, 0.49, 0]} castShadow>
            <capsuleGeometry args={[0.135, 0.71, 16, 32]} />
            <GarmentMaterial color={bottomColor} photo={bottomPhoto} roughness={0.9} metalness={0.01} wireframe={wireframe} />
          </mesh>
          <mesh position={[side * 0.15, -0.02, 0.07]} castShadow>
            <boxGeometry args={[0.23, 0.13, 0.4]} />
            <GarmentMaterial color={shoeColor} photo={shoePhoto} roughness={0.7} metalness={0.04} clearcoat={0.25} wireframe={wireframe} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const DEFAULTS = {
  rotate: true,
  speed: 0.8,
  dist: 4.2,
  light: 2.4,
  textures: true,
  wire: false,
  bg: "#f2f2ee",
  skin: "#c99372",
  hair: "#4a392f",
  hairStyle: "short" as HairStyle,
  bodyWidth: 1,
  bodyHeight: 1,
};

const BGS = [
  { v: "#f2f2ee", l: "PAPER" },
  { v: "#ffffff", l: "WHITE" },
  { v: "#0b0b0b", l: "INK" },
  { v: "#d8ff00", l: "VOLT" },
  { v: "#1a1a1a", l: "DARK" },
];

const SKIN_TONES = [
  { v: "#f1c7a5", l: "CHIARA" },
  { v: "#c99372", l: "MEDIA" },
  { v: "#9b6548", l: "OLIVASTRA" },
  { v: "#603b2c", l: "SCURA" },
];

const HAIR_COLORS = [
  { v: "#211a17", l: "NERO" },
  { v: "#4a392f", l: "CASTANO" },
  { v: "#b88145", l: "BIONDO" },
  { v: "#b94f3b", l: "ROSSO" },
];

export function AvatarViewer({
  topColor = "#1c1c1c",
  bottomColor = "#2e2e2e",
  shoeColor = "#d8ff00",
  topPhoto,
  bottomPhoto,
  shoePhoto,
  height = 350,
  controls = false,
}: {
  topColor?: string;
  bottomColor?: string;
  shoeColor?: string;
  topPhoto?: string | null;
  bottomPhoto?: string | null;
  shoePhoto?: string | null;
  height?: number;
  controls?: boolean;
}) {
  const [rotate, setRotate] = useState(DEFAULTS.rotate);
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [dist, setDist] = useState(DEFAULTS.dist);
  const [light, setLight] = useState(DEFAULTS.light);
  const [textures, setTextures] = useState(DEFAULTS.textures);
  const [wire, setWire] = useState(DEFAULTS.wire);
  const [bg, setBg] = useState(DEFAULTS.bg);
  const [skin, setSkin] = useState(DEFAULTS.skin);
  const [hair, setHair] = useState(DEFAULTS.hair);
  const [hairStyle, setHairStyle] = useState<HairStyle>(DEFAULTS.hairStyle);
  const [bodyWidth, setBodyWidth] = useState(DEFAULTS.bodyWidth);
  const [bodyHeight, setBodyHeight] = useState(DEFAULTS.bodyHeight);
  const orbit = useRef<ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    const controls = orbit.current;
    if (!controls) return;
    const direction = controls.object.position.clone().sub(controls.target).normalize();
    controls.object.position.copy(controls.target.clone().add(direction.multiplyScalar(dist)));
    controls.update();
  }, [dist]);

  const reset = () => {
    setRotate(DEFAULTS.rotate);
    setSpeed(DEFAULTS.speed);
    setDist(DEFAULTS.dist);
    setLight(DEFAULTS.light);
    setTextures(DEFAULTS.textures);
    setWire(DEFAULTS.wire);
    setBg(DEFAULTS.bg);
    setSkin(DEFAULTS.skin);
    setHair(DEFAULTS.hair);
    setHairStyle(DEFAULTS.hairStyle);
    setBodyWidth(DEFAULTS.bodyWidth);
    setBodyHeight(DEFAULTS.bodyHeight);
    orbit.current?.reset();
  };

  return (
    <div className="avatar-wrap">
      <div className="avatar-canvas" style={{ height }}>
        <Canvas shadows camera={{ position: [0, 0.85, 4.2], fov: 37 }} dpr={[1, 2]}>
          <color attach="background" args={[bg]} />
          <fog attach="fog" args={[bg, 7, 13]} />
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
              skinColor={skin}
              hairColor={hair}
              hairStyle={hairStyle}
              bodyWidth={bodyWidth}
              bodyHeight={bodyHeight}
            />
          </Suspense>
          <ContactShadows position={[0, -1.08, 0]} opacity={0.4} scale={4} blur={2.5} frames={1} />
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
            <button type="button" className={`vc-toggle ${rotate ? "on" : ""}`} onClick={() => setRotate((value) => !value)} aria-pressed={rotate}>
              {rotate ? "ON" : "OFF"}
            </button>
          </label>
          <label className="vc-item">
            <span>VELOCITÀ {speed.toFixed(1)}</span>
            <input aria-label="Velocità rotazione" type="range" min={0.2} max={3} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
          </label>
          <label className="vc-item">
            <span>DISTANZA {dist.toFixed(1)}</span>
            <input aria-label="Distanza avatar" type="range" min={3.3} max={5.2} step={0.1} value={dist} onChange={(event) => setDist(Number(event.target.value))} />
          </label>
          <label className="vc-item">
            <span>LUCE {light.toFixed(1)}</span>
            <input aria-label="Intensità luce" type="range" min={0.5} max={3.5} step={0.1} value={light} onChange={(event) => setLight(Number(event.target.value))} />
          </label>
          <label className="vc-item">
            <span>ALTEZZA {bodyHeight.toFixed(2)}</span>
            <input aria-label="Altezza avatar" type="range" min={0.88} max={1.12} step={0.01} value={bodyHeight} onChange={(event) => setBodyHeight(Number(event.target.value))} />
          </label>
          <label className="vc-item">
            <span>FISICITÀ {bodyWidth.toFixed(2)}</span>
            <input aria-label="Fisicità avatar" type="range" min={0.82} max={1.2} step={0.01} value={bodyWidth} onChange={(event) => setBodyWidth(Number(event.target.value))} />
          </label>
          <label className="vc-item">
            <span>PELLE</span>
            <select aria-label="Tonalità della pelle" value={skin} onChange={(event) => setSkin(event.target.value)}>
              {SKIN_TONES.map((tone) => <option key={tone.v} value={tone.v}>{tone.l}</option>)}
            </select>
          </label>
          <label className="vc-item">
            <span>CAPELLI</span>
            <select aria-label="Stile dei capelli" value={hairStyle} onChange={(event) => setHairStyle(event.target.value as HairStyle)}>
              <option value="short">CORTI</option>
              <option value="long">LUNGHI</option>
              <option value="curly">RICCI</option>
            </select>
          </label>
          <label className="vc-item">
            <span>COLORE CAPELLI</span>
            <select aria-label="Colore dei capelli" value={hair} onChange={(event) => setHair(event.target.value)}>
              {HAIR_COLORS.map((tone) => <option key={tone.v} value={tone.v}>{tone.l}</option>)}
            </select>
          </label>
          <label className="vc-item">
            <span>TEXTURE</span>
            <button type="button" className={`vc-toggle ${textures ? "on" : ""}`} onClick={() => setTextures((value) => !value)} aria-pressed={textures}>
              {textures ? "ON" : "OFF"}
            </button>
          </label>
          <label className="vc-item">
            <span>WIREFRAME</span>
            <button type="button" className={`vc-toggle ${wire ? "on" : ""}`} onClick={() => setWire((value) => !value)} aria-pressed={wire}>
              {wire ? "ON" : "OFF"}
            </button>
          </label>
          <label className="vc-item">
            <span>SFONDO</span>
            <select aria-label="Sfondo avatar" value={bg} onChange={(event) => setBg(event.target.value)}>
              {BGS.map((background) => <option key={background.v} value={background.v}>{background.l}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-primary vc-reset" onClick={reset}>RESET</button>
        </div>
      )}
    </div>
  );
}
