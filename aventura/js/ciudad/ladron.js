// ---------- el ladrón del mercado (módulo LADRON25) ----------
// Un día sí y otro no, entre las 13 y las 15, si Eromash anda cerca del Mercado de los Toldos, un ratero se lleva algo de
// un puesto y sale corriendo: el puestero grita y hay que alcanzarlo corriendo (va más rápido que caminando y se cansa de
// a poco). Si Eromash llega a tocarlo, devuelve lo robado y el puestero paga 10; si se aleja más de 35 m o pasa un minuto
// y cuarto, se escapa. El ratero es parte de la gente de MUNDO25 (`p.ladron`, solo se ve durante la persecución) y lo
// mueve actualizar(); mientras huye, la marca del mapa de la ciudad lo sigue. Estado en E.extra.eikholt.ladron = { dia, atrapados }; textos ek.ld_.
//   LADRON25.actualizar(dt, plano, gente, st, A, e) · activo()
window.LADRON25 = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const DURA = 75,
    LEJOS = 35, // metros
    PAGA = 10;
  let caza = null; // { p, puesto, t, lejos }
  const dia = (A) => Math.floor(((A.H.E.tiempo / LUZ.DIA) * 24 + 9 - 6) / 24);
  const estado = (st) => (st.ladron = st.ladron || { dia: -1, atrapados: 0 });

  // roba en el puesto más cercano a Eromash que quede a más de 6 m, así lo ve salir corriendo
  function empezar(plano, gente, st, A, e) {
    const p = gente.find((q) => q.ladron),
      ps = (plano.puestos || []).filter((q) => Math.hypot(q.x - e.x, q.y - e.y) > 6 * plano.M);
    if (!p || !ps.length) return;
    const q = ps.reduce((m, q) => (Math.hypot(q.x - e.x, q.y - e.y) < Math.hypot(m.x - e.x, m.y - e.y) ? q : m));
    estado(st).dia = dia(A);
    p.x = q.x;
    p.y = q.y;
    caza = { p, puesto: q, t: 0, lejos: 0, marcaAntes: st.marca || null };
    if (window.SONIDO) SONIDO.tocar("plata", { vol: 0.4, tono: 0.7 });
    HUD.aviso(t("ek.ld_grito", [t("ek.mc_puesto_" + q.vende)]), "#C8402D");
  }
  function terminar(st, A, atrapado) {
    const s = estado(st);
    caza.p.vx = caza.p.vy = 0;
    st.marca = caza.marcaAntes;
    caza = null;
    if (!atrapado) return HUD.aviso(t("ek.ld_escapo"), "#E0B2B2");
    s.atrapados++;
    if (window.ANIMA) ANIMA.gesto("asiente");
    A.dialogoLibre([["ek_ladron", "ek.ld_atrapado"], ["ek_vendedor", "ek.ld_gracias"]], () => {
      PODERES.darPlata(PAGA);
      HUD.aviso(t("ek.ld_premio", [PAGA]), "#FFD98A");
    });
  }
  // el ratero corre alejándose de Eromash: prueba direcciones alrededor de la de huida y toma la primera libre
  function huir(dt, plano, e) {
    const p = caza.p,
      M = plano.M,
      v = caza.t < 1.2 ? 220 : Math.max(300, 370 - caza.t * 2.5); // arranca mirando para atrás
    const base = Math.atan2(p.y - e.y, p.x - e.x);
    for (const da of [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3, 1.9, -1.9, 2.6, -2.6]) {
      const a = base + da,
        nx = p.x + Math.cos(a) * v * dt,
        ny = p.y + Math.sin(a) * v * dt;
      if (MUNDO25.libre(nx, ny, 25) && Math.hypot(nx, ny) < plano.R_MURO - 3 * M) {
        p.vx = Math.cos(a) * v;
        p.vy = Math.sin(a) * v;
        p.x = nx;
        p.y = ny;
        return;
      }
    }
  }
  function actualizar(dt, plano, gente, st, A, e) {
    const M = plano.M;
    if (!caza) {
      const h = LUZ.hora(A.H.E.tiempo),
        L = plano.lugares.mercado;
      if (L && dia(A) % 2 === 1 && h >= 13 && h < 15 && estado(st).dia !== dia(A) && Math.hypot(L[0] - e.x, L[1] - e.y) < 25 * M) empezar(plano, gente, st, A, e);
      return;
    }
    caza.t += dt;
    huir(dt, plano, e);
    st.marca = [caza.p.x, caza.p.y]; // el minimapa de la ciudad lo sigue
    const d = Math.hypot(caza.p.x - e.x, caza.p.y - e.y);
    caza.lejos = d > LEJOS * M ? caza.lejos + dt : 0;
    if (d < 1.1 * M) terminar(st, A, true);
    else if (caza.lejos > 3 || caza.t > DURA) terminar(st, A, false);
  }
  return { actualizar, activo: () => !!caza, PAGA };
})();
