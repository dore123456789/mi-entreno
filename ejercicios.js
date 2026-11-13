// ---------- Biblioteca de ejercicios (la gestionas tú) ----------
// Para añadir uno, copia una línea parecida y cámbiala.
//
// id           fijo: no lo cambies nunca (el registro guarda el id, no el nombre)
// grupo        para filtrar en la Biblioteca y para elegir foco en Hoy
// tipo         principal | haltero | gimnastico | accesorio | metabolico
//              | ligero (músculos pequeños, para días en que la zona está cargada)
// musculos     los que más trabajan (cuentan entero en la carga)
// secundarios  los que ayudan (cuentan la mitad)
// cuidado      zonas que estresa: lumbar | rodilla | hombro
// wod          si sirve para WOD: reps de referencia (y unidad si no son reps)
// video        enlace de YouTube (opcional)

const MUSCULOS = {
  cuadriceps: "cuádriceps",
  isquios: "isquios",
  gluteos: "glúteos",
  gemelos: "gemelos",
  lumbar: "lumbar",
  pecho: "pecho",
  espalda: "espalda",
  hombros: "hombros",
  brazos: "brazos",
  core: "core",
};

const ejercicios = [
  // --- Pierna ---
  { id: "sentadilla", nombre: "Sentadilla", grupo: ["pierna"], tipo: "principal",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["isquios", "lumbar", "core"], cuidado: ["rodilla", "lumbar"],
    video: "https://www.youtube.com/watch?v=QmZAiBqPvZw" },
  { id: "sentadilla-frontal", nombre: "Sentadilla frontal", grupo: ["pierna"], tipo: "principal",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["core", "espalda"], cuidado: ["rodilla"] },
  { id: "peso-muerto", nombre: "Peso muerto", grupo: ["pierna", "haltero"], tipo: "principal",
    musculos: ["isquios", "gluteos", "lumbar"], secundarios: ["espalda", "core"], cuidado: ["lumbar"] },
  { id: "peso-muerto-rumano", nombre: "Peso muerto rumano", grupo: ["pierna"], tipo: "accesorio",
    musculos: ["isquios", "gluteos"], secundarios: ["lumbar"], cuidado: ["lumbar"] },
  { id: "zancadas", nombre: "Zancadas", grupo: ["pierna"], tipo: "accesorio",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["isquios", "core"], cuidado: ["rodilla"], wod: { reps: 20 } },
  { id: "sentadilla-goblet", nombre: "Sentadilla goblet", grupo: ["pierna"], tipo: "accesorio",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["core"], cuidado: ["rodilla"], wod: { reps: 12 } },
  { id: "hip-thrust", nombre: "Hip thrust", grupo: ["pierna"], tipo: "accesorio",
    musculos: ["gluteos"], secundarios: ["isquios"], cuidado: [] },
  { id: "subidas-cajon", nombre: "Subidas al cajón", grupo: ["pierna"], tipo: "accesorio",
    musculos: ["cuadriceps", "gluteos"], secundarios: [], cuidado: ["rodilla"], wod: { reps: 12 } },
  { id: "saltos-cajon", nombre: "Saltos al cajón", grupo: ["pierna"], tipo: "metabolico",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["gemelos"], cuidado: ["rodilla"], wod: { reps: 12 } },
  { id: "sentadilla-aire", nombre: "Sentadilla sin peso", grupo: ["pierna"], tipo: "metabolico",
    musculos: ["cuadriceps"], secundarios: ["gluteos"], cuidado: [], wod: { reps: 20 } },
  { id: "wall-ball", nombre: "Wall ball", grupo: ["pierna", "tren superior"], tipo: "metabolico",
    musculos: ["cuadriceps", "hombros"], secundarios: ["gluteos", "core"], cuidado: ["rodilla"], wod: { reps: 15 } },
  { id: "swing-kettlebell", nombre: "Swing con kettlebell", grupo: ["pierna"], tipo: "metabolico",
    musculos: ["gluteos", "isquios"], secundarios: ["lumbar", "core", "hombros"], cuidado: ["lumbar"], wod: { reps: 15 } },

  // --- Tren superior ---
  { id: "press-banca", nombre: "Press banca", grupo: ["tren superior"], tipo: "principal",
    musculos: ["pecho"], secundarios: ["hombros", "brazos"], cuidado: ["hombro"] },
  { id: "press-militar", nombre: "Press militar", grupo: ["tren superior"], tipo: "principal",
    musculos: ["hombros"], secundarios: ["brazos", "core"], cuidado: ["hombro"] },
  { id: "push-press", nombre: "Push press", grupo: ["tren superior", "haltero"], tipo: "principal",
    musculos: ["hombros"], secundarios: ["brazos", "cuadriceps", "core"], cuidado: ["hombro"], wod: { reps: 10 } },
  { id: "remo-barra", nombre: "Remo con barra", grupo: ["tren superior"], tipo: "principal",
    musculos: ["espalda"], secundarios: ["brazos", "lumbar"], cuidado: ["lumbar"] },
  { id: "dominadas", nombre: "Dominadas", grupo: ["tren superior"], tipo: "gimnastico",
    musculos: ["espalda"], secundarios: ["brazos", "core"], cuidado: ["hombro"], wod: { reps: 8 } },
  { id: "flexiones", nombre: "Flexiones", grupo: ["tren superior"], tipo: "gimnastico",
    musculos: ["pecho"], secundarios: ["hombros", "brazos", "core"], cuidado: [], wod: { reps: 12 } },
  { id: "fondos", nombre: "Fondos", grupo: ["tren superior"], tipo: "gimnastico",
    musculos: ["pecho", "brazos"], secundarios: ["hombros"], cuidado: ["hombro"], wod: { reps: 10 } },
  { id: "remo-mancuerna", nombre: "Remo con mancuerna", grupo: ["tren superior"], tipo: "accesorio",
    musculos: ["espalda"], secundarios: ["brazos"], cuidado: [] },
  { id: "remo-anillas", nombre: "Remo en anillas", grupo: ["tren superior"], tipo: "accesorio",
    musculos: ["espalda"], secundarios: ["brazos"], cuidado: [], wod: { reps: 12 } },
  { id: "press-mancuernas", nombre: "Press con mancuernas", grupo: ["tren superior"], tipo: "accesorio",
    musculos: ["hombros"], secundarios: ["brazos"], cuidado: ["hombro"] },
  { id: "curl-biceps", nombre: "Curl de bíceps", grupo: ["tren superior"], tipo: "accesorio",
    musculos: ["brazos"], secundarios: [], cuidado: [] },

  // --- Halterofilia ---
  { id: "arrancada", nombre: "Arrancada", grupo: ["haltero", "pierna", "tren superior"], tipo: "haltero",
    musculos: ["gluteos", "isquios", "hombros"], secundarios: ["cuadriceps", "espalda", "lumbar", "core"], cuidado: ["hombro", "lumbar"], wod: { reps: 5 } },
  { id: "envion", nombre: "Envión", grupo: ["haltero", "pierna", "tren superior"], tipo: "haltero",
    musculos: ["cuadriceps", "gluteos", "hombros"], secundarios: ["isquios", "espalda", "brazos", "core"], cuidado: ["lumbar", "hombro"], wod: { reps: 5 } },
  { id: "cargada", nombre: "Cargada de potencia", grupo: ["haltero", "pierna"], tipo: "haltero",
    musculos: ["gluteos", "isquios", "espalda"], secundarios: ["cuadriceps", "lumbar", "core"], cuidado: ["lumbar"], wod: { reps: 6 } },
  { id: "thruster", nombre: "Thruster", grupo: ["pierna", "tren superior"], tipo: "metabolico",
    musculos: ["cuadriceps", "hombros"], secundarios: ["gluteos", "brazos", "core"], cuidado: ["rodilla", "hombro"], wod: { reps: 10 } },
  { id: "arrancada-mancuerna", nombre: "Arrancada con mancuerna", grupo: ["haltero"], tipo: "metabolico",
    musculos: ["gluteos", "hombros"], secundarios: ["isquios", "core"], cuidado: ["hombro"], wod: { reps: 10 } },

  // --- Cardio ---
  { id: "remo", nombre: "Remo", grupo: ["cardio"], tipo: "metabolico",
    musculos: [], secundarios: ["espalda", "cuadriceps"], cuidado: [], wod: { reps: 15, unidad: "cal" } },
  { id: "bici", nombre: "Bici de aire", grupo: ["cardio"], tipo: "metabolico",
    musculos: [], secundarios: ["cuadriceps"], cuidado: [], wod: { reps: 12, unidad: "cal" } },
  { id: "carrera", nombre: "Carrera", grupo: ["cardio"], tipo: "metabolico",
    musculos: [], secundarios: ["cuadriceps", "isquios", "gemelos"], cuidado: ["rodilla"], wod: { reps: 200, unidad: "m" } },
  { id: "comba", nombre: "Comba", grupo: ["cardio"], tipo: "metabolico",
    musculos: [], secundarios: ["gemelos"], cuidado: [], wod: { reps: 50 } },
  { id: "burpee", nombre: "Burpee", grupo: ["cardio"], tipo: "metabolico",
    musculos: [], secundarios: ["pecho", "cuadriceps", "core"], cuidado: [], wod: { reps: 10 } },

  // --- Core ---
  { id: "toes-to-bar", nombre: "Toes to bar", grupo: ["core"], tipo: "gimnastico",
    musculos: ["core"], secundarios: ["espalda"], cuidado: ["hombro"], wod: { reps: 10 } },
  { id: "abdominales", nombre: "Abdominales (sit-ups)", grupo: ["core"], tipo: "metabolico",
    musculos: ["core"], secundarios: [], cuidado: [], wod: { reps: 15 } },
  { id: "rueda-abdominal", nombre: "Rueda abdominal", grupo: ["core"], tipo: "accesorio",
    musculos: ["core"], secundarios: ["hombros"], cuidado: ["lumbar"] },
  { id: "elevaciones-piernas", nombre: "Elevaciones de piernas", grupo: ["core"], tipo: "accesorio",
    musculos: ["core"], secundarios: [], cuidado: [] },

  // --- Ligeros: músculos pequeños, poca carga ---
  { id: "elevacion-gemelos", nombre: "Elevación de gemelos", grupo: ["pierna"], tipo: "ligero",
    musculos: ["gemelos"], secundarios: [], cuidado: [] },
  { id: "abduccion-banda", nombre: "Abducción de cadera con banda", grupo: ["pierna"], tipo: "ligero",
    musculos: [], secundarios: ["gluteos"], cuidado: [] },
  { id: "monster-walk", nombre: "Monster walk con banda", grupo: ["pierna"], tipo: "ligero",
    musculos: [], secundarios: ["gluteos"], cuidado: [] },
  { id: "face-pull", nombre: "Face pull con banda", grupo: ["tren superior"], tipo: "ligero",
    musculos: [], secundarios: ["hombros", "espalda"], cuidado: [] },
  { id: "rotacion-externa", nombre: "Rotación externa con banda", grupo: ["tren superior"], tipo: "ligero",
    musculos: [], secundarios: ["hombros"], cuidado: [] },
  { id: "triceps-banda", nombre: "Extensión de tríceps con banda", grupo: ["tren superior"], tipo: "ligero",
    musculos: ["brazos"], secundarios: [], cuidado: [] },
  { id: "pallof-press", nombre: "Pallof press con banda", grupo: ["core"], tipo: "ligero",
    musculos: [], secundarios: ["core"], cuidado: [] },
  { id: "tecnica-palo", nombre: "Técnica de arrancada con palo", grupo: ["haltero"], tipo: "ligero",
    musculos: [], secundarios: ["hombros"], cuidado: [] },

  // --- Nuevos aprobados en la revisión de noviembre ---
  { id: "handstand-push-up", nombre: "Flexiones en pino (HSPU)", grupo: ["tren superior"], tipo: "gimnastico",
    musculos: ["hombros", "brazos"], secundarios: ["core"], cuidado: ["hombro"], wod: { reps: 5 } },
  { id: "muscle-up", nombre: "Muscle-up", grupo: ["tren superior"], tipo: "gimnastico",
    musculos: ["espalda", "pecho", "brazos"], secundarios: ["hombros", "core"], cuidado: ["hombro"], wod: { reps: 3 } },
  { id: "subida-cuerda", nombre: "Subida a la cuerda", grupo: ["tren superior"], tipo: "gimnastico",
    musculos: ["espalda", "brazos"], secundarios: ["core"], cuidado: ["hombro"], wod: { reps: 2 } },
  { id: "sentadilla-overhead", nombre: "Sentadilla overhead", grupo: ["haltero", "pierna"], tipo: "haltero",
    musculos: ["cuadriceps", "gluteos", "hombros"], secundarios: ["core", "espalda"], cuidado: ["hombro", "rodilla"], wod: { reps: 10 } },
  { id: "devil-press", nombre: "Devil press", grupo: ["haltero"], tipo: "metabolico",
    musculos: ["hombros", "gluteos"], secundarios: ["isquios", "pecho", "core"], cuidado: ["lumbar", "hombro"], wod: { reps: 8 } },
  { id: "cargada-kettlebell", nombre: "Cargada con kettlebell", grupo: ["haltero"], tipo: "metabolico",
    musculos: ["gluteos", "espalda"], secundarios: ["isquios", "brazos"], cuidado: [], wod: { reps: 12 } },
  { id: "plancha", nombre: "Plancha", grupo: ["core"], tipo: "ligero",
    musculos: ["core"], secundarios: ["hombros"], cuidado: [], esquemaFijo: [3, 30], unidadReps: "s" },
  { id: "paseo-granjero", nombre: "Paseo del granjero", grupo: ["core"], tipo: "metabolico",
    musculos: ["core"], secundarios: ["brazos", "espalda"], cuidado: [], wod: { reps: 40, unidad: "m" } },
  { id: "ski-erg", nombre: "SkiErg", grupo: ["cardio"], tipo: "metabolico",
    musculos: [], secundarios: ["espalda", "brazos", "core"], cuidado: [], wod: { reps: 15, unidad: "cal" } },
];

