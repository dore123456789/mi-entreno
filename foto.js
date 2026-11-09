// ---------- Clase del box desde una foto o captura ----------
// 1. Se prepara la imagen (tamaño, grises, contraste).
// 2. Tesseract.js lee el texto en el propio dispositivo (la foto no se envía).
// 3. "leerClase" traduce ese texto a ejercicios y WOD de la biblioteca.

const URL_TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

// ---------- Nombres que se reconocen ----------
// Por ejercicio, cómo suele escribirse (en minúsculas y sin tildes).
// Se busca primero el texto más largo, así "remo con barra" gana a "remo".

const ALIAS = {
  "sentadilla-frontal": ["front squat", "sentadilla frontal"],
  "sentadilla-goblet": ["goblet squat", "sentadilla goblet", "goblet"],
  "sentadilla-aire": ["air squat", "sentadilla sin peso", "sentadilla al aire"],
  "sentadilla": ["back squat", "sentadilla trasera", "sentadilla", "squat"],
  "peso-muerto-rumano": ["romanian deadlift", "peso muerto rumano", "rdl"],
  "peso-muerto": ["deadlift", "peso muerto"],
  "zancadas": ["walking lunge", "lunge", "zancada"],
  "hip-thrust": ["hip thrust"],
  "subidas-cajon": ["step up", "subida al cajon", "subidas al cajon"],
  "saltos-cajon": ["box jump over", "box jump", "bjo", "salto al cajon", "saltos al cajon"],
  "wall-ball": ["wall ball shot", "wall ball", "wallball", "wb"],
  "swing-kettlebell": ["kettlebell swing", "kb swing", "russian swing", "american swing", "swing"],
  "press-banca": ["bench press", "press de banca", "press banca"],
  "push-press": ["push press"],
  "press-militar": ["strict press", "shoulder press", "overhead press", "press militar", "ohp"],
  "remo-barra": ["bent over row", "barbell row", "remo con barra"],
  "remo-mancuerna": ["dumbbell row", "db row", "remo con mancuerna"],
  "remo-anillas": ["ring row", "remo en anillas"],
  "dominadas": ["chest to bar", "c2b", "pull up", "pullup", "dominada"],
  "flexiones": ["push up", "pushup", "flexion"],
  "fondos": ["ring dip", "dip", "fondo"],
  "press-mancuernas": ["dumbbell press", "db press", "press con mancuernas"],
  "curl-biceps": ["biceps curl", "curl"],
  "arrancada-mancuerna": ["dumbbell snatch", "db snatch", "arrancada con mancuerna"],
  "arrancada": ["power snatch", "squat snatch", "hang snatch", "snatch", "arrancada"],
  "envion": ["clean and jerk", "clean & jerk", "c&j", "envion", "jerk"],
  "cargada": ["power clean", "squat clean", "hang clean", "clean", "cargada"],
  "thruster": ["thruster"],
  "remo": ["rowing", "rower", "row", "remo"],
  "bici": ["assault bike", "echo bike", "air bike", "bike", "bici"],
  "carrera": ["running", "run", "carrera", "correr"],
  "comba": ["double under", "single under", "saltos de comba", "comba", "dus", "du"],
  "burpee": ["burpee"],
  "toes-to-bar": ["toes to bar", "t2b", "ttb"],
  "abdominales": ["sit up", "situp", "abdominal", "ghd"],
  "rueda-abdominal": ["ab wheel", "rueda abdominal"],
  "elevaciones-piernas": ["hanging leg raise", "leg raise", "knee raise", "elevaciones de piernas"],
  "elevacion-gemelos": ["calf raise", "elevacion de gemelos", "gemelos"],
};

// Lista plana ordenada del alias más largo al más corto.
const LISTA_ALIAS = [];
for (const id in ALIAS) {
  for (const alias of ALIAS[id]) {
    LISTA_ALIAS.push({ id: id, alias: alias, regex: regexAlias(alias) });
  }
}
LISTA_ALIAS.sort((a, b) => b.alias.length - a.alias.length);

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&");
}

// Palabra completa, con plural opcional ("thrusters", "flexiones", "pull-ups").
function regexAlias(alias) {
  const cuerpo = escaparRegex(alias).replace(/ /g, "[\\s-]*");
  return new RegExp("(^|[^a-z0-9])" + cuerpo + "(e?s)?(?=[^a-z0-9]|$)");
}

