const ejercicios = [
  { nombre: "Sentadilla", grupo: ["pierna"] },
  { nombre: "Zancadas", grupo: ["pierna"] },
  { nombre: "Peso muerto", grupo: ["pierna", "haltero"] },
  { nombre: "Arrancada", grupo: ["haltero", "pierna", "tren superior"] },
  { nombre: "Envión", grupo: ["haltero", "pierna", "tren superior"] },
  { nombre: "Dominadas", grupo: ["tren superior"] },
  { nombre: "Flexiones", grupo: ["tren superior"] },
  { nombre: "Press militar", grupo: ["tren superior"] },
  { nombre: "Remo", grupo: ["wod", "cardio"] },
  { nombre: "Burpee", grupo: ["wod", "cardio"] },
  { nombre: "Comba", grupo: ["wod", "cardio"] },
  { nombre: "Thruster", grupo: ["wod", "pierna", "tren superior"] },
];

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

// ---------- Pantalla ----------

const botonesGrupo = document.querySelectorAll(".grupo");
const botonProponer = document.getElementById("btn-proponer");
const lista = document.getElementById("resultado");
let gruposElegidos = [];

function mostrar(textos) {
  lista.textContent = "";
  for (const t of textos) {
    const li = document.createElement("li");
    li.textContent = t;
    lista.appendChild(li);
  }
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
    mostrar(["Elige al menos un grupo"]);
    return;
  }
  const propuesta = proponerEntrenamiento(gruposElegidos, 5);
  mostrar(propuesta.map(e => e.nombre));
});