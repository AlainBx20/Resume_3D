import { useState } from "react";
import {
  aboutContent,
  contactContent,
  PLAYER_NAME,
  projectsContent,
  skillsContent,
} from "../../content";
import { useTownStore } from "../../store";
import { buildCvText, buildVCard, downloadFile } from "./files";

interface FileEntry {
  name: string;
  folder: string;
  content: string;
  download?: { name: string; type: string };
}

const FILES: FileEntry[] = [
  { name: "README.txt", folder: "Home", content: aboutContent.paragraphs.join("\n\n") },
  { name: "Alaa_CV.txt", folder: "Home", content: buildCvText(), download: { name: "Alaa_Ben_Chouikha_CV.txt", type: "text/plain" } },
  { name: "skills.json", folder: "Home", content: JSON.stringify(skillsContent.groups, null, 2) },
  {
    name: "contact.vcf",
    folder: "Home",
    content: buildVCard(),
    download: { name: `${PLAYER_NAME.replace(/\s+/g, "_")}.vcf`, type: "text/vcard" },
  },
  ...projectsContent.entries.map((p) => ({
    name: `${p.name.split(" — ")[0].replace(/[^\w]+/g, "_")}.md`,
    folder: "Projects",
    content: `# ${p.name}\n\n${p.description}\n\n${p.link}`,
  })),
  { name: "email.txt", folder: "Home", content: contactContent.email },
];

const FOLDERS = ["Home", "Projects"];

export default function FilesApp() {
  const [folder, setFolder] = useState("Home");
  const [selected, setSelected] = useState(FILES[0].name);
  const file = FILES.find((f) => f.name === selected) ?? FILES[0];

  const save = () => {
    if (!file.download) return;
    downloadFile(file.download.name, file.content, file.download.type);
    useTownStore.getState().unlock("file-hoarder");
    useTownStore.getState().showToast(`⬇ Downloaded ${file.download.name}`);
  };

  return (
    <div className="pc-files">
      <aside>
        {FOLDERS.map((f) => (
          <button key={f} type="button" className={folder === f ? "active" : ""} onClick={() => { setFolder(f); setSelected(FILES.find((x) => x.folder === f)!.name); }}>
            📁 {f}
          </button>
        ))}
        <hr />
        {FILES.filter((f) => f.folder === folder).map((f) => (
          <button key={f.name} type="button" className={selected === f.name ? "active" : ""} onClick={() => setSelected(f.name)}>
            📄 {f.name}
          </button>
        ))}
      </aside>
      <main>
        <div className="pc-files-bar">
          <b>{file.name}</b>
          {file.download && <button type="button" onClick={save}>⬇ Download</button>}
        </div>
        <pre>{file.content}</pre>
      </main>
    </div>
  );
}
