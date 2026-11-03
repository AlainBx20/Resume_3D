import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { audio } from "../../audio";
import { buildings, PLAYER_NAME, type SectionId } from "../../content";
import { useTownStore } from "../../store";
import SectionContent from "../SectionContent";
import MailApp from "./MailApp";
import Memory from "./Memory";
import Snake from "./Snake";
import Terminal from "./Terminal";
import { APPS, APP_ORDER, WALLPAPERS, type AppId } from "./apps";
import BrowserApp from "./BrowserApp";
import Calculator from "./Calculator";
import FilesApp from "./FilesApp";
import MusicApp from "./MusicApp";
import NotesApp from "./NotesApp";
import Paint from "./Paint";
import ProfileApp from "./ProfileApp";
import Settings from "./Settings";
import TicTacToe from "./TicTacToe";
import Monitor from "./Monitor";
import Trophies from "./Trophies";
import Typing from "./Typing";

type Phase = "powering" | "boot" | "desktop" | "shutdown";
const WALL_KEY = "resume-town-wallpaper";

function readWall() {
  try {
    const n = Number(localStorage.getItem(WALL_KEY));
    return n >= 0 && n < WALLPAPERS.length ? n : 0;
  } catch {
    return 0;
  }
}

interface WinState {
  app: AppId;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  closing: boolean;
}

const BIOS = [
  "ResumeBIOS v1.0  (c) Alaa Systems",
  "CPU: Imagination Core x8 ........ OK",
  "Memory test: 16384 MB ........... OK",
  "Detecting drives ................ OK",
  "Loading ResumeOS ...",
];

