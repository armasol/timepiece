'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Float, Text3D, Center } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Bezel(){
  return <group>
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.55,.11,36,180]}/><meshStandardMaterial color="#d7d2c0" metalness={1} roughness={.18}/></mesh>
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.34,.055,24,180]}/><meshStandardMaterial color="#0a0d0a" metalness={.7} roughness={.28}/></mesh>
    {Array.from({length:24}).map((_,i)=><mesh key={i} position={[Math.sin(i/24*Math.PI*2)*1.47,Math.cos(i/24*Math.PI*2)*1.47,.045]} rotation={[0,0,-i/24*Math.PI*2]}><boxGeometry args={[.025,.18,.025]}/><meshStandardMaterial color={i%2?'#f0e9d6':'#d5fd51'} emissive={i%2?'#000':'#3a4d0c'} emissiveIntensity={.3}/></mesh>)}
  </group>
}
function Bracelet(){
  return <group>
    {[-1,1].map(side=><group key={side} position={[0,side*2.05,-.12]}>
      {Array.from({length:6}).map((_,i)=><mesh key={i} position={[0,(i-2.5)*side*.27,0]}><boxGeometry args={[1.9,.2,.26]}/><meshStandardMaterial color={i%2?'#9e9c93':'#e0dac7'} metalness={1} roughness={.2}/></mesh>)}
    </group>)}
  </group>
}
function Dial(){
  const second = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  useFrame(({clock})=>{ if(second.current) second.current.rotation.z=-clock.elapsedTime*1.8; if(minute.current) minute.current.rotation.z=-clock.elapsedTime*.22; });
  return <group>
    <mesh><cylinderGeometry args={[1.28,1.28,.12,160]}/><meshStandardMaterial color="#070807" metalness={.5} roughness={.32}/></mesh>
    <mesh position={[0,0,.08]}><circleGeometry args={[1.21,160]}/><meshStandardMaterial color="#11130f" roughness={.45}/></mesh>
    {Array.from({length:12}).map((_,i)=><mesh key={i} position={[Math.sin(i/12*Math.PI*2)*.98,Math.cos(i/12*Math.PI*2)*.98,.13]} rotation={[0,0,-i/12*Math.PI*2]}><boxGeometry args={[.06,.24,.035]}/><meshStandardMaterial color="#f4f1e8" emissive="#18160d"/></mesh>)}
    <group ref={minute} position={[0,0,.18]}><mesh position={[0,.3,0]}><boxGeometry args={[.075,.75,.04]}/><meshStandardMaterial color="#f4f1e8"/></mesh></group>
    <group position={[0,0,.19]} rotation={[0,0,-.9]}><mesh position={[0,.24,0]}><boxGeometry args={[.095,.55,.05]}/><meshStandardMaterial color="#b8b09e" metalness={.8} roughness={.25}/></mesh></group>
    <group ref={second} position={[0,0,.22]}><mesh position={[0,.45,0]}><boxGeometry args={[.025,.92,.025]}/><meshStandardMaterial color="#d5fd51" emissive="#d5fd51" emissiveIntensity={1}/></mesh></group>
    <mesh position={[0,0,.25]}><sphereGeometry args={[.08,32,32]}/><meshStandardMaterial color="#d5fd51" emissive="#d5fd51" emissiveIntensity={.45}/></mesh>
  </group>
}
function WatchObject({progress=0}:{progress?:number}){
  const g = useRef<THREE.Group>(null);
  useFrame(({clock})=>{
    if(!g.current) return;
    g.current.rotation.y = -0.7 + progress*1.2 + Math.sin(clock.elapsedTime*.45)*.05;
    g.current.rotation.x = .25 - progress*.18;
    g.current.position.y = -0.34 + progress*.25 + Math.sin(clock.elapsedTime*.8)*.025;
    g.current.scale.setScalar(1.05 + progress*.23);
  });
  return <Float speed={1.6} floatIntensity={.22} rotationIntensity={.08}><group ref={g} rotation={[.2,-.5,0]}>
    <Bracelet/><Bezel/><Dial/>
  </group></Float>;
}
export function WatchCanvas({progress=0}:{progress?:number}){
  return <Canvas camera={{position:[0,0,6.2],fov:38}} gl={{antialias:true,alpha:true}} dpr={[1,2]}>
    <ambientLight intensity={.35}/><spotLight position={[3,5,5]} intensity={7} angle={.35} penumbra={1}/><pointLight position={[-3,-1,4]} intensity={2.2} color="#d5fd51"/>
    <WatchObject progress={progress}/>
    <ContactShadows position={[0,-2.2,0]} opacity={.42} scale={7} blur={2.5}/>
    <Environment preset="city"/>
  </Canvas>;
}
