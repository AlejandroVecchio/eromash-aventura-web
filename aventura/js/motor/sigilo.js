// ---------- el sigilo: agacharse, el ojo y el golpe desde las sombras (sistema SIGILO) ----------
// Como el sigilo del Skyrim y del Thief: agacharse (acción `agacharse`: X, o L2 + ▼) deja a Eromash más bajo y más
// lento, y las criaturas que no lo vieron lo notan de mucho más cerca (de noche, todavía más). Arriba de su cabeza un
// ojo dice cuánto falta para que lo vean: cerrado, entreabierto, abierto en coral y rojo cuando ya lo vieron. Pegarle
// agachado a una que no lo vio es un golpe desde las sombras (×2 sobre el golpe por sorpresa) y, si la mata, el resto
// del grupo no se entera. Con práctica (muertes desde las sombras) sube la maestría: menos ruido y golpes más fuertes.
// Correr, saltar o esquivar lo levanta. Estado en E.extra.sigilo = { golpes, muertes }. Textos `sl.`.
window.SIGILO = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const DETECTA = 13; // en metros: el mismo de combate.js
  const OCULTA = 0.45, // agachado lo notan a este tanto de la distancia
    NOCHE = 0.8,
    RANGOS = [5, 15, 30], // muertes desde las sombras para cada rango de maestría
    MENOS_RUIDO = 0.08, // por rango
    GOLPE = [2, 2.33, 2.67, 3]; // ×daño del golpe desde las sombras por rango
  const base = () => ({ golpes: 0, muertes: 0 });
  let st = base();
  let ojo = 0, // 0 cerrado … 1 a punto de verlo
    visto = 0, // > 0: lo vieron hace poco
    avisoRango = -1;

  const rango = () => RANGOS.filter((n) => st.muertes >= n).length;
  const esNoche = () => {
    const h = LUZ.hora(A.H.E.tiempo);
    return h >= 20 || h < 5;
  };
  // cuánto lo notan: lo que combate.js multiplica a la distancia de detección (J.sigilo)
  const factor = () => (jug.agachado ? OCULTA * (1 - MENOS_RUIDO * rango()) * (esNoche() ? NOCHE : 1) : 1);
  const ruido = () => (jug.paso === 3 ? 1.3 : jug.paso === 1 ? 0.6 : jug.paso === 0 ? 0.8 : 1);

  function agacharse(si) {
    const antes = !!jug.agachado;
    jug.agachado = si === undefined ? !jug.agachado : !!si;
    if (antes !== jug.agachado && window.SONIDO) SONIDO.tocar("tela", { vol: 0.25, tono: jug.agachado ? 0.8 : 1.1 });
    return jug.agachado;
  }
  // el ojo: la que está más cerca de verlo, entre las que todavía no lo vieron
  function mirarOjo() {
    let max = 0;
    const thr0 = DETECTA * W.M * (J.sigilo || 1) * ruido();
    for (const e of A.enemigos) {
      if (!e.activo || e.muerto) continue;
      if (e.estado === "persigue" && e.vio > 0) visto = 1.2;
      if (e.estado !== "quieto") continue;
      const d = Math.hypot(e.x - jug.x, e.y - jug.y);
      const k = (thr0 * 1.7 - d) / (thr0 * 0.7);
      if (k > max) max = k;
    }
    return Math.max(0, Math.min(1, max));
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      INVENTARIO.iconoDe("sl_ojo", (c) => {
        // un ojo rúnico entrecerrado sobre una capucha
        DIB.P(c, [-24, 22, -18, -10, 0, -24, 18, -10, 24, 22], "#2A2628");
        DIB.P(c, [0, -24, 18, -10, 24, 22, 0, 22], "#3A3634");
        DIB.P(c, [-16, 4, 0, -6, 16, 4, 0, 10], "#73D5DB");
        DIB.P(c, [-4, 2, 4, 2, 4, 6, -4, 6], "#111111");
      });
    },
    alEmpezar(extra) {
      extra.sigilo = Object.assign(base(), extra.sigilo || {});
      st = extra.sigilo;
      jug.agachado = false;
      ojo = 0;
      visto = 0;
      avisoRango = rango();
    },
    actualizar(dt) {
      if (J.modo === "juego" && !J.dentro && CONTROLES.recien("agacharse")) agacharse();
      // correr, saltar, esquivar, morir o entrar a algún lado lo levantan
      if (jug.agachado && (jug.correr || jug.salto > 0 || jug.esq > 0 || jug.muerto || J.dentro)) agacharse(false);
      J.sigilo = factor();
      J.silencioso = !!jug.agachado;
      visto = Math.max(0, visto - dt);
      const meta = jug.agachado ? mirarOjo() : 0;
      ojo += (meta - ojo) * Math.min(1, dt * 6);
      if (rango() !== avisoRango) {
        avisoRango = rango();
        HUD.aviso(t("sl.rango_d", [Math.round(GOLPE[avisoRango] * 100) / 100]), "lugar", t("sl.rango", [t("sl.r_" + avisoRango)]));
      }
    },
    modDano(dano, e, info) {
      if (!jug.agachado || !e || e.estado !== "quieto" || e.muerto) return dano;
      if (info) info.sombras = true;
      return dano * GOLPE[rango()];
    },
    alPegar(e, dano, info, murio) {
      if (!info || !info.sombras) return;
      st.golpes++;
      A.textoFlotante(e.x, e.y - 120, t("sl.sombras"), "#73D5DB");
      if (murio) st.muertes++;
    },
    sobreLuz(c) {
      if (!jug.agachado || jug.muerto) return;
      // el ojo sobre la cabeza: se abre a medida que se acercan a verlo
      const x = jug.x,
        y = jug.y - 128 - (jug.z || 0),
        ab = visto > 0 ? 1 : ojo,
        col = visto > 0 ? "#C8402D" : ab > 0.6 ? "#FF8D71" : "#73D5DB";
      DIB.alfa(c, 0.9, () => {
        c.fillStyle = "rgba(17,17,17,0.55)";
        c.beginPath();
        c.ellipse(x, y, 24, 6 + 10 * ab, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(x - 20, y);
        c.quadraticCurveTo(x, y - 3 - 14 * ab, x + 20, y);
        c.quadraticCurveTo(x, y + 3 + 14 * ab, x - 20, y);
        c.fill();
        if (ab > 0.15) {
          c.fillStyle = "#111111";
          c.beginPath();
          c.arc(x, y, 3 + 4 * ab, 0, Math.PI * 2);
          c.fill();
        }
      });
    },
    casillas() {
      return [{ id: "sigilo", icono: "sl_ojo", accion: "agacharse", nombre: t("sl.titulo"), listo: !J.dentro, espera: 0 }];
    },
    efectosHud() {
      return jug.agachado ? [{ texto: t("sl.agachado"), n: Math.round((1 - J.sigilo) * 100) + " %", col: "#73D5DB" }] : [];
    },
    diario() {
      return st.golpes ? `<div class="diario-resumen"><p><b>${t("sl.titulo")}</b> ${t("sl.diario", [t("sl.r_" + rango()), st.muertes, st.golpes])}</p></div>` : "";
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, agacharse, rango, factor, ojo: () => ojo, RANGOS, GOLPE, OCULTA, NOCHE };
})();
