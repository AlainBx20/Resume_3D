import type { PropKind, SectionId } from "./content";

export interface Achievement {
  title: string;
  desc: string;
  hidden?: boolean;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  "couch-potato": { title: "Couch Potato", desc: "Turn on the TV" },
  "channel-surfer": { title: "Channel Surfer", desc: "Watch all four TV channels" },
  dj: { title: "DJ", desc: "Turn on the radio" },
  bookworm: { title: "Bookworm", desc: "Open a book" },
  "power-user": { title: "Power User", desc: "Boot up a PC" },
  "snake-charmer": { title: "Snake Charmer", desc: "Score 10 in Snake" },
  "elephant-memory": { title: "Elephant Memory", desc: "Clear Memory Match" },
  cozy: { title: "Cozy", desc: "Light the fireplace" },
  punctual: { title: "Punctual", desc: "Check the wall clock" },
  stargazer: { title: "Stargazer", desc: "Find your first hidden star", hidden: true },
  constellation: { title: "Constellation", desc: "Find all six hidden stars", hidden: true },
  "art-critic": { title: "Art Critic", desc: "Inspect a painting", hidden: true },
  "switch-addict": { title: "Switch Addict", desc: "Flip the lights 8 times", hidden: true },
  "cheat-code": { title: "Cheat Code", desc: "Enter a legendary code", hidden: true },
  hired: { title: "Hired!", desc: "Run the secret terminal command", hidden: true },
  completionist: { title: "Completionist", desc: "Visit every chapter", hidden: true },
  "file-hoarder": { title: "File Hoarder", desc: "Download a file from the PC" },
  networker: { title: "Networker", desc: "Open the browser" },
  "know-me": { title: "Getting to Know Me", desc: "Open Alaa's profile app" },
  artist: { title: "Pixel Artist", desc: "Draw something in Paint" },
  outsmarted: { title: "Outsmarted", desc: "Beat the Tic-Tac-Toe bot" },
  typist: { title: "Speed Typist", desc: "Reach 30 WPM" },
  customizer: { title: "Customizer", desc: "Change the wallpaper" },
  multitasker: { title: "Multitasker", desc: "Have 4 windows open at once", hidden: true },
  nerd: { title: "Neofetch Nerd", desc: "Run neofetch", hidden: true },
  decaf: { title: "Decaf", desc: "End coffee.exe", hidden: true },
  answer: { title: "The Answer", desc: "Calculate 42", hidden: true },
  joker: { title: "Dev Humor", desc: "Ask for a fortune", hidden: true },
  quack: { title: "Quack!", desc: "Pick up a duck" },
  scolded: { title: "Scolded by a Duck", desc: "Hear the mother duck out" },
  persistent: { title: "Duck Menace", desc: "Pick up a duckling three times", hidden: true },
  scavenger: { title: "Scavenger", desc: "Find your first PC part" },
  mechanic: { title: "Mechanic", desc: "Collect all four PC parts" },
  "tech-support": { title: "Tech Support", desc: "Repair the broken computer" },
  "vault-hacker": { title: "Vault Hacker", desc: "Open the Vault on the repaired PC", hidden: true },
  "cosmic-dread": { title: "Cosmic Dread", desc: "Step outside while the TV shows Cosmos" },
  "moon-gazer": { title: "Moon Gazer", desc: "Stare at the moon for a few seconds", hidden: true },
  "ring-bearer": { title: "Ring Bearer", desc: "Tune the TV to Cosmos Weekly" },
  "book-nook": { title: "Book Nook", desc: "Browse a full bookshelf", hidden: true },
  "night-owl": { title: "Night Owl", desc: "Be outside after dark", hidden: true },
  "pond-visitor": { title: "Pond Visitor", desc: "Walk up to the duck pond" },
  "wrong-door": { title: "Broken Hearted", desc: "Poke the broken PC with parts missing" },
  hoarder: { title: "Pocket Full of Chips", desc: "Carry 3 parts at once", hidden: true },
  "first-drops": { title: "First Drops", desc: "Step outside into proper rain" },
  "storm-chaser": { title: "Storm Chaser", desc: "Face a full thunderstorm outdoors" },
  "snow-day": { title: "Snow Day", desc: "Explore while snow is falling" },
  "weather-master": { title: "Weather Master", desc: "Experience all four weather conditions" },
  "thunder-witness": { title: "Thunder Witness", desc: "See lightning split the sky" },
  "electric-sky": { title: "Electric Sky", desc: "Witness five lightning strikes", hidden: true },
  "after-the-rain": { title: "After the Rain", desc: "Stay until a rainstorm clears" },
  "storm-at-midnight": { title: "Midnight Thunder", desc: "Be outside in a storm after dark", hidden: true },
  "dawn-patrol": { title: "Dawn Patrol", desc: "Be outside as the sun rises" },
  "golden-hour": { title: "Golden Hour", desc: "Catch sunset in the town square" },
  "midnight-walker": { title: "Midnight Walker", desc: "Explore around midnight" },
  "time-traveler": { title: "Time Traveller", desc: "Fast-forward the day/night cycle" },
  "wet-feet": { title: "Wet Feet", desc: "Leave a footprint in soaked ground" },
  "fresh-powder": { title: "Fresh Powder", desc: "Leave your first track in snow" },
  "puddle-jumper": { title: "Puddle Jumper", desc: "Land a jump in the rain" },
  "snow-hopper": { title: "Snow Hopper", desc: "Land a jump in fresh snow" },
  wanderer: { title: "Wanderer", desc: "Walk 250 metres through the town" },
  globetrotter: { title: "Globetrotter", desc: "Travel 1,000 metres", hidden: true },
  sprinter: { title: "Sprinter", desc: "Run for 120 metres" },
  "bunny-hopper": { title: "Bunny Hopper", desc: "Jump twelve times", hidden: true },
  "edge-of-town": { title: "Edge of Town", desc: "Reach the forest boundary" },
  "fountain-friend": { title: "Fountain Friend", desc: "Linger beside the fountain" },
  "plaza-regular": { title: "Plaza Regular", desc: "Spend half a minute around the square" },
  moonbather: { title: "Moonbather", desc: "Stand beneath clear moonlight" },
  "rainy-day-reader": { title: "Rainy-Day Reader", desc: "Open a book while rain falls" },
  "lights-out": { title: "Lights Out", desc: "Turn off a room light after dark" },
  "house-hopper": { title: "House Hopper", desc: "Visit three different résumé houses" },
  "meteor-wish": { title: "Make a Wish", desc: "Catch a shooting star", hidden: true },
  "relic-first": { title: "Shiny Thing", desc: "Touch your first relic" },
  archaeologist: { title: "Archaeologist", desc: "Recover all eight relics and shards", hidden: true },
  "diary-keeper": { title: "Diary Keeper", desc: "Open the Town Journal (J)" },
  "q-who": { title: "Quest: Who Is Alaa?", desc: "Finish the Who Is Alaa? questline" },
  "q-skills": { title: "Quest: Skill Collector", desc: "Recover all five skill relics" },
  "q-shards": { title: "Quest: Whispering Shards", desc: "Find the three hidden shards", hidden: true },
  "q-fixit": { title: "Quest: Turn It Off and On", desc: "Finish the PC repair questline" },
  "q-night": { title: "Quest: Night Shift", desc: "Finish the Night Shift questline", hidden: true },
  "q-legend": { title: "Town Legend", desc: "Complete the Town Legend questline", hidden: true },
  "quest-master": { title: "Quest Master", desc: "Complete every questline", hidden: true },
  "small-talk": { title: "Small Talk", desc: "Chat with a townsperson" },
  "social-butterfly": { title: "Social Butterfly", desc: "Hear every townsperson out" },
  "bug-first": { title: "Bug Catcher", desc: "Catch your first glowing bug" },
  exterminator: { title: "Exterminator", desc: "Catch six bugs", hidden: true },
  "zero-bugs": { title: "Zero Known Bugs", desc: "Catch all twelve bugs", hidden: true },
  "q-bugs": { title: "Quest: Bug Hunter", desc: "Finish the Bug Hunter questline" },
  "q-folk": { title: "Quest: Meet the Locals", desc: "Finish the townsfolk questline" },
  "level-up": { title: "Level Up", desc: "Reach the rank of Junior Developer" },
  "coin-first": { title: "First Commit", desc: "Collect a floating commit" },
  "coin-10": { title: "Ten Commits", desc: "Collect ten commits" },
  "coin-all": { title: "Monorepo", desc: "Collect every commit in town", hidden: true },
  "code-first": { title: "Code Breaker", desc: "Type a secret word in the open air", hidden: true },
  "code-5": { title: "Cheat Master", desc: "Discover five secret words", hidden: true },
  "code-all": { title: "Root Access", desc: "Discover every secret word", hidden: true },
  disco: { title: "Disco Fever", desc: "Start the disco", hidden: true },
  boom: { title: "Big Bang", desc: "Launch fireworks over the plaza", hidden: true },
  "fish-first": { title: "Gone Fishing", desc: "Catch a fish at the pond" },
  "fish-5": { title: "Angler", desc: "Catch five different fish" },
  "fish-all": { title: "Master Angler", desc: "Catch every fish", hidden: true },
  "rod-rage": { title: "Rod Rage", desc: "Reel in too early three times", hidden: true },
  "umbrella-spotted": { title: "Singin' in the Rain", desc: "See a villager open an umbrella" },
  "storm-guest": { title: "Uninvited Guest", desc: "Find a villager sheltering inside a house during a storm", hidden: true },
  "max-level": { title: "Principal Explorer", desc: "Reach the highest rank", hidden: true },
};

