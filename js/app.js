const API_BASE = "https://pokeapi.co/api/v2/pokemon";

const generaciones = {
  1: { inicio: 1, fin: 151, nombre: "Generación I" },
  2: { inicio: 152, fin: 251, nombre: "Generación II" },
  3: { inicio: 252, fin: 386, nombre: "Generación III" },
  4: { inicio: 387, fin: 493, nombre: "Generación IV" },
  5: { inicio: 494, fin: 649, nombre: "Generación V" },
  6: { inicio: 650, fin: 721, nombre: "Generación VI" },
  7: { inicio: 722, fin: 809, nombre: "Generación VII" },
  8: { inicio: 810, fin: 905, nombre: "Generación VIII" },
  9: { inicio: 906, fin: 1025, nombre: "Generación IX" }
};

const contenedorPokemon = document.querySelector("#contenedor-pokemon");
const mensajeEstado = document.querySelector("#mensaje-estado");
const contadorResultados = document.querySelector("#contador-resultados");
const btnCargarDatos = document.querySelector("#btn-cargar-datos");
const btnCargarMas = document.querySelector("#btn-cargar-mas");
const btnVerTodos = document.querySelector("#btn-ver-todos");
const btnVerFavoritos = document.querySelector("#btn-ver-favoritos");
const btnTema = document.querySelector("#btn-tema");
const formularioBusqueda = document.querySelector("#formulario-busqueda");
const inputBusqueda = document.querySelector("#buscar-pokemon");
const selectorGeneracion = document.querySelector("#selector-generacion");

const limite = 12;

let generacionActual = 1;
let siguientePokemon = generaciones[generacionActual].inicio;
let pokemonesCargados = [];
let mostrandoFavoritos = false;

let favoritos = JSON.parse(localStorage.getItem("favoritosPokemon")) || [];
const temaGuardado = localStorage.getItem("temaPokedex") || "oscuro";

document.addEventListener("DOMContentLoaded", () => {
  aplicarTema(temaGuardado);
  cargarDatosIniciales();
});

btnCargarDatos.addEventListener("click", () => {
  cargarDatosIniciales();
});

btnCargarMas.addEventListener("click", () => {
  cargarMasPokemones();
});

btnVerTodos.addEventListener("click", () => {
  cargarTodosDeGeneracion();
});

btnVerFavoritos.addEventListener("click", mostrarFavoritos);

selectorGeneracion.addEventListener("change", () => {
  generacionActual = Number(selectorGeneracion.value);
  prepararCambioDeGeneracion();
});

btnTema.addEventListener("click", () => {
  const nuevoTema = document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro";
  aplicarTema(nuevoTema);
});

formularioBusqueda.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const busqueda = inputBusqueda.value.trim().toLowerCase();

  if (!busqueda) {
    mostrarMensaje("Escribe el nombre de un Pokémon para buscar.");
    return;
  }

  await buscarPokemon(busqueda);
});

function prepararCambioDeGeneracion() {
  const rango = generaciones[generacionActual];

  mostrandoFavoritos = false;
  inputBusqueda.value = "";
  pokemonesCargados = [];
  siguientePokemon = rango.inicio;
  contenedorPokemon.innerHTML = "";
  contadorResultados.textContent = "0 resultados";
  btnCargarMas.classList.add("oculto");
  mostrarMensaje(`Seleccionaste ${rango.nombre}. Presiona "Cargar datos" para mostrar Pokémon.`);
}

async function cargarDatosIniciales() {
  const rango = generaciones[generacionActual];

  mostrandoFavoritos = false;
  inputBusqueda.value = "";
  pokemonesCargados = [];
  siguientePokemon = rango.inicio;
  contenedorPokemon.innerHTML = "";
  btnCargarMas.classList.remove("oculto");

  await cargarMasPokemones();
}

async function cargarMasPokemones() {
  const rango = generaciones[generacionActual];

  if (siguientePokemon > rango.fin) {
    mostrarMensaje(`Ya se cargaron todos los Pokémon de ${rango.nombre}.`);
    controlarBotonCargarMas();
    return;
  }

  try {
    mostrarMensaje("Cargando...");
    bloquearBotones(true);

    const ids = [];

    for (let id = siguientePokemon; id <= rango.fin && ids.length < limite; id++) {
      ids.push(id);
    }

    const nuevosPokemones = await Promise.all(ids.map((id) => obtenerPokemonPorId(id)));

    pokemonesCargados = [...pokemonesCargados, ...nuevosPokemones];
    siguientePokemon += nuevosPokemones.length;

    renderizarPokemones(pokemonesCargados);
    limpiarMensaje();
    controlarBotonCargarMas();
  } catch (error) {
    mostrarMensaje(`Error: ${error.message}`);
  } finally {
    bloquearBotones(false);
  }
}

async function cargarTodosDeGeneracion() {
  const rango = generaciones[generacionActual];

  try {
    mostrandoFavoritos = false;
    inputBusqueda.value = "";
    mostrarMensaje(`Cargando todos los Pokémon de ${rango.nombre}...`);
    bloquearBotones(true);
    btnCargarMas.classList.add("oculto");

    const ids = [];

    for (let id = rango.inicio; id <= rango.fin; id++) {
      ids.push(id);
    }

    const todos = await Promise.all(ids.map((id) => obtenerPokemonPorId(id)));

    pokemonesCargados = todos;
    siguientePokemon = rango.fin + 1;

    renderizarPokemones(pokemonesCargados);
    limpiarMensaje();
  } catch (error) {
    mostrarMensaje(`Error: ${error.message}`);
  } finally {
    bloquearBotones(false);
  }
}

