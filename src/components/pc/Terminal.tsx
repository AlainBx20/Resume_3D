import { useEffect, useRef, useState } from "react";
import {
  aboutContent,
  contactContent,
  educationContent,
  experienceContent,
  PLAYER_NAME,
  PLAYER_ROLE,
  projectsContent,
  skillsContent,
} from "../../content";
import { ACHIEVEMENTS, TOTAL_STARS } from "../../achievements";
import { useTownStore } from "../../store";
import { APPS, type AppId } from "./apps";
import { buildCvText, downloadFile } from "./files";

type TerminalApp = AppId;

const FORTUNES = [
  "A bug fixed at 2am creates two at 9am.",
  "It works on my machine. Ship the machine.",
  "There are 10 kinds of people: those who get binary and those who don't.",
  "The best code is the code you didn't have to write.",
  "git blame: the fastest way to find out it was you.",
  "Weeks of coding can save you hours of planning.",
];

const BANNER = [`ResumeOS terminal — ${PLAYER_NAME}`, "Type 'help' to list commands."];

function run(command: string, openApp: (app: TerminalApp) => void): string[] | "clear" {
  const [name, ...args] = command.trim().toLowerCase().split(/\s+/);
  switch (name) {
    case "":
      return [];
    case "help":
      return [
        "about        who I am",
        "whoami       short intro",
        "skills       tech stack",
        "projects     things I built",
        "experience   where I've worked",
        "education    where I studied",
        "contact      how to reach me",
        "open <app>   launch an app (profile, browser, files, notes, music,",
        "             calc, paint, snake, memory, tictactoe, typing, trophies,",
        "             monitor, settings, mail)",
        "cv           download my CV",
        "github       my GitHub link",
        "neofetch     system info",
        "fortune      a dev fortune",
        "achievements your trophy list",
        "clear        clear the screen",
        "(there may be a few secret commands…)",
      ];
    case "whoami":
      return [`${PLAYER_NAME} — ${PLAYER_ROLE}`];
    case "about":
      return aboutContent.paragraphs;
    case "skills":
      return skillsContent.groups.map((g) => `${g.category.padEnd(22)} ${g.items.join(", ")}`);
    case "projects":
      return projectsContent.entries.map((p) => `• ${p.name}`);
    case "experience":
      return experienceContent.entries.map((e) => `• ${e.role} @ ${e.company} (${e.period})`);
    case "education":
      return educationContent.entries.map((e) => `• ${e.school} — ${e.degree} (${e.period})`);
    case "contact":
      return [contactContent.email, ...contactContent.links.map((l) => `${l.label}: ${l.url}`)];
    case "open": {
      const target = args[0];
      if (target && target in APPS) {
        openApp(target as AppId);
        return [`launching ${target}…`];
      }
      return [`usage: open <app> — ${Object.keys(APPS).join(", ")}`];
    }
    case "cv":
      downloadFile("Alaa_CV.txt", buildCvText());
      return ["Downloading Alaa_CV.txt …"];
    case "github": {
      const link = contactContent.links.find((l) => /github/i.test(l.label));
      return [link ? link.url : "No GitHub link listed."];
    }
    case "neofetch":
      useTownStore.getState().unlock("nerd");
      return [
        `${PLAYER_NAME}@resume-town`,
        "-------------------------",
        "OS: ResumeOS 1.0",
        `Role: ${PLAYER_ROLE}`,
        "Shell: resume-sh",
        "Stack: Java, Spring, Angular, Python",
        "Uptime: since the first commit",
      ];
    case "fortune":
      useTownStore.getState().unlock("joker");
      return [FORTUNES[Math.floor(Math.random() * FORTUNES.length)]];
    case "snake":
    case "memory":
    case "mail":
      openApp(name);
      return [`launching ${name}…`];
    case "clear":
      return "clear";
    case "date":
      return [new Date().toString()];
    case "coffee":
      return ["      ( (", "       ) )", "    ........", "    |      |]", "    \\      /", "     `----'", "Brewed. Productivity +10%."];
    case "ls":
      return ["about.txt  skills.txt  projects.txt  secrets/"];
    case "cat":
      return args[0] === "secrets" ? ["That's a folder. Try 'sudo hire alaa'."] : [`cat: ${args[0] ?? "?"}: try the named commands in 'help'`];
    case "sudo":
      if (args.join(" ") === "hire alaa") {
        useTownStore.getState().unlock("hired");
        openApp("mail");
        return ["[sudo] access granted ✔", "Opening mail so you can reach out…"];
      }
      return ["Nice try. Permission denied."];
    case "achievements": {
      const unlocked = useTownStore.getState().achievements;
      return Object.entries(ACHIEVEMENTS).map(([id, a]) =>
        unlocked.includes(id) ? `🏆 ${a.title} — ${a.desc}` : `🔒 ${a.hidden ? "???  (hidden)" : `${a.title} — ${a.desc}`}`,
      );
    }
    case "stars": {
      const found = useTownStore.getState().stars.length;
      return [`Hidden stars found: ${found}/${TOTAL_STARS}`, found < TOTAL_STARS ? "Look high, look low, look behind things." : "You found them all ✦"];
    }
    case "matrix":
      return ["Wake up, recruiter…", "Follow the white rabbit 🐇"];
    default:
      return [`command not found: ${name}`];
  }
}

export default function Terminal({ openApp }: { openApp: (app: TerminalApp) => void }) {
  const [lines, setLines] = useState<string[]>(BANNER);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const result = run(input, openApp);
    setHistory((h) => (input.trim() ? [...h, input] : h));
    setCursor(-1);
    setLines((current) => (result === "clear" ? [] : [...current, `$ ${input}`, ...result]));
    setInput("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") event.stopPropagation();
    if (event.key === "Enter") submit();
    else if (event.key === "ArrowUp" && history.length) {
      event.preventDefault();
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setInput(history[next]);
    } else if (event.key === "ArrowDown" && cursor !== -1) {
      event.preventDefault();
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(-1);
        setInput("");
      } else {
        setCursor(next);
        setInput(history[next]);
      }
    }
  };

  return (
    <div className="pc-terminal" onClick={() => inputRef.current?.focus()}>
      <div className="pc-terminal-body" ref={bodyRef}>
        {lines.map((line, i) => <div key={i}>{line || "\u00a0"}</div>)}
        <label className="pc-terminal-prompt">
          <span>$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
          />
        </label>
      </div>
    </div>
  );
}
