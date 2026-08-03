import { Link } from "react-router-dom";
import { EVENT, MODALIDADES } from "../lib/eventConfig";
import { useCountdown } from "../lib/useCountdown";

export default function Home() {
  const t = useCountdown(EVENT.fecha);

  return (
    <>
      {/* HERO */}
      <section style={{ padding: "64px 0 40px" }}>
        <div className="container">
          <span className="eyebrow">Una sola noche · Dos experiencias · Una gran causa</span>
          <h1
            style={{
              fontSize: "clamp(40px, 8vw, 84px)",
              marginTop: 14,
              background: "linear-gradient(95deg, var(--pink), var(--gold) 55%, var(--lime))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {EVENT.nombre}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 17, maxWidth: 560, marginTop: 18 }}>
            Corremos por quienes nos dieron tanto amor. Todo lo recaudado se destina al{" "}
            <strong style={{ color: "var(--text)" }}>{EVENT.causa}</strong>. Camina, corre y
            pedalea — porque rendirse no es opción.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 30 }}>
            <Link to="/registro" className="btn btn-primary">
              Quiero inscribirme →
            </Link>
            <a href="#modalidades" className="btn btn-ghost">
              Ver modalidades
            </a>
          </div>

          {/* Countdown */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 44,
              flexWrap: "wrap",
            }}
          >
            {[
              ["Días", t.days],
              ["Horas", t.hours],
              ["Min", t.minutes],
              ["Seg", t.seconds],
            ].map(([label, val]) => (
              <div
                key={label}
                className="card"
                style={{ padding: "14px 18px", minWidth: 76, textAlign: "center" }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--lime)" }}>
                  {String(val).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFO STRIP */}
      <section style={{ padding: "20px 0" }}>
        <div className="container">
          <div
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 0,
            }}
          >
            {[
              ["📅", "Fecha", EVENT.fechaTexto],
              ["🕖", "Hora", EVENT.horaTexto],
              ["📍", "Sede", EVENT.sede],
              ["📲", "Informes", EVENT.contactoTexto],
            ].map(([icon, label, val], i) => (
              <div
                key={label}
                style={{
                  padding: "22px 20px",
                  borderRight: i < 3 ? "1px solid var(--line)" : "none",
                }}
              >
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6 }}>
                  {label}
                </div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODALIDADES */}
      <section id="modalidades" style={{ padding: "56px 0 20px" }}>
        <div className="container">
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)" }}>Elige tu modalidad</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginTop: 26,
            }}
          >
            {Object.values(MODALIDADES).map((m) => (
              <div key={m.id} className="card" style={{ padding: 26 }}>
                <span className="eyebrow" style={{ color: m.id === "4k" ? "var(--cyan)" : "var(--pink)" }}>
                  {m.id === "4k" ? "Para todos los runners" : "Diversión total"}
                </span>
                <h3 style={{ fontSize: 26, marginTop: 10 }}>{m.nombre}</h3>
                <p style={{ color: "var(--gold)", fontWeight: 800, marginTop: 10, fontSize: 15 }}>
                  {m.precioTexto}
                </p>
                <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", color: "var(--muted)", fontSize: 14.5 }}>
                  {m.incluye.map((item) => (
                    <li key={item} style={{ padding: "5px 0", display: "flex", gap: 8 }}>
                      <span style={{ color: "var(--lime)" }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/registro?modalidad=${m.id}`}
                  className="btn btn-block"
                  style={{
                    marginTop: 22,
                    background: m.id === "4k" ? "var(--cyan)" : "var(--pink)",
                    color: "#0a0a12",
                  }}
                >
                  Inscribirme a {m.nombre}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAUSA */}
      <section style={{ padding: "56px 0" }}>
        <div className="container">
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <span className="eyebrow" style={{ justifyContent: "center" }}>¿Por qué corremos?</span>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", marginTop: 12 }}>
              Cada paso ayuda al {EVENT.causa}
            </h2>
            <p style={{ color: "var(--muted)", maxWidth: 520, margin: "14px auto 0" }}>
              Todo lo recaudado será destinado a apoyar a nuestros adultos mayores. Corre con
              el corazón — transforma vidas.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
