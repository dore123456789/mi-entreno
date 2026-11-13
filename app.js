// ---------- Pantallas de la app ----------
// Los ejercicios están en ejercicios.js y la lógica de entrenos en motor.js.

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

// Perfil: { version, objetivo, cuidar, dias: [0, 2, 4], semanas: 8 }.
// null = aún no configurado.
let perfil = leerGuardado("perfil", null);
if (!perfil || !OBJETIVOS[perfil.objetivo]) {
  perfil = null;
} else if (!Array.isArray(perfil.cuidar)) {
  perfil.cuidar = [];
}

// Plan de entreno (ver plan.js). null = aún no creado.
let plan = leerGuardado("plan", null);
if (!plan || plan.version !== 1 || !plan.sesiones) {
  plan = null;
}

function guardarPlan() {
  return escribirGuardado("plan", plan);
}

function guardarEntrenos() {
  return escribirGuardado("entrenos", { version: 1, entrenos: entrenos });
}

function guardarBorrador() {
  return escribirGuardado("borrador", borrador);
}

function guardarPerfil() {
  return escribirGuardado("perfil", perfil);
}

// ---------- Piezas comunes ----------

// Ventana de confirmación propia. Devuelve una promesa: true si se pulsa
// el botón de seguir, false si se cancela. (La del navegador, confirm(),
// no siempre se muestra: en algunos visores se cancela sola.)
function confirmar(texto, textoSi, peligro) {
  const dialogo = document.getElementById("dialogo");
  const si = document.getElementById("dialogo-si");
  const no = document.getElementById("dialogo-no");
  document.getElementById("dialogo-texto").textContent = texto;
  si.textContent = textoSi || "Seguir";
  si.classList.toggle("peligro", Boolean(peligro));
  dialogo.hidden = false;
  si.focus();
  return new Promise((resolver) => {
    const cerrar = (respuesta) => {
      dialogo.hidden = true;
      si.onclick = no.onclick = dialogo.onclick = null;
      resolver(respuesta);
    };
    si.onclick = () => cerrar(true);
    no.onclick = () => cerrar(false);
    // Tocar fuera de la caja también cancela.
    dialogo.onclick = (e) => { if (e.target === dialogo) cerrar(false); };
  });
}

// Pequeña animación de "actualizado" sobre la parte que ha cambiado.
// No se usa mientras la app arranca, para que no parpadee todo al abrirla.
let appLista = false;
function refrescar(el) {
  if (!appLista || !el) return;
  el.classList.remove("refresco");
  void el.offsetWidth; // fuerza a reiniciar la animación si ya estaba puesta
  el.classList.add("refresco");
}

function filtrarPorGrupo(grupo) {
  return ejercicios.filter(e => e.grupo.includes(grupo));
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

function crearTarjeta(titulo) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta";
  const h2 = document.createElement("h2");
  h2.textContent = titulo;
  tarjeta.appendChild(h2);
  return tarjeta;
}

function crearParrafo(texto, clase) {
  const p = document.createElement("p");
  p.className = clase;
  p.textContent = texto;
  return p;
}

// ---------- Carga muscular en pantalla ----------

// Para dibujar se usan 4 niveles: "libre" es carga casi cero.
const NOMBRES_NIVEL = { libre: "Libre", baja: "Ligera", media: "Media", alta: "Alta" };

function nivelVista(valor) {
  return valor < 0.5 ? "libre" : nivelCarga(valor);
}

function crearPunto(nivel) {
  const punto = document.createElement("i");
  punto.className = "punto " + nivel;
  return punto;
}

// Chips de los músculos con carga media o alta (resumen de Hoy).
function pintarCargaHoy() {
  const fatiga = calcularFatiga(entrenos, new Date());
  cargaHoy.textContent = "";

  const cargados = Object.keys(MUSCULOS)
    .filter(m => nivelCarga(fatiga[m]) !== "baja")
    .sort((a, b) => fatiga[b] - fatiga[a]);

  if (cargados.length === 0) {
    const texto = document.createElement("span");
    texto.className = "ayuda";
    texto.textContent = "Todo descansado: puedes ir a por todo.";
    cargaHoy.appendChild(texto);
    return;
  }

  for (const m of cargados) {
    const nivel = nivelCarga(fatiga[m]);
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.appendChild(crearPunto(nivel));
    chip.appendChild(document.createTextNode(MUSCULOS[m] + " · " + NOMBRES_NIVEL[nivel].toLowerCase()));
    cargaHoy.appendChild(chip);
  }
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
  boton.type = "button";
  boton.textContent = "▶ Ver";
  boton.className = "mini video";
  boton.setAttribute("aria-label", "Ver vídeo de " + ejercicio.nombre);
  boton.setAttribute("aria-expanded", "false");
  boton.addEventListener("click", () => {
    const abierto = li.querySelector(".contenedor-video");
    if (abierto) {
      abierto.remove();
      boton.textContent = "▶ Ver";
      boton.setAttribute("aria-expanded", "false");
      return;
    }
    const contenedor = document.createElement("div");
    contenedor.className = "contenedor-video";

    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + idVideo + "?playsinline=1&rel=0";
    iframe.title = "Vídeo de " + ejercicio.nombre;
    iframe.allowFullscreen = true;
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    contenedor.appendChild(iframe);
    li.appendChild(contenedor);
    boton.textContent = "✕ Cerrar";
    boton.setAttribute("aria-expanded", "true");
    refrescar(contenedor);
    contenedor.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  return boton;
}

// ---------- Pantalla "Hoy" ----------

const botonesFoco = document.querySelectorAll(".grupo");
const botonProponer = document.getElementById("btn-proponer");
const contenedorPropuesta = document.getElementById("propuesta");
const cargaHoy = document.getElementById("carga-hoy");

let focos = [];
let propuesta = null;

// Datos para el motor. Si la propuesta actual es del plan, se mantiene su sesión
// (así "cambiar" respeta el foco de la sesión).
function datosMotor() {
  return {
    perfil: perfil,
    focos: focos,
    sesion: propuesta && propuesta.sesion ? propuesta.sesion : null,
    entrenos: entrenos,
    hoy: new Date(),
  };
}

// Tocar el nombre del ejercicio también abre o cierra su vídeo.
function hacerTocableParaVideo(zona, botonVideo) {
  zona.classList.add("tocable");
  zona.setAttribute("role", "button");
  zona.tabIndex = 0;
  zona.addEventListener("click", () => botonVideo.click());
  zona.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); botonVideo.click(); }
  });
}

// Fila con número, nombre, esquema (opcional), detalle y botones "vídeo" y "cambiar".
// alCambiar() debe devolver true si ha encontrado sustituto.
function crearFilaPropuesta(numero, ejercicio, titulo, esquema, detalle, alCambiar) {
  const li = document.createElement("li");
  li.className = "fila-ejercicio";

  const num = document.createElement("span");
  num.className = "num";
  num.textContent = numero;
  li.appendChild(num);

  const info = document.createElement("div");
  info.className = "info";
  const nombre = document.createElement("span");
  nombre.className = "nombre";
  nombre.textContent = titulo;
  info.appendChild(nombre);
  if (esquema) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = esquema;
    info.appendChild(pill);
  }
  const pequeno = document.createElement("small");
  pequeno.textContent = detalle;
  info.appendChild(pequeno);

  const acciones = document.createElement("div");
  acciones.className = "acciones";
  const botonVideo = crearBotonVideo(ejercicio, li);
  if (botonVideo) {
    acciones.appendChild(botonVideo);
    hacerTocableParaVideo(info, botonVideo);
  }
  const botonCambiar = crearBotonMini("↻ cambiar", () => {
    if (alCambiar()) {
      mostrarPropuesta();
    } else {
      botonCambiar.textContent = "sin alternativas";
      botonCambiar.disabled = true;
    }
  });
  acciones.appendChild(botonCambiar);

  li.appendChild(info);
  li.appendChild(acciones);
  return li;
}

// Cabecera de tarjeta con título y etiqueta de color (ej. "WOD  AMRAP").
function crearCabecera(titulo, etiqueta, claseEtiqueta) {
  const cabecera = document.createElement("div");
  cabecera.className = "wod-cabecera";
  const h2 = document.createElement("h2");
  h2.textContent = titulo;
  cabecera.appendChild(h2);
  if (etiqueta) {
    const span = document.createElement("span");
    span.className = "formato " + (claseEtiqueta || "");
    span.textContent = etiqueta;
    cabecera.appendChild(span);
  }
  return cabecera;
}

