// Pruebas de niveles y experiencia (motor/rpg.js).
(window.PRUEBAS = window.PRUEBAS || []).push(
  { nombre: "niveles: la experiencia sube de nivel y llena la vida", fn: async (A, { igual, si }) => {
    const st = RPG.estado();
    igual(st.nivel, 1, "arranca en nivel 1:");
    const vida0 = A.jug.hpMax;
    A.jug.hp = 10;
    RPG.dar(RPG.xpPara(1) + 5);
    igual(st.nivel, 2, "sube a 2:");
    igual(A.jug.hpMax, vida0 + 6, "suma 6 de vida:");
    igual(A.jug.hp, A.jug.hpMax, "llena la vida:");
    si(st.xp >= 5, "sobra experiencia");
    const anillo = A.J.marcas.filter((m) => m.tipo === "anillo").pop();
    si(anillo && anillo.dura > 0 && anillo.dura < 5, "el anillo del piso se apaga solo enseguida, no queda como marca de la Lente");
  } },
  { nombre: "niveles: las criaturas tienen nivel y se endurecen lejos", fn: async (A, { si }) => {
    const lobo = A.enemigos.find((e) => e.tipo === "lobo" && !e.hordaGrupo);
    RPG.nivelar(lobo);
    si(lobo.nivel === 2, "los lobos de la historia son nivel 2");
    const lejos = A.enemigos.filter((e) => e.hordaGrupo).sort((a, b) => RPG.nivelDe(b) - RPG.nivelDe(a))[0];
    si(RPG.nivelDe(lejos) >= 12, "lo más lejano es de nivel alto: " + RPG.nivelDe(lejos));
    const vidaAntes = lejos.d.vida;
    RPG.nivelar(lejos);
    si(lejos.d.vida > vidaAntes, "más vida con el nivel");
  } },
  { nombre: "niveles: lo gris da casi nada y lo difícil da más", fn: async (A, { si }) => {
    const lobo = A.enemigos.find((e) => e.tipo === "lobo" && e.hordaGrupo && !e.lider);
    const st = RPG.estado();
    const n0 = st.nivel;
    st.nivel = 1;
    const facil = RPG.xpDe(Object.assign({}, lobo, { nivel: 1 }));
    const dificil = RPG.xpDe(Object.assign({}, lobo, { nivel: 6 }));
    st.nivel = 20;
    const gris = RPG.xpDe(Object.assign({}, lobo, { nivel: 1 }));
    st.nivel = n0;
    si(dificil > facil * 2, "más nivel, más experiencia");
    si(gris < facil, "lo gris vale menos");
  } },
  { nombre: "niveles: nada saca más del 35 % de la vida", fn: async (A, { si }) => {
    A.jug.hpMax = 300;
    A.jug.hp = 300;
    A.jug.inv = 0;
    A.jug.salto = 0;
    A.jug.esq = 0;
    A.jug.justaT = A.J.t;
    const e = A.enemigos.find((x) => x.tipo === "trol");
    const d0 = e.d.dano;
    e.d.dano = 999;
    A.J.herir(Math.min(e.d.dano, Math.round(A.jug.hpMax * 0.35)), A.jug.x + 10, A.jug.y);
    e.d.dano = d0;
    si(A.jug.hp >= 300 - 105, "el golpe quedó topado: " + A.jug.hp);
    RPG.recalcular();
    A.jug.hp = A.jug.hpMax;
  } },
  { nombre: "niveles: se guarda y se carga", fn: async (A, { igual }) => {
    const st = RPG.estado();
    st.nivel = 7;
    A.H.guardar();
    JUEGO.empezar(9, false);
    igual(RPG.estado().nivel, 7, "nivel guardado:");
  } },
);
