/* ============================================================
   ENI APP – LÓGICA PRINCIPAL (MODO HÍBRIDO)
   Funciona offline + sincroniza con Google Sheets
   ============================================================ */

const API_URL = "https://script.google.com/macros/s/AKfycbwCSrBiRW4cUMW5xw7stxSj2DPO1SzBK5stZ1OnP4BND7G5YgSFhOP6fjfNM8RLDHfu/exec";

/* ============================
   DETECTAR MODO OFFLINE
   ============================ */
function actualizarEstadoOffline() {
  const badge = document.getElementById("estadoOffline");
  if (navigator.onLine) {
    badge.classList.add("hidden");
  } else {
    badge.classList.remove("hidden");
  }
}

window.addEventListener("online", actualizarEstadoOffline);
window.addEventListener("offline", actualizarEstadoOffline);
actualizarEstadoOffline();

/* ============================
   CAMBIO DE PESTAÑAS
   ============================ */
function mostrarRegistro() {
  document.getElementById("seccionRegistro").classList.remove("hidden");
  document.getElementById("seccionBuscador").classList.add("hidden");
  document.getElementById("btnTabRegistro").className = "btn-alt";
  document.getElementById("btnTabBuscador").className = "btn-nav-inactive";
}

function mostrarBuscador() {
  document.getElementById("seccionRegistro").classList.add("hidden");
  document.getElementById("seccionBuscador").classList.remove("hidden");
  document.getElementById("btnTabRegistro").className = "btn-nav-inactive";
  document.getElementById("btnTabBuscador").className = "btn-alt";
}

/* ============================
   GUARDAR REGISTRO
   ============================ */
function guardar() {
  const data = {
    folio: document.getElementById("folio").value,
    mz: document.getElementById("mz").value,
    edif: document.getElementById("edif").value,
    dpto: document.getElementById("dpto").value,
    colonia: document.getElementById("colonia").value,
    antena: document.getElementById("antena").value,
    a_serie: document.getElementById("a_serie").value,
    r_serie: document.getElementById("r_serie").value,
    red: document.getElementById("red").value,
    contra: document.getElementById("contra").value,
    telefono: document.getElementById("telefono").value,
    nombre: document.getElementById("nombre").value,
    comentarios: document.getElementById("comentarios").value,
    fecha: document.getElementById("fecha").value,
    status: document.getElementById("status").value
  };

  if (!data.folio) {
    alert("⚠️ Ingresa el Folio para guardar.");
    return;
  }

  if (navigator.onLine) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(() => {
        alert("✔ Registro guardado en Google Sheets");
        limpiarFormulario();
      })
      .catch(() => guardarOffline(data));
  } else {
    guardarOffline(data);
  }
}

/* ============================
   GUARDAR OFFLINE
   ============================ */
function guardarOffline(data) {
  let pendientes = JSON.parse(localStorage.getItem("pendientes")) || [];
  pendientes.push(data);
  localStorage.setItem("pendientes", JSON.stringify(pendientes));
  alert("📴 Sin conexión. Registro guardado en el dispositivo.");
  limpiarFormulario();
}

/* ============================
   SINCRONIZACIÓN AUTOMÁTICA
   ============================ */
setInterval(() => {
  if (!navigator.onLine) return;

  let pendientes = JSON.parse(localStorage.getItem("pendientes")) || [];
  if (pendientes.length === 0) return;

  const registro = pendientes[0];

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(registro)
  })
    .then(() => {
      pendientes.shift();
      localStorage.setItem("pendientes", JSON.stringify(pendientes));
    })
    .catch(() => {});
}, 8000);

/* ============================
   LIMPIAR FORMULARIO
   ============================ */
function limpiarFormulario() {
  document.querySelectorAll("#seccionRegistro input, #seccionRegistro select, #seccionRegistro textarea")
    .forEach(el => {
      if (el.id === "fecha") {
        el.value = new Date().toISOString().split("T")[0];
      } else {
        el.value = "";
      }
    });
}

/* ============================
   BUSCAR
   ============================ */
function buscar() {
  const valor = document.getElementById("buscarSerie").value.trim().toUpperCase();
  const cajaResultados = document.getElementById("resultados");

  if (!valor) {
    cajaResultados.innerHTML = "<p style='color:#ffaa00;text-align:center;'>Escribe algo para buscar.</p>";
    return;
  }

  if (navigator.onLine) {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("bd_local", JSON.stringify(data));
        filtrarYMostrar(data, valor);
      })
      .catch(() => buscarOffline(valor));
  } else {
    buscarOffline(valor);
  }
}

/* ============================
   BUSCAR OFFLINE
   ============================ */
function buscarOffline(valor) {
  const bd = JSON.parse(localStorage.getItem("bd_local")) || [];
  if (bd.length === 0) {
    document.getElementById("resultados").innerHTML =
      "<p style='color:red;text-align:center;'>Sin internet y sin BD local.</p>";
  } else {
    filtrarYMostrar(bd, valor);
  }
}

/* ============================
   FILTRAR RESULTADOS
   ============================ */
function clean(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

function filtrarYMostrar(registros, valor) {
  const cajaResultados = document.getElementById("resultados");
  const v = clean(valor);

  const filtradas = registros.filter(reg => {
    return (
      clean(reg.folio).includes(v) ||
      clean(reg.mz).includes(v) ||
      clean(reg.edif).includes(v) ||
      clean(reg.dpto).includes(v) ||
      clean(reg.colonia).includes(v) ||
      clean(reg.antena).includes(v) ||
      clean(reg.a_serie).includes(v) ||
      clean(reg.r_serie).includes(v) ||
      clean(reg.red).includes(v) ||
      clean(reg.contra).includes(v) ||
      clean(reg.telefono).includes(v) ||
      clean(reg.nombre).includes(v) ||
      clean(reg.comentarios).includes(v) ||
      clean(reg.fecha).includes(v) ||
      clean(reg.status).includes(v)
    );
  });

  if (filtradas.length === 0) {
    cajaResultados.innerHTML =
      "<p style='color:#ff5555;text-align:center;'>No se encontraron registros.</p>";
    return;
  }

  let html = "";
  filtradas.forEach(reg => {
    html += `
      <div class="tarjeta">
        <b>FOLIO:</b> ${reg.folio}<br>
        <b>Cliente:</b> ${reg.nombre}<br>
        <b>Teléfono:</b> ${reg.telefono}<br>
        <b>Dirección:</b> Mz ${reg.mz}, Edif ${reg.edif}, Dpto ${reg.dpto}, Col. ${reg.colonia}<br>
        <b>Equipo:</b> Antena ${reg.antena} (S/N: ${reg.a_serie})<br>
        <b>Router S/N:</b> ${reg.r_serie}<br>
        <b>Red:</b> ${reg.red} | <b>Contra:</b> ${reg.contra}<br>
        <b>Fecha:</b> ${reg.fecha}<br>
        <b>Status:</b> <span class="status-badge">${reg.status}</span><br>
        <b>Comentarios:</b> ${reg.comentarios}
      </div>
    `;
  });

  cajaResultados.innerHTML = html;
}
