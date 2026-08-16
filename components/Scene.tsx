"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Line, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type PointerState = { x: number; y: number };
type DragState = { active: boolean; lastX: number; lastY: number; targetX: number; targetY: number };

function EnginePod({ side, repair, pulse }: { side: 1 | -1; repair: boolean; pulse: React.MutableRefObject<number> }) {
  const g = useRef<THREE.Group>(null);
  const glowMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (!g.current) return;
    g.current.rotation.z += .004 * side;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.4 + side) * .018;
    g.current.scale.set(s, s, s);
    if (glowMat.current) glowMat.current.emissiveIntensity = (repair ? 5 : 1.2) + pulse.current * 6;
  });
  return (
    <group ref={g} position={[side * 1.55, -.1, -.15]} rotation={[0, side * .08, side * .08]}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[.48, .58, 1.2, 32]} />
        <meshStandardMaterial color="#292724" metalness={.95} roughness={.28} />
      </mesh>
      <mesh position={[side * .62, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[.38, .055, 12, 36]} />
        <meshStandardMaterial color="#8b8477" metalness={.9} roughness={.24} emissive={repair ? "#4d120f" : "#000000"} emissiveIntensity={repair ? 1.5 : 0} />
      </mesh>
      <mesh position={[side * .69, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[.26, .26, .08, 32]} />
        <meshStandardMaterial ref={glowMat} color="#ff3b35" emissive="#ff160f" emissiveIntensity={1.2} metalness={.2} roughness={.2} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[side * .71, 0, 0]} rotation={[0, Math.PI / 2, i * Math.PI / 3]}>
          <boxGeometry args={[.035, .68, .09]} />
          <meshStandardMaterial color="#171614" metalness={.9} roughness={.3} />
        </mesh>
      ))}
    </group>
  );
}

function Rotor({ repair, hovering }: { repair: boolean; hovering: React.MutableRefObject<boolean> }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!g.current) return;
    const speed = (repair ? 1.8 : .18) + (hovering.current ? .5 : 0);
    g.current.rotation.z += delta * speed;
  });
  return (
    <group ref={g} position={[0, -.03, 1.05]}>
      <mesh>
        <cylinderGeometry args={[.19, .19, .18, 24]} />
        <meshStandardMaterial color="#777066" metalness={.9} roughness={.3} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, 0, i * Math.PI / 2]} position={[0, .01, .03]}>
          <boxGeometry args={[1.15, .055, .08]} />
          <meshStandardMaterial color={i === 2 ? "#a13a35" : "#48443e"} metalness={.82} roughness={.35} />
        </mesh>
      ))}
    </group>
  );
}

