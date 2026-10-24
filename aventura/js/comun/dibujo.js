// ---------- herramientas de dibujo (módulo DIB) ----------
// Las mismas que usan los mapas de la arena (juego/js/mundo/mapas.js): polígonos planos, elipses, rectángulos y
// líneas, sin degradés en los objetos. La luz viene de arriba a la derecha: cada volumen tiene su cara clara y su
// cara en sombra, como los NPC y los cofres de la arena.
window.DIB = (function () {
  "use strict";
  const TAU = Math.PI * 2;
  // polígono de puntos sueltos [x0, y0, x1, y1, …]
  function P(c, pts, col) {
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fillStyle = col;
    c.fill();
  }
  function E(c, x, y, rx, ry, col, rot = 0) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
    c.fillStyle = col;
    c.fill();
  }
  function R(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  }
  function L(c, x1, y1, x2, y2, col, w = 2) {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = "round";
    c.stroke();
  }
  function alfa(c, a, fn) {
    const g = c.globalAlpha;
    c.globalAlpha = g * a;
    fn();
    c.globalAlpha = g;
  }
  // polígono regular facetado (piedras, copas, hongos)
  function poli(cx, cy, rx, ry, n, rot = 0, jitter = null) {
    const o = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n,
        k = jitter ? jitter[i % jitter.length] : 1;
      o.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
    }
    return o;
  }
  // generador pseudoaleatorio con semilla (el mismo que la arena): el mundo sale igual en cada partida
  function azar(sem) {
    let a = sem >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // sombra en el piso, la misma de los personajes de la arena
  const sombra = (c, x, y, rx, ry, a = 0.38) => E(c, x, y, rx, ry, `rgba(0,0,0,${a})`);
  // la luz rúnica de la aventura: azul #73D5DB; un halo sin desenfoque (círculos concéntricos), apagable por calidad
  const RUNICO = "#73D5DB",
    RUNICO_CLARO = "#C8F2F4",
    VIOLETA = "#9A6BD8";
  // Calidad gráfica (CALIDAD de la arena): en baja no hay halos; en media, un solo anillo
  function halo(c, x, y, r, col, fuerza = 1) {
    if (fuerza <= 0) return;
    const nivel = window.CALIDAD ? CALIDAD.nivel : "alta";
    if (nivel === "baja") return;
    if (nivel === "media") return alfa(c, 0.2 * fuerza, () => E(c, x, y, r * 0.5, r * 0.4, col));
    alfa(c, 0.1 * fuerza, () => E(c, x, y, r, r * 0.8, col));
    alfa(c, 0.14 * fuerza, () => E(c, x, y, r * 0.62, r * 0.5, col));
    alfa(c, 0.2 * fuerza, () => E(c, x, y, r * 0.32, r * 0.26, col));
  }
  // La insignia de Eikholt (regla de Alejandro, 24/10/2026): la cornamenta ramificada que baja hasta una punta. Va en
  // todos los estandartes, tabardos y referencias a la capital, siempre con este mismo dibujo: el contorno sacado de
  // su lámina (x desde el centro, y desde arriba; mide 1 de alto). pt(x, y) da el punto en pantalla, así se pinta de
  // frente o sobre una tela en volumen.
  const INSIGNIA = [-.099,.000,-.143,.065,-.155,.088,-.165,.113,-.177,.171,-.186,.264,-.189,.264,-.191,.253,-.192,.176,-.197,.138,-.213,.101,-.224,.086,-.236,.074,-.240,.073,-.223,.122,-.217,.167,-.218,.202,-.229,.286,-.230,.319,-.224,.350,-.214,.372,-.198,.393,-.141,.449,-.113,.483,-.093,.514,-.073,.561,-.060,.608,-.057,.641,-.060,.641,-.117,.586,-.145,.566,-.162,.558,-.136,.605,-.072,.683,-.060,.701,-.050,.724,-.036,.776,-.031,.811,-.034,.811,-.060,.782,-.074,.772,-.093,.761,-.095,.764,-.081,.792,-.047,.847,-.036,.871,-.025,.905,-.002,.999,.001,1.000,.025,.905,.037,.867,.050,.841,.081,.792,.095,.763,.094,.761,.072,.773,.058,.784,.034,.811,.031,.811,.036,.775,.050,.723,.069,.687,.130,.614,.162,.559,.160,.557,.118,.585,.090,.609,.060,.641,.057,.641,.060,.611,.073,.561,.092,.515,.114,.481,.152,.437,.201,.390,.214,.371,.224,.349,.229,.329,.230,.304,.218,.210,.217,.162,.224,.115,.240,.074,.238,.072,.234,.074,.216,.095,.204,.118,.197,.136,.192,.171,.191,.251,.189,.262,.186,.263,.176,.166,.162,.107,.138,.057,.102,.004,.098,.001,.110,.045,.141,.119,.150,.146,.157,.187,.155,.218,.151,.216,.106,.154,.081,.132,.076,.130,.076,.133,.094,.165,.117,.218,.150,.263,.162,.284,.170,.310,.170,.341,.162,.371,.149,.395,.121,.426,.105,.439,.101,.439,.105,.386,.101,.352,.085,.307,.071,.283,.068,.283,.078,.352,.078,.409,.073,.434,.066,.452,.062,.494,.040,.563,.027,.618,.014,.707,.002,.825,-.002,.825,-.013,.714,-.025,.631,-.038,.572,-.062,.494,-.066,.473,-.066,.452,-.074,.430,-.078,.410,-.078,.350,-.069,.282,-.074,.288,-.087,.313,-.101,.354,-.105,.380,-.102,.439,-.110,.435,-.126,.422,-.150,.394,-.163,.370,-.170,.344,-.170,.309,-.161,.282,-.149,.262,-.119,.221,-.090,.156,-.076,.130,-.080,.131,-.106,.155,-.125,.178,-.151,.216,-.155,.218,-.157,.183,-.149,.143,-.108,.039,-.098,.004];
  function insignia(c, pt, col) {
    c.fillStyle = col;
    c.beginPath();
    for (let i = 0; i < INSIGNIA.length; i += 2) {
      const [x, y] = pt(INSIGNIA[i], INSIGNIA[i + 1]);
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.closePath();
    c.fill();
  }

  return { TAU, P, E, R, L, alfa, poli, azar, sombra, halo, insignia, RUNICO, RUNICO_CLARO, VIOLETA };
})();
