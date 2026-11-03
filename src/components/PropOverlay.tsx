import { useTownStore } from "../store";
import BookViewer from "./BookViewer";
import PCViewer from "./pc/PCViewer";

export default function PropOverlay() {
  const active = useTownStore((s) => s.activeProp);
  if (!active) return null;
  const key = `${active.kind}-${active.section}-${active.index}`;
  return active.kind === "book" ? (
    <BookViewer key={key} section={active.section} index={active.index} />
  ) : (
    <PCViewer key={key} section={active.section} index={active.index} />
  );
}