// Fila sin botones (calentamiento y movilidad).
function crearFilaSimple(numero, titulo, pill, detalle) {
  const li = document.createElement("li");
  li.className = "fila-ejercicio";
  const num = document.createElement("span");
  num.className = "num";
  num.textContent = numero;
  li.appendChild(num);

  const info = document.createElement("div");
  info.className = "info";
  const nombre = document.createElement("span");
  nombre.className = "nombre";
  nombre.textContent = titulo;
  info.appendChild(nombre);
  if (pill) {
    const p = document.createElement("span");
    p.className = "pill";
    p.textContent = pill;
    info.appendChild(p);
  }
  const pequeno = document.createElement("small");
  pequeno.textContent = detalle;
  info.appendChild(pequeno);
  li.appendChild(info);
  return li;
}

function zonasTexto(drill) {
  return "prepara " + drill.zonas.map(z => MUSCULOS[z]).join(", ");
}

function pintarDescanso() {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta";
  tarjeta.appendChild(crearCabecera("Hoy toca descanso", "MOVILIDAD", "suave"));
  tarjeta.appendChild(crearParrafo(
    "Tus músculos están muy cargados. En vez de entrenar, haz esta sesión suave "
    + "(2 rondas) o sal a dar un paseo.",
    "ayuda"
  ));
  const ul = document.createElement("ul");
  propuesta.movilidad.forEach((d, i) => {
    ul.appendChild(crearFilaSimple(i + 1, d.nombre, d.dosis, zonasTexto(d)));
  });
  tarjeta.appendChild(ul);
  contenedorPropuesta.appendChild(tarjeta);
}

function pintarAvisos() {
  if (propuesta.avisos.length === 0) {
    return;
  }
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta aviso";
  const h2 = document.createElement("h2");
  h2.textContent = "Ojo con la carga";
  tarjeta.appendChild(h2);
  for (const texto of propuesta.avisos) {
    tarjeta.appendChild(crearParrafo(texto, "aviso-texto"));
  }
  contenedorPropuesta.appendChild(tarjeta);
}

function pintarCalentamiento() {
  const c = propuesta.calentamiento;
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta";
  tarjeta.appendChild(crearCabecera("Calentamiento", "≈ 10 MIN", "suave"));
  tarjeta.appendChild(crearParrafo("Movilidad pensada para lo que vas a entrenar hoy.", "ayuda"));

  const ul = document.createElement("ul");
  let n = 1;
  if (c.cardio) {
    ul.appendChild(crearFilaSimple(n++, nombreDe(c.cardio) + " suave", "5 min", "subir pulsaciones"));
  }
  for (const d of c.movilidad) {
    ul.appendChild(crearFilaSimple(n++, d.nombre, d.dosis, zonasTexto(d)));
  }
  tarjeta.appendChild(ul);

  if (c.aproximacion) {
    tarjeta.appendChild(crearParrafo(
      "Antes de " + nombreDe(c.aproximacion) + ": 2-3 series de aproximación subiendo poco a poco el peso.",
      "ayuda"
    ));
  }
  contenedorPropuesta.appendChild(tarjeta);
}

function pintarFuerza() {
  if (propuesta.fuerza.length === 0) {
    return;
  }
  const tarjeta = crearTarjeta("Fuerza");
  const ul = document.createElement("ul");
  propuesta.fuerza.forEach((f, i) => {
    const e = porId[f.ejercicio];
    ul.appendChild(crearFilaPropuesta(
      i + 1,
      e,
      e.nombre,
      textoEsquema(f) + (f.esfuerzoObjetivo ? " · ≈" + f.esfuerzoObjetivo + "%" : ""),
      (f.delPlan ? "principal del plan · " : "") + textoMusculos(e),
      () => sustituirEnPropuesta(propuesta, datosMotor(), "fuerza", i)
    ));
  });
  tarjeta.appendChild(ul);
  const esperados = propuesta.sesion && propuesta.sesion.huecos ? propuesta.sesion.huecos.length : HUECOS_FUERZA.length;
  if (propuesta.fuerza.length < esperados) {
    tarjeta.appendChild(crearParrafo("Bloque más corto: hay músculos que necesitan descanso.", "ayuda"));
  }
  contenedorPropuesta.appendChild(tarjeta);
}

function pintarLigero() {
  if (propuesta.ligero.length === 0) {
    return;
  }
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta";
  tarjeta.appendChild(crearCabecera("Bloque ligero", "SUAVE", "suave"));
  tarjeta.appendChild(crearParrafo("Músculos pequeños, peso bajo y sin llegar al fallo.", "ayuda"));
  const ul = document.createElement("ul");
  propuesta.ligero.forEach((l, i) => {
    const e = porId[l.ejercicio];
    ul.appendChild(crearFilaPropuesta(
      i + 1,
      e,
      e.nombre,
      textoEsquema(l),
      textoMusculos(e),
      () => sustituirEnPropuesta(propuesta, datosMotor(), "ligero", i)
    ));
  });
  tarjeta.appendChild(ul);
  contenedorPropuesta.appendChild(tarjeta);
}

function pintarWod() {
  if (!propuesta.wod) {
    return;
  }
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta wod";
  tarjeta.appendChild(crearCabecera("WOD", propuesta.wod.formato.toUpperCase()));
  tarjeta.appendChild(crearParrafo(propuesta.wod.detalle, "ayuda"));

  const ul = document.createElement("ul");
  propuesta.wod.movimientos.forEach((mov, i) => {
    const e = porId[mov.ejercicio];
    ul.appendChild(crearFilaPropuesta(
      i + 1,
      e,
      textoMovimiento(mov),
      null,
      textoMusculos(e),
      () => sustituirEnPropuesta(propuesta, datosMotor(), "wod", i)
    ));
  });
  tarjeta.appendChild(ul);
  contenedorPropuesta.appendChild(tarjeta);
}

function mostrarPropuesta() {
  refrescar(contenedorPropuesta);
  contenedorPropuesta.textContent = "";
  if (!propuesta) {
    return;
  }

  if (propuesta.movilidad) {
    pintarDescanso();
    return;
  }

  pintarAvisos();
  pintarCalentamiento();
  pintarFuerza();
  pintarLigero();
  pintarWod();

  const botonRegistrar = document.createElement("button");
  botonRegistrar.className = "principal";
  botonRegistrar.textContent = "Registrar este entreno";
  botonRegistrar.addEventListener("click", abrirHoja);
  contenedorPropuesta.appendChild(botonRegistrar);
}

// ---------- Hoja "¿Cómo ha ido?" ----------
// Al registrar la propuesta de Hoy se pregunta lo que de verdad se ha hecho:
// series, reps, kg y esfuerzo de cada ejercicio, y el resultado del WOD.
// El calentamiento no se registra: no cuenta como carga.

const hoja = document.getElementById("hoja-guardar");
const hojaFecha = document.getElementById("hoja-fecha");
const hojaTipo = document.getElementById("hoja-tipo");
const hojaBloques = document.getElementById("hoja-bloques");
const hojaMensaje = document.getElementById("hoja-mensaje");
const toast = document.getElementById("toast");
const hojaAnadir = document.getElementById("hoja-anadir");

// Lo que se ha pintado en la hoja, para leerlo al guardar.
let filasHoja = [];

function crearCampo(etiqueta, control) {
  const label = document.createElement("label");
  label.append(etiqueta, control);
  return label;
}

function crearNumero(valor, placeholder, decimal) {
  const input = document.createElement("input");
  input.type = decimal ? "text" : "number";
  input.inputMode = decimal ? "decimal" : "numeric";
  if (!decimal) input.min = "0";
  input.value = valor === null || valor === undefined ? "" : String(valor);
  input.placeholder = placeholder || "";
  return input;
}

function crearSelectEsfuerzo() {
  const select = document.createElement("select");
  rellenarSelectEsfuerzo(select);
  return select;
}

function crearFila(...campos) {
  const fila = document.createElement("div");
  fila.className = "fila";
  fila.append(...campos);
  return fila;
}

// Interruptor "Hecho": al apagarlo, la tarjeta se atenúa y no se guarda.
function crearInterruptorHecho(tarjeta) {
  const label = document.createElement("label");
  label.className = "hecho";
  const casilla = document.createElement("input");
  casilla.type = "checkbox";
  casilla.checked = true;
  casilla.setAttribute("aria-label", "Hecho");
  casilla.addEventListener("change", () => {
    tarjeta.classList.toggle("saltado", !casilla.checked);
    for (const control of tarjeta.querySelectorAll("input:not([type=checkbox]), select")) {
      control.disabled = !casilla.checked;
    }
  });
  label.append("Hecho", casilla);
  return { label, casilla };
}

