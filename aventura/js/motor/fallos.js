// ---------- los fallos y la diferencia de nivel (sistema FALLOS) ----------
// Como en el WoW: no todo golpe entra. Cuanto más nivel tiene la criatura sobre Eromash, más seguido falla él y menos
// le saca cuando acierta; cuanto más abajo está, más seguido falla ella. Contra una «?» (10 niveles o más arriba) un
// nivel 1 falla casi todo, pega la mitad y recibe golpes aplastantes: no se le gana. Lo que nunca falla: el golpe por
// sorpresa a quien no te vio y el contraataque después de una esquiva justa (premian la habilidad, no el nivel).
// Las runas, las flechas y lo que tiran las armas no fallan, pero también pegan menos contra más nivel.
// La Destreza afina el golpe (cada punto sobre la base baja un poco la chance de fallar) y otros sistemas pueden
// sumar precisión con FALLOS.precision(fn(e) → 0..1). Textos `fl.`.
window.FALLOS = (function () {
  "use strict";
  let A, J, jug;
  const t = (k, v) => I18N.t(k, v);
  const TOPE_FALLO = 0.85, // ni contra una «?» se falla todo
    TOPE_ESQUIVA = 0.75;
  const precisiones = [];

  // ---------- las cuentas (también las muestran la Hoja y la ventana del bestiario) ----------
  const nivelJug = () => (window.RPG ? RPG.nivel() : 1);
  const nivelDe = (e) => (window.RPG ? (e.nivel || RPG.nivelDe(e)) : 1);
  const dif = (e) => nivelDe(e) - nivelJug();
  // la chance de que Eromash falle contra una criatura dif niveles arriba (negativo: abajo)
  function fallo(d) {
    if (d <= 0) return Math.max(0.02, 0.05 + 0.01 * d);
    return Math.min(TOPE_FALLO, 0.05 + 0.03 * d + 0.008 * d * d);
  }
  // la chance de que la criatura falle contra Eromash (d: su nivel menos el de él)
  function esquiva(d) {
    if (d >= 0) return Math.max(0, 0.05 - 0.01 * d);
    const k = -d;
    return Math.min(TOPE_ESQUIVA, 0.05 + 0.04 * k + 0.008 * k * k);
  }
  // cuánto entra de lo que pega Eromash: menos contra más nivel, un poco más contra menos
  function mult(d) {
    if (d > 0) return Math.max(0.4, 1 - 0.05 * d);
    return Math.min(1.3, 1 - 0.03 * d);
  }
  // los golpes aplastantes de las criaturas 3 o más niveles arriba (siempre bajo el tope del 35 %)
  const aplastante = (d) => (d >= 3 ? Math.min(0.4, 0.1 * (d - 2)) : 0);
  function precision(e) {
    let p = window.ATRIBUTOS ? Math.max(0, ATRIBUTOS.valor("des") - ATRIBUTOS.BASE) * 0.0015 : 0;
    for (const f of precisiones) p += f(e) || 0;
    return Math.min(0.5, p);
  }
  const chanceFallo = (e) => Math.max(0, fallo(dif(e)) - precision(e));

  // ---------- el golpe de Eromash ----------
  // lo pregunta golpear() de juego.js antes de mostrar el número: null si falló, si no lo que entra del daño
  function tirar(e, info = {}) {
    if (e.d.blanco || info.contra || info.sorpresa) return 1;
    if (Math.random() < chanceFallo(e)) {
      marcar(e.x, e.y - 100, t("fl.falla"), "#8E8A86");
      if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.3, tono: 1.4, x: e.x, y: e.y });
      return null;
    }
    return mult(dif(e));
  }
  function marcar(x, y, txt, col) {
    J.textos.push({ x, y, n: txt, t: 0, col, grande: false, palabra: true });
  }

  // ---------- el golpe de la criatura ----------
  // lo pregunta J.herir cuando sabe quién pega: { falla } o { dano }
  function recibir(e, dano) {
    if (!e || !e.d) return { dano };
    const d = dif(e);
    if (Math.random() < esquiva(d)) {
      marcar(jug.x, jug.y - 140, t("fl.esquivas"), "#E0B2B2");
      if (window.SONIDO) SONIDO.tocar("tajo", { vol: 0.35, tono: 0.8 });
      return { falla: true };
    }
    if (Math.random() < aplastante(d)) {
      marcar(jug.x, jug.y - 150, t("fl.aplastante"), "#C8402D");
      return { dano: Math.min(Math.round(dano * 1.5), Math.max(35, Math.round(jug.hpMax * 0.35))) };
    }
    return { dano };
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      // lo que no pasa por golpear() (runas, flechas, lanzas, el bastón, la Furia): no falla, pero pega según el nivel
      const CB = A.CB,
        orig = CB.golpear;
      CB.golpear = function (J0, e, dano, ...resto) {
        if (!J0.golpeTirado && e && e.d && !e.d.blanco && dano < 9999) dano *= mult(dif(e));
        return orig.call(this, J0, e, dano, ...resto);
      };
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, tirar, recibir, fallo, esquiva, mult, aplastante, chanceFallo, dif, precision: (f) => precisiones.push(f), precisionActual: () => precision({ d: {} }), TOPE_FALLO, TOPE_ESQUIVA };
})();
