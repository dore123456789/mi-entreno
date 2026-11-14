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

// ---------- Escala 0-10 ----------
// Internamente la carga se cuenta en "series efectivas" (1 por serie del
// músculo principal, ½ de apoyo). Para la persona se muestra de 0 a 10:
// 10/10 = unas 15 series acumuladas. Base: lo recomendado son 10-20 series
// por músculo y semana, y una sesión dura llega a 10-12 (Schoenfeld y otros).
// Así una sesión completa de un grupo deja el músculo hacia 7/10.
const SERIES_POR_DECIMA = 1.5;

function aDiez(series) {
  return series / SERIES_POR_DECIMA;
}

function deDiez(decimas) {
  return decimas * SERIES_POR_DECIMA;
}

function sobreDiez(valor) {
  return Math.min(10, Math.round(aDiez(valor)));
}

// Niveles: media desde 4/10, alta desde 8/10 (ese músculo no se entrena fuerte).
const UMBRAL_MEDIO = deDiez(4);
const UMBRAL_ALTO = deDiez(8);

// ---------- Tope de carga ----------
// Ningún entreno debe dejar un músculo por encima del tope (en décimas):
// lo normal es 8/10, que equivale a trabajar a RPE 7-8 (2-3 reps en la
// recámara); en semanas de descarga 6/10 y en el pico del plan 9/10.
const TOPE_NORMAL = 8;
const TOPE_DESCARGA = 6;
const TOPE_PICO = 9;

// Un movimiento de WOD cuenta como 2 series efectivas: en un metcon las cargas
// son moderadas y no se llega al fallo como en un bloque de fuerza.
const SERIES_WOD = 2;

// "¿Cómo te notas hoy?": zonas que la persona puede marcar.
const ZONAS_SENSACION = {
  piernas: { nombre: "Piernas", musculos: ["cuadriceps", "isquios", "gluteos", "gemelos"] },
  superior: { nombre: "Pecho, hombros y brazos", musculos: ["pecho", "hombros", "brazos"] },
  espalda: { nombre: "Espalda y lumbar", musculos: ["espalda", "lumbar"] },
  core: { nombre: "Core", musculos: ["core"] },
};

// Lo que siente manda sobre el cálculo de ese día:
//   fresca  → como mucho 3/10 (puede entrenar fuerte)
//   cargada → al menos 7/10 (solo trabajo suave en esa zona)
//   normal  → se queda el cálculo
function aplicarSensaciones(fatiga, sensaciones) {
  if (!sensaciones) return fatiga;
  const res = { ...fatiga };
  for (const zona in sensaciones) {
    const z = ZONAS_SENSACION[zona];
    if (!z) continue;
    for (const m of z.musculos) {
      if (sensaciones[zona] === "fresca") res[m] = Math.min(res[m], deDiez(3));
      if (sensaciones[zona] === "cargada") res[m] = Math.max(res[m], deDiez(7));
    }
  }
  return res;
}

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

// Los músculos principales cuentan entero y los secundarios la mitad. El core,
// cuando solo estabiliza (casi en todo), cuenta un cuarto: se recupera rápido y,
// si no, saldría siempre "cargado".
function sumarCarga(fatiga, ejercicio, cantidad) {
  for (const m of ejercicio.musculos) {
    fatiga[m] += cantidad;
  }
  for (const m of ejercicio.secundarios) {
    fatiga[m] += cantidad * (m === "core" ? 0.25 : 0.5);
  }
}

// Devuelve { cuadriceps: 5.2, espalda: 0, ... } con la carga de los últimos 7 días.
// Fuerza: cada serie suma 1. WOD: cada movimiento suma 2 (cargas moderadas) (más si hiciste más reps
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
          sumarCarga(fatiga, e, SERIES_WOD * factor * Math.min(2, mov.reps / referencia));
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


