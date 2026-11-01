/* AUREV · Catálogo — lee productos.csv y arma la página.
   No hace falta tocar este archivo para cambiar productos, fotos o precios. */
(function () {
  "use strict";

  var A = window.AJUSTES || {};
  var WA = String(A.whatsapp || "").replace(/\D/g, "");
  var $ = function (id) { return document.getElementById(id); };
  var ICONO_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5 L5.3 15.6 A8.2 8.2 0 1 1 8.6 18.6 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 10.2c.4 1.9 2.2 3.8 4.6 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var SIN_FOTO = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#0e0c12"/>' +
    '<circle cx="200" cy="185" r="62" fill="none" stroke="#8c6a30" stroke-width="4"/>' +
    '<text x="200" y="300" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="18" letter-spacing="4" fill="#8a8478">FOTO PENDIENTE</text></svg>');

  var precioCOP = (function () {
    try {
      var f = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 });
      return function (n) { return f.format(n); };
    } catch (e) {
      return function (n) { return "$ " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
    }
  })();

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sinTildes(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }
  function slug(s) {
    return sinTildes(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* ---------- CSV ---------- */
  function leerCSV(texto) {
    texto = texto.replace(/^﻿/, "");
    var primera = texto.split(/\r?\n/).find(function (l) { return l.trim() && l.trim()[0] !== "#"; }) || "";
    var sep = primera.split(";").length > primera.split(",").length ? ";" : ",";
    var filas = [], fila = [], campo = "", comillas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (comillas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; } else { comillas = false; }
        } else { campo += c; }
      } else if (c === '"') {
        comillas = true;
      } else if (c === sep) {
        fila.push(campo); campo = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(campo); filas.push(fila); fila = []; campo = "";
      } else { campo += c; }
    }
    if (campo !== "" || fila.length) { fila.push(campo); filas.push(fila); }
    return filas.filter(function (f) {
      return f.some(function (v) { return v.trim(); }) && String(f[0]).trim()[0] !== "#";
    });
  }

  var ALIAS = {
    codigo: ["codigo", "cod", "ref", "referencia"],
    nombre: ["nombre", "producto", "pieza"],
    categoria: ["categoria", "tipo"],
    precio: ["precio", "valor"],
    descripcion: ["descripcion", "detalle", "detalles"],
    fotos: ["fotos", "foto", "imagen", "imagenes"],
    estado: ["estado"]
  };

  function aProductos(filas) {
    if (!filas.length) return [];
    var cab = filas[0].map(sinTildes);
    var idx = {};
    Object.keys(ALIAS).forEach(function (k) {
      idx[k] = cab.findIndex(function (h) { return ALIAS[k].indexOf(h) !== -1; });
    });
    if (idx.nombre === -1) throw new Error("A productos.csv le falta la columna «nombre» en la primera fila.");
    var usados = {};
    return filas.slice(1).map(function (f, n) {
      var v = function (k) { return idx[k] === -1 ? "" : String(f[idx[k]] || "").trim(); };
      var digitos = v("precio").replace(/[^\d]/g, "");
      var codigo = v("codigo") || "P" + (n + 1);
      var id = slug(codigo) || "p" + (n + 1);
      while (usados[id]) id += "-b";
      usados[id] = 1;
      return {
        id: id,
        codigo: codigo,
        nombre: v("nombre"),
        categoria: v("categoria") || "Otros",
        precio: digitos ? parseInt(digitos, 10) : null,
        descripcion: v("descripcion"),
        fotos: v("fotos").split(/[|,]/).map(function (s) { return s.trim(); }).filter(Boolean),
        estado: sinTildes(v("estado")) || "disponible"
      };
    }).filter(function (p) { return p.nombre && p.estado !== "oculto"; });
  }

  /* ---------- Fotos (tolera mayúsculas y extensiones distintas) ---------- */
  function candidatos(nombre) {
    if (/^https?:\/\//i.test(nombre)) return [nombre];
    var base = "fotos/" + nombre.replace(/^\.?\/?(fotos\/)?/i, "");
    var lista = [base];
    var minus = base.replace(/[^/]+$/, function (n) { return n.toLowerCase(); });
    if (lista.indexOf(minus) === -1) lista.push(minus);
    var m = base.match(/^(.*)\.([a-z0-9]{2,5})$/i);
    var raiz = m ? m[1] : base;
    ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"].forEach(function (e) {
      var u = raiz + "." + e;
      if (lista.indexOf(u) === -1) lista.push(u);
    });
    return lista.map(encodeURI);
  }
  function imgHTML(nombre, alt, extra) {
    if (!nombre) return '<img src="' + SIN_FOTO + '" alt="' + esc(alt) + '"' + (extra || "") + ">";
    var c = candidatos(nombre);
    return '<img src="' + esc(c[0]) + '" data-c="' + esc(JSON.stringify(c)) + '" data-i="0" alt="' + esc(alt) + '"' + (extra || "") + ">";
  }
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (!img || img.tagName !== "IMG" || !img.dataset.c) return;
    var c = JSON.parse(img.dataset.c), i = +img.dataset.i + 1;
    if (i < c.length) { img.dataset.i = i; img.src = c[i]; }
    else { img.removeAttribute("data-c"); img.src = SIN_FOTO; }
  }, true);

  /* ---------- WhatsApp ---------- */
  function enlacePieza(p) {
    return location.href.split("#")[0] + "#" + p.id;
  }
  function textoPrecio(p) {
    return p.precio != null ? precioCOP(p.precio) : "precio por confirmar";
  }
  function llenar(plantilla, p) {
    return String(plantilla)
      .split("{producto}").join(p.nombre)
      .split("{codigo}").join(p.codigo)
      .split("{precio}").join(textoPrecio(p))
      .split("{enlace}").join(enlacePieza(p))
      .trim();
  }
  function waURL(texto) {
    return "https://wa.me/" + WA + "?text=" + encodeURIComponent(texto);
  }
  function waPieza(p) {
    var agotado = p.estado === "agotado";
    var plantilla = agotado
      ? (A.mensajeAgotado || "Hola, ¿cuándo vuelve a haber {producto}? {enlace}")
      : (A.mensaje || "Hola, me interesa {producto} ({codigo}) – {precio}. {enlace}");
    return waURL(llenar(plantilla, p));
  }

  /* ---------- Estado de la página ---------- */
  var productos = [];
  var categoria = "Todo";
  var busqueda = "";

  function categorias() {
    var vistas = [];
    productos.forEach(function (p) { if (vistas.indexOf(p.categoria) === -1) vistas.push(p.categoria); });
    return ["Todo"].concat(vistas);
  }

  function pintarChips() {
    var cats = categorias();
    $("chips").innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === categoria) + '">' + esc(c) + "</button>";
    }).join("");
  }

  function visibles() {
    var q = sinTildes(busqueda);
    return productos.filter(function (p) {
      if (categoria !== "Todo" && p.categoria !== categoria) return false;
      if (!q) return true;
      return sinTildes([p.nombre, p.descripcion, p.categoria, p.codigo].join(" ")).indexOf(q) !== -1;
    });
  }

  function tarjeta(p) {
    var agotado = p.estado === "agotado";
    var sello = p.estado === "nuevo" ? '<span class="sello nuevo">Nuevo</span>'
      : agotado ? '<span class="sello agotado">Agotado</span>' : "";
    var mas = p.fotos.length > 1 ? '<span class="mas-fotos">' + p.fotos.length + " fotos</span>" : "";
    var precio = p.precio != null
      ? '<p class="precio">' + esc(precioCOP(p.precio)) + "</p>"
      : '<p class="precio consultar">Consultar precio</p>';
    var boton = agotado
      ? '<a class="btn-wa apagado" href="' + esc(waPieza(p)) + '" target="_blank" rel="noopener">' + ICONO_WA + '<span>Avísame<span class="solo-ancho"> cuando llegue</span></span></a>'
      : '<a class="btn-wa" href="' + esc(waPieza(p)) + '" target="_blank" rel="noopener">' + ICONO_WA + '<span>Pedir<span class="solo-ancho"> por WhatsApp</span></span></a>';
    return '<article class="pieza' + (agotado ? " es-agotado" : "") + '">' +
      '<button type="button" class="pieza-foto" data-abrir="' + esc(p.id) + '" aria-label="Ver ' + esc(p.nombre) + '">' +
      imgHTML(p.fotos[0], p.nombre, ' loading="lazy" decoding="async"') + sello + mas + "</button>" +
      '<div class="pieza-info"><p class="eyebrow">' + esc(p.categoria) + "</p>" +
      '<h3><button type="button" data-abrir="' + esc(p.id) + '">' + esc(p.nombre) + "</button></h3>" +
      (p.descripcion ? '<p class="pieza-desc">' + esc(p.descripcion) + "</p>" : "") +
      precio + boton + "</div></article>";
  }

  function pintar() {
    var lista = visibles();
    $("rejilla").innerHTML = lista.map(tarjeta).join("");
    var n = lista.length;
    $("conteo").textContent = n + (n === 1 ? " pieza" : " piezas") + (categoria !== "Todo" ? " · " + categoria : "");
    var vacio = $("vacio");
    if (!n && productos.length) {
      vacio.innerHTML = "<strong>No hay piezas con esa búsqueda</strong><span>Prueba con otra palabra o mira todo el catálogo.</span>" +
        '<button type="button" class="btn-sec" id="limpiar">Ver todo</button>';
      vacio.hidden = false;
    } else {
      vacio.hidden = true;
    }
  }

  function error(msg) {
    $("rejilla").innerHTML = "";
    $("conteo").textContent = "";
    var v = $("vacio");
    v.innerHTML = "<strong>No se pudo cargar el catálogo</strong><span>" + msg + "</span>";
    v.hidden = false;
  }

  /* ---------- Ficha de detalle ---------- */
  var dlg = $("detalle");
  var actual = null;

  function verFoto(i) {
    if (!actual) return;
    var cont = $("d-img").parentNode;
    cont.innerHTML = imgHTML(actual.fotos[i], actual.nombre, ' id="d-img"');
    Array.prototype.forEach.call($("d-miniaturas").children, function (b, j) {
      b.setAttribute("aria-current", String(j === i));
    });
  }

  function abrir(id, desdeHash) {
    var p = productos.find(function (x) { return x.id === id; });
    if (!p) return;
    actual = p;
    $("d-cat").textContent = p.categoria + (p.estado === "agotado" ? " · Agotado" : p.estado === "nuevo" ? " · Nuevo" : "");
    $("d-nombre").textContent = p.nombre;
    $("d-precio").textContent = textoPrecio(p).replace(/^precio/, "Precio");
    $("d-precio").className = "precio grande" + (p.precio == null ? " consultar" : "");
    $("d-desc").textContent = p.descripcion;
    $("d-cod").textContent = "Código " + p.codigo;
    var wa = $("d-wa");
    wa.href = waPieza(p);
    wa.className = "btn-wa" + (p.estado === "agotado" ? " apagado" : "");
    wa.innerHTML = ICONO_WA + "<span>" + (p.estado === "agotado" ? "Avísame cuando llegue" : "Pedir por WhatsApp") + "</span>";
    $("d-miniaturas").innerHTML = p.fotos.length > 1 ? p.fotos.map(function (f, i) {
      return '<button type="button" data-foto="' + i + '" aria-label="Foto ' + (i + 1) + '">' + imgHTML(f, "") + "</button>";
    }).join("") : "";
    $("d-enlace").hidden = true;
    $("d-copiar").textContent = "Copiar enlace de esta pieza";
    verFoto(0);
    if (!dlg.open) {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    }
    if (!desdeHash && location.hash !== "#" + p.id) {
      try {
        if (empujado) history.replaceState(null, "", "#" + p.id);
        else { history.pushState(null, "", "#" + p.id); empujado = true; }
      } catch (e) { /* sin historial */ }
    }
  }

  var empujado = false;
  function cerrar() {
    if (dlg.open) { if (typeof dlg.close === "function") dlg.close(); else { dlg.removeAttribute("open"); alCerrar(); } }
  }
  function alCerrar() {
    actual = null;
    try {
      if (empujado) { empujado = false; history.back(); }
      else if (location.hash) history.replaceState(null, "", location.href.split("#")[0]);
    } catch (e) { /* nada */ }
  }
  dlg.addEventListener("close", alCerrar);
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg) { cerrar(); return; }
    var b = e.target.closest("[data-foto]");
    if (b) verFoto(+b.dataset.foto);
  });
  $("d-cerrar").addEventListener("click", cerrar);
  $("d-copiar").addEventListener("click", function () {
    if (!actual) return;
    var url = enlacePieza(actual), boton = this, campo = $("d-enlace");
    var mostrar = function () { campo.value = url; campo.hidden = false; campo.select(); boton.textContent = "Copia el enlace de abajo"; };
    try {
      navigator.clipboard.writeText(url).then(function () { boton.textContent = "Enlace copiado"; }, mostrar);
    } catch (e) { mostrar(); }
  });
  window.addEventListener("hashchange", function () {
    var id = location.hash.slice(1);
    if (id) abrir(id, true); else { empujado = false; cerrar(); }
  });

  /* ---------- Eventos ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-abrir]");
    if (a) { abrir(a.dataset.abrir); return; }
    var c = e.target.closest("[data-cat]");
    if (c) { categoria = c.dataset.cat; pintarChips(); pintar(); return; }
    if (e.target.id === "limpiar") { categoria = "Todo"; busqueda = ""; $("q").value = ""; pintarChips(); pintar(); }
  });
  $("q").addEventListener("input", function () { busqueda = this.value; pintar(); });

  /* ---------- Marca, pie, botón flotante ---------- */
  (function () {
    var logo = new Image();
    logo.onload = function () {
      var l = $("logo");
      l.innerHTML = "";
      logo.alt = "AUREV JEWELRY";
      l.appendChild(logo);
    };
    logo.src = "logo.png";
  })();
  $("flotante").href = waURL(A.mensajeGeneral || "Hola AUREV, vi el catálogo.");
  $("pie-wa").textContent = A.whatsappVisible || ("+" + WA);
  $("pie-texto").textContent = A.piePagina || "";
  $("anio").textContent = new Date().getFullYear();
  var ig = String(A.instagram || "").replace(/^@/, "").trim();
  if (ig) {
    $("pie-ig").hidden = false;
    $("pie-ig-link").href = "https://www.instagram.com/" + encodeURIComponent(ig) + "/";
    $("pie-ig-link").textContent = "@" + ig;
  }

  /* ---------- Cielo estrellado ---------- */
  (function () {
    var cv = $("estrellas");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var semilla = 7;
    var azar = function () { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
    var estrellas = [];
    for (var i = 0; i < 520; i++) {
      estrellas.push({ x: azar(), y: azar(), r: Math.pow(azar(), 3) * 1.5 + 0.25, a: 0.25 + azar() * 0.75, oro: azar() < 0.18 });
    }
    function dibujar() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = window.innerWidth, h = Math.max(window.innerHeight, (screen && screen.height) || 0);
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var cuantas = Math.min(estrellas.length, Math.round(w * h / 2600));
      for (var i = 0; i < cuantas; i++) {
        var s = estrellas[i];
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, 6.2832);
        ctx.fillStyle = s.oro ? "rgba(243,220,164," + s.a + ")" : "rgba(236,230,218," + (s.a * 0.85) + ")";
        ctx.fill();
        if (s.r > 1.3) {
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, s.r * 4, 0, 6.2832);
          ctx.fillStyle = "rgba(243,220,164,0.06)";
          ctx.fill();
        }
      }
    }
    var t;
    var ultimoAncho = 0;
    window.addEventListener("resize", function () {
      if (window.innerWidth === ultimoAncho) return;
      clearTimeout(t);
      t = setTimeout(function () { ultimoAncho = window.innerWidth; dibujar(); }, 150);
    });
    ultimoAncho = window.innerWidth;
    dibujar();
  })();

  /* ---------- Carga de productos ---------- */
  function iniciar(texto) {
    try {
      productos = aProductos(leerCSV(texto));
    } catch (e) {
      error(esc(e.message));
      return;
    }
    if (!productos.length) {
      error("El archivo <code>productos.csv</code> no tiene productos. Agrega una fila por producto debajo de los títulos.");
      return;
    }
    pintarChips();
    pintar();
    var id = location.hash.slice(1);
    if (id) abrir(id, true);
  }

  if (window.PRODUCTOS_CSV) { iniciar(window.PRODUCTOS_CSV); return; }

  fetch("productos.csv", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.arrayBuffer();
    })
    .then(function (buf) {
      var texto;
      try { texto = new TextDecoder("utf-8", { fatal: true }).decode(buf); }
      catch (e) { texto = new TextDecoder("windows-1252").decode(buf); }
      iniciar(texto);
    })
    .catch(function () {
      error(location.protocol === "file:"
        ? "Abriste el archivo directo desde el computador. El catálogo funciona cuando está publicado en internet (GitHub o Cloudflare)."
        : "No se encontró <code>productos.csv</code>. Revisa que el archivo esté en la carpeta principal y se llame exactamente así.");
    });
})();
