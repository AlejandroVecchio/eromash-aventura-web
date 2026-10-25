// Pruebas de los atributos (motor/atributos.js).
(window.PRUEBAS = window.PRUEBAS || []).push(
  { nombre: "atributos: cada nivel da 3 puntos y Vigor suma vida", fn: async (A, { igual, si }) => {
    JUEGO.empezar(9, true);
    RPG.dar(RPG.xpPara(1) + RPG.xpPara(2));
    igual(RPG.nivel(), 3, "nivel 3:");
    igual(ATRIBUTOS.libres(), 6, "6 puntos libres:");
    const vida0 = A.jug.hpMax;
    INVENTARIO.abrir("atributos");
    const botones = [...document.querySelectorAll(".at-fila")][2].querySelectorAll(".at-boton");
    botones[1].click();
    botones[1].click();
    igual(A.jug.hpMax, vida0, "el borrador no cambia nada todavía:");
    [...document.querySelectorAll(".at-confirmar")][0].click();
    igual(A.jug.hpMax, vida0 + 10, "2 de vigor = +10 de vida:");
    igual(ATRIBUTOS.libres(), 4, "quedan 4:");
    INVENTARIO.cerrar();
  } },
  { nombre: "atributos: reacomodar devuelve los puntos", fn: async (A, { igual }) => {
    INVENTARIO.abrir("atributos");
    const re = () => [...document.querySelectorAll(".at-acciones button")][1].click();
    re();
    re();
    igual(ATRIBUTOS.libres(), 6, "todos de vuelta:");
    igual(ATRIBUTOS.estado().reacomodos, 1, "uno usado:");
    INVENTARIO.cerrar();
  } },
  { nombre: "atributos: Fuerza sube el daño", fn: async (A, { si }) => {
    const d0 = A.J.mulDano;
    ATRIBUTOS.estado().fue = 4;
    RPG.recalcular();
    si(Math.abs(A.J.mulDano / d0 - 1.06) < 0.001, "4 de fuerza = +6 %");
    ATRIBUTOS.estado().fue = 0;
    RPG.recalcular();
  } },
);