// ---------- Vídeos ----------
// Un vídeo de YouTube por ejercicio (id del vídeo). Todos comprobados: existen
// y YouTube permite verlos dentro de la app. La mayoría son del canal oficial
// de CrossFit; el resto de Catalyst Athletics, Concept2, Rogue, fisioterapeutas
// y entrenadores.
const VIDEOS = {
  "sentadilla": "QmZAiBqPvZw", "sentadilla-frontal": "m4ytaCJZpl0", "sentadilla-goblet": "OwAh0sBFpec",
  "sentadilla-aire": "C_VtOYc6j5c", "sentadilla-overhead": "RD_vUnqwqqI", "zancadas": "L8fvypPrzzs",
  "subidas-cajon": "tCZ5yde3F2U", "wall-ball": "EqjGKsiIMCE", "peso-muerto": "op9kVnSso6Q",
  "peso-muerto-rumano": "zr6XNqmOhrY", "hip-thrust": "NDlzVV-UCHE", "swing-kettlebell": "vdezTMulJ-k",
  "press-banca": "XSza8hVTlmM", "press-militar": "xe19t2_6yis", "push-press": "X6-DMh-t4nQ",
  "press-mancuernas": "AqzDJHxynwo", "flexiones": "_l3ySVKYVJ8", "fondos": "Vt0lO4jpIDo",
  "handstand-push-up": "hvoQiF0kBI8", "dominadas": "r45xLlH7r_M", "muscle-up": "vJTJFc2wmk4",
  "subida-cuerda": "qFE7pgOrj5w", "remo-barra": "VIGO-g8fHdM", "remo-mancuerna": "S_kOe9mOLlg",
  "remo-anillas": "xhlReCpAE9k", "curl-biceps": "Nr-sPLLOIwE", "triceps-banda": "qjPN6ElNqpc",
  "arrancada": "9xQp2sldyts", "envion": "jiYPejuiNck", "cargada": "GVt4uQ0sDJE",
  "thruster": "L219ltL15zk", "arrancada-mancuerna": "R0mhHuVrLHA", "devil-press": "cBGQrgovLFM",
  "cargada-kettlebell": "SOkqtf91jbU", "toes-to-bar": "CaDbc9ft-Ac", "abdominales": "_HDZODOx7Zw",
  "pallof-press": "Qk_Xt_K7hjA", "plancha": "yeKv5oX_6GY", "paseo-granjero": "MH8id-EaoPA",
  "monster-walk": "hE4UsbLMjC8", "remo": "S7HEm-fd534", "bici": "mY9ihujdkc0",
  "ski-erg": "9Jqcxr8Iq5E", "carrera": "sScNDZu2MWk", "comba": "-tF3hUsPZAI",
  "burpee": "TU8QYVW0gDU", "saltos-cajon": "52r_Ul5k03g",
};
for (const e of ejercicios) {
  if (!e.video && VIDEOS[e.id]) {
    e.video = "https://www.youtube.com/watch?v=" + VIDEOS[e.id];
  }
}

