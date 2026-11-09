// ---------- Motor de entrenamiento ----------
// Funciones que solo calculan: reciben datos y devuelven resultados,
// sin tocar la pantalla. Así se pueden probar y cambiar sin miedo.

// Series × reps de cada tipo de ejercicio según el objetivo del perfil,
// y duración del WOD en minutos (mínimo, máximo).
const OBJETIVOS = {
  general: {
    nombre: "Forma física general",
    principal: [5, 5], haltero: [5, 3], gimnastico: [4, 8], accesorio: [3, 10], metabolico: [3, 12],
    wodMin: [10, 14],
  },
  fuerza: {
    nombre: "Ganar fuerza",
    principal: [5, 3], haltero: [6, 2], gimnastico: [5, 5], accesorio: [3, 8], metabolico: [3, 10],
    wodMin: [6, 10],
  },
  musculo: {
    nombre: "Ganar músculo",
    principal: [4, 8], haltero: [4, 3], gimnastico: [4, 10], accesorio: [3, 12], metabolico: [3, 15],
    wodMin: [8, 12],
  },
  resistencia: {
    nombre: "Resistencia",
    principal: [3, 12], haltero: [4, 3], gimnastico: [3, 12], accesorio: [3, 15], metabolico: [3, 20],
    wodMin: [15, 20],
  },
};

// Cuánto cuenta hoy un entreno de hace N días (posición 0 = hoy).
// Un músculo necesita unas 48-72 h para recuperarse; a los 7 días ya no cuenta.
const RECUPERACION = [1, 1, 0.7, 0.5, 0.3, 0.2, 0.1];

// Carga a partir de la cual un músculo está "media" o "alta".
// Una sentadilla 5×5 ayer deja el cuádriceps en 5 (media).
// Si además hiciste thrusters, pasa de 8 (alta) y hoy no se propone.
const UMBRAL_MEDIO = 4;
const UMBRAL_ALTO = 8;

// Huecos del bloque de fuerza: qué tipos de ejercicio valen en cada uno.
const HUECOS_FUERZA = [
  ["principal", "haltero"],
  ["principal", "haltero", "gimnastico"],
  ["accesorio", "gimnastico"],
];

const FORMATOS_WOD = ["AMRAP", "EMOM", "Por tiempo"];

// ---------- Fechas ("AAAA-MM-DD" en hora local) ----------

function dosCifras(n) {
  return String(n).padStart(2, "0");
}

function fechaISO(d) {
  return d.getFullYear() + "-" + dosCifras(d.getMonth() + 1) + "-" + dosCifras(d.getDate());
}

function fechaDesdeISO(texto) {
  const [a, m, d] = texto.split("-").map(Number);
  return new Date(a, m - 1, d);
}

function diasEntre(fechaTexto, hoy) {
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((inicioHoy - fechaDesdeISO(fechaTexto)) / 86400000);
}

// ---------- Azar ----------

