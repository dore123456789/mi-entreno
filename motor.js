// ---------- Motor de entrenamiento ----------
// Funciones que solo calculan: reciben datos y devuelven resultados,
// sin tocar la pantalla. Así se pueden probar y cambiar sin miedo.

// Series × reps de cada tipo de ejercicio según el objetivo del perfil,
// y duración del WOD en minutos (mínimo, máximo).
const OBJETIVOS = {
  general: {
    nombre: "Forma física general",
    principal: [5, 5], haltero: [5, 3], gimnastico: [4, 8], accesorio: [3, 10], metabolico: [3, 12], ligero: [2, 15],
    wodMin: [10, 14],
  },
  fuerza: {
    nombre: "Ganar fuerza",
    principal: [5, 3], haltero: [6, 2], gimnastico: [5, 5], accesorio: [3, 8], metabolico: [3, 10], ligero: [2, 15],
    wodMin: [6, 10],
  },
  musculo: {
    nombre: "Ganar músculo",
    principal: [4, 8], haltero: [4, 3], gimnastico: [4, 10], accesorio: [3, 12], metabolico: [3, 15], ligero: [2, 15],
    wodMin: [8, 12],
  },
  resistencia: {
    nombre: "Resistencia",
    principal: [3, 12], haltero: [4, 3], gimnastico: [3, 12], accesorio: [3, 15], metabolico: [3, 20], ligero: [2, 15],
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

// Sobrecargado si algún músculo principal tiene carga alta. Los ejercicios sin
// músculo principal (cardio) miran sus secundarios: un burpee no se propone
// con el cuádriceps reventado. Los ligeros solo miran sus principales: están
// pensados justo para los días en que la zona está cargada.
function estaSobrecargado(e, fatiga) {
  const aMirar = e.musculos.length > 0 || e.tipo === "ligero" ? e.musculos : e.secundarios;
  return aMirar.some(m => fatiga[m] >= UMBRAL_ALTO);
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

// Series × reps. Algunos ejercicios tienen el suyo propio (la plancha va en segundos).
function esquemaDe(objetivo, e) {
  return e.esquemaFijo || OBJETIVOS[objetivo][e.tipo];
}

// "3×30 s", "5×5"…
function textoEsquema(f) {
  const e = porId[f.ejercicio];
  return f.series + "×" + f.reps + (e && e.unidadReps ? " " + e.unidadReps : "");
}

function repsWod(e, factor) {
  return Math.max(1, Math.round(e.wod.reps * factor));
}

// ---------- Foco bloqueado y bloque ligero ----------

const TIPOS_FUERZA = ["principal", "haltero", "gimnastico", "accesorio"];
const NOMBRES_FOCO = {
  "pierna": "pierna",
  "tren superior": "tren superior",
  "haltero": "halterofilia",
  "core": "core",
};

// Un foco está "bloqueado" si ninguno de sus ejercicios de fuerza se puede
// hacer hoy (por carga alta o por las zonas a cuidar).
// Devuelve [{ foco, cargados: ["cuadriceps", ...] }].
function focosBloqueados(ctx) {
  const bloqueados = [];
  for (const foco of ctx.focos) {
    const delGrupo = ejercicios.filter(e =>
      e.grupo.includes(foco) && TIPOS_FUERZA.includes(e.tipo) && respetaCuidados(e, ctx.perfil)
    );
    if (delGrupo.some(e => !estaSobrecargado(e, ctx.fatiga))) {
      continue;
    }
    const cargados = new Set();
    for (const e of delGrupo) {
      for (const m of e.musculos) {
        if (ctx.fatiga[m] >= UMBRAL_ALTO) cargados.add(m);
      }
    }
    bloqueados.push({ foco: foco, cargados: [...cargados] });
  }
  return bloqueados;
}

function textoAviso(bloqueo) {
  const zona = NOMBRES_FOCO[bloqueo.foco] || bloqueo.foco;
  if (bloqueo.cargados.length === 0) {
    return "No hay ejercicios de " + zona + " compatibles con las zonas que cuidas. "
      + "Te dejo un bloque ligero y el resto del entreno va a otras zonas.";
  }
  const lista = bloqueo.cargados.map(m => MUSCULOS[m]);
  const musculos = lista.length > 1
    ? lista.slice(0, -1).join(", ") + " y " + lista[lista.length - 1]
    : lista[0];
  return "Tienes " + musculos + " con carga alta. Hoy no toca fuerza de " + zona
    + " para evitar sobrecargas: te dejo un bloque ligero de músculos pequeños "
    + "y el resto del entreno trabaja otras zonas.";
}

function candidatosLigero(foco, ctx, usados) {
  return ejercicios.filter(e =>
    e.tipo === "ligero" &&
    e.grupo.includes(foco) &&
    !usados.includes(e.id) &&
    respetaCuidados(e, ctx.perfil) &&
    !estaSobrecargado(e, ctx.fatiga)
  );
}

// ---------- Calentamiento y movilidad ----------

// Elige ejercicios de movilidad que cubran los músculos con más peso.
function elegirMovilidad(pesos, maximo) {
  const elegidos = [];
  const cubiertos = new Set();
  while (elegidos.length < maximo) {
    let mejor = null;
    let mejorNota = 0;
    for (const d of MOVILIDAD) {
      if (elegidos.includes(d)) continue;
      let nota = 0;
      for (const z of d.zonas) {
        if (!cubiertos.has(z)) nota += pesos[z] || 0;
      }
      if (nota > 0) nota += Math.random() * 0.5;
      if (nota > mejorNota) {
        mejor = d;
        mejorNota = nota;
      }
    }
    if (!mejor) break;
    elegidos.push(mejor);
    for (const z of mejor.zonas) cubiertos.add(z);
  }
  // Siempre al menos 2, aunque el día sea casi todo cardio.
  while (elegidos.length < 2) {
    const resto = MOVILIDAD.filter(d => !elegidos.includes(d));
    elegidos.push(resto[aleatorioEntre(0, resto.length - 1)]);
  }
  return elegidos;
}

// Calentamiento a medida de la propuesta: cardio suave + movilidad de los
// músculos que se van a usar + aproximación del primer ejercicio de fuerza.
function crearCalentamiento(propuesta, perfil, anterior) {
  const pesos = {};
  const sumar = (id, k) => {
    const e = porId[id];
    for (const m of e.musculos) pesos[m] = (pesos[m] || 0) + 2 * k;
    for (const m of e.secundarios) pesos[m] = (pesos[m] || 0) + k;
  };
  propuesta.fuerza.forEach(f => sumar(f.ejercicio, 1));
  propuesta.ligero.forEach(l => sumar(l.ejercicio, 0.5));
  const enWod = propuesta.wod ? propuesta.wod.movimientos.map(m => m.ejercicio) : [];
  enWod.forEach(id => sumar(id, 1));

  // Cardio suave que no esté ya en el WOD (y que se mantenga si sigue valiendo).
  const opciones = ["remo", "bici", "comba", "carrera"]
    .filter(id => !enWod.includes(id) && respetaCuidados(porId[id], perfil));
  let cardio = anterior && opciones.includes(anterior.cardio) ? anterior.cardio : null;
  if (!cardio && opciones.length > 0) {
    cardio = opciones[aleatorioEntre(0, opciones.length - 1)];
  }

  const primero = propuesta.fuerza.length > 0 ? porId[propuesta.fuerza[0].ejercicio] : null;
  const conAproximacion = primero && (primero.tipo === "principal" || primero.tipo === "haltero");

  return {
    cardio: cardio,
    movilidad: elegirMovilidad(pesos, 4),
    aproximacion: conAproximacion ? primero.id : null,
  };
}

// ---------- Propuesta del día ----------
// datos = { perfil, focos, entrenos, hoy }
// Devuelve {
//   avisos: ["texto", ...],
//   calentamiento: {...},
//   fuerza: [{hueco, ejercicio, series, reps}],
//   ligero: [{foco, ejercicio, series, reps}],
//   wod: {...} o null,
//   movilidad: [...]  (solo si hoy toca descanso)
// }

// datos.sesion (opcional): la sesión del plan de hoy (ver plan.js). Si viene,
// manda sobre los focos y fija el ejercicio principal y su esquema.
function crearContexto(datos) {
  return {
    perfil: datos.perfil,
    focos: datos.sesion ? datos.sesion.focos : datos.focos,
    fatiga: calcularFatiga(datos.entrenos, datos.hoy),
  };
}

function proponerEntreno(datos) {
  const ctx = crearContexto(datos);
  const objetivo = datos.perfil.objetivo;
  const fatigaInicial = { ...ctx.fatiga };

  // Focos que hoy no se pueden trabajar fuerte: aviso + bloque ligero.
  const bloqueos = focosBloqueados(ctx);
  const avisos = bloqueos.map(textoAviso);
  const ligero = [];
  for (const b of bloqueos) {
    for (let k = 0; k < 2; k++) {
      const usados = ligero.map(l => l.ejercicio);
      const e = elegirMenosCargado(candidatosLigero(b.foco, ctx, usados), ctx.fatiga);
      if (!e) break;
      const [series, reps] = esquemaDe(objetivo, e);
      ligero.push({ foco: b.foco, ejercicio: e.id, series: series, reps: reps });
      sumarCarga(ctx.fatiga, e, series);
    }
  }

  // Bloque de fuerza. Cada ejercicio elegido suma su carga "de mentira" a la
  // fatiga, así el siguiente hueco evita los mismos músculos.
  const fuerza = [];
  const sesion = datos.sesion || null;
  let primerHueco = 0;

  // Con plan: el primer hueco es el ejercicio principal de la sesión, con el
  // esquema de la semana. Si hoy está sobrecargado, se avisa y se cambia.
  if (sesion && sesion.principal) {
    const e = porId[sesion.principal];
    if (respetaCuidados(e, ctx.perfil) && !estaSobrecargado(e, ctx.fatiga)) {
      fuerza.push({
        hueco: 0,
        ejercicio: e.id,
        series: sesion.esquema.series,
        reps: sesion.esquema.reps,
        esfuerzoObjetivo: sesion.esquema.esfuerzo,
        delPlan: true,
      });
      sumarCarga(ctx.fatiga, e, sesion.esquema.series);
      primerHueco = 1;
    } else if (bloqueos.length === 0) {
      const cargados = e.musculos.filter(m => fatigaInicial[m] >= UMBRAL_ALTO).map(m => MUSCULOS[m]);
      avisos.push("Tu plan marcaba " + e.nombre + " hoy, pero tienes " + cargados.join(" y ")
        + " con carga alta. Lo cambiamos por otro ejercicio para no sobrecargar.");
    }
  }

  // Huecos a rellenar: los de la sesión del plan si los fija, o los tres normales.
  const huecos = sesion && sesion.huecos ? sesion.huecos : HUECOS_FUERZA.map((_, i) => i);
  for (let k = primerHueco; k < huecos.length; k++) {
    const h = huecos[k];
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
    if (sesion && sesion.wodLargo) minutos = Math.round(minutos * 1.4);
    if (sesion && sesion.esquema.descarga) minutos = Math.max(6, Math.round(minutos * 0.7));
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
    wod = { formato: formato, detalle: detalle, minutos: minutos, factorReps: factorReps, movimientos: movimientos };
  }

  // Semana de descarga: una serie menos en los accesorios.
  if (sesion && sesion.esquema.descarga) {
    for (const f of fuerza) {
      if (!f.delPlan) f.series = Math.max(2, f.series - 1);
    }
  }

  const propuesta = {
    sesion: sesion,
    avisos: avisos,
    fuerza: fuerza,
    ligero: ligero,
    wod: wod,
    calentamiento: null,
    movilidad: null,
  };

  if (fuerza.length === 0) {
    // Ningún ejercicio de fuerza es seguro: día de descanso con movilidad
    // para lo más cargado.
    propuesta.movilidad = elegirMovilidad(fatigaInicial, 5);
  } else {
    propuesta.calentamiento = crearCalentamiento(propuesta, datos.perfil, null);
  }
  return propuesta;
}

// Cambia un ejercicio de la propuesta por otro del mismo papel.
// parte = "fuerza", "ligero" o "wod". Devuelve false si no hay alternativa.
function sustituirEnPropuesta(propuesta, datos, parte, i) {
  const ctx = crearContexto(datos);

  // La carga del resto de la propuesta también cuenta.
  propuesta.ligero.forEach((l, j) => {
    if (!(parte === "ligero" && j === i)) {
      sumarCarga(ctx.fatiga, porId[l.ejercicio], l.series);
    }
  });
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

  let cambiado = false;
  if (parte === "fuerza") {
    const usados = propuesta.fuerza.map(f => f.ejercicio);
    const hueco = propuesta.fuerza[i].hueco;
    const e = elegirMenosCargado(candidatosFuerza(hueco, ctx, usados), ctx.fatiga);
    if (e) {
      const [series, reps] = esquemaDe(datos.perfil.objetivo, e);
      propuesta.fuerza[i] = { hueco: hueco, ejercicio: e.id, series: series, reps: reps };
      cambiado = true;
    }
  } else if (parte === "ligero") {
    const usados = propuesta.ligero.map(l => l.ejercicio);
    const foco = propuesta.ligero[i].foco;
    const e = elegirMenosCargado(candidatosLigero(foco, ctx, usados), ctx.fatiga);
    if (e) {
      const [series, reps] = esquemaDe(datos.perfil.objetivo, e);
      propuesta.ligero[i] = { foco: foco, ejercicio: e.id, series: series, reps: reps };
      cambiado = true;
    }
  } else {
    const usados = propuesta.wod.movimientos.map(m => m.ejercicio);
    const e = elegirMenosCargado(candidatosWod(i, ctx, usados), ctx.fatiga);
    if (e) {
      propuesta.wod.movimientos[i] = { ejercicio: e.id, reps: repsWod(e, propuesta.wod.factorReps) };
      cambiado = true;
    }
  }

  if (cambiado) {
    propuesta.calentamiento = crearCalentamiento(propuesta, datos.perfil, propuesta.calentamiento);
  }
  return cambiado;
}
