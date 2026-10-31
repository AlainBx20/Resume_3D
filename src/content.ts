// ---------------------------------------------------------------------------
// EDIT ME: replace every placeholder string below with your real resume info.
// This is the only file you need to touch to make the site "yours".
// ---------------------------------------------------------------------------

export type SectionId =
  | "about"
  | "education"
  | "experience"
  | "skills"
  | "projects"
  | "contact";

export interface BuildingDef {
  id: SectionId;
  title: string;
  subtitle: string;
  model: string;
  position: [number, number, number];
  scale: number;
  color: string;
}

export interface FurnitureItemDef {
  model: string;
  position: [number, number, number];
  rotationY?: number;
  label: string;
}

// Non-interactive set dressing inside each house. `noCollide` is for rugs and
// anything stacked on top of other furniture.
export interface DecorItemDef {
  model: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  noCollide?: boolean;
}

export const PLAYER_NAME = "Jordan Avery";
export const PLAYER_ROLE = "Full-Stack Developer";
export const TOWN_NAME = `${PLAYER_NAME.split(" ")[0]}ville`;
export const PROFILE_NOTE = "Interactive demo profile";
export const WORLD_FONT = "/fonts/kenpixel.ttf";

export const buildings: BuildingDef[] = [
  {
    id: "about",
    title: "About Me",
    subtitle: "Who I am",
    model: "/models/suburban/building-about.glb",
    position: [0, 0, -11],
    scale: 2.6,
    color: "#6cc3ff",
  },
  {
    id: "education",
    title: "Education",
    subtitle: "Where I studied",
    model: "/models/suburban/building-education.glb",
    position: [9.3, 0, -5.5],
    scale: 2.6,
    color: "#b388ff",
  },
  {
    id: "experience",
    title: "Experience",
    subtitle: "Where I've worked",
    model: "/models/suburban/building-experience.glb",
    position: [9.3, 0, 5.5],
    scale: 2.6,
    color: "#ffb84d",
  },
  {
    id: "skills",
    title: "Skills",
    subtitle: "What I'm good at",
    model: "/models/suburban/building-skills.glb",
    position: [0, 0, 11],
    scale: 2.6,
    color: "#5dffb0",
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "What I've built",
    model: "/models/suburban/building-projects.glb",
    position: [-9.3, 0, 5.5],
    scale: 2.6,
    color: "#ff6e8c",
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Get in touch",
    model: "/models/suburban/building-contact.glb",
    position: [-9.3, 0, -5.5],
    scale: 2.6,
    color: "#ffe066",
  },
];

export const aboutContent = {
  heading: "About Me",
  paragraphs: [
    `Hi, I'm ${PLAYER_NAME} — a ${PLAYER_ROLE.toLowerCase()} who loves turning complex problems into clean, playful experiences.`,
    "I build thoughtful web products across the stack, from resilient APIs and data models to expressive, accessible interfaces.",
    "I care about systems that are easy to understand, products that feel good to use, and teams that leave codebases better than they found them.",
  ],
};

export const educationContent = {
  heading: "Education",
  entries: [
    {
      school: "Northbridge University",
      degree: "B.Sc. in Computer Science",
      period: "2016 — 2020",
      details: "Focused on distributed systems, human-computer interaction, and practical software engineering.",
    },
    {
      school: "Cloud Guild",
      degree: "Professional Certificate in Cloud Architecture",
      period: "2021",
      details: "Designed secure, observable cloud systems with an emphasis on reliability and sensible cost controls.",
    },
  ],
};

export const experienceContent = {
  heading: "Experience",
  entries: [
    {
      role: "Senior Software Engineer",
      company: "Orbit Labs",
      period: "2022 — Present",
      bullets: [
        "Led delivery of a real-time collaboration workspace used across customer operations teams.",
        "Cut deployment recovery time by simplifying release automation and production observability.",
        "Mentored engineers and introduced lightweight architecture reviews for high-impact changes.",
      ],
    },
    {
      role: "Software Engineer",
      company: "Northstar Studio",
      period: "2020 — 2022",
      bullets: [
        "Built and shipped customer-facing features from discovery through production support.",
        "Partnered with design and product to turn ambiguous ideas into focused, testable releases.",
      ],
    },
  ],
};

export const skillsContent = {
  heading: "Skills",
  groups: [
    { category: "Languages", items: ["TypeScript", "JavaScript", "Python", "Go"] },
    { category: "Frontend", items: ["React", "Three.js", "React Three Fiber", "CSS"] },
    { category: "Backend", items: ["Node.js", "PostgreSQL", "REST / GraphQL APIs"] },
    { category: "Tools", items: ["Git", "Docker", "CI/CD", "AWS"] },
  ],
};

