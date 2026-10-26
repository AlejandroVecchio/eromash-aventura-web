// ---------- la cocina en la fogata (sistema COCINA, modo "cocina") ----------
// Como el asado del Monster Hunter y las comidas del Zelda: las presas dejan carne (lobo, jabalí, oso) y en cualquier
// fogata encendida (los fogones de los pueblos y los braseros prendidos) se cocina un plato con carne y las hierbas de
// la alquimia. Cocinar es la tabla de cortar: los ingredientes saltan con sus cortes marcados y hay que hacerlos
// antes de que caigan (deslizando o con las flechas); según lo bien cortado sale a punto (rinde más y dura más), bien,
// desparejo (rinde la mitad) o arruinado (se pierde).
// Se come al toque y queda una comida por vez: suma a las estadísticas por unos minutos de juego.
// Estado en E.extra.cocina = { carne: { id: n }, comida: { id, queda, k } | null, platos: n }. Textos `co.`.
window.COCINA = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const CARNES = {
    lobo: { de: "lobo", prob: 0.6, n: 1, col: "#B8574A" },
    jabali: { de: "jabali", prob: 0.75, n: 1, col: "#C8786A" },
    oso: { de: "oso", prob: 1, n: 2, col: "#8A3A2E" },
  };
  // los platos: qué piden (carne y hierbas), cuánto dura la comida y qué suma
  const PLATOS = {
    asado: { pide: { lobo: 1 }, dura: 300, col: "#C8402D", s: (s, k) => (s.vida += 30 * k) },
    panceta: { pide: { jabali: 1, serbal: 1 }, dura: 300, col: "#FF8D71", s: (s, k) => (s.dano *= 1 + 0.08 * k) },
    guiso: { pide: { oso: 1, abedul: 1, musgo: 1 }, dura: 420, col: "#8A3A2E", s: (s, k) => ((s.vida += 40 * k), (s.armadura += 10 * k)) },
    brochetas: { pide: { luna: 2, lobo: 1 }, dura: 300, col: "#73D5DB", s: (s, k) => ((s.regenRunica *= 1 + 0.15 * k), (s.lampara *= 1 + 0.2 * k)) },
    caldo: { pide: { escarcha: 1, jabali: 1 }, dura: 300, col: "#C8F2F4", s: (s, k) => ((s.estamina += 25 * k), (s.velMov *= 1 + 0.04 * k)) },
  };
  // la tabla de cortar: cuántos cortes pide cada cosa (la carne dura pide más) y cuánto vuela
  const CORTES = { lobo: 4, jabali: 4, oso: 5, pescado: 3 },
    HIERBA_CORTES = 2,
    DIRS = ["izquierda", "derecha", "arriba", "abajo"],
    FLECHA = { izquierda: "←", derecha: "→", arriba: "↑", abajo: "↓" },
    RADIO = 150;
  const vuelo = (n) => 1.3 + n * 0.75; // segundos en el aire: lo que hay para cortarlo
  const base = () => ({ carne: {}, comida: null, platos: 0 });
  let st = base();
  let asador = null; // la tabla en curso: { plato, tiros, i, buenos, malos, mellas, total, listo, … }
  let modoAntes = "juego";

  // ---------- lo que hace falta ----------
  const tiene = (k) => (CARNES[k] ? st.carne[k] || 0 : window.ALQUIMIA ? ALQUIMIA.estado().hierbas[k] || 0 : 0);
  const alcanza = (pide) => Object.keys(pide).every((k) => tiene(k) >= pide[k]);
  function gastar(pide) {
    Object.keys(pide).forEach((k) => {
      if (CARNES[k]) st.carne[k] -= pide[k];
      else ALQUIMIA.estado().hierbas[k] -= pide[k];
    });
  }
  const nombreIng = (k) => (CARNES[k] ? t("co.c_" + k) : t("aq.h_" + k));
  const pideTexto = (pide) =>
    Object.keys(pide)
      .map((k) => `${pide[k]} ${nombreIng(k)}${tiene(k) < pide[k] ? " ✗" : ""}`)
      .join(" · ");
  // los fogones y braseros del mundo, juntados una vez (se rearma si el mundo suma cosas): no se recorre todo en cada cuadro
  let fogones = null,
    fogonesDe = -1;
  function fogataCerca() {
    if (fogonesDe !== W.COSAS.length) (fogones = W.COSAS.filter((o) => o.id === "fogonOlla" || o.id === "brasero")), (fogonesDe = W.COSAS.length);
    let m = null,
      dm = RADIO;
    for (const o of fogones) {
      if (o.o.apagado || (o.id === "brasero" && !o.o.encendido)) continue;
      const d = Math.hypot(o.x - jug.x, o.y - jug.y);
      if (d < dm) (dm = d), (m = o);
    }
    return m;
  }

  // ---------- el menú de la fogata ----------
  function menuFogata() {
    const bot = Object.keys(PLATOS).map((id) => {
      const P = PLATOS[id],
        ok = alcanza(P.pide);
      return { texto: t("co.p_" + id) + (ok ? "" : " ✗"), sub: t("co.p_" + id + "_d") + " · " + pideTexto(P.pide), fn: () => (ok ? (A.cerrarMenu(), empezar(id)) : (HUD.aviso(t("co.faltan")), menuFogata())) };
    });
    // lo que suman otros sistemas al menú del fuego: botonesFogata(f) → [{ texto, sub, fn }]
    const f = fogataCerca();
    if (f) window.SISTEMAS.forEach((s0) => s0.botonesFogata && bot.push(...s0.botonesFogata(f)));
    bot.push({ texto: t("ui.cerrar"), fn: A.cerrarMenu });
    const ahora = st.comida ? t("co.comiste", [t("co.p_" + st.comida.id), Math.ceil(st.comida.queda / 60)]) : t("co.sin_comida");
    A.menu(`<h2>${t("co.titulo")}</h2><div class="sub">${t("co.sub")} ${ahora}</div>`, bot);
  }

  // ---------- la tabla de cortar ----------
  // Como un Fruit Ninja en la fogata: cada ingrediente del plato salta por el aire con sus cortes marcados (flechas) y
  // hay que hacerlos en orden antes de que caiga: deslizando el dedo o el mouse en esa dirección, o con las flechas de
  // mover (A W S D, la cruceta o el stick). La carne dura pide más cortes. Entre los ingredientes salta algún hueso: ese
  // no se corta (cualquier corte mella el cuchillo). Lo bien cortado decide el plato: a punto, bien, desparejo o
  // arruinado (se pierde). Después va a la olla y se come.
  function cortesDe(k) {
    return CORTES[k] || (CARNES[k] ? 4 : HIERBA_CORTES);
  }
  function armarTiros(id, rnd) {
    const P = PLATOS[id],
      l = [];
    Object.keys(P.pide).forEach((k) => {
      for (let i = 0; i < P.pide[k]; i++) l.push(k);
    });
    // mezclados, con uno o dos huesos en el medio
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [l[i], l[j]] = [l[j], l[i]];
    }
    const huesos = 1 + (l.length > 2 ? 1 : 0);
    for (let h = 0; h < huesos; h++) l.splice(1 + Math.floor(rnd() * l.length), 0, "hueso");
    return l.map((k) => {
      const n = k === "hueso" ? 0 : cortesDe(k);
      return { k, n, dirs: Array.from({ length: n }, () => DIRS[Math.floor(rnd() * 4)]), hechos: 0, t: 0, dura: k === "hueso" ? 1.6 : vuelo(n), lado: rnd() < 0.5 ? -1 : 1, cortes: [] };
    });
  }
  function empezar(id) {
    if (!alcanza(PLATOS[id].pide)) return false;
    gastar(PLATOS[id].pide);
    const f = fogataCerca();
    const rnd = DIB.azar(Math.floor(Math.random() * 1e9));
    asador = { plato: id, tiros: armarTiros(id, rnd), i: 0, buenos: 0, malos: 0, mellas: 0, total: 0, listo: null, cierre: 0, pausa: 0.6, fx: f ? f.x : jug.x, fy: f ? f.y : jug.y, mitades: [], tajos: [] };
    asador.total = asador.tiros.reduce((a, q) => a + q.n, 0);
    modoAntes = J.modo === "menu" ? "juego" : J.modo;
    J.modo = "cocina";
    armarCapa();
    // el fuego suena donde está la fogata, corto y bajo (antes se oía en todo el mapa)
    if (window.SONIDO) SONIDO.tocar("fogata", { vol: 0.25, x: asador.fx, y: asador.fy, dur: 1.6 });
    return true;
  }
  const tiro = () => asador && asador.tiros[asador.i];
  // un corte en una dirección (deslizando o con las flechas)
  function cortar(dir) {
    const q = tiro();
    if (!asador || asador.listo || !q || asador.pausa > 0) return;
    const sonar = (n, op) => window.SONIDO && SONIDO.tocar(n, Object.assign({ x: asador.fx, y: asador.fy }, op));
    if (q.k === "hueso") {
      asador.mellas++;
      q.mellado = true;
      sonar("clic", { vol: 0.7, tono: 0.6 });
      if (J.sacudir) J.sacudir(0.2);
      return siguiente();
    }
    if (dir === q.dirs[q.hechos]) {
      q.hechos++;
      asador.buenos++;
      q.cortes.push({ dir, t: 0 });
      sonar("tajo", { vol: 0.5, tono: 1 + q.hechos * 0.05 });
      if (q.hechos >= q.n) siguiente(true);
    } else {
      asador.malos++;
      q.error = 0.3;
      sonar("golpe", { vol: 0.35, tono: 0.8 });
    }
  }
  function siguiente(entero) {
    const q = tiro();
    if (q && entero) {
      // se parte en dos y cae a la olla
      const p = posTiro(q);
      asador.mitades.push({ x: p.x, y: p.y, vx: -120, vy: -200, r: 0, k: q.k, l: 0.8, m: -1 }, { x: p.x, y: p.y, vx: 120, vy: -220, r: 0, k: q.k, l: 0.8, m: 1 });
    }
    asador.i++;
    asador.pausa = 0.35;
    if (asador.i >= asador.tiros.length) terminar();
  }
  // lo bien cortado (0 a 100): cada corte errado resta 8 y cada mella 15
  function precision() {
    if (!asador || !asador.total) return 0;
    return Math.round(Math.max(0, Math.min(100, (asador.buenos / asador.total) * 100 - asador.malos * 8 - asador.mellas * 15)));
  }
  const zonaDe = (p) => (p >= 90 ? "punto" : p >= 55 ? "bien" : p >= 20 ? "desparejo" : "arruinado");
  const RINDE = { punto: 1.4, bien: 1, desparejo: 0.5, arruinado: 0 };
  function terminar() {
    if (!asador || asador.listo) return;
    const z = zonaDe(precision()),
      id = asador.plato;
    asador.listo = z;
    asador.cierre = 1.6;
    if (z === "arruinado") {
      HUD.aviso(t("co.arruinado"), "#5E130D");
      if (window.SONIDO) SONIDO.tocar("crujido", { vol: 0.5, x: asador.fx, y: asador.fy });
    } else {
      comer(id, RINDE[z]);
      if (window.SONIDO) SONIDO.tocar(z === "punto" ? "mision" : "plata", { vol: 0.5, x: asador.fx, y: asador.fy });
    }
  }
  // (compatible con lo de antes: sacar = terminar ya con lo que haya)
  const sacar = terminar;
  function comer(id, k) {
    st.comida = { id, queda: PLATOS[id].dura * (k > 1 ? 1.5 : 1), k };
    st.platos++;
    if (window.RPG) RPG.recalcular();
    jug.hp = jug.hpMax;
    HUD.aviso(t(k > 1 ? "co.a_punto" : k < 1 ? "co.desparejo" : "co.bien", [t("co.p_" + id)]), PLATOS[id].col);
    if (window.ANIMA) ANIMA.gesto("feliz");
  }
  function cerrar() {
    asador = null;
    J.modo = modoAntes || "juego";
    const el = document.getElementById("cocina");
    if (el) el.classList.add("oculto");
    CONTROLES.soltar && CONTROLES.soltar();
  }
  const ANCHO = 720,
    ALTO = 420;
  function armarCapa() {
    let el = document.getElementById("cocina");
    if (!el) {
      document.body.insertAdjacentHTML("beforeend", `<div id="cocina" class="ui panel"><h2></h2><canvas width="${ANCHO}" height="${ALTO}"></canvas><p class="co-pie"></p></div>`);
      el = document.getElementById("cocina");
      // deslizar sobre la tabla: cada 50 px de arrastre es un corte en esa dirección
      const cv = el.querySelector("canvas");
      let desde = null;
      const pos = (e) => {
        const r = cv.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * ANCHO, ((e.clientY - r.top) / r.height) * ALTO];
      };
      cv.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (asador && asador.listo && asador.cierre < 1.2) return cerrarYa();
        desde = pos(e);
        cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
        if (asador) asador.rastro = [desde];
      });
      cv.addEventListener("pointermove", (e) => {
        if (!desde || !asador) return;
        const p = pos(e),
          dx = p[0] - desde[0],
          dy = p[1] - desde[1];
        asador.rastro = (asador.rastro || []).concat([p]).slice(-8);
        if (Math.hypot(dx, dy) < 50) return;
        cortar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "derecha" : "izquierda") : dy > 0 ? "abajo" : "arriba");
        desde = p;
      });
      cv.addEventListener("pointerup", () => ((desde = null), asador && (asador.rastro = null)));
    }
    el.classList.remove("oculto");
    el.querySelector("h2").textContent = t("co.p_" + asador.plato);
    el.querySelector(".co-pie").textContent = t("co.pie_tabla", [["arriba", "izquierda", "abajo", "derecha"].map((a) => CONTROLES.glifo(a)).join(" ")]);
  }
  function cerrarYa() {
    if (asador) asador.cierre = 0;
  }
  // dónde va el ingrediente en el aire: sube desde abajo, se queda arriba un rato y cae
  function posTiro(q) {
    const k = Math.min(1, q.t / q.dura),
      x = ANCHO / 2 + q.lado * (120 - k * 240) * 0.6,
      y = 420 - Math.sin(Math.PI * Math.min(1, k * 1.05)) * 300;
    return { x, y };
  }

  // ---------- el dibujo de la tabla ----------
  function dibujarIng(c, k, x, y, s, r) {
    c.save();
    c.translate(x, y);
    c.rotate(r || 0);
    c.scale(s, s);
    if (k === "hueso") {
      DIB.P(c, [-26, -6, 26, -6, 26, 6, -26, 6], "#D8D2C8");
      DIB.E(c, -28, -7, 8, 8, "#E8E4DC");
      DIB.E(c, -28, 7, 8, 8, "#C8C0B4");
      DIB.E(c, 28, -7, 8, 8, "#E8E4DC");
      DIB.E(c, 28, 7, 8, 8, "#C8C0B4");
    } else if (CARNES[k]) {
      DIB.P(c, [14, -6, 30, -18, 34, -12, 22, 2], "#E8E4DC");
      DIB.E(c, 32, -16, 5, 5, "#F2ECEC");
      DIB.E(c, -4, 6, 24, 17, CARNES[k].col);
      DIB.E(c, -8, 2, 14, 8, "rgba(242,236,236,0.22)");
    } else if (window.ALQUIMIA && ALQUIMIA.HIERBAS[k]) {
      c.scale(1.2, 1.2);
      ASSETS.dibujar(c, ALQUIMIA.HIERBAS[k].asset, 0, 22, 0, { sem: 1, noche: true });
    }
    c.restore();
  }
  function texto(c, txt, x, y, tam, col, peso = 800) {
    c.font = `${peso} ${tam}px "DM Sans", system-ui, sans-serif`;
    c.textAlign = "center";
    c.fillStyle = col;
    c.fillText(txt, x, y);
  }
  function dibujar() {
    const el = document.getElementById("cocina");
    if (!el || !asador) return;
    const c = el.querySelector("canvas").getContext("2d"),
      T = J.t,
      P = DIB.P;
    c.clearRect(0, 0, ANCHO, ALTO);
    // la tabla de madera y la olla con el fuego atrás
    for (let i = 0; i < 6; i++) P(c, [0, i * 70, ANCHO, i * 70, ANCHO, i * 70 + 68, 0, i * 70 + 68], i % 2 ? "#2A2018" : "#30251C");
    const f = (a, b) => Math.sin(T * a + b) * 5;
    P(c, [600, 404, 616, 360 + f(9, 0), 632, 392, 648, 350 + f(11, 1), 664, 392, 680, 364 + f(8, 2), 696, 404], "#C8402D");
    P(c, [620, 404, 640, 376 + f(10, 3), 656, 396, 672, 380 + f(12, 4), 690, 404], "#FF8D71");
    DIB.E(c, 648, 352, 54, 20, "#2A2624");
    P(c, [596, 352, 700, 352, 690, 396, 606, 396], "#3A3634");
    P(c, [648, 352, 700, 352, 690, 396, 648, 396], "#46423F");
    DIB.E(c, 648, 352, 46, 14, PLATOS[asador.plato].col);
    // las mitades que caen a la olla
    asador.mitades.forEach((m) => DIB.alfa(c, Math.max(0, m.l / 0.8), () => dibujarIng(c, m.k, m.x, m.y, 1.6, m.r)));
    // el ingrediente en el aire con sus cortes
    const q = tiro();
    if (q && !asador.listo && asador.pausa <= 0) {
      const p = posTiro(q),
        sac = q.error > 0 ? Math.sin(T * 60) * 6 : 0;
      dibujarIng(c, q.k, p.x + sac, p.y, q.k === "hueso" ? 2 : 2.4, Math.sin(q.t * 3) * 0.3);
      // los tajos hechos: rayas blancas que se apagan
      q.cortes.forEach((ct, n) => {
        const a = ct.dir === "izquierda" || ct.dir === "derecha" ? 0 : Math.PI / 2,
          off = (n - (q.cortes.length - 1) / 2) * 12;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(a);
        DIB.alfa(c, 0.85, () => P(c, [-70, off - 2, 70, off - 2, 70, off + 2, -70, off + 2], "#F2ECEC"));
        c.restore();
      });
      if (q.k === "hueso") texto(c, t("co.no_cortes"), p.x, p.y - 64, 20, "#FF8D71");
      else {
        // las flechas que faltan, la que toca grande y latiendo
        const n = q.n,
          x0 = p.x - ((n - 1) * 40) / 2;
        q.dirs.forEach((d, i) => {
          const hecho = i < q.hechos,
            ahora = i === q.hechos,
            tam = ahora ? 40 + Math.sin(T * 10) * 3 : 26;
          texto(c, FLECHA[d], x0 + i * 40, p.y - 70 + (ahora ? 4 : 0), tam, hecho ? "#7BC86C" : ahora ? "#FFD98A" : "#E0B2B2");
        });
      }
    }
    // el rastro del dedo o del mouse
    if (asador.rastro && asador.rastro.length > 1) {
      c.strokeStyle = "rgba(242,236,236,0.7)";
      c.lineWidth = 5;
      c.beginPath();
      asador.rastro.forEach((pt, i) => (i ? c.lineTo(pt[0], pt[1]) : c.moveTo(pt[0], pt[1])));
      c.stroke();
    }
    // arriba: cuántos van y lo bien cortado
    const quedan = asador.tiros.length - asador.i;
    c.font = '600 16px "DM Sans", system-ui, sans-serif';
    c.textAlign = "left";
    c.fillStyle = "#E0B2B2";
    c.fillText(t("co.quedan", [Math.max(0, quedan)]), 16, 28);
    c.textAlign = "right";
    c.fillStyle = "#FFD98A";
    c.fillText(t("co.precision", [precision()]), ANCHO - 16, 28);
    if (asador.listo) texto(c, t("co.z_" + asador.listo), ANCHO / 2, 190, 44, asador.listo === "punto" ? "#FFD98A" : asador.listo === "arruinado" ? "#FF8D71" : "#F2ECEC");
  }
  function paso(dt) {
    if (!asador) return cerrar();
    asador.mitades = asador.mitades.filter((m) => ((m.x += m.vx * dt), (m.y += m.vy * dt), (m.vy += 900 * dt), (m.r += m.m * dt * 6), (m.l -= dt) > 0));
    if (!asador.listo) {
      if (CONTROLES.recien("pausa")) terminar();
      else if (asador.pausa > 0) asador.pausa -= dt;
      else {
        const q = tiro();
        q.t += dt;
        if (q.error > 0) q.error -= dt;
        DIRS.forEach((d) => CONTROLES.recien(d) && cortar(d));
        // el stick: un corte cada vez que se empuja hacia un lado
        const e = CONTROLES.eje ? CONTROLES.eje() : { x: 0, y: 0 },
          d = Math.abs(e.x) > 0.6 || Math.abs(e.y) > 0.6 ? (Math.abs(e.x) > Math.abs(e.y) ? (e.x > 0 ? "derecha" : "izquierda") : e.y > 0 ? "abajo" : "arriba") : "";
        if (d && d !== asador.eje && !DIRS.some((x) => CONTROLES.recien(x))) cortar(d);
        asador.eje = d;
        // se cayó sin terminar: lo que quedó sin cortar no suma (el hueso que cae solo está bien)
        if (tiro() === q && q.t >= q.dura) siguiente(false);
      }
    } else {
      if (asador.cierre < 1.2 && (CONTROLES.recien("interactuar") || CONTROLES.recien("seguir") || CONTROLES.recien("atacar"))) asador.cierre = 0;
      if ((asador.cierre -= dt) <= 0) return cerrar();
    }
    dibujar();
  }

  // ---------- íconos ----------
  function iconos() {
    Object.keys(CARNES).forEach((id) =>
      INVENTARIO.iconoDe("co_c_" + id, (c) => {
        // el trozo de carne con su hueso
        DIB.E(c, 0, 24, 22, 6, "rgba(0,0,0,0.25)");
        DIB.P(c, [14, -6, 30, -18, 34, -12, 22, 2], "#E8E4DC");
        DIB.E(c, 32, -16, 5, 5, "#F2ECEC");
        DIB.E(c, -4, 6, 24, 17, CARNES[id].col);
        DIB.E(c, -8, 2, 14, 8, "rgba(242,236,236,0.22)");
      }),
    );
    Object.keys(PLATOS).forEach((id) =>
      INVENTARIO.iconoDe("co_p_" + id, (c) => {
        DIB.E(c, 0, 14, 28, 10, "#5E4430");
        DIB.E(c, 0, 10, 24, 8, "#7A5634");
        DIB.E(c, 0, 4, 16, 10, PLATOS[id].col);
      }),
    );
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      J.modos = J.modos || {};
      J.modos.cocina = paso;
      iconos();
      if (window.RPG) RPG.aporte((s) => st.comida && PLATOS[st.comida.id] && PLATOS[st.comida.id].s(s, st.comida.k), "cocina");
    },
    alEmpezar(extra) {
      extra.cocina = Object.assign(base(), extra.cocina || {});
      st = extra.cocina;
      if (asador) cerrar();
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (!st.comida) return;
      if ((st.comida.queda -= dt) <= 0) {
        HUD.aviso(t("co.se_paso", [t("co.p_" + st.comida.id)]));
        st.comida = null;
        if (window.RPG) RPG.recalcular();
      }
    },
    alMorir(e) {
      if (!e || !e.tipo) return;
      for (const id in CARNES) {
        const C = CARNES[id];
        if (C.de !== e.tipo) continue;
        // con semilla por criatura: la misma presa deja lo mismo
        const r = DIB.azar(Math.round(e.casa ? e.casa[0] * 7 + e.casa[1] : e.x) + st.platos * 13)();
        if (r > C.prob) continue;
        st.carne[id] = (st.carne[id] || 0) + C.n;
        A.textoFlotante(e.x, e.y - 90, "+" + C.n + " " + t("co.c_" + id), C.col);
      }
    },
    cercanos(dar) {
      if (J.dentro) return;
      const f = fogataCerca();
      if (f) dar(Math.hypot(f.x - jug.x, f.y - jug.y), t("co.cocinar"), menuFogata, f.x, f.y - 90);
    },
    celdasBolsa() {
      return Object.keys(CARNES)
        .filter((id) => st.carne[id] > 0)
        .map((id) => ({ id: "co_c_" + id, icono: "co_c_" + id, nombre: t("co.c_" + id), desc: t("co.c_" + id + "_d"), cant: st.carne[id] }));
    },
    efectosHud() {
      return st.comida ? [{ texto: t("co.p_" + st.comida.id), n: Math.ceil(st.comida.queda / 60) + "'", col: PLATOS[st.comida.id].col }] : [];
    },
    diario() {
      return st.platos ? `<div class="diario-resumen"><p><b>${t("co.titulo")}</b> ${t("co.diario", [st.platos])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, empezar, cortar, terminar, sacar, precision, comer, cerrar, fogataCerca, menuFogata, alcanza, asador: () => asador, tiro, CARNES, PLATOS, CORTES };
})();
