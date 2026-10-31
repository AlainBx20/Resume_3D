import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import Scene from "./components/Scene";
import HUD from "./components/HUD";
import SectionPanel from "./components/SectionPanel";
import "./App.css";

function LoadingStatus() {
  const { active, progress, errors } = useProgress();
  if (!active && errors.length === 0) return null;
  return (
    <div className="loading-status" role="status" aria-live="polite">
      {errors.length > 0 ? "Some 3D details could not load" : `Preparing town ${Math.round(progress)}%`}
    </div>
  );
}

function App() {
  return (
    <div className="app-root">
      <Canvas
        shadows="percentage"
        dpr={[1, 1.5]}
        camera={{ fov: 68, near: 0.1, far: 420 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onCreated={({ gl }) => {
          if (import.meta.env.DEV) {
            (window as unknown as { __renderer: THREE.WebGLRenderer }).__renderer = gl;
          }
        }}
        fallback={
          <div className="webgl-fallback">
            <h1>3D view unavailable</h1>
            <p>Your browser could not start WebGL. The résumé chapters remain available from the menu.</p>
          </div>
        }
      >
        <Suspense fallback={null}>
          <Scene />
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.35} luminanceThreshold={0.72} luminanceSmoothing={0.3} mipmapBlur />
            <Vignette eskil={false} offset={0.18} darkness={0.48} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <LoadingStatus />
      <HUD />
      <SectionPanel />
    </div>
  );
}

export default App;
