// Datos del evento — edita aquí si algo cambia y se actualiza en toda la app.
export const EVENT = {
  nombre: "4K con Causa + Carrera de Botargas",
  organiza: "Nogales Altruistamente Locos",
  causa: "Asilo de Ancianos Franciscano I.A.P.",
  fecha: "2026-08-21T19:00:00-07:00", // Viernes 21 de agosto, 7:00 p.m. (hora Sonora, sin horario de verano)
  fechaTexto: "Viernes 21 de agosto",
  horaTexto: "7:00 p.m.",
  sede: "Unidad Deportiva Estrellas Nogalenses",
  contactoWhatsApp: "526311772209", // formato internacional para wa.me
  contactoTexto: "631 177 2209",
};

export const PREFIJOS_TELEFONO = [
  { code: "+52", pais: "MX", bandera: "🇲🇽", digitos: 10 },
  { code: "+1", pais: "US", bandera: "🇺🇸", digitos: 10 },
];

export const MODALIDADES = {
  "4k": {
    id: "4k",
    nombre: "4K con Causa",
    prefijoFolio: "4K",
    precioTexto: "$200 MXN",
    metodoPago: "transferencia",
    incluye: ["Número de corredor", "Hidratación", "Ambiente increíble"],
    descripcionPago:
      "Realiza tu transferencia SPEI por $200 MXN y sube tu comprobante de pago.",
  },
  botargas: {
    id: "botargas",
    nombre: "Carrera de Botargas",
    prefijoFolio: "BOT",
    precioTexto: "2 paquetes de pañal para adulto (marca TENA, talla L)",
    metodoPago: "panales",
    incluye: ["Número de participante", "Hidratación", "Mucha diversión"],
    descripcionPago:
      "Tu inscripción es en especie: 2 paquetes de pañal para adulto, marca TENA talla L. Sube una foto de los paquetes que vas a donar — la entrega física se confirma el día del evento.",
  },
};
