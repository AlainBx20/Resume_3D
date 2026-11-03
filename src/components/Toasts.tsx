import { useEffect } from "react";
import { useTownStore } from "../store";

export default function Toasts() {
  const toast = useTownStore((s) => s.toast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      if (useTownStore.getState().toast?.key === toast.key) useTownStore.setState({ toast: null });
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  return (
    <div key={toast.key} className={`game-toast toast-${toast.kind}`} role="status" aria-live="polite">
      {toast.kind === "achievement" && <span>🏆 Achievement unlocked</span>}
      {toast.text}
    </div>
  );
}