function normalizar(texto) {
  return texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[×*]/g, "x")
    .replace(/(\d)\s*['’]/g, "$1 min")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buscarEjercicio(segmento) {
  for (const a of LISTA_ALIAS) {
    const m = a.regex.exec(segmento);
    if (m) {
      return { id: a.id, posicion: m.index };
    }
  }
  return null;
}

function redondearEsfuerzo(pct) {
  const r = Math.round(pct / 5) * 5;
  return r >= 50 && r <= 100 ? r : null;
}

// ---------- Del texto a la clase ----------
// Devuelve {
//   fuerza: [{ ejercicio, series, reps, kg, esfuerzo }],
//   wod: { formato, minutos, detalle, movimientos: [{ ejercicio, reps }] } o null,
//   noEntendidas: ["línea", ...]
// }

function detectarFormato(texto) {
  let m;
  if ((m = /amrap\s*(?:de\s*|en\s*)?(\d+)|(\d+)\s*(?:min\w*)?\s*amrap/.exec(texto))) {
    const minutos = Number(m[1] || m[2]);
    return { formato: "AMRAP", minutos: minutos, detalle: minutos + " min" };
  }
  if ((m = /e?mom\s*(?:de\s*|x\s*)?(\d+)|(\d+)\s*(?:min\w*)?\s*e?mom/.exec(texto))) {
    const minutos = Number(m[1] || m[2]);
    return { formato: "EMOM", minutos: minutos, detalle: minutos + " min" };
  }
  if (/for time|por tiempo|\bft\b|\brft\b|rondas? por tiempo/.test(texto)) {
    const rondas = /(\d+)\s*(?:rounds?|rondas?|rft)/.exec(texto);
    const cap = /(?:time cap|cap|tc|limite)\s*:?\s*(\d+)/.exec(texto);
    const escalera = /\b(\d+(?:\s*-\s*\d+){2,})\b/.exec(texto);
    const partes = [];
    if (escalera) partes.push(escalera[1].replace(/\s/g, ""));
    if (rondas) partes.push(rondas[1] + " rondas");
    if (cap) partes.push("límite " + cap[1] + " min");
    return { formato: "Por tiempo", minutos: cap ? Number(cap[1]) : null, detalle: partes.join(", ") };
  }
  return null;
}

const IGNORAR = new RegExp([
  "^(fuerza|strength|wod|metcon|warm ?up|calentamiento|cool ?down|vuelta a la calma",
  "|accesorios?|skill|tecnica|movilidad|stretching|estiramientos|parte [a-z0-9])\\b",
  "|time cap|\\bcap\\b|descanso|rest\\b",
  "|\\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo",
  "|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\b",
].join(""));

function leerClase(textoOriginal) {
  const resultado = { fuerza: [], wod: null, noEntendidas: [] };
  const lineas = textoOriginal.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const textoEntero = normalizar(lineas.join("\n"));

  const formato = detectarFormato(textoEntero);
  const escalera = /\b(\d+)(?:\s*-\s*\d+){2,}\b/.exec(textoEntero);
  const movimientos = [];
  let enWod = false;

  for (const original of lineas) {
    const linea = normalizar(original);
    if (detectarFormato(linea) || /\bwod\b|metcon/.test(linea)) {
      enWod = true;
    }

    // Una línea puede llevar varios movimientos: "21 thrusters + 21 pull ups"
    const segmentos = linea.split(/\s\+\s|\s\/\s|,|;/);
    let algoEntendido = false;

    for (const segmento of segmentos) {
      const encontrado = buscarEjercicio(segmento);
      if (!encontrado) continue;
      algoEntendido = true;

      const esquema = /(\d+)\s*x\s*(\d+)/.exec(segmento);
      const kg = /(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?)/.exec(segmento);
      const pct = /(\d{2,3})\s*%/.exec(segmento);

      if (esquema && !(enWod && formato)) {
        // Fuerza: "Back squat 5x5 @ 70%", "Peso muerto 4 x 6 80kg"
        resultado.fuerza.push({
          ejercicio: encontrado.id,
          series: Number(esquema[1]),
          reps: Number(esquema[2]),
          kg: kg ? Number(kg[1].replace(",", ".")) : null,
          esfuerzo: pct ? redondearEsfuerzo(Number(pct[1])) : null,
        });
        continue;
      }

      // Movimiento de WOD: el número que va delante del nombre ("15 cal row",
      // "400m run") o detrás ("thrusters x 10"). Si no hay, el de la escalera
      // (21-15-9) o las reps de referencia del ejercicio.
      const antes = segmento.slice(0, encontrado.posicion + 1);
      const delante = /(\d+)\s*(?:cal\w*|m\b|mts|metros)?\s*$/.exec(antes.replace(/[^0-9a-z\s]/g, " ").trim());
      const detras = /x\s*(\d+)/.exec(segmento.slice(encontrado.posicion));
      let reps = delante ? Number(delante[1]) : detras ? Number(detras[1]) : null;
      if (reps === null && escalera) reps = Number(escalera[1]);
      if (reps === null) {
        const e = porId[encontrado.id];
        reps = e && e.wod ? e.wod.reps : 10;
      }
      if (!movimientos.some(m => m.ejercicio === encontrado.id)) {
        movimientos.push({ ejercicio: encontrado.id, reps: reps });
      }
    }

    // Líneas con letras que no se han entendido (para enseñárselas a la persona).
    // Se saltan títulos, fechas y partes que no cargan músculo.
    const soloFormato = detectarFormato(linea) && !algoEntendido;
    if (!algoEntendido && !soloFormato && /[a-z]{3,}/.test(linea) && !IGNORAR.test(linea)) {
      resultado.noEntendidas.push(original);
    }
  }

  if (movimientos.length > 0) {
    const f = formato || { formato: "Otro", minutos: null, detalle: "" };
    resultado.wod = { formato: f.formato, minutos: f.minutos, detalle: f.detalle, movimientos: movimientos };
  }
  return resultado;
}

// ---------- Imagen ----------

function cargarImagen(archivo) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => ok({ img: img, url: url });
    img.onerror = () => mal(new Error("No se ha podido abrir la imagen."));
    img.src = url;
  });
}

