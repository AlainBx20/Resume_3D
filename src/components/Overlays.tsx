import { useEffect } from "react";
import { useTownStore } from "../store";
import { DUCK_SCRIPTS } from "../ducks";

const VAULT_LINES = [
  "> decrypting vault.bin ... ok",
  "Hi. If you fixed this PC, you are the kind of person I want on my team.",
  "Alaa Ben Chouikha: Software Engineering student, Tunisia. Builds things end to end.",
  "Fun fact: this entire town is React Three Fiber on a WebGPU renderer.",
  "Fun fact: the mother duck has no formal complaints on file. Yet.",
  "Secret: the Konami code does something nice indoors.",
  "Secret: try the TV's Cosmos channel, then walk outside at your own risk.",
  "> Say hello: check the Contact house. I answer every message.",
];

export function IntroOverlay() {
  const active = useTownStore((s) => s.introActive);
  const black = useTownStore((s) => s.introBlack);
  return (
    <>
      <div className={`intro-bars top ${active ? "on" : ""}`} aria-hidden />
      <div className={`intro-bars bottom ${active ? "on" : ""}`} aria-hidden />
      <div className={`intro-black ${black ? "on" : ""}`} aria-hidden />
      {active && !black && <div className="intro-skip">Space to skip</div>}
    </>
  );
}

export function CosmosVignette() {
  const on = useTownStore((s) => s.cosmosSky && !s.insideId);
  return on ? <div className="cosmos-dread" aria-hidden /> : null;
}

export function DuckDialog() {
  const scene = useTownStore((s) => s.duckScene);
  if (!scene) return null;
  const script = DUCK_SCRIPTS[Math.min(scene.attempt, DUCK_SCRIPTS.length - 1)];
  return (
    <div className="duck-dialog" role="dialog" aria-live="polite">
      <div className="duck-name">Mother Duck</div>
      <p>{script[scene.line]}</p>
      <div className="duck-hint">
        <kbd>E</kbd> {scene.line + 1 >= script.length ? "walk away" : "continue"}
      </div>
    </div>
  );
}

export function VaultOverlay() {
  const open = useTownStore((s) => s.vaultOpen);
  const close = useTownStore((s) => s.closeVault);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyE") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;
  const done = () => {
    close();
    window.dispatchEvent(new Event("request-town-lock"));
  };
  return (
    <div className="vault-overlay" role="dialog" aria-label="The Vault">
      <div className="vault-screen">
        <h2>THE VAULT</h2>
        {VAULT_LINES.map((line, i) => (
          <p key={i} style={{ animationDelay: `${i * 0.35}s` }}>
            {line}
          </p>
        ))}
        <button type="button" onClick={done}>
          Close
        </button>
      </div>
    </div>
  );
}
