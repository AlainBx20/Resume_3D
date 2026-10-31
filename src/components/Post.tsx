import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { pass, screenUV, vec2, smoothstep } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

// Post-processing for WebGPURenderer: a TSL RenderPipeline replacing the old
// @react-three/postprocessing EffectComposer (bloom + vignette), which only
// runs under WebGLRenderer. bloom() returns just the glow, so it is added back
// to the scene color; the vignette multiplies the result before the pipeline's
// tone-map + sRGB output transform.
const BLOOM_STRENGTH = 0.7;
const BLOOM_RADIUS = 0.5;
const BLOOM_THRESHOLD = 0.72;
const VIGNETTE_DARKNESS = 0.48;

export default function Post() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const pipeline = useMemo(() => {
    const renderer = gl as unknown as THREE.WebGPURenderer;
    const renderPipeline = new THREE.RenderPipeline(renderer);

    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode("output");
    const bloomed = scenePassColor.add(
      bloom(scenePassColor, BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD)
    );

    // soft corner darkening (offset 0.4, reaching VIGNETTE_DARKNESS at the edge)
    const dist = screenUV.distance(vec2(0.5));
    const vignette = smoothstep(0.4, 0.75, dist).mul(VIGNETTE_DARKNESS);

    renderPipeline.outputNode = bloomed.mul(vignette.oneMinus());
    return renderPipeline;
  }, [gl, scene, camera]);

  // positive priority: the Canvas stops auto-rendering and we drive the pipeline
  useFrame(() => {
    pipeline.render();
  }, 1);

  return null;
}
