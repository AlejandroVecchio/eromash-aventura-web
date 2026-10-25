// ---------- las némesis: las criaturas que vencieron a Eromash (sistema NEMESIS) ----------
// Como el sistema Némesis del Shadow of Mordor: la criatura de un grupo del bosque que mata a Eromash no se olvida.
// Se gana un nombre (un nombre nórdico y un apodo: «Ulfr Rompeyelmos»), sube de rango, se hace más fuerte, saca un rasgo
// (piel de hierro, rabiosa, veloz o sanguijuela) y lleva una corona roja con su nombre sobre la cabeza. Si vuelve a
// matarlo, sube otra vez (hasta el rango 5). Al acercarse avisa que lo reconoce. Vencerla paga mucho (plata,
// experiencia y una pieza rara o mejor) y queda en el diario entre las vengadas. A lo sumo tres a la vez: si ya hay
// tres, la nueva reemplaza a la de rango más bajo. Solo las criaturas de los grupos de HORDAS (no las de la historia
// ni los únicos con nombre). Estado en E.extra.nemesis = { vivas: [{ id, g, m, tipo, nombre, ep, rango, rasgo, x, y,
// muertes }], vengadas: [{ nombre, ep, rango, tipo }], cuenta }. Textos `nm.`.
window.NEMESIS = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const NOMBRES = ["Grimr", "Hrafn", "Skuli", "Ulfr", "Bjarki", "Kolr", "Hjalti", "Svartr", "Ormr", "Geirr", "Starkad", "Hogni"];
  const APODOS = 12; // nm.ep_0 … nm.ep_11
  const RASGOS = ["piel", "rabiosa", "veloz", "sanguijuela"];
  const TOPE = 3,
    RANGO_MAX = 5,
    RECONOCE = 900; // a esta distancia avisa que lo reconoce
  const base = () => ({ vivas: [], vengadas: [], cuenta: 0 });
  let st = base();
  let avisadas = new Set();

  const grupos = () => (window.HORDAS ? HORDAS.grupos : []);
  const criaturaDe = (n) => {
    const g = grupos()[n.g];
    return g ? g.miembros[n.m] : null;
  };
  const nombreDe = (n) => n.nombre + " " + t("nm.ep_" + n.ep);
  // lo que se suma a la criatura por ser némesis (sobre su ficha de siempre, sin tocar la de las otras)
  function aplicar(e, n) {
    if (!e) return;
    e.dBase = e.dBase || e.d;
    const b = e.dBase,
      r = n.rango;
    e.d = Object.assign({}, b, {
      vida: Math.round(b.vida * (1.6 + 0.3 * r)),
      dano: Math.round(b.dano * (1.15 + 0.08 * r) * (n.rasgo === "rabiosa" ? 1.3 : 1)),
      vel: b.vel * (n.rasgo === "veloz" ? 1.25 : 1),
      plata: (b.plata || 3) * 4,
    });
    e.nemesis = n.id;
    if (!e.muerto) e.vida = e.d.vida;
  }
  function quitar(e) {
    if (!e) return;
    if (e.dBase) e.d = e.dBase;
    e.dBase = null;
    e.nemesis = null;
    if (!e.muerto) e.vida = Math.min(e.vida, e.d.vida);
  }

  // ---------- nacer y crecer ----------
  function nacer(e) {
    const g = e.hordaGrupo;
    if (!g || (g.unico && e.lider)) return null;
    const ya = st.vivas.find((n) => n.id === e.nemesis);
    if (ya) {
      // la misma vuelve a ganar: sube de rango
      ya.rango = Math.min(RANGO_MAX, ya.rango + 1);
      ya.muertes++;
      aplicar(e, ya);
      HUD.aviso(t("nm.sube", [nombreDe(ya), ya.rango]), "#C8402D", t("nm.titulo"));
      return ya;
    }
    if (st.vivas.length >= TOPE) {
      // reemplaza a la de rango más bajo
      const menor = st.vivas.slice().sort((a, b) => a.rango - b.rango)[0];
      quitar(criaturaDe(menor));
      st.vivas.splice(st.vivas.indexOf(menor), 1);
    }
    const k = st.cuenta++;
    const sem = (grupos().indexOf(g) * 31 + g.miembros.indexOf(e) * 7 + k * 13) >>> 0;
    const n = {
      id: "n" + k,
      g: grupos().indexOf(g),
      m: g.miembros.indexOf(e),
      tipo: e.tipo,
      nombre: NOMBRES[sem % NOMBRES.length],
      ep: (sem * 5 + 3) % APODOS,
      rango: 1,
      rasgo: RASGOS[(sem * 3 + k) % RASGOS.length],
      x: g.centro[0],
      y: g.centro[1],
      muertes: 1,
    };
    st.vivas.push(n);
    aplicar(e, n);
    HUD.aviso(t("nm.nace", [nombreDe(n), t("nm.r_" + n.rasgo)]), "#C8402D", t("nm.titulo"));
    return n;
  }
  function vencer(e) {
    const n = st.vivas.find((q) => q.id === e.nemesis);
    if (!n) return;
    st.vivas.splice(st.vivas.indexOf(n), 1);
    st.vengadas.push({ nombre: n.nombre, ep: n.ep, rango: n.rango, tipo: n.tipo });
    quitar(e);
    const plata = 60 + 40 * n.rango;
    PODERES.soltar(e.x, e.y, "plata", plata);
    if (window.RPG) RPG.dar(150 + 80 * n.rango, e.x, e.y);
    if (window.BOTIN && window.OBJETOS) {
      const it = OBJETOS.generar({ n: window.RPG ? RPG.nivel() : 1, min: n.rango >= 4 ? 3 : 2, hallazgo: 2 });
      J.retrasar(0.6, () => BOTIN.tirar(e.x, e.y - 20, it, true));
    }
    HUD.aviso(t("nm.vengada_d", [nombreDe(n), plata]), "lugar", t("nm.vengada"));
    if (window.ANIMA) ANIMA.gesto("feliz");
    if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.55, tono: 0.85 });
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      // quién le pega a Eromash: J.herir recibe el lugar de quien pega (combate.js pasa e.x, e.y)
      const herir = J.herir;
      J.herir = (dano, ox, oy, tipo) => {
        const e = A.enemigos.find((q) => q.activo && !q.muerto && q.x === ox && q.y === oy);
        const hp0 = jug.hp,
          vivo = !jug.muerto;
        const r = herir(dano, ox, oy, tipo);
        // ese golpe lo mató: la que pegó se vuelve némesis
        if (e && vivo && jug.muerto && !e.muerto && e.activo) nacer(e);
        // la sanguijuela se cura con lo que saca
        if (e && e.nemesis && jug.hp < hp0) {
          const n = st.vivas.find((q) => q.id === e.nemesis);
          if (n && n.rasgo === "sanguijuela") e.vida = Math.min(e.d.vida, e.vida + (hp0 - jug.hp) * 2);
        }
        return r;
      };
    },
    alEmpezar(extra) {
      extra.nemesis = Object.assign(base(), extra.nemesis || {});
      st = extra.nemesis;
      // las de una partida anterior vuelven a su criatura (los grupos salen siempre iguales)
      grupos().forEach((g) => g.miembros.forEach((e) => e.nemesis && quitar(e)));
      st.vivas.forEach((n) => aplicar(criaturaDe(n), n));
      avisadas = new Set();
    },
    actualizar() {
      if (jug.muerto) return;
      // al acercarse, lo reconoce (una vez por vez que se acerca)
      for (const n of st.vivas) {
        const e = criaturaDe(n);
        if (!e || e.muerto || !e.activo) continue;
        const d = Math.hypot(e.x - jug.x, e.y - jug.y);
        if (d < RECONOCE && !avisadas.has(n.id)) {
          avisadas.add(n.id);
          HUD.aviso(t("nm.reconoce_" + (n.muertes > 1 ? 2 : 1), [nombreDe(n)]), "#C8402D");
          if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.6, tono: 0.8, x: e.x, y: e.y });
          if (window.ANIMA) ANIMA.gesto("susto");
        } else if (d > RECONOCE * 1.6) avisadas.delete(n.id);
      }
    },
    alMorir(e) {
      if (e.nemesis) vencer(e);
    },
    modDano(dano, e) {
      if (!e || !e.nemesis) return dano;
      const n = st.vivas.find((q) => q.id === e.nemesis);
      return n && n.rasgo === "piel" ? dano * 0.65 : dano;
    },
    sobreLuz(c) {
      // la corona roja y el nombre sobre la cabeza
      for (const n of st.vivas) {
        const e = criaturaDe(n);
        if (!e || e.muerto || !e.activo) continue;
        if (Math.abs(e.x - jug.x) > 1400 || Math.abs(e.y - jug.y) > 900) continue;
        // justo arriba de la barra de vida (y del nombre del líder, si lo es)
        const y = e.y - e.d.barra - (e.lider ? 34 : 6);
        DIB.P(c, [e.x - 10, y, e.x - 10, y - 10, e.x - 5, y - 5, e.x, y - 14, e.x + 5, y - 5, e.x + 10, y - 10, e.x + 10, y], "#C8402D");
        DIB.P(c, [e.x, y - 14, e.x + 5, y - 5, e.x + 10, y - 10, e.x + 10, y, e.x, y], "#FF8D71");
        c.font = '800 13px "Eromash Text", system-ui, sans-serif';
        c.textAlign = "center";
        c.lineWidth = 4;
        c.strokeStyle = "#0A0707";
        const txt = nombreDe(n) + " " + "★".repeat(n.rango);
        c.strokeText(txt, e.x, y - 19);
        c.fillStyle = "#FF8D71";
        c.fillText(txt, e.x, y - 19);
      }
    },
    marcasMapa() {
      return st.vivas.map((n) => ({ tipo: "nemesis", x: n.x, y: n.y, op: { nombre: nombreDe(n) + " · " + t("nm.rango", [n.rango]) } }));
    },
    diario() {
      if (!st.vivas.length && !st.vengadas.length) return "";
      const vivas = st.vivas.map((n) => `<p><b>${nombreDe(n)}</b> · ${t("cr." + n.tipo)} · ${t("nm.rango", [n.rango])} · ${t("nm.r_" + n.rasgo)} · ${t("nm.te_mato", [n.muertes])}</p>`).join("");
      const ven = st.vengadas.length ? `<p><b>${t("nm.vengadas")}</b> ${st.vengadas.map((n) => n.nombre + " " + t("nm.ep_" + n.ep) + " (" + n.rango + ")").join(" · ")}</p>` : "";
      return `<div class="diario-resumen"><p><b>${t("nm.titulo")}</b></p>${vivas}${ven}</div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, nacer, vencer, criaturaDe, nombreDe, RASGOS, TOPE, RANGO_MAX };
})();
