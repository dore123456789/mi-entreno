// ---------- Biblioteca de ejercicios (la gestionas tú) ----------
// Para añadir uno, copia una línea parecida y cámbiala.
//
// id           fijo: no lo cambies nunca (el registro guarda el id, no el nombre)
// grupo        zona para elegir foco en Hoy: pierna | tren superior | haltero | core | cardio
// tipo         principal | haltero | gimnastico | accesorio | metabolico
//              | ligero (músculos pequeños, para días en que la zona está cargada)
// patron       patrón de movimiento: sentadilla | bisagra | unilateral | empuje |
//              traccion | olimpico | core | cardio | salto | acarreo | gluteo
//              (sirve para no repetir patrón en la misma sesión y equilibrar la semana)
// modal        para mezclar el WOD: C cardio · G gimnástico (peso corporal) · W con carga
// musculos     los que más trabajan (cuentan entero en la carga)
// secundarios  los que ayudan (cuentan la mitad)
// cuidado      zonas que estresa: lumbar | rodilla | hombro
// wod          si sirve para WOD: reps de referencia (y unidad si no son reps)
// cats, nivel  categorías y nivel de la revisión de noviembre (Biblioteca)

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

const CATEGORIAS = {
  "fuerza": "Fuerza",
  "halterofilia": "Halterofilia",
  "gimnasticos": "Gimnásticos",
  "hyrox": "Hyrox",
  "metcon": "Metcon",
  "tren-superior": "Tren superior",
  "tren-inferior": "Tren inferior",
  "accesorios": "Accesorios",
  "cardio": "Cardio",
  "maquinas": "Máquinas de cardio",
};

