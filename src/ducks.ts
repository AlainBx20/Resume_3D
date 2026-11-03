// Live world positions of the pond ducks, written each frame by the Pond
export const duckWorld: { x: number; z: number }[] = [
  { x: 0, z: 0 },
  { x: 0, z: 0 },
  { x: 0, z: 0 },
];

// Where the angry mother appears during the cutscene (set when it starts)
export const mother = { x: 0, z: 0 };

export const DUCK_SCRIPTS: string[][] = [
  [
    "QUAAACK!! Put. Her. Down.",
    "Do you have ANY idea how long it took to teach these ducklings to swim in a straight line?",
    "Honestly, grabbing strangers' children... is this what they teach in town?",
    "Stop annoying my ducklings, human.",
    "If you have that much free time, go and get to know more about Alaa. He built this whole town. Start with the houses.",
    "Now SHOO. Quack.",
  ],
  ["AGAIN?! I said stop annoying my ducklings.", "Go and read about Alaa. Quack."],
  ["...", "I'm not even going to say it a third time. Houses. Alaa. Go."],
];
