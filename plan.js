// ---------- Planificación ----------
// Un plan de 8 o 12 semanas: cada día de entreno tiene una sesión con un
// ejercicio principal que progresa semana a semana. El resto de la sesión
// (accesorios y WOD) lo elige el motor el mismo día según la carga muscular.

const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

// Tipos de sesión. "principales": candidatos al ejercicio principal en
// bloques pares e impares (se cambia cada 4 semanas para variar el estímulo).
// Se usa el primero que respete las zonas a cuidar.
const SESIONES = {
  pierna: {
    nombre: "Pierna",
    focos: ["pierna"],
    principales: [
      ["sentadilla", "sentadilla-frontal", "sentadilla-goblet", "hip-thrust"],
      ["sentadilla-frontal", "sentadilla", "sentadilla-goblet", "hip-thrust"],
    ],
  },
  superior: {
    nombre: "Tren superior",
    focos: ["tren superior"],
    principales: [
      ["press-banca", "press-militar", "flexiones", "remo-mancuerna"],
      ["press-militar", "press-banca", "remo-mancuerna", "flexiones"],
    ],
  },
  haltero: {
    nombre: "Halterofilia",
    focos: ["haltero"],
    principales: [
      ["cargada", "push-press", "arrancada-mancuerna"],
      ["arrancada", "envion", "push-press", "arrancada-mancuerna"],
    ],
  },
  completo: {
    nombre: "Cuerpo completo",
    focos: [],
    principales: [
      ["peso-muerto", "remo-barra", "hip-thrust", "remo-mancuerna"],
      ["remo-barra", "peso-muerto", "remo-mancuerna", "hip-thrust"],
    ],
  },
  metcon: {
    nombre: "Acondicionamiento",
    focos: ["core"],
    principales: [[], []],
    wodLargo: true,
    // Sin básicos pesados: solo dos huecos de accesorio/gimnástico (core).
    huecos: [2, 2],
  },
};

// Qué sesiones tocan según los días por semana (en el orden de los días).
const DIVISIONES = {
  2: ["completo", "completo"],
  3: ["pierna", "superior", "haltero"],
  4: ["pierna", "superior", "haltero", "metcon"],
  5: ["pierna", "superior", "metcon", "haltero", "completo"],
  6: ["pierna", "superior", "metcon", "haltero", "completo", "metcon"],
};

// Progresión del ejercicio principal: [series, reps, esfuerzo %] por semana.
// Dos bloques de 4 semanas; la 4.ª de cada bloque es de descarga.
const PROGRESION = {
  general: [
    [5, 5, 70], [5, 5, 75], [5, 4, 80], [3, 5, 60],
    [5, 4, 75], [5, 3, 80], [5, 3, 85], [3, 3, 60],
  ],
  fuerza: [
    [5, 5, 75], [5, 4, 80], [5, 3, 85], [3, 3, 65],
    [5, 3, 82], [5, 2, 87], [4, 2, 90], [3, 2, 65],
  ],
  musculo: [
    [4, 10, 70], [4, 8, 75], [5, 8, 75], [3, 8, 60],
    [4, 8, 75], [4, 6, 80], [5, 6, 82], [3, 8, 60],
  ],
  resistencia: [
    [3, 12, 65], [3, 15, 65], [4, 12, 70], [2, 12, 55],
    [4, 12, 70], [4, 15, 70], [4, 15, 75], [2, 12, 55],
  ],
};

const FASES = ["Base", "Progresión", "Pico"];

// Datos de la semana w (0 = primera) para un objetivo.
function semanaPlan(objetivo, w) {
  const tabla = PROGRESION[objetivo] || PROGRESION.general;
  const bloque = Math.floor(w / 4);
  const k = w % 4;
  const fila = tabla[(bloque === 0 ? 0 : 4) + k];
  const descarga = k === 3;
  // A partir del tercer bloque (semanas 9-12) se sube un 5% más.
  const extra = bloque >= 2 && !descarga ? 5 * (bloque - 1) : 0;
  return {
    series: fila[0],
    reps: fila[1],
    esfuerzo: Math.min(95, fila[2] + extra),
    descarga: descarga,
    bloque: bloque,
    fase: descarga ? "Descarga" : FASES[Math.min(bloque, FASES.length - 1)],
  };
}