const ejercicios = [
  // --- Tren inferior ---
  { id: "sentadilla", nombre: "Sentadilla", grupo: ["pierna"], tipo: "principal", patron: ["sentadilla"], modal: "W",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["isquios", "lumbar", "core"], cuidado: ["rodilla", "lumbar"],
    cats: ["fuerza", "metcon", "tren-inferior"], nivel: "intermedio" },
  { id: "sentadilla-frontal", nombre: "Sentadilla frontal", grupo: ["pierna", "haltero"], tipo: "principal", patron: ["sentadilla"], modal: "W",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["core", "espalda"], cuidado: ["rodilla"],
    cats: ["fuerza", "halterofilia", "metcon", "tren-inferior"], nivel: "intermedio" },
  { id: "sentadilla-goblet", nombre: "Sentadilla goblet", grupo: ["pierna"], tipo: "accesorio", patron: ["sentadilla"], modal: "W",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["core"], cuidado: ["rodilla"], wod: { reps: 12 },
    cats: ["hyrox", "metcon", "tren-inferior", "accesorios"], nivel: "principiante" },
  { id: "sentadilla-aire", nombre: "Sentadilla sin peso", grupo: ["pierna"], tipo: "metabolico", patron: ["sentadilla"], modal: "G",
    musculos: ["cuadriceps"], secundarios: ["gluteos"], cuidado: [], wod: { reps: 20 },
    cats: ["hyrox", "metcon", "cardio"], nivel: "principiante" },
  { id: "peso-muerto", nombre: "Peso muerto", grupo: ["pierna"], tipo: "principal", patron: ["bisagra"], modal: "W",
    musculos: ["isquios", "gluteos", "lumbar"], secundarios: ["espalda", "core"], cuidado: ["lumbar"],
    cats: ["fuerza", "metcon", "tren-inferior"], nivel: "intermedio" },
  { id: "peso-muerto-rumano", nombre: "Peso muerto rumano", grupo: ["pierna"], tipo: "accesorio", patron: ["bisagra"], modal: "W",
    musculos: ["isquios", "gluteos"], secundarios: ["lumbar"], cuidado: ["lumbar"],
    cats: ["tren-inferior", "accesorios"], nivel: "intermedio" },
  { id: "hip-thrust", nombre: "Hip thrust", grupo: ["pierna"], tipo: "accesorio", patron: ["bisagra"], modal: "W",
    musculos: ["gluteos"], secundarios: ["isquios"], cuidado: [],
    cats: ["tren-inferior", "accesorios"], nivel: "principiante" },
  { id: "zancadas", nombre: "Zancadas", grupo: ["pierna"], tipo: "accesorio", patron: ["unilateral"], modal: "W",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["isquios", "core"], cuidado: ["rodilla"], wod: { reps: 20 },
    cats: ["hyrox", "metcon", "tren-inferior", "accesorios"], nivel: "principiante" },
  { id: "subidas-cajon", nombre: "Subidas al cajón", grupo: ["pierna"], tipo: "accesorio", patron: ["unilateral"], modal: "W",
    musculos: ["cuadriceps", "gluteos"], secundarios: [], cuidado: ["rodilla"], wod: { reps: 12 },
    cats: ["hyrox", "metcon", "tren-inferior", "accesorios"], nivel: "principiante" },
  { id: "saltos-cajon", nombre: "Saltos al cajón", grupo: ["pierna"], tipo: "metabolico", patron: ["salto"], modal: "G",
    musculos: ["cuadriceps", "gluteos"], secundarios: ["gemelos"], cuidado: ["rodilla"], wod: { reps: 12 },
    cats: ["hyrox", "metcon", "tren-inferior", "cardio"], nivel: "principiante" },
  { id: "wall-ball", nombre: "Wall ball", grupo: ["pierna", "tren superior"], tipo: "metabolico", patron: ["sentadilla", "empuje"], modal: "W",
    musculos: ["cuadriceps", "hombros"], secundarios: ["gluteos", "core"], cuidado: ["rodilla"], wod: { reps: 15 },
    cats: ["hyrox", "metcon", "tren-inferior", "cardio"], nivel: "principiante" },
  { id: "swing-kettlebell", nombre: "Swing con kettlebell", grupo: ["pierna"], tipo: "metabolico", patron: ["bisagra"], modal: "W",
    musculos: ["gluteos", "isquios"], secundarios: ["lumbar", "core", "hombros"], cuidado: ["lumbar"], wod: { reps: 15 },
    cats: ["hyrox", "metcon", "cardio"], nivel: "principiante" },
  { id: "monster-walk", nombre: "Monster walk con banda", grupo: ["pierna"], tipo: "ligero", patron: ["gluteo"], modal: "G",
    musculos: [], secundarios: ["gluteos"], cuidado: [],
    cats: ["accesorios", "tren-inferior"], nivel: "principiante" },

  // --- Tren superior ---
  { id: "press-banca", nombre: "Press banca", grupo: ["tren superior"], tipo: "principal", patron: ["empuje"], modal: "W",
    musculos: ["pecho"], secundarios: ["hombros", "brazos"], cuidado: ["hombro"],
    cats: ["fuerza", "metcon", "tren-superior", "accesorios"], nivel: "principiante" },
  { id: "press-militar", nombre: "Press militar", grupo: ["tren superior"], tipo: "principal", patron: ["empuje"], modal: "W",
    musculos: ["hombros"], secundarios: ["brazos", "core"], cuidado: ["hombro"],
    cats: ["fuerza", "tren-superior", "accesorios"], nivel: "principiante" },
  { id: "push-press", nombre: "Push press", grupo: ["tren superior", "haltero"], tipo: "principal", patron: ["empuje"], modal: "W",
    musculos: ["hombros"], secundarios: ["brazos", "cuadriceps", "core"], cuidado: ["hombro"], wod: { reps: 10 },
    cats: ["fuerza", "halterofilia", "metcon", "tren-superior"], nivel: "intermedio" },
  { id: "press-mancuernas", nombre: "Press con mancuernas", grupo: ["tren superior"], tipo: "accesorio", patron: ["empuje"], modal: "W",
    musculos: ["hombros"], secundarios: ["brazos"], cuidado: ["hombro"],
    cats: ["tren-superior", "accesorios"], nivel: "principiante" },
  { id: "flexiones", nombre: "Flexiones", grupo: ["tren superior"], tipo: "gimnastico", patron: ["empuje"], modal: "G",
    musculos: ["pecho"], secundarios: ["hombros", "brazos", "core"], cuidado: [], wod: { reps: 12 },
    cats: ["gimnasticos", "hyrox", "metcon", "tren-superior", "accesorios"], nivel: "principiante" },
  { id: "fondos", nombre: "Fondos", grupo: ["tren superior"], tipo: "gimnastico", patron: ["empuje"], modal: "G",
    musculos: ["pecho", "brazos"], secundarios: ["hombros"], cuidado: ["hombro"], wod: { reps: 10 },
    cats: ["gimnasticos", "metcon", "tren-superior", "accesorios"], nivel: "intermedio" },
  { id: "handstand-push-up", nombre: "Flexiones en pino (HSPU)", grupo: ["tren superior"], tipo: "gimnastico", patron: ["empuje"], modal: "G",
    musculos: ["hombros", "brazos"], secundarios: ["core"], cuidado: ["hombro"], wod: { reps: 5 },
    cats: ["gimnasticos", "metcon", "tren-superior"], nivel: "avanzado" },
  { id: "triceps-banda", nombre: "Extensión de tríceps con banda", grupo: ["tren superior"], tipo: "ligero", patron: ["empuje"], modal: "G",
    musculos: ["brazos"], secundarios: [], cuidado: [],
    cats: ["accesorios", "tren-superior"], nivel: "principiante" },
  { id: "remo-barra", nombre: "Remo con barra", grupo: ["tren superior"], tipo: "principal", patron: ["traccion"], modal: "W",
    musculos: ["espalda"], secundarios: ["brazos", "lumbar"], cuidado: ["lumbar"],
    cats: ["fuerza", "tren-superior", "accesorios"], nivel: "intermedio" },
  { id: "remo-mancuerna", nombre: "Remo con mancuerna", grupo: ["tren superior"], tipo: "accesorio", patron: ["traccion"], modal: "W",
    musculos: ["espalda"], secundarios: ["brazos"], cuidado: [],
    cats: ["tren-superior", "accesorios"], nivel: "principiante" },
  { id: "remo-anillas", nombre: "Remo en anillas", grupo: ["tren superior"], tipo: "accesorio", patron: ["traccion"], modal: "G",
    musculos: ["espalda"], secundarios: ["brazos"], cuidado: [], wod: { reps: 12 },
    cats: ["tren-superior", "accesorios"], nivel: "principiante" },
  { id: "dominadas", nombre: "Dominadas", grupo: ["tren superior"], tipo: "gimnastico", patron: ["traccion"], modal: "G",
    musculos: ["espalda"], secundarios: ["brazos", "core"], cuidado: ["hombro"], wod: { reps: 8 },
    cats: ["gimnasticos", "hyrox", "metcon", "tren-superior", "accesorios"], nivel: "intermedio" },
  { id: "muscle-up", nombre: "Muscle-up", grupo: ["tren superior"], tipo: "gimnastico", patron: ["traccion"], modal: "G",
    musculos: ["espalda", "pecho", "brazos"], secundarios: ["hombros", "core"], cuidado: ["hombro"], wod: { reps: 3 },
    cats: ["gimnasticos", "metcon"], nivel: "avanzado" },
  { id: "subida-cuerda", nombre: "Subida a la cuerda", grupo: ["tren superior"], tipo: "gimnastico", patron: ["traccion"], modal: "G",
    musculos: ["espalda", "brazos"], secundarios: ["core"], cuidado: ["hombro"], wod: { reps: 2 },
    cats: ["gimnasticos", "metcon"], nivel: "intermedio" },
  { id: "curl-biceps", nombre: "Curl de bíceps", grupo: ["tren superior"], tipo: "accesorio", patron: ["traccion"], modal: "W",
    musculos: ["brazos"], secundarios: [], cuidado: [],
    cats: ["tren-superior", "accesorios"], nivel: "principiante" },

  // --- Halterofilia ---
  { id: "arrancada", nombre: "Arrancada", grupo: ["haltero"], tipo: "haltero", patron: ["olimpico"], modal: "W",
    musculos: ["gluteos", "isquios", "hombros"], secundarios: ["cuadriceps", "espalda", "lumbar", "core"], cuidado: ["hombro", "lumbar"], wod: { reps: 5 },
    cats: ["halterofilia", "metcon"], nivel: "avanzado" },
  { id: "envion", nombre: "Envión", grupo: ["haltero"], tipo: "haltero", patron: ["olimpico"], modal: "W",
    musculos: ["cuadriceps", "gluteos", "hombros"], secundarios: ["isquios", "espalda", "brazos", "core"], cuidado: ["lumbar", "hombro"], wod: { reps: 5 },
    cats: ["halterofilia", "metcon"], nivel: "avanzado" },
  { id: "cargada", nombre: "Cargada de potencia", grupo: ["haltero"], tipo: "haltero", patron: ["olimpico"], modal: "W",
    musculos: ["gluteos", "isquios", "espalda"], secundarios: ["cuadriceps", "lumbar", "core"], cuidado: ["lumbar"], wod: { reps: 6 },
    cats: ["fuerza", "halterofilia", "metcon"], nivel: "intermedio" },
  { id: "sentadilla-overhead", nombre: "Sentadilla overhead", grupo: ["haltero"], tipo: "haltero", patron: ["sentadilla", "olimpico"], modal: "W",
    musculos: ["cuadriceps", "gluteos", "hombros"], secundarios: ["core", "espalda"], cuidado: ["hombro", "rodilla"], wod: { reps: 10 },
    cats: ["halterofilia", "metcon"], nivel: "avanzado" },
  { id: "thruster", nombre: "Thruster", grupo: ["pierna", "tren superior"], tipo: "metabolico", patron: ["sentadilla", "empuje"], modal: "W",
    musculos: ["cuadriceps", "hombros"], secundarios: ["gluteos", "brazos", "core"], cuidado: ["rodilla", "hombro"], wod: { reps: 10 },
    cats: ["fuerza", "halterofilia", "hyrox", "metcon"], nivel: "intermedio" },
  { id: "arrancada-mancuerna", nombre: "Arrancada con mancuerna", grupo: ["haltero"], tipo: "metabolico", patron: ["olimpico"], modal: "W",
    musculos: ["gluteos", "hombros"], secundarios: ["isquios", "core"], cuidado: ["hombro"], wod: { reps: 10 },
    cats: ["halterofilia", "hyrox", "metcon", "cardio"], nivel: "principiante" },
  { id: "devil-press", nombre: "Devil press", grupo: ["haltero"], tipo: "metabolico", patron: ["olimpico", "empuje"], modal: "W",
    musculos: ["hombros", "gluteos"], secundarios: ["isquios", "pecho", "core"], cuidado: ["lumbar", "hombro"], wod: { reps: 8 },
    cats: ["metcon"], nivel: "intermedio" },
  { id: "cargada-kettlebell", nombre: "Cargada con kettlebell", grupo: ["haltero"], tipo: "metabolico", patron: ["olimpico", "bisagra"], modal: "W",
    musculos: ["gluteos", "espalda"], secundarios: ["isquios", "brazos"], cuidado: [], wod: { reps: 12 },
    cats: ["metcon"], nivel: "intermedio" },

  // --- Core ---
  { id: "toes-to-bar", nombre: "Toes to bar", grupo: ["core"], tipo: "gimnastico", patron: ["core"], modal: "G",
    musculos: ["core"], secundarios: ["espalda"], cuidado: ["hombro"], wod: { reps: 10 },
    cats: ["gimnasticos", "metcon"], nivel: "avanzado" },
  { id: "abdominales", nombre: "Abdominales (sit-ups)", grupo: ["core"], tipo: "metabolico", patron: ["core"], modal: "G",
    musculos: ["core"], secundarios: [], cuidado: [], wod: { reps: 15 },
    cats: ["gimnasticos", "metcon", "accesorios"], nivel: "principiante" },
  { id: "pallof-press", nombre: "Pallof press con banda", grupo: ["core"], tipo: "ligero", patron: ["core"], modal: "G",
    musculos: [], secundarios: ["core"], cuidado: [],
    cats: ["accesorios"], nivel: "principiante" },
  { id: "plancha", nombre: "Plancha", grupo: ["core"], tipo: "ligero", patron: ["core"], modal: "G",
    musculos: ["core"], secundarios: ["hombros"], cuidado: [], esquemaFijo: [3, 30], unidadReps: "s",
    cats: ["accesorios"], nivel: "principiante" },
  { id: "paseo-granjero", nombre: "Paseo del granjero", grupo: ["core"], tipo: "metabolico", patron: ["acarreo"], modal: "W",
    musculos: ["core"], secundarios: ["brazos", "espalda"], cuidado: [], wod: { reps: 40, unidad: "m" }, unidadReps: "m",
    cats: ["hyrox", "metcon", "accesorios"], nivel: "principiante" },

  // --- Cardio y máquinas ---
  { id: "remo", nombre: "Remo", grupo: ["cardio"], tipo: "metabolico", patron: ["cardio"], modal: "C",
    musculos: [], secundarios: ["espalda", "cuadriceps"], cuidado: [], wod: { reps: 15, unidad: "cal" },
    cats: ["hyrox", "metcon", "maquinas"], nivel: "principiante" },
  { id: "bici", nombre: "Bici de aire", grupo: ["cardio"], tipo: "metabolico", patron: ["cardio"], modal: "C",
    musculos: [], secundarios: ["cuadriceps"], cuidado: [], wod: { reps: 12, unidad: "cal" },
    cats: ["hyrox", "metcon", "maquinas"], nivel: "principiante" },
  { id: "ski-erg", nombre: "SkiErg", grupo: ["cardio"], tipo: "metabolico", patron: ["cardio"], modal: "C",
    musculos: [], secundarios: ["espalda", "brazos", "core"], cuidado: [], wod: { reps: 15, unidad: "cal" },
    cats: ["hyrox", "metcon", "maquinas"], nivel: "principiante" },
  { id: "carrera", nombre: "Carrera", grupo: ["cardio"], tipo: "metabolico", patron: ["cardio"], modal: "C",
    musculos: [], secundarios: ["cuadriceps", "isquios", "gemelos"], cuidado: ["rodilla"], wod: { reps: 200, unidad: "m" },
    cats: ["hyrox", "metcon", "cardio"], nivel: "principiante" },
  { id: "comba", nombre: "Comba", grupo: ["cardio"], tipo: "metabolico", patron: ["cardio"], modal: "C",
    musculos: [], secundarios: ["gemelos"], cuidado: [], wod: { reps: 50 },
    cats: ["metcon", "cardio"], nivel: "principiante" },
  { id: "burpee", nombre: "Burpee", grupo: ["cardio"], tipo: "metabolico", patron: ["cardio"], modal: "G",
    musculos: [], secundarios: ["pecho", "cuadriceps", "core"], cuidado: [], wod: { reps: 10 },
    cats: ["hyrox", "metcon", "cardio"], nivel: "principiante" },
];

