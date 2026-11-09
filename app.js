// ---------- Biblioteca de ejercicios (la gestionas tú) ----------
// Cada ejercicio tiene un id fijo: el registro guarda el id, no el nombre.

const ejercicios = [
  { id: "sentadilla", nombre: "Sentadilla", grupo: ["pierna"], video: "https://www.youtube.com/watch?v=QmZAiBqPvZw" },
  { id: "zancadas", nombre: "Zancadas", grupo: ["pierna"] },
  { id: "peso-muerto", nombre: "Peso muerto", grupo: ["pierna", "haltero"] },
  { id: "arrancada", nombre: "Arrancada", grupo: ["haltero", "pierna", "tren superior"] },
  { id: "envion", nombre: "Envión", grupo: ["haltero", "pierna", "tren superior"] },
  { id: "dominadas", nombre: "Dominadas", grupo: ["tren superior"] },
  { id: "flexiones", nombre: "Flexiones", grupo: ["tren superior"] },
  { id: "press-militar", nombre: "Press militar", grupo: ["tren superior"] },
  { id: "remo", nombre: "Remo", grupo: ["wod", "cardio"] },
  { id: "burpee", nombre: "Burpee", grupo: ["wod", "cardio"] },
  { id: "comba", nombre: "Comba", grupo: ["wod", "cardio"] },
  { id: "thruster", nombre: "Thruster", grupo: ["wod", "pierna", "tren superior"] },
];

const porId = {};
for (const e of ejercicios) {
  porId[e.id] = e;
}

function nombreDe(id) {
  return porId[id] ? porId[id].nombre : "Ejercicio retirado";
}

// ---------- Datos guardados en el dispositivo ----------

function leerGuardado(clave, porDefecto) {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? JSON.parse(texto) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribirGuardado(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

// Los entrenos se guardan con un número de versión por si algún día
// cambia su estructura y hay que convertir los datos antiguos.
const datosEntrenos = leerGuardado("entrenos", null);
let entrenos = datosEntrenos && Array.isArray(datosEntrenos.entrenos)
  ? datosEntrenos.entrenos
  : [];

const borradorGuardado = leerGuardado("borrador", []);
let borrador = Array.isArray(borradorGuardado) ? borradorGuardado : [];

function guardarEntrenos() {
  return escribirGuardado("entrenos", { version: 1, entrenos: entrenos });
}

function guardarBorrador() {
  return escribirGuardado("borrador", borrador);
}

// ---------- Generador ----------

function filtrarPorGrupo(grupo) {
  return ejercicios.filter(e => e.grupo.includes(grupo));
}

function elegirAlAzar(lista, n) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, n);
}

function proponerEntrenamiento(gruposElegidos, cantidad) {
  const elegidos = [];

  for (const g of gruposElegidos) {
    const opciones = filtrarPorGrupo(g).filter(e => !elegidos.includes(e));
    if (opciones.length > 0) {
      elegidos.push(elegirAlAzar(opciones, 1)[0]);
    }
  }

  const resto = ejercicios.filter(e =>
    e.grupo.some(g => gruposElegidos.includes(g)) && !elegidos.includes(e)
  );
  const faltan = cantidad - elegidos.length;
  if (faltan > 0) {
    elegidos.push(...elegirAlAzar(resto, faltan));
  }

  return elegirAlAzar(elegidos, cantidad);
}

// ---------- Vídeo ----------

