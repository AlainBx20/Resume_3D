import { Suspense } from "react";
import { Canvas, extend } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three/webgpu";
import Scene from "./components/Scene";
import HUD from "./components/HUD";
import SectionPanel from "./components/SectionPanel";
import "./App.css";

// Merge the three/webgpu namespace (node materials + WebGPU classes) into the
// R3F element catalogue, which otherwise only knows the plain three namespace.
extend(THREE as unknown as Parameters<typeof extend>[0]);

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
        gl={async (props) => {
          // WebGPURenderer falls back to a WebGL2 backend on its own when
          // WebGPU is unavailable, so one code path covers both.
          const renderer = new THREE.WebGPURenderer({
            ...(props as ConstructorParameters<typeof THREE.WebGPURenderer>[0]),
            antialias: true,
            powerPreference: "high-performance",
          });
          await renderer.init();
          renderer.toneMappingExposure = 1.05;
          // R3F's gl-factory return type still names WebGLRenderer; WebGPURenderer
          // is accepted at runtime in fiber 9.8.
          return renderer as unknown as import("three").WebGLRenderer;
        }}
        onCreated={({ gl }) => {
          if (import.meta.env.DEV) {
            (window as unknown as { __renderer: THREE.WebGPURenderer }).__renderer =
              gl as unknown as THREE.WebGPURenderer;
          }
        }}
        fallback={
          <div className="webgl-fallback">
            <h1>3D view unavailable</h1>
            <p>Your browser could not start WebGPU or WebGL. The résumé chapters remain available from the menu.</p>
          </div>
        }
      >
        <Suspense fallback={null}>
          <Scene />
          {/* Post-processing (bloom + vignette) is reintroduced in Phase 4 as a
              TSL PostProcessing node pipeline once the renderer is WebGPU. */}
        </Suspense>
      </Canvas>
      <LoadingStatus />
      <HUD />
      <SectionPanel />
    </div>
  );
}

export default App;
