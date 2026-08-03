import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        padding: "16px 0",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "#080b1acc",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--pink), var(--gold))",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-display)",
              fontSize: 13,
              color: "#0a0a12",
              flexShrink: 0,
            }}
          >
            AL
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.02em" }}>
            Altruistamente Locos
          </span>
        </Link>
        <Link to="/registro" className="btn btn-lime" style={{ padding: "10px 18px", fontSize: 13 }}>
          Inscríbete
        </Link>
      </div>
    </header>
  );
}