// Reduce a 2000 px como mucho, pasa a grises y estira el contraste.
// Si la imagen es oscura (captura en modo oscuro, pizarra negra) la invierte:
// el lector funciona mejor con texto oscuro sobre fondo claro.
function prepararImagen(img) {
  const escala = Math.min(1, 2000 / Math.max(img.width, img.height));
  const ancho = Math.round(img.width * escala);
  const alto = Math.round(img.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, ancho, alto);

  const datos = ctx.getImageData(0, 0, ancho, alto);
  const p = datos.data;
  let min = 255, max = 0, suma = 0;
  for (let i = 0; i < p.length; i += 4) {
    const l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    p[i] = l;
    if (l < min) min = l;
    if (l > max) max = l;
    suma += l;
  }
  const media = suma / (p.length / 4);
  const invertir = media < 110;
  const rango = Math.max(1, max - min);
  for (let i = 0; i < p.length; i += 4) {
    let l = ((p[i] - min) / rango) * 255;
    if (invertir) l = 255 - l;
    p[i] = p[i + 1] = p[i + 2] = l;
  }
  ctx.putImageData(datos, 0, 0);
  return canvas;
}

// ---------- Lector de texto (Tesseract.js) ----------

let promesaTesseract = null;

function cargarTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (!promesaTesseract) {
    promesaTesseract = new Promise((ok, mal) => {
      const script = document.createElement("script");
      script.src = URL_TESSERACT;
      script.onload = ok;
      script.onerror = () => {
        promesaTesseract = null;
        mal(new Error("No se ha podido cargar el lector. ¿Tienes conexión?"));
      };
      document.head.appendChild(script);
    });
  }
  return promesaTesseract;
}

// alProgreso(0..1). La primera vez descarga el lector y los idiomas (unos MB).
async function leerTextoDeImagen(canvas, alProgreso) {
  await cargarTesseract();
  const worker = await Tesseract.createWorker(["spa", "eng"], 1, {
    logger: (m) => {
      if (m.status === "recognizing text") alProgreso(m.progress);
    },
  });
  try {
    const r = await worker.recognize(canvas);
    return r.data.text;
  } finally {
    await worker.terminate();
  }
}