async function obtenerPokemonPorId(id) {
  const respuesta = await fetch(`${API_BASE}/${id}`);

  if (!respuesta.ok) {
    throw new Error("No se pudo obtener información desde PokéAPI.");
  }

  return await respuesta.json();
}

async function buscarPokemon(nombre) {
  try {
    mostrandoFavoritos = false;
    mostrarMensaje("Buscando...");
    btnCargarMas.classList.add("oculto");

    const respuesta = await fetch(`${API_BASE}/${nombre}`);

    if (!respuesta.ok) {
      throw new Error("No se encontró ese Pokémon.");
    }

    const pokemon = await respuesta.json();

    renderizarPokemones([pokemon]);
    limpiarMensaje();
  } catch (error) {
    contenedorPokemon.innerHTML = "";
    contadorResultados.textContent = "0 resultados";
    mostrarMensaje(`Error: ${error.message}`);
  }
}

function renderizarPokemones(listaPokemones) {
  contenedorPokemon.innerHTML = "";

  if (listaPokemones.length === 0) {
    contenedorPokemon.innerHTML = `
      <article class="tarjeta-pokemon">
        <h3>No hay Pokémon para mostrar</h3>
        <p>Agrega favoritos o carga una generación.</p>
      </article>
    `;
    contadorResultados.textContent = "0 resultados";
    return;
  }

  const fragmento = document.createDocumentFragment();

  listaPokemones.forEach((pokemon) => {
    fragmento.appendChild(crearTarjetaPokemon(pokemon));
  });

  contenedorPokemon.appendChild(fragmento);
  contadorResultados.textContent = `${listaPokemones.length} resultado(s)`;
}

function crearTarjetaPokemon(pokemon) {
  const articulo = document.createElement("article");
  articulo.classList.add("tarjeta-pokemon");
  articulo.setAttribute("role", "listitem");

  const id = pokemon.id;
  const nombre = pokemon.name;
  const imagen = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default || "";
  const tipos = pokemon.types.map((item) => item.type.name);
  const alturaMetros = pokemon.height / 10;
  const pesoKilos = pokemon.weight / 10;
  const esFavorito = favoritos.some((favorito) => favorito.id === id);

  articulo.innerHTML = `
    <div class="tarjeta-top">
      <p class="numero">#${String(id).padStart(3, "0")}</p>
      <button
        type="button"
        class="boton-favorito ${esFavorito ? "activo" : ""}"
        aria-label="${esFavorito ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`}"
        title="${esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}"
      >
        ${esFavorito ? "♥" : "♡"}
      </button>
    </div>

    <div class="imagen-pokemon">
      <img src="${imagen}" alt="Imagen oficial de ${nombre}" loading="lazy" />
    </div>

    <h3 class="nombre-pokemon">${nombre}</h3>

    <div class="tipos" aria-label="Tipos de ${nombre}">
      ${tipos.map((tipo) => `<span class="tipo ${tipo}">${tipo}</span>`).join("")}
    </div>

    <div class="datos">
      <p class="dato"><span>Altura</span>${alturaMetros} m</p>
      <p class="dato"><span>Peso</span>${pesoKilos} kg</p>
    </div>
  `;

  articulo.querySelector(".boton-favorito").addEventListener("click", () => {
    alternarFavorito(pokemon);
  });

  return articulo;
}

function alternarFavorito(pokemon) {
  const existe = favoritos.some((favorito) => favorito.id === pokemon.id);

  if (existe) {
    favoritos = favoritos.filter((favorito) => favorito.id !== pokemon.id);
  } else {
    favoritos.push({
      id: pokemon.id,
      name: pokemon.name,
      height: pokemon.height,
      weight: pokemon.weight,
      types: pokemon.types,
      sprites: pokemon.sprites
    });
  }

  localStorage.setItem("favoritosPokemon", JSON.stringify(favoritos));

  if (mostrandoFavoritos) {
    mostrarFavoritos();
    return;
  }

  const resultadoBusqueda = inputBusqueda.value.trim();

  if (resultadoBusqueda) {
    buscarPokemon(resultadoBusqueda.toLowerCase());
  } else {
    renderizarPokemones(pokemonesCargados);
  }
}

function mostrarFavoritos() {
  mostrandoFavoritos = true;
  inputBusqueda.value = "";
  btnCargarMas.classList.add("oculto");
  renderizarPokemones(favoritos);
  limpiarMensaje();
}

function controlarBotonCargarMas() {
  const rango = generaciones[generacionActual];

  if (siguientePokemon > rango.fin || mostrandoFavoritos) {
    btnCargarMas.classList.add("oculto");
  } else {
    btnCargarMas.classList.remove("oculto");
  }
}

function aplicarTema(tema) {
  if (tema === "oscuro") {
    document.body.classList.add("tema-oscuro");
    btnTema.textContent = "☀️";
    localStorage.setItem("temaPokedex", "oscuro");
  } else {
    document.body.classList.remove("tema-oscuro");
    btnTema.textContent = "🌙";
    localStorage.setItem("temaPokedex", "claro");
  }
}

function bloquearBotones(estado) {
  btnCargarDatos.disabled = estado;
  btnCargarMas.disabled = estado;
  btnVerTodos.disabled = estado;
}

function mostrarMensaje(mensaje) {
  mensajeEstado.textContent = mensaje;
}

function limpiarMensaje() {
  mensajeEstado.textContent = "";
}