// Último registro de un ejercicio de fuerza (el más reciente), o null.
function ultimaVez(idEjercicio) {
  let mejor = null;
  for (const entreno of entrenos) {
    for (const b of entreno.bloques) {
      if (b.tipo !== "fuerza" || b.ejercicio !== idEjercicio) continue;
      const masReciente = !mejor || entreno.fecha > mejor.fecha
        || (entreno.fecha === mejor.fecha && entreno.id > mejor.idEntreno);
      if (masReciente) {
        mejor = { fecha: entreno.fecha, idEntreno: entreno.id, bloque: b };
      }
    }
  }
  return mejor ? mejor.bloque : null;
}

function textoUltimaVez(b) {
  if (!b) {
    return "Primera vez que lo registras.";
  }
  return "La última vez: " + b.series + "×" + b.reps
    + (b.kg ? " · " + b.kg + " kg" : "")
    + (b.esfuerzo ? " · " + b.esfuerzo + "%" : "");
}

// Tarjeta de un ejercicio de fuerza en la hoja.
//  - item con ejercicio: viene de la propuesta (interruptor "Hecho").
//  - item null: clase del box (se elige el ejercicio y se puede quitar).
function crearTarjetaEjercicio(item, etiqueta) {
  const libre = item === null;
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta tarjeta-reg";
  const fila = { tipo: "fuerza", tarjeta: tarjeta };

  const cabecera = document.createElement("div");
  cabecera.className = "reg-cabecera";
  const ayuda = crearParrafo("", "ayuda");
  // Kg: se rellena con lo de la última vez para ir rápido; se cambia si has subido.
  const kg = crearNumero("", "—", true);

  function actualizarUltimaVez(id) {
    const anterior = ultimaVez(id);
    let texto = textoUltimaVez(anterior);
    if (item && item.esfuerzoObjetivo) {
      texto = "Objetivo del plan: ≈" + item.esfuerzoObjetivo + "%. " + texto;
    }
    ayuda.textContent = texto;
    kg.value = anterior && anterior.kg ? String(anterior.kg) : "";
  }

  let zonaVideo = null;
  if (libre) {
    const select = document.createElement("select");
    rellenarSelectEjercicios(select, false);
    select.addEventListener("change", () => actualizarUltimaVez(select.value));
    fila.select = select;
    cabecera.classList.add("libre");
    cabecera.append(crearCampo("Ejercicio", select), crearBotonMini("quitar", () => quitarFilaHoja(fila)));
  } else {
    const e = porId[item.ejercicio];
    const titulo = document.createElement("div");
    const nombre = document.createElement("span");
    nombre.className = "nombre";
    nombre.textContent = e.nombre + " ";
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = etiqueta;
    titulo.append(nombre, pill);
    // Vídeo para repasar la técnica mientras se apunta: se abre debajo del título.
    zonaVideo = document.createElement("div");
    const botonVideo = crearBotonVideo(e, zonaVideo);
    if (botonVideo) {
      const linea = document.createElement("div");
      linea.className = "linea-video";
      linea.appendChild(botonVideo);
      titulo.appendChild(linea);
    }
    const hecho = crearInterruptorHecho(tarjeta);
    cabecera.append(titulo, hecho.label);
    fila.ejercicio = e.id;
    fila.hecho = hecho.casilla;
  }
  tarjeta.append(cabecera, ayuda);
  if (zonaVideo) tarjeta.appendChild(zonaVideo);

  fila.series = crearNumero(libre ? "" : item.series);
  fila.reps = crearNumero(libre ? "" : item.reps);
  fila.kg = kg;
  fila.esfuerzo = crearSelectEsfuerzo();
  tarjeta.appendChild(crearFila(crearCampo("Series", fila.series), crearCampo("Reps", fila.reps), crearCampo("Kg", kg)));
  tarjeta.appendChild(crearCampo("Esfuerzo", fila.esfuerzo));

  actualizarUltimaVez(libre ? fila.select.value : item.ejercicio);
  filasHoja.push(fila);
  return tarjeta;
}

function quitarFilaHoja(fila) {
  filasHoja = filasHoja.filter(f => f !== fila);
  fila.tarjeta.remove();
}

// Campos del resultado del WOD según el formato. Los guarda en "fila".
function pintarCamposResultado(contenedor, fila, formato, minutos) {
  contenedor.textContent = "";
  fila.rondas = fila.extra = fila.completados = fila.min = fila.seg = null;

  if (formato === "AMRAP") {
    fila.rondas = crearNumero("", "0");
    fila.extra = crearNumero("", "0");
    contenedor.appendChild(crearFila(crearCampo("Rondas", fila.rondas), crearCampo("Reps de más", fila.extra)));
  } else if (formato === "EMOM") {
    fila.completados = crearNumero(minutos || "", "");
    const texto = minutos ? "Minutos completados (de " + minutos + ")" : "Minutos completados";
    contenedor.appendChild(crearCampo(texto, fila.completados));
  } else {
    fila.min = crearNumero("", "min");
    fila.seg = crearNumero("", "seg");
    const dosPuntos = document.createElement("span");
    dosPuntos.className = "separador-tiempo";
    dosPuntos.textContent = ":";
    contenedor.appendChild(crearFila(crearCampo("Tiempo (min)", fila.min), dosPuntos, crearCampo("seg", fila.seg)));
  }
}

// Tarjeta del WOD en la hoja.
//  - wod de la propuesta: formato y movimientos fijos (interruptor "Hecho").
//  - wod null: clase del box (formato, minutos y movimientos a mano).
function crearTarjetaWodHoja(wod) {
  const libre = wod === null;
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta tarjeta-reg wod";
  const fila = { tipo: "wod", tarjeta: tarjeta, wod: wod };

  const cabecera = document.createElement("div");
  cabecera.className = "reg-cabecera";
  const zonaResultado = document.createElement("div");

  if (libre) {
    cabecera.append(crearCabecera("WOD"), crearBotonMini("quitar", () => quitarFilaHoja(fila)));
    tarjeta.appendChild(cabecera);

    const formato = document.createElement("select");
    for (const f of ["AMRAP", "EMOM", "Por tiempo", "Otro"]) {
      const opcion = document.createElement("option");
      opcion.textContent = f;
      formato.appendChild(opcion);
    }
    const minutos = crearNumero("", "min");
    const detalle = document.createElement("input");
    detalle.type = "text";
    detalle.placeholder = "21-15-9, 5 rondas...";
    tarjeta.appendChild(crearFila(crearCampo("Formato", formato), crearCampo("Minutos", minutos)));
    tarjeta.appendChild(crearCampo("Detalle (opcional)", detalle));

    // Movimientos
    fila.movs = [];
    const movSelect = document.createElement("select");
    rellenarSelectEjercicios(movSelect, true);
    const movReps = crearNumero("", "reps");
    const filaMov = crearFila(crearCampo("Movimiento", movSelect), crearCampo("Reps", movReps));
    filaMov.lastChild.classList.add("estrecho");
    const lista = document.createElement("ul");
    const pintarMovs = () => {
      lista.textContent = "";
      fila.movs.forEach((mov, i) => {
        const li = document.createElement("li");
        li.className = "bloque";
        const texto = document.createElement("span");
        texto.textContent = textoMovimiento(mov);
        li.append(texto, crearBotonMini("quitar", () => { fila.movs.splice(i, 1); pintarMovs(); }));
        lista.appendChild(li);
      });
    };
    const botonMov = document.createElement("button");
    botonMov.type = "button";
    botonMov.className = "secundario";
    botonMov.textContent = "+ Añadir movimiento";
    botonMov.addEventListener("click", () => {
      const reps = enteroPositivo(movReps.value);
      if (reps === null) {
        hojaMensaje.textContent = "Pon las reps del movimiento.";
        return;
      }
      hojaMensaje.textContent = "";
      fila.movs.push({ ejercicio: movSelect.value, reps: reps });
      movReps.value = "";
      pintarMovs();
    });
    tarjeta.append(filaMov, botonMov, lista);

    const repintar = () => pintarCamposResultado(zonaResultado, fila, formato.value, enteroPositivo(minutos.value));
    formato.addEventListener("change", repintar);
    minutos.addEventListener("change", () => { if (formato.value === "EMOM") repintar(); });
    fila.formatoSelect = formato;
    fila.minutosInput = minutos;
    fila.detalleInput = detalle;
    fila.pintarMovs = pintarMovs;
    repintar();
  } else {
    const hecho = crearInterruptorHecho(tarjeta);
    cabecera.append(crearCabecera("WOD", wod.formato.toUpperCase()), hecho.label);
    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(crearParrafo(wod.detalle, "ayuda"));
    tarjeta.appendChild(crearParrafo(wod.movimientos.map(textoMovimiento).join(" · "), "movs-wod"));
    fila.hecho = hecho.casilla;
    pintarCamposResultado(zonaResultado, fila, wod.formato, wod.minutos);
  }

  tarjeta.appendChild(zonaResultado);
  fila.esfuerzo = crearSelectEsfuerzo();
  tarjeta.appendChild(crearCampo("Esfuerzo", fila.esfuerzo));

  filasHoja.push(fila);
  return tarjeta;
}

