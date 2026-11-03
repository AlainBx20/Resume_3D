import { useEffect, useState } from "react";
import { useTownStore } from "../../store";

interface Proc {
  name: string;
  base: number;
  cpu: number;
  mem: number;
  protectedProc?: boolean;
  dead: boolean;
}

const INITIAL: Proc[] = [
  { name: "huda-ai.exe", base: 34, cpu: 34, mem: 612, protectedProc: true, dead: false },
  { name: "spring-boot.jar", base: 22, cpu: 22, mem: 540, dead: false },
  { name: "oracle-db.exe", base: 18, cpu: 18, mem: 880, dead: false },
  { name: "pytorch-train.py", base: 41, cpu: 41, mem: 1260, dead: false },
  { name: "vite-dev-server", base: 9, cpu: 9, mem: 210, dead: false },
  { name: "coffee.exe", base: 5, cpu: 5, mem: 64, dead: false },
];

export default function Monitor() {
  const [procs, setProcs] = useState(INITIAL);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProcs((list) =>
        list.map((p) =>
          p.dead ? p : { ...p, cpu: Math.max(1, Math.min(98, p.base + (Math.random() - 0.5) * 18)), mem: Math.max(32, p.mem + (Math.random() - 0.5) * 12) },
        ),
      );
    }, 900);
    return () => window.clearInterval(id);
  }, []);

  const end = (name: string) => {
    const store = useTownStore.getState();
    const proc = procs.find((p) => p.name === name);
    if (!proc || proc.dead) return;
    if (proc.protectedProc) {
      store.showToast("⛔ Access denied — Huda AI is mission critical.");
      return;
    }
    setProcs((list) => list.map((p) => (p.name === name ? { ...p, dead: true, cpu: 0 } : p)));
    if (name === "coffee.exe") {
      store.showToast("☕ Coffee ended. Productivity -50%.");
      store.unlock("decaf");
    }
  };

  const total = procs.reduce((n, p) => n + p.cpu, 0) / procs.length;

  return (
    <div className="pc-monitor-app">
      <div className="pc-monitor-head">CPU <b>{total.toFixed(0)}%</b> · {procs.filter((p) => !p.dead).length} processes</div>
      <table>
        <thead><tr><th>Process</th><th>CPU</th><th>Memory</th><th /></tr></thead>
        <tbody>
          {procs.map((p) => (
            <tr key={p.name} className={p.dead ? "dead" : ""}>
              <td>{p.name}</td>
              <td><div className="pc-cpu"><i style={{ width: `${p.cpu}%` }} /></div></td>
              <td>{p.mem.toFixed(0)} MB</td>
              <td><button type="button" onClick={() => end(p.name)} disabled={p.dead}>End task</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
