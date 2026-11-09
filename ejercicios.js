// ---------- Biblioteca de ejercicios (la gestionas tú) ----------
// Para añadir uno, copia una línea parecida y cámbiala.
//
// id           fijo: no lo cambies nunca (el registro guarda el id, no el nombre)
// grupo        para filtrar en la Biblioteca y para elegir foco en Hoy
// tipo         principal | haltero | gimnastico | accesorio | metabolico
// musculos     los que más trabajan (cuentan entero en la carga)
// secundarios  los que ayudan (cuentan la mitad)
// cuidado      zonas que estresa: lumbar | rodilla | hombro
// wod          si sirve para WOD: reps de referencia (y unidad si no son reps)
// video        enlace de YouTube (opcional)

const MUSCULOS = {
  cuadriceps: "cuádriceps",
  isquios: "isquios",
  gluteos: "glúteos",
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
    musculos: ["cuadriceps", "gluteos"], secundarios: [], cuidado: ["rodilla"], wod: { reps: 12 } },
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
    musculos: [], secundarios: ["cuadriceps", "isquios"], cuidado: ["rodilla"], wod: { reps: 200, unidad: "m" } },
  { id: "comba", nombre: "Comba", grupo: ["cardio"], tipo: "metabolico",
    musculos: [], secundarios: [], cuidado: [], wod: { reps: 50 } },
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
