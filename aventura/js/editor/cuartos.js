// ---------- editar los interiores (tecla 9 o «Editar su interior» con una casa elegida) ----------
// Cada cuarto se edita como plantilla: las cinco casas de la gente, la Casa de las Lindes, la herrería, Sanación, el
// Hongo Dorado y las seis clases de sótano. Se ve como en el juego (1600 × 900, de frente) y se arrastran los muebles
// y la gente, se cambian de tamaño, se dan vuelta, se sacan o se ponen nuevos de la lista; también la pared, la
// ventana, el estandarte y la repisa. Todo va a AGREGADOS.cuartos (el mismo agregados.js, con Deshacer y borradores)
// y interiores.js lo aplica al armar cada cuarto.
window.EDITOR_CUARTOS = (function () {
  "use strict";
  const E = window.EDITOR,
    t = E.t,
    I = window.INTERIORES,
    $ = (id) => document.getElementById(id);
  if (!I || !I.vista) return { abrir() {}, abierta: () => false, tecla() {}, alternar() {} };
  const RW = I.RW,
    RH = I.RH,
    FONDO = I.FONDO;
  const caja = $("cuartos"),
    cv = $("cuartoLienzo"),
    c = cv.getContext("2d");
  let pl = "casa_0",
    cuarto = null,
    firma = "",
    elegido = null, // { clave } de un mueble o { gente: id }
    poniendo = null, // id del mueble que se pone con el próximo clic
    arrastre = null,
    luz = true,
    k = 1,
    ox = 0,
    oy = 0;
  const nombre = (id) => (t("as." + id) === "as." + id ? id : t("as." + id));
  const cf = () => (E.est().cuartos || {})[pl];
  // cambiar lo guardado (con Deshacer): fn recibe la plantilla, creada si hace falta
  function cambiar(fn) {
    E.cambiar((est) => {
      est.cuartos = est.cuartos || {};
      const p = (est.cuartos[pl] = est.cuartos[pl] || { cambios: {}, poner: [] });
      p.cambios = p.cambios || {};
      p.poner = p.poner || [];
      fn(p);
      if (!Object.keys(p.cambios).length && !p.poner.length && ["pared", "ventana", "estandarte", "repisa"].every((x) => p[x] === undefined)) delete est.cuartos[pl];
    });
    firma = "";
  }
  function armar() {
    const f = pl + JSON.stringify(cf() || null);
    if (f === firma && cuarto) return;
    firma = f;
    cuarto = I.vista(pl, E.est().cuartos || {});
    pintarPanel();
  }

  // ---------- el panel ----------
  $("cuPlantilla").innerHTML = I.PLANTILLAS.map((p) => `<option value="${p}">${t("ed.cu_" + p)}</option>`).join("");
  $("cuPared").innerHTML = I.PAREDES.map((p) => `<option value="${p}">${t("ed.cu_pared_" + p)}</option>`).join("");
  $("cuPlantilla").addEventListener("change", () => elegirPlantilla($("cuPlantilla").value));
  $("cuPared").addEventListener("change", () => cambiar((p) => (p.pared = $("cuPared").value)));
  $("cuVentana").addEventListener("change", () => cambiar((p) => (p.ventana = +$("cuVentana").value)));
  $("cuEstandarte").addEventListener("change", () => cambiar((p) => (p.estandarte = +$("cuEstandarte").value || null)));
  $("cuRepisa").addEventListener("change", () => cambiar((p) => (p.repisa = $("cuRepisa").checked)));
  $("cuLuz").addEventListener("change", () => (luz = $("cuLuz").checked));
  $("cuCerrar").onclick = () => cerrar();
  $("cuComoEra").onclick = () => {
    if (cf() && confirm(t("ed.cu_como_era_seguro"))) cambiar((p) => Object.keys(p).forEach((x) => delete p[x]));
  };
  $("cuSelEsc").addEventListener("input", () => escalar(+$("cuSelEsc").value, true));
  $("cuSelEsc").addEventListener("change", () => escalar(+$("cuSelEsc").value));
  $("cuSelEsp").onclick = () => darVuelta();
  $("cuSelSacar").onclick = () => sacar();
  $("cuSelComo").onclick = () => comoEra();
  function pintarPanel() {
    if (!cuarto) return;
    $("cuPlantilla").value = pl;
    const sot = pl.startsWith("sot_");
    $("cuPared").value = cuarto.pared;
    // los sótanos tienen su propia piedra y sus vigas: sin pared, ventana ni estandarte para elegir
    document.querySelectorAll("#cuartos .soloCuarto").forEach((f) => f.classList.toggle("oculto", sot));
    $("cuVentana").value = cuarto.ventana || 0;
    $("cuEstandarte").value = cuarto.estandarte || 0;
    $("cuRepisa").checked = !!cuarto.repisa;
    const n = cf() ? Object.keys(cf().cambios || {}).length + (cf().poner || []).length : 0;
    $("cuCuenta").textContent = t("ed.cu_cuenta", [n]);
    const q = actual();
    $("cuSel").classList.toggle("oculto", !q);
    if (!q) return;
    $("cuSelNombre").textContent = q.gente ? t("av.nombre_" + q.n.id) : nombre(q.m.id);
    $("cuSelTipo").textContent = q.gente ? t("ed.cu_persona") : q.m.puesto ? t("ed.cu_puesto") : q.m.fn ? t("ed.cu_hace", [t(q.m.accion)]) : t("ed.cu_adorno");
    $("cuSelEsc").disabled = !!q.gente;
    $("cuSelEsc").value = q.gente ? 1 : q.m.o.s || 1;
    $("cuSelEscV").textContent = (+$("cuSelEsc").value).toFixed(2);
    $("cuSelEsp").disabled = !!q.gente;
    $("cuSelComo").disabled = !!(q.m && q.m.puesto);
  }
  // la lista de muebles para poner (los de la pestaña interiores del catálogo)
  function armarLista() {
    const l = $("cuLista");
    l.innerHTML = "";
    ASSETS.catalogo()
      .filter((a) => a.grupo === "interiores")
      .forEach((a) => {
        const b = document.createElement("button");
        b.className = "obj";
        b.dataset.id = a.id;
        const m = document.createElement("canvas");
        m.width = 140;
        m.height = 90;
        const g = m.getContext("2d"),
          kk = Math.min(80 / (a.alto || 200), 0.45);
        g.translate(70, 84);
        g.scale(kk, kk);
        try {
          ASSETS.dibujar(g, a.id, 0, 0, 0, Object.assign({ s: 1 }, a.ejemplo));
        } catch (e) {}
        const s = document.createElement("span");
        s.textContent = nombre(a.id);
        b.append(m, s);
        b.onclick = () => {
          poniendo = poniendo === a.id ? null : a.id;
          l.querySelectorAll(".obj").forEach((x) => x.classList.toggle("elegido", x.dataset.id === poniendo));
          if (poniendo) E.avisar(t("ed.cu_poner_aviso", [nombre(a.id)]));
        };
        l.appendChild(b);
      });
  }

  // ---------- elegir, mover, poner ----------
  function actual() {
    if (!elegido || !cuarto) return null;
    if (elegido.gente) {
      const n = cuarto.gente.find((g) => g.id === elegido.gente);
      return n ? { gente: true, n } : null;
    }
    const m = cuarto.muebles.find((q) => q.clave === elegido.clave);
    return m ? { m } : null;
  }
  const alto = (q) => (ASSETS.LISTA[q.id] ? ASSETS.LISTA[q.id].alto : 200) * (q.o.s || 1);
  const ancho = (q) => Math.max(50, q.r || alto(q) * 0.4);
  function tocado(x, y) {
    let mejor = null;
    cuarto.gente.forEach((n) => {
      if (Math.abs(x - n.x) < 60 && y > n.y - 190 && y < n.y + 15 && (!mejor || n.y > mejor.y)) mejor = { gente: n.id, y: n.y };
    });
    cuarto.muebles.forEach((q) => {
      if (Math.abs(x - q.x) > ancho(q) || y > q.y + 30 || y < q.y - alto(q)) return;
      const yy = q.piso ? q.y - 2000 : q.y;
      if (!mejor || yy > mejor.y) mejor = { clave: q.clave, y: yy };
    });
    return mejor;
  }
  const enCuarto = (e) => {
    const r = cv.getBoundingClientRect(),
      px = (e.clientX - r.left) * (cv.width / r.width),
      py = (e.clientY - r.top) * (cv.height / r.height);
    return [(px - ox) / k, (py - oy) / k];
  };
  const piso = (y) => Math.max(FONDO + 4, Math.min(RH - 10, y));
  cv.addEventListener("pointerdown", (e) => {
    if (!cuarto) return;
    const [x, y] = enCuarto(e);
    if (poniendo) {
      const id = poniendo,
        r = Math.round(ancho({ id, o: { s: 1 } }));
      cambiar((p) => p.poner.push({ id, x: Math.round(x), y: Math.round(piso(y)), o: { s: 1 }, r }));
      armar();
      elegido = { clave: "+" + ((cf().poner || []).length - 1) };
      if (!e.shiftKey) {
        poniendo = null;
        $("cuLista").querySelectorAll(".obj").forEach((x) => x.classList.remove("elegido"));
      }
      return pintarPanel();
    }
    const h = tocado(x, y);
    elegido = h ? (h.gente ? { gente: h.gente } : { clave: h.clave }) : null;
    pintarPanel();
    const q = actual();
    if (!q) return;
    const o = q.gente ? q.n : q.m;
    arrastre = { dx: x - o.x, dy: y - o.y, x0: o.x, y0: o.y, o };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!cuarto) return;
    const [x, y] = enCuarto(e);
    if (arrastre) {
      // mientras se arrastra se mueve en la vista; al soltar se guarda (un paso de Deshacer)
      arrastre.o.x = Math.round(Math.max(40, Math.min(RW - 40, x - arrastre.dx)));
      arrastre.o.y = Math.round(piso(y - arrastre.dy));
    } else cv.style.cursor = poniendo ? "copy" : tocado(x, y) ? "grab" : "default";
  });
  cv.addEventListener("pointerup", () => {
    if (!arrastre) return;
    const a = arrastre;
    arrastre = null;
    if (a.o.x === a.x0 && a.o.y === a.y0) return;
    guardarCambio({ x: a.o.x, y: a.o.y });
  });
  // guardar un cambio del elegido: en lo puesto con el editor se cambia el mueble, en lo del código su «cambio»
  function guardarCambio(v) {
    const q = actual();
    if (!q) return;
    cambiar((p) => {
      if (q.m && q.m.puesto) {
        const a = p.poner[+q.m.clave.slice(1)];
        if (!a) return;
        if (v.x !== undefined) (a.x = v.x), (a.y = v.y);
        if (v.s !== undefined) (a.o.s = v.s), (a.r = Math.round(ancho({ id: a.id, o: { s: v.s } })));
        if (v.esp !== undefined) a.o.esp = v.esp;
        return;
      }
      const kk = q.gente ? "gente:" + q.n.id : q.m.clave;
      p.cambios[kk] = Object.assign(p.cambios[kk] || {}, v);
    });
  }
  function escalar(s, vivo) {
    const q = actual();
    if (!q || q.gente) return;
    $("cuSelEscV").textContent = s.toFixed(2);
    if (vivo) return (q.m.o.s = s);
    guardarCambio({ s: Math.round(s * 100) / 100 });
  }
  function darVuelta() {
    const q = actual();
    if (q && !q.gente) guardarCambio({ esp: !q.m.o.esp });
  }
  function sacar() {
    const q = actual();
    if (!q) return;
    if (q.m && q.m.puesto) cambiar((p) => p.poner.splice(+q.m.clave.slice(1), 1));
    else guardarCambio({ quitar: true });
    elegido = null;
    pintarPanel();
  }
  function comoEra() {
    const q = actual();
    if (!q || (q.m && q.m.puesto)) return;
    cambiar((p) => delete p.cambios[q.gente ? "gente:" + q.n.id : q.m.clave]);
  }
  function mover(dx, dy) {
    const q = actual();
    if (!q) return;
    const o = q.gente ? q.n : q.m;
    guardarCambio({ x: o.x + dx, y: piso(o.y + dy) });
  }
  function tecla(e) {
    const kk = e.key;
    if (e.target.tagName === "SELECT" || (e.target.tagName === "INPUT" && e.target.type === "number")) return;
    if (kk === "Escape") {
      e.preventDefault();
      if (poniendo || elegido) {
        poniendo = null;
        elegido = null;
        $("cuLista").querySelectorAll(".obj").forEach((x) => x.classList.remove("elegido"));
        return pintarPanel();
      }
      return cerrar();
    }
    if (kk === "Delete" || kk === "Backspace") return e.preventDefault(), sacar();
    if (kk === "f" || kk === "F") return darVuelta();
    if (kk === "l" || kk === "L") return ($("cuLuz").checked = luz = !luz);
    if (kk === "9") return cerrar();
    const paso = e.shiftKey ? 40 : 8,
      fl = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[kk];
    if (fl && actual()) return e.preventDefault(), mover(...fl);
    if ((kk === "+" || kk === "-") && actual() && !actual().gente) {
      const q = actual().m;
      escalar(Math.max(0.3, Math.min(2.5, (q.o.s || 1) + (kk === "+" ? 0.05 : -0.05))));
    }
  }

  // ---------- dibujar ----------
  function marco(q, col) {
    const a = alto(q),
      w = ancho(q);
    c.save();
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.setLineDash([12, 8]);
    c.strokeRect(q.x - w, q.y - a, w * 2, a + 24);
    c.restore();
  }
  function cuadro(ts) {
    if (!abierta()) return;
    requestAnimationFrame(cuadro);
    armar();
    const r = cv.getBoundingClientRect();
    if (cv.width !== Math.round(r.width) || cv.height !== Math.round(r.height)) (cv.width = Math.round(r.width)), (cv.height = Math.round(r.height));
    k = Math.min(cv.width / RW, cv.height / RH);
    ox = (cv.width - RW * k) / 2;
    oy = (cv.height - RH * k) / 2;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#0A0606";
    c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(k, 0, 0, k, ox, oy);
    c.save();
    c.beginPath();
    c.rect(0, 0, RW, RH);
    c.clip();
    try {
      I.dibujarVista(c, cuarto, ts / 1000, luz);
    } catch (e) {
      console.error(e);
    }
    // lo del editor: lo puesto con borde dorado, lo elegido con borde celeste, la puerta de salida
    cuarto.muebles.forEach((q) => q.puesto && marco(q, "rgba(255,217,138,0.45)"));
    const q = actual();
    if (q) q.gente ? marco({ id: "", x: q.n.x, y: q.n.y, o: {}, r: 60 }, "#73D5DB") : marco(q.m, "#73D5DB");
    if (!cuarto.sotano) {
      c.strokeStyle = "rgba(242,236,236,0.25)";
      c.setLineDash([6, 6]);
      c.lineWidth = 2;
      c.strokeRect(130, RH - 30, 190, 30);
    }
    c.restore();
  }
  // ---------- abrir y cerrar ----------
  function elegirPlantilla(p) {
    if (I.PLANTILLAS.indexOf(p) < 0) return;
    pl = p;
    elegido = null;
    firma = "";
    armar();
  }
  const abierta = () => !caja.classList.contains("oculto");
  let conLista = false;
  function abrir(p) {
    if (p) elegirPlantilla(p);
    if (!conLista) (armarLista(), (conLista = true));
    caja.classList.remove("oculto");
    firma = "";
    armar();
    requestAnimationFrame(cuadro);
  }
  function cerrar() {
    caja.classList.add("oculto");
    arrastre = null;
    E.pedir();
  }
  return { abrir, cerrar, abierta, tecla, alternar: () => (abierta() ? cerrar() : abrir()), plantilla: () => pl };
})();
