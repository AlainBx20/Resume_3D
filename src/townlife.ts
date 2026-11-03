export interface Npc {
  id: string;
  name: string;
  role: string;
  angle: number; // degrees around the plaza
  radius: number;
  color: string;
  hat?: string;
  lines: string[];
}

export const NPCS: Npc[] = [
  {
    id: "n-recruiter",
    name: "Rita",
    role: "Tech Recruiter",
    angle: 30,
    radius: 8.4,
    color: "#e0556b",
    hat: "#2b2f3a",
    lines: [
      "Oh, a visitor! I've read four hundred résumés this week. This is the first one I could walk around in.",
      "Alaa builds banking backends in Java and Spring Boot, and still finds time to ship his own AI product, Huda AI.",
      "Most candidates list 'team player'. He listed a reinforcement-learning maze solver and a lung-disease classifier.",
      "Go check the Contact house. He answers every message, I checked.",
    ],
  },
  {
    id: "n-compiler",
    name: "Old Karim",
    role: "Retired Compiler",
    angle: 90,
    radius: 8.4,
    color: "#7a8cff",
    lines: [
      "Back in my day we had no hot reload. We stared at the screen and the screen stared back.",
      "That young Alaa is different. Oracle, PL/SQL, microservices: the unglamorous things that keep a bank alive.",
      "He says reliability and traceability matter more than cleverness. I wanted to put that on a plaque.",
    ],
  },
  {
    id: "n-professor",
    name: "Prof. Lina",
    role: "Faculty of Sciences",
    angle: 150,
    radius: 8.4,
    color: "#59c79a",
    hat: "#3a2a1a",
    lines: [
      "I taught at FST. Information and Communication Technology, the whole foundation: databases, networks, systems.",
      "Alaa kept going after class: Generative AI, Machine Learning with Python, Deep Learning and NLP certificates.",
      "A good student asks why. He asked why and then built the answer.",
    ],
  },
  {
    id: "n-intern",
    name: "Yassine",
    role: "Very Tired Intern",
    angle: 210,
    radius: 8.4,
    color: "#ffb84d",
    lines: [
      "I'm interning here. Alaa did four internships before his job: Smart Team, Dione Protocol, Tunisair, and now SMI full-time.",
      "At Tunisair he built a web app to configure Ethernet ports remotely. CCNA knowledge, actually used. Wild.",
      "Psst: the town has bugs. Real ones. Tiny, glowing, and they run when you get close. Catch them with E.",
    ],
  },
  {
    id: "n-duck",
    name: "The Duck Whisperer",
    role: "Rubber Duck Debugger",
    angle: 270,
    radius: 8.4,
    color: "#f2d03b",
    hat: "#f2d03b",
    lines: [
      "Quack. Sorry. Occupational habit.",
      "Rubber duck debugging works. You explain your code to a duck and the bug confesses.",
      "Alaa's Huda AI had a very polite bug once. It apologised for the wrong answer. That one I never solved.",
      "The mother duck at the pond is not part of the rubber duck program. Do not ask her.",
    ],
  },
];

export interface Bug {
  id: string;
  name: string;
  joke: string;
}

export const BUGS: Bug[] = [
  { id: "b-npe", name: "NullPointerException", joke: "It was holding nothing and still managed to crash." },
  { id: "b-off", name: "Off-by-one", joke: "Close. Almost exactly right." },
  { id: "b-race", name: "Race Condition", joke: "Gone before you finished reading this." },
  { id: "b-leak", name: "Memory Leak", joke: "Slowly eating the town. Politely." },
  { id: "b-cors", name: "CORS Error", joke: "Blocked by policy from being caught. Caught anyway." },
  { id: "b-404", name: "404 Not Found", joke: "Found." },
  { id: "b-loop", name: "Infinite Loop", joke: "It kept chasing its own tail." },
  { id: "b-merge", name: "Merge Conflict", joke: "<<<<<<< HEAD  Two bugs, one body." },
  { id: "b-sql", name: "Missing WHERE", joke: "Do not ask what it deleted." },
  { id: "b-cache", name: "Stale Cache", joke: "Insisted it was still Tuesday." },
  { id: "b-sem", name: "Missing Semicolon", joke: "The smallest bug. The loudest scream." },
  { id: "b-works", name: "Works On My Machine", joke: "It does, apparently." },
];

export interface LevelDef {
  xp: number;
  title: string;
}

export const LEVELS: LevelDef[] = [
  { xp: 0, title: "Curious Visitor" },
  { xp: 60, title: "Intern" },
  { xp: 160, title: "Junior Developer" },
  { xp: 300, title: "Developer" },
  { xp: 480, title: "Senior Developer" },
  { xp: 700, title: "Staff Engineer" },
  { xp: 950, title: "Principal Explorer" },
];

export function levelFor(xp: number) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k += 1) if (xp >= LEVELS[k].xp) i = k;
  const next = LEVELS[i + 1];
  return { index: i, title: LEVELS[i].title, next: next ? next.xp : null, base: LEVELS[i].xp };
}
