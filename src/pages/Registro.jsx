import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, COMPROBANTES_BUCKET } from "../lib/supabase";
import { EVENT, MODALIDADES, PREFIJOS_TELEFONO } from "../lib/eventConfig";

const initialForm = {
  modalidad: "4k",
  nombre: "",
  apellidos: "",
  telefonoPrefijo: "+52",
  telefono: "",
  edad: "",
};

const PASOS = [
  { n: 1, label: "Tus datos" },
  { n: 2, label: "Pago" },
  { n: 3, label: "Tu folio" },
];

export default function Registro() {
  const [params] = useSearchParams();
  const preModalidad = params.get("modalidad");

  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    ...initialForm,
    modalidad: preModalidad && MODALIDADES[preModalidad] ? preModalidad : "4k",
  });
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [registro, setRegistro] = useState(null);

  const modalidad = MODALIDADES[form.modalidad];

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function validarPaso1() {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = "Escribe tu nombre.";
    if (!form.apellidos.trim()) errs.apellidos = "Escribe tus apellidos.";
    const prefijo = PREFIJOS_TELEFONO.find((p) => p.code === form.telefonoPrefijo);
    const digitosEsperados = prefijo?.digitos ?? 10;
    if (!new RegExp(`^\\d{${digitosEsperados}}$`).test(form.telefono.replace(/\s/g, "")))
      errs.telefono = `Teléfono a ${digitosEsperados} dígitos.`;
    if (!form.edad || Number(form.edad) < 5 || Number(form.edad) > 99)
      errs.edad = "Edad entre 5 y 99 años.";
    setErrores(errs);
    return Object.keys(errs).length === 0;
  }

  function validarPaso2() {
    const errs = {};
    if (!archivo) {
      errs.archivo = "Sube tu comprobante para continuar.";
    } else if (archivo.size > 10 * 1024 * 1024) {
      errs.archivo = "El archivo pesa más de 10 MB, sube uno más ligero.";
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  }

  function irAPaso2() {
    if (validarPaso1()) {
      setErrores({});
      setPaso(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function volverAPaso1() {
    setErrores({});
    setPaso(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmarRegistro(e) {
    e.preventDefault();
    setErrorGeneral("");
    if (!validarPaso2()) return;

    setEnviando(true);
    try {
      // 1) Genera folio atómico vía función RPC en Supabase (ver supabase/schema.sql)
      const { data: folioData, error: folioError } = await supabase.rpc(
        "generar_folio",
        { p_modalidad: form.modalidad }
      );
      if (folioError) throw folioError;
      const folio = folioData;

      // 2) Sube el comprobante al bucket de storage — esto es lo que "verifica"
      //    que el archivo se subió bien antes de mostrar el folio.
      const ext = archivo.name.split(".").pop();
      const path = `${form.modalidad}/${folio}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(COMPROBANTES_BUCKET)
        .upload(path, archivo, { upsert: false });
      if (uploadError) throw uploadError;

      // 3) Inserta el registro
      const { data: inserted, error: insertError } = await supabase
        .from("registros")
        .insert({
          folio,
          modalidad: form.modalidad,
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          telefono: `${form.telefonoPrefijo}${form.telefono.replace(/\s/g, "").trim()}`,
          edad: Number(form.edad),
          metodo_pago: modalidad.metodoPago,
          comprobante_path: path,
          estado: "pendiente",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // Solo hasta aquí, con el comprobante subido y el registro guardado,
      // pasamos al paso 3 (folio + botón de WhatsApp).
      setRegistro(inserted);
      setPaso(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setErrorGeneral(
        "No pudimos completar tu registro. Verifica tu conexión e intenta de nuevo. Si el problema sigue, escríbenos por WhatsApp."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section style={{ padding: "48px 0 80px" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <span className="eyebrow">Registro oficial</span>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 44px)", marginTop: 10 }}>
          Aparta tu lugar
        </h1>

        <PasosIndicador pasoActual={paso} />

        {paso === 1 && (
          <Paso1Datos
            form={form}
            setForm={setForm}
            update={update}
            errores={errores}
            onContinuar={irAPaso2}
          />
        )}

        {paso === 2 && (
          <Paso2Pago
            modalidad={modalidad}
            archivo={archivo}
            setArchivo={setArchivo}
            errores={errores}
            errorGeneral={errorGeneral}
            enviando={enviando}
            onVolver={volverAPaso1}
            onSubmit={confirmarRegistro}
          />
        )}

        {paso === 3 && registro && <Paso3Folio registro={registro} />}
      </div>
    </section>
  );
}

function PasosIndicador({ pasoActual }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 26, marginBottom: 10 }}>
      {PASOS.map((p, i) => (
        <div key={p.n} style={{ flex: 1 }}>
          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: p.n <= pasoActual ? "var(--lime)" : "var(--line)",
              transition: "background 0.2s ease",
            }}
          />
          <div
            style={{
              fontSize: 11.5,
              marginTop: 6,
              color: p.n <= pasoActual ? "var(--text)" : "var(--muted-2)",
              fontWeight: p.n === pasoActual ? 800 : 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {p.n}. {p.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Paso1Datos({ form, setForm, update, errores, onContinuar }) {
  return (
    <div style={{ marginTop: 24 }}>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Elige tu modalidad y cuéntanos quién corre.
      </p>

      <div className="field">
        <label>Modalidad</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {Object.values(MODALIDADES).map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setForm((f) => ({ ...f, modalidad: m.id }))}
              className="card"
              style={{
                padding: "16px 14px",
                textAlign: "left",
                cursor: "pointer",
                borderColor: form.modalidad === m.id ? "var(--lime)" : "var(--line)",
                background: form.modalidad === m.id ? "var(--lime-dim)" : "var(--bg-card)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 15 }}>{m.nombre}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
                {m.precioTexto}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="field">
          <label>Nombre(s)</label>
          <input type="text" value={form.nombre} onChange={update("nombre")} placeholder="Wil" />
          {errores.nombre && <div className="field-error">{errores.nombre}</div>}
        </div>
        <div className="field">
          <label>Apellidos</label>
          <input type="text" value={form.apellidos} onChange={update("apellidos")} placeholder="García" />
          {errores.apellidos && <div className="field-error">{errores.apellidos}</div>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="field">
          <label>Teléfono</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={form.telefonoPrefijo}
              onChange={update("telefonoPrefijo")}
              style={{ width: 92, flexShrink: 0, paddingInline: 8 }}
            >
              {PREFIJOS_TELEFONO.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.bandera} {p.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={form.telefono}
              onChange={update("telefono")}
              placeholder="6311234567"
              style={{ flex: 1 }}
            />
          </div>
          {errores.telefono && <div className="field-error">{errores.telefono}</div>}
        </div>
        <div className="field">
          <label>Edad</label>
          <input type="number" value={form.edad} onChange={update("edad")} placeholder="28" />
          {errores.edad && <div className="field-error">{errores.edad}</div>}
        </div>
      </div>

      <button type="button" onClick={onContinuar} className="btn btn-primary btn-block">
        Continuar →
      </button>

      <p style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 14, textAlign: "center" }}>
        Dudas? Escríbenos por WhatsApp al {EVENT.contactoTexto}
      </p>
    </div>
  );
}

function Paso2Pago({ modalidad, archivo, setArchivo, errores, errorGeneral, enviando, onVolver, onSubmit }) {
  return (
    <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
      <p style={{ color: "var(--muted)", marginBottom: 20 }}>
        Ya casi — solo falta tu {modalidad.id === "4k" ? "pago" : "donación"}.
      </p>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
          {modalidad.id === "4k" ? "💳 Cómo pagar" : "🎁 Cómo participar"}
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13.5, margin: 0 }}>
          {modalidad.descripcionPago}
        </p>

        {modalidad.id === "4k" && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: "#05070f",
              borderRadius: 10,
              fontSize: 13.5,
              color: "var(--muted)",
            }}
          >
            Banco: <strong style={{ color: "var(--text)" }}>BBVA México</strong> · CLABE:{" "}
            <strong style={{ color: "var(--text)" }}>0127 7800 1556 200233</strong> · A nombre de:{" "}
            <strong style={{ color: "var(--text)" }}>Asilo de Ancianos Franciscano</strong>
          </div>
        )}

        <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
          <label>
            {modalidad.id === "4k" ? "Comprobante de transferencia" : "Foto de los paquetes de pañal"}
          </label>
          <label
            className={`file-drop ${archivo ? "has-file" : ""}`}
            style={{ display: "block", marginTop: 4 }}
          >
            {archivo ? `✓ ${archivo.name}` : "Toca para subir una imagen o PDF"}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
          </label>
          {errores.archivo && <div className="field-error">{errores.archivo}</div>}
        </div>
      </div>

      {errorGeneral && (
        <div className="field-error" style={{ margin: "16px 0" }}>
          {errorGeneral}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button type="button" onClick={onVolver} className="btn btn-ghost" disabled={enviando}>
          ← Atrás
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={enviando}>
          {enviando ? "Verificando y generando folio..." : "Confirmar mi registro"}
        </button>
      </div>
    </form>
  );
}

function Paso3Folio({ registro }) {
  const modalidad = MODALIDADES[registro.modalidad];

  const mensajeVerificacion = encodeURIComponent(
    `Hola, quiero verificar mi inscripción a ${EVENT.nombre}.\n` +
      `Folio: ${registro.folio}\n` +
      `Nombre: ${registro.nombre} ${registro.apellidos}\n` +
      `Modalidad: ${modalidad.nombre}\n` +
      `Teléfono: ${registro.telefono ?? ""}`
  );

  const mensajeInvitacion = encodeURIComponent(
    `¡Ya me registré para el ${EVENT.nombre}! 🏃 Mi folio es ${registro.folio} — modalidad ${modalidad.nombre}. ¡Nos vemos el ${EVENT.fechaTexto} en la ${EVENT.sede}! 💗`
  );

  async function confirmarPorWhatsApp() {
    try {
      await supabase.rpc("marcar_whatsapp_click", { p_folio: registro.folio });
    } catch (err) {
      console.error(err);
    }
    window.open(`https://wa.me/${EVENT.contactoWhatsApp}?text=${mensajeVerificacion}`, "_blank");
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>¡Comprobante recibido!</span>
        <h2 style={{ fontSize: "clamp(24px, 5vw, 32px)", marginTop: 8 }}>
          Este es tu folio, bien perron
        </h2>
      </div>

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
            <TicketDato label="Estado de pago" val="Pendiente de confirmar" span />
          </div>
        </div>
      </div>

      {/* Solo se habilita hasta que ya existe el folio (paso 3) */}
      <div className="card" style={{ padding: 22, marginTop: 20, border: "1.5px solid var(--pink)" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>📲 Último paso: confirma por WhatsApp</div>
        <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 8 }}>
          Para verificar tu inscripción más rápido, mándanos tus datos por WhatsApp — se abre el
          mensaje ya escrito, solo dale enviar.
        </p>
        <button onClick={confirmarPorWhatsApp} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
          Confirmar mis datos por WhatsApp
        </button>
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 18, textAlign: "center" }}>
        Guarda una captura de este folio. Nuestro equipo revisará tu comprobante y tu mensaje de
        WhatsApp para confirmar tu lugar — si tienes dudas, escríbenos al {EVENT.contactoTexto}.
      </p>

      <a
        href={`https://wa.me/?text=${mensajeInvitacion}`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-lime btn-block"
        style={{ marginTop: 20 }}
      >
        Invitar a un amigo
      </a>
    </div>
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
