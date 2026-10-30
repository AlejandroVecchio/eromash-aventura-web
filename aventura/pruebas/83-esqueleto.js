// Pruebas de la animación por piezas (comun/esqueleto.js) y de las animaciones de humano (comun/humano.js): ninguna
// pieza salta de un instante al siguiente (tampoco al dar la vuelta), los pies quedan en el piso y las claves se ponen
// y se sacan.
{
  (window.PRUEBAS = window.PRUEBAS || []).push({
    nombre: "esqueleto: las animaciones de humano se mueven sin saltos en cada vista y pisan el piso",
    fn: async (A, { si }) => {
      const E = ESQUELETO, H = HUMANO;
      for (const id of H.ORDEN) {
        const a = H.ANIMS[id];
        for (const v of H.VISTAS) {
          const esq = H.MUNECO[v], N = 240;
          let antes = null, peor = 0, piso = 0;
          // en las que se repiten se mira también el paso del final al principio
          for (let i = 0; i <= N; i++) {
            const t = a.bucle ? i / N : Math.min(1, i / N);
            const { P } = E.armar(esq, E.muestra(a, v, t));
            const puntas = esq.huesos.map((h) => [P[h.id][0] * (h.punta || [0, 0])[0] + P[h.id][2] * (h.punta || [0, 0])[1] + P[h.id][4], P[h.id][1] * (h.punta || [0, 0])[0] + P[h.id][3] * (h.punta || [0, 0])[1] + P[h.id][5]]);
            puntas.forEach((q) => si(isFinite(q[0]) && isFinite(q[1]), id + " " + v + ": un hueso quedó sin lugar"));
            if (antes) puntas.forEach((q, k) => (peor = Math.max(peor, Math.hypot(q[0] - antes[k][0], q[1] - antes[k][1]))));
            antes = puntas;
            if (id === "andar" || id === "correr" || id === "reposo") piso = Math.max(piso, Math.abs(Math.max(...["pieD", "pieI"].map((p) => Math.max(...esq._porId[p].suela.map((s) => P[p][1] * s[0] + P[p][3] * s[1] + P[p][5]))))));
          }
          // en 1/240 de la animación ninguna punta se corre más de 6 unidades (un golpe rápido llega a 4)
          si(peor < 6, id + " " + v + ": una pieza salta " + peor.toFixed(1));
          si(piso < 0.01, id + " " + v + ": los pies no quedan en el piso (" + piso.toFixed(2) + ")");
        }
      }
      const m = H.copia(H.ANIMS.andar);
      E.ponerClave(m, "E", "cabeza", "r", 0.5, 12);
      si(Math.abs(E.valor(m.pistas.E.cabeza.r, 0.5, true) - 12) < 1e-6, "la clave nueva vale lo puesto");
      si(E.sacarClave(m, "E", "cabeza", 0.5) > 0, "la clave se saca");
      const an = E.animador(H.ANIMS);
      an.poner("andar");
      an.avanzar(0.3);
      an.poner("aviso");
      an.avanzar(0.05);
      si(Object.keys(an.pose("E")).length > 5, "el animador funde una animación en la otra");
      const c = document.createElement("canvas").getContext("2d");
      E.dibujar(c, H.MUNECO.S, an.pose("S"), { colores: H.COLORES[2] });
    },
  });
}