// ---------- Plantillas de sesión ----------
// Cada sesión se monta como la programaría un coach: A principal → B
// complementario → C accesorio de la misma zona → D core, y después el WOD.
// Cada hueco dice qué tipos y patrones valen y de qué zona (grupo) debe ser.
// Regla general: dentro de la sesión no se repite patrón si hay alternativa
// (si A es sentadilla, B será bisagra y C unilateral).

const CORE = { papel: "D", tipos: ["gimnastico", "metabolico", "ligero"], patrones: ["core", "acarreo"], grupos: ["core"] };

const PLANTILLAS = {
  pierna: [
    { papel: "A", tipos: ["principal"], patrones: ["sentadilla", "bisagra"], grupos: ["pierna"] },
    { papel: "B", tipos: ["principal", "accesorio"], patrones: ["sentadilla", "bisagra"], grupos: ["pierna"] },
    // orden: los patrones se prueban en ese orden (primero unilateral).
    { papel: "C", tipos: ["accesorio"], patrones: ["unilateral", "bisagra", "sentadilla"], grupos: ["pierna"], orden: true },
    CORE,
  ],
  superior: [
    { papel: "A", tipos: ["principal"], patrones: ["empuje", "traccion"], grupos: ["tren superior"] },
    // B: un básico o un gimnástico del patrón contrario (press → remo o dominadas).
    { papel: "B", tipos: ["principal", "gimnastico"], patrones: ["empuje", "traccion"], grupos: ["tren superior"] },
    { papel: "C", tipos: ["accesorio", "gimnastico"], patrones: ["empuje", "traccion"], grupos: ["tren superior"] },
    CORE,
  ],
  haltero: [
    { papel: "A", tipos: ["haltero"], patrones: ["olimpico"], grupos: ["haltero"] },
    { papel: "B", tipos: ["principal", "haltero"], patrones: ["sentadilla", "empuje"], grupos: ["haltero"] },
    { papel: "C", tipos: ["accesorio"], patrones: ["bisagra", "traccion"], grupos: ["pierna", "tren superior"], orden: true },
    CORE,
  ],
  completo: [
    { papel: "A", tipos: ["principal"], patrones: ["bisagra", "sentadilla"], grupos: ["pierna"] },
    { papel: "B", tipos: ["principal", "gimnastico", "accesorio"], patrones: ["empuje"], grupos: ["tren superior"] },
    { papel: "C", tipos: ["principal", "gimnastico", "accesorio"], patrones: ["traccion"], grupos: ["tren superior"] },
    CORE,
  ],
  // Acondicionamiento: sin básicos pesados, dos de core y un WOD largo.
  metcon: [CORE, CORE],
};

const NOMBRES_PLANTILLA = {
  pierna: "pierna",
  superior: "tren superior",
  haltero: "halterofilia",
  completo: "cuerpo completo",
  metcon: "core",
};

// "Otro entreno": la plantilla sale del foco elegido.
function plantillaDeFocos(focos) {
  if (focos.length === 1) {
    return { "pierna": "pierna", "tren superior": "superior", "haltero": "haltero", "core": "metcon" }[focos[0]] || "completo";
  }
  return "completo";
}

// ---------- Puntuación ----------

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
// Los básicos pesados (principal, haltero) también miran los de apoyo: un press
// banca no se propone con los hombros reventados aunque el pecho esté fresco.
function estaSobrecargado(e, fatiga) {
  const pesado = e.tipo === "principal" || e.tipo === "haltero";
  let aMirar = e.musculos.length > 0 || e.tipo === "ligero" ? e.musculos : e.secundarios;
  if (pesado) aMirar = [...e.musculos, ...e.secundarios.filter(m => m !== "core")];
  return aMirar.some(m => fatiga[m] >= UMBRAL_ALTO);
}

function respetaCuidados(e, perfil) {
  return !(e.cuidado || []).some(z => perfil.cuidar.includes(z));
}

