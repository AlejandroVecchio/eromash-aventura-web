// ---------- el botín y el equipo de Eromash (sistema BOTIN) ----------
// Las criaturas sueltan piezas de equipo (OBJETOS): de vez en cuando las comunes de un grupo, más seguido los líderes y
// siempre los únicos y los semijefes; los cofres también traen. Lo que cae queda tirado en el piso con su haz de luz
// del color de la rareza y su nombre arriba, y se junta con E. La mochila tiene casillas de equipo (arma, escudo,
// casco, pecho, piernas, botas, amuleto y dos anillos) y la bolsa guarda hasta 30 piezas: tocar una la equipa (lo
// que tenía puesto vuelve a la bolsa), con R (△) se desarma en materiales (MATERIALES) y algo de plata, y cada pieza dice cómo cambia a Eromash
// comparada con la que tiene puesta. Lo puesto suma a las estadísticas con RPG.aporte y los atributos con
// ATRIBUTOS.bono. Estado en E.extra.equipo = { puesto: { casilla: pieza }, bolsa: [pieza], suelo: [{ x, y, it }] }.
window.BOTIN = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const O = () => OBJETOS;
  const MAX_BOLSA = 30,
    MAX_SUELO = 40,
    RADIO = 90;
  let st = null;
  const vuelan = []; // lo que salta al caer o vuela solo a Eromash (los cofres)

  const base = () => ({ puesto: {}, bolsa: [], suelo: [] });
  // la espada con la que llega: la del forastero, común y de nivel 1
  function inicial() {
    const it = O().generar({ base: "espadaHierro", r: 0, n: 1, tema: 1, rnd: O().azar(7) });
    it.fijo = "ob.forastero";
    it.d = 10;
    return it;
  }
  const puesta = (casilla) => (st && st.puesto[casilla]) || null;
  const puestas = () => (st ? O().SLOTS.map((k) => st.puesto[k]).filter(Boolean) : []);

  // ---------- la bolsa y el equipo ----------
  // dar una pieza: a la bolsa, o al piso a los pies si no entra
  function dar(it, op = {}) {
    if (st.bolsa.length >= MAX_BOLSA) {
      HUD.aviso(t("ob.bolsa_llena"), "#C8402D");
      tirar(jug.x, jug.y, it);
      return false;
    }
    it.nuevo = true;
    st.bolsa.push(it);
    if (!op.silencio) {
      HUD.aviso(t("ob.juntaste", [O().nombre(it)]), O().COL_TEXTO[it.r]);
      if (window.SONIDO) SONIDO.tocar(O().BASES[it.b].slot === "arma" ? "filo" : "tela", { vol: 0.5, var: 0.1 });
    }
    if (window.INVENTARIO) INVENTARIO.repintar();
    return true;
  }
  // la casilla donde va una pieza (los anillos: la primera libre o la del anillo más flojo)
  function casillaPara(it) {
    const s = O().BASES[it.b].slot;
    if (s !== "anillo") return s;
    if (!st.puesto.anillo1) return "anillo1";
    if (!st.puesto.anillo2) return "anillo2";
    return O().valor(st.puesto.anillo1) <= O().valor(st.puesto.anillo2) ? "anillo1" : "anillo2";
  }
  function equipar(i, casilla) {
    const it = st.bolsa[i];
    if (!it) return false;
    casilla = casilla || casillaPara(it);
    // las armas a dos manos no dejan llevar escudo: el escudo vuelve a la bolsa (y un escudo no entra con un mandoble)
    const dos = (p) => p && O().BASES[p.b].dosManos;
    if (casilla === "escudo" && dos(st.puesto.arma)) {
      HUD.aviso(t("ob.dos_manos_escudo"), "#FF8D71");
      return false;
    }
    if (casilla === "arma" && dos(it) && st.puesto.escudo) {
      if (st.bolsa.length >= MAX_BOLSA) {
        HUD.aviso(t("ob.bolsa_llena"), "#C8402D");
        return false;
      }
      st.bolsa.push(st.puesto.escudo);
      delete st.puesto.escudo;
      HUD.aviso(t("ob.dos_manos_guardas"), "#E0B2B2");
    }
    const antes = st.puesto[casilla];
    st.bolsa.splice(i, 1);
    st.puesto[casilla] = it;
    delete it.nuevo;
    if (antes) st.bolsa.splice(i, 0, antes);
    if (window.SONIDO) SONIDO.tocar(O().BASES[it.b].slot === "arma" ? "filo" : "tela", { vol: 0.5 });
    if (window.RPG) RPG.recalcular();
    return true;
  }
  function quitar(casilla) {
    const it = st.puesto[casilla];
    if (!it) return false;
    if (st.bolsa.length >= MAX_BOLSA) {
      HUD.aviso(t("ob.bolsa_llena"), "#C8402D");
      return false;
    }
    delete st.puesto[casilla];
    st.bolsa.push(it);
    if (window.RPG) RPG.recalcular();
    return true;
  }
  // desarmar: la pieza se deshace en materiales para la forja (MATERIALES) y un poco de plata
  let confirmar = null;
  const plataDesarmar = (it) => Math.max(1, Math.round(O().valor(it) * (window.MATERIALES ? 0.15 : 0.3)));
  function desarmar(i) {
    const it = st.bolsa[i];
    if (!it) return false;
    // lo raro o mejor pide confirmar (apretar dos veces)
    if (it.r >= 2 && confirmar !== it.u) {
      confirmar = it.u;
      HUD.aviso(t("ob.desarmar_seguro", [O().nombre(it)]), "#FF8D71");
      return false;
    }
    confirmar = null;
    st.bolsa.splice(i, 1);
    const plata = plataDesarmar(it);
    PODERES.darPlata(plata);
    if (window.MATERIALES) HUD.aviso(t("mt.desarmado", [O().nombre(it), MATERIALES.texto(MATERIALES.alDesarmar(it)), plata]), "#FFD98A");
    else HUD.aviso(t("ob.desarmado", [O().nombre(it), plata]), "#FFD98A");
    if (window.SONIDO) SONIDO.tocar("golpe", { vol: 0.45, tono: 1.3 });
    return true;
  }

  // ---------- comparar con lo puesto ----------
  // cuánto cambia cada estadística si se pone la pieza (en la casilla que le toca)
  function comparar(it) {
    const casilla = casillaPara(it),
      ahora = puestas(),
      luego = ahora.filter((p) => p !== st.puesto[casilla]).concat([it]);
    const a = resumen(ahora, st.puesto.arma),
      b = resumen(luego, casilla === "arma" ? it : st.puesto.arma);
    const d = [];
    Object.keys(Object.assign({}, a, b)).forEach((k) => {
      const v = (b[k] || 0) - (a[k] || 0);
      if (Math.abs(v) > 0.05) d.push([k, v]);
    });
    return d;
  }
  // las estadísticas que se comparan, en números legibles: daño del golpe (% contra 1), armadura, vida…
  function resumen(piezas, arma) {
    const s = { vida: 0, estamina: 0, dano: 1, crit: 0, critMult: 0, velAtq: 1, velMov: 1, runico: 1, armadura: 0, regen: 1, regenRunica: 1, xp: 1, plata: 1, botin: 1 };
    const x = O().aportar(s, piezas, arma);
    const r = { dano: (s.dano - 1) * 100, armadura: s.armadura, vida: s.vida, estamina: s.estamina, crit: s.crit * 100, critMult: s.critMult * 100, velAtq: (s.velAtq - 1) * 100, velMov: (s.velMov - 1) * 100, runico: (s.runico - 1) * 100, regen: (s.regen - 1) * 100, regenRunica: (s.regenRunica - 1) * 100, robo: (s.robo || 0) * 100, fuego: s.fuego || 0, plata: (s.plata - 1) * 100, xp: (s.xp - 1) * 100, hallazgo: (s.botin - 1) * 100 };
    ["fue", "des", "vig", "esp"].forEach((k) => (r[k] = x[k] || 0));
    return r;
  }
  const PC = { dano: 1, crit: 1, critMult: 1, velAtq: 1, velMov: 1, runico: 1, regen: 1, regenRunica: 1, robo: 1, plata: 1, xp: 1, hallazgo: 1 };
  function htmlComparar(it) {
    const d = comparar(it);
    if (!d.length) return `<span class="ob-igual">${t("ob.cmp_igual")}</span>`;
    return d
      .map(([k, v]) => {
        const n = Math.round(Math.abs(v) * (PC[k] ? 1 : 10)) / (PC[k] ? 1 : 10);
        return `<span class="${v > 0 ? "ob-sube" : "ob-baja"}">${v > 0 ? "+" : "−"}${String(n).replace(".", I18N.lang === "en" ? "." : ",")}${PC[k] ? " %" : ""} ${t("ob.c_" + k)}</span>`;
      })
      .join("");
  }
  // el detalle de una pieza para el pie de la mochila
  function html(it, comparada) {
    const l = O().lineas(it);
    let h = `<span class="ob-rotulo">${O().rotulo(it)}</span>`;
    h += `<span class="ob-lineas">` + l.map((q) => `<span style="color:${q.col}"${q.grande ? ' class="grande"' : ""}>${q.txt}</span>`).join("") + `</span>`;
    if (comparada) h += `<span class="ob-cmp"><small>${t("ob.cmp_titulo")}</small>${htmlComparar(it)}</span>`;
    return h;
  }

  // ---------- lo que cae ----------
  function hallazgo() {
    return window.RPG && RPG.stats().botin ? RPG.stats().botin : 1;
  }
  // tirar una pieza al piso (salta un poco); iman: vuela sola hasta Eromash y entra en la bolsa
  function tirar(x, y, it, iman) {
    const a = Math.random() * Math.PI * 2,
      v = iman ? 120 : 70 + Math.random() * 80;
    vuelan.push({ x, y, it, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, z: 6, vz: 300 + Math.random() * 80, t: 0, iman: !!iman, rot: (Math.random() - 0.5) * 1.2 });
    if (it.r >= 2 && window.SONIDO) SONIDO.tono("triangle", it.r === 3 ? 392 : 523, it.r === 3 ? 1046 : 784, 0.5, 0.05, { x, y, filtro: 2400 });
  }
  function aterrizar(v) {
    st.suelo.push({ x: Math.round(v.x), y: Math.round(v.y), it: v.it, rot: v.rot });
    // lo más viejo y flojo se pierde si hay demasiado tirado
    if (st.suelo.length > MAX_SUELO) {
      let peor = 0;
      st.suelo.forEach((s, i) => s.it.r < st.suelo[peor].it.r && (peor = i));
      st.suelo.splice(peor, 1);
    }
  }
  // el nivel de objeto de un lugar: el de las criaturas de ahí, sin quedar muy por debajo de Eromash
  function nivelEn(x, y) {
    const p = W.LUGARES.puesto.p,
      lugar = 1 + Math.hypot(x - p[0], y - p[1]) / 800,
      yo = window.RPG ? RPG.nivel() : 1;
    return Math.max(1, Math.round(Math.max(lugar, yo - 1)));
  }
  // una criatura vencida: ¿suelta algo?
  function alMorir(e) {
    if (!st || e.esbirro || e.sinBotin) return;
    let chance = 0.07,
      min = 0,
      veces = 1,
      peso = 1;
    if (e.lider) {
      chance = e.lider.unico ? 1 : 0.55;
      min = e.lider.unico ? 2 : 0;
      peso = e.lider.unico ? 1.5 : 1.8;
    }
    if (e.semi || e.patron) {
      chance = 1;
      min = 2;
      veces = 2;
    }
    if (e.tipo === "custodio" || e.tipo === "oso" || e.tipo === "trol") (chance = Math.max(chance, 0.8)), (min = Math.max(min, 1));
    const n = window.RPG ? RPG.nivelDe(e) : 1,
      tema = ARTE_OBJ.temaEn(W, e.x, e.y);
    for (let k = 0; k < veces; k++) {
      if (Math.random() >= chance) continue;
      tirar(e.x, e.y, O().generar({ n, min, hallazgo: hallazgo() * peso, tema }));
    }
  }
  // los cofres: el botín de siempre, y a veces una pieza que vuela sola a Eromash
  function envolverCofres() {
    const orig = PODERES.botinCofre;
    PODERES.botinCofre = function (x, y, nombre, b, importante) {
      const r = orig.apply(this, arguments);
      if (st && (importante || Math.random() < 0.4)) {
        const it = O().generar({ n: nivelEn(x, y), min: importante ? 1 : 0, hallazgo: hallazgo() * (importante ? 2 : 1), tema: ARTE_OBJ.temaEn(W, x, y) });
        J.retrasar(0.7, () => tirar(x, y - 20, it, true));
      }
      return r;
    };
  }

  // ---------- en el mundo ----------
  function cercana() {
    let m = null,
      dm = RADIO;
    st.suelo.forEach((s) => {
      const d = Math.hypot(s.x - jug.x, s.y - jug.y);
      if (d < dm) (dm = d), (m = s);
    });
    return m ? { s: m, d: dm } : null;
  }
  function juntar(s) {
    const i = st.suelo.indexOf(s);
    if (i < 0) return;
    if (st.bolsa.length >= MAX_BOLSA) return HUD.aviso(t("ob.bolsa_llena"), "#C8402D");
    st.suelo.splice(i, 1);
    dar(s.it);
    if (window.ANIMA && s.it.r >= 2) ANIMA.gesto("feliz");
  }
  // la pieza tirada, plana en el piso (gira con la cámara como todo lo del piso)
  function dibujarEnPiso(c, s) {
    const lado = O().BASES[s.it.b].slot === "pecho" ? 46 : 40;
    c.save();
    c.translate(s.x, s.y);
    c.scale(1, 0.8);
    c.rotate(s.rot || 0);
    DIB.alfa(c, 0.4, () => DIB.E(c, 2, 4, lado * 0.5, lado * 0.42, "#000"));
    // un anillo del color de la rareza, para encontrarla entre el pasto
    if (s.it.r) DIB.alfa(c, 0.45 + Math.sin(J.t * 3 + s.x) * 0.15, () => {
      c.strokeStyle = O().RAREZAS[s.it.r].col;
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(0, 0, lado * 0.62, lado * 0.62, 0, 0, Math.PI * 2);
      c.stroke();
    });
    ARTE_OBJ.icono(c, s.it, 0, 0, lado);
    c.restore();
  }
  // el haz de luz (las mágicas un brillo corto; raras y legendarias una columna) y el nombre arriba, sobre la noche
  function dibujarHaz(c, s, vista, cerca) {
    const [x, y] = vista(s.x, s.y),
      col = O().RAREZAS[s.it.r].col,
      r = s.it.r,
      late = 0.7 + Math.sin(J.t * 3 + s.x) * 0.15,
      alto = [0, 60, 220, 340, 280][r];
    if (alto && (!window.CALIDAD || CALIDAD.nivel !== "baja" || r >= 2)) {
      c.save();
      c.globalAlpha = (r >= 2 ? 0.32 : 0.22) * late;
      c.fillStyle = col;
      DIB.P(c, [x - 7, y, x - 2, y - alto, x + 2, y - alto, x + 7, y], col);
      c.globalAlpha = (r >= 2 ? 0.55 : 0.4) * late;
      DIB.P(c, [x - 2, y, x, y - alto * 0.85, x + 2, y], "#FFF4D0");
      c.restore();
      // brasas en rombo que suben por el haz (como en el logo)
      if (r >= 2 && (!window.CALIDAD || CALIDAD.nivel === "alta"))
        for (let k = 0; k < 3; k++) {
          const u = (J.t * 0.5 + k / 3 + (s.x % 7) / 7) % 1,
            yy = y - u * alto,
            xx = x + Math.sin(u * 9 + k) * 6,
            q = 3 * (1 - u);
          DIB.alfa(c, 1 - u, () => DIB.P(c, [xx, yy - q, xx + q, yy, xx, yy + q, xx - q, yy], col));
        }
    }
    const d = Math.hypot(s.x - jug.x, s.y - jug.y);
    if (!cerca && d > (r ? 900 : 320)) return null;
    return { s, x, y: y - 34 - (alto ? 6 : 0), cerca, col, r };
  }
  // los nombres, sin pisarse: de adelante hacia atrás, cada uno sube hasta que no toca a los ya puestos
  function dibujarRotulos(c, l) {
    c.font = '800 13px "Eromash Text", system-ui, sans-serif';
    c.textAlign = "center";
    const puestos = [];
    l.sort((a, b) => b.y - a.y || (b.cerca ? 1 : 0) - (a.cerca ? 1 : 0));
    l.forEach((q) => {
      const txt = O().nombre(q.s.it),
        w = c.measureText(txt).width + 14;
      let ty = q.y;
      for (let k = 0; k < 12; k++) {
        const choca = puestos.find((p) => Math.abs(p.x - q.x) < (p.w + w) / 2 && Math.abs(p.y - ty) < 21);
        if (!choca) break;
        ty = choca.y - 21;
      }
      puestos.push({ x: q.x, y: ty, w });
      const x = q.x;
      if (ty < q.y - 4) DIB.alfa(c, 0.5, () => DIB.L(c, x, ty + 5, x, q.y + 2, q.col, 1.5));
      c.globalAlpha = q.cerca ? 0.95 : 0.8;
      DIB.P(c, [x - w / 2, ty - 15, x + w / 2 - 5, ty - 15, x + w / 2, ty - 10, x + w / 2, ty + 5, x - w / 2 + 5, ty + 5, x - w / 2, ty], q.cerca ? "#3A1A14" : "rgba(17,17,17,0.85)");
      if (q.cerca) DIB.R(c, x - w / 2, ty + 4, w, 2, q.col);
      c.fillStyle = O().COL_TEXTO[q.r];
      c.fillText(txt, x, ty);
      c.globalAlpha = 1;
    });
  }
  function dibujarVuela(c, v) {
    const y = v.y - v.z - 10;
    DIB.sombra(c, v.x, v.y, 10, 3, 0.3);
    c.save();
    c.translate(v.x, y);
    c.rotate(v.t * 7);
    ARTE_OBJ.icono(c, v.it, 0, 0, 34);
    c.restore();
  }

  // ---------- la mochila ----------
  const CASILLAS_IZQ = ["casco", "pecho", "piernas", "botas"],
    CASILLAS_DER = ["arma", "escudo", "amuleto", "anillo1", "anillo2"],
    SILUETA = { arma: "espadaHierro", escudo: "escudoRedondo", casco: "casco", pecho: "jubon", piernas: "calzas", botas: "botasCuero", amuleto: "amuleto", anillo1: "anillo", anillo2: "anillo" };
  function celdaCasilla(k) {
    const it = st.puesto[k];
    if (!it) return { id: "eq_" + k, fantasma: { b: SILUETA[k], r: 0, n: 1, a: [], tema: 1, v: 0 }, nombre: t("ob.casilla_" + O().slotDe(k)), desc: t("ob.casilla_vacia"), falta: true, vacia: true };
    return { id: "eq_" + k, obj: it, nombre: O().nombre(it), col: O().COL_TEXTO[it.r], html: html(it) + `<span class="ob-pista">${t("ob.pista_quitar")}</span>`, desc: "", fn: () => quitar(k) };
  }
  // reemplaza el casco, la cota y la espada de siempre por las casillas del equipo; lámpara, Lente y manzanas bajan
  function lados(pe, l) {
    if (!st) return l;
    const otros = l.izq.concat(l.der).filter((q) => ["lampara", "lente", "manzanas"].includes(q.id));
    return { izq: CASILLAS_IZQ.map(celdaCasilla), der: CASILLAS_DER.map(celdaCasilla), abajo: otros };
  }
  function celdasBolsa() {
    if (!st) return [];
    return st.bolsa.map((it, i) => ({
      id: "ob_" + it.u,
      obj: it,
      nuevo: it.nuevo,
      nombre: O().nombre(it),
      col: O().COL_TEXTO[it.r],
      html: html(it, true) + `<span class="ob-pista">${t("ob.pista_equipar")}</span>`,
      desc: "",
      fn: () => equipar(st.bolsa.indexOf(it)),
      alt: { texto: window.MATERIALES ? t("mt.desarmar", [MATERIALES.texto(MATERIALES.deDesarmar(it)), plataDesarmar(it), CONTROLES.glifo("lente")]) : t("ob.desarmar", [plataDesarmar(it), CONTROLES.glifo("lente")]), fn: () => desarmar(st.bolsa.indexOf(it)) },
      visto: () => delete it.nuevo,
    }));
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      if (window.RPG) RPG.aporte((s) => st && O().aportar(s, puestas(), st.puesto.arma));
      if (window.ATRIBUTOS && ATRIBUTOS.bono)
        ATRIBUTOS.bono(() => {
          const x = O().sumar(puestas());
          return { fue: x.fue || 0, des: x.des || 0, vig: x.vig || 0, esp: x.esp || 0 };
        });
      envolverCofres();
      ARTE_OBJ.alCargar(() => window.INVENTARIO && INVENTARIO.repintar());
    },
    alEmpezar(extra) {
      extra.equipo = Object.assign(base(), extra.equipo || {});
      st = extra.equipo;
      if (!st.puesto.arma && !st.empezado) st.puesto.arma = inicial();
      st.empezado = 1;
      vuelan.length = 0;
      confirmar = null;
      if (window.RPG) RPG.recalcular();
    },
    actualizar(dt) {
      if (!st) return;
      for (let i = vuelan.length - 1; i >= 0; i--) {
        const v = vuelan[i];
        v.t += dt;
        if (v.iman && v.t > 0.45) {
          // vuela sola a Eromash
          const d = Math.hypot(jug.x - v.x, jug.y - v.y) || 1;
          v.x += ((jug.x - v.x) / d) * Math.min(d, 900 * dt);
          v.y += ((jug.y - v.y) / d) * Math.min(d, 900 * dt);
          v.z = Math.max(20, v.z - 200 * dt);
          if (d < 30) {
            vuelan.splice(i, 1);
            dar(v.it);
          }
          continue;
        }
        v.x += v.vx * dt;
        v.y += v.vy * dt;
        v.vz -= 900 * dt;
        v.z = Math.max(0, v.z + v.vz * dt);
        if (v.z === 0 && v.vz < 0) {
          vuelan.splice(i, 1);
          aterrizar(v);
        }
      }
    },
    cercanos(dar) {
      if (!st || J.dentro) return;
      const c = cercana();
      if (c) dar(c.d, t("ob.juntar", [O().nombre(c.s.it)]), () => juntar(c.s), c.s.x, c.s.y - 50);
    },
    piso(c, x0, y0, x1, y1) {
      if (!st) return;
      st.suelo.forEach((s) => s.x > x0 - 60 && s.x < x1 + 60 && s.y > y0 - 60 && s.y < y1 + 60 && dibujarEnPiso(c, s));
    },
    objetos(lista, visible, c) {
      vuelan.forEach((v) => visible(v.x, v.y) && lista.push({ x: v.x, y: v.y, f: () => dibujarVuela(c, v) }));
    },
    sobreLuz(c, x0, y0, x1, y1) {
      if (!st || !st.suelo.length || !J.baseT || J.dentro) return;
      const cer = cercana();
      c.save();
      J.baseT();
      const rot = [];
      st.suelo.forEach((s) => {
        if (s.x < x0 - 100 || s.x > x1 + 100 || s.y < y0 - 60 || s.y > y1 + 400) return;
        const q = dibujarHaz(c, s, J.vista, cer && cer.s === s);
        if (q) rot.push(q);
      });
      dibujarRotulos(c, rot);
      c.restore();
    },
    luces(dar, x0, y0, x1, y1) {
      if (!st) return;
      st.suelo.forEach((s) => s.it.r >= 1 && s.x > x0 - 200 && s.x < x1 + 200 && s.y > y0 - 200 && s.y < y1 + 200 && dar({ x: s.x, y: s.y - 30, r: s.it.r >= 2 ? 200 : 110, col: O().RAREZAS[s.it.r].col, f: 0.6 }));
    },
    modDano(dano) {
      const f = window.RPG && RPG.stats().fuego;
      return f ? dano + f : dano;
    },
    alPegar(e, dano) {
      const r = window.RPG && RPG.stats().robo;
      if (r && !jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + dano * r);
    },
    alMorir,
    hud() {
      const m = document.getElementById("c_mochila");
      if (m) m.classList.toggle("con-nuevo", !!(st && st.bolsa.some((it) => it.nuevo)));
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    estado: () => st,
    dar,
    tirar,
    equipar,
    quitar,
    desarmar,
    comparar,
    puesta,
    puestas,
    lados,
    celdasBolsa,
    html,
    nivelEn,
    alMorir,
    // el arma en la mano (con el hacha lanzada no hay nada que dibujar: Eromash pelea a puño limpio)
    dibujarArma: (c, x, y, ang, s, brillo) => !!(st && st.puesto.arma && ((window.ARMAS && ARMAS.manoVacia()) || ARTE_OBJ.dibujarArma(c, st.puesto.arma, x, y, ang, s, brillo))),
    MAX_BOLSA,
  };
})();