function obtenerIdVideo(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

// Crea el botón "vídeo" de un ejercicio (o null si no tiene vídeo).
// Al pulsarlo muestra u oculta el reproductor dentro del elemento li.
function crearBotonVideo(ejercicio, li) {
  const idVideo = ejercicio.video ? obtenerIdVideo(ejercicio.video) : null;
  if (!idVideo) {
    return null;
  }

  const boton = document.createElement("button");
  boton.textContent = "vídeo";
  boton.className = "mini video";
  boton.addEventListener("click", () => {
    const abierto = li.querySelector(".contenedor-video");
    if (abierto) {
      abierto.remove();
      return;
    }
    const contenedor = document.createElement("div");
    contenedor.className = "contenedor-video";

    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + idVideo + "?playsinline=1";
    iframe.title = "Vídeo de " + ejercicio.nombre;
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    contenedor.appendChild(iframe);
    li.appendChild(contenedor);
  });
  return boton;
}

// ---------- Pantalla "Hoy" ----------

const botonesGrupo = document.querySelectorAll(".grupo");
const botonProponer = document.getElementById("btn-proponer");
const lista = document.getElementById("resultado");
let gruposElegidos = [];
let propuestaActual = [];

function mostrarMensaje(texto) {
  lista.textContent = "";
  const li = document.createElement("li");
  li.className = "vacio-texto";
  li.textContent = texto;
  lista.appendChild(li);
}

function buscarSustituto(ejercicio) {
  const comunes = ejercicio.grupo.filter(g => gruposElegidos.includes(g));
  const base = comunes.length > 0 ? comunes : ejercicio.grupo;

  const candidatos = ejercicios.filter(e =>
    e.grupo.some(g => base.includes(g)) && !propuestaActual.includes(e)
  );
  if (candidatos.length === 0) {
    return null;
  }
  return elegirAlAzar(candidatos, 1)[0];
}

function mostrarPropuesta() {
  lista.textContent = "";
  propuestaActual.forEach((ejercicio, i) => {
    const li = document.createElement("li");
    li.className = "fila-ejercicio";

    const nombre = document.createElement("span");
    nombre.textContent = ejercicio.nombre;

    const acciones = document.createElement("div");

    const botonVideo = crearBotonVideo(ejercicio, li);
    if (botonVideo) {
      acciones.appendChild(botonVideo);
    }

    const boton = document.createElement("button");
    boton.textContent = "cambiar";
    boton.className = "mini";
    boton.addEventListener("click", () => {
      const sustituto = buscarSustituto(ejercicio);
      if (sustituto === null) {
        boton.textContent = "sin alternativas";
        boton.disabled = true;
        return;
      }
      propuestaActual[i] = sustituto;
      mostrarPropuesta();
    });
    acciones.appendChild(boton);

    li.appendChild(nombre);
    li.appendChild(acciones);
    lista.appendChild(li);
  });
}

for (const boton of botonesGrupo) {
  boton.addEventListener("click", () => {
    const g = boton.dataset.grupo;
    if (gruposElegidos.includes(g)) {
      gruposElegidos = gruposElegidos.filter(x => x !== g);
    } else {
      gruposElegidos.push(g);
    }
    boton.classList.toggle("activo");
  });
}

botonProponer.addEventListener("click", () => {
  if (gruposElegidos.length === 0) {
    propuestaActual = [];
    mostrarMensaje("Elige al menos un grupo");
    return;
  }
  propuestaActual = proponerEntrenamiento(gruposElegidos, 5);
  mostrarPropuesta();
});

// ---------- Pantalla "Biblioteca" (solo lectura) ----------

const filtroBiblioteca = document.getElementById("filtro-biblioteca");
const contadorBiblioteca = document.getElementById("contador-biblioteca");
const listaBiblioteca = document.getElementById("lista-biblioteca");

function mostrarBiblioteca() {
  const filtro = filtroBiblioteca.value;
  const visibles = filtro === "todos" ? ejercicios : filtrarPorGrupo(filtro);

  contadorBiblioteca.textContent = visibles.length + " ejercicios";
  listaBiblioteca.textContent = "";

  for (const ejercicio of visibles) {
    const li = document.createElement("li");
    li.className = "fila-ejercicio";

    const info = document.createElement("div");
    info.className = "info";
    const nombre = document.createElement("span");
    nombre.textContent = ejercicio.nombre;
    const grupos = document.createElement("small");
    grupos.textContent = ejercicio.grupo.join(", ");
    info.appendChild(nombre);
    info.appendChild(grupos);
    li.appendChild(info);

    const botonVideo = crearBotonVideo(ejercicio, li);
    if (botonVideo) {
      li.appendChild(botonVideo);
    }

    listaBiblioteca.appendChild(li);
  }
}

filtroBiblioteca.addEventListener("change", mostrarBiblioteca);

// ---------- Pantalla "Registro" ----------

const regFecha = document.getElementById("reg-fecha");
const regTipo = document.getElementById("reg-tipo");

const formFuerza = document.getElementById("form-fuerza");
const fuerzaEjercicio = document.getElementById("fuerza-ejercicio");
const fuerzaSeries = document.getElementById("fuerza-series");
const fuerzaReps = document.getElementById("fuerza-reps");
const fuerzaEsfuerzo = document.getElementById("fuerza-esfuerzo");

const formWod = document.getElementById("form-wod");
const wodFormato = document.getElementById("wod-formato");
const wodDetalle = document.getElementById("wod-detalle");
const wodEjercicio = document.getElementById("wod-ejercicio");
const wodReps = document.getElementById("wod-reps");
const btnWodMov = document.getElementById("btn-wod-mov");
const listaWodMovs = document.getElementById("wod-movimientos");
const wodResultado = document.getElementById("wod-resultado");
const wodEsfuerzo = document.getElementById("wod-esfuerzo");

const listaBorrador = document.getElementById("borrador");
const mensajeRegistro = document.getElementById("mensaje-registro");
const btnGuardarEntreno = document.getElementById("btn-guardar-entreno");
const listaHistorial = document.getElementById("historial");
const resumenSemana = document.getElementById("resumen-semana");

let wodMovs = [];

function rellenarSelectEjercicios(select) {
  const ordenados = [...ejercicios].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  for (const e of ordenados) {
    const opcion = document.createElement("option");
    opcion.value = e.id;
    opcion.textContent = e.nombre;
    select.appendChild(opcion);
  }
}

function rellenarSelectEsfuerzo(select) {
  const vacio = document.createElement("option");
  vacio.value = "";
  vacio.textContent = "—";
  select.appendChild(vacio);
  for (let p = 50; p <= 100; p += 5) {
    const opcion = document.createElement("option");
    opcion.value = String(p);
    opcion.textContent = p + "%";
    select.appendChild(opcion);
  }
}

// Fechas: se trabaja con texto "AAAA-MM-DD" en hora local.
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

function enteroPositivo(texto) {
  const n = Number(texto);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function esfuerzoDe(select) {
  return select.value === "" ? null : Number(select.value);
}

function mensajeReg(texto, esError) {
  mensajeRegistro.textContent = texto;
  mensajeRegistro.classList.toggle("error", Boolean(esError));
}

function describirBloque(b) {
  const esfuerzo = b.esfuerzo ? " · " + b.esfuerzo + "%" : "";
  if (b.tipo === "wod") {
    const movs = b.movimientos.map(m => m.reps + " " + nombreDe(m.ejercicio)).join(" + ");
    const detalle = b.detalle ? " " + b.detalle : "";
    const resultado = b.resultado ? " → " + b.resultado : "";
    return "WOD " + b.formato + detalle + ": " + movs + resultado + esfuerzo;
  }
  return nombreDe(b.ejercicio) + " · " + b.series + "×" + b.reps + esfuerzo;
}

function crearBotonMini(texto, accion) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "mini";
  boton.textContent = texto;
  boton.addEventListener("click", accion);
  return boton;
}

function crearTextoVacio(texto) {
  const li = document.createElement("li");
  li.className = "vacio-texto";
  li.textContent = texto;
  return li;
}

// --- Movimientos del WOD que se está preparando ---

function mostrarWodMovs() {
  listaWodMovs.textContent = "";
  wodMovs.forEach((mov, i) => {
    const li = document.createElement("li");
    li.className = "bloque";
    const texto = document.createElement("span");
    texto.textContent = mov.reps + " " + nombreDe(mov.ejercicio);
    li.appendChild(texto);
    li.appendChild(crearBotonMini("quitar", () => {
      wodMovs.splice(i, 1);
      mostrarWodMovs();
    }));
    listaWodMovs.appendChild(li);
  });
}

btnWodMov.addEventListener("click", () => {
  const reps = enteroPositivo(wodReps.value);
  if (reps === null) {
    mensajeReg("Pon las repeticiones del movimiento.", true);
    return;
  }
  wodMovs.push({ ejercicio: wodEjercicio.value, reps: reps });
  wodReps.value = "";
  mensajeReg("");
  mostrarWodMovs();
});

// --- Borrador del entreno actual ---

function mostrarBorrador() {
  listaBorrador.textContent = "";
  if (borrador.length === 0) {
    listaBorrador.appendChild(crearTextoVacio("Todavía no has añadido nada."));
    return;
  }
  borrador.forEach((bloque, i) => {
    const li = document.createElement("li");
    li.className = "bloque";
    const texto = document.createElement("span");
    texto.textContent = describirBloque(bloque);
    li.appendChild(texto);
    li.appendChild(crearBotonMini("quitar", () => {
      borrador.splice(i, 1);
      guardarBorrador();
      mostrarBorrador();
    }));
    listaBorrador.appendChild(li);
  });
}

formFuerza.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const series = enteroPositivo(fuerzaSeries.value);
  const reps = enteroPositivo(fuerzaReps.value);
  if (series === null || reps === null) {
    mensajeReg("Series y repeticiones son obligatorias (números enteros).", true);
    return;
  }

  borrador.push({
    tipo: "fuerza",
    ejercicio: fuerzaEjercicio.value,
    series: series,
    reps: reps,
    esfuerzo: esfuerzoDe(fuerzaEsfuerzo),
  });
  guardarBorrador();

  fuerzaSeries.value = "";
  fuerzaReps.value = "";
  fuerzaEsfuerzo.value = "";
  mensajeReg("");
  mostrarBorrador();
});

