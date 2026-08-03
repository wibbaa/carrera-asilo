import { useEffect, useState } from "react";
import { supabase, COMPROBANTES_BUCKET } from "../lib/supabase";
import { MODALIDADES } from "../lib/eventConfig";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargandoSesion(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (cargandoSesion) return null;
  return session ? <Panel /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Correo o contraseña incorrectos.");
    setCargando(false);
  }

  return (
    <div className="container" style={{ maxWidth: 380, padding: "90px 20px" }}>
      <h1 style={{ fontSize: 30 }}>Admin</h1>
      <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
        Acceso solo para el equipo organizador.
      </p>
      <form onSubmit={handleLogin} style={{ marginTop: 28 }}>
        <div className="field">
          <label>Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="field-error" style={{ marginBottom: 14 }}>{error}</div>}
        <button className="btn btn-primary btn-block" disabled={cargando}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function Panel() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroModalidad, setFiltroModalidad] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroWhatsApp, setFiltroWhatsApp] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    setCargando(true);
    const { data, error } = await supabase
      .from("registros")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRegistros(data ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function verComprobante(path) {
    const { data, error } = await supabase.storage
      .from(COMPROBANTES_BUCKET)
      .createSignedUrl(path, 60 * 5);
    if (!error && data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function actualizarEstado(id, estado) {
    setRegistros((rs) => rs.map((r) => (r.id === id ? { ...r, estado } : r)));
    const { error } = await supabase.from("registros").update({ estado }).eq("id", id);
    if (error) cargar(); // revertir si falla
  }

  async function toggleWhatsAppVerificado(id, valorActual) {
    const nuevo = !valorActual;
    setRegistros((rs) => rs.map((r) => (r.id === id ? { ...r, whatsapp_verificado: nuevo } : r)));
    const { error } = await supabase.from("registros").update({ whatsapp_verificado: nuevo }).eq("id", id);
    if (error) cargar(); // revertir si falla
  }

  const filtrados = registros.filter((r) => {
    if (filtroModalidad !== "todas" && r.modalidad !== filtroModalidad) return false;
    if (filtroEstado !== "todos" && r.estado !== filtroEstado) return false;
    if (filtroWhatsApp === "verificados" && !r.whatsapp_verificado) return false;
    if (filtroWhatsApp === "no_verificados" && r.whatsapp_verificado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const blob = `${r.folio} ${r.nombre} ${r.apellidos} ${r.telefono}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });

  const totales = {
    total: registros.length,
    confirmados: registros.filter((r) => r.estado === "confirmado").length,
    pendientes: registros.filter((r) => r.estado === "pendiente").length,
    whatsappVerificados: registros.filter((r) => r.whatsapp_verificado).length,
  };

  return (
    <div className="container" style={{ padding: "40px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 30 }}>Registros</h1>
        <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <Stat label="Total" val={totales.total} />
        <Stat label="Confirmados" val={totales.confirmados} color="var(--lime)" />
        <Stat label="Pendientes" val={totales.pendientes} color="var(--gold)" />
        <Stat label="WhatsApp verificado" val={totales.whatsappVerificados} color="var(--cyan)" />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por folio, nombre, teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="todas">Todas las modalidades</option>
          {Object.values(MODALIDADES).map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <select value={filtroWhatsApp} onChange={(e) => setFiltroWhatsApp(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="todos">WhatsApp: todos</option>
          <option value="verificados">WhatsApp verificado</option>
          <option value="no_verificados">WhatsApp sin verificar</option>
        </select>
      </div>

      <div style={{ overflowX: "auto", marginTop: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
              {["Folio", "Modalidad", "Nombre", "Teléfono", "Pago", "Comprobante", "Estado", "WhatsApp", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={9} style={{ padding: 20, color: "var(--muted)" }}>Cargando...</td></tr>
            )}
            {!cargando && filtrados.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 20, color: "var(--muted)" }}>Sin resultados.</td></tr>
            )}
            {filtrados.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 800, color: "var(--lime)" }}>{r.folio}</td>
                <td style={{ padding: "10px 12px" }}>{MODALIDADES[r.modalidad]?.nombre ?? r.modalidad}</td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.nombre} {r.apellidos}</td>
                <td style={{ padding: "10px 12px" }}>{r.telefono}</td>
                <td style={{ padding: "10px 12px" }}>{r.metodo_pago === "transferencia" ? "SPEI" : "Pañales"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => verComprobante(r.comprobante_path)}>
                    Ver
                  </button>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <EstadoBadge estado={r.estado} />
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                    {r.whatsapp_verificado ? (
                      <span style={{ color: "var(--lime)", fontWeight: 700, fontSize: 12.5 }}>● Verificado</span>
                    ) : r.whatsapp_click_at ? (
                      <span style={{ color: "var(--gold)", fontSize: 12.5 }}>Envió mensaje</span>
                    ) : (
                      <span style={{ color: "var(--muted-2)", fontSize: 12.5 }}>Sin enviar</span>
                    )}
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 11.5 }}
                      onClick={() => toggleWhatsAppVerificado(r.id, r.whatsapp_verificado)}
                    >
                      {r.whatsapp_verificado ? "Quitar" : "Verificar"}
                    </button>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-lime"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    disabled={r.estado === "confirmado"}
                    onClick={() => actualizarEstado(r.id, "confirmado")}
                  >
                    Confirmar
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    disabled={r.estado === "rechazado"}
                    onClick={() => actualizarEstado(r.id, "rechazado")}
                  >
                    Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, val, color = "var(--text)" }) {
  return (
    <div className="card" style={{ padding: "14px 20px", minWidth: 110 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color }}>{val}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    confirmado: { color: "var(--lime)", label: "Confirmado" },
    pendiente: { color: "var(--gold)", label: "Pendiente" },
    rechazado: { color: "var(--pink)", label: "Rechazado" },
  };
  const s = map[estado] ?? map.pendiente;
  return (
    <span style={{ color: s.color, fontWeight: 700, fontSize: 12.5 }}>
      ● {s.label}
    </span>
  );
}
