// ---------- miniaturas del mapa (ICONOS) ----------
// Un dibujito plano por cada cosa importante de Eldervald, para el mapa grande y el minimapa: las estructuras, los
// lugares, las piedras, los altares, los cofres. Cada uno sobre un disco oscuro para leerse encima del bosque.
// ICONOS.dibujar(c, tipo, x, y, r, op) · op.col pisa el color, op.apagado lo pinta gris (ya usado o abierto).
window.ICONOS = (function () {
  "use strict";
  const OSCURO = "#111111",
    CLARO = "#F2ECEC",
    ROSA = "#E0B2B2",
    ORO = "#FFD98A",
    RUNICO = "#73D5DB",
    ROJO = "#C8402D",
    GRIS = "#6A6660";

  function pol(c, pts, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fill();
  }
  function linea(c, pts, col, w) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.stroke();
  }
  function disco(c, x, y, r, borde) {
    c.fillStyle = "rgba(17,17,17,0.82)";
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    if (borde) {
      c.strokeStyle = borde;
      c.lineWidth = Math.max(1, r * 0.12);
      c.stroke();
    }
  }

  // cada dibujo usa una unidad u = r/10 alrededor del centro
  const DIBUJOS = {
    ciudad(c, x, y, u, col) {
      // empalizada con tres casas y el roble
      for (let k = -4; k <= 4; k += 2) pol(c, [x + k * u - u * 0.8, y + 5 * u, x + k * u - u * 0.8, y - 1 * u, x + k * u, y - 2.5 * u, x + k * u + u * 0.8, y - 1 * u, x + k * u + u * 0.8, y + 5 * u], col);
      pol(c, [x - 2 * u, y - 2 * u, x, y - 7 * u, x + 2 * u, y - 2 * u], ROSA);
    },
    casa(c, x, y, u, col) {
      pol(c, [x - 6 * u, y - 1 * u, x, y - 6.5 * u, x + 6 * u, y - 1 * u], col);
      pol(c, [x - 4.5 * u, y - 1 * u, x + 4.5 * u, y - 1 * u, x + 4.5 * u, y + 5 * u, x - 4.5 * u, y + 5 * u], CLARO);
      pol(c, [x - 1.2 * u, y + 5 * u, x - 1.2 * u, y + 1 * u, x + 1.2 * u, y + 1 * u, x + 1.2 * u, y + 5 * u], OSCURO);
    },
    puesto(c, x, y, u, col) {
      pol(c, [x - 6.5 * u, y - 2 * u, x - 4 * u, y - 5.5 * u, x + 4 * u, y - 5.5 * u, x + 6.5 * u, y - 2 * u], col);
      linea(c, [x - 5 * u, y - 2 * u, x - 5 * u, y + 5 * u], CLARO, 1.4 * u);
      linea(c, [x + 5 * u, y - 2 * u, x + 5 * u, y + 5 * u], CLARO, 1.4 * u);
      pol(c, [x - 4 * u, y + 2 * u, x + 4 * u, y + 2 * u, x + 4 * u, y + 4 * u, x - 4 * u, y + 4 * u], ORO);
    },
    aserradero(c, x, y, u, col) {
      DIBUJOS.casa(c, x - 1.5 * u, y, u * 0.8, col);
      c.fillStyle = ORO;
      c.beginPath();
      c.arc(x + 4.5 * u, y + 2.5 * u, 2.6 * u, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = OSCURO;
      c.beginPath();
      c.arc(x + 4.5 * u, y + 2.5 * u, 0.9 * u, 0, Math.PI * 2);
      c.fill();
    },
    santuario(c, x, y, u, col) {
      // dos piedras paradas y el dintel
      pol(c, [x - 5.5 * u, y + 5 * u, x - 5 * u, y - 3 * u, x - 2.5 * u, y - 3 * u, x - 2.5 * u, y + 5 * u], col);
      pol(c, [x + 2.5 * u, y + 5 * u, x + 2.5 * u, y - 3 * u, x + 5 * u, y - 3 * u, x + 5.5 * u, y + 5 * u], col);
      pol(c, [x - 6.5 * u, y - 3 * u, x - 6 * u, y - 5.5 * u, x + 6 * u, y - 5.5 * u, x + 6.5 * u, y - 3 * u], CLARO);
      pol(c, [x, y - 1 * u, x + 1.5 * u, y + 1.5 * u, x, y + 4 * u, x - 1.5 * u, y + 1.5 * u], RUNICO);
    },
    salon(c, x, y, u, col) {
      // salón largo con el techo quebrado y humo
      pol(c, [x - 6.5 * u, y, x - 3 * u, y - 5 * u, x - 0.5 * u, y - 2 * u, x + 2 * u, y - 5 * u, x + 6.5 * u, y], col);
      pol(c, [x - 5.5 * u, y, x + 5.5 * u, y, x + 5.5 * u, y + 5 * u, x - 5.5 * u, y + 5 * u], "#3A2E28");
      linea(c, [x - 3 * u, y + 5 * u, x - 3 * u, y + 1 * u], ROJO, 1.2 * u);
      linea(c, [x + 2 * u, y + 5 * u, x + 3 * u, y + 1.5 * u], ROJO, 1.2 * u);
    },
    tumulo(c, x, y, u, col) {
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(x, y + 3 * u, 7 * u, 6 * u, 0, Math.PI, 0);
      c.fill();
      pol(c, [x - 2 * u, y + 3.5 * u, x - 2 * u, y - 0.5 * u, x, y - 1.8 * u, x + 2 * u, y - 0.5 * u, x + 2 * u, y + 3.5 * u], OSCURO);
      pol(c, [x - 8 * u, y + 3.5 * u, x + 8 * u, y + 3.5 * u, x + 8 * u, y + 5 * u, x - 8 * u, y + 5 * u], col);
    },
    torre(c, x, y, u, col) {
      pol(c, [x - 3 * u, y + 6 * u, x - 2.4 * u, y - 4 * u, x + 2.4 * u, y - 4 * u, x + 3 * u, y + 6 * u], col);
      pol(c, [x - 3.6 * u, y - 4 * u, x, y - 7.5 * u, x + 3.6 * u, y - 4 * u], CLARO);
      pol(c, [x - 0.8 * u, y - 1 * u, x + 0.8 * u, y - 1 * u, x + 0.8 * u, y + 1.5 * u, x - 0.8 * u, y + 1.5 * u], ORO);
      // el cuervo
      pol(c, [x + 3 * u, y - 6 * u, x + 6.5 * u, y - 7.5 * u, x + 5 * u, y - 5.5 * u, x + 6.5 * u, y - 4 * u], OSCURO);
    },
    caravana(c, x, y, u, col) {
      pol(c, [x - 6 * u, y + 1 * u, x - 6 * u, y - 3 * u, x - 3 * u, y - 6 * u, x + 3 * u, y - 6 * u, x + 6 * u, y - 3 * u, x + 6 * u, y + 1 * u], col);
      [-3.5, 3.5].forEach((dx) => {
        c.strokeStyle = CLARO;
        c.lineWidth = 1.3 * u;
        c.beginPath();
        c.arc(x + dx * u, y + 3 * u, 2.2 * u, 0, Math.PI * 2);
        c.stroke();
      });
    },
    campamento(c, x, y, u, col) {
      // el tótem de las criaturas: palo con un cráneo de cuernos
      linea(c, [x, y + 6 * u, x, y - 2 * u], "#7A5634", 1.6 * u);
      pol(c, [x - 3 * u, y - 2 * u, x - 3 * u, y - 6 * u, x + 3 * u, y - 6 * u, x + 3 * u, y - 2 * u, x, y], col);
      pol(c, [x - 3 * u, y - 5 * u, x - 6.5 * u, y - 8 * u, x - 4 * u, y - 4 * u], CLARO);
      pol(c, [x + 3 * u, y - 5 * u, x + 6.5 * u, y - 8 * u, x + 4 * u, y - 4 * u], CLARO);
      pol(c, [x - 2 * u, y - 4.5 * u, x - 0.6 * u, y - 4.5 * u, x - 0.6 * u, y - 3.2 * u, x - 2 * u, y - 3.2 * u], OSCURO);
      pol(c, [x + 0.6 * u, y - 4.5 * u, x + 2 * u, y - 4.5 * u, x + 2 * u, y - 3.2 * u, x + 0.6 * u, y - 3.2 * u], OSCURO);
    },
    claro(c, x, y, u, col) {
      // las astas del ciervo
      linea(c, [x - 1 * u, y + 5 * u, x - 2 * u, y - 1 * u, x - 5.5 * u, y - 5 * u], col, 1.4 * u);
      linea(c, [x - 2 * u, y - 1 * u, x - 6 * u, y - 0.5 * u], col, 1.2 * u);
      linea(c, [x - 3.5 * u, y - 3 * u, x - 3 * u, y - 6.5 * u], col, 1.2 * u);
      linea(c, [x + 1 * u, y + 5 * u, x + 2 * u, y - 1 * u, x + 5.5 * u, y - 5 * u], col, 1.4 * u);
      linea(c, [x + 2 * u, y - 1 * u, x + 6 * u, y - 0.5 * u], col, 1.2 * u);
      linea(c, [x + 3.5 * u, y - 3 * u, x + 3 * u, y - 6.5 * u], col, 1.2 * u);
    },
    paso(c, x, y, u, col) {
      // dos montañas y el paso entre ellas
      pol(c, [x - 7 * u, y + 5 * u, x - 3 * u, y - 5 * u, x, y + 1 * u, x + 3 * u, y - 6 * u, x + 7 * u, y + 5 * u], col);
      pol(c, [x - 3 * u, y - 5 * u, x - 1.8 * u, y - 2 * u, x - 4 * u, y - 2.5 * u], CLARO);
      pol(c, [x + 3 * u, y - 6 * u, x + 4.4 * u, y - 3 * u, x + 1.8 * u, y - 3 * u], CLARO);
    },
    mazmorra(c, x, y, u, col) {
      // la boca de piedra con los escalones que bajan y la luz de adentro
      pol(c, [x - 7 * u, y + 5 * u, x - 6 * u, y - 2 * u, x - 3 * u, y - 6 * u, x + 3 * u, y - 6 * u, x + 6 * u, y - 2 * u, x + 7 * u, y + 5 * u], col);
      pol(c, [x - 3.6 * u, y + 5 * u, x - 3.6 * u, y - 1 * u, x - 1.6 * u, y - 3.4 * u, x + 1.6 * u, y - 3.4 * u, x + 3.6 * u, y - 1 * u, x + 3.6 * u, y + 5 * u], OSCURO);
      [1.2, 3].forEach((dy) => linea(c, [x - 2.6 * u, y + dy * u, x + 2.6 * u, y + dy * u], "#FF8D71", 0.9 * u));
    },
    barca(c, x, y, u, col) {
      // el casco con la proa alta y la vela
      pol(c, [x - 7 * u, y + 1 * u, x + 7 * u, y + 1 * u, x + 4.5 * u, y + 4.5 * u, x - 4.5 * u, y + 4.5 * u], col);
      pol(c, [x + 5.5 * u, y + 1.5 * u, x + 7.5 * u, y - 3 * u, x + 6.6 * u, y + 1.5 * u], col);
      linea(c, [x, y + 1 * u, x, y - 7 * u], OSCURO, 1 * u);
      pol(c, [x - 4 * u, y - 6 * u, x + 4 * u, y - 6 * u, x + 3.4 * u, y - 0.6 * u, x - 3.4 * u, y - 0.6 * u], CLARO);
    },
    lugar(c, x, y, u, col) {
      pol(c, [x, y - 5 * u, x + 4 * u, y, x, y + 5 * u, x - 4 * u, y], col);
    },
    altar(c, x, y, u, col, op) {
      pol(c, [x - 6 * u, y + 3 * u, x + 6 * u, y + 3 * u, x + 5 * u, y + 5.5 * u, x - 5 * u, y + 5.5 * u], GRIS);
      FUTHARK.dibujar(c, op.runa || "algiz", x, y + 1.5 * u, 9 * u, col, 1.6 * u);
    },
    piedra(c, x, y, u, col, op) {
      // menhir con su runa
      pol(c, [x - 3.5 * u, y + 6 * u, x - 3 * u, y - 4 * u, x - 0.8 * u, y - 7 * u, x + 2 * u, y - 6 * u, x + 3.6 * u, y - 3 * u, x + 3.6 * u, y + 6 * u], "#565A62");
      FUTHARK.dibujar(c, op.runa || "ansuz", x, y + 4 * u, 8 * u, col, 1.4 * u);
    },
    piedraCamino(c, x, y, u, col) {
      pol(c, [x - 4 * u, y + 6 * u, x - 4.2 * u, y - 2 * u, x - 2.6 * u, y - 5.5 * u, x, y - 6.5 * u, x + 2.6 * u, y - 5.6 * u, x + 4 * u, y - 2.5 * u, x + 4 * u, y + 6 * u], "#6A6660");
      c.strokeStyle = col;
      c.lineWidth = 1.2 * u;
      c.beginPath();
      c.moveTo(x - 2.6 * u, y + 5 * u);
      c.lineTo(x - 2.8 * u, y - 2 * u);
      c.quadraticCurveTo(x, y - 6 * u, x + 2.8 * u, y - 2 * u);
      c.lineTo(x + 2.6 * u, y + 5 * u);
      c.stroke();
    },
    cofre(c, x, y, u, col) {
      pol(c, [x - 5 * u, y + 4 * u, x - 5 * u, y - 1 * u, x + 5 * u, y - 1 * u, x + 5 * u, y + 4 * u], col);
      pol(c, [x - 5 * u, y - 1 * u, x - 4 * u, y - 4.5 * u, x + 4 * u, y - 4.5 * u, x + 5 * u, y - 1 * u], ROSA);
      pol(c, [x - 0.9 * u, y - 1.5 * u, x + 0.9 * u, y - 1.5 * u, x + 0.9 * u, y + 1.5 * u, x - 0.9 * u, y + 1.5 * u], OSCURO);
    },
    // un mercader (comercio.js): la bolsa de plata atada con la runa Fehu
    mercader(c, x, y, u, col) {
      pol(c, [x - 4.5 * u, y + 4.5 * u, x - 5 * u, y, x - 2 * u, y - 3 * u, x + 2 * u, y - 3 * u, x + 5 * u, y, x + 4.5 * u, y + 4.5 * u], col);
      pol(c, [x - 2 * u, y - 3 * u, x - 3 * u, y - 5.5 * u, x + 3 * u, y - 5.5 * u, x + 2 * u, y - 3 * u], ROSA);
      linea(c, [x - 1 * u, y + 3 * u, x - 1 * u, y - 1 * u, x + 1.5 * u, y - 0.5 * u], OSCURO, 0.9 * u);
      linea(c, [x - 1 * u, y + 1 * u, x + 1.5 * u, y + 1.5 * u], OSCURO, 0.9 * u);
    },
    // un contrato de caza (contratos.js): el pergamino clavado con las tres rayas de la garra
    contrato(c, x, y, u, col) {
      pol(c, [x - 4 * u, y - 5 * u, x + 4 * u, y - 5 * u, x + 4.5 * u, y + 5 * u, x - 4.5 * u, y + 5 * u], CLARO);
      for (let k = -1; k <= 1; k++) linea(c, [x + (k * 2 - 1) * u, y - 3 * u, x + (k * 2 + 1) * u, y + 3 * u], col, 1 * u);
    },
    // un instructor (instructores.js): dos espadas de práctica cruzadas sobre un escudo redondo
    instructor(c, x, y, u, col) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x, y, 4.2 * u, 0, Math.PI * 2);
      c.fill();
      linea(c, [x - 4 * u, y - 4 * u, x + 4 * u, y + 4 * u], CLARO, 1.2 * u);
      linea(c, [x + 4 * u, y - 4 * u, x - 4 * u, y + 4 * u], CLARO, 1.2 * u);
    },
    // una némesis (nemesis.js): la corona roja de tres puntas
    nemesis(c, x, y, u, col) {
      pol(c, [x - 5.5 * u, y + 4 * u, x - 5.5 * u, y - 3 * u, x - 2.6 * u, y, x, y - 5.5 * u, x + 2.6 * u, y, x + 5.5 * u, y - 3 * u, x + 5.5 * u, y + 4 * u], col);
      pol(c, [x, y - 5.5 * u, x + 2.6 * u, y, x + 5.5 * u, y - 3 * u, x + 5.5 * u, y + 4 * u, x, y + 4 * u], "#FF8D71");
    },
    // una guarida de los Sin Linde (bandidos.js): la linde partida, un rombo cortado por una raya
    bandidos(c, x, y, u, col) {
      pol(c, [x, y - 6 * u, x + 4.8 * u, y, x, y + 6 * u, x - 4.8 * u, y], col);
      pol(c, [x, y - 6 * u, x + 4.8 * u, y, x, y + 6 * u], "#FF8D71");
      linea(c, [x - 5.5 * u, y + 3 * u, x + 5.5 * u, y - 3 * u], "#111111", 1.6 * u);
    },
    // un hörgr de los dioses (santuarios.js): dos lajas y la estela con la marca del dios
    horgr(c, x, y, u, col) {
      pol(c, [x - 6 * u, y + 5 * u, x + 6 * u, y + 5 * u, x + 5 * u, y + 2.5 * u, x - 5 * u, y + 2.5 * u], "#8E8A86");
      pol(c, [x - 2.6 * u, y + 2.5 * u, x - 2.2 * u, y - 5 * u, x, y - 6.2 * u, x + 2.2 * u, y - 5 * u, x + 2.6 * u, y + 2.5 * u], "#B4B0AA");
      linea(c, [x, y + 1 * u, x, y - 4 * u], col, 1.2 * u);
      linea(c, [x - 1.4 * u, y - 2.6 * u, x + 1.4 * u, y - 0.6 * u], col, 1 * u);
    },
    manzano(c, x, y, u, col) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x, y + 1 * u, 4.6 * u, 0, Math.PI * 2);
      c.fill();
      linea(c, [x, y - 3 * u, x + 1 * u, y - 6 * u], "#7A5634", 1.2 * u);
      pol(c, [x + 1 * u, y - 5 * u, x + 4.5 * u, y - 6.5 * u, x + 2.5 * u, y - 4 * u], "#7BC86C");
    },
    // los lugares místicos (vida.js): el fresno, el anillo de hongos o la poza con su estrella
    mistico(c, x, y, u, col, op) {
      if (op.forma === "anilloAlfar") {
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          c.fillStyle = col;
          c.beginPath();
          c.arc(x + Math.cos(a) * 4.6 * u, y + Math.sin(a) * 3 * u, 1.3 * u, 0, Math.PI * 2);
          c.fill();
        }
      } else if (op.forma === "pozaEstrellas") {
        c.fillStyle = "#14202E";
        c.beginPath();
        c.ellipse(x, y + 1 * u, 6 * u, 3.6 * u, 0, 0, Math.PI * 2);
        c.fill();
        pol(c, [x, y - 2.6 * u, x + 1.6 * u, y + 0.8 * u, x, y + 4 * u, x - 1.6 * u, y + 0.8 * u], col);
      } else {
        pol(c, [x - 1.4 * u, y + 5 * u, x - 1 * u, y - 1 * u, x + 1 * u, y - 1 * u, x + 1.4 * u, y + 5 * u], "#9A927E");
        c.fillStyle = col;
        c.beginPath();
        c.arc(x, y - 2.5 * u, 4.4 * u, 0, Math.PI * 2);
        c.fill();
        pol(c, [x, y - 4.6 * u, x + 1.2 * u, y - 2.6 * u, x, y - 0.6 * u, x - 1.2 * u, y - 2.6 * u], CLARO);
      }
    },
    puente(c, x, y, u, col) {
      pol(c, [x - 7 * u, y - 1 * u, x + 7 * u, y - 1 * u, x + 7 * u, y + 1 * u, x - 7 * u, y + 1 * u], col);
      for (let k = -6; k <= 6; k += 3) linea(c, [x + k * u, y + 1 * u, x + k * u, y + 4.5 * u], col, 1 * u);
      linea(c, [x - 7 * u, y + 5 * u, x + 7 * u, y + 5 * u], RUNICO, 1.2 * u);
    },
  };
  // el color de cada miniatura por defecto
  const COLOR = { ciudad: ROSA, casa: "#9C2315", puesto: "#C8402D", aserradero: "#9C2315", santuario: "#8A8478", salon: "#5E4A36", tumulo: "#5C6448", torre: "#6A6660", caravana: "#7A5634", campamento: ROJO, claro: "#C9A0F0", paso: "#6A6660", lugar: ROSA, altar: ORO, piedra: RUNICO, piedraCamino: "#C8402D", cofre: ORO, manzano: "#F5A524", mistico: "#8CF0B4", mercader: ORO, contrato: "#C8402D", instructor: "#FFD98A", horgr: "#C8402D", nemesis: "#C8402D", bandidos: "#9C2315", puente: "#B89A6E" };

  function dibujar(c, tipo, x, y, r, op = {}) {
    const f = DIBUJOS[tipo] || DIBUJOS.lugar;
    const col = op.apagado ? "#4A4844" : op.col || COLOR[tipo] || ROSA;
    c.save();
    if (op.disco !== false) disco(c, x, y, r, op.borde || (op.apagado ? null : col));
    if (op.apagado) c.globalAlpha *= 0.75;
    f(c, x, y, r / 10, col, op);
    c.restore();
  }
  return { dibujar, TIPOS: Object.keys(DIBUJOS), COLOR };
})();