// Lo hecho en los últimos días, para no repetir y para equilibrar la semana.
//  recientes: ejercicios de los últimos 3 días (hoy, ayer y anteayer → 72 h)
//  patrones: series por patrón en los últimos 7 días
function historialReciente(entrenos, hoy) {
  const recientes = new Set();
  const patrones = {};
  const usos = {};   // veces que ha salido cada ejercicio en los últimos 7 días
  for (const entreno of entrenos) {
    const dias = diasEntre(entreno.fecha, hoy);
    if (dias < 0 || dias > 6) continue;
    for (const b of entreno.bloques) {
      const ids = b.tipo === "wod" ? b.movimientos.map(m => m.ejercicio) : [b.ejercicio];
      for (const id of ids) {
        if (dias <= 2) recientes.add(id);
        usos[id] = (usos[id] || 0) + 1;
        const e = porId[id];
        if (!e) continue;
        const series = b.tipo === "wod" ? 2 : (b.series || 3);
        for (const p of e.patron) patrones[p] = (patrones[p] || 0) + series;
      }
    }
  }
  return { recientes, patrones, usos };
}

// Nota de un candidato: carga de sus músculos + lo que se ha hecho de su
// patrón esta semana (equilibrio) + algo de azar para que no salga siempre igual.
const MARGEN_AZAR = 4;

// pesoCarga: cuánto cuenta la carga muscular. En el WOD cuenta menos (la
// seguridad ya la asegura el filtro de sobrecarga) para que haya más variedad.
function nota(e, ctx, pesoCarga = 1) {
  let n = pesoCarga * puntuar(e, ctx.fatiga);
  for (const p of e.patron) n += 0.15 * (ctx.historial.patrones[p] || 0);
  if (ctx.historial.recientes.has(e.id)) n += 6;
  // Variedad: cada vez que ha salido esta semana lo hace menos probable.
  n += 3 * (ctx.historial.usos[e.id] || 0);
  return n + Math.random() * MARGEN_AZAR;
}

function elegirMejor(candidatos, ctx, pesoCarga = 1) {
  let mejor = null;
  let mejorNota = Infinity;
  for (const e of candidatos) {
    const n = nota(e, ctx, pesoCarga);
    if (n < mejorNota) {
      mejor = e;
      mejorNota = n;
    }
  }
  return mejor;
}

// Se van probando filtros de más a menos exigente hasta que queda alguno.
function primeroConAlgo(...listas) {
  for (const l of listas) {
    if (l.length > 0) return l;
  }
  return [];
}

// ---------- Huecos de fuerza ----------

// "Seguro" se decide con la carga que se trae de días anteriores (ctx.base).
// La carga prevista del propio día (ctx.fatiga) solo sirve para puntuar:
// después de una sentadilla se prefiere isquios, pero no se prohíbe el glúteo.
function seguros(ctx, usados) {
  return ejercicios.filter(e =>
    !usados.includes(e.id) && respetaCuidados(e, ctx.perfil) && !estaSobrecargado(e, ctx.base)
  );
}

// Cuántas series se pueden hacer de un ejercicio sin que ningún músculo pase
// del tope de hoy (contando lo que ya trae y lo previsto en la sesión).
function seriesPermitidas(e, ctx) {
  let max = Infinity;
  for (const m of e.musculos) max = Math.min(max, ctx.tope - ctx.fatiga[m]);
  for (const m of e.secundarios) {
    const peso = m === "core" ? 0.25 : 0.5;
    max = Math.min(max, (ctx.tope - ctx.fatiga[m]) / peso);
  }
  return Math.floor(max);
}

// Candidatos para un hueco. patronesUsados: los de la sesión hasta ahora.
// Solo valen si caben al menos 2 series sin pasar del tope.
function candidatosHueco(hueco, ctx, usados, patronesUsados) {
  const base = seguros(ctx, usados).filter(e =>
    seriesPermitidas(e, ctx) >= 2 &&
    hueco.tipos.includes(e.tipo) &&
    e.patron.some(p => hueco.patrones.includes(p)) &&
    e.grupo.some(g => hueco.grupos.includes(g))
  );
  const sinRepetirPatron = base.filter(e => !e.patron.some(p => patronesUsados.includes(p)));
  const noReciente = (l) => l.filter(e => !ctx.historial.recientes.has(e.id));
  // El complementario (B) nunca repite patrón: si no hay, se omite.
  const lista = hueco.papel === "B"
    ? primeroConAlgo(noReciente(sinRepetirPatron), sinRepetirPatron)
    : primeroConAlgo(noReciente(sinRepetirPatron), sinRepetirPatron, noReciente(base), base);
  if (!hueco.orden) return lista;
  // Con orden: el primer patrón de la lista que tenga candidatos.
  for (const p of hueco.patrones) {
    const delPatron = lista.filter(e => e.patron.includes(p));
    if (delPatron.length > 0) return delPatron;
  }
  return lista;
}