// modo: "propuesta" (lo propuesto en Hoy) o "clase" (clase del box, a mano).
let modoHoja = "propuesta";

function prepararHoja(modo, titulo, tipo) {
  modoHoja = modo;
  filasHoja = [];
  hojaBloques.textContent = "";
  hojaMensaje.textContent = "";
  document.getElementById("hoja-titulo").textContent = titulo;
  hojaFecha.value = fechaISO(new Date());
  hojaTipo.value = tipo;
  hojaAnadir.hidden = modo !== "clase";
}

function mostrarHoja() {
  hoja.hidden = false;
  document.body.style.overflow = "hidden";
  hoja.querySelector(".hoja-cuerpo").scrollTop = 0;
}

function anadirTitulo(texto) {
  const h3 = document.createElement("h3");
  h3.textContent = texto;
  hojaBloques.appendChild(h3);
}

function abrirHoja() {
  prepararHoja("propuesta", "¿Cómo ha ido?", "propio");

  if (propuesta.fuerza.length > 0) {
    anadirTitulo("Fuerza");
    for (const f of propuesta.fuerza) {
      hojaBloques.appendChild(crearTarjetaEjercicio(f, textoEsquema(f)));
    }
  }
  if (propuesta.ligero.length > 0) {
    anadirTitulo("Bloque ligero");
    for (const l of propuesta.ligero) {
      hojaBloques.appendChild(crearTarjetaEjercicio(l, "ligero"));
    }
  }
  if (propuesta.wod) {
    anadirTitulo("WOD");
    hojaBloques.appendChild(crearTarjetaWodHoja(propuesta.wod));
  }
  mostrarHoja();
}

function abrirHojaClase() {
  prepararHoja("clase", "Clase del box", "clase");
  hojaBloques.appendChild(crearBloqueFoto());
  hojaBloques.appendChild(crearParrafo(
    "O apúntalo a mano. Así la app sabe qué músculos has cargado.",
    "ayuda"
  ));
  hojaBloques.appendChild(crearTarjetaEjercicio(null));
  hojaBloques.appendChild(crearTarjetaWodHoja(null));
  mostrarHoja();
}

// --- Leer la clase desde una foto o captura (ver foto.js) ---

function crearBloqueFoto() {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta foto";

  const entrada = document.createElement("input");
  entrada.type = "file";
  entrada.accept = "image/*";
  entrada.hidden = true;

  const boton = crearBoton("📷 Leer desde foto o captura", "principal", () => entrada.click());
  const ayuda = crearParrafo(
    "Haz una foto a la pizarra o elige una captura de la app del box. Se lee en el móvil: la foto no se envía a ningún sitio.",
    "ayuda"
  );
  const vista = document.createElement("img");
  vista.className = "vista-foto";
  vista.alt = "Foto de la clase";
  vista.hidden = true;
  const estado = crearParrafo("", "estado-foto");
  const detalles = document.createElement("details");
  detalles.hidden = true;
  const resumen = document.createElement("summary");
  resumen.textContent = "Texto leído";
  const pre = document.createElement("pre");
  detalles.append(resumen, pre);

  entrada.addEventListener("change", async () => {
    const archivo = entrada.files[0];
    entrada.value = "";
    if (!archivo) return;

    boton.disabled = true;
    estado.classList.remove("error");
    detalles.hidden = true;
    try {
      estado.textContent = "Preparando la imagen…";
      const { img, url } = await cargarImagen(archivo);
      vista.src = url;
      vista.hidden = false;
      const canvas = prepararImagen(img);

      estado.textContent = "Cargando el lector… (la primera vez tarda un poco)";
      const texto = await leerTextoDeImagen(canvas, (p) => {
        estado.textContent = "Leyendo… " + Math.round(p * 100) + "%";
      });

      pre.textContent = texto.trim() || "(no se ha leído nada)";
      detalles.hidden = false;
      const clase = leerClase(texto);
      estado.textContent = rellenarClase(clase);
      refrescar(hojaBloques);
    } catch (err) {
      estado.classList.add("error");
      estado.textContent = err.message || "No se ha podido leer la imagen.";
    } finally {
      boton.disabled = false;
    }
  });

  tarjeta.append(boton, entrada, ayuda, vista, estado, detalles);
  return tarjeta;
}

// Sustituye las tarjetas de la clase por lo leído. Devuelve un resumen.
function rellenarClase(clase) {
  for (const fila of filasHoja) fila.tarjeta.remove();
  filasHoja = [];

  for (const f of clase.fuerza) {
    hojaBloques.appendChild(crearTarjetaEjercicio(null));
    const fila = filasHoja[filasHoja.length - 1];
    fila.select.value = f.ejercicio;
    fila.select.dispatchEvent(new Event("change"));
    fila.series.value = f.series;
    fila.reps.value = f.reps;
    if (f.kg) fila.kg.value = f.kg;
    if (f.esfuerzo) fila.esfuerzo.value = String(f.esfuerzo);
  }

  if (clase.wod) {
    hojaBloques.appendChild(crearTarjetaWodHoja(null));
    const fila = filasHoja[filasHoja.length - 1];
    fila.formatoSelect.value = clase.wod.formato;
    fila.minutosInput.value = clase.wod.minutos || "";
    fila.formatoSelect.dispatchEvent(new Event("change"));
    fila.detalleInput.value = clase.wod.detalle || "";
    fila.movs.push(...clase.wod.movimientos);
    fila.pintarMovs();
  }

  const nada = clase.fuerza.length === 0 && !clase.wod;
  if (nada) {
    hojaBloques.appendChild(crearTarjetaEjercicio(null));
    hojaBloques.appendChild(crearTarjetaWodHoja(null));
    return "No he reconocido ejercicios. Prueba con una foto más recta y con buena luz, o apúntalo a mano.";
  }

  const partes = [];
  if (clase.fuerza.length > 0) {
    partes.push(clase.fuerza.length + (clase.fuerza.length === 1 ? " ejercicio" : " ejercicios"));
  }
  if (clase.wod) {
    partes.push("un WOD con " + clase.wod.movimientos.length + " movimientos");
  }
  let texto = "✓ He encontrado " + partes.join(" y ") + ". Revisa y completa (kg, resultado…) antes de guardar.";
  if (clase.noEntendidas.length > 0) {
    texto += " No he entendido: «" + clase.noEntendidas.slice(0, 3).join("», «") + "»"
      + (clase.noEntendidas.length > 3 ? "…" : "") + ".";
  }
  return texto;
}

function cerrarHoja() {
  hoja.hidden = true;
  document.body.style.overflow = "";
}

// "" → null (no puesto), número válido → número, si no → NaN (error).
function leerKg(texto) {
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : NaN;
}

