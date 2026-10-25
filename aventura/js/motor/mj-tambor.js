// ---------- minijuego: el tambor del skald (MINIJ «tambor») ----------
// Pregunta y respuesta con Sølve: el skald toca un compás en su tambor (golpes al centro, graves, y al borde, secos) y
// Eromash lo repite en el compás siguiente, con el mismo tiempo. Una aguja recorre el anillo de runas del compás; cada
// golpe de Sølve deja su marca en el anillo. Centro: la tecla de usar, ▼ o tocar el parche; borde: atacar, ◀ ▶ o tocar
// el aro. Cada compás errado le baja el ánimo a la sala; sin ánimo, se termina. Variantes: base, rápido, de oído (las
// marcas no se ven, solo se oyen), compás largo (dos compases seguidos) y la fiesta (más rondas, la sala más exigente).
// Devuelve { gano, precision, rondas }. Lo pide el Hongo Dorado de noche (hongo.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CX = 860, // el centro del tambor
    CY = 500,
    R = 190, // el parche
    RA = 270; // el anillo del compás
  const VEN = 0.15, // el margen de un golpe (s)
    JUSTO = 0.065;
  const RUNAS_C = ["ansuz", "kenaz", "raidho", "sowilo", "tiwaz", "laguz", "othala", "fehu"];

  const dur = (S) => 60 / (S.v.bpm || 90) / 2; // un paso = una corchea
  const pasos = (S) => S.v.pasos || 8;
  // el compás de Sølve: siempre arranca con un golpe al centro en el primer paso; ninguno en el mismo paso
  function patron(S) {
    const n = Math.min(pasos(S) - 1, (S.v.notas || [3, 4, 5, 5, 6, 6])[S.ronda] || 5),
      libres = Array.from({ length: pasos(S) - 1 }, (_, k) => k + 1).sort(() => S.rnd() - 0.5);
    const l = [{ paso: 0, tipo: 0 }].concat(libres.slice(0, n - 1).map((p) => ({ paso: p, tipo: S.rnd() < 0.45 ? 1 : 0 })));
    return l.sort((a, b) => a.paso - b.paso).map((q) => Object.assign(q, { oido: false, hecho: 0 }));
  }
  function ronda(S) {
    S.notas = patron(S);
    S.fase = "oye";
    S.t0 = S.t + dur(S) * 2; // un respiro antes del compás
    S.errores = 0;
  }
  function golpe(S, tipo, x, y) {
    const f = tipo ? 520 : 110;
    if (window.SONIDO) SONIDO.tono(tipo ? "square" : "triangle", f, tipo ? f * 0.9 : f * 0.6, tipo ? 0.07 : 0.22, tipo ? 0.06 : 0.16, {});
    S.vibra = tipo ? 0.12 : 0.22;
    S.ondas.push({ x, y, v: 0.4, tipo });
  }

  MINIJ.registrar("tambor", {
    variantes: {
      base: { bpm: 88, rondas: 4, animo: 3 },
      rapido: { bpm: 118, rondas: 4, animo: 3 },
      oido: { bpm: 88, rondas: 4, animo: 3, oculto: true },
      largo: { bpm: 96, rondas: 3, animo: 3, pasos: 16, notas: [6, 7, 8] },
      fiesta: { bpm: 104, rondas: 6, animo: 2 },
    },
    pie: "mn.tambor_pie",
    armar(S) {
      S.ronda = 0;
      S.animo = S.v.animo || 3;
      S.bien = 0;
      S.justos = 0;
      S.total = 0;
      S.ondas = [];
      S.vibra = 0;
      S.gano = 0;
      ronda(S);
    },
    paso(S, dt) {
      if (CONTROLES.recien("interactuar") || CONTROLES.recien("abajo")) this.tocar(S, 0);
      if (CONTROLES.recien("atacar") || CONTROLES.recien("izquierda") || CONTROLES.recien("derecha")) this.tocar(S, 1);
      S.vibra = Math.max(0, S.vibra - dt);
      S.ondas.forEach((o) => (o.v -= dt));
      S.ondas = S.ondas.filter((o) => o.v > 0);
      if (S.gano) {
        if ((S.gano -= dt) <= 0) MINIJ.terminar({ gano: true, precision: S.precision, rondas: S.bien });
        return;
      }
      const d = dur(S),
        largo = pasos(S) * d,
        rel = S.t - S.t0;
      // el pulso: un tic cada negra mientras corre la aguja
      const tic = Math.floor(rel / (d * 2));
      if (rel >= 0 && tic !== S.tic) {
        S.tic = tic;
        if (window.SONIDO) SONIDO.tono("sine", 880, 880, 0.03, 0.025, {});
      }
      if (S.fase === "oye") {
        S.notas.forEach((q) => {
          if (!q.oido && rel >= q.paso * d) (q.oido = true), golpe(S, q.tipo, CX + (q.tipo ? R * 0.9 : 0), CY);
        });
        if (rel >= largo) (S.fase = "toca"), (S.t0 += largo);
      } else if (S.fase === "toca" && rel >= largo + VEN) {
        // lo que faltó tocar cuenta como error
        S.notas.forEach((q) => !q.hecho && ((q.hecho = -1), S.errores++));
        S.total += S.notas.length;
        if (!S.errores) (S.bien++, (S.luz.ronda = 0.6)), golpe(S, 0, CX, CY);
        else (S.animo--, (S.luz.mal = 0.6));
        S.ronda++;
        if (S.animo <= 0) return MINIJ.terminar({ gano: false, precision: 0, rondas: S.bien });
        if (S.ronda >= (S.v.rondas || 4)) {
          S.precision = S.total ? S.justos / S.total : 0;
          S.gano = 1;
          S.luz.todo = 1;
          if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.4 });
          return;
        }
        ronda(S);
      }
    },
    // 0 = centro, 1 = borde
    tocar(S, i) {
      if (S.gano || (i !== 0 && i !== 1)) return;
      golpe(S, i, CX + (i ? -R * 0.9 : 0), CY + (i ? 0 : 10));
      if (S.fase !== "toca") return;
      const d = dur(S),
        rel = S.t - S.t0;
      const q = S.notas.filter((n) => !n.hecho).sort((a, b) => Math.abs(a.paso * d - rel) - Math.abs(b.paso * d - rel))[0];
      if (!q || Math.abs(q.paso * d - rel) > VEN) return void S.errores++;
      if (q.tipo !== i) return (q.hecho = -1), void S.errores++;
      const justo = Math.abs(q.paso * d - rel) <= JUSTO;
      q.hecho = justo ? 2 : 1;
      S.justos += justo ? 1 : 0.6;
    },
    hit(S, x, y) {
      const r = Math.hypot(x - CX, (y - CY) * 1.6);
      return r < R * 0.7 ? 0 : r < R * 1.25 ? 1 : null;
    },
    res: (S) => t("mn.tambor_res", [S.bien, S.v.rondas || 4, Math.round((S.precision || 0) * 100)]),
    dibujar(S, D) {
      const c = D.c,
        d = dur(S),
        n = pasos(S),
        rel = S.t - S.t0,
        f = Math.max(0, Math.min(1, rel / (n * d)));
      // Sølve y Eromash: quién toca ahora
      const oye = S.fase === "oye";
      D.texto(t(oye ? "mn.tambor_solve" : "mn.tambor_vos"), CX, 150, 24, oye ? "#FFD98A" : "#73D5DB", "center", 700);
      // el anillo del compás: una runa por paso, la aguja y las marcas
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (k / n) * Math.PI * 2,
          x = CX + Math.cos(a) * RA,
          y = CY + Math.sin(a) * RA * 0.62,
          q = S.notas.find((m) => m.paso === k),
          ver = q && (!S.v.oculto || (oye && q.oido) || q.hecho);
        D.rombo(x, y, 16, k % 2 ? "#2A2220" : "#3A3634");
        if (ver) {
          const col = q.hecho === 2 ? "#73D5DB" : q.hecho === 1 ? "#FFD98A" : q.hecho < 0 ? "#C8402D" : oye && !q.oido ? "#433E3B" : q.tipo ? "#FF8D71" : "#FFD98A";
          D.rombo(x, y, q.tipo ? 11 : 14, col);
          if (!q.tipo) D.rombo(x, y, 6, "#1A1412");
        }
        D.runa(RUNAS_C[k % RUNAS_C.length], CX + Math.cos(a) * (RA + 40), CY + Math.sin(a) * (RA + 40) * 0.62, 10, "#5A5450", 0.24);
      }
      if (rel >= 0) {
        const a = -Math.PI / 2 + f * Math.PI * 2;
        c.save();
        c.strokeStyle = oye ? "#FFD98A" : "#73D5DB";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(CX + Math.cos(a) * (RA - 30), CY + Math.sin(a) * (RA - 30) * 0.62);
        c.lineTo(CX + Math.cos(a) * (RA + 22), CY + Math.sin(a) * (RA + 22) * 0.62);
        c.stroke();
        c.restore();
      }
      // el tambor: aro de madera, parche de cuero y la runa pintada; se aplasta un poco con cada golpe
      const v = 1 - S.vibra * 0.15,
        cuerpo = [],
        parche = [];
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        cuerpo.push(CX + Math.cos(a) * (R + 22), CY + 26 + Math.sin(a) * (R + 22) * 0.55);
        parche.push(CX + Math.cos(a) * R, CY + Math.sin(a) * R * 0.55 * v);
      }
      D.P(cuerpo, "#5E130D");
      D.P(parche, "#E0B2B2");
      DIB.alfa(c, 0.35, () => D.P(parche.map((p, k) => (k % 2 ? CY + (p - CY) * 0.7 : CX + (p - CX) * 0.7)), "#F2ECEC"));
      D.runa("ansuz", CX, CY, 46, S.luz.mal > 0 ? "#C8402D" : "#9C2315", 0.2);
      S.ondas.forEach((o) => DIB.alfa(c, o.v * 1.5, () => D.rombo(o.x, o.y, 30 + (0.4 - o.v) * 160, o.tipo ? "#FF8D71" : "#FFD98A")));
      if (S.luz.ronda > 0) D.halo(CX, CY, 240, "#73D5DB", S.luz.ronda * 0.5);
      if (S.luz.todo > 0) D.halo(CX, CY, 320, "#FFD98A", S.luz.todo * 0.4);
      // el ánimo de la sala (cuernos) y las rondas
      D.texto(t("mn.tambor_sala"), 300, 250, 16, "#E0B2B2", "center", 500);
      for (let k = 0; k < (S.v.animo || 3); k++) D.piedra(250 + k * 38, 270, 30, 40, k < S.animo ? "#A8622E" : "#2A2220", k < S.animo ? "#5E130D" : "#1A1412");
      D.texto(t("mn.tambor_ronda", [Math.min(S.ronda + 1, S.v.rondas || 4), S.v.rondas || 4]), 1380, 92, 22, "#F2ECEC", "right");
      D.texto(t("mn.tambor_leyenda"), 300, 380, 15, "#E0B2B2", "center", 400);
      D.rombo(250, 410, 12, "#FFD98A");
      D.rombo(250, 410, 5, "#1A1412");
      D.texto(t("mn.tambor_centro"), 270, 416, 15, "#F2ECEC", "left", 500);
      D.rombo(250, 446, 10, "#FF8D71");
      D.texto(t("mn.tambor_borde"), 270, 452, 15, "#F2ECEC", "left", 500);
    },
  });
})();