function clock() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function PCViewer({ section, index }: { section: SectionId; index: number }) {
  const closeProp = useTownStore((s) => s.closeProp);
  const def = buildings.find((b) => b.id === section)!;
  const [phase, setPhase] = useState<Phase>("powering");
  const [biosLines, setBiosLines] = useState(0);
  const [wins, setWins] = useState<WinState[]>([]);
  const [time, setTime] = useState(clock);
  const zCounter = useRef(10);
  const timers = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("powering");
  const winsRef = useRef<WinState[]>([]);
  const screenRef = useRef<HTMLDivElement>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState(readWall);
  const [scanlines, setScanlines] = useState(false);

  const chooseWallpaper = (i: number) => {
    setWallpaper(i);
    try {
      localStorage.setItem(WALL_KEY, String(i));
    } catch {
      // wallpaper just won't persist
    }
    useTownStore.getState().unlock("customizer");
  };

  useEffect(() => {
    winsRef.current = wins;
    if (wins.filter((w) => !w.closing).length >= 4) useTownStore.getState().unlock("multitasker");
  }, [wins]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const openApp = useCallback((app: AppId) => {
    audio.uiOpen();
    setStartOpen(false);
    if (app === "browser") useTownStore.getState().unlock("networker");
    if (app === "profile") useTownStore.getState().unlock("know-me");
    setWins((current) => {
      zCounter.current += 1;
      const existing = current.find((w) => w.app === app && !w.closing);
      if (existing) {
        return current.map((w) => (w === existing ? { ...w, minimized: false, z: zCounter.current } : w));
      }
      const n = current.length;
      const baseX = window.innerWidth > 900 ? 150 : 20;
      return [
        ...current,
        { app, x: baseX + n * 28, y: 20 + n * 24, z: zCounter.current, minimized: false, maximized: false, closing: false },
      ];
    });
  }, []);

  useEffect(() => {
    audio.uiOpen();
    later(() => {
      go("boot");
      audio.bootChime();
      BIOS.forEach((_, i) => later(() => setBiosLines(i + 1), 250 + i * 330));
      later(() => {
        go("desktop");
        openApp(section === "contact" ? "mail" : "doc");
      }, 250 + BIOS.length * 330 + 900);
    }, 650);
    const clockTimer = window.setInterval(() => setTime(clock()), 15000);
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      window.clearInterval(clockTimer);
    };
  }, [later, go, openApp, section]);

  const closeWin = useCallback((app: AppId) => {
    audio.uiClose();
    setWins((current) => current.map((w) => (w.app === app ? { ...w, closing: true } : w)));
    later(() => setWins((current) => current.filter((w) => w.app !== app)), 220);
  }, [later]);

  const shutdown = useCallback(() => {
    if (phaseRef.current === "shutdown") return;
    go("shutdown");
    audio.powerOff();
    later(closeProp, 900);
  }, [closeProp, go, later]);

  const toggleMax = (app: AppId) =>
    setWins((current) => current.map((w) => (w.app === app ? { ...w, maximized: !w.maximized } : w)));

  const focusWin = (app: AppId) => {
    zCounter.current += 1;
    setWins((current) => current.map((w) => (w.app === app ? { ...w, z: zCounter.current } : w)));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Escape") return;
      if (phaseRef.current !== "desktop") {
        shutdown();
        return;
      }
      const top = [...winsRef.current].filter((w) => !w.minimized && !w.closing).sort((a, b) => b.z - a.z)[0];
      if (top) closeWin(top.app);
      else shutdown();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeWin, shutdown]);

  const startDrag = (event: React.PointerEvent, app: AppId) => {
    if ((event.target as HTMLElement).closest("button")) return;
    focusWin(app);
    const start = wins.find((w) => w.app === app);
    const bounds = screenRef.current?.getBoundingClientRect();
    if (!start || !bounds) return;
    const originX = event.clientX - start.x;
    const originY = event.clientY - start.y;
    const move = (e: PointerEvent) => {
      const x = Math.max(0, Math.min(bounds.width - 120, e.clientX - originX));
      const y = Math.max(0, Math.min(bounds.height - 80, e.clientY - originY));
      setWins((current) => current.map((w) => (w.app === app ? { ...w, x, y } : w)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const topApp = useMemo(
    () => [...wins].filter((w) => !w.minimized && !w.closing).sort((a, b) => b.z - a.z)[0]?.app,
    [wins],
  );

  const renderApp = (app: AppId) => {
    switch (app) {
      case "doc":
        return <DocApp section={section} index={index} />;
      case "terminal":
        return <Terminal openApp={openApp} />;
      case "snake":
        return <Snake active={topApp === "snake"} />;
      case "memory":
        return <Memory />;
      case "mail":
        return <MailApp />;
      case "profile":
        return <ProfileApp />;
      case "browser":
        return <BrowserApp />;
      case "files":
        return <FilesApp />;
      case "notes":
        return <NotesApp />;
      case "music":
        return <MusicApp />;
      case "calc":
        return <Calculator />;
      case "paint":
        return <Paint />;
      case "tictactoe":
        return <TicTacToe />;
      case "typing":
        return <Typing />;
      case "trophies":
        return <Trophies />;
      case "monitor":
        return <Monitor />;
      case "settings":
        return <Settings wallpaper={wallpaper} scanlines={scanlines} onWallpaper={chooseWallpaper} onScanlines={setScanlines} />;
    }
  };

  const desktopApps: AppId[] = ["doc", "profile", "browser", "files", "terminal", "mail", "trophies", "settings"];

  return (
    <div className="overlay prop-backdrop pc-backdrop" data-phase={phase}>
      <div className="pc-monitor" style={{ "--accent": def.color } as CSSProperties}>
        <div className="pc-bezel">
          <div className={`pc-screen pc-phase-${phase}`} ref={screenRef}>
            {phase === "powering" && <div className="pc-dot" />}
            {phase === "boot" && (
              <div className="pc-boot">
                <div className="pc-bios">
                  {BIOS.slice(0, biosLines).map((line) => <div key={line}>{line}</div>)}
                  <span className="pc-caret" />
                </div>
                {biosLines >= BIOS.length && (
                  <div className="pc-logo">
                    <b>ResumeOS</b>
                    <div className="pc-loading"><i /></div>
                  </div>
                )}
              </div>
            )}
            {(phase === "desktop" || phase === "shutdown") && (
              <div className={`pc-desktop ${scanlines ? "scanlines" : ""}`} style={{ background: WALLPAPERS[wallpaper].css }} onPointerDown={() => setStartOpen(false)}>
                <div className="pc-icons">
                  {desktopApps.map((app) => (
                    <button key={app} type="button" onDoubleClick={() => openApp(app)} onClick={() => openApp(app)}>
                      <span>{APPS[app].icon}</span>
                      {app === "doc" ? def.title : APPS[app].title}
                    </button>
                  ))}
                </div>
                <div className="pc-watermark">{PLAYER_NAME}</div>
                {wins.map((win) => {
                  const meta = APPS[win.app];
                  return (
                    <div
                      key={win.app}
                      className={`pc-window ${win.closing ? "closing" : ""} ${win.minimized ? "minimized" : ""} ${win.maximized ? "maximized" : ""} ${topApp === win.app ? "focused" : ""}`}
                      style={win.maximized ? { zIndex: win.z } : { left: win.x, top: win.y, width: meta.w, height: meta.h, maxWidth: `calc(100% - ${win.x}px)`, zIndex: win.z }}
                      onPointerDown={() => focusWin(win.app)}
                    >
                      <div className="pc-titlebar" onPointerDown={(e) => startDrag(e, win.app)} onDoubleClick={() => toggleMax(win.app)}>
                        <span>{meta.icon} {win.app === "doc" ? def.title : meta.title}</span>
                        <div>
                          <button type="button" aria-label="Minimize" onClick={() => setWins((c) => c.map((w) => (w.app === win.app ? { ...w, minimized: true } : w)))}>–</button>
                          <button type="button" aria-label="Maximize" onClick={() => toggleMax(win.app)}>{win.maximized ? "❐" : "□"}</button>
                          <button type="button" aria-label="Close" className="x" onClick={() => closeWin(win.app)}>×</button>
                        </div>
                      </div>
                      <div className="pc-window-body">{renderApp(win.app)}</div>
                    </div>
                  );
                })}
                <div className="pc-taskbar">
                  <button type="button" className="pc-start" onClick={() => setStartOpen((o) => !o)}>⊞ Start</button>
                  {startOpen && (
                    <div className="pc-startmenu" onPointerDown={(e) => e.stopPropagation()}>
                      {APP_ORDER.map((app) => (
                        <button key={app} type="button" onClick={() => openApp(app)}>
                          <span>{APPS[app].icon}</span> {app === "doc" ? def.title : APPS[app].title}
                        </button>
                      ))}
                      <button type="button" className="off" onClick={shutdown}>⏻ Shut down</button>
                    </div>
                  )}
                  <div className="pc-tasks">
                    {wins.filter((w) => !w.closing).map((win) => (
                      <button
                        key={win.app}
                        type="button"
                        className={topApp === win.app ? "active" : ""}
                        onClick={() => (win.minimized || topApp !== win.app ? openApp(win.app) : setWins((c) => c.map((w) => (w.app === win.app ? { ...w, minimized: true } : w))))}
                      >
                        {APPS[win.app].icon} {win.app === "doc" ? def.title : APPS[win.app].title}
                      </button>
                    ))}
                  </div>
                  <span className="pc-clock">{time}</span>
                </div>
              </div>
            )}
            <div className="pc-glare" />
          </div>
        </div>
        <div className="pc-stand" />
        <div className="pc-hint">Esc closes the top window · Esc again shuts down</div>
      </div>
    </div>
  );
}

function DocApp({ section, index }: { section: SectionId; index: number }) {
  return (
    <div className="pc-doc" style={{ "--section-color": buildings.find((b) => b.id === section)?.color } as CSSProperties}>
      <SectionContent section={section} index={index} />
    </div>
  );
}