function FailedAircraft({
  progress,
  drag,
  hovering,
  pulse,
}: {
  progress: React.MutableRefObject<number>;
  drag: React.MutableRefObject<DragState>;
  hovering: React.MutableRefObject<boolean>;
  pulse: React.MutableRefObject<number>;
}) {
  const root = useRef<THREE.Group>(null);
  const userTilt = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);
  const cockpit = useRef<THREE.Group>(null);
  const repairArmA = useRef<THREE.Group>(null);
  const repairArmB = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const repairGlow = useRef<THREE.PointLight>(null);
  const cockpitMat = useRef<THREE.MeshStandardMaterial>(null);
  const smoothDrag = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!root.current || !leftWing.current || !rightWing.current || !cockpit.current || !repairArmA.current || !repairArmB.current || !ring.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#invention-story",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.1,
          onUpdate: (self) => { progress.current = self.progress; },
        },
      });
      tl.to(root.current!.position, { x: -.4, y: .1, z: 0, ease: "none" }, 0)
        .to(root.current!.rotation, { x: .08, y: -.3, z: .1, ease: "none" }, 0)
        .to(leftWing.current!.rotation, { z: -.12, y: .08, ease: "none" }, .18)
        .to(rightWing.current!.rotation, { z: .04, y: -.06, ease: "none" }, .18)
        .to(cockpit.current!.position, { y: .22, z: .12, ease: "none" }, .25)
        .to(repairArmA.current!.position, { x: -1.25, y: .45, z: 1.15, ease: "none" }, .34)
        .to(repairArmB.current!.position, { x: 1.18, y: .18, z: .95, ease: "none" }, .43)
        .to(ring.current!.rotation, { z: Math.PI * 2, x: .55, ease: "none" }, .42)
        .to(root.current!.rotation, { x: -.18, y: 2.4, z: -.12, ease: "none" }, .52)
        .to(root.current!.position, { x: .35, y: -.15, z: .1, ease: "none" }, .52)
        .to(leftWing.current!.rotation, { z: 0, y: 0, ease: "none" }, .67)
        .to(rightWing.current!.rotation, { z: 0, y: 0, ease: "none" }, .67)
        .to(repairArmA.current!.position, { x: -2.8, y: 2.2, z: -.5, ease: "none" }, .68)
        .to(repairArmB.current!.position, { x: 2.7, y: 1.9, z: -.7, ease: "none" }, .68)
        .to(root.current!.rotation, { x: .05, y: 5.9, z: .02, ease: "none" }, .78)
        .to(root.current!.position, { x: 0, y: .3, z: 0, ease: "none" }, .78)
        .to(repairArmA.current!.position, { x: -3.4, y: 3.4, z: -1, ease: "none" }, .9)
        .to(repairArmB.current!.position, { x: 3.4, y: 3.1, z: -1, ease: "none" }, .9);
    });
    return () => ctx.revert();
  }, [progress]);

  useFrame((state) => {
    if (!root.current) return;
    const p = progress.current;
    root.current.position.y += Math.sin(state.clock.elapsedTime * .8) * .0007;
    if (ring.current) ring.current.rotation.z += .008 + p * .02 + (hovering.current ? .01 : 0);
    const glowPulse = 5 + p * 55 + Math.sin(state.clock.elapsedTime * 8) * 2 + pulse.current * 40;
    if (repairGlow.current) repairGlow.current.intensity = glowPulse;
    if (cockpitMat.current) cockpitMat.current.opacity = .88;

    // ease the user-drag rotation offset toward its target, and let it
    // relax back to center whenever the visitor isn't actively dragging
    const d = drag.current;
    if (!d.active) { d.targetX *= .93; d.targetY *= .93; }
    smoothDrag.current.x += (d.targetX - smoothDrag.current.x) * .12;
    smoothDrag.current.y += (d.targetY - smoothDrag.current.y) * .12;
    if (userTilt.current) {
      userTilt.current.rotation.x = smoothDrag.current.x;
      userTilt.current.rotation.y = smoothDrag.current.y;
    }

    // decay the click "repair pulse"
    pulse.current *= .9;
  });

  return (
    <group ref={root} scale={1.02}>
      <group ref={userTilt}>
        {/* central fuselage */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[.48, 2.25, 8, 24]} />
          <meshStandardMaterial color="#35312c" metalness={.94} roughness={.29} />
        </mesh>
        <mesh position={[0, .16, .18]} scale={[.88, .62, .42]}>
          <sphereGeometry args={[1, 32, 20]} />
          <meshStandardMaterial color="#191817" metalness={.9} roughness={.22} />
        </mesh>
        {/* cockpit */}
        <group ref={cockpit} position={[.18, .47, .16]}>
          <mesh scale={[.72, .3, .55]}>
            <sphereGeometry args={[1, 32, 16]} />
            <meshStandardMaterial ref={cockpitMat} color="#152327" metalness={.62} roughness={.16} transparent opacity={.88} />
          </mesh>
          <mesh position={[0, -.18, .15]} scale={[.45, .05, .4]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff3b35" emissive="#ff160f" emissiveIntensity={2.6} />
          </mesh>
        </group>
        {/* broken wings */}
        <group ref={leftWing} position={[-.25, .02, 0]}>
          <mesh position={[-1.28, -.05, 0]} rotation={[0, .08, -.03]}>
            <boxGeometry args={[2.45, .12, .78]} />
            <meshStandardMaterial color="#4b4740" metalness={.9} roughness={.36} />
          </mesh>
          <mesh position={[-2.35, -.13, -.08]} rotation={[0, -.28, -.13]}>
            <boxGeometry args={[.75, .09, .5]} />
            <meshStandardMaterial color="#242220" metalness={.9} roughness={.4} />
          </mesh>
          <Line points={[[-.7, -.1, .42],[-1.7, -.2, .48],[-2.2, -.15, .3]]} color="#ff3934" lineWidth={1.3} />
        </group>
        <group ref={rightWing} position={[.25, .02, 0]}>
          <mesh position={[1.28, -.02, 0]} rotation={[0, -.06, .02]}>
            <boxGeometry args={[2.45, .12, .78]} />
            <meshStandardMaterial color="#504b43" metalness={.9} roughness={.35} />
          </mesh>
          <mesh position={[2.28, -.1, .02]} rotation={[0, .18, .1]}>
            <boxGeometry args={[.78, .1, .52]} />
            <meshStandardMaterial color="#252320" metalness={.9} roughness={.4} />
          </mesh>
        </group>
        <EnginePod side={-1} repair={progress.current > .45} pulse={pulse} />
        <EnginePod side={1} repair={progress.current > .45} pulse={pulse} />
        <Rotor repair={progress.current > .7} hovering={hovering} />
        {/* landing skids */}
        <Line points={[[-1.15,-.65,.25],[-.55,-.85,.2],[.55,-.85,.2],[1.15,-.65,.25]]} color="#777168" lineWidth={2} />
        {/* cables */}
        <Line points={[[-.2,-.45,.35],[-.65,-1.05,.6],[-1.2,-.8,.5]]} color="#b63c36" lineWidth={1.1} />
        <Line points={[[.35,-.45,.3],[.9,-.98,.5],[1.5,-.65,.4]]} color="#77736b" lineWidth={.9} />
      </group>
      {/* repair gantry stays outside the drag-tilt group so it always reads as external scaffolding */}
      <group ref={repairArmA} position={[-3.2, 2.9, -.7]}>
        <mesh><boxGeometry args={[.18, 2.8, .18]} /><meshStandardMaterial color="#5a554d" metalness={.9} roughness={.3} /></mesh>
        <mesh position={[.15,-1.25,.05]} rotation={[0,0,-.4]}><boxGeometry args={[1.3,.16,.16]} /><meshStandardMaterial color="#777168" metalness={.9} roughness={.3} /></mesh>
        <mesh position={[.65,-1.7,.05]}><sphereGeometry args={[.18,16,12]} /><meshStandardMaterial color="#ff3b35" emissive="#ff160f" emissiveIntensity={3} /></mesh>
      </group>
      <group ref={repairArmB} position={[3.2, 2.5, -.8]} rotation={[0,0,.4]}>
        <mesh><boxGeometry args={[.18, 2.4, .18]} /><meshStandardMaterial color="#56514a" metalness={.9} roughness={.3} /></mesh>
        <mesh position={[-.15,-1.05,0]} rotation={[0,0,.5]}><boxGeometry args={[1.25,.16,.16]} /><meshStandardMaterial color="#777168" metalness={.9} roughness={.3} /></mesh>
        <mesh position={[-.6,-1.45,0]}><sphereGeometry args={[.16,16,12]} /><meshStandardMaterial color="#ff3b35" emissive="#ff160f" emissiveIntensity={3} /></mesh>
      </group>
      <mesh ref={ring} position={[0, 0, .1]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.35, .018, 10, 96]} />
        <meshStandardMaterial color="#ff3b35" emissive="#ff1c17" emissiveIntensity={2.5} transparent opacity={.65} />
      </mesh>
      <pointLight ref={repairGlow} position={[0, 0, 1]} color="#ff322e" intensity={8} distance={5} />
    </group>
  );
}

