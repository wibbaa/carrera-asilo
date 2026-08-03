import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { EVENT, MODALIDADES } from "../lib/eventConfig";

export default function Confirmacion() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [registro, setRegistro] = useState(state?.registro ?? null);
  const [buscando, setBuscando] = useState(!state?.registro);

  // Si recargan la página perdemos el state; intentamos recuperar por folio en la URL (?folio=)
  useEffect(() => {
    if (registro) return;
    const folio = new URLSearchParams(window.location.search).get("folio");
    if (!folio) {
      setBuscando(false);
      return;
    }
    supabase
      .from("registros_publicos")
      .select("*")
      .eq("folio", folio)
      .maybeSingle()
      .then(({ data }) => {
        setRegistro(data);
        setBuscando(false);
      });
  }, [registro]);

  if (buscando) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center", color: "var(--muted)" }}>
        Cargando tu folio...
      </div>
    );
  }

  if (!registro) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>No encontramos tu registro</h2>
        <p style={{ color: "var(--muted)", marginTop: 10 }}>
          Si acabas de registrarte, revisa el enlace o vuelve a intentarlo.
        </p>
        <Link to="/registro" className="btn btn-primary" style={{ marginTop: 20 }}>
          Ir al registro
        </Link>
      </div>
    );
  }

  const modalidad = MODALIDADES[registro.modalidad];

  // Mensaje para invitar amigos (compartir libre, sin destinatario fijo)
  const mensajeInvitacion = encodeURIComponent(
    `¡Ya me registré para el ${EVENT.nombre}! 🏃 Mi folio es ${registro.folio} — modalidad ${modalidad.nombre}. ¡Nos vemos el ${EVENT.fechaTexto} en la ${EVENT.sede}! 💗`
  );

  // Mensaje de verificación: lo manda el propio usuario al número del
  // evento, con sus datos, para que el equipo lo cruce con el panel admin.
  const mensajeVerificacion = encodeURIComponent(
    `Hola, quiero verificar mi inscripción a ${EVENT.nombre}.\n` +
      `Folio: ${registro.folio}\n` +
      `Nombre: ${registro.nombre} ${registro.apellidos}\n` +
      `Modalidad: ${modalidad.nombre}\n` +
      `Teléfono: ${registro.telefono ?? ""}`
  );

  async function confirmarPorWhatsApp() {
    // Best effort: guardamos el intento de clic, no bloqueamos la apertura de WhatsApp si falla.
    try {
      await supabase.rpc("marcar_whatsapp_click", { p_folio: registro.folio });
    } catch (err) {
      console.error(err);
    }
    window.open(`https://wa.me/${EVENT.contactoWhatsApp}?text=${mensajeVerificacion}`, "_blank");
  }

  return (
    <section style={{ padding: "56px 0 80px" }}>
      <div className="container" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            ¡Registro recibido!
          </span>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 38px)", marginTop: 10 }}>
            Nos vemos en la línea de salida
          </h1>
        </div>

        {/* Ticket estilo dorsal de corredor */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            border: "1.5px solid var(--lime)",
            boxShadow: "0 0 40px -10px var(--lime-dim)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(100deg, var(--pink), var(--gold))",
              padding: "14px 24px",
              color: "#0a0a12",
              fontWeight: 800,
              fontSize: 13,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{EVENT.organiza.toUpperCase()}</span>
            <span>{modalidad.nombre.toUpperCase()}</span>
          </div>

          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Tu folio
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(56px, 14vw, 84px)",
                color: "var(--lime)",
                lineHeight: 1,
                margin: "8px 0",
              }}
            >
              {registro.folio}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>
              {registro.nombre} {registro.apellidos}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 24,
                textAlign: "left",
              }}
            >
              <TicketDato label="Fecha" val={EVENT.fechaTexto} />
              <TicketDato label="Hora" val={EVENT.horaTexto} />
              <TicketDato label="Sede" val={EVENT.sede} span />
              <TicketDato
                label="Estado de pago"
                val={registro.estado === "confirmado" ? "Confirmado ✓" : "Pendiente de confirmar"}
                span
              />
            </div>
          </div>
        </div>

        {/* Paso clave: el usuario envía sus datos por WhatsApp para verificación */}
        <div className="card" style={{ padding: 22, marginTop: 20, border: "1.5px solid var(--pink)" }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>📲 Último paso: confirma por WhatsApp</div>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 8 }}>
            Para verificar tu inscripción más rápido, mándanos tus datos por WhatsApp — se abre
            el mensaje ya escrito, solo dale enviar.
          </p>
          <button onClick={confirmarPorWhatsApp} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
            Confirmar mis datos por WhatsApp
          </button>
        </div>

        <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 18, textAlign: "center" }}>
          Guarda una captura de este folio. Nuestro equipo revisará tu comprobante y tu mensaje
          de WhatsApp para confirmar tu lugar — si tienes dudas, escríbenos al{" "}
          {EVENT.contactoTexto}.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
          <a
            href={`https://wa.me/?text=${mensajeInvitacion}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-lime btn-block"
          >
            Invitar a un amigo
          </a>
          <Link to="/" className="btn btn-ghost btn-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}

function TicketDato({ label, val, span }) {
  return (
    <div style={{ gridColumn: span ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{val}</div>
    </div>
  );
}
