import { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { GROUND_RADIUS } from "./Ground";

// overlaps slightly under the grass disc (which is GROUND_RADIUS wide) so
// the terrain is continuous with no exposed gap, while the inner ring's
// height is ~0 here (see `rise` below) so there's no visible seam either.
// The player's roam limit (TOWN_RADIUS = 34 in Player.tsx) is well inside
// this, so the base is never reachable.
const INNER_RADIUS = GROUND_RADIUS - 3;
const OUTER_RADIUS = GROUND_RADIUS + 130;
const ANGULAR_SEGMENTS = 160;
const RADIAL_SEGMENTS = 24;
const PEAK_HEIGHT = 38;

// cheap "sum of sines" pseudo-noise, broad low frequencies only so the
// silhouette reads as rolling ridgelines instead of spiky individual cones
function ridgeHeight(angle: number, t: number) {
  const angular =
    Math.sin(angle * 3.1 + 1.3) * 0.55 +
    Math.sin(angle * 5.7 + 4.1) * 0.35 +
    Math.sin(angle * 11.3 + 2.7) * 0.15;
  const radialJag = Math.sin(angle * 9 + t * 13) * 0.08;
  const rise = THREE.MathUtils.smoothstep(t, 0, 0.08) * (1 - 0.3 * THREE.MathUtils.smoothstep(t, 0.6, 1));
  const shaped = 0.55 + angular + radialJag;
  return Math.max(shaped, 0.1) * rise * PEAK_HEIGHT;
}

export default function Mountains() {
  const colorTex = useLoader(THREE.TextureLoader, "/textures/rock-color.jpg");
  const normalTex = useLoader(THREE.TextureLoader, "/textures/rock-normal.jpg");
  const roughnessTex = useLoader(THREE.TextureLoader, "/textures/rock-roughness.jpg");

  const { geometry, maps } = useMemo(() => {
    // clones keep the loader's cached textures pristine for other users
    const maps = {
      color: colorTex.clone(),
      normal: normalTex.clone(),
      roughness: roughnessTex.clone(),
    };
    Object.values(maps).forEach((tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    });
    maps.color.colorSpace = THREE.SRGBColorSpace;

    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const snow = new THREE.Color("#f3f5fb");
    const rock = new THREE.Color("#ffffff");

    for (let r = 0; r <= RADIAL_SEGMENTS; r++) {
      const t = r / RADIAL_SEGMENTS;
      const radius = THREE.MathUtils.lerp(INNER_RADIUS, OUTER_RADIUS, t);

      for (let a = 0; a <= ANGULAR_SEGMENTS; a++) {
        const angle = (a / ANGULAR_SEGMENTS) * Math.PI * 2;
        const height = ridgeHeight(angle, t);
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        positions.push(x, height, z);
        uvs.push((a / ANGULAR_SEGMENTS) * 40, t * 10);

        const snowAmount = THREE.MathUtils.smoothstep(height, PEAK_HEIGHT * 0.3, PEAK_HEIGHT * 0.6);
        const vertexColor = rock.clone().lerp(snow, snowAmount);
        colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
      }
    }

    const rowLength = ANGULAR_SEGMENTS + 1;
    for (let r = 0; r < RADIAL_SEGMENTS; r++) {
      for (let a = 0; a < ANGULAR_SEGMENTS; a++) {
        const i0 = r * rowLength + a;
        const i1 = i0 + 1;
        const i2 = i0 + rowLength;
        const i3 = i2 + 1;
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return { geometry: geom, maps };
  }, [colorTex, normalTex, roughnessTex]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        map={maps.color}
        normalMap={maps.normal}
        normalScale={new THREE.Vector2(0.25, 0.25)}
        roughnessMap={maps.roughness}
        roughness={1}
        color="#93a1c9"
        vertexColors
        envMapIntensity={0.15}
        fog
      />
    </mesh>
  );
}