function CameraRig({ progress, pointer }: { progress: React.MutableRefObject<number>; pointer: React.MutableRefObject<PointerState> }) {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  useFrame(() => {
    if (!camera.current) return;
    const p = progress.current;
    const angle = p * Math.PI * 2.15;
    const radius = 7.5 - p * 1.3;
    const target = new THREE.Vector3(pointer.current.x * .35, .05 + pointer.current.y * .18, 0);
    const desired = new THREE.Vector3(
      Math.sin(angle) * radius + pointer.current.x * .6,
      .65 + Math.sin(p * Math.PI * 2) * .9 + pointer.current.y * .35,
      Math.cos(angle) * radius
    );
    camera.current.position.lerp(desired, .045);
    camera.current.lookAt(target);
  });
  return <PerspectiveCamera ref={camera} makeDefault position={[5, 1, 7]} fov={34} />;
}

export default function Scene() {
  const progress = useRef(0);
  const pointer = useRef<PointerState>({ x: 0, y: 0 });
  const drag = useRef<DragState>({ active: false, lastX: 0, lastY: 0, targetX: 0, targetY: 0 });
  const hovering = useRef(false);
  const pulse = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cursorMode, setCursorMode] = useState<"idle" | "hover" | "grab">("idle");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const setPointerFromEvent = (clientX: number, clientY: number) => {
      pointer.current.x = (clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((clientY / window.innerHeight) * 2 - 1);
    };

    const onPointerMove = (e: PointerEvent) => {
      setPointerFromEvent(e.clientX, e.clientY);
      hovering.current = true;
      if (drag.current.active) {
        const dx = e.clientX - drag.current.lastX;
        const dy = e.clientY - drag.current.lastY;
        drag.current.lastX = e.clientX;
        drag.current.lastY = e.clientY;
        drag.current.targetY += dx * .006;
        drag.current.targetX = Math.max(-.5, Math.min(.5, drag.current.targetX + dy * .006));
        if (e.pointerType === "mouse") e.preventDefault();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      drag.current.active = true;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      setCursorMode("grab");
      if (e.pointerType === "mouse") e.preventDefault();
    };
    const endDrag = () => {
      drag.current.active = false;
      setCursorMode("hover");
    };
    const onPointerLeave = () => {
      hovering.current = false;
      drag.current.active = false;
      setCursorMode("idle");
    };
    const onPointerEnter = () => setCursorMode((m) => (m === "grab" ? m : "hover"));
    const onClick = () => { pulse.current = 1; };

    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerdown", onPointerDown, { passive: false });
    window.addEventListener("pointerup", endDrag);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("click", onClick);

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("pointerenter", onPointerEnter);
      el.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div
      className="webgl"
      ref={wrapRef}
      style={{
        touchAction: "pan-y",
        cursor: cursorMode === "grab" ? "grabbing" : cursorMode === "hover" ? "grab" : "default",
      }}
    >
      <Canvas dpr={[1, 1.6]} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <CameraRig progress={progress} pointer={pointer} />
        <color attach="background" args={["#070707"]} />
        <ambientLight intensity={.14} />
        <spotLight position={[-5, 7, 5]} intensity={105} angle={.38} penumbra={1} color="#ffe7cf" />
        <spotLight position={[5, 3, -3]} intensity={65} angle={.55} penumbra={1} color="#ff3430" />
        <pointLight position={[0, -2, 2]} intensity={18} distance={8} color="#ff413a" />
        <FailedAircraft progress={progress} drag={drag} hovering={hovering} pulse={pulse} />
        <Float speed={.6} rotationIntensity={.08} floatIntensity={.12}>
          <mesh position={[-3.6, 2.4, -2]}>
            <icosahedronGeometry args={[.12, 1]} />
            <meshStandardMaterial color="#ff3b35" emissive="#ff170f" emissiveIntensity={3} />
          </mesh>
        </Float>
        <Environment preset="warehouse" environmentIntensity={.38} />
      </Canvas>
      <div className="webgl-vignette" />
    </div>
  );
}
