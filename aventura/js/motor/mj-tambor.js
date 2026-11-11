// ---------- minijuego: el tambor del skald (MINIJ «tambor») ----------
// Pregunta y respuesta con Sølve: el skald toca un compás en su tambor y Eromash lo repite en el compás siguiente, con
// el mismo tiempo. Una aguja recorre el anillo de runas del compás; cada golpe de Sølve deja su marca en el anillo con
// su tecla (A S D W Q E R F, `MINIJ.RITMO`; cada tecla suena distinto) y, en el turno de Eromash, un aro que se cierra
// anuncia cuándo apretarla. Con el puntero, tocar el tambor golpea con la tecla que sea. Arranca con una cuenta atrás.
// Cada compás errado le baja el ánimo a la sala; sin ánimo, se termina. Variantes (la dificultad sube con las letras y
// un poco con el tempo): base, rápido, de oído (las letras se ven solo cuando Sølve las toca: hay que recordarlas),
// compás largo (dos compases seguidos) y la fiesta (más rondas, todas las letras, la sala más exigente).
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
    const l = [{ paso: 0 }].concat(libres.slice(0, n - 1).map((p) => ({ paso: p })));
    return l.sort((a, b) => a.paso - b.paso).map((q) => Object.assign(q, { oido: false, hecho: 0, k: MINIJ.RITMO[Math.floor(S.rnd() * (S.v.letras || 3))] }));
  }
  function ronda(S) {
    S.notas = patron(S);
    S.fase = "oye";
    S.t0 = S.t + dur(S) * 2; // un respiro antes del compás
    S.errores = 0;
  }
  // dónde cae el paso k en el anillo
  const enAnillo = (S, k, r = RA) => {
    const a = -Math.PI / 2 + (k / pasos(S)) * Math.PI * 2;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.62];
  };
  // cada tecla suena a su altura: las graves (A S D) al centro del parche, las agudas más hacia el borde
  const TONOS = [110, 131, 147, 175, 196, 233, 262, 294];
  function golpe(S, k, x, y) {
    const n = Math.max(0, MINIJ.RITMO.indexOf(k)),
      f = TONOS[n],
      seco = n >= 4;
    if (window.SONIDO) SONIDO.tono(seco ? "square" : "triangle", f * (seco ? 2 : 1), f * (seco ? 1.8 : 0.6), seco ? 0.08 : 0.22, seco ? 0.06 : 0.16, {});
    S.vibra = seco ? 0.12 : 0.22;
    S.ondas.push({ x, y, v: 0.4, seco });
  }
  // un golpe de Eromash: k es la tecla apretada (null con el puntero, que vale para cualquiera)
  function tecla(S, k) {
    if (S.gano) return;
    const d = dur(S),
      rel = S.t - S.t0,
      q = S.notas.filter((n) => !n.hecho).sort((a, b) => Math.abs(a.paso * d - rel) - Math.abs(b.paso * d - rel))[0],
      cerca = S.fase === "toca" && q && Math.abs(q.paso * d - rel) <= VEN;
    golpe(S, k || (cerca ? q.k : MINIJ.RITMO[0]), CX, CY + 10);
    if (S.fase !== "toca") return;
    if (!cerca) return void S.errores++;
    if (k && q.k !== k) return (q.hecho = -1), void S.errores++;
    const justo = Math.abs(q.paso * d - rel) <= JUSTO;
    q.hecho = justo ? 2 : 1;
    S.justos += justo ? 1 : 0.6;
  }

  MINIJ.registrar("tambor", {
    // la dificultad sube con `letras` (cuántas de A S D W Q E R F) y un poco con el tempo
    variantes: {
      base: { bpm: 76, rondas: 4, animo: 3, letras: 3 },
      rapido: { bpm: 100, rondas: 4, animo: 3, letras: 4 },
      oido: { bpm: 80, rondas: 4, animo: 3, oculto: true, letras: 4 },
      largo: { bpm: 88, rondas: 3, animo: 3, pasos: 16, notas: [6, 7, 8], letras: 6 },
      fiesta: { bpm: 96, rondas: 6, animo: 2, letras: 8 },
    },
    cuenta: 3,
    tecla, // (las pruebas tocan con una tecla)
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
      const k = MINIJ.ritmo();
      if (k) tecla(S, k);
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
          if (!q.oido && rel >= q.paso * d) (q.oido = true), golpe(S, q.k, CX, CY);
        });
        if (rel >= largo) (S.fase = "toca"), (S.t0 += largo);
      } else if (S.fase === "toca") S.notas.forEach((q) => !q.hecho && rel > q.paso * d + VEN && ((q.hecho = -1), S.errores++)); // la que se pasó
      if (S.fase === "toca" && rel >= largo + VEN) {
        // lo que faltó tocar cuenta como error
        S.notas.forEach((q) => !q.hecho && ((q.hecho = -1), S.errores++));
        S.total += S.notas.length;
        if (!S.errores) (S.bien++, (S.luz.ronda = 0.6)), golpe(S, MINIJ.RITMO[0], CX, CY);
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
    // tocar el tambor con el puntero
    tocar(S, i) {
      if (i === 0) tecla(S, null);
    },
    hit(S, x, y) {
      const r = Math.hypot(x - CX, (y - CY) * 1.6);
      return r < R * 1.25 ? 0 : null;
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
        const [x, y] = enAnillo(S, k),
          q = S.notas.find((m) => m.paso === k);
        D.rombo(x, y, 16, k % 2 ? "#2A2220" : "#3A3634");
        if (q) {
          // la marca y su tecla: mientras Sølve toca se encienden al sonar; de oído, en tu turno no se ven las letras
          const sono = !oye || q.oido,
            col = q.hecho === 2 ? "#73D5DB" : q.hecho === 1 ? "#FFD98A" : q.hecho < 0 ? "#C8402D" : sono ? "#FFD98A" : "#433E3B",
            letra = q.hecho || (oye ? q.oido || !S.v.oculto : !S.v.oculto);
          D.rombo(x, y, 12, col);
          if (letra) DIB.alfa(c, sono ? 1 : 0.5, () => D.tecla(...enAnillo(S, k, RA + 50), q.k, 34, q.hecho < 0 ? "#FF8D71" : "#F2ECEC"));
          // el aro que se cierra para tu turno (el del primer paso ya asoma al final del compás de Sølve)
          const falta = q.paso * d - rel + (oye ? n * d : 0);
          if (!q.hecho && falta < d * 2.2 && falta > -VEN) D.aro(x, y, 16, falta / (d * 2.2), "#73D5DB");
        } else D.runa(RUNAS_C[k % RUNAS_C.length], ...enAnillo(S, k, RA + 40), 10, "#5A5450", 0.24); // donde no hay marca, su runa
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
      S.ondas.forEach((o) => DIB.alfa(c, o.v * 1.5, () => D.rombo(o.x, o.y, 30 + (0.4 - o.v) * 160, o.seco ? "#FF8D71" : "#FFD98A")));
      if (S.luz.ronda > 0) D.halo(CX, CY, 240, "#73D5DB", S.luz.ronda * 0.5);
      if (S.luz.todo > 0) D.halo(CX, CY, 320, "#FFD98A", S.luz.todo * 0.4);
      // el ánimo de la sala (cuernos) y las rondas
      D.texto(t("mn.tambor_sala"), 300, 250, 16, "#E0B2B2", "center", 500);
      for (let k = 0; k < (S.v.animo || 3); k++) D.piedra(250 + k * 38, 270, 30, 40, k < S.animo ? "#A8622E" : "#2A2220", k < S.animo ? "#5E130D" : "#1A1412");
      D.texto(t("mn.tambor_ronda", [Math.min(S.ronda + 1, S.v.rondas || 4), S.v.rondas || 4]), 1380, 92, 22, "#F2ECEC", "right");
      D.texto(t("mn.tambor_leyenda"), 300, 390, 15, "#E0B2B2", "center", 500);
      D.texto(t("mn.tambor_leyenda2"), 300, 414, 15, "#E0B2B2", "center", 500);
    },
  });
})();
