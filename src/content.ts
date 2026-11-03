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

export type PropKind = "book" | "pc" | "tv" | "radio" | "light" | "clock" | "fire" | "star" | "art" | "part" | "brokenpc";

export interface FurnitureItemDef {
  model: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number; // defaults to FurnitureItem's EXHIBIT_SCALE when omitted
  label: string;
  kind?: PropKind; // special behaviour; omitted = opens the plain chapter panel
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

export const PLAYER_NAME = "Alaa Ben Chouikha";
export const PLAYER_ROLE = "Software Developer";
export const TOWN_NAME = "Resume Town";
export const PROFILE_NOTE = "Software Developer @ SMI · Creator of Huda AI";
export const WORLD_FONT = "/fonts/kenpixel.ttf";

export const buildings: BuildingDef[] = [
  {
    id: "about",
    title: "About Me",
    subtitle: "Who I am",
    model: "/models/kaykit/buildings/building_B.glb",
    position: [0, 0, -11],
    scale: 2.6,
    color: "#6cc3ff",
  },
  {
    id: "education",
    title: "Education",
    subtitle: "Where I studied",
    model: "/models/kaykit/buildings/building_D.glb",
    position: [9.3, 0, -5.5],
    scale: 2.6,
    color: "#b388ff",
  },
  {
    id: "experience",
    title: "Experience",
    subtitle: "Where I've worked",
    model: "/models/kaykit/buildings/building_E.glb",
    position: [9.3, 0, 5.5],
    scale: 2.6,
    color: "#ffb84d",
  },
  {
    id: "skills",
    title: "Skills",
    subtitle: "What I'm good at",
    model: "/models/kaykit/buildings/building_F.glb",
    position: [0, 0, 11],
    scale: 2.6,
    color: "#5dffb0",
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "What I've built",
    model: "/models/kaykit/buildings/building_G.glb",
    position: [-9.3, 0, 5.5],
    scale: 2.6,
    color: "#ff6e8c",
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Get in touch",
    model: "/models/kaykit/buildings/building_C.glb",
    position: [-9.3, 0, -5.5],
    scale: 2.6,
    color: "#ffe066",
  },
];

export const aboutContent = {
  heading: "About Me",
  paragraphs: [
    `Hi, I'm ${PLAYER_NAME} — a software developer at SMI (Société Le Monde Informatique) in Tunis, and the creator of Huda AI, an Islamic AI-powered Q&A platform.`,
    "By day I build business-oriented banking solutions with Java, Spring Boot, Oracle and microservices; by night I build AI and full-stack projects with React, Angular, Node.js, TensorFlow and PyTorch.",
    "I care about clean, scalable systems, practical applications that solve real problems, and software that's genuinely a pleasure to use.",
  ],
};

export const educationContent = {
  heading: "Education",
  entries: [
    {
      school: "Faculty of Sciences of Tunis (FST)",
      degree: "Bachelor's in Information & Communication Technology",
      period: "2022 — 2024",
      details: "ICT fundamentals across software engineering, databases, networks and systems.",
    },
    {
      school: "Lycée Pilote Radhiâ Haddad, El Omrane",
      degree: "Baccalaureate in Computer Science",
      period: "2022",
      details: "Secondary diploma specializing in computer science.",
    },
    {
      school: "Certifications",
      degree: "AI, Machine Learning & Deep Learning",
      period: "2023 — 2024",
      details:
        "Generative AI & LLMs (Alison), AI x Web3 (Dione Protocol), Machine Learning with Python, Deep Learning & NLP, and problem solving / algorithms.",
    },
  ],
};

export const experienceContent = {
  heading: "Experience",
  entries: [
    {
      role: "Software Developer",
      company: "SMI — Société Le Monde Informatique, Tunis",
      period: "May 2025 — Present",
      bullets: [
        "Develop backend services for banking software with Java and Spring Boot.",
        "Work with Oracle databases, SQL and PL/SQL, and build and consume REST APIs.",
        "Contribute to microservice-based architecture, banking workflows and business rules.",
        "Improve system reliability, maintainability and business traceability.",
      ],
    },
    {
      role: "Development & Networking Intern",
      company: "Tunisair, Tunis",
      period: "Jul — Aug 2024",
      bullets: [
        "Built a web app for remote Ethernet port configuration.",
        "Applied CCNA principles to network configuration and system communication.",
      ],
    },
    {
      role: "AI & Web3 Workshop",
      company: "Dione Protocol, Tunis",
      period: "Jun — Jul 2024",
      bullets: [
        "Worked on energy disaggregation using TensorFlow and AI models.",
        "Explored real-world applications of artificial intelligence and Web3.",
      ],
    },
    {
      role: "Web Development Intern",
      company: "Smart Team, Tunis",
      period: "Jun — Aug 2023",
      bullets: [
        "Built web projects with React, Angular and Node.js.",
        "Strengthened both frontend and backend development skills.",
      ],
    },
  ],
};

export const skillsContent = {
  heading: "Skills",
  groups: [
    { category: "Languages", items: ["Java", "JavaScript", "TypeScript", "Python", "SQL / PL-SQL"] },
    { category: "Frontend", items: ["React", "Angular", "Node.js", "HTML", "CSS"] },
    { category: "Backend & Databases", items: ["Spring Boot", "JPA / Hibernate", "Oracle", "REST APIs", "Microservices"] },
    { category: "Artificial Intelligence", items: ["TensorFlow", "PyTorch", "Keras", "NLP", "Reinforcement Learning"] },
    { category: "Networking", items: ["CCNA", "Network Configuration"] },
  ],
};

export const projectsContent = {
  heading: "Projects",
  entries: [
    {
      name: "Huda AI — Islamic Q&A Platform",
      description:
        "A full-stack web platform I created and deployed where users ask questions about Islam and receive AI-powered answers through a clean, accessible interface.",
      link: "https://hudaaai.com/",
    },
    {
      name: "AI Maze (Reinforcement Learning)",
      description: "A reinforcement-learning agent that learns to solve maze environments through training and decision-making.",
      link: "https://github.com/AlainBx20/AI-Maze",
    },
    {
      name: "Lung Disease Classification",
      description: "A machine-learning / deep-learning project that classifies lung diseases from medical data.",
      link: "https://github.com/AlainBx20/Lung-Disease-Classification",
    },
    {
      name: "Ecology Simulation (AI Agent)",
      description: "An AI-based ecological simulation focused on intelligent agent behavior and environmental modeling.",
      link: "https://github.com/AlainBx20/Ecology-Simulation",
    },
  ],
};

export const contactContent = {
  heading: "Contact",
  email: "alaachuikhaa@gmail.com",
  links: [
    { label: "GitHub", url: "https://github.com/AlainBx20" },
    { label: "Huda AI", url: "https://hudaaai.com/" },
  ],
  blurb:
    "Have an interesting product problem, a banking or AI project, a role to discuss, or simply want to compare notes? I'd love to hear from you.",
};

// Furniture layout for each house's interior. One entry = one walk-up-and-
// press-E prop, indexed 1:1 against the matching *Content array above.
// KFURN = KayKit Furniture Bits (the main furniture); FURN = kept Kenney props
// for things KayKit has no equivalent of (electronics, teddy bear, boxes).
// KayKit surface heights at the scales below: table_low top≈0.50, desk
// (table_medium_long) top≈0.78, table_medium/small top≈0.80, cabinet top≈0.80.
const FURN = "/models/furniture/";
const KFURN = "/models/kaykit/furniture/";

// Layout rules (room inner bounds x ±4.84, z -3.84..3.84, door at z=+3.84):
// every model's front faces +z, so rotationY 0 faces the room from the back
// wall, π/2 faces +x from the left wall and -π/2 faces -x from the right wall.
// Big pieces sit flush against walls; small items rest on surfaces.
export const interiorLayouts: Record<SectionId, FurnitureItemDef[]> = {
  about: [
    { model: `${KFURN}book_set.glb`, position: [0, 0.675, -0.35], scale: 0.7, label: "Who I Am", kind: "book" },
    { model: `${KFURN}cactus_medium_A.glb`, position: [2.3, 0, -3.35], scale: 1.2, label: "This Town" },
    { model: `${FURN}radio.glb`, position: [-2.1, 0.8, -3.42], label: "What I Care About", kind: "radio" },
    { model: `${FURN}televisionModern.glb`, position: [0, 0.8, -3.5], scale: 2.2, label: "Watch TV", kind: "tv" },
  ],
  education: [
    { model: `${KFURN}table_medium_long.glb`, position: [-2.2, 0, -3.02], scale: 0.8, label: "Bachelor's — ICT", kind: "book" },
    { model: `${FURN}bookcaseOpen.glb`, position: [3.0, 0, -3.5], scale: 2.4, label: "Baccalaureate", kind: "book" },
  ],
  experience: [
    { model: `${KFURN}table_medium_long.glb`, position: [-2.2, 0, -3.02], scale: 0.8, label: "Software Developer — SMI", kind: "pc" },
    { model: `${KFURN}cabinet_medium.glb`, position: [2.6, 0, -3.42], scale: 0.8, label: "Networking Intern" },
  ],
  skills: [
    { model: `${FURN}bookcaseOpen.glb`, position: [-3.9, 0, -3.5], scale: 2.4, label: "Languages", kind: "book" },
    { model: `${FURN}computerScreen.glb`, position: [-0.9, 0.8, -3.3], scale: 1.9, label: "Frontend", kind: "pc" },
    { model: `${KFURN}cabinet_medium.glb`, position: [2.5, 0, -3.42], scale: 0.8, label: "Backend" },
    { model: `${KFURN}cabinet_small.glb`, position: [4.2, 0, -3.42], scale: 0.8, label: "AI" },
  ],
  projects: [
    { model: `${KFURN}table_medium.glb`, position: [-3.2, 0, -3.0], scale: 0.8, label: "Huda AI", kind: "pc" },
    { model: `${KFURN}table_small.glb`, position: [0, 0, -3.35], scale: 0.9, label: "AI Maze", kind: "pc" },
    { model: `${KFURN}table_medium.glb`, position: [3.2, 0, -3.0], scale: 0.8, label: "Lung Disease ML", kind: "pc" },
  ],
  contact: [{ model: `${KFURN}table_medium_long.glb`, position: [0, 0, -3.02], scale: 0.8, label: "Get In Touch", kind: "pc" }],
};

// Cozy set dressing per room (sofas, rugs, plants, lamps…). Purely visual —
// walk past it, it never opens a panel. Positions assume a centered footprint.
export const interiorDecor: Record<SectionId, DecorItemDef[]> = {
  about: [
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 0.3], scale: 1.3, noCollide: true },
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 3.3], scale: 0.55, noCollide: true },
    // media wall: the TV itself is an interactive layout item above
    { model: `${KFURN}cabinet_medium.glb`, position: [0, 0, -3.42], scale: 0.8 },
    { model: `${KFURN}cabinet_small.glb`, position: [-2.1, 0, -3.42], scale: 0.8 },
    // seating group facing the TV around the coffee table
    { model: `${KFURN}table_low.glb`, position: [0, 0, -0.35] },
    { model: `${KFURN}couch.glb`, position: [0, 0, 1.55], rotationY: Math.PI, scale: 0.85 },
    { model: `${FURN}bear.glb`, position: [-0.85, 0.43, 1.6], rotationY: Math.PI, scale: 1.3, noCollide: true },
    { model: `${KFURN}armchair.glb`, position: [-3.6, 0, 0.5], rotationY: 2.2, scale: 0.85 },
    { model: `${KFURN}lamp_standing.glb`, position: [-4.35, 0, -1.0], scale: 0.8 },
    { model: `${KFURN}table_small.glb`, position: [3.7, 0, 1.0], scale: 0.7 },
    { model: `${KFURN}lamp_table.glb`, position: [3.7, 0.7, 1.0], scale: 0.5, noCollide: true },
    { model: `${KFURN}cactus_small_A.glb`, position: [-4.4, 0, 3.3], scale: 1.1 },
    { model: `${KFURN}cactus_small_B.glb`, position: [4.4, 0, 3.3], scale: 1.1 },
  ],
  education: [
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 0.5], scale: 1.3, noCollide: true },
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 3.3], scale: 0.55, noCollide: true },
    // study desk with its chair
    { model: `${KFURN}book_set.glb`, position: [-2.9, 0.975, -3.2], scale: 0.7, noCollide: true },
    { model: `${KFURN}lamp_table.glb`, position: [-1.4, 0.8, -3.4], scale: 0.5, noCollide: true },
    { model: `${KFURN}chair_A.glb`, position: [-2.2, 0, -2.0], rotationY: Math.PI + 0.15, scale: 0.82 },
    // library corner
    { model: `${FURN}bookcaseOpen.glb`, position: [4.0, 0, -3.5], scale: 2.4 },
    { model: `${FURN}bookcaseOpen.glb`, position: [2.0, 0, -3.5], scale: 2.4 },
    { model: `${KFURN}cactus_medium_A.glb`, position: [-4.2, 0, -3.3], scale: 1.1 },
    // reading nook on the right wall
    { model: `${KFURN}armchair.glb`, position: [3.8, 0, 0.9], rotationY: -Math.PI / 2 - 0.3, scale: 0.85 },
    { model: `${KFURN}lamp_standing.glb`, position: [4.4, 0, 2.5], scale: 0.8 },
    { model: `${KFURN}table_small.glb`, position: [4.3, 0, -1.0], scale: 0.7 },
    { model: `${KFURN}lamp_standing.glb`, position: [-4.35, 0, 2.6], scale: 0.8 },
  ],
  experience: [
    { model: `${KFURN}rug_rectangle_stripes_A.glb`, position: [0, 0.005, 0.3], scale: 1.3, noCollide: true },
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 3.3], scale: 0.55, noCollide: true },
    // workstation on the desk (desk top at y≈0.80)
    { model: `${FURN}computerScreen.glb`, position: [-2.2, 0.8, -3.4], scale: 1.8, noCollide: true },
    { model: `${FURN}computerKeyboard.glb`, position: [-2.2, 0.8, -2.8], scale: 1.8, noCollide: true },
    { model: `${FURN}laptop.glb`, position: [-3.2, 0.8, -3.0], rotationY: 0.3, scale: 2.0, noCollide: true },
    { model: `${KFURN}chair_A.glb`, position: [-2.2, 0, -2.0], rotationY: Math.PI - 0.2, scale: 0.82 },
    // cabinet with speakers
    { model: `${FURN}speaker.glb`, position: [2.0, 0.8, -3.45], scale: 1.4, noCollide: true },
    { model: `${FURN}speaker.glb`, position: [3.2, 0.8, -3.45], scale: 1.4, noCollide: true },
    { model: `${KFURN}cactus_small_A.glb`, position: [-4.4, 0, -3.3], scale: 1.1 },
    { model: `${KFURN}lamp_standing.glb`, position: [4.4, 0, -3.3], scale: 0.8 },
    // small meeting spot
    { model: `${KFURN}table_small.glb`, position: [3.7, 0, 0.9], scale: 0.9 },
    { model: `${KFURN}chair_B.glb`, position: [2.6, 0, 0.9], rotationY: Math.PI / 2, scale: 0.82 },
    { model: `${KFURN}chair_B.glb`, position: [3.7, 0, 2.0], rotationY: Math.PI + 0.3, scale: 0.82 },
    { model: `${KFURN}armchair.glb`, position: [-3.9, 0, 0.8], rotationY: Math.PI / 2, scale: 0.85 },
    { model: `${KFURN}lamp_standing.glb`, position: [-4.4, 0, 2.7], scale: 0.8 },
  ],
  skills: [
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 0.4], scale: 1.25, noCollide: true },
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 3.3], scale: 0.55, noCollide: true },
    // main workstation: long desk carrying screens, keyboard and chair
    { model: `${KFURN}table_medium_long.glb`, position: [-0.4, 0, -3.02], scale: 0.8 },
    { model: `${FURN}computerScreen.glb`, position: [0.4, 0.8, -3.3], scale: 1.9, noCollide: true },
    { model: `${FURN}computerKeyboard.glb`, position: [-0.4, 0.8, -2.75], scale: 1.9, noCollide: true },
    { model: `${KFURN}chair_C.glb`, position: [-0.4, 0, -2.0], rotationY: Math.PI + 0.1, scale: 0.82 },
    // AI cabinet and backend rack accessories
    { model: `${FURN}laptop.glb`, position: [4.2, 0.8, -3.42], scale: 2.0, noCollide: true },
    { model: `${KFURN}cactus_small_A.glb`, position: [-4.4, 0, -1.6], scale: 1.1 },
    // side workbench
    { model: `${KFURN}table_medium_long.glb`, position: [-4.04, 0, 0.9], rotationY: Math.PI / 2, scale: 0.8 },
    { model: `${FURN}laptop.glb`, position: [-4.0, 0.8, 0.9], rotationY: Math.PI / 2, scale: 2.0, noCollide: true },
    { model: `${KFURN}chair_stool.glb`, position: [-2.9, 0, 0.9], rotationY: -Math.PI / 2, scale: 1.0 },
    // retro TV corner
    { model: `${KFURN}cabinet_small.glb`, position: [4.44, 0, 1.4], rotationY: -Math.PI / 2, scale: 0.8 },
    { model: `${FURN}televisionVintage.glb`, position: [4.44, 0.8, 1.4], rotationY: -Math.PI / 2, scale: 2.1, noCollide: true },
    { model: `${KFURN}lamp_standing.glb`, position: [-4.4, 0, 2.7], scale: 0.8 },
  ],
  projects: [
    { model: `${KFURN}rug_oval_A.glb`, position: [0, 0.005, 0.4], scale: 1.25, noCollide: true },
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 3.3], scale: 0.55, noCollide: true },
    // exhibits on the three display tables (tops at y 0.8 / 0.9)
    { model: `${FURN}laptop.glb`, position: [-3.2, 0.8, -3.0], rotationY: 0.2, scale: 2.4, noCollide: true },
    { model: `${KFURN}book_set.glb`, position: [-3.9, 0.975, -2.6], scale: 0.5, noCollide: true },
    { model: `${FURN}computerScreen.glb`, position: [0, 0.9, -3.45], scale: 1.6, noCollide: true },
    { model: `${FURN}computerScreen.glb`, position: [3.2, 0.8, -3.3], scale: 1.9, noCollide: true },
    { model: `${FURN}computerKeyboard.glb`, position: [3.2, 0.8, -2.7], scale: 1.9, noCollide: true },
    // lounge area facing the exhibits
    { model: `${KFURN}couch.glb`, position: [-4.12, 0, 1.2], rotationY: Math.PI / 2, scale: 0.85 },
    { model: `${KFURN}table_low.glb`, position: [-2.45, 0, 1.2], rotationY: Math.PI / 2, scale: 0.8 },
    { model: `${KFURN}lamp_standing.glb`, position: [-4.4, 0, 3.0], scale: 0.8 },
    { model: `${KFURN}armchair.glb`, position: [3.9, 0, 0.7], rotationY: -Math.PI / 2, scale: 0.85 },
    { model: `${KFURN}lamp_standing.glb`, position: [4.4, 0, 2.5], scale: 0.8 },
    // storage boxes tucked in the front corner
    { model: `${FURN}cardboardBoxClosed.glb`, position: [4.45, 0, 3.4], scale: 1.6 },
    { model: `${FURN}cardboardBoxOpen.glb`, position: [3.85, 0, 3.45], scale: 1.5 },
    { model: `${KFURN}cactus_small_B.glb`, position: [-4.4, 0, -3.3], scale: 1.1 },
  ],
  contact: [
    { model: `${KFURN}rug_oval_A.glb`, position: [0, 0.005, 0.5], scale: 1.25, noCollide: true },
    { model: `${KFURN}rug_rectangle_A.glb`, position: [0, 0.005, 3.3], scale: 0.55, noCollide: true },
    // reception desk workstation (desk top at y≈0.80)
    { model: `${FURN}computerScreen.glb`, position: [0, 0.8, -3.3], scale: 1.9, noCollide: true },
    { model: `${FURN}computerKeyboard.glb`, position: [0, 0.8, -2.7], scale: 1.9, noCollide: true },
    { model: `${KFURN}lamp_table.glb`, position: [-0.95, 0.8, -3.4], scale: 0.5, noCollide: true },
    { model: `${KFURN}chair_A.glb`, position: [0, 0, -2.0], rotationY: Math.PI + 0.2, scale: 0.82 },
    // waiting corner
    { model: `${KFURN}armchair.glb`, position: [-3.7, 0, 0.3], rotationY: Math.PI / 2 + 0.4, scale: 0.85 },
    { model: `${KFURN}armchair.glb`, position: [3.7, 0, 0.3], rotationY: -Math.PI / 2 - 0.4, scale: 0.85 },
    { model: `${KFURN}table_small.glb`, position: [0, 0, 0.5], scale: 0.6 },
    { model: `${KFURN}lamp_standing.glb`, position: [-4.4, 0, -1.2], scale: 0.8 },
    { model: `${KFURN}lamp_standing.glb`, position: [4.4, 0, -1.2], scale: 0.8 },
    { model: `${KFURN}cactus_small_A.glb`, position: [-4.4, 0, -3.3], scale: 1.1 },
    { model: `${KFURN}cactus_small_B.glb`, position: [4.4, 0, -3.3], scale: 1.1 },
  ],
};
