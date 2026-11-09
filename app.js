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

// Perfil: { version, objetivo, cuidar: ["lumbar", ...] }. null = aún no configurado.
let perfil = leerGuardado("perfil", null);
if (!perfil || !OBJETIVOS[perfil.objetivo]) {
  perfil = null;
} else if (!Array.isArray(perfil.cuidar)) {
  perfil.cuidar = [];
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

const botonesFoco = document.querySelectorAll(".grupo");
const botonProponer = document.getElementById("btn-proponer");
const contenedorPropuesta = document.getElementById("propuesta");
const cargaHoy = document.getElementById("carga-hoy");

let focos = [];
let propuesta = null;

function datosMotor() {
  return { perfil: perfil, focos: focos, entrenos: entrenos, hoy: new Date() };
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
      f.series + "×" + f.reps,
      textoMusculos(e),
      () => sustituirEnPropuesta(propuesta, datosMotor(), "fuerza", i)
    ));
  });
  tarjeta.appendChild(ul);
  if (propuesta.fuerza.length < HUECOS_FUERZA.length) {
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
      l.series + "×" + l.reps,
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

function crearTarjetaEjercicio(item, etiqueta) {
  const e = porId[item.ejercicio];
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta tarjeta-reg";

  const cabecera = document.createElement("div");
  cabecera.className = "reg-cabecera";
  const titulo = document.createElement("div");
  const nombre = document.createElement("span");
  nombre.className = "nombre";
  nombre.textContent = e.nombre + " ";
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = etiqueta;
  titulo.append(nombre, pill);
  const hecho = crearInterruptorHecho(tarjeta);
  cabecera.append(titulo, hecho.label);
  tarjeta.appendChild(cabecera);

  const anterior = ultimaVez(e.id);
  tarjeta.appendChild(crearParrafo(textoUltimaVez(anterior), "ayuda"));

  const series = crearNumero(item.series);
  const reps = crearNumero(item.reps);
  // Kg: se rellena con lo de la última vez para ir rápido; se cambia si has subido.
  const kg = crearNumero(anterior && anterior.kg ? anterior.kg : "", "—", true);
  const esfuerzo = crearSelectEsfuerzo();

  tarjeta.appendChild(crearFila(crearCampo("Series", series), crearCampo("Reps", reps), crearCampo("Kg", kg)));
  tarjeta.appendChild(crearCampo("Esfuerzo", esfuerzo));

  filasHoja.push({ tipo: "fuerza", ejercicio: e.id, nombre: e.nombre, hecho: hecho.casilla, series, reps, kg, esfuerzo });
  return tarjeta;
}

function crearTarjetaWodHoja(wod) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta tarjeta-reg wod";

  const cabecera = document.createElement("div");
  cabecera.className = "reg-cabecera";
  const titulo = crearCabecera("WOD", wod.formato.toUpperCase());
  const hecho = crearInterruptorHecho(tarjeta);
  cabecera.append(titulo, hecho.label);
  tarjeta.appendChild(cabecera);

  tarjeta.appendChild(crearParrafo(wod.detalle, "ayuda"));
  tarjeta.appendChild(crearParrafo(wod.movimientos.map(textoMovimiento).join(" · "), "movs-wod"));

  const fila = { tipo: "wod", wod: wod, hecho: hecho.casilla };

  if (wod.formato === "AMRAP") {
    fila.rondas = crearNumero("", "0");
    fila.extra = crearNumero("", "0");
    tarjeta.appendChild(crearFila(crearCampo("Rondas", fila.rondas), crearCampo("Reps de más", fila.extra)));
  } else if (wod.formato === "EMOM") {
    fila.completados = crearNumero(wod.minutos, "");
    tarjeta.appendChild(crearCampo("Minutos completados (de " + wod.minutos + ")", fila.completados));
  } else {
    fila.min = crearNumero("", "min");
    fila.seg = crearNumero("", "seg");
    const dosPuntos = document.createElement("span");
    dosPuntos.className = "separador-tiempo";
    dosPuntos.textContent = ":";
    tarjeta.appendChild(crearFila(crearCampo("Tiempo (min)", fila.min), dosPuntos, crearCampo("seg", fila.seg)));
  }

  fila.esfuerzo = crearSelectEsfuerzo();
  tarjeta.appendChild(crearCampo("Esfuerzo", fila.esfuerzo));

  filasHoja.push(fila);
  return tarjeta;
}