// Ejercicios que se quitaron en la revisión de noviembre. Se guardan solo sus
// nombres para que el historial antiguo se siga leyendo bien.
const RETIRADOS = {
  "rueda-abdominal": "Rueda abdominal",
  "elevaciones-piernas": "Elevaciones de piernas",
  "elevacion-gemelos": "Elevación de gemelos",
  "abduccion-banda": "Abducción de cadera con banda",
  "face-pull": "Face pull con banda",
  "rotacion-externa": "Rotación externa con banda",
  "tecnica-palo": "Técnica de arrancada con palo",
};

// ---------- Vídeos ----------
// Un vídeo de YouTube por ejercicio (id del vídeo). Todos comprobados: existen
// y YouTube permite verlos dentro de la app. La mayoría son del canal oficial
// de CrossFit; el resto de Catalyst Athletics, Concept2, Rogue, fisioterapeutas
// y entrenadores. Aprobados uno a uno en noviembre.
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

// ---------- Calentamiento ----------
// Sin cardio. Fase 1 "basica": movilidad articular, sin carga.
// Fase 2 "rangos": movilidad/fuerza en últimos rangos, lento y con pausas.
// zonas: músculos que prepara. olimpico: va bien antes de halterofilia.
// Lista aprobada en la revisión de noviembre (26 de 35).