formWod.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (wodMovs.length === 0) {
    mensajeReg("Añade al menos un movimiento al WOD.", true);
    return;
  }

  borrador.push({
    tipo: "wod",
    formato: wodFormato.value,
    detalle: wodDetalle.value.trim(),
    movimientos: wodMovs,
    resultado: wodResultado.value.trim(),
    esfuerzo: esfuerzoDe(wodEsfuerzo),
  });
  guardarBorrador();

  wodMovs = [];
  formWod.reset();
  mostrarWodMovs();
  mensajeReg("");
  mostrarBorrador();
});

btnGuardarEntreno.addEventListener("click", () => {
  if (!regFecha.value) {
    mensajeReg("Elige la fecha.", true);
    return;
  }
  if (borrador.length === 0) {
    mensajeReg("Añade al menos un ejercicio o un WOD.", true);
    return;
  }

  entrenos.push({
    id: Date.now(),
    fecha: regFecha.value,
    tipo: regTipo.value,
    bloques: borrador,
  });

  if (!guardarEntrenos()) {
    entrenos.pop();
    mensajeReg("No se ha podido guardar en este navegador.", true);
    return;
  }

  borrador = [];
  guardarBorrador();
  mostrarBorrador();
  mostrarHistorial();
  mostrarResumen();
  mensajeReg("Entreno guardado.");
});

