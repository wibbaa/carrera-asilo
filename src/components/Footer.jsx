import { EVENT } from "../lib/eventConfig";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "28px 0", marginTop: 60 }}>
      <div
        className="container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        <span>
          Por ellos, por nosotros, por todos 💗 — a beneficio del {EVENT.causa}
        </span>
        <a
          href={`https://wa.me/${EVENT.contactoWhatsApp}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--lime)", fontWeight: 700, textDecoration: "none" }}
        >
          WhatsApp: {EVENT.contactoTexto}
        </a>
      </div>
    </footer>
  );
}
