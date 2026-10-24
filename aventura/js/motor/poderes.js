// ---------- poderes rúnicos, botín y la gente de Eikholt (sistema PODERES) ----------
// Las cuatro runas de los altares (Kenaz, Isa, Algiz, Sowilo) se lanzan con su tecla y gastan poder rúnico, que se
// recupera solo. Los fragmentos de las piedras del susurro suben el nivel rúnico. La plata se gasta en la forja de
// Ása; las manzanas de Iðunn dan vida para siempre. También dibuja lo que cae al piso (plata y brasas de vida).
window.PODERES = (function () {
  "use strict";
  let A, J, jug;
  const M = 30;
  const t = (k, v) => I18N.t(k, v);
  const RUNAS = {
    kenaz: { coste: 35, col: "#FF8D71" },
    isa: { coste: 40, col: "#C8F2F4" },
    algiz: { coste: 45, col: "#FFD98A" },
    sowilo: { coste: 50, col: "#F5A524" },
  };
  const ORDEN = ["kenaz", "isa", "algiz", "sowilo"];
  const COSTO_ESPADA = [30, 70, 130, 220, 350],
    COSTO_COTA = [25, 60, 110, 190, 300],
    COSTO_LAMPARA = [40, 120];
  let pj = null; // lo que se guarda: plata, runas, nivel rúnico, mejoras
  let energia = 100,
    escudo = 0,
    escudoT = 0,
    sol = 0;
  const efectos = []; // lo que se ve al lanzar una runa
  const botin = []; // plata y brasas de vida en el piso

  const base = () => ({ plata: 0, runas: [], sel: 0, frag: 0, nivel: 0, espada: 0, cota: 0, lampara: 0, manzanas: 0 });
  const poder = () => 1 + (pj ? pj.nivel : 0) * 0.15;
  function aplicar() {
    jug.hpMax = 100 + pj.cota * 12 + pj.manzanas * 15 + (pj.pechera ? 40 : 0);
    jug.hp = Math.min(jug.hp, jug.hpMax);
    J.mulDano = 1 + pj.espada * 0.12;
    J.lampara = 1 + pj.lampara * 0.35 + (sol > 0 ? 1.6 : 0);
    J.poderRunico = poder();
  }

  // ---------- la gente de Eikholt que no está en la historia ----------
  Object.assign(GENTE.FICHAS, {
    // Ása, herrera: brazos fuertes, trenzas cobrizas, delantal quemado y el martillo
    asa: { nombre: "asa", alto: 1.02, ancho: 1.12, piel: "#D0A080", pielSombra: "#AE8064", pelo: "#B4542A", ropa: "#5A4A40", ropaSombra: "#463A32", delantal: "#3A2A1C", delantalSombra: "#2A1E14", pantalon: "#3A3026", botas: "#241C16", cinto: "#7A5634", trenza: true, hacha: true },
    // Svend, guardia de la Puerta del Sur: casco, capa roja y lanza
    svend: { nombre: "svend", alto: 1.06, ancho: 1.1, piel: "#C8987A", pielSombra: "#A87A5E", pelo: "#6A4A2A", barba: "#6A4A2A", ropa: "#6E6A64", ropaSombra: "#56524E", capa: "#9C2315", capaSombra: "#5E130D", pantalon: "#3A3228", botas: "#241C16", cinto: "#3A2A1A", gorro: "#6E6A6E", lanza: true },
    // Thora, sanadora: ropa clara, pañuelo verde y hierbas en el cinto
    thora: { nombre: "thora", alto: 0.98, ancho: 0.95, piel: "#E0C0A8", pielSombra: "#C0A088", pelo: "#E8E4DC", ropa: "#C8C0B0", ropaSombra: "#A8A090", falda: true, pantalon: "#7A6A50", botas: "#4A3A2A", cinto: "#4E5C32", rodete: true, gorro: "#4E5C32" },
    // Ulf, posadero del Hongo Dorado: panzón, delantal claro, barba rubia
    ulf: { nombre: "ulf", alto: 0.98, ancho: 1.3, piel: "#D8A888", pielSombra: "#B88868", pelo: "#C8A050", barba: "#C8A050", ropa: "#7A3A2A", ropaSombra: "#5E2C20", delantal: "#E0D4C0", delantalSombra: "#C0B4A0", pantalon: "#3A3026", botas: "#2A2018", cinto: "#5E4430", calvo: true },
  });
  const GENTE_CIUDAD = [];
  function ponerGente() {
    const W = A.W,
      C0 = W.CIUDAD.c,
      px = (dx, dy) => [C0[0] + dx * W.M, C0[1] + dy * W.M];
    const herr = W.NOMBRADAS.herreria;
    if (!window.INTERIORES) GENTE_CIUDAD.push({ id: "asa", x: herr ? herr.x + 150 : px(-66, 22)[0], y: herr ? herr.y + 60 : px(-66, 22)[1], mira: { vista: "S", espejo: false } });
    GENTE_CIUDAD.push({ id: "svend", x: C0[0] + 120, y: C0[1] + W.CIUDAD.ry + 60, mira: { vista: "S", espejo: false } });
    const san = W.COSAS.find((o) => o.id === "casaSanacion"),
      hon = W.COSAS.find((o) => o.id === "hongoDorado");
    // Thora, Ulf y Ása atienden adentro (ver interiores.js)
    if (!window.INTERIORES) {
      if (san) GENTE_CIUDAD.push({ id: "thora", x: san.x + 40, y: san.y + 70, mira: { vista: "S", espejo: false } });
      if (hon) GENTE_CIUDAD.push({ id: "ulf", x: hon.x - 60, y: hon.y + 70, mira: { vista: "S", espejo: false } });
    }
  }
  let rumor = 0;
  function hablarCon(n) {
    n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
    if (window.SECUNDARIAS && SECUNDARIAS.hablarCon(n)) return;
    if (n.id === "svend" && window.SECUNDARIAS && n.saludo !== SECUNDARIAS.renombre() + 1) {
      n.saludo = SECUNDARIAS.renombre() + 1;
      return A.dialogoLibre([["svend", "sc.svend_" + SECUNDARIAS.renombre()]]);
    }
    if (n.id === "asa") {
      A.dialogoLibre([["asa", "pj.asa_hola"]], forja);
    } else if (n.id === "thora") {
      jug.hp = jug.hpMax;
      A.dialogoLibre([["thora", "pj.thora_cura"], ["thora", "pj.thora_" + (rumor++ % 3)]]);
    } else {
      const k = rumor++ % 4;
      A.dialogoLibre([[n.id, "pj." + n.id + "_" + k]]);
    }
  }
  // la forja de Ása: mejoras que se pagan con plata
  function forja() {
    const rebaja = 1 - (window.SECUNDARIAS ? SECUNDARIAS.descuento() : 0);
    const linea = (clave, nivel, costos0, fn) => {
      const costos = costos0.map((c) => Math.round(c * rebaja));
      const lleno = nivel >= costos.length;
      return {
        texto: t(clave, [nivel, costos.length]),
        sub: lleno ? t("pj.forja_lleno") : t("pj.forja_costo", [costos[nivel]]) + (pj.plata < costos[nivel] ? " · " + t("pj.forja_falta") : ""),
        fn: () => {
          if (lleno || pj.plata < costos[nivel]) return A.avisar("pj.forja_no");
          pj.plata -= costos[nivel];
          fn();
          aplicar();
          A.avisar("pj.forja_listo", "#FFD98A");
          forja();
        },
      };
    };
    A.menu(`<h2>${t("pj.forja_titulo")}</h2><div class="sub">${t("pj.forja_sub", [pj.plata])}</div>`, [
      linea("pj.forja_espada", pj.espada, COSTO_ESPADA, () => pj.espada++),
      linea("pj.forja_cota", pj.cota, COSTO_COTA, () => {
        pj.cota++;
        jug.hp += 12;
      }),
      linea("pj.forja_lampara", pj.lampara, COSTO_LAMPARA, () => pj.lampara++),
      // la pechera de escamas, con las escamas de Góinn
      ...(window.GOINN && GOINN.vencido() ? [linea("pj.forja_pechera", pj.pechera ? 1 : 0, [200], () => ((pj.pechera = 1), (jug.hp += 40)))] : []),
      { texto: t("ui.cerrar"), fn: A.cerrarMenu },
    ]);
  }

  // ---------- recompensas (las usan los secretos y los grupos) ----------
  // iman: el botín vuela solo hasta Eromash apenas cae (el de los cofres: no hace falta ir a juntarlo)
  function soltar(x, y, tipo, cant, iman) {
    const n = tipo === "plata" ? Math.min(8, Math.max(1, Math.round(cant / 6))) : 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 60 + Math.random() * 120;
      botin.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, z: 0, vz: 220 + Math.random() * 120, tipo, cant: tipo === "plata" ? Math.round(cant / n) : cant, t: 0, iman: !!iman });
    }
  }
  // un cofre que se abre: crujido, un estallido dorado, el botín que vuela a Eromash y un solo cartel con lo que trajo
  function botinCofre(x, y, nombre, b, importante) {
    if (window.VIDA) VIDA.evento("cofre", x, y, { importante });
    if (window.SONIDO) {
      SONIDO.tocar("crujido", { vol: 0.7, x, y });
      SONIDO.tono("triangle", 523, 784, 0.6, 0.05, { x, y, filtro: 2600, retraso: 0.1 });
    }
    const n = window.CALIDAD && CALIDAD.nivel === "baja" ? 6 : 16;
    for (let i = 0; i < n; i++) J.fx.push({ x: x + (Math.random() - 0.5) * 40, y: y - 30, vx: (Math.random() - 0.5) * 160, vy: -200 - Math.random() * 260, t: 0.45 + Math.random() * 0.3, c: i % 3 ? "#FFD98A" : "#FFF4D0", s: 3 + Math.random() * 4, g: 0.5 });
    J.marcas.push({ tipo: "anillo", x, y: y - 10, s: 1, col: "#FFD98A", t: 0 });
    if (b.plata) soltar(x, y, "plata", b.plata, true);
    if (b.vida) soltar(x, y, "vida", 30, true);
    if (b.frag) J.retrasar(0.5, () => darFragmento());
    if (b.manzana) J.retrasar(1, () => darManzana());
    const partes = [nombre];
    if (b.plata) partes.push(t("sx.botin_plata", [b.plata]));
    if (b.vida) partes.push(t("sx.botin_vida"));
    HUD.aviso(partes.join(" · "), "#FFD98A");
    if (window.ANIMA) ANIMA.gesto("feliz");
  }
  // la plata que entra seguida se suma en un solo número (no una lluvia de «+9»)
  function darPlata(n) {
    pj.plata += n;
    const junto = J.textos.find((o) => o.plata && o.t < 0.6);
    if (junto) {
      junto.suma += n;
      junto.n = "+" + junto.suma;
      junto.t = Math.min(junto.t, 0.2);
      return;
    }
    const antes = J.textos.length;
    A.numero(jug.x, jug.y - 90, "+" + n, "#FFD98A");
    if (J.textos.length > antes) Object.assign(J.textos[J.textos.length - 1], { plata: true, suma: n });
  }
  function darFragmento() {
    pj.frag++;
    if (pj.frag % 3 === 0) {
      pj.nivel++;
      aplicar();
      if (window.ANIMA) ANIMA.gesto("feliz");
      if (window.VIDA) VIDA.evento("nivel", jug.x, jug.y);
      HUD.aviso(t("pj.nivel_runico", [pj.nivel]), "#73D5DB");
    } else HUD.aviso(t("pj.fragmento", [pj.frag % 3]), "#73D5DB");
  }
  function darManzana() {
    pj.manzanas++;
    aplicar();
    jug.hp = jug.hpMax;
    HUD.aviso(t("pj.manzana", [jug.hpMax]), "#FFD98A");
  }
  function darRuna(r) {
    if (pj.runas.includes(r)) return;
    pj.runas.push(r);
    pj.sel = pj.runas.length - 1;
    energia = 100;
    A.dialogoLibre([["eromash", "pj.runa_" + r + "_toma"]], () => HUD.aviso(t("pj.runa_aprendida", [t("pj.runa_" + r), CONTROLES.glifo("runa")]), RUNAS[r].col));
  }

  // ---------- lanzar runas ----------
  function apuntar() {
    const m = A.mouse();
    if (m.usado && !CONTROLES.mando()) return Math.atan2((m.y - (jug.y - 30)) * 1.25, m.x - jug.x);
    return Math.atan2(jug.dir[1] * 1.25, jug.dir[0]);
  }
  const vivos = () => A.enemigos.filter((e) => e.activo && !e.muerto && Math.abs(e.x - jug.x) < 900 && Math.abs(e.y - jug.y) < 700);
  function lanzar() {
    if (!pj.runas.length) return A.avisar("pj.sin_runas");
    const r = pj.runas[pj.sel],
      def = RUNAS[r];
    if (energia < def.coste) return A.avisar("pj.sin_energia");
    energia -= def.coste;
    const pr = poder();
    const golpe = (e, dano) => {
      A.numero(e.x, e.y - 60, Math.round(dano));
      A.chispa(e.x, e.y - 30);
      A.CB.golpear(J, e, dano, jug.x, jug.y, 0.6);
    };
    if (r === "kenaz") {
      const dir = apuntar(),
        radio = 6.5 * M,
        ang = 0.62;
      const zona = { forma: "abanico", x: jug.x, y: jug.y, radio, ang, dir };
      vivos().forEach((e) => {
        if (A.CB.contiene(zona, e.x, e.y)) {
          golpe(e, 30 * pr);
          e.quema = 4;
        }
      });
      efectos.push({ tipo: "fuego", x: jug.x, y: jug.y, dir, radio, ang, t: 0, dur: 0.6 });
      avisarSistemas("kenaz", zona);
      J.sacudir(0.15);
    } else if (r === "isa") {
      const radio = 5 * M,
        zona = { forma: "circulo", x: jug.x, y: jug.y, radio };
      vivos().forEach((e) => {
        if (A.CB.contiene(zona, e.x, e.y)) {
          golpe(e, 16 * pr);
          e.helado = 2.8;
        }
      });
      efectos.push({ tipo: "hielo", x: jug.x, y: jug.y, radio, t: 0, dur: 0.8 });
      avisarSistemas("isa", zona);
    } else if (r === "algiz") {
      escudo = 40 + pj.nivel * 10;
      escudoT = 7;
      efectos.push({ tipo: "escudo", t: 0, dur: 0.5 });
    } else if (r === "sowilo") {
      const radio = 8.5 * M,
        zona = { forma: "circulo", x: jug.x, y: jug.y, radio };
      vivos().forEach((e) => {
        if (A.CB.contiene(zona, e.x, e.y)) {
          golpe(e, (e.d.muerto ? 3 : 1) * 24 * pr);
          e.helado = Math.max(e.helado, 1);
        }
      });
      sol = 20;
      efectos.push({ tipo: "sol", x: jug.x, y: jug.y, radio, t: 0, dur: 0.9 });
      avisarSistemas("sowilo", zona);
      aplicar();
    }
  }
  const avisarSistemas = (r, zona) => (window.SISTEMAS || []).forEach((s) => s.alRuna && s.alRuna(r, zona));

  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      pj = base();
      ponerGente();
      J.alHerir = (d) => {
        if (escudo <= 0) return d;
        const q = Math.min(escudo, d);
        escudo -= q;
        if (escudo <= 0) escudoT = 0;
        return d - q;
      };
    },
    alEmpezar(extra) {
      extra.pj = Object.assign(base(), extra.pj || {});
      pj = extra.pj;
      energia = 100;
      escudo = 0;
      sol = 0;
      botin.length = 0;
      aplicar();
      jug.hp = Math.min(jug.hpMax, Math.max(jug.hp, 1));
    },
    actualizar(dt) {
      if (!pj) return;
      energia = Math.min(100, energia + 6 * dt);
      escudoT = Math.max(0, escudoT - dt);
      if (escudoT <= 0) escudo = 0;
      if (sol > 0) {
        sol -= dt;
        if (sol <= 0) aplicar();
      }
      if (J.modo === "juego" && !jug.muerto && jug.interactuando <= 0) {
        if (CONTROLES.recien("runa")) lanzar();
        if (CONTROLES.recien("cambiarRuna") && pj.runas.length > 1) pj.sel = (pj.sel + 1) % pj.runas.length;
      }
      efectos.forEach((f) => (f.t += dt));
      for (let i = efectos.length - 1; i >= 0; i--) if (efectos[i].t > efectos[i].dur) efectos.splice(i, 1);
      // el botín salta, cae y se acerca a Eromash cuando pasa cerca
      for (let i = botin.length - 1; i >= 0; i--) {
        const b = botin[i];
        b.t += dt;
        if (b.z > 0 || b.vz > 0) {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vz -= 900 * dt;
          b.z = Math.max(0, b.z + b.vz * dt);
          if (b.z === 0) b.vz = 0;
        }
        const d = Math.hypot(jug.x - b.x, jug.y - b.y);
        const listo = b.t > (b.iman ? 0.32 : 0.5);
        if (listo && (d < 140 || (b.iman && d < 2500)) && !jug.muerto) {
          const v = b.iman ? 900 : 520;
          b.x += ((jug.x - b.x) / d) * v * dt;
          b.y += ((jug.y - b.y) / d) * v * dt;
        }
        if (listo && d < 26) {
          if (b.tipo === "plata") darPlata(b.cant);
          else jug.hp = Math.min(jug.hpMax, jug.hp + b.cant);
          if (window.SONIDO) SONIDO.tocar(b.tipo === "plata" ? "plata" : "tela", { vol: b.tipo === "plata" ? 0.45 : 0.4, var: 0.12 });
          botin.splice(i, 1);
        } else if (b.t > 90) botin.splice(i, 1);
      }
    },
    cercanos(dar) {
      for (const n of GENTE_CIUDAD) {
        const d = Math.hypot(n.x - jug.x, n.y - jug.y);
        if (d < 110) dar(d, t("av.accion_hablar") + " · " + t("av.nombre_" + n.id), () => hablarCon(n));
      }
    },
    cuerpos(f) {
      for (const n of GENTE_CIUDAD) f(n.x, n.y, 36);
    },
    objetos(lista, visible, c) {
      for (const n of GENTE_CIUDAD) {
        if (!visible(n.x, n.y)) continue;
        if (Math.hypot(jug.x - n.x, jug.y - n.y) < 260) n.mira = VIKINGO.vista(jug.x - n.x, jug.y - n.y, n.mira);
        lista.push({ y: n.y, f: () => GENTE.dibujar(c, n.id, n.x, n.y, J.t, { vista: n.mira.vista, espejo: n.mira.espejo }) });
      }
      for (const b of botin) {
        if (!visible(b.x, b.y)) continue;
        lista.push({ y: b.y, f: () => dibujarBotin(c, b) });
      }
      for (const f of efectos) lista.push({ y: (f.y || jug.y) + 1, f: () => dibujarEfecto(c, f) });
      if (escudo > 0) lista.push({ y: jug.y + 2, f: () => dibujarEscudo(c) });
    },
    luces(dar) {
      for (const f of efectos) {
        if (f.tipo === "fuego") dar({ x: f.x + Math.cos(f.dir) * f.radio * 0.6, y: f.y + (Math.sin(f.dir) * f.radio * 0.6) / 1.25, r: 340, col: "#FF8D71", f: 1 - f.t / f.dur });
        if (f.tipo === "sol") dar({ x: f.x, y: f.y, r: 900, col: "#F5A524", f: 1 - f.t / f.dur });
        if (f.tipo === "hielo") dar({ x: f.x, y: f.y, r: 260, col: "#C8F2F4", f: 1 - f.t / f.dur });
      }
      if (sol > 0) dar({ x: jug.x, y: jug.y - 30, r: 620, col: "#F5A524", f: Math.min(1, sol / 3) });
    },
    diario() {
      if (!pj) return "";
      const runas = ORDEN.map((r) => `<span style="color:${pj.runas.includes(r) ? RUNAS[r].col : "#4A4442"}">${t("pj.runa_" + r)}</span>`).join(" · ");
      return `<div class="diario-resumen"><p><b>${t("pj.diario_runas")}</b> ${runas}</p><p><b>${t("pj.diario_poder")}</b> ${t("pj.diario_poder_txt", [pj.nivel, pj.frag % 3])} · <b>${t("pj.plata")}</b> ${pj.plata} · <b>${t("pj.diario_vida")}</b> ${jug.hpMax}</p></div>`;
    },
  };

  // ---------- dibujo ----------
  function dibujarBotin(c, b) {
    const y = b.y - b.z - 6 - Math.sin(b.t * 4) * 2;
    DIB.sombra(c, b.x, b.y, 6, 2, 0.35);
    if (b.tipo === "plata") {
      // un rombo de plata con su brillo, como las monedas de la arena
      DIB.P(c, [b.x, y - 7, b.x + 6, y, b.x, y + 7, b.x - 6, y], "#C8CCD2");
      DIB.P(c, [b.x, y - 7, b.x + 6, y, b.x, y], "#F2F4F8");
    } else {
      DIB.halo(c, b.x, y, 26, "#C8402D", 0.8);
      DIB.E(c, b.x, y, 7, 7, "#C8402D");
      DIB.E(c, b.x + 2, y - 2, 3, 3, "#FF8D71");
    }
  }
  function dibujarEfecto(c, f) {
    const u = f.t / f.dur;
    if (f.tipo === "fuego") {
      // lenguas de fuego que salen en abanico
      for (let k = 0; k < 18; k++) {
        const a = f.dir - f.ang + (2 * f.ang * ((k * 7) % 18)) / 17,
          r = f.radio * Math.min(1, u * 1.6) * (0.5 + ((k * 13) % 10) / 20);
        const x = f.x + Math.cos(a) * r,
          y = f.y + (Math.sin(a) * r) / 1.25 - 30;
        DIB.alfa(c, 1 - u, () => DIB.P(c, [x - 10, y + 8, x, y - 22 - (k % 3) * 8, x + 10, y + 8], k % 3 === 0 ? "#FFD98A" : k % 3 === 1 ? "#FF8D71" : "#C8402D"));
      }
    } else if (f.tipo === "hielo") {
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2,
          r = f.radio * Math.min(1, u * 2);
        const x = f.x + Math.cos(a) * r,
          y = f.y + (Math.sin(a) * r) / 1.25;
        DIB.alfa(c, 1 - u, () => DIB.P(c, [x - 5, y, x, y - 26 - (k % 2) * 10, x + 5, y], k % 2 ? "#C8F2F4" : "#73D5DB"));
      }
      DIB.alfa(c, (1 - u) * 0.5, () => {
        c.strokeStyle = "#C8F2F4";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(f.x, f.y, f.radio * u, (f.radio * u) / 1.25, 0, 0, Math.PI * 2);
        c.stroke();
      });
    } else if (f.tipo === "sol") {
      DIB.alfa(c, (1 - u) * 0.8, () => {
        c.strokeStyle = "#FFD98A";
        c.lineWidth = 6;
        c.beginPath();
        c.ellipse(f.x, f.y, f.radio * u, (f.radio * u) / 1.25, 0, 0, Math.PI * 2);
        c.stroke();
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          DIB.L(c, f.x + Math.cos(a) * 30, f.y - 60 + Math.sin(a) * 30, f.x + Math.cos(a) * (60 + u * 120), f.y - 60 + Math.sin(a) * (60 + u * 120), "#F5A524", 4);
        }
      });
      FUTHARK.dibujar(c, "sowilo", f.x, f.y - 40 - u * 40, 40, "#FFF4D0", 5);
    } else if (f.tipo === "escudo") {
      DIB.alfa(c, 1 - u, () => FUTHARK.dibujar(c, "algiz", jug.x, jug.y - 60 - u * 40, 46, "#FFD98A", 5));
    }
  }
  function dibujarEscudo(c) {
    const late = 0.5 + Math.sin(J.t * 5) * 0.15;
    DIB.alfa(c, late * Math.min(1, escudoT), () => {
      c.strokeStyle = "#FFD98A";
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(jug.x, jug.y - 40, 44, 56, 0, 0, Math.PI * 2);
      c.stroke();
      FUTHARK.dibujar(c, "algiz", jug.x, jug.y - 92, 16, "#FFD98A", 2.5);
    });
  }

  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  // lo que muestran la barra de acciones del HUD y la mochila
  function estado() {
    if (!pj) return null;
    const r = pj.runas[pj.sel];
    return { runa: r || null, col: r ? RUNAS[r].col : "#3A3634", coste: r ? RUNAS[r].coste : 0, energia, escudo: escudo > 0, runas: pj.runas.slice(), sel: pj.sel, plata: pj.plata, frag: pj.frag, nivel: pj.nivel, espada: pj.espada, cota: pj.cota, lampara: pj.lampara, manzanas: pj.manzanas, pechera: !!pj.pechera, poder: poder() };
  }
  function elegirRuna(r) {
    const i = pj ? pj.runas.indexOf(r) : -1;
    if (i >= 0) pj.sel = i;
    return i >= 0;
  }
  return { estado, elegirRuna, hablarCon, soltar, botinCofre, darPlata, darFragmento, darManzana, darRuna, tiene: (r) => !!(pj && pj.runas.includes(r)), RUNAS, ORDEN, pj: () => pj };
})();
