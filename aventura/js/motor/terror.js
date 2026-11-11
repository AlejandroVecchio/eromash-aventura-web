// ---------- el modo terror para videos (sistema TERROR, ?terror=1) ----------
// Pedido de la fábrica de videos (10/11/2026, «le pedí a la IA que haga mi bosque de terror»): con ?terror=1 la noche
// de Eldervald se vuelve de terror sin tocar el juego de siempre: aire rojo oscuro y niebla (J.ambZona, cada cuadro),
// ojos rojos que parpadean detrás de los troncos y se apagan si Eromash se acerca, un latido que se apura y, con
// ?susto=<segundos>, el susto: aparece una escena de Probar mecánicas (la Cacería Salvaje por omisión, alrededor de Eromash; ?quien=grupo:draugr u otra) con temblor,
// rugido y un destello rojo. Se combina con ?video=1, ?hora=, ?clima=bruma, ?piloto=1 y ?en=x,y. No tiene textos.
window.TERROR = (function () {
  "use strict";
  const q = new URLSearchParams(location.search);
  const activo = q.get("terror") === "1",
    susto = Number(q.get("susto")) || 0,
    quien = q.get("quien") || "caceria";
  let A = null,
    J = null,
    jug = null,
    W = null,
    t = 0,
    tLatido = 0,
    asustado = 0, // segundos desde el susto (0: todavía no)
    arboles = [],
    tBusca = 0;
  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  // ---------- los ojos entre los árboles ----------
  // se buscan dos veces por segundo, solo en lo que se ve (nada recorre el mundo entero)
  function buscar(x0, y0, x1, y1) {
    arboles = [];
    W.cercanas(x0 - 100, y0 - 100, x1 + 100, y1 + 200, (o) => {
      if (o.oculto || !o.arbol || o.resto) return;
      if (hash(o.x, o.y) < 0.22) arboles.push(o);
    });
  }
  function ojos(c) {
    for (const o of arboles) {
      const h = hash(o.y, o.x),
        d = Math.hypot(o.x - jug.x, o.y - jug.y);
      if (d < 200 || d > 900) continue;
      // cada par mira un rato, parpadea y se esconde, con su propio ritmo
      const ciclo = (t * (0.18 + h * 0.2) + h * 7) % 1;
      if (ciclo > 0.62) continue;
      const parp = ciclo > 0.3 && ciclo < 0.33 ? 0.15 : 1,
        lejos = Math.min(1, (d - 200) / 120),
        a = Math.min(1, ciclo / 0.06) * Math.min(1, (0.62 - ciclo) / 0.06) * lejos,
        s = (o.o && o.o.s) || 1,
        lado = h < 0.5 ? -1 : 1,
        x = o.x + lado * (16 + h * 14) * s,
        y = o.y - (34 + h * 30) * s,
        sep = 16 + h * 6;
      if (a <= 0.02) continue;
      if (window.CALIDAD && CALIDAD.nivel !== "baja") DIB.alfa(c, a * 0.35, () => DIB.halo(c, x, y, 46, "#C8402D"));
      DIB.alfa(c, a, () => {
        for (const k of [-1, 1]) {
          const ex = x + (k * sep) / 2;
          // rombos planos, como las brasas del juego
          DIB.P(c, [ex - 7, y, ex, y - 4.6 * parp, ex + 7, y, ex, y + 4.6 * parp], "#FF8D71");
          DIB.P(c, [ex - 2.6, y, ex, y - 1.8 * parp, ex + 2.6, y, ex, y + 1.8 * parp], "#F2ECEC");
        }
      });
    }
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
    },
    actualizar(dt) {
      if (!activo || !J || J.modo !== "juego" || J.dentro) return;
      t += dt;
      // el aire: rojo oscuro, cerrado y con niebla (el motor lo limpia cada cuadro: se pide siempre)
      const k = asustado ? Math.min(1, asustado * 2) : 0;
      J.ambZona = Object.assign(J.ambZona || {}, { tono: [Math.round(22 + 16 * k), 4, 10], osc: 0.95, niebla: 0.45 });
      // el latido: lento al principio, se apura antes del susto y después
      const falta = susto ? Math.max(0, susto - t) : 99,
        cada = asustado ? 0.42 : falta < 4 ? 0.55 : 0.95;
      if ((tLatido += dt) > cada && window.SONIDO) (tLatido = 0), SONIDO.tocar("eromash/latido", { vol: asustado ? 0.8 : 0.55 });
      if (susto && !asustado && t >= susto) {
        asustado = 0.001;
        // la Cacería sale alrededor de Eromash, sin moverlo; lo demás es una escena de Probar mecánicas
        if (quien === "caceria" && window.CACERIA && CACERIA.empezar(CACERIA.nocheId(), true)) {
          // para el susto, la jauría aparece encima: el cazador justo adelante y los sabuesos alrededor
          const m = CACERIA.caza().miembros;
          m.forEach((e, i) => {
            const a = i === 0 ? Math.PI / 2 : (i / m.length) * Math.PI * 2;
            const r = i === 0 ? 150 : 230;
            e.x = jug.x + Math.cos(a) * r;
            e.y = jug.y + Math.sin(a) * r * 0.8;
          });
        }
        else if (window.VIDEO) VIDEO.escena(quien);
        J.sacudir(1.2);
        if (window.SONIDO) SONIDO.tocar("criaturas/lider-rugido", { vol: 0.9 });
      } else if (asustado) asustado += dt;
    },
    sobreLuz(c, x0, y0, x1, y1) {
      if (!activo || !J || J.dentro) return;
      if ((tBusca -= 1 / 60) <= 0) (tBusca = 0.5), buscar(x0, y0, x1, y1);
      ojos(c);
      // el destello rojo del susto
      if (asustado && asustado < 0.5) DIB.alfa(c, (1 - asustado / 0.5) * 0.45, () => DIB.P(c, [x0, y0, x1, y0, x1, y1, x0, y1], "#9C2315"));
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, activo };
})();
