import { buildings } from "./content";
import { BUGS, NPCS } from "./townlife";

export interface QuestCtx {
  achievements: string[];
  visited: string[];
  stars: string[];
  parts: string[];
  relics: string[];
  bugs: string[];
  talked: string[];
}

export interface QuestStep {
  text: string;
  done: (c: QuestCtx) => boolean;
}

export interface Questline {
  id: string;
  title: string;
  blurb: string;
  reward: string; // achievement id granted on completion
  steps: QuestStep[];
}

const has = (id: string) => (c: QuestCtx) => c.achievements.includes(id);

export const QUESTLINES: Questline[] = [
  {
    id: "who-is-alaa",
    title: "Who Is Alaa?",
    blurb: "A tour of the person behind the town.",
    reward: "q-who",
    steps: [
      { text: "Visit all six résumé houses", done: (c) => buildings.every((b) => c.visited.includes(b.id)) },
      { text: "Open the profile app on a PC", done: has("know-me") },
      { text: "Open a book in the About house", done: has("bookworm") },
      { text: "Download a file from a PC", done: has("file-hoarder") },
    ],
  },
  {
    id: "skill-collector",
    title: "The Skill Collector",
    blurb: "Five relics hold what Alaa is good at. Find them on the grass between the houses.",
    reward: "q-skills",
    steps: [
      { text: "Find the Relic of Languages", done: (c) => c.relics.includes("r-languages") },
      { text: "Find the Relic of Interfaces", done: (c) => c.relics.includes("r-frontend") },
      { text: "Find the Relic of Services", done: (c) => c.relics.includes("r-backend") },
      { text: "Find the Relic of Intelligence", done: (c) => c.relics.includes("r-ai") },
      { text: "Find the Relic of Networks", done: (c) => c.relics.includes("r-network") },
    ],
  },
  {
    id: "secret-shards",
    title: "Whispering Shards",
    blurb: "Three shards hide where the paths don't go. Their stories are not in the résumé.",
    reward: "q-shards",
    steps: [
      { text: "Find the Origin Shard behind the About house", done: (c) => c.relics.includes("s-origin") },
      { text: "Find the Quiet Shard past the pond", done: (c) => c.relics.includes("s-pond") },
      { text: "Find the Forest Shard near the tree line", done: (c) => c.relics.includes("s-forest") },
    ],
  },
  {
    id: "fix-it",
    title: "Have You Tried Turning It Off?",
    blurb: "The contact room's old PC is dead. Someone should fix it.",
    reward: "q-fixit",
    steps: [
      { text: "Find your first PC part", done: has("scavenger") },
      { text: "Collect all four parts", done: has("mechanic") },
      { text: "Repair the broken computer", done: has("tech-support") },
      { text: "Open the Vault", done: has("vault-hacker") },
    ],
  },
  {
    id: "night-shift",
    title: "Night Shift",
    blurb: "Alaa codes best after dark. Meet the town then.",
    reward: "q-night",
    steps: [
      { text: "Be outside after dark", done: has("night-owl") },
      { text: "Stand beneath clear moonlight", done: has("moonbather") },
      { text: "Stare at the moon", done: has("moon-gazer") },
      { text: "Turn a light off after dark", done: has("lights-out") },
    ],
  },
  {
    id: "bug-hunter",
    title: "Bug Hunter",
    blurb: "Twelve glowing bugs are loose in the plaza and out by the road. They run when you get close. Catch them with E.",
    reward: "q-bugs",
    steps: [
      { text: "Catch your first bug", done: (c) => c.bugs.length >= 1 },
      { text: "Catch six bugs", done: (c) => c.bugs.length >= 6 },
      { text: "Catch all twelve bugs", done: (c) => c.bugs.length >= BUGS.length },
    ],
  },
  {
    id: "locals",
    title: "Meet the Locals",
    blurb: "Five townspeople have opinions about Alaa. Walk around the plaza and hear them all out.",
    reward: "q-folk",
    steps: NPCS.map((n) => ({ text: `Talk to ${n.name} (${n.role})`, done: (c: QuestCtx) => c.talked.includes(n.id) })),
  },
  {
    id: "town-legend",
    title: "Town Legend",
    blurb: "For those who leave no stone, star or duck unturned.",
    reward: "q-legend",
    steps: [
      { text: "Find all six hidden stars", done: (c) => c.stars.length >= 6 },
      { text: "Scold-proof: hear the mother duck out", done: has("scolded") },
      { text: "Complete Who Is Alaa?", done: has("q-who") },
      { text: "Complete The Skill Collector", done: has("q-skills") },
      { text: "Complete Whispering Shards", done: has("q-shards") },
      { text: "Complete Bug Hunter", done: has("q-bugs") },
      { text: "Complete Meet the Locals", done: has("q-folk") },
    ],
  },
];

export function questProgress(q: Questline, c: QuestCtx) {
  const done = q.steps.filter((s) => s.done(c)).length;
  return { done, total: q.steps.length, complete: done === q.steps.length };
}