function abrirHoja() {
  filasHoja = [];
  hojaBloques.textContent = "";
  hojaMensaje.textContent = "";
  hojaFecha.value = fechaISO(new Date());
  hojaTipo.value = "propio";

  if (propuesta.fuerza.length > 0) {
    const h3 = document.createElement("h3");
    h3.textContent = "Fuerza";
    hojaBloques.appendChild(h3);
    for (const f of propuesta.fuerza) {
      hojaBloques.appendChild(crearTarjetaEjercicio(f, f.series + "×" + f.reps));
    }
  }
  if (propuesta.ligero.length > 0) {
    const h3 = document.createElement("h3");
    h3.textContent = "Bloque ligero";
    hojaBloques.appendChild(h3);
    for (const l of propuesta.ligero) {
      hojaBloques.appendChild(crearTarjetaEjercicio(l, "ligero"));
    }
  }
  if (propuesta.wod) {
    const h3 = document.createElement("h3");
    h3.textContent = "WOD";
    hojaBloques.appendChild(h3);
    hojaBloques.appendChild(crearTarjetaWodHoja(propuesta.wod));
  }

  hoja.hidden = false;
  document.body.style.overflow = "hidden";
  hoja.querySelector(".hoja-cuerpo").scrollTop = 0;
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
function leerResultadoWod(fila) {
  const formato = fila.wod.formato;
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
    if (hechos === null || hechos > fila.wod.minutos) return "Revisa los minutos completados del WOD.";
    return { resultado: hechos + "/" + fila.wod.minutos + " min", tiempoSeg: null, rondas: null };
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
    if (!fila.hecho.checked) continue;

    if (fila.tipo === "fuerza") {
      const series = enteroPositivo(fila.series.value);
      const reps = enteroPositivo(fila.reps.value);
      if (series === null || reps === null) {
        error("Revisa series y reps de " + fila.nombre + ".");
        return;
      }
      const kg = leerKg(fila.kg.value);
      if (Number.isNaN(kg)) {
        error("Los kg de " + fila.nombre + " no son un número válido.");
        return;
      }
      bloques.push({
        tipo: "fuerza",
        ejercicio: fila.ejercicio,
        series: series,
        reps: reps,
        kg: kg,
        esfuerzo: esfuerzoDe(fila.esfuerzo),
      });
    } else {
      const r = leerResultadoWod(fila);
      if (typeof r === "string") {
        error(r);
        return;
      }
      bloques.push({
        tipo: "wod",
        formato: fila.wod.formato,
        detalle: fila.wod.detalle,
        movimientos: fila.wod.movimientos.map(m => ({ ejercicio: m.ejercicio, reps: m.reps })),
        resultado: r.resultado,
        tiempoSeg: r.tiempoSeg,
        rondas: r.rondas,
        esfuerzo: esfuerzoDe(fila.esfuerzo),
      });
    }
  }

  if (bloques.length === 0) {
    error("Marca al menos un ejercicio como hecho.");
    return;
  }

  entrenos.push({ id: Date.now(), fecha: hojaFecha.value, tipo: hojaTipo.value, bloques: bloques });
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
  mostrarToast("¡Entreno guardado! Así queda tu carga 💪");
}

document.getElementById("hoja-cancelar").addEventListener("click", cerrarHoja);
document.getElementById("hoja-guardar-btn").addEventListener("click", guardarDesdeHoja);

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
  propuesta = proponerEntreno(datosMotor());
  mostrarPropuesta();
  contenedorPropuesta.scrollIntoView({ behavior: "smooth", block: "start" });
});

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

  for (const casilla of formPerfil.querySelectorAll('input[name="cuidar"]')) {
    casilla.checked = perfil ? perfil.cuidar.includes(casilla.value) : false;
  }
  bienvenidaPerfil.hidden = perfil !== null;
  mensajePerfil.textContent = "";
}

formPerfil.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const elegido = formPerfil.querySelector('input[name="objetivo"]:checked');
  const cuidar = [...formPerfil.querySelectorAll('input[name="cuidar"]:checked')].map(c => c.value);
  const primeraVez = perfil === null;

  perfil = { version: 1, objetivo: elegido.value, cuidar: cuidar };
  if (!guardarPerfil()) {
    mensajePerfil.textContent = "No se ha podido guardar en este navegador.";
    return;
  }

  propuesta = null;
  mostrarPropuesta();
  if (primeraVez) {
    mostrarPantalla("hoy");
  } else {
    mensajePerfil.textContent = "Perfil guardado.";
  }
});

// ---------- Navegación entre pantallas ----------

const pantallas = {
  hoy: document.getElementById("pantalla-hoy"),
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
  for (const b of botonesNav) {
    b.classList.toggle("activo", b.dataset.pantalla === nombre);
  }
  if (nombre === "hoy") {
    pintarSaludo();
    pintarCargaHoy();
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