// ---------- Movilidad (para calentar y para días de descanso) ----------
// zonas: músculos que prepara. dosis: lo que se hace.

const MOVILIDAD = [
  { nombre: "Movilidad de tobillo en pared", zonas: ["gemelos", "cuadriceps"], dosis: "10 por lado" },
  { nombre: "Sentadilla profunda con pausa", zonas: ["cuadriceps", "gluteos"], dosis: "5 × 10 s" },
  { nombre: "Rotaciones de cadera 90/90", zonas: ["gluteos"], dosis: "8 por lado" },
  { nombre: "Puente de glúteo", zonas: ["gluteos", "lumbar"], dosis: "12" },
  { nombre: "Buenos días sin peso", zonas: ["isquios", "lumbar"], dosis: "10" },
  { nombre: "Gato-camello", zonas: ["lumbar", "espalda"], dosis: "10" },
  { nombre: "Rotaciones torácicas a cuatro patas", zonas: ["espalda", "hombros"], dosis: "8 por lado" },
  { nombre: "Dislocaciones con palo o banda", zonas: ["hombros", "pecho"], dosis: "10" },
  { nombre: "Separaciones con banda", zonas: ["hombros", "espalda"], dosis: "15" },
  { nombre: "Apertura de pecho en pared", zonas: ["pecho"], dosis: "30 s por lado" },
  { nombre: "Círculos de brazos y muñecas", zonas: ["brazos"], dosis: "30 s" },
  { nombre: "Dead bug", zonas: ["core"], dosis: "8 por lado" },
  { nombre: "Colgarse de la barra", zonas: ["espalda", "hombros"], dosis: "2 × 20 s" },
];

// Índice por id, y grupo "wod" automático para los que sirven en un WOD.
const porId = {};
for (const e of ejercicios) {
  if (e.wod && !e.grupo.includes("wod")) {
    e.grupo.push("wod");
  }
  porId[e.id] = e;
}

function nombreDe(id) {
  return porId[id] ? porId[id].nombre : "Ejercicio retirado";
}

// "15 cal Remo", "10 Thruster"...
function textoMovimiento(mov) {
  const e = porId[mov.ejercicio];
  const unidad = e && e.wod && e.wod.unidad ? e.wod.unidad + " " : "";
  return mov.reps + " " + unidad + nombreDe(mov.ejercicio);
}

// Músculos principales, o los secundarios si no tiene (ej. cardio).
function textoMusculos(e) {
  const lista = e.musculos.length > 0 ? e.musculos : e.secundarios;
  return lista.length > 0 ? lista.map(m => MUSCULOS[m]).join(", ") : "cardio";
}