export interface Extra {
  kind: PropKind;
  position: [number, number, number]; // x/z also used as the interaction point
  rotationY?: number;
  label: string;
}

export const ART_QUOTES = [
  "Behind the frame: \"It works on my machine.\"",
  "The brush strokes spell out 'console.log'.",
  "A tiny signature in the corner: 'A. Ben Chouikha, 2025'.",
  "It's an abstract piece titled 'Merge Conflict'.",
];

// Wall pieces and hidden collectibles for each room. Stars have no marker or
// label on purpose: they only show up as a faint sparkle for sharp eyes.
export const interiorExtras: Record<SectionId, Extra[]> = {
  about: [
    { kind: "clock", position: [-3, 2.6, 3.88], rotationY: Math.PI, label: "Wall clock" },
    { kind: "art", position: [-2.9, 0, -3.3], label: "Painting" },
    { kind: "art", position: [2.9, 0, -3.3], label: "Painting" },
    { kind: "star", position: [4.5, 0.3, 3.5], label: "Hidden star" },
  ],
  education: [
    { kind: "fire", position: [-4.4, 0, -0.6], rotationY: Math.PI / 2, label: "Fireplace" },
    { kind: "art", position: [-2.9, 0, -3.3], label: "Painting" },
    { kind: "star", position: [4.55, 2.2, -2.2], label: "Hidden star" },
  ],
  experience: [
    { kind: "clock", position: [3, 2.6, 3.88], rotationY: Math.PI, label: "Wall clock" },
    { kind: "art", position: [2.9, 0, -3.3], label: "Painting" },
    { kind: "star", position: [0, 3.2, 3.6], label: "Hidden star" },
  ],
  skills: [
    { kind: "art", position: [-2.9, 0, -3.3], label: "Painting" },
    { kind: "star", position: [-4.55, 1.3, 2.6], label: "Hidden star" },
  ],
  projects: [
    { kind: "art", position: [2.9, 0, -3.3], label: "Painting" },
    { kind: "star", position: [0, 0.3, -3.6], label: "Hidden star" },
  ],
  contact: [
    { kind: "fire", position: [4.4, 0, 2.2], rotationY: -Math.PI / 2, label: "Fireplace" },
    { kind: "brokenpc", position: [4.15, 0, -2.3], label: "Broken computer" },
    { kind: "star", position: [-4.5, 0.3, 3.4], label: "Hidden star" },
  ],
};

export const TOTAL_STARS = Object.values(interiorExtras)
  .flat()
  .filter((e) => e.kind === "star").length;

export function extraItemId(room: SectionId, index: number) {
  return `extra-${room}-${index}`;
}
