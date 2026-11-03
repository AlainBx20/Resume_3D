import { useState } from "react";
import { contactContent } from "../../content";

export default function MailApp() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Hello from your résumé town");
  const [message, setMessage] = useState("");

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    const body = `${message}\n\n— ${name || "A visitor"}`;
    window.location.href = `mailto:${contactContent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form className="pc-mail" onSubmit={send} onKeyDown={(event) => { if (event.key !== "Escape") event.stopPropagation(); }}>
      <div className="pc-mail-row"><span>To</span><b>{contactContent.email}</b></div>
      <label className="pc-mail-row">
        <span>From</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </label>
      <label className="pc-mail-row">
        <span>Subject</span>
        <input value={subject} onChange={(event) => setSubject(event.target.value)} />
      </label>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={contactContent.blurb}
        rows={6}
      />
      <div className="pc-mail-actions">
        <div className="pc-mail-links">
          {contactContent.links.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
          ))}
        </div>
        <button type="submit">Send ✉</button>
      </div>
    </form>
  );
}