function enteroOCero(texto) {
  if (texto.trim() === "") return 0;
  const n = Number(texto);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

// Convierte los campos del WOD en { resultado, tiempoSeg, rondas } o un texto de error.
function leerResultadoWod(fila, formato, minutos) {
  if (formato === "AMRAP") {
    const rondas = enteroOCero(fila.rondas.value);
    const extra = enteroOCero(fila.extra.value);
    if (rondas === null || extra === null) return "Revisa las rondas del WOD.";
    if (rondas === 0 && extra === 0) return { resultado: "", tiempoSeg: null, rondas: null };
    return {
      resultado: rondas + " rondas" + (extra > 0 ? " + " + extra + " reps" : ""),
      tiempoSeg: null,
      rondas: rondas,
    };
  }
  if (formato === "EMOM") {
    const hechos = enteroOCero(fila.completados.value);
    if (hechos === null || (minutos && hechos > minutos)) return "Revisa los minutos completados del WOD.";
    if (hechos === 0) return { resultado: "", tiempoSeg: null, rondas: null };
    return { resultado: hechos + (minutos ? "/" + minutos : "") + " min", tiempoSeg: null, rondas: null };
  }
  const min = enteroOCero(fila.min.value);
  const seg = enteroOCero(fila.seg.value);
  if (min === null || seg === null || seg > 59) return "Revisa el tiempo del WOD (segundos de 0 a 59).";
  if (min === 0 && seg === 0) return { resultado: "", tiempoSeg: null, rondas: null };
  return { resultado: min + ":" + dosCifras(seg), tiempoSeg: min * 60 + seg, rondas: null };
}

function mostrarToast(texto) {
  toast.textContent = texto;
  toast.hidden = false;
  clearTimeout(mostrarToast.temporizador);
  mostrarToast.temporizador = setTimeout(() => { toast.hidden = true; }, 2500);
}

function guardarDesdeHoja() {
  const error = (texto) => { hojaMensaje.textContent = texto; };

  if (!hojaFecha.value) {
    error("Elige la fecha.");
    return;
  }

  const bloques = [];
  for (const fila of filasHoja) {
    if (fila.hecho && !fila.hecho.checked) continue;

    if (fila.tipo === "fuerza") {
      const ejercicio = fila.select ? fila.select.value : fila.ejercicio;
      const nombre = nombreDe(ejercicio);
      const series = enteroPositivo(fila.series.value);
      const reps = enteroPositivo(fila.reps.value);
      if (series === null || reps === null) {
        error("Revisa series y reps de " + nombre + ".");
        return;
      }
      const kg = leerKg(fila.kg.value);
      if (Number.isNaN(kg)) {
        error("Los kg de " + nombre + " no son un número válido.");
        return;
      }
      bloques.push({
        tipo: "fuerza",
        ejercicio: ejercicio,
        series: series,
        reps: reps,
        kg: kg,
        esfuerzo: esfuerzoDe(fila.esfuerzo),
      });
    } else {
      const formato = fila.wod ? fila.wod.formato : fila.formatoSelect.value;
      const minutos = fila.wod ? fila.wod.minutos : enteroPositivo(fila.minutosInput.value);
      const movimientos = (fila.wod ? fila.wod.movimientos : fila.movs)
        .map(m => ({ ejercicio: m.ejercicio, reps: m.reps }));
      if (movimientos.length === 0) {
        error("Añade al menos un movimiento al WOD (o quítalo).");
        return;
      }
      const detalle = fila.wod
        ? fila.wod.detalle
        : (fila.detalleInput.value.trim() || (minutos ? minutos + " min" : ""));
      const r = leerResultadoWod(fila, formato, minutos);
      if (typeof r === "string") {
        error(r);
        return;
      }
      bloques.push({
        tipo: "wod",
        formato: formato,
        detalle: detalle,
        movimientos: movimientos,
        resultado: r.resultado,
        tiempoSeg: r.tiempoSeg,
        rondas: r.rondas,
        esfuerzo: esfuerzoDe(fila.esfuerzo),
      });
    }
  }

  if (bloques.length === 0) {
    error(modoHoja === "clase"
      ? "Añade al menos un ejercicio o un WOD."
      : "Marca al menos un ejercicio como hecho.");
    return;
  }

  entrenos.push({
    id: Date.now(),
    fecha: hojaFecha.value,
    tipo: hojaTipo.value,
    origen: modoHoja === "clase" ? "clase" : (propuesta && propuesta.sesion ? "plan" : "libre"),
    bloques: bloques,
  });
  if (!guardarEntrenos()) {
    entrenos.pop();
    error("No se ha podido guardar en este navegador.");
    return;
  }

  cerrarHoja();
  propuesta = null;
  mostrarPropuesta();
  mostrarHistorial();
  mostrarPantalla("cuerpo");
  mostrarToast(modoHoja === "clase" ? "¡Clase guardada! Así queda tu carga 💪" : "¡Entreno guardado! Así queda tu carga 💪");
}

document.getElementById("hoja-cancelar").addEventListener("click", cerrarHoja);
document.getElementById("hoja-guardar-btn").addEventListener("click", guardarDesdeHoja);
document.getElementById("hoja-mas-ejercicio").addEventListener("click", () => {
  const tarjeta = crearTarjetaEjercicio(null);
  hojaBloques.appendChild(tarjeta);
  refrescar(tarjeta);
  tarjeta.scrollIntoView({ behavior: "smooth", block: "center" });
});
document.getElementById("hoja-mas-wod").addEventListener("click", () => {
  const tarjeta = crearTarjetaWodHoja(null);
  hojaBloques.appendChild(tarjeta);
  refrescar(tarjeta);
  tarjeta.scrollIntoView({ behavior: "smooth", block: "center" });
});

for (const boton of botonesFoco) {
  boton.addEventListener("click", () => {
    const g = boton.dataset.grupo;
    if (focos.includes(g)) {
      focos = focos.filter(x => x !== g);
    } else {
      focos.push(g);
    }
    boton.classList.toggle("activo");
  });
}

botonProponer.addEventListener("click", () => {
  if (!perfil) {
    mostrarPantalla("perfil");
    return;
  }
  propuesta = proponerEntreno({ perfil: perfil, focos: focos, sesion: null, entrenos: entrenos, hoy: new Date() });
  mostrarPropuesta();
  contenedorPropuesta.scrollIntoView({ behavior: "smooth", block: "start" });
});

// --- Lo que toca hoy según el plan ---

const hoyPlan = document.getElementById("hoy-plan");
const otroEntreno = document.getElementById("otro-entreno");
const botonOtro = document.getElementById("btn-otro");

function entrenadoEn(fechaTexto) {
  return entrenos.some(e => e.fecha === fechaTexto);
}

function fechaLarga(fecha) {
  return fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" });
}

function crearBoton(texto, clase, accion) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = clase;
  boton.textContent = texto;
  boton.addEventListener("click", accion);
  return boton;
}

function empezarEntrenoPlan(sesion) {
  propuesta = proponerEntreno({ perfil: perfil, focos: [], sesion: sesion, entrenos: entrenos, hoy: new Date() });
  otroEntreno.hidden = true;
  botonOtro.classList.remove("activo");
  mostrarPropuesta();
  contenedorPropuesta.scrollIntoView({ behavior: "smooth", block: "start" });
}

function pintarPlanHoy() {
  hoyPlan.textContent = "";
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta plan-hoy";
  const hoy = new Date();

  if (!plan) {
    tarjeta.append(
      crearParrafo("Sin plan todavía", "sesion-nombre"),
      crearParrafo("Elige qué quieres mejorar y qué días entrenas, y la app te monta un plan de 8 o 12 semanas.", "ayuda"),
      crearBoton("Crear mi plan", "principal", () => mostrarPantalla("perfil"))
    );
    hoyPlan.appendChild(tarjeta);
    return;
  }

  const sesion = sesionDelDia(plan, hoy);
  if (sesion === null) {
    const terminado = semanaDe(plan, hoy) >= plan.semanas;
    tarjeta.append(
      crearParrafo(terminado ? "¡Plan terminado!" : "Tu plan empieza pronto", "sesion-nombre"),
      crearParrafo(terminado
        ? "Enhorabuena. Crea uno nuevo en Perfil para seguir progresando."
        : "Mientras tanto puedes hacer otro entreno o apuntar tu clase.", "ayuda"),
      crearBoton("Crear un plan nuevo", "principal", () => mostrarPantalla("perfil"))
    );
    hoyPlan.appendChild(tarjeta);
    return;
  }

  const fase = semanaPlan(plan.objetivo, sesion.semana).fase;
  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta-semana";
  etiqueta.textContent = "SEMANA " + (sesion.semana + 1) + " DE " + plan.semanas + " · " + fase.toUpperCase();
  tarjeta.appendChild(etiqueta);

  if (sesion.descanso) {
    tarjeta.appendChild(crearParrafo("Descanso", "sesion-nombre"));
    const proxima = proximaSesion(plan, hoy);
    tarjeta.appendChild(crearParrafo(
      proxima
        ? "Próxima sesión: " + fechaLarga(proxima.fecha) + " · " + proxima.sesion.nombre
        : "No quedan sesiones en el plan.",
      "sesion-principal"
    ));
    tarjeta.appendChild(crearParrafo("Recuperar también es entrenar. Si te apetece, movilidad o un paseo.", "ayuda"));
  } else {
    tarjeta.appendChild(crearParrafo(sesion.nombre, "sesion-nombre"));
    tarjeta.appendChild(crearParrafo(textoPrincipal(sesion), "sesion-principal"));
    if (sesion.esquema.descarga) {
      tarjeta.appendChild(crearParrafo("Semana de descarga: menos volumen para asimilar lo trabajado.", "ayuda"));
    }
    if (entrenadoEn(fechaISO(hoy))) {
      tarjeta.appendChild(crearParrafo("✓ Ya has entrenado hoy", "hecho-hoy"));
    }
    tarjeta.appendChild(crearBoton("Empezar entreno del plan", "principal", () => empezarEntrenoPlan(sesion)));
  }
  hoyPlan.appendChild(tarjeta);
}

