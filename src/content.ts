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
    { model: `${FURN}desk.glb`, position: [-2.5, 0, -3], label: "Bachelor's — ICT" },
    { model: `${FURN}bookcaseClosedWide.glb`, position: [2.5, 0, -3.3], rotationY: Math.PI, label: "Baccalaureate" },
  ],
  experience: [
    { model: `${FURN}desk.glb`, position: [-2.5, 0, -3], label: "Software Developer — SMI" },
    { model: `${FURN}sideTableDrawers.glb`, position: [2.8, 0, -3], label: "Networking Intern" },
  ],
  skills: [
    { model: `${FURN}bookcaseOpenLow.glb`, position: [-3.6, 0, -3.3], rotationY: Math.PI, label: "Languages" },
    { model: `${FURN}computerScreen.glb`, position: [-1.2, 0, -3.3], rotationY: Math.PI, label: "Frontend" },
    { model: `${FURN}kitchenCabinetDrawer.glb`, position: [1.2, 0, -3.3], rotationY: Math.PI, label: "Backend" },
    { model: `${FURN}cabinetTelevision.glb`, position: [3.6, 0, -3.3], rotationY: Math.PI, label: "AI" },
  ],
  projects: [
    { model: `${FURN}tableCoffee.glb`, position: [-3, 0, -2.8], label: "Huda AI" },
    { model: `${FURN}tableRound.glb`, position: [0, 0, -3.2], label: "AI Maze" },
    { model: `${FURN}tableGlass.glb`, position: [3, 0, -2.8], label: "Lung Disease ML" },
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