// ---------- Fechas del plan ----------

function diaSemana(fecha) {
  return (fecha.getDay() + 6) % 7; // 0 = lunes
}

function lunesDe(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - diaSemana(fecha));
}

function sumarDias(fecha, n) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + n);
}

// Semana del plan en la que cae una fecha (puede ser <0 o >= semanas).
function semanaDe(plan, fecha) {
  return Math.floor(diasEntre(plan.inicio, fecha) / 7);
}

// ---------- Crear y consultar ----------

function elegirPrincipal(tipo, bloque, perfil) {
  const lista = SESIONES[tipo].principales[bloque % 2];
  const valido = lista.find(id => porId[id] && respetaCuidados(porId[id], perfil));
  return valido || null;
}

// perfil = { objetivo, cuidar, dias: [0, 2, 4], semanas: 8 }
function crearPlan(perfil, hoy) {
  const dias = [...perfil.dias].sort((a, b) => a - b);
  const division = DIVISIONES[dias.length];
  const sesiones = {};
  dias.forEach((d, i) => { sesiones[d] = division[i]; });

  const bloques = Math.ceil(perfil.semanas / 4);
  const principales = [];
  for (let b = 0; b < bloques; b++) {
    const delBloque = {};
    for (const tipo in SESIONES) {
      delBloque[tipo] = elegirPrincipal(tipo, b, perfil);
    }
    principales.push(delBloque);
  }

  return {
    version: 1,
    objetivo: perfil.objetivo,
    inicio: fechaISO(lunesDe(hoy)),
    semanas: perfil.semanas,
    dias: dias,
    sesiones: sesiones,
    principales: principales,
  };
}

// Lo que toca en una fecha:
//   null                          → fuera del plan
//   { descanso: true, semana }    → día sin sesión
//   { tipo, nombre, focos, principal, esquema, semana, wodLargo }
function sesionDelDia(plan, fecha) {
  const semana = semanaDe(plan, fecha);
  if (semana < 0 || semana >= plan.semanas) {
    return null;
  }
  const tipo = plan.sesiones[diaSemana(fecha)];
  if (!tipo) {
    return { descanso: true, semana: semana };
  }
  const esquema = semanaPlan(plan.objetivo, semana);
  const s = SESIONES[tipo];
  // Halterofilia: técnica a velocidad, nunca más de 3 reps por serie.
  if (tipo === "haltero") {
    esquema.reps = Math.min(esquema.reps, 3);
  }
  return {
    tipo: tipo,
    nombre: s.nombre,
    focos: s.focos,
    wodLargo: Boolean(s.wodLargo),
    huecos: s.huecos || null,
    principal: plan.principales[esquema.bloque] ? plan.principales[esquema.bloque][tipo] : null,
    esquema: esquema,
    semana: semana,
  };
}

// Próxima sesión a partir de mañana: { fecha, sesion } o null.
function proximaSesion(plan, desde) {
  for (let d = 1; d <= 14; d++) {
    const fecha = sumarDias(desde, d);
    const sesion = sesionDelDia(plan, fecha);
    if (sesion && !sesion.descanso) {
      return { fecha: fecha, sesion: sesion };
    }
  }
  return null;
}

// "Sentadilla · 5×4 · ≈80%"
function textoPrincipal(sesion) {
  const e = sesion.esquema;
  const esquema = e.series + "×" + e.reps + " · ≈" + e.esfuerzo + "%";
  return sesion.principal ? nombreDe(sesion.principal) + " · " + esquema : "WOD largo + core";
}
