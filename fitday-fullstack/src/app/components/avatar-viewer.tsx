"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";

function AvatarModel({ topColor, bottomColor, shoeColor }: { topColor: string; bottomColor: string; shoeColor: string }) {
  const skin = "#c99372";
  return <group position={[0, -1.05, 0]}>
    {/* Head and hair */}
    <mesh position={[0, 2.08, 0]} castShadow><sphereGeometry args={[0.19, 32, 32]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh position={[0, 2.18, -0.025]} scale={[1.02, .62, 1.02]} castShadow><sphereGeometry args={[0.19, 32, 32]}/><meshStandardMaterial color="#4a392f"/></mesh>
    <mesh position={[0, 1.86, 0]}><cylinderGeometry args={[.07, .07, .15, 16]}/><meshStandardMaterial color={skin}/></mesh>
    {/* Top */}
    <mesh position={[0, 1.43, 0]} castShadow><capsuleGeometry args={[.29, .55, 8, 18]}/><meshStandardMaterial color={topColor} roughness={.84}/></mesh>
    {/* Sleeves / arms */}
    <mesh position={[-.36, 1.47, 0]} rotation={[0, 0, -.24]} castShadow><capsuleGeometry args={[.105, .44, 6, 12]}/><meshStandardMaterial color={topColor}/></mesh>
    <mesh position={[.36, 1.47, 0]} rotation={[0, 0, .24]} castShadow><capsuleGeometry args={[.105, .44, 6, 12]}/><meshStandardMaterial color={topColor}/></mesh>
    <mesh position={[-.38, .87, 0]} castShadow><capsuleGeometry args={[.075, .55, 6, 12]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh position={[.38, .87, 0]} castShadow><capsuleGeometry args={[.075, .55, 6, 12]}/><meshStandardMaterial color={skin}/></mesh>
    {/* Bottom */}
    <mesh position={[-.145, .49, 0]} castShadow><capsuleGeometry args={[.135, .71, 8, 16]}/><meshStandardMaterial color={bottomColor} roughness={.88}/></mesh>
    <mesh position={[.145, .49, 0]} castShadow><capsuleGeometry args={[.135, .71, 8, 16]}/><meshStandardMaterial color={bottomColor} roughness={.88}/></mesh>
    {/* Shoes */}
    <mesh position={[-.15, -.02, .07]} castShadow><boxGeometry args={[.23, .13, .4]}/><meshStandardMaterial color={shoeColor}/></mesh>
    <mesh position={[.15, -.02, .07]} castShadow><boxGeometry args={[.23, .13, .4]}/><meshStandardMaterial color={shoeColor}/></mesh>
  </group>;
}

export function AvatarViewer({ topColor = "#68766a", bottomColor = "#3d5870", shoeColor = "#f2f0e9", height = 350 }: {
  topColor?: string; bottomColor?: string; shoeColor?: string; height?: number;
}) {
  return <div className="avatar-canvas" style={{ height }}>
    <Canvas shadows camera={{ position: [0, .85, 4.2], fov: 37 }} dpr={[1, 1.7]}>
      <color attach="background" args={["#f0f2e9"]}/>
      <ambientLight intensity={1.65}/>
      <directionalLight position={[3, 5, 4]} intensity={2.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
      <directionalLight position={[-3, 2, -2]} intensity={.8}/>
      <Suspense fallback={null}><AvatarModel topColor={topColor} bottomColor={bottomColor} shoeColor={shoeColor}/></Suspense>
      <ContactShadows position={[0, -1.08, 0]} opacity={.24} scale={3.8} blur={2.4}/>
      <OrbitControls enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} minDistance={3.3} maxDistance={5.2}/>
    </Canvas>
  </div>;
}
