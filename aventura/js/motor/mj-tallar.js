// ---------- minijuego: tallar la runa (MINIJ «tallar») ----------
// La piedra de Ása: el cincel recorre cada trazo de una runa y en cada trazo hay marcas de oro donde hay que dar el
// golpe de martillo justo cuando el cincel pasa. Cada marca pide su tecla (A S D W Q E R F, más letras cuanto más
// difícil; `MINIJ.RITMO`) y la anuncia con un aro que se cierra: el golpe va cuando el aro toca la marca. Con el puntero,
// tocar la piedra golpea. Arranca con una cuenta atrás. Un golpe a destiempo, con otra tecla o una marca que se pasa
// resquebraja la piedra; demasiadas grietas y se parte. Variantes: base, rápido (el
// cincel corre más), piedra dura (la ventana del golpe es más chica), vetas (marcas violeta de las ataduras que no hay
// que golpear) y la palabra (dos runas seguidas). Devuelve { gano, precision, grietas }. Lo usan Ása al abrir muescas
// y la pestaña de tallas al unir tres (engarces.js).
(function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const CX = 860, // el centro de la runa
    CY = 470,
    ESC = 250, // de las unidades de la runa a la pantalla
    PREVIO = 70; // lo que el cincel corre antes de entrar al trazo
  const RUNAS = () => (window.JUEGOS_RUNAS && JUEGOS_RUNAS.RUNAS) || {};

  // los trazos de una runa en pantalla, con su largo acumulado
  function trazos(nom) {
    return (RUNAS()[nom] || []).map((tr) => {
      const p = tr.map(([x, y]) => [CX + x * ESC, CY + y * ESC]);
      const acum = [0];
      for (let k = 1; k < p.length; k++) acum.push(acum[k - 1] + Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]));
      return { p, acum, largo: acum[acum.length - 1] };
    });
  }
  // el punto a una distancia s del principio del trazo (antes o después, sigue derecho)
  function punto(tr, s) {
    const { p, acum } = tr;
    let k = 1;
    while (k < p.length - 1 && acum[k] < s) k++;
    const a = p[k - 1],
      b = p[k],
      l = acum[k] - acum[k - 1] || 1,
      f = (s - acum[k - 1]) / l;
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  // arma la runa número ri de la lista: trazos y marcas (y vetas)
  function armarRuna(S, ri) {
    S.ri = ri;
    S.trs = trazos(S.runas[ri]);
    S.marcas = [];
    S.trs.forEach((tr, k) => {
      const n = Math.max(1, Math.min(S.v.marcas || 3, Math.round(tr.largo / 90)));
      for (let m = 0; m < n; m++) S.marcas.push({ tr: k, s: tr.largo * ((m + 0.5 + (S.rnd() - 0.5) * 0.4) / n), hecha: 0, k: MINIJ.RITMO[Math.floor(S.rnd() * (S.v.letras || 3))] });
    });
    S.total += S.marcas.length;
    // las vetas van entre las marcas, nunca encima de una
    let vetas = S.v.vetas || 0;
    for (let i = 0; vetas > 0 && i < 40; i++) {
      const k = Math.floor(S.rnd() * S.trs.length),
        tr = S.trs[k],
        s = tr.largo * (0.1 + S.rnd() * 0.8);
      if (S.marcas.some((m) => m.tr === k && Math.abs(m.s - s) < (S.v.ventana || 26) * 2.2)) continue;
      S.marcas.push({ tr: k, s, veta: true, hecha: 0 });
      vetas--;
    }
    S.trazo = 0;
    S.s = -PREVIO;
    S.pausa = 0.6;
  }
  const pendientes = (S) => S.marcas.filter((m) => m.tr === S.trazo && !m.hecha && !m.veta);
  function grieta(S, x, y) {
    S.grietas++;
    S.luz.grieta = 0.35;
    S.rajas.push([x, y, S.rnd() * Math.PI * 2]);
    MINIJ_SONAR(140, 0.18, "sawtooth");
    if (S.grietas > S.v.fallos) MINIJ.terminar({ gano: false, precision: 0, grietas: S.grietas });
  }
  function chispas(S, x, y, col) {
    if (window.CALIDAD && CALIDAD.nivel === "baja") return;
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (S.rnd() - 0.5) * 2.2;
      S.chispas.push({ x, y, vx: Math.cos(a) * (120 + S.rnd() * 200), vy: Math.sin(a) * (120 + S.rnd() * 200), v: 0.5, col });
    }
  }

  // un golpe de martillo: k es la tecla de ritmo apretada (null con el puntero, que vale para cualquiera)
  function golpe(S, k) {
    if (S.gano || S.pausa > 0) return;
    const tr = S.trs[S.trazo];
    if (!tr) return;
    const ven = S.v.ventana || 26,
      [x, y] = punto(tr, Math.max(0, Math.min(tr.largo, S.s)));
    S.golpes++;
    S.martillo = 0.15;
    // la veta: golpearla raja
    const veta = S.marcas.find((m) => m.veta && m.tr === S.trazo && !m.hecha && Math.abs(m.s - S.s) < ven);
    if (veta) return (veta.hecha = -1), chispas(S, x, y, "#9A6BD8"), grieta(S, x, y);
    const m = pendientes(S).sort((a, b) => Math.abs(a.s - S.s) - Math.abs(b.s - S.s))[0];
    if (m && Math.abs(m.s - S.s) <= ven) {
      // otra tecla: la marca se raja
      if (k && m.k !== k) return (m.hecha = -1), (S.luz.mala = 0.4), grieta(S, x, y);
      const justo = Math.abs(m.s - S.s) <= ven * 0.45;
      m.hecha = justo ? 2 : 1;
      S.justos += justo ? 1 : 0.6;
      chispas(S, x, y, justo ? "#73D5DB" : "#FFD98A");
      MINIJ_SONAR(justo ? 720 : 520, 0.12, "triangle");
      if (window.SONIDO) SONIDO.tocar("filo", { vol: 0.35, tono: justo ? 1.6 : 1.2 });
      return;
    }
    grieta(S, x, y);
  }

  MINIJ.registrar("tallar", {
    // la dificultad sube sobre todo con las letras (`letras`: cuántas de A S D W Q E R F); la velocidad, de a poco
    variantes: {
      base: { vel: 170, marcas: 3, ventana: 28, fallos: 3, letras: 3 },
      rapido: { vel: 260, marcas: 3, ventana: 30, fallos: 3, letras: 4 },
      dura: { vel: 190, marcas: 3, ventana: 19, fallos: 3, letras: 5 },
      vetas: { vel: 200, marcas: 3, ventana: 26, fallos: 3, vetas: 3, letras: 6 },
      palabra: { vel: 230, marcas: 2, ventana: 26, fallos: 4, runas: 2, letras: 8 },
    },
    cuenta: 3,
    golpe, // (las pruebas golpean con una tecla)
    pie: "mn.tallar_pie",
    armar(S) {
      const todas = Object.keys(RUNAS()),
        pedida = S.op.runa && RUNAS()[S.op.runa] ? [S.op.runa] : [];
      S.runas = pedida.slice();
      while (S.runas.length < (S.v.runas || 1)) {
        const r = todas[Math.floor(S.rnd() * todas.length)];
        if (!S.runas.includes(r)) S.runas.push(r);
      }
      S.grietas = 0;
      S.golpes = 0;
      S.justos = 0;
      S.total = 0;
      S.rajas = [];
      S.chispas = [];
      S.hechas = []; // las runas ya talladas (la palabra)
      armarRuna(S, 0);
    },
    paso(S, dt) {
      const k = MINIJ.ritmo();
      if (k) golpe(S, k);
      S.chispas.forEach((p) => ((p.x += p.vx * dt), (p.y += p.vy * dt), (p.vy += 600 * dt), (p.v -= dt)));
      S.chispas = S.chispas.filter((p) => p.v > 0);
      if (S.gano) {
        if ((S.gano -= dt) <= 0) MINIJ.terminar({ gano: true, precision: S.precision, grietas: S.grietas });
        return;
      }
      if (S.pausa > 0) return void (S.pausa -= dt);
      const tr = S.trs[S.trazo],
        ven = S.v.ventana || 26;
      S.s += (S.v.vel || 230) * dt;
      // una marca que el cincel ya dejó atrás sin golpe
      pendientes(S).forEach((m) => {
        if (S.s - m.s > ven) {
          m.hecha = -1;
          const [x, y] = punto(tr, m.s);
          grieta(S, x, y);
        }
      });
      if (S.s > tr.largo + PREVIO * 0.6) {
        S.trazo++;
        S.s = -PREVIO;
        S.pausa = 0.3;
        if (S.trazo >= S.trs.length) {
          S.hechas.push(S.runas[S.ri]);
          if (S.ri + 1 < S.runas.length) return armarRuna(S, S.ri + 1);
          // una runa tallada a medias no sirve: hace falta acertar al menos la mitad del oro
          if (S.justos < S.total * 0.5) return MINIJ.terminar({ gano: false, precision: 0, grietas: S.grietas });
          S.precision = S.total ? Math.max(0, (S.justos - S.grietas * 0.5) / S.total) : 1;
          S.gano = 0.9;
          S.luz.todo = 0.9;
          MINIJ_SONAR(880, 0.45);
        }
      }
    },
    // tocar la piedra con el puntero: un golpe que vale para cualquier letra
    tocar(S, i) {
      if (i != null) golpe(S, null);
    },
    hit: () => 0,
    res: (S) => t("mn.tallar_res", [Math.round((S.precision || 0) * 100), S.grietas]),
    dibujar(S, D) {
      const c = D.c,
        ven = S.v.ventana || 26;
      // las runas de la palabra (la que se talla, marcada)
      if (S.runas.length > 1) {
        D.texto(t("mn.tallar_palabra"), 300, 250, 16, "#E0B2B2", "center", 500);
        S.runas.forEach((r, k) => {
          const y = 280 + k * 80;
          D.piedra(270, y, 60, 64, "#4A4442", "#3A3634");
          D.runa(r, 300, y + 32, 22, S.hechas.includes(r) ? "#73D5DB" : k === S.ri ? "#FFD98A" : "#2A2220", 0.22);
        });
      }
      // la piedra de Ása (cara clara a la derecha) y la grieta que se abre con cada fallo
      D.piedra(CX - 230, CY - 330, 460, 640, S.luz.grieta > 0 ? "#6E5A56" : "#5A5450", "#3A3634");
      D.P([CX - 222, CY - 322, CX + 222, CY - 322, CX + 222, CY - 314, CX - 222, CY - 314], "#6E6A66");
      S.rajas.forEach(([x, y, a]) => {
        c.save();
        c.strokeStyle = "#1A1412";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40);
        c.lineTo(x + Math.cos(a + 0.6) * 64, y + Math.sin(a + 0.6) * 64);
        c.stroke();
        c.restore();
      });
      // la guía tenue de cada trazo; lo ya tallado en luz rúnica
      S.trs.forEach((tr, k) => {
        c.save();
        c.lineCap = "round";
        c.lineJoin = "round";
        c.strokeStyle = k < S.trazo ? "#73D5DB" : k === S.trazo ? "#3A3634" : "#433E3B";
        c.lineWidth = k < S.trazo ? 16 : 22;
        c.beginPath();
        tr.p.forEach(([x, y], q) => (q ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
        if (k === S.trazo && S.s > 0) {
          c.strokeStyle = "#2E8A90";
          c.lineWidth = 12;
          c.beginPath();
          const fin = Math.min(tr.largo, S.s);
          for (let s = 0; s <= fin; s += 6) {
            const [x, y] = punto(tr, s);
            s ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke();
        }
        c.restore();
      });
      // las marcas: oro las que faltan (crecen cuando el cincel llega), luz las justas, rojo las que rajaron
      S.marcas.forEach((m) => {
        const [x, y] = punto(S.trs[m.tr], m.s),
          cerca = m.tr === S.trazo && !m.hecha ? Math.max(0, 1 - Math.abs(m.s - S.s) / (ven * 3)) : 0;
        if (m.veta) {
          if (m.tr < S.trazo && !m.hecha) return;
          D.rombo(x, y, 12 + cerca * 4, m.hecha ? "#C8402D" : "#9A6BD8");
          D.rombo(x, y, 5, "#1A1412");
          return;
        }
        const col = m.hecha === 2 ? "#73D5DB" : m.hecha === 1 ? "#FFD98A" : m.hecha < 0 ? "#C8402D" : "#FFD98A";
        if (!m.hecha) D.rombo(x, y, ven * 0.5 + cerca * 8, "#5E130D");
        D.rombo(x, y, 9 + cerca * 6, col);
        if (cerca > 0.6) D.halo(x, y, 30, "#FFD98A", (cerca - 0.6) * 0.8);
        // las que el cincel alcanza en menos de 1,6 s: su tecla a un costado del trazo y el aro que se cierra
        const falta = (m.s - S.s) / (S.v.vel || 230),
          a = punto(S.trs[m.tr], m.s)[2] - Math.PI / 2;
        if (m.hecha || m.tr !== S.trazo || falta > 1.6) return;
        D.tecla(x + Math.cos(a) * 48, y + Math.sin(a) * 48, m.k, 38, falta < 0.9 ? "#FFD98A" : "#F2ECEC");
        if (falta < 0.9 && falta > -0.15) D.aro(x, y, 20, falta / 0.9, "#FFD98A");
      });
      // el cincel y el martillo
      const tr = S.trs[S.trazo];
      if (tr && !S.gano) {
        const [x, y, a] = punto(tr, S.s),
          b = S.martillo > 0 ? 6 : 0;
        c.save();
        c.translate(x, y);
        c.rotate(a + Math.PI / 2);
        D.P([-5, -2, 5, -2, 4, -70, -4, -70], "#C8C2BE");
        D.P([0, -2, 5, -2, 4, -70, 0, -70], "#E8E2DE");
        D.P([-12, -70 - b, 12, -70 - b, 12, -96 - b, -12, -96 - b], "#5E130D");
        D.P([0, -70 - b, 12, -70 - b, 12, -96 - b, 0, -96 - b], "#9C2315");
        D.P([-4, -96 - b, 4, -96 - b, 4, -150 - b, -4, -150 - b], "#A8622E");
        c.restore();
      }
      S.chispas.forEach((p) => D.rombo(p.x, p.y, 4, p.col));
      if (S.luz.todo > 0) D.halo(CX, CY, 260, "#73D5DB", S.luz.todo * 0.4);
      // las grietas que quedan antes de partirse
      D.texto(t("mn.tallar_grietas"), 1380, 200, 16, "#E0B2B2", "right", 500);
      for (let k = 0; k <= S.v.fallos; k++) D.rombo(1370 - k * 26, 230, 9, k < S.grietas ? "#C8402D" : "#3A3634");
    },
  });
  function MINIJ_SONAR(f, dur, forma) {
    if (window.SONIDO) SONIDO.tono(forma || "sine", f, f * 1.02, dur, 0.09, {});
  }
})();