// --- Historial ---

function mostrarHistorial() {
  listaHistorial.textContent = "";
  if (entrenos.length === 0) {
    listaHistorial.appendChild(crearTextoVacio("Aún no hay entrenos registrados."));
    return;
  }

  const ordenados = [...entrenos].sort((a, b) =>
    b.fecha.localeCompare(a.fecha) || b.id - a.id
  );

  for (const entreno of ordenados) {
    const li = document.createElement("li");
    li.className = "entreno";

    const cabecera = document.createElement("div");
    cabecera.className = "entreno-cabecera";

    const titulo = document.createElement("span");
    titulo.textContent = fechaDesdeISO(entreno.fecha).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = entreno.tipo === "clase" ? "Clase" : "Mi entreno";
    titulo.appendChild(etiqueta);

    cabecera.appendChild(titulo);
    cabecera.appendChild(crearBotonMini("borrar", () => {
      if (!confirm("¿Borrar este entreno?")) {
        return;
      }
      entrenos = entrenos.filter(x => x.id !== entreno.id);
      guardarEntrenos();
      mostrarHistorial();
      mostrarResumen();
    }));
    li.appendChild(cabecera);

    for (const bloque of entreno.bloques) {
      const linea = document.createElement("div");
      linea.className = "linea-bloque";
      linea.textContent = describirBloque(bloque);
      li.appendChild(linea);
    }

    listaHistorial.appendChild(li);
  }
}

// --- Resumen de los últimos 7 días ---

function gruposDeBloque(bloque) {
  const grupos = new Set();
  let ids;
  if (bloque.tipo === "wod") {
    grupos.add("wod");
    ids = bloque.movimientos.map(m => m.ejercicio);
  } else {
    ids = [bloque.ejercicio];
  }
  for (const id of ids) {
    const e = porId[id];
    if (!e) {
      continue;
    }
    for (const g of e.grupo) {
      if (g !== "wod") {
        grupos.add(g);
      }
    }
  }
  return grupos;
}

function mostrarResumen() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6);
  const cuenta = { "pierna": 0, "tren superior": 0, "cardio": 0, "wod": 0, "haltero": 0 };

  for (const entreno of entrenos) {
    if (fechaDesdeISO(entreno.fecha) < inicio) {
      continue;
    }
    for (const bloque of entreno.bloques) {
      for (const g of gruposDeBloque(bloque)) {
        if (g in cuenta) {
          cuenta[g] += 1;
        }
      }
    }
  }

  resumenSemana.textContent = "";
  for (const g in cuenta) {
    const chip = document.createElement("span");
    chip.className = cuenta[g] === 0 ? "chip vacio" : "chip";
    chip.textContent = g + " · " + cuenta[g];
    resumenSemana.appendChild(chip);
  }
}

// --- Arranque de la pantalla Registro ---

rellenarSelectEjercicios(fuerzaEjercicio);
rellenarSelectEjercicios(wodEjercicio);
rellenarSelectEsfuerzo(fuerzaEsfuerzo);
rellenarSelectEsfuerzo(wodEsfuerzo);
regFecha.value = fechaISO(new Date());
mostrarBorrador();
mostrarWodMovs();
mostrarHistorial();
mostrarResumen();

// ---------- Navegación entre pantallas ----------

const pantallas = {
  hoy: document.getElementById("pantalla-hoy"),
  registro: document.getElementById("pantalla-registro"),
  biblioteca: document.getElementById("pantalla-biblioteca"),
};
const botonesNav = document.querySelectorAll(".nav-btn");

function mostrarPantalla(nombre) {
  for (const clave in pantallas) {
    pantallas[clave].hidden = clave !== nombre;
  }
  for (const b of botonesNav) {
    b.classList.toggle("activo", b.dataset.pantalla === nombre);
  }
  if (nombre === "biblioteca") {
    mostrarBiblioteca();
  }
  if (nombre === "registro") {
    mostrarResumen();
  }
  window.scrollTo(0, 0);
}

for (const b of botonesNav) {
  b.addEventListener("click", () => mostrarPantalla(b.dataset.pantalla));
}