export const projectsContent = {
  heading: "Projects",
  entries: [
    {
      name: "This 3D Resume",
      description:
        "An explorable low-poly town built with React Three Fiber — you're standing in it right now.",
      link: "#",
    },
    {
      name: "Relay Dashboard",
      description: "A live operations dashboard that turns noisy service events into clear, actionable incident timelines.",
      link: "#",
    },
    {
      name: "Fieldnote",
      description: "An offline-first research notebook for capturing structured observations and syncing them safely later.",
      link: "#",
    },
  ],
};

export const contactContent = {
  heading: "Contact",
  email: "hello@jordanavery.dev",
  links: [
    { label: "GitHub", url: "https://github.com/jordanavery" },
    { label: "LinkedIn", url: "https://linkedin.com/in/jordanavery" },
  ],
  blurb: "Have an interesting product problem, a role to discuss, or simply want to compare notes? I’d love to hear from you.",
};

// Furniture layout for each house's interior. One entry = one walk-up-and-
// press-E prop, indexed 1:1 against the matching *Content array above.
const FURN = "/models/furniture/";

export const interiorLayouts: Record<SectionId, FurnitureItemDef[]> = {
  about: [
    // staged on real furniture: books on the coffee table, radio on the side
    // table — the y values sit them on the measured surface heights
    { model: `${FURN}books.glb`, position: [0.2, 0.46, 0.8], label: "Who I Am" },
    { model: `${FURN}pottedPlant.glb`, position: [2.9, 0, -3.1], label: "This Town" },
    { model: `${FURN}radio.glb`, position: [-2.9, 0.65, -3.35], label: "What I Care About" },
  ],
  education: [
    { model: `${FURN}desk.glb`, position: [-2.5, 0, -3], label: "Northbridge University" },
    { model: `${FURN}bookcaseClosedWide.glb`, position: [2.5, 0, -3.3], rotationY: Math.PI, label: "Cloud Guild" },
  ],
  experience: [
    { model: `${FURN}desk.glb`, position: [-2.5, 0, -3], label: "Senior Software Engineer" },
    { model: `${FURN}sideTableDrawers.glb`, position: [2.8, 0, -3], label: "Software Engineer" },
  ],
  skills: [
    { model: `${FURN}bookcaseOpenLow.glb`, position: [-3.6, 0, -3.3], rotationY: Math.PI, label: "Languages" },
    { model: `${FURN}computerScreen.glb`, position: [-1.2, 0, -3.3], rotationY: Math.PI, label: "Frontend" },
    { model: `${FURN}kitchenCabinetDrawer.glb`, position: [1.2, 0, -3.3], rotationY: Math.PI, label: "Backend" },
    { model: `${FURN}cabinetTelevision.glb`, position: [3.6, 0, -3.3], rotationY: Math.PI, label: "Tools" },
  ],
  projects: [
    { model: `${FURN}tableCoffee.glb`, position: [-3, 0, -2.8], label: "This 3D Resume" },
    { model: `${FURN}tableRound.glb`, position: [0, 0, -3.2], label: "Relay Dashboard" },
    { model: `${FURN}tableGlass.glb`, position: [3, 0, -2.8], label: "Fieldnote" },
  ],
  contact: [{ model: `${FURN}desk.glb`, position: [0, 0, -3], label: "Get In Touch" }],
};