const CALENTAMIENTO = [
  // Fase 1 · movilidad básica
  { id: "cal-gato-camello", nombre: "Gato-camello", fase: "basica", zonas: ["lumbar", "espalda"], dosis: "10" },
  { id: "cal-toracica", nombre: "Rotaciones torácicas a cuatro patas", fase: "basica", zonas: ["espalda", "hombros"], dosis: "8 por lado" },
  { id: "cal-9090", nombre: "Rotaciones de cadera 90/90", fase: "basica", zonas: ["gluteos"], dosis: "8 por lado" },
  { id: "cal-tobillo", nombre: "Movilidad de tobillo en pared", fase: "basica", zonas: ["gemelos", "cuadriceps"], dosis: "10 por lado" },
  { id: "cal-inchworm", nombre: "Gusano (inchworm)", fase: "basica", zonas: ["isquios", "hombros", "core"], dosis: "5" },
  { id: "cal-worlds-greatest", nombre: "Zancada con rotación (world's greatest stretch)", fase: "basica", zonas: ["gluteos", "cuadriceps", "espalda"], dosis: "4 por lado, 5 s con el codo abajo" },
  { id: "cal-pecho-pared", nombre: "Apertura de pecho en pared", fase: "basica", zonas: ["pecho", "hombros"], dosis: "30 s por lado" },
  { id: "cal-flexor-cadera", nombre: "Estiramiento de flexor de cadera de rodillas", fase: "basica", zonas: ["cuadriceps", "gluteos"], dosis: "30 s por lado" },
  { id: "cal-rezo", nombre: "Estiramiento de rezo (dorsales)", fase: "basica", zonas: ["espalda", "hombros"], dosis: "30 s" },
  // Fase 2 · movilidad/fuerza en últimos rangos
  { id: "cal-cosaca", nombre: "Sentadilla cosaca", fase: "rangos", zonas: ["cuadriceps", "gluteos"], dosis: "6 por lado, lento", cuidado: ["rodilla"] },
  { id: "cal-goblet-rodillas", nombre: "Sentadilla goblet con rodillas fuera", fase: "rangos", zonas: ["cuadriceps", "gluteos"], dosis: "2-3 × 30 s abajo, empujando rodillas" },
  { id: "cal-cars-cadera", nombre: "Rotaciones controladas de cadera (CARs)", fase: "rangos", zonas: ["gluteos", "lumbar"], dosis: "3 por lado, muy lento" },
  { id: "cal-liftoffs", nombre: "Elevaciones de rodilla en 90/90", fase: "rangos", zonas: ["gluteos"], dosis: "5 por lado, 2 s arriba" },
  { id: "cal-patadas-banda", nombre: "Patadas laterales con banda", fase: "rangos", zonas: ["gluteos"], dosis: "2 × 10 por lado" },
  { id: "cal-puente-pausa", nombre: "Puente de glúteo con pausa", fase: "rangos", zonas: ["gluteos", "lumbar"], dosis: "10, 2 s arriba" },
  { id: "cal-buenos-dias", nombre: "Buenos días con palo y pausa", fase: "rangos", zonas: ["isquios", "lumbar"], dosis: "8, 2 s abajo" },
  { id: "cal-jefferson", nombre: "Jefferson curl con peso muy ligero", fase: "rangos", zonas: ["isquios", "espalda"], dosis: "5, muy lento", cuidado: ["lumbar"] },
  { id: "cal-talon-escalon", nombre: "Bajada de talón en escalón", fase: "rangos", zonas: ["gemelos"], dosis: "5-10 × 10 s" },
  { id: "cal-cars-hombro", nombre: "Rotaciones controladas de hombro (CARs)", fase: "rangos", zonas: ["hombros"], dosis: "3 por lado, muy lento" },
  { id: "cal-dislocaciones", nombre: "Dislocaciones con palo o banda", fase: "rangos", zonas: ["hombros", "pecho"], dosis: "10, agarre cada vez más cerrado", olimpico: true },
  { id: "cal-w-banda", nombre: "W con banda", fase: "rangos", zonas: ["hombros", "espalda"], dosis: "2 × 15, 5 s al final" },
  { id: "cal-angeles-suelo", nombre: "Ángeles boca abajo en el suelo", fase: "rangos", zonas: ["espalda", "hombros"], dosis: "2 × 10, 3 s arriba" },
  { id: "cal-escapulas", nombre: "Dominadas escapulares", fase: "rangos", zonas: ["espalda"], dosis: "2 × 8" },
  { id: "cal-colgarse", nombre: "Colgarse de la barra (activo)", fase: "rangos", zonas: ["espalda", "hombros"], dosis: "2 × 20 s" },
  { id: "cal-ohs-palo", nombre: "Sentadilla overhead con palo", fase: "rangos", zonas: ["hombros", "cuadriceps", "gluteos"], dosis: "8 con 2 s abajo", cuidado: ["hombro"], olimpico: true },
  { id: "cal-hollow", nombre: "Hollow hold", fase: "rangos", zonas: ["core"], dosis: "3 × 20 s" },
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
  if (porId[id]) return porId[id].nombre;
  return RETIRADOS[id] || "Ejercicio retirado";
}

// "15 cal Remo", "10 Thruster", "20 min Bici de aire"...
function textoMovimiento(mov) {
  const e = porId[mov.ejercicio];
  const unidad = mov.unidad || (e && e.wod && e.wod.unidad) || "";
  return mov.reps + " " + (unidad ? unidad + " " : "") + nombreDe(mov.ejercicio);
}

// Músculos principales, o los secundarios si no tiene (ej. cardio).
function textoMusculos(e) {
  const lista = e.musculos.length > 0 ? e.musculos : e.secundarios;
  return lista.length > 0 ? lista.map(m => MUSCULOS[m]).join(", ") : "cardio";
}
