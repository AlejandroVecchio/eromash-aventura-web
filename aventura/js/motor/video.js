// ---------- el modo cámara para grabar videos (sistema VIDEO) ----------
// Pedido de Alejandro (2/11/2026, la fábrica de videos para redes): con ?video=1 la aventura se ve limpia para
// grabar tomas: sin interfaz (?video=hud la deja), sin cursor, Eromash no muere, y se puede pedir una escena armada
// (?escena=…), un giro lento de la cámara (?barrido=grados por segundo), un piloto que pelea solo (?piloto=1) y
// que Eromash pase a través de árboles y cercas (?atravesar=1), y con ?arma=<base> arranca con esa arma puesta.
// Se combina con lo que ya existe: ?jugar=9 (ranura de prueba), ?ver=lugar, ?en=x,y, ?hora=22, ?clima=lluvia,
// ?zona=id, ?eikholt=1, ?giro=45, ?lejos=1.4, ?lang=en. El encuadre vertical lo da la ventana (540 × 960 en
// herramientas/grabar.cjs). Las escenas son las entradas de Probar mecánicas (PROBAR.GRUPOS) por su id:
// muneco, jotunn, trueno, caceria, grupo:lobos, grupo:draugr…, gesto:tesoro, zona:<id>, y las de oficios.
// No escribe nada que vea el jugador: es una herramienta, no tiene textos.
window.VIDEO = (function () {
  "use strict";
  const q = new URLSearchParams(location.search);
  const modo = q.get("video"),
    activo = !!modo && modo !== "0";
  let A = null,
    J = null,
    jug = null,
    barrido = Number(q.get("barrido")) || 0, // grados por segundo
    giro0 = 0,
    tGiro = 0,
    piloto = q.get("piloto") === "1" || q.get("piloto") === "paseo",
    paseo = q.get("piloto") === "paseo", // ?piloto=paseo: solo pasea, no va a pelear
    atravesar = q.get("atravesar") === "1", // Eromash pasa a través de los obstáculos (no queda trabado contra un árbol)
    armaPedida = q.get("arma"), // ?arma=<base de OBJETOS>: le da y le pone esa arma (común, de calidad media) al arrancar
    listo = false,
    tListo = 0;

  // ---------- la interfaz ----------
  function interfaz(ver) {
    document.body.classList.toggle("modo-video", !ver);
  }
  if (activo) {
    const st = document.createElement("style");
    st.textContent = "body.modo-video .ui,body.modo-video .capa,body.modo-video #cartelLugar{visibility:hidden!important}body.modo-video,body.modo-video canvas{cursor:none!important}";
    document.head.appendChild(st);
    const poner = () => interfaz(modo === "hud");
    if (document.body) poner();
    else addEventListener("DOMContentLoaded", poner);
  }

  // ---------- el mando virtual del piloto ----------
  // El piloto maneja a Eromash como un jugador con mando: el motor lo lee por navigator.getGamepads, así la
  // animación, el combo, el auto-apuntado y el sonido son los de siempre.
  const pad = { connected: true, id: "video", axes: [0, 0, 0, 0], buttons: Array.from({ length: 18 }, () => ({ pressed: false, value: 0 })) };
  const boton = (i, v) => ((pad.buttons[i].pressed = v), (pad.buttons[i].value = v ? 1 : 0));
  if (activo && piloto) {
    const orig = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : () => [];
    navigator.getGamepads = () => (piloto ? [pad] : orig());
  }
  let tAtk = 0;
  function pilotar(dt) {
    pad.axes[0] = pad.axes[1] = 0;
    boton(2, false);
    if (J.modo !== "juego") return; // también en Eikholt y adentro: el palo anda igual
    const enemigos = (window.JUEGO && JUEGO.enemigos) || [];
    let obj = null,
      dm = 1600;
    enemigos.forEach((e) => {
      if (e.muerto) return;
      const d = Math.hypot(e.x - jug.x, e.y - jug.y);
      if (d < dm) (dm = d), (obj = e);
    });
    if (!obj || paseo) {
      // sin nadie cerca: pasea en una vuelta amplia, que también luce en cámara
      const a = J.t * 0.35;
      return mover(Math.cos(a), Math.sin(a) * 0.7, 0.55);
    }
    if (dm > 95) mover(obj.x - jug.x, obj.y - jug.y, 1);
    else {
      // de cerca: el combo de tres golpes, con un respiro entre tandas
      tAtk = (tAtk + dt) % 1.6;
      boton(2, tAtk < 1.1 && tAtk % 0.36 < 0.18);
    }
  }
  // el palo del mando habla en pantalla: con la cámara girada se pasa del mundo a la vista
  function mover(dx, dy, fuerza) {
    const l = Math.hypot(dx, dy) || 1,
      g = (window.VOL && VOL.cam.g) || J.giro || 0; // al revés de VOL.ejeMundo
    let x = dx / l,
      y = dy / l;
    [x, y] = [x * Math.cos(g) - y * Math.sin(g), x * Math.sin(g) + y * Math.cos(g)];
    pad.axes[0] = x * fuerza;
    pad.axes[1] = y * fuerza;
  }

  // ---------- las escenas ----------
  // busca una entrada de Probar mecánicas: «jotunn», «grupo:lobos», «gesto:tesoro», «zona:cripta»
  function buscarEscena(nombre) {
    if (!window.PROBAR || !nombre) return null;
    const [id, arg] = nombre.split(":");
    if (id === "gesto" && window.ANIMA) return { fn: () => ANIMA.gesto(arg, 0, arg === "tesoro" ? { col: "#F5A524" } : {}) };
    if (id === "zona" && window.ZONAS) return { fn: () => ZONAS.entrar(arg) };
    for (const gr of PROBAR.GRUPOS) {
      const e = gr.lista().find((e) => e.si && e.id === id && (!arg || e.fam === arg));
      if (e) return e;
    }
    return null;
  }
  function escena(nombre) {
    const e = buscarEscena(nombre);
    if (!e) return false;
    e.fn();
    return true;
  }

  // ---------- el sistema ----------
  const sistema = {
    enLienzo: true,
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      giro0 = J.giro || 0;
      if (activo && atravesar) J.atravesar = true;
    },
    actualizar(dt) {
      if (!activo || !J) return;
      if (J.modo === "juego" && !listo && (tListo += dt) > 1.2) {
        listo = true;
        if (armaPedida && window.OBJETOS && OBJETOS.BASES[armaPedida] && window.BOTIN) {
          BOTIN.dar(OBJETOS.generar({ base: armaPedida, r: 0, n: 10, q: 0.5, rnd: OBJETOS.azar(7) }), { silencio: true });
          BOTIN.equipar(BOTIN.estado().bolsa.length - 1);
        }
        const es = q.get("escena");
        if (es) escena(es);
      }
      if (barrido) {
        tGiro += dt;
        J.giro = giro0 + (tGiro * barrido * Math.PI) / 180;
      }
      // para grabar, Eromash no cae (ni se ve el borde rojo de poca vida)
      if (jug && !jug.muerto) jug.hp = jug.hpMax;
      if (piloto) pilotar(dt);
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return {
    sistema,
    activo,
    limpio: activo && modo !== "hud", // juego.js no dibuja el rombo de E, el haz del objetivo, las cuñas ni las flechas
    listo: () => listo,
    escena,
    buscarEscena,
    interfaz,
    barrido: (gps) => ((barrido = gps), (tGiro = 0), J && (giro0 = J.giro || 0)),
    piloto: (si) => (piloto = !!si),
  };
})();