// Cozy set dressing per room (sofas, rugs, plants, lamps…). Purely visual —
// walk past it, it never opens a panel. Positions assume a centered footprint.
export const interiorDecor: Record<SectionId, DecorItemDef[]> = {
  about: [
    { model: `${FURN}rugRound.glb`, position: [0, 0.005, 0.3], scale: 3.2, noCollide: true },
    { model: `${FURN}rugDoormat.glb`, position: [0, 0.005, 3.3], scale: 1.8, noCollide: true },
    { model: `${FURN}loungeSofa.glb`, position: [-4.0, 0, 0.4], rotationY: Math.PI / 2, scale: 1.8 },
    { model: `${FURN}bear.glb`, position: [-3.3, 0, 1.9], rotationY: 1.1, scale: 1.5 },
    { model: `${FURN}televisionModern.glb`, position: [4.2, 0, 0.3], rotationY: -Math.PI / 2, scale: 1.8 },
    { model: `${FURN}tableCoffee.glb`, position: [0.2, 0, 0.8], scale: 2.0 },
    { model: `${FURN}sideTableDrawers.glb`, position: [-2.9, 0, -3.35], scale: 1.7 },
    { model: `${FURN}bookcaseClosedWide.glb`, position: [0.6, 0, -3.5], scale: 1.7 },
    { model: `${FURN}plantSmall2.glb`, position: [-4.4, 0, -3.3], scale: 1.8 },
    { model: `${FURN}plantSmall1.glb`, position: [4.4, 0, -3.3], scale: 1.8 },
  ],
  education: [
    { model: `${FURN}rugRectangle.glb`, position: [0, 0.005, 0.2], scale: 3.2, noCollide: true },
    { model: `${FURN}rugDoormat.glb`, position: [0, 0.005, 3.3], scale: 1.8, noCollide: true },
    { model: `${FURN}bookcaseOpen.glb`, position: [4.35, 0, -1.2], rotationY: -Math.PI / 2, scale: 1.8 },
    { model: `${FURN}chair.glb`, position: [3.4, 0, 1.9], rotationY: -2.2, scale: 1.6 },
    { model: `${FURN}lampSquareFloor.glb`, position: [-4.3, 0, 2.6], scale: 1.7 },
    { model: `${FURN}plantSmall3.glb`, position: [-4.4, 0, -3.3], scale: 1.8 },
  ],
  experience: [
    { model: `${FURN}rugSquare.glb`, position: [0, 0.005, 0.3], scale: 3.2, noCollide: true },
    { model: `${FURN}rugDoormat.glb`, position: [0, 0.005, 3.3], scale: 1.8, noCollide: true },
    { model: `${FURN}deskCorner.glb`, position: [-3.8, 0, -0.6], rotationY: Math.PI / 2, scale: 1.6 },
    { model: `${FURN}chairModernCushion.glb`, position: [-2.9, 0, -0.2], rotationY: 1.9, scale: 1.6 },
    { model: `${FURN}coatRackStanding.glb`, position: [4.4, 0, 2.8], scale: 1.7 },
    { model: `${FURN}speaker.glb`, position: [4.35, 0, -1], rotationY: -Math.PI / 2, scale: 1.7 },
    { model: `${FURN}plantSmall1.glb`, position: [-4.4, 0, -3.3], scale: 1.8 },
  ],
  skills: [
    { model: `${FURN}rugRectangle.glb`, position: [0, 0.005, 0.4], scale: 3.0, noCollide: true },
    { model: `${FURN}rugDoormat.glb`, position: [0, 0.005, 3.3], scale: 1.8, noCollide: true },
    { model: `${FURN}tableCloth.glb`, position: [-4.1, 0, 0.6], rotationY: Math.PI / 2, scale: 1.8 },
    { model: `${FURN}laptop.glb`, position: [-4.1, 0.59, 0.6], rotationY: Math.PI / 2, scale: 1.5, noCollide: true },
    { model: `${FURN}televisionVintage.glb`, position: [4.3, 0, 1.9], rotationY: -Math.PI / 2, scale: 1.7 },
    { model: `${FURN}stoolBar.glb`, position: [3.6, 0, 2.7], scale: 1.5 },
    { model: `${FURN}plantSmall2.glb`, position: [-4.4, 0, -3.3], scale: 1.8 },
  ],
  projects: [
    { model: `${FURN}rugRound.glb`, position: [0, 0.005, 0.4], scale: 3.0, noCollide: true },
    { model: `${FURN}rugDoormat.glb`, position: [0, 0.005, 3.3], scale: 1.8, noCollide: true },
    { model: `${FURN}bench.glb`, position: [-4.2, 0, 0.8], rotationY: Math.PI / 2, scale: 1.7 },
    { model: `${FURN}cardboardBoxClosed.glb`, position: [-4.3, 0, -3.3], scale: 1.6 },
    { model: `${FURN}cardboardBoxOpen.glb`, position: [-3.3, 0, -3.4], scale: 1.5 },
    { model: `${FURN}lampSquareFloor.glb`, position: [4.3, 0, 2.7], scale: 1.7 },
    { model: `${FURN}plantSmall3.glb`, position: [4.4, 0, -3.3], scale: 1.8 },
  ],
  contact: [
    { model: `${FURN}rugRound.glb`, position: [0, 0.005, 0.5], scale: 3.0, noCollide: true },
    { model: `${FURN}rugDoormat.glb`, position: [0, 0.005, 3.3], scale: 1.8, noCollide: true },
    // workstation on top of the interactive desk (its top sits at y≈0.65)
    { model: `${FURN}computerScreen.glb`, position: [0, 0.65, -3.15], scale: 1.4, noCollide: true },
    { model: `${FURN}computerKeyboard.glb`, position: [0, 0.65, -2.8], scale: 1.4, noCollide: true },
    { model: `${FURN}chairDesk.glb`, position: [1.0, 0, -1.9], rotationY: -2.6, scale: 1.6 },
    { model: `${FURN}loungeChairRelax.glb`, position: [-4.0, 0, 0.6], rotationY: Math.PI / 2, scale: 1.8 },
    { model: `${FURN}lampRoundFloor.glb`, position: [-4.3, 0, 2.5], scale: 1.7 },
    { model: `${FURN}tableCloth.glb`, position: [4.2, 0, 0.2], rotationY: -Math.PI / 2, scale: 1.7 },
    { model: `${FURN}lampRoundTable.glb`, position: [4.2, 0.56, 0.2], scale: 1.4, noCollide: true },
    { model: `${FURN}plantSmall1.glb`, position: [4.4, 0, -3.3], scale: 1.8 },
  ],
};
