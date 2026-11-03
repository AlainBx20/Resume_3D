import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { atm } from "../atmosphere";
import { mulberry32 } from "../rand";
import { useTownStore } from "../store";
import { audio } from "../audio";

const MOON_DISTANCE = 120;
const MOON_RADIUS = 17;
const PLANET_DIR = new THREE.Vector3(0.22, 0.46, -0.86).normalize();
const PLANET_DISTANCE = 140;
const PLANET_RADIUS = 44;

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// smooth moon glow with faint, wide light shafts; alpha is zero well before the
// texture edge so no hard circle or spike ends are ever visible
function makeRaysTexture() {
  return canvasTexture(512, 512, (ctx) => {
    const size = 512;
    const img = ctx.createImageData(size, size);
    const rand = mulberry32(31);
    const waves = Array.from({ length: 7 }, () => ({
      f: 3 + Math.floor(rand() * 9),
      p: rand() * Math.PI * 2,
      a: 0.4 + rand() * 0.6,
    }));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - size / 2) / (size / 2);
        const dy = (y - size / 2) / (size / 2);
        const r = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        let shafts = 0;
        for (const w of waves) shafts += w.a * Math.sin(ang * w.f + w.p);
        shafts = Math.max(0, shafts / 3.5) ** 1.5;
        const edge = Math.max(0, 1 - r) ** 2;
        const glow = Math.exp(-r * 6) * 0.8 + Math.exp(-r * 2.4) * 0.3;
        const rays = shafts * Math.exp(-r * 2.8) * 0.4;
        const alpha = Math.min(1, (glow + rays) * edge * 1.6);
        const i = (y * size + x) * 4;
        img.data[i] = 215;
        img.data[i + 1] = 226;
        img.data[i + 2] = 255;
        img.data[i + 3] = Math.floor(alpha * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}
export function Moon() {
  const map = useTexture("/textures/moon.jpg");
  const groupRef = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshBasicMaterial>(null);
  const raysMat = useRef<THREE.MeshBasicMaterial>(null);
  const rays = useMemo(() => makeRaysTexture(), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
  }, [map]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group || !bodyMat.current || !raysMat.current) return;
    const up = Math.max(atm.moonDir.y, 0);
    group.visible = up > 0.01 && !useTownStore.getState().cosmosSky;
    if (!group.visible) return;
    group.position.copy(atm.moonDir).multiplyScalar(MOON_DISTANCE);
    group.lookAt(0, 0, 0);
    const fade = Math.min(up * 4, 1) * (1 - atm.overcast * 0.8);
    bodyMat.current.opacity = fade;
    raysMat.current.opacity = fade * (0.8 + Math.sin(state.clock.elapsedTime * 0.6) * 0.1) * (1 - atm.day * 0.7);
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh rotation={[0.25, 2.2, 0]}>
        <sphereGeometry args={[MOON_RADIUS, 64, 48]} />
        <meshBasicMaterial ref={bodyMat} map={map} color="#e8eaf2" transparent toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[MOON_RADIUS * 7, MOON_RADIUS * 7]} />
        <meshBasicMaterial
          ref={raysMat}
          map={rays}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}

function makePlanetTexture() {
  return canvasTexture(1024, 512, (ctx) => {
    const rand = mulberry32(77);
    const palette = ["#f4c92f", "#d99a1c", "#ffe27a", "#b8731a", "#e8b02a", "#8a4d14"];
    for (let y = 0; y < 512; y++) {
      const v = y / 512;
      const n = Math.sin(v * 38) * 0.5 + Math.sin(v * 91 + 2) * 0.3 + Math.sin(v * 17) * 0.4;
      const idx = Math.min(palette.length - 1, Math.floor(((n + 1.2) / 2.4) * palette.length));
      ctx.fillStyle = palette[Math.max(0, idx)];
      ctx.fillRect(0, y, 1024, 1);
    }
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(${rand() < 0.5 ? "255,230,140" : "110,55,10"},${0.05 + rand() * 0.09})`;
      ctx.beginPath();
      ctx.ellipse(rand() * 1024, rand() * 512, 40 + rand() * 120, 2 + rand() * 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // a brooding storm eye
    const eye = ctx.createRadialGradient(700, 300, 4, 700, 300, 70);
    eye.addColorStop(0, "rgba(120,20,10,0.95)");
    eye.addColorStop(1, "rgba(120,20,10,0)");
    ctx.fillStyle = eye;
    ctx.fillRect(600, 220, 200, 160);
  });
}

function makeRingTexture() {
  return canvasTexture(512, 4, (ctx) => {
    const rand = mulberry32(5);
    ctx.clearRect(0, 0, 512, 4);
    for (let x = 0; x < 512; x++) {
      const gap = x > 330 && x < 352;
      const a = gap ? 0.04 : 0.35 + rand() * 0.55;
      const shade = 150 + Math.floor(rand() * 90);
      ctx.fillStyle = `rgba(${shade},${Math.floor(shade * 0.8)},${Math.floor(shade * 0.4)},${a})`;
      ctx.fillRect(x, 0, 1, 4);
    }
  });
}

function makeGlowTexture() {
  return canvasTexture(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    g.addColorStop(0, "rgba(255,170,40,0.5)");
    g.addColorStop(0.5, "rgba(190,60,10,0.2)");
    g.addColorStop(1, "rgba(120,20,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
}

export function CosmosPlanet() {
  const active = useTownStore((s) => s.cosmosSky && !s.insideId);
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const planetTex = useMemo(() => makePlanetTexture(), []);
  const ringTex = useMemo(() => makeRingTexture(), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);

  const ringGeo = useMemo(() => {
    const inner = PLANET_RADIUS * 1.35;
    const outer = PLANET_RADIUS * 2.45;
    const geo = new THREE.RingGeometry(inner, outer, 128, 1);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    return geo;
  }, []);

  useEffect(() => {
    if (active) audio.dread();
  }, [active]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    group.visible = active;
    if (!active) return;
    group.position.copy(PLANET_DIR).multiplyScalar(PLANET_DISTANCE);
    group.lookAt(0, 0, 0);
    const t = state.clock.elapsedTime;
    if (planetRef.current) planetRef.current.rotation.y = t * 0.012;
    if (glowMat.current) glowMat.current.opacity = 0.75 + Math.sin(t * 0.7) * 0.2;
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 48]} />
        <meshStandardMaterial
          map={planetTex}
          emissiveMap={planetTex}
          emissive="#ffffff"
          emissiveIntensity={0.75}
          roughness={1}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2 - 0.45, 0.08, 0.28]} geometry={ringGeo}>
        <meshBasicMaterial map={ringTex} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[0, 0, -6]}>
        <planeGeometry args={[PLANET_RADIUS * 7, PLANET_RADIUS * 7]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glowTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}
