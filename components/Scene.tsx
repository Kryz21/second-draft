"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Line, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MODEL_PATH = "/models/titan-drone.glb";

// Named nodes inside the .glb we drive directly by name. These come from
// the original Sketchfab rig's node names (checked against the file with
// a glTF node dump) — if the model is ever re-exported from Blender with
// different node names, these strings need to be updated to match.
const NODE = {
  leftWing: "front_l_2_11",
  rightWing: "front_r_3_12",
  cockpit: "drone_body_7_13",
  rotorLeft: "rotor left_2",
  rotorRight: "rotor right_4",
  gunLeft: "gun left_0",
  gunRight: "gun right_3",
} as const;

type PointerState = { x: number; y: number };
type DragState = { active: boolean; lastX: number; lastY: number; targetX: number; targetY: number };

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
  const { scene } = useGLTF(MODEL_PATH);

  const root = useRef<THREE.Group>(null);
  const userTilt = useRef<THREE.Group>(null);
  const repairArmA = useRef<THREE.Group>(null);
  const repairArmB = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const repairGlow = useRef<THREE.PointLight>(null);
  const engineLightL = useRef<THREE.PointLight>(null);
  const engineLightR = useRef<THREE.PointLight>(null);

  // Populated on mount by looking up named nodes inside the loaded model.
  // Plain THREE.Object3D refs (not React refs) — gsap and useFrame can
  // mutate .position / .rotation on these exactly like a React-managed ref.
  const leftWing = useRef<THREE.Object3D | null>(null);
  const rightWing = useRef<THREE.Object3D | null>(null);
  const cockpit = useRef<THREE.Object3D | null>(null);
  const rotorLeft = useRef<THREE.Object3D | null>(null);
  const rotorRight = useRef<THREE.Object3D | null>(null);
  const gunLeft = useRef<THREE.Object3D | null>(null);
  const gunRight = useRef<THREE.Object3D | null>(null);

  const smoothDrag = useRef({ x: 0, y: 0 });
  const tmpVec = useRef(new THREE.Vector3());

  // Look up the named parts inside the model once it's loaded.
  useEffect(() => {
    leftWing.current = scene.getObjectByName(NODE.leftWing) ?? null;
    rightWing.current = scene.getObjectByName(NODE.rightWing) ?? null;
    cockpit.current = scene.getObjectByName(NODE.cockpit) ?? null;
    rotorLeft.current = scene.getObjectByName(NODE.rotorLeft) ?? null;
    rotorRight.current = scene.getObjectByName(NODE.rotorRight) ?? null;
    gunLeft.current = scene.getObjectByName(NODE.gunLeft) ?? null;
    gunRight.current = scene.getObjectByName(NODE.gunRight) ?? null;

    if (process.env.NODE_ENV !== "production") {
      (Object.keys(NODE) as (keyof typeof NODE)[]).forEach((key) => {
        if (!scene.getObjectByName(NODE[key])) {
          console.warn(`[Scene] Could not find node "${NODE[key]}" (${key}) in ${MODEL_PATH}.`);
        }
      });
    }
  }, [scene]);

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
  }, [progress, scene]);

  useFrame((state, delta) => {
    if (!root.current) return;
    const p = progress.current;
    const repair = p > .45;

    root.current.position.y += Math.sin(state.clock.elapsedTime * .8) * .0007;
    if (ring.current) ring.current.rotation.z += .008 + p * .02 + (hovering.current ? .01 : 0);
    const glowPulse = 5 + p * 55 + Math.sin(state.clock.elapsedTime * 8) * 2 + pulse.current * 40;
    if (repairGlow.current) repairGlow.current.intensity = glowPulse;

    // rotors spin faster once we're past the "repair" point in the story,
    // and pick up extra speed while the visitor is hovering the model
    const rotorSpeed = (repair ? 1.8 : .18) + (hovering.current ? .5 : 0);
    if (rotorLeft.current) rotorLeft.current.rotation.z += delta * rotorSpeed;
    if (rotorRight.current) rotorRight.current.rotation.z -= delta * rotorSpeed;

    // stand-in "engine glow" lights tracking the gun mounts, same pulse
    // behaviour the old procedural EnginePod glow rings had
    const engineIntensity = (repair ? 5 : 1.2) + pulse.current * 6;
    if (gunLeft.current && engineLightL.current) {
      gunLeft.current.getWorldPosition(tmpVec.current);
      engineLightL.current.position.copy(tmpVec.current);
      engineLightL.current.intensity = engineIntensity * 3;
    }
    if (gunRight.current && engineLightR.current) {
      gunRight.current.getWorldPosition(tmpVec.current);
      engineLightR.current.position.copy(tmpVec.current);
      engineLightR.current.intensity = engineIntensity * 3;
    }

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
        {/* scale/offset tuned to the model's own bounding box so it sits
            centered where the old procedural fuselage used to sit */}
        <primitive object={scene} scale={.42} position={[0, -.29, .56]} />
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
      <pointLight ref={engineLightL} color="#ff3b35" intensity={4} distance={2.2} />
      <pointLight ref={engineLightR} color="#ff3b35" intensity={4} distance={2.2} />
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
        <Suspense fallback={null}>
          <FailedAircraft progress={progress} drag={drag} hovering={hovering} pulse={pulse} />
        </Suspense>
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

useGLTF.preload(MODEL_PATH);