// Mejor un ejercicio que quepa entero que uno muy recortado. Si hay que
// recortar, un básico pesado necesita al menos 3 series para que valga la pena.
function candidatosQueCaben(hueco, ctx, objetivo, usados, patronesUsados) {
  const lista = candidatosHueco(hueco, ctx, usados, patronesUsados);
  const enteros = lista.filter(e => seriesPermitidas(e, ctx) >= esquemaHueco(objetivo, e, hueco)[0]);
  if (enteros.length > 0) return enteros;
  return lista.filter(e => {
    const pesado = e.tipo === "principal" || e.tipo === "haltero";
    return seriesPermitidas(e, ctx) >= (pesado ? 3 : 2);
  });
}

function esquemaHueco(objetivo, e, hueco) {
  if (e.esquemaFijo) return e.esquemaFijo;
  if (hueco.papel === "D") return [3, e.wod ? e.wod.reps : 10];
  return OBJETIVOS[objetivo][e.tipo] || OBJETIVOS[objetivo].accesorio;
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

// ¿Se puede hacer hoy el hueco A de esta plantilla?
function plantillaViable(clave, ctx) {
  const a = PLANTILLAS[clave][0];
  return candidatosHueco(a, ctx, [], []).length > 0;
}

// ---------- Zona bloqueada y bloque ligero ----------

function zonaBloqueada(clave, ctx) {
  const a = PLANTILLAS[clave][0];
  const deLaZona = ejercicios.filter(e =>
    a.tipos.includes(e.tipo) && e.grupo.some(g => a.grupos.includes(g)) && respetaCuidados(e, ctx.perfil)
  );
  // Cargados: los que no dejan margen para 2 series sin pasar del tope.
  const cargados = new Set();
  for (const e of deLaZona) {
    for (const m of e.musculos) {
      if (ctx.base[m] >= ctx.tope - 2) cargados.add(m);
    }
  }
  return { cargados: [...cargados], porCuidados: deLaZona.length === 0 };
}

function listaBonita(lista) {
  return lista.length > 1 ? lista.slice(0, -1).join(", ") + " y " + lista[lista.length - 1] : lista[0];
}

function textoAviso(clave, bloqueo, conLigero, alternativa) {
  const zona = NOMBRES_PLANTILLA[clave];
  let texto = bloqueo.cargados.length > 0
    ? "Tienes " + listaBonita(bloqueo.cargados.map(m => MUSCULOS[m])) + " a 7/10 o más. Hoy no toca fuerza de " + zona + " para no pasar de 8/10."
    : "No hay ejercicios de " + zona + " compatibles con las zonas que cuidas.";
  if (conLigero) texto += " Te dejo un bloque ligero de músculos pequeños.";
  if (alternativa) texto += " La fuerza de hoy va a " + NOMBRES_PLANTILLA[alternativa] + ".";
  return texto;
}

function grupoDePlantilla(clave) {
  return { pierna: "pierna", superior: "tren superior", haltero: "haltero", metcon: "core", completo: null }[clave];
}

function candidatosLigero(grupo, ctx, usados) {
  return ejercicios.filter(e =>
    e.tipo === "ligero" &&
    e.grupo.includes(grupo) &&
    !usados.includes(e.id) &&
    respetaCuidados(e, ctx.perfil) &&
    !estaSobrecargado(e, ctx.base)
  );
}

// ---------- Calentamiento y movilidad ----------
// Sin cardio: fase 1 movilidad básica (3) → fase 2 últimos rangos (2-3)
// → series de aproximación del primer básico.

function elegirMovilidad(lista, pesos, maximo, perfil, extra) {
  const elegidos = [];
  const cubiertos = new Set();
  const validos = lista.filter(d => !(d.cuidado || []).some(z => perfil.cuidar.includes(z)));
  while (elegidos.length < maximo) {
    let mejor = null;
    let mejorNota = 0;
    for (const d of validos) {
      if (elegidos.includes(d)) continue;
      let n = 0;
      for (const z of d.zonas) {
        if (!cubiertos.has(z)) n += pesos[z] || 0;
      }
      if (extra) n += extra(d);
      if (n > 0) n += Math.random() * 0.5;
      if (n > mejorNota) {
        mejor = d;
        mejorNota = n;
      }
    }
    if (!mejor) break;
    elegidos.push(mejor);
    for (const z of mejor.zonas) cubiertos.add(z);
  }
  // Siempre al menos 2, aunque el día sea casi todo cardio.
  while (elegidos.length < Math.min(2, validos.length)) {
    const resto = validos.filter(d => !elegidos.includes(d));
    elegidos.push(resto[aleatorioEntre(0, resto.length - 1)]);
  }
  return elegidos;
}

function crearCalentamiento(propuesta, perfil) {
  // Pesos generales (todo lo del día) y pesos del principal (para la fase 2).
  const pesos = {};
  const pesosPrincipal = {};
  const sumar = (destino, id, k) => {
    const e = porId[id];
    if (!e) return;
    for (const m of e.musculos) destino[m] = (destino[m] || 0) + 2 * k;
    for (const m of e.secundarios) destino[m] = (destino[m] || 0) + k;
  };
  propuesta.fuerza.forEach((f, i) => sumar(pesos, f.ejercicio, i === 0 ? 2 : 1));
  propuesta.ligero.forEach(l => sumar(pesos, l.ejercicio, 0.5));
  if (propuesta.wod) propuesta.wod.movimientos.forEach(m => sumar(pesos, m.ejercicio, 1));
  if (propuesta.fuerza[0]) sumar(pesosPrincipal, propuesta.fuerza[0].ejercicio, 3);
  propuesta.fuerza.slice(1, 2).forEach(f => sumar(pesosPrincipal, f.ejercicio, 1));

  const esHaltero = propuesta.fuerza.some(f => porId[f.ejercicio] && porId[f.ejercicio].tipo === "haltero");
  const basica = elegirMovilidad(CALENTAMIENTO.filter(d => d.fase === "basica"), pesos, 3, perfil);
  const rangos = elegirMovilidad(
    CALENTAMIENTO.filter(d => d.fase === "rangos"),
    Object.keys(pesosPrincipal).length ? pesosPrincipal : pesos,
    3, perfil,
    d => (esHaltero && d.olimpico ? 4 : 0)
  );

  const primero = propuesta.fuerza.length > 0 ? porId[propuesta.fuerza[0].ejercicio] : null;
  const conAproximacion = primero && (primero.tipo === "principal" || primero.tipo === "haltero");
  return { basica: basica, rangos: rangos, aproximacion: conAproximacion ? primero.id : null };
}

// ---------- WOD ----------
// 2-4 movimientos mezclando cardio (C), gimnástico (G) y carga (W). No repite
// el patrón principal del día. Si no hay al menos 2 movimientos seguros,
// en vez de un WOD raro propone cardio suave (Zona 2).

function candidatosWod(ctx, usados, patronesDia, modal) {
  // Nunca el patrón principal del día: antes un movimiento menos.
  // Cada movimiento de WOD cuenta como SERIES_WOD series: tiene que caber en el tope.
  const sinPatronDia = seguros(ctx, usados).filter(e =>
    e.wod && seriesPermitidas(e, ctx) >= SERIES_WOD && !e.patron.some(p => patronesDia.includes(p))
  );
  return modal ? sinPatronDia.filter(e => e.modal === modal) : sinPatronDia;
}

function crearWod(ctx, objetivo, sesion, patronesDia, usadosFuerza) {
  const formato = FORMATOS_WOD[aleatorioEntre(0, FORMATOS_WOD.length - 1)];
  const factorReps = formato === "EMOM" ? 0.6 : 1;
  const modales = ["C", "G", "W"].sort(() => Math.random() - 0.5);
  const movimientos = [];

  for (const modal of modales) {
    const usados = [...usadosFuerza, ...movimientos.map(m => m.ejercicio)];
    const e = elegirMejor(candidatosWod(ctx, usados, patronesDia, modal), ctx, 0.3);
    if (!e) continue;
    movimientos.push({ ejercicio: e.id, reps: repsWod(e, factorReps), modal: e.modal });
    sumarCarga(ctx.fatiga, e, SERIES_WOD);
  }

  const [minMin, maxMin] = OBJETIVOS[objetivo].wodMin;
  let minutos = aleatorioEntre(minMin, maxMin);
  if (sesion && sesion.wodLargo) minutos = Math.round(minutos * 1.4);
  if (sesion && sesion.esquema.descarga) minutos = Math.max(6, Math.round(minutos * 0.7));

  if (movimientos.length < 2) {
    // Zona 2: cardio suave en una máquina segura.
    const suaves = seguros(ctx, usadosFuerza).filter(e => e.modal === "C");
    const e = elegirMejor(suaves, ctx);
    if (!e) return null;
    const min = Math.max(15, Math.min(25, minutos + 5));
    return {
      formato: "Zona 2",
      detalle: min + " min suave: a un ritmo en el que puedas hablar",
      minutos: min,
      factorReps: 1,
      suave: true,
      movimientos: [{ ejercicio: e.id, reps: min, unidad: "min", modal: "C" }],
    };
  }

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
  return { formato: formato, detalle: detalle, minutos: minutos, factorReps: factorReps, movimientos: movimientos };
}

// ---------- Propuesta del día ----------
// datos = { perfil, focos, sesion (opcional, del plan), entrenos, hoy }
// Devuelve {
//   plantilla, esperados, sesion, avisos,
//   calentamiento: { basica, rangos, aproximacion },
//   fuerza: [{hueco, ejercicio, series, reps}],
//   ligero: [{foco, ejercicio, series, reps}],
//   wod: {...} o null,
//   movilidad: [...]  (solo si hoy toca descanso)
// }

// datos.sensaciones (opcional): lo que la persona ha dicho hoy en "¿Cómo te notas?".
function crearContexto(datos) {
  const base = aplicarSensaciones(calcularFatiga(datos.entrenos, datos.hoy), datos.sensaciones);
  const esquema = datos.sesion && datos.sesion.esquema;
  const tope = esquema && esquema.descarga ? TOPE_DESCARGA
    : esquema && esquema.fase === "Pico" ? TOPE_PICO
    : TOPE_NORMAL;
  return {
    perfil: datos.perfil,
    tope: deDiez(tope),         // ningún músculo debe pasar de aquí (en series; tope en décimas)
    base: base,                 // carga de días anteriores: decide qué es seguro
    fatiga: { ...base },        // + lo previsto hoy: sirve para puntuar y para el tope
    historial: historialReciente(datos.entrenos, datos.hoy),
  };
}

function proponerEntreno(datos) {
  const ctx = crearContexto(datos);
  const objetivo = datos.perfil.objetivo;
  const fatigaInicial = ctx.base;
  const sesion = datos.sesion || null;
  const avisos = [];
  const ligero = [];

  // 1. Plantilla: la de la sesión del plan, o la del foco elegido.
  let clave = sesion ? sesion.tipo : plantillaDeFocos(datos.focos || []);

  // 2. Si la zona está bloqueada (carga alta o zonas a cuidar): aviso, bloque
  //    ligero de esa zona y la fuerza pasa a la zona más descansada.
  if (clave !== "metcon" && !plantillaViable(clave, ctx)) {
    const bloqueo = zonaBloqueada(clave, ctx);
    const grupo = grupoDePlantilla(clave);
    if (grupo) {
      for (let k = 0; k < 2; k++) {
        const e = elegirMejor(candidatosLigero(grupo, ctx, ligero.map(l => l.ejercicio)), ctx);
        if (!e) break;
        const [series, reps] = esquemaDe(objetivo, e);
        ligero.push({ foco: grupo, ejercicio: e.id, series: series, reps: reps });
        sumarCarga(ctx.fatiga, e, series);
      }
    }
    const alternativas = ["superior", "pierna", "completo"].filter(c => c !== clave && plantillaViable(c, ctx));
    const alternativa = alternativas[0] || null;
    avisos.push(textoAviso(clave, bloqueo, ligero.length > 0, alternativa));
    clave = alternativa;
  }

  const fuerza = [];
  const patronesUsados = [];
  const plantilla = clave ? PLANTILLAS[clave] : [];

  // 3. Hueco A del plan: el principal de la semana, si es seguro.
  let desde = 0;
  if (sesion && sesion.principal && clave === sesion.tipo) {
    const e = porId[sesion.principal];
    const caben = e ? seriesPermitidas(e, ctx) : 0;
    if (e && respetaCuidados(e, ctx.perfil) && !estaSobrecargado(e, ctx.base) && caben >= 3) {
      // Si no caben todas las series del plan sin pasar del tope, se recortan.
      const series = Math.min(sesion.esquema.series, caben);
      fuerza.push({ hueco: 0, ejercicio: e.id, series: series, reps: sesion.esquema.reps,
        esfuerzoObjetivo: sesion.esquema.esfuerzo, delPlan: true, ajustado: series < sesion.esquema.series });
      sumarCarga(ctx.fatiga, e, series);
      patronesUsados.push(...e.patron);
      desde = 1;
    } else if (e) {
      const cargados = e.musculos.filter(m => fatigaInicial[m] >= ctx.tope - 2).map(m => MUSCULOS[m]);
      avisos.push("Tu plan marcaba " + e.nombre + " hoy"
        + (cargados.length ? ", pero tienes " + listaBonita(cargados) + " con carga alta" : "")
        + ". Lo cambiamos por otro ejercicio para no sobrecargar.");
    }
  }

  // 4. Resto de huecos de la plantilla.
  for (let h = desde; h < plantilla.length; h++) {
    const hueco = plantilla[h];
    const e = elegirMejor(candidatosQueCaben(hueco, ctx, objetivo, fuerza.map(f => f.ejercicio), patronesUsados), ctx);
    if (!e) continue;
    const [seriesPlan, reps] = esquemaHueco(objetivo, e, hueco);
    const series = Math.min(seriesPlan, seriesPermitidas(e, ctx));
    fuerza.push({ hueco: h, ejercicio: e.id, series: series, reps: reps, ajustado: series < seriesPlan });
    sumarCarga(ctx.fatiga, e, series);
    if (hueco.papel !== "D") patronesUsados.push(...e.patron);
  }

  // Semana de descarga: una serie menos en todo lo que no es el principal.
  if (sesion && sesion.esquema.descarga) {
    for (const f of fuerza) {
      if (!f.delPlan) f.series = Math.max(2, f.series - 1);
    }
  }

  // 5. WOD: sin el patrón principal del día (A y B).
  const patronesDia = fuerza.filter(f => PLANTILLAS[clave] && PLANTILLAS[clave][f.hueco] && PLANTILLAS[clave][f.hueco].papel !== "D")
    .slice(0, 2).flatMap(f => porId[f.ejercicio].patron);
  const wod = crearWod(ctx, objetivo, sesion, patronesDia, fuerza.map(f => f.ejercicio));

  const propuesta = {
    plantilla: clave,
    esperados: plantilla.length,
    sesion: sesion,
    avisos: avisos,
    fuerza: fuerza,
    ligero: ligero,
    wod: wod,
    calentamiento: null,
    movilidad: null,
  };

  // Sin nada de fuerza posible (y sin plantilla de core): descanso con movilidad.
  const soloCore = fuerza.every(f => PLANTILLAS[clave] && PLANTILLAS[clave][f.hueco].papel === "D");
  if (fuerza.length === 0 || (soloCore && clave !== "metcon")) {
    propuesta.movilidad = elegirMovilidad(CALENTAMIENTO, fatigaInicial, 5, datos.perfil);
    propuesta.avisos = [];
  } else {
    propuesta.calentamiento = crearCalentamiento(propuesta, datos.perfil);
  }
  return propuesta;
}

// Cambia un ejercicio de la propuesta por otro del mismo papel.
// parte = "fuerza", "ligero" o "wod". Devuelve false si no hay alternativa.
function sustituirEnPropuesta(propuesta, datos, parte, i) {
  const ctx = crearContexto(datos);
  const objetivo = datos.perfil.objetivo;

  // La carga del resto de la propuesta también cuenta.
  propuesta.ligero.forEach((l, j) => {
    if (!(parte === "ligero" && j === i)) sumarCarga(ctx.fatiga, porId[l.ejercicio], l.series);
  });
  propuesta.fuerza.forEach((f, j) => {
    if (!(parte === "fuerza" && j === i)) sumarCarga(ctx.fatiga, porId[f.ejercicio], f.series);
  });
  if (propuesta.wod) {
    propuesta.wod.movimientos.forEach((m, j) => {
      if (!(parte === "wod" && j === i)) sumarCarga(ctx.fatiga, porId[m.ejercicio], SERIES_WOD);
    });
  }

  let cambiado = false;
  if (parte === "fuerza") {
    const actual = propuesta.fuerza[i];
    const hueco = PLANTILLAS[propuesta.plantilla] && PLANTILLAS[propuesta.plantilla][actual.hueco];
    if (hueco) {
      const usados = propuesta.fuerza.map(f => f.ejercicio);
      const patrones = propuesta.fuerza.filter((f, j) => j !== i && PLANTILLAS[propuesta.plantilla][f.hueco].papel !== "D")
        .flatMap(f => porId[f.ejercicio].patron);
      const e = elegirMejor(candidatosHueco(hueco, ctx, usados, patrones), ctx);
      if (e) {
        const [series, reps] = esquemaHueco(objetivo, e, hueco);
        propuesta.fuerza[i] = { hueco: actual.hueco, ejercicio: e.id, series: series, reps: reps };
        cambiado = true;
      }
    }
  } else if (parte === "ligero") {
    const usados = propuesta.ligero.map(l => l.ejercicio);
    const foco = propuesta.ligero[i].foco;
    const e = elegirMejor(candidatosLigero(foco, ctx, usados), ctx);
    if (e) {
      const [series, reps] = esquemaDe(objetivo, e);
      propuesta.ligero[i] = { foco: foco, ejercicio: e.id, series: series, reps: reps };
      cambiado = true;
    }
  } else if (propuesta.wod) {
    const actual = propuesta.wod.movimientos[i];
    const usados = [...propuesta.fuerza.map(f => f.ejercicio), ...propuesta.wod.movimientos.map(m => m.ejercicio)];
    const patronesDia = propuesta.fuerza.slice(0, 2).flatMap(f => porId[f.ejercicio].patron);
    const e = elegirMejor(candidatosWod(ctx, usados, patronesDia, actual.modal || null), ctx, 0.3);
    if (e) {
      propuesta.wod.movimientos[i] = propuesta.wod.suave
        ? { ejercicio: e.id, reps: actual.reps, unidad: "min", modal: "C" }
        : { ejercicio: e.id, reps: repsWod(e, propuesta.wod.factorReps), modal: e.modal };
      cambiado = true;
    }
  }

  if (cambiado && propuesta.calentamiento) {
    propuesta.calentamiento = crearCalentamiento(propuesta, datos.perfil);
  }
  return cambiado;
}
