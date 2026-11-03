import { aboutContent, contactContent, educationContent, experienceContent, PLAYER_NAME, PLAYER_ROLE, projectsContent, skillsContent } from "../../content";

export function downloadFile(name: string, content: BlobPart, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildCvText() {
  const lines: string[] = [PLAYER_NAME.toUpperCase(), PLAYER_ROLE, contactContent.email, ""];
  lines.push("ABOUT", ...aboutContent.paragraphs, "");
  lines.push("EXPERIENCE");
  experienceContent.entries.forEach((e) => {
    lines.push(`${e.role} — ${e.company} (${e.period})`, ...e.bullets.map((b) => `  • ${b}`), "");
  });
  lines.push("EDUCATION");
  educationContent.entries.forEach((e) => lines.push(`${e.school} — ${e.degree} (${e.period})`, `  ${e.details}`, ""));
  lines.push("SKILLS");
  skillsContent.groups.forEach((g) => lines.push(`${g.category}: ${g.items.join(", ")}`));
  lines.push("", "PROJECTS");
  projectsContent.entries.forEach((p) => lines.push(`${p.name}`, `  ${p.description}`, `  ${p.link}`));
  lines.push("", "CONTACT", ...contactContent.links.map((l) => `${l.label}: ${l.url}`));
  return lines.join("\n");
}

export function buildVCard() {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${PLAYER_NAME}`,
    `TITLE:${PLAYER_ROLE}`,
    "ORG:SMI — Société Le Monde Informatique",
    `EMAIL:${contactContent.email}`,
    `URL:${contactContent.links[0].url}`,
    "END:VCARD",
  ].join("\r\n");
}
