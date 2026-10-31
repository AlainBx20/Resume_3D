globalThis.self = globalThis;
import { readFileSync, readdirSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Vector3 } from "three";
const dir = process.argv[2];
const loader = new GLTFLoader();
for (const f of readdirSync(dir).filter((x) => x.endsWith(".glb")).sort()) {
  const buf = readFileSync(`${dir}/${f}`);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  await new Promise((res) => {
    loader.parse(ab, "", (gltf) => {
      const box = new Box3().setFromObject(gltf.scene);
      const s = new Vector3(); box.getSize(s);
      console.log(`${f.padEnd(18)} W=${s.x.toFixed(2)} H=${s.y.toFixed(2)} D=${s.z.toFixed(2)}  minY=${box.min.y.toFixed(2)}`);
      res();
    }, (e) => { console.log(`${f}: err ${String(e).slice(0,50)}`); res(); });
  });
}