function aleatorioEntre(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ---------- Carga muscular ----------

function factorEsfuerzo(esfuerzo) {
  return esfuerzo ? esfuerzo / 80 : 1;
}

function sumarCarga(fatiga, ejercicio, cantidad) {
  for (const m of ejercicio.musculos) {
    fatiga[m] += cantidad;
  }
  for (const m of ejercicio.secundarios) {
    fatiga[m] += cantidad / 2;
  }
}

// Devuelve { cuadriceps: 5.2, espalda: 0, ... } con la carga de los últimos 7 días.
// Fuerza: cada serie suma 1. WOD: cada movimiento suma 3 (más si hiciste más reps
// que las de referencia). El esfuerzo en % sube o baja la carga (80% = normal).
function calcularFatiga(entrenos, hoy) {
  const fatiga = {};
  for (const m in MUSCULOS) {
    fatiga[m] = 0;
  }

  for (const entreno of entrenos) {
    const dias = diasEntre(entreno.fecha, hoy);
    if (dias < 0 || dias >= RECUPERACION.length) {
      continue;
    }
    const peso = RECUPERACION[dias];

    for (const bloque of entreno.bloques) {
      const factor = factorEsfuerzo(bloque.esfuerzo) * peso;
      if (bloque.tipo === "wod") {
        for (const mov of bloque.movimientos) {
          const e = porId[mov.ejercicio];
          if (!e) {
            continue;
          }
          const referencia = e.wod ? e.wod.reps : mov.reps;
          sumarCarga(fatiga, e, 3 * factor * Math.min(2, mov.reps / referencia));
        }
      } else {
        const e = porId[bloque.ejercicio];
        if (e) {
          sumarCarga(fatiga, e, bloque.series * factor);
        }
      }
    }
  }
  return fatiga;
}

function nivelCarga(valor) {
  if (valor >= UMBRAL_ALTO) return "alta";
  if (valor >= UMBRAL_MEDIO) return "media";
  return "baja";
}

// ---------- Elección de ejercicios ----------

function puntuar(e, fatiga) {
  let nota = 0;
  for (const m of e.musculos) nota += fatiga[m];
  for (const m of e.secundarios) nota += fatiga[m] / 2;
  return nota;
}

function estaSobrecargado(e, fatiga) {
  return e.musculos.some(m => fatiga[m] >= UMBRAL_ALTO);
}

function respetaCuidados(e, perfil) {
  return !e.cuidado.some(z => perfil.cuidar.includes(z));
}

// El menos cargado gana, con algo de azar para que no salga siempre lo mismo.
// Los sobrecargados ya se han descartado antes, así que el azar no es peligroso.
const MARGEN_AZAR = 4;

function elegirMenosCargado(candidatos, fatiga) {
  let mejor = null;
  let mejorNota = Infinity;
  for (const e of candidatos) {
    const nota = puntuar(e, fatiga) + Math.random() * MARGEN_AZAR;
    if (nota < mejorNota) {
      mejor = e;
      mejorNota = nota;
    }
  }
  return mejor;
}

function candidatosFuerza(hueco, ctx, usados) {
  const base = ejercicios.filter(e =>
    HUECOS_FUERZA[hueco].includes(e.tipo) &&
    !usados.includes(e.id) &&
    respetaCuidados(e, ctx.perfil) &&
    !estaSobrecargado(e, ctx.fatiga)
  );
  if (ctx.focos.length > 0) {
    const conFoco = base.filter(e => e.grupo.some(g => ctx.focos.includes(g)));
    if (conFoco.length > 0) {
      return conFoco;
    }
  }
  return base;
}

// El primer movimiento del WOD es de cardio; los otros dos, de fuerza.
function candidatosWod(posicion, ctx, usados) {
  const base = ejercicios.filter(e =>
    e.wod &&
    !usados.includes(e.id) &&
    respetaCuidados(e, ctx.perfil) &&
    !estaSobrecargado(e, ctx.fatiga)
  );
  const preferidos = posicion === 0
    ? base.filter(e => e.grupo.includes("cardio"))
    : base.filter(e => !e.grupo.includes("cardio"));
  return preferidos.length > 0 ? preferidos : base;
}

function esquemaDe(objetivo, e) {
  return OBJETIVOS[objetivo][e.tipo];
}

function repsWod(e, factor) {
  return Math.max(1, Math.round(e.wod.reps * factor));
}

// ---------- Propuesta del día ----------
// datos = { perfil, focos, entrenos, hoy }
// Devuelve { fuerza: [{hueco, ejercicio, series, reps}], wod: {...} o null }

function crearContexto(datos) {
  return {
    perfil: datos.perfil,
    focos: datos.focos,
    fatiga: calcularFatiga(datos.entrenos, datos.hoy),
  };
}

function proponerEntreno(datos) {
  const ctx = crearContexto(datos);
  const objetivo = datos.perfil.objetivo;

  // Bloque de fuerza. Cada ejercicio elegido suma su carga "de mentira" a la
  // fatiga, así el siguiente hueco evita los mismos músculos.
  const fuerza = [];
  for (let h = 0; h < HUECOS_FUERZA.length; h++) {
    const usados = fuerza.map(f => f.ejercicio);
    const e = elegirMenosCargado(candidatosFuerza(h, ctx, usados), ctx.fatiga);
    if (!e) {
      continue;
    }
    const [series, reps] = esquemaDe(objetivo, e);
    fuerza.push({ hueco: h, ejercicio: e.id, series: series, reps: reps });
    sumarCarga(ctx.fatiga, e, series);
  }

  // WOD.
  const formato = FORMATOS_WOD[aleatorioEntre(0, FORMATOS_WOD.length - 1)];
  const factorReps = formato === "EMOM" ? 0.6 : 1;
  const movimientos = [];
  for (let i = 0; i < 3; i++) {
    const usados = movimientos.map(m => m.ejercicio);
    const e = elegirMenosCargado(candidatosWod(i, ctx, usados), ctx.fatiga);
    if (!e) {
      continue;
    }
    movimientos.push({ ejercicio: e.id, reps: repsWod(e, factorReps) });
    sumarCarga(ctx.fatiga, e, 3);
  }

  let wod = null;
  if (movimientos.length > 0) {
    const [minMin, maxMin] = OBJETIVOS[objetivo].wodMin;
    let minutos = aleatorioEntre(minMin, maxMin);
    let detalle;
    if (formato === "AMRAP") {
      detalle = minutos + " min";
    } else if (formato === "EMOM") {
      const n = movimientos.length;
      minutos = Math.max(n, Math.round(minutos / n) * n);
      detalle = minutos + " min, un movimiento por minuto";
    } else {
      const rondas = Math.max(2, Math.round(minutos / 4));
      detalle = rondas + " rondas, límite " + minutos + " min";
    }
    wod = { formato: formato, detalle: detalle, factorReps: factorReps, movimientos: movimientos };
  }

  return { fuerza: fuerza, wod: wod };
}

// Cambia un ejercicio de la propuesta por otro del mismo papel.
// parte = "fuerza" o "wod". Devuelve false si no hay alternativa.
function sustituirEnPropuesta(propuesta, datos, parte, i) {
  const ctx = crearContexto(datos);

  // La carga del resto de la propuesta también cuenta.
  propuesta.fuerza.forEach((f, j) => {
    if (!(parte === "fuerza" && j === i)) {
      sumarCarga(ctx.fatiga, porId[f.ejercicio], f.series);
    }
  });
  if (propuesta.wod) {
    propuesta.wod.movimientos.forEach((m, j) => {
      if (!(parte === "wod" && j === i)) {
        sumarCarga(ctx.fatiga, porId[m.ejercicio], 3);
      }
    });
  }

  if (parte === "fuerza") {
    const usados = propuesta.fuerza.map(f => f.ejercicio);
    const hueco = propuesta.fuerza[i].hueco;
    const e = elegirMenosCargado(candidatosFuerza(hueco, ctx, usados), ctx.fatiga);
    if (!e) {
      return false;
    }
    const [series, reps] = esquemaDe(datos.perfil.objetivo, e);
    propuesta.fuerza[i] = { hueco: hueco, ejercicio: e.id, series: series, reps: reps };
    return true;
  }

  const usados = propuesta.wod.movimientos.map(m => m.ejercicio);
  const e = elegirMenosCargado(candidatosWod(i, ctx, usados), ctx.fatiga);
  if (!e) {
    return false;
  }
  propuesta.wod.movimientos[i] = { ejercicio: e.id, reps: repsWod(e, propuesta.wod.factorReps) };
  return true;
}