botonOtro.addEventListener("click", () => {
  otroEntreno.hidden = !otroEntreno.hidden;
  botonOtro.classList.toggle("activo", !otroEntreno.hidden);
  if (!otroEntreno.hidden) {
    otroEntreno.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

document.getElementById("btn-clase").addEventListener("click", abrirHojaClase);

// ---------- Pantalla "Plan" ----------

const contenidoPlan = document.getElementById("plan-contenido");
let semanaVista = 0;

function pintarPlan() {
  contenidoPlan.textContent = "";
  const hoy = new Date();

  if (!plan) {
    const tarjeta = crearTarjeta("Aún no tienes plan");
    tarjeta.append(
      crearParrafo("Dile a la app qué quieres mejorar y qué días entrenas.", "ayuda"),
      crearBoton("Crear mi plan", "principal", () => mostrarPantalla("perfil"))
    );
    contenidoPlan.appendChild(tarjeta);
    return;
  }

  // Resumen
  const actual = Math.min(Math.max(semanaDe(plan, hoy), 0), plan.semanas - 1);
  const inicio = fechaDesdeISO(plan.inicio);
  const fin = sumarDias(inicio, plan.semanas * 7 - 1);
  const formato = { day: "numeric", month: "short" };
  const resumen = crearTarjeta(OBJETIVOS[plan.objetivo].nombre);
  resumen.appendChild(crearParrafo(
    plan.semanas + " semanas · " + plan.dias.length + " días por semana · del "
    + inicio.toLocaleDateString("es-ES", formato) + " al " + fin.toLocaleDateString("es-ES", formato),
    "ayuda"
  ));
  const progreso = document.createElement("div");
  progreso.className = "progreso";
  const relleno = document.createElement("span");
  relleno.style.width = Math.round((Math.max(0, semanaDe(plan, hoy)) / plan.semanas) * 100) + "%";
  progreso.appendChild(relleno);
  resumen.appendChild(progreso);
  resumen.appendChild(crearParrafo(
    "Cada 4 semanas hay una de descarga (menos volumen) para que el cuerpo asimile y siga progresando.",
    "ayuda"
  ));
  contenidoPlan.appendChild(resumen);

  // Semana
  semanaVista = Math.min(Math.max(semanaVista, 0), plan.semanas - 1);
  const datosSemana = semanaPlan(plan.objetivo, semanaVista);
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta";

  const nav = document.createElement("div");
  nav.className = "semana-nav";
  const anterior = crearBoton("‹", "flecha", () => { semanaVista--; pintarPlan(); refrescar(contenidoPlan); });
  anterior.disabled = semanaVista === 0;
  anterior.setAttribute("aria-label", "Semana anterior");
  const siguiente = crearBoton("›", "flecha", () => { semanaVista++; pintarPlan(); refrescar(contenidoPlan); });
  siguiente.disabled = semanaVista === plan.semanas - 1;
  siguiente.setAttribute("aria-label", "Semana siguiente");
  const titulo = document.createElement("h2");
  titulo.textContent = "Semana " + (semanaVista + 1) + (semanaVista === actual ? " (esta)" : "");
  const sub = document.createElement("small");
  sub.textContent = datosSemana.fase + " · principal " + datosSemana.series + "×" + datosSemana.reps
    + " al ≈" + datosSemana.esfuerzo + "%";
  titulo.appendChild(sub);
  nav.append(anterior, titulo, siguiente);
  tarjeta.appendChild(nav);

  const lista = document.createElement("ul");
  const lunes = sumarDias(inicio, semanaVista * 7);
  const hoyTexto = fechaISO(hoy);
  for (let d = 0; d < 7; d++) {
    const fecha = sumarDias(lunes, d);
    const texto = fechaISO(fecha);
    const sesion = sesionDelDia(plan, fecha);
    const hecho = entrenadoEn(texto);

    const li = document.createElement("li");
    li.className = "dia-plan" + (texto === hoyTexto ? " es-hoy" : "") + (sesion.descanso ? " descanso" : "");

    const fechaCaja = document.createElement("div");
    fechaCaja.className = "dia-fecha";
    const corto = document.createElement("strong");
    corto.textContent = DIAS_CORTOS[d];
    const numero = document.createElement("span");
    numero.textContent = fecha.getDate();
    fechaCaja.append(corto, numero);

    const info = document.createElement("div");
    info.className = "info";
    const nombre = document.createElement("span");
    nombre.className = "nombre";
    nombre.textContent = sesion.descanso ? "Descanso" : sesion.nombre;
    info.appendChild(nombre);
    if (!sesion.descanso) {
      const detalle = document.createElement("small");
      detalle.textContent = textoPrincipal(sesion);
      info.appendChild(detalle);
    }

    const estado = document.createElement("span");
    estado.className = "estado-dia";
    if (hecho) {
      estado.classList.add("hecho");
      estado.textContent = "✓ Hecho";
    } else if (texto === hoyTexto && !sesion.descanso) {
      estado.classList.add("hoy");
      estado.textContent = "Hoy";
    } else if (texto < hoyTexto && !sesion.descanso) {
      estado.classList.add("fallado");
      estado.textContent = "No hecho";
    } else if (!sesion.descanso) {
      estado.textContent = "Pendiente";
    }

    li.append(fechaCaja, info);
    if (estado.textContent) li.appendChild(estado);
    if (texto === hoyTexto) {
      li.style.cursor = "pointer";
      li.addEventListener("click", () => mostrarPantalla("hoy"));
    }
    lista.appendChild(li);
  }
  tarjeta.appendChild(lista);
  contenidoPlan.appendChild(tarjeta);

  contenidoPlan.appendChild(crearBoton("Cambiar objetivo o días", "secundario", () => mostrarPantalla("perfil")));
}

document.getElementById("resumen-cuerpo").addEventListener("click", () => mostrarPantalla("cuerpo"));

function pintarSaludo() {
  const ahora = new Date();
  const hora = ahora.getHours();
  const saludo = hora < 6 ? "Buenas noches" : hora < 14 ? "Buenos días" : hora < 21 ? "Buenas tardes" : "Buenas noches";
  const fecha = ahora.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("saludo").textContent = saludo + " · " + fecha;
}

// ---------- Pantalla "Cuerpo" ----------

const figuras = document.querySelectorAll(".figura");
const zonasMusculo = document.querySelectorAll("[data-musculo]");
const detalleMusculo = document.getElementById("detalle-musculo");
const barrasCarga = document.getElementById("barras-carga");
let musculoElegido = null;

// Días hasta que la carga baje de "media". Se calcula mirando la fatiga
// en días futuros con los mismos entrenos.
function diasHastaRecuperar(musculo) {
  const hoy = new Date();
  for (let d = 0; d <= RECUPERACION.length; d++) {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + d);
    if (calcularFatiga(entrenos, dia)[musculo] < UMBRAL_MEDIO) {
      return d;
    }
  }
  return RECUPERACION.length;
}

// Ejercicios de los últimos 7 días que han cargado este músculo.
function ejerciciosRecientes(musculo) {
  const hoy = new Date();
  const nombres = new Set();
  for (const entreno of entrenos) {
    const dias = diasEntre(entreno.fecha, hoy);
    if (dias < 0 || dias >= RECUPERACION.length) {
      continue;
    }
    for (const bloque of entreno.bloques) {
      const ids = bloque.tipo === "wod" ? bloque.movimientos.map(m => m.ejercicio) : [bloque.ejercicio];
      for (const id of ids) {
        const e = porId[id];
        if (e && (e.musculos.includes(musculo) || e.secundarios.includes(musculo))) {
          nombres.add(e.nombre);
        }
      }
    }
  }
  return [...nombres];
}

function elegirMusculo(musculo) {
  musculoElegido = musculoElegido === musculo ? null : musculo;
  mostrarCuerpo();
  refrescar(detalleMusculo);
  if (musculoElegido) {
    detalleMusculo.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function mostrarDetalleMusculo(fatiga) {
  detalleMusculo.textContent = "";
  detalleMusculo.hidden = musculoElegido === null;
  if (!musculoElegido) {
    return;
  }

  const m = musculoElegido;
  const nivel = nivelVista(fatiga[m]);

  const cabecera = document.createElement("div");
  cabecera.className = "detalle-cabecera";
  const h2 = document.createElement("h2");
  h2.textContent = MUSCULOS[m];
  const estado = document.createElement("span");
  estado.className = "estado";
  estado.appendChild(crearPunto(nivel));
  estado.appendChild(document.createTextNode("Carga " + NOMBRES_NIVEL[nivel].toLowerCase()));
  cabecera.appendChild(h2);
  cabecera.appendChild(estado);
  detalleMusculo.appendChild(cabecera);

  const dias = diasHastaRecuperar(m);
  let texto;
  if (dias === 0) {
    texto = nivel === "libre" ? "Fresco. Listo para darle caña." : "Listo para entrenar, con algo de carga.";
  } else if (dias === 1) {
    texto = "Recuperado mañana, aproximadamente.";
  } else {
    texto = "Recuperado en unos " + dias + " días.";
  }
  detalleMusculo.appendChild(crearParrafo(texto, "recuperacion"));

  const recientes = ejerciciosRecientes(m);
  detalleMusculo.appendChild(crearParrafo(
    recientes.length > 0
      ? "Esta semana lo has trabajado con: " + recientes.join(", ") + "."
      : "No lo has trabajado esta semana.",
    "ayuda"
  ));
}

function mostrarCuerpo() {
  const fatiga = calcularFatiga(entrenos, new Date());

  for (const zona of zonasMusculo) {
    const m = zona.dataset.musculo;
    zona.setAttribute("class", nivelVista(fatiga[m]) + (m === musculoElegido ? " seleccionado" : ""));
  }
  for (const figura of figuras) {
    figura.classList.toggle("con-seleccion", musculoElegido !== null);
  }

  barrasCarga.textContent = "";
  const ordenados = Object.keys(MUSCULOS).sort((a, b) => fatiga[b] - fatiga[a]);
  for (const m of ordenados) {
    const nivel = nivelVista(fatiga[m]);
    const li = document.createElement("li");
    const fila = document.createElement("button");
    fila.type = "button";
    fila.className = "barra-fila";
    fila.addEventListener("click", () => elegirMusculo(m));

    const nombre = document.createElement("span");
    nombre.textContent = MUSCULOS[m];
    const barra = document.createElement("span");
    barra.className = "barra";
    const relleno = document.createElement("span");
    relleno.className = nivel;
    relleno.style.width = Math.max(4, Math.min(100, fatiga[m] / (UMBRAL_ALTO * 1.5) * 100)) + "%";
    barra.appendChild(relleno);
    const etiqueta = document.createElement("span");
    etiqueta.className = "nivel";
    etiqueta.textContent = NOMBRES_NIVEL[nivel];

    fila.appendChild(nombre);
    fila.appendChild(barra);
    fila.appendChild(etiqueta);
    li.appendChild(fila);
    barrasCarga.appendChild(li);
  }

  mostrarDetalleMusculo(fatiga);
}

for (const zona of zonasMusculo) {
  zona.addEventListener("click", () => elegirMusculo(zona.dataset.musculo));
}

// ---------- Pantalla "Biblioteca" (solo lectura) ----------

const filtroBiblioteca = document.getElementById("filtro-biblioteca");
const contadorBiblioteca = document.getElementById("contador-biblioteca");
const listaBiblioteca = document.getElementById("lista-biblioteca");

function mostrarBiblioteca() {
  const filtro = filtroBiblioteca.value;
  const visibles = (filtro === "todos" ? [...ejercicios] : filtrarPorGrupo(filtro))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  contadorBiblioteca.textContent = visibles.length + " ejercicios";
  listaBiblioteca.textContent = "";

  for (const ejercicio of visibles) {
    const li = document.createElement("li");
    li.className = "fila-ejercicio";

    const info = document.createElement("div");
    info.className = "info";
    const nombre = document.createElement("span");
    nombre.className = "nombre";
    nombre.textContent = ejercicio.nombre;
    const musculos = document.createElement("small");
    musculos.textContent = textoMusculos(ejercicio);
    info.appendChild(nombre);
    info.appendChild(musculos);
    li.appendChild(info);

    const botonVideo = crearBotonVideo(ejercicio, li);
    if (botonVideo) {
      li.appendChild(botonVideo);
      hacerTocableParaVideo(info, botonVideo);
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
const fuerzaKg = document.getElementById("fuerza-kg");
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

let wodMovs = [];

function rellenarSelectEjercicios(select, soloWod) {
  const lista = soloWod ? ejercicios.filter(e => e.wod) : ejercicios;
  const ordenados = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  for (const e of ordenados) {
    const opcion = document.createElement("option");
    opcion.value = e.id;
    opcion.textContent = e.nombre + (e.wod && e.wod.unidad ? " (" + e.wod.unidad + ")" : "");
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
    const movs = b.movimientos.map(textoMovimiento).join(" + ");
    const detalle = b.detalle ? " " + b.detalle : "";
    const resultado = b.resultado ? " → " + b.resultado : "";
    return "WOD " + b.formato + detalle + ": " + movs + resultado + esfuerzo;
  }
  const kg = b.kg ? " · " + b.kg + " kg" : "";
  return nombreDe(b.ejercicio) + " · " + b.series + "×" + b.reps + kg + esfuerzo;
}

// --- Movimientos del WOD que se está preparando ---

function mostrarWodMovs() {
  refrescar(listaWodMovs);
  listaWodMovs.textContent = "";
  wodMovs.forEach((mov, i) => {
    const li = document.createElement("li");
    li.className = "bloque";
    const texto = document.createElement("span");
    texto.textContent = textoMovimiento(mov);
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
  refrescar(listaBorrador);
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
  const kg = leerKg(fuerzaKg.value);
  if (Number.isNaN(kg)) {
    mensajeReg("Los kg no son un número válido.", true);
    return;
  }

  borrador.push({
    tipo: "fuerza",
    ejercicio: fuerzaEjercicio.value,
    series: series,
    reps: reps,
    kg: kg,
    esfuerzo: esfuerzoDe(fuerzaEsfuerzo),
  });
  guardarBorrador();

  fuerzaSeries.value = "";
  fuerzaReps.value = "";
  fuerzaKg.value = "";
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
  propuesta = null;
  mostrarPropuesta();
  mensajeReg("Entreno guardado.");
});

// --- Historial ---

function mostrarHistorial() {
  refrescar(listaHistorial);
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
    cabecera.appendChild(crearBotonMini("borrar", async () => {
      if (!await confirmar("¿Borrar este entreno? No se puede deshacer.", "Borrar", true)) {
        return;
      }
      entrenos = entrenos.filter(x => x.id !== entreno.id);
      guardarEntrenos();
      mostrarHistorial();
      mostrarToast("Entreno borrado");
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

// ---------- Pantalla "Perfil" ----------

const formPerfil = document.getElementById("form-perfil");
const contObjetivos = document.getElementById("perfil-objetivos");
const bienvenidaPerfil = document.getElementById("perfil-bienvenida");
const mensajePerfil = document.getElementById("mensaje-perfil");
const contDias = document.getElementById("perfil-dias");

function pintarPerfil() {
  contObjetivos.textContent = "";
  for (const clave in OBJETIVOS) {
    const o = OBJETIVOS[clave];

    const label = document.createElement("label");
    label.className = "opcion";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "objetivo";
    radio.value = clave;
    radio.checked = perfil ? perfil.objetivo === clave : clave === "general";

    const texto = document.createElement("span");
    const nombre = document.createElement("strong");
    nombre.textContent = o.nombre;
    const detalle = document.createElement("small");
    detalle.textContent = o.principal[0] + "×" + o.principal[1] + " en básicos · WOD de "
      + o.wodMin[0] + "-" + o.wodMin[1] + " min";
    texto.appendChild(nombre);
    texto.appendChild(detalle);

    label.appendChild(radio);
    label.appendChild(texto);
    contObjetivos.appendChild(label);
  }

  // Días de entreno (por defecto lunes, miércoles y viernes)
  const dias = perfil && Array.isArray(perfil.dias) ? perfil.dias : [0, 2, 4];
  contDias.textContent = "";
  DIAS_CORTOS.forEach((corto, d) => {
    const label = document.createElement("label");
    label.className = "dia";
    label.title = DIAS_SEMANA[d];
    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.name = "dias";
    casilla.value = String(d);
    casilla.checked = dias.includes(d);
    casilla.setAttribute("aria-label", DIAS_SEMANA[d]);
    label.append(casilla, corto);
    contDias.appendChild(label);
  });

  const semanas = perfil && perfil.semanas ? perfil.semanas : 8;
  for (const radio of formPerfil.querySelectorAll('input[name="semanas"]')) {
    radio.checked = Number(radio.value) === semanas;
  }

  for (const casilla of formPerfil.querySelectorAll('input[name="cuidar"]')) {
    casilla.checked = perfil ? perfil.cuidar.includes(casilla.value) : false;
  }
  bienvenidaPerfil.hidden = perfil !== null;
  mensajePerfil.textContent = "";
  mensajePerfil.classList.remove("error");
}

function mismosDatosDePlan(a, b) {
  return a && b
    && a.objetivo === b.objetivo
    && a.semanas === b.semanas
    && JSON.stringify(a.dias) === JSON.stringify(b.dias)
    && JSON.stringify([...a.cuidar].sort()) === JSON.stringify([...b.cuidar].sort());
}

// Al tocar una opción del perfil, esa opción hace un pequeño "refresh".
formPerfil.addEventListener("change", (evento) => {
  refrescar(evento.target.closest("label"));
});

formPerfil.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const elegido = formPerfil.querySelector('input[name="objetivo"]:checked');
  const cuidar = [...formPerfil.querySelectorAll('input[name="cuidar"]:checked')].map(c => c.value);
  const dias = [...formPerfil.querySelectorAll('input[name="dias"]:checked')].map(c => Number(c.value));
  const semanas = Number(formPerfil.querySelector('input[name="semanas"]:checked').value);

  if (dias.length < 2 || dias.length > 6) {
    mensajePerfil.textContent = "Elige entre 2 y 6 días de entreno.";
    mensajePerfil.classList.add("error");
    refrescar(contDias);
    contDias.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const nuevo = { version: 1, objetivo: elegido.value, cuidar: cuidar, dias: dias, semanas: semanas };

  // Si cambia algo que afecta al plan y ya había uno, se confirma antes de rehacerlo.
  const hayQueRehacer = !plan || !mismosDatosDePlan(perfil, nuevo);
  if (plan && hayQueRehacer
      && !await confirmar("Se creará un plan nuevo empezando esta semana.\nTu historial no se borra.", "Crear plan nuevo")) {
    mensajePerfil.classList.remove("error");
    mensajePerfil.textContent = "No se ha guardado nada. Tu plan sigue igual.";
    refrescar(mensajePerfil);
    return;
  }

  perfil = nuevo;
  if (!guardarPerfil()) {
    mensajePerfil.textContent = "No se ha podido guardar en este navegador.";
    mensajePerfil.classList.add("error");
    return;
  }

  propuesta = null;
  mostrarPropuesta();

  if (hayQueRehacer) {
    plan = crearPlan(perfil, new Date());
    guardarPlan();
    semanaVista = 0;
    mostrarPantalla("plan");
    mostrarToast("¡Plan de " + semanas + " semanas creado! 🗓️");
  } else {
    mensajePerfil.classList.remove("error");
    mensajePerfil.textContent = "Perfil guardado. Tu plan sigue igual.";
    refrescar(formPerfil);
    mostrarToast("Perfil guardado ✓");
  }
});

// ---------- Copia de seguridad ----------

const mensajeCopia = document.getElementById("mensaje-copia");
const archivoCopia = document.getElementById("archivo-copia");

function avisoCopia(texto, esError) {
  mensajeCopia.textContent = texto;
  mensajeCopia.classList.toggle("error", Boolean(esError));
}

// Un archivo .json con todo. En el móvil se abre el menú de compartir
// (Guardar en Archivos, iCloud Drive, AirDrop...); en el ordenador se descarga.
function exportarCopia() {
  const datos = {
    app: "mi-entreno",
    version: 1,
    creada: new Date().toISOString(),
    perfil: perfil,
    plan: plan,
    entrenos: entrenos,
    borrador: borrador,
  };
  const nombre = "mi-entreno-" + fechaISO(new Date()) + ".json";
  const archivo = new File([JSON.stringify(datos)], nombre, { type: "application/json" });
  const esMovil = /iPhone|iPad|Android/i.test(navigator.userAgent);

  if (esMovil && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    navigator.share({ files: [archivo], title: "Copia de Mi entreno" }).catch(() => {});
  } else {
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
  }
  avisoCopia("Copia creada con " + entrenos.length + " entrenos.");
}

async function importarCopia(archivo) {
  let datos;
  try {
    datos = JSON.parse(await archivo.text());
  } catch {
    avisoCopia("Ese archivo no es una copia válida.", true);
    return;
  }
  if (!datos || datos.app !== "mi-entreno" || !Array.isArray(datos.entrenos)) {
    avisoCopia("Ese archivo no es una copia de Mi entreno.", true);
    return;
  }

  const fecha = datos.creada ? new Date(datos.creada).toLocaleDateString("es-ES") : "fecha desconocida";
  const pregunta = "La copia es del " + fecha + " y tiene " + datos.entrenos.length + " entrenos.\n"
    + "Sustituirá los datos de este móvil. ¿Seguir?";
  if (!await confirmar(pregunta, "Restaurar")) {
    return;
  }

  entrenos = datos.entrenos;
  borrador = Array.isArray(datos.borrador) ? datos.borrador : [];
  perfil = datos.perfil && OBJETIVOS[datos.perfil.objetivo] ? datos.perfil : null;
  if (perfil && !Array.isArray(perfil.cuidar)) perfil.cuidar = [];
  plan = datos.plan && datos.plan.version === 1 && datos.plan.sesiones ? datos.plan : null;

  const ok = guardarEntrenos() && guardarBorrador() && escribirGuardado("perfil", perfil) && escribirGuardado("plan", plan);
  if (!ok) {
    avisoCopia("No se ha podido guardar en este navegador.", true);
    return;
  }

  propuesta = null;
  mostrarPropuesta();
  mostrarBorrador();
  mostrarHistorial();
  mostrarPantalla(perfil ? "hoy" : "perfil");
  mostrarToast("Copia restaurada: " + entrenos.length + " entrenos");
}

document.getElementById("btn-exportar").addEventListener("click", exportarCopia);
document.getElementById("btn-importar").addEventListener("click", () => archivoCopia.click());
archivoCopia.addEventListener("change", () => {
  const archivo = archivoCopia.files[0];
  archivoCopia.value = "";
  if (archivo) importarCopia(archivo);
});

// ---------- Navegación entre pantallas ----------

const pantallas = {
  hoy: document.getElementById("pantalla-hoy"),
  plan: document.getElementById("pantalla-plan"),
  cuerpo: document.getElementById("pantalla-cuerpo"),
  registro: document.getElementById("pantalla-registro"),
  biblioteca: document.getElementById("pantalla-biblioteca"),
  perfil: document.getElementById("pantalla-perfil"),
};
const botonesNav = document.querySelectorAll(".nav-btn");

function mostrarPantalla(nombre) {
  for (const clave in pantallas) {
    pantallas[clave].hidden = clave !== nombre;
  }
  // Entrada suave de la pantalla nueva.
  const pantalla = pantallas[nombre];
  pantalla.classList.remove("entrando");
  void pantalla.offsetWidth;
  pantalla.classList.add("entrando");
  for (const b of botonesNav) {
    b.classList.toggle("activo", b.dataset.pantalla === nombre);
  }
  if (nombre === "hoy") {
    pintarSaludo();
    pintarPlanHoy();
    pintarCargaHoy();
  }
  if (nombre === "plan") {
    if (plan) {
      semanaVista = Math.max(0, semanaDe(plan, new Date()));
    }
    pintarPlan();
  }
  if (nombre === "cuerpo") {
    mostrarCuerpo();
  }
  if (nombre === "biblioteca") {
    mostrarBiblioteca();
  }
  if (nombre === "perfil") {
    pintarPerfil();
  }
  window.scrollTo(0, 0);
}

for (const b of botonesNav) {
  b.addEventListener("click", () => mostrarPantalla(b.dataset.pantalla));
}

// ---------- Arranque ----------

rellenarSelectEjercicios(fuerzaEjercicio, false);
rellenarSelectEjercicios(wodEjercicio, true);
rellenarSelectEsfuerzo(fuerzaEsfuerzo);
rellenarSelectEsfuerzo(wodEsfuerzo);
regFecha.value = fechaISO(new Date());
mostrarBorrador();
mostrarWodMovs();
mostrarHistorial();
mostrarPantalla(perfil ? "hoy" : "perfil");
appLista = true;

// Modo sin conexión (solo cuando la app se sirve desde una web, no como archivo).
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
}
