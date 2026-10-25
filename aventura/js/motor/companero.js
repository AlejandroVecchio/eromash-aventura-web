// ---------- Skuggi, el perro compañero (sistema COMPANERO) ----------
// Como el perro de Fable, Perro Albóndiga de Fallout, los compañeros de Skyrim y Dogmeat: junto a un camino que sale
// del Puesto hay un perro herido que rondan tres lobos. Sacándole los lobos de encima y atendiéndolo (E), Skuggi va
// con Eromash: lo sigue, corre a morder a lo que lo ataca, salta fuera de los avisos del piso y nunca muere (cuando se
// cansa vuelve jadeando). Con E cerca de él se le habla: acariciarlo (una vez por día), quedate acá / seguime y buscá.
// El vínculo crece con cada mordisco, cada criatura que caen juntos y cada caricia, y con él los trucos (TRUCOS):
//   1 muerde · 2 derriba (cada tercer mordisco tira a las chicas) · 3 olfato (ladra cuando huele a una criatura
//   que no te vio y escarba algo una vez por día) · 4 aullido (con tu vida baja espanta a las chicas, cada minuto)
//   · 5 lealtad (+5 % de daño con él al lado).
// Adentro de las casas espera afuera; si queda lejos (viajes), vuelve solo. Estado en E.extra.companero =
// { rescatado, vinculo, acariciado, buscado, mordiscos, hallazgos, quieto: [x, y] | null }. Textos `cp.`.
window.COMPANERO = (function () {
  "use strict";
  let A, J, jug, W;
  const t = (k, v) => I18N.t(k, v);
  const NIVELES = [0, 40, 120, 260, 480],
    TRUCOS = 5,
    VEL = 270,
    CORRE = 400,
    ALCANCE_PELEA = 460,
    MORDER = 1.0,
    LEJOS = 1000,
    HABLAR = 110;
  const base = () => ({ rescatado: false, vinculo: 0, acariciado: -1, buscado: -1, mordiscos: 0, hallazgos: 0, quieto: null });
  let st = base();
  let lugar = null, // dónde estaba herido
    perro = null, // { x, y, vx, vy, mira, mov, estado, obj, mord, golpe, aguante, ladra, quieto, atasco, sentado }
    lobos = null,
    colocar = false,
    olidas = [], // { e, t }
    ultLadrido = -9,
    ultAullido = -99,
    estabaDentro = false;
  const dia = () => Math.floor(A.H.E.tiempo / LUZ.DIA);
  const nivel = () => NIVELES.filter((n) => st.vinculo >= n).length;
  const sabe = (k) => st.rescatado && nivel() >= k;
  const sigue = () => st.rescatado && !st.quieto;
  const nivelJug = () => (window.RPG ? RPG.nivel() : 1);

  // ---------- dónde está herido: junto a un camino que sale del Puesto ----------
  function buscarLugar() {
    const L = W.LUGARES.puesto,
      cands = [];
    W.CAMINOS.forEach((c) => {
      for (let i = 0; i < c.p.length - 1; i++) {
        const a = c.p[i],
          b = c.p[i + 1],
          l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        for (let u = 0; u <= l; u += 80) {
          const x = a[0] + ((b[0] - a[0]) / l) * u,
            y = a[1] + ((b[1] - a[1]) / l) * u,
            d = Math.hypot(x - L.p[0], y - L.p[1]);
          if (d < L.r + 2400 || d > L.r + 5200) continue;
          const nx = -(b[1] - a[1]) / l,
            ny = (b[0] - a[0]) / l;
          [1, -1].forEach((lado) => cands.push({ x: x + nx * lado * (c.w / 2 + 170), y: y + ny * lado * (c.w / 2 + 170), d }));
        }
      }
    });
    cands.sort((p, q) => p.d - q.d);
    const casa = window.CASA && CASA.casa();
    const ok = (x, y) =>
      [[0, 0], [-340, 0], [340, 0], [0, 260], [0, -240]].every(([dx, dy]) => W.sueloEn(x + dx, y + dy) === 0) &&
      Object.keys(W.LUGARES).every((k) => Math.hypot(x - W.LUGARES[k].p[0], y - W.LUGARES[k].p[1]) > W.LUGARES[k].r + 400) &&
      W.CAMINOS.every((c) => W.distLinea(x, y, c.p) > c.w / 2 + 80) &&
      (!window.HORDAS || HORDAS.grupos.every((g) => Math.hypot(g.centro[0] - x, g.centro[1] - y) > 1500)) &&
      (!casa || Math.hypot(casa.x - x, casa.y - y) > 1500) &&
      W.libre(x, y, 30) &&
      W.libre(x + 60, y, 20) &&
      despejado(x, y);
    // sin cosas armadas cerca (atriles, estandartes, letreros…): lo que no es bosque
    function despejado(x, y) {
      let si = true;
      W.cercanas(x - 420, y - 320, x + 420, y + 320, (o) => {
        if (Math.abs(o.x - x) > 420 || Math.abs(o.y - y) > 320) return;
        if (!o.oculto && !o.arbol && o.id !== "roca" && o.id !== "troncoCaido" && (o.choque || (ASSETS.LISTA[o.id] || {}).figura)) si = false;
      });
      return si;
    }
    const p = cands.find((q) => ok(q.x, q.y));
    return p ? [Math.round(p.x), Math.round(p.y)] : [L.p[0] + L.r + 2600, L.p[1]];
  }

  // ---------- el rescate ----------
  function emboscada() {
    lobos = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.9,
        x = lugar[0] + Math.cos(a) * 260,
        y = lugar[1] + Math.sin(a) * 190;
      const e = A.CB.crear("lobo", x, y, { pal: k % 3 });
      e.activo = true;
      e.estado = "persigue";
      e.companero = true;
      A.enemigos.push(e);
      lobos.push(e);
    }
    HUD.aviso(t("cp.lobos"), "#C8402D", t("cp.herido"));
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.5, tono: 1.2, x: lugar[0], y: lugar[1] });
  }
  function sacarLobos() {
    for (let i = A.enemigos.length - 1; i >= 0; i--) if (A.enemigos[i].companero) A.enemigos.splice(i, 1);
    lobos = null;
  }
  function atender() {
    if (lobos && lobos.some((e) => !e.muerto)) return HUD.aviso(t("cp.antes_lobos"), "#C8402D");
    st.rescatado = true;
    sacarLobos();
    perro.estado = "sigue";
    perro.sentado = false;
    A.dialogoLibre([["eromash", "cp.atendido"]], () => HUD.aviso(t("cp.se_suma_d"), "#B8AC9C", t("cp.se_suma")));
    if (window.ANIMA) ANIMA.gesto("feliz");
    if (window.VIDA) VIDA.evento("sanar", perro.x, perro.y, {});
    if (window.RPG) RPG.recalcular();
  }

  // ---------- el vínculo ----------
  function sumar(n) {
    const antes = nivel();
    st.vinculo += n;
    const ahora = nivel();
    if (ahora > antes) {
      HUD.aviso(t("cp.t" + ahora + "_d"), "#B8AC9C", t("cp.truco_nuevo", [t("cp.t" + ahora)]));
      if (window.SONIDO) SONIDO.tocar("mision", { vol: 0.4, tono: 1.2 });
      if (window.RPG) RPG.recalcular();
    }
  }
  function acariciar() {
    if (st.acariciado === dia()) return;
    st.acariciado = dia();
    sumar(15);
    perro.cola = 3;
    perro.sentado = true;
    A.textoFlotante(perro.x, perro.y - 90, "♥", "#E0B2B2");
    HUD.aviso(t("cp.acariciado"), "#E0B2B2");
    if (window.ANIMA) ANIMA.gesto("feliz");
  }
  function quedarse() {
    st.quieto = [Math.round(perro.x), Math.round(perro.y)];
    perro.estado = "quieto";
    perro.sentado = true;
    HUD.aviso(t("cp.quieto_ok"), "#B8AC9C");
    if (window.RPG) RPG.recalcular();
  }
  function seguir() {
    st.quieto = null;
    perro.estado = "sigue";
    perro.sentado = false;
    if (window.RPG) RPG.recalcular();
  }
  function llamar() {
    if (!st.rescatado) return;
    seguir();
    ponerAlLado();
    HUD.aviso(t("cp.vuelve"), "#B8AC9C");
  }
  function buscar() {
    if (!sabe(3) || st.buscado === dia()) return false;
    st.buscado = dia();
    perro.estado = "busca";
    perro.t = 0;
    return true;
  }
  function hallazgo() {
    const r = DIB.azar(dia() * 17 + 3),
      dio = [];
    const plata = 10 + Math.floor(r() * 21) + nivelJug() * 2;
    PODERES.darPlata(plata);
    dio.push(t("cp.plata", [plata]));
    if (window.ALQUIMIA && r() < 0.6) {
      const H = Object.keys(ALQUIMIA.HIERBAS),
        h = H[Math.floor(r() * H.length)],
        al = ALQUIMIA.estado().hierbas;
      al[h] = (al[h] || 0) + 1;
      dio.push(t("aq.h_" + h));
    }
    if (window.MATERIALES && r() < 0.4) {
      MATERIALES.dar("cuero", 1);
      dio.push(t("mt.cuero"));
    }
    st.hallazgos++;
    sumar(3);
    HUD.aviso(t("cp.encontro", [dio.join(", ")]), "#B8AC9C");
  }
  function ordenes() {
    if (window.INVENTARIO && INVENTARIO.abierta()) INVENTARIO.cerrar();
    const n = nivel(),
      sig = n < TRUCOS ? t("cp.siguiente", [NIVELES[n] - st.vinculo]) : t("cp.maximo");
    const trucos = Array.from({ length: TRUCOS }, (_, i) => {
      const k = i + 1,
        si = n >= k;
      return `<div class="cp-truco${si ? "" : " apagado"}"><b>${t("cp.t" + k)}</b> · ${t("cp.t" + k + "_d")}</div>`;
    }).join("");
    const cerca = Math.hypot(perro.x - jug.x, perro.y - jug.y) < HABLAR * 2;
    const ops = [];
    if (cerca) ops.push({ texto: st.acariciado === dia() ? t("cp.ya_acariciado") : t("cp.acariciar"), fn: () => (A.cerrarMenu(), acariciar()) });
    if (cerca && !st.quieto) ops.push({ texto: t("cp.quieto"), fn: () => (A.cerrarMenu(), quedarse()) });
    if (st.quieto) ops.push({ texto: cerca ? t("cp.seguime") : t("cp.llamar"), fn: () => (A.cerrarMenu(), cerca ? seguir() : llamar()) });
    if (cerca && sabe(3) && !st.quieto) ops.push({ texto: st.buscado === dia() ? t("cp.buscar_no") : t("cp.buscar"), fn: () => (A.cerrarMenu(), buscar()) });
    ops.push({ texto: t("cp.cerrar"), fn: A.cerrarMenu });
    A.menu(`<h2>${t("cp.ordenes_t")}</h2><div class="sub">${t("cp.ordenes_d", [n, TRUCOS, sig])}</div><div class="cp-trucos">${trucos}</div>`, ops);
  }

  // ---------- el perro anda ----------
  function ponerAlLado() {
    const d = jug.dir || [0, 1];
    for (const [ox, oy] of [[-d[0] * 80 - 50, -d[1] * 60], [60, 40], [-60, 40], [0, 70], [0, -60]]) {
      if (W.libre(jug.x + ox, jug.y + oy, 12)) {
        perro.x = jug.x + ox;
        perro.y = jug.y + oy;
        return;
      }
    }
    perro.x = jug.x;
    perro.y = jug.y + 10;
  }
  function mirarHacia(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy) * 0.8) perro.mira = { vista: "E", espejo: dx < 0 };
    else perro.mira = { vista: dy > 0 ? "S" : "N", espejo: false };
  }
  function moverHacia(x, y, vel, dt) {
    const dx = x - perro.x,
      dy = y - perro.y,
      l = Math.hypot(dx, dy);
    if (l < 4) return 0;
    const v = Math.min(l, vel * dt),
      ux = (dx / l) * v,
      uy = (dy / l) * v;
    const antes = [perro.x, perro.y];
    if (W.libre(perro.x + ux, perro.y + uy, 12)) (perro.x += ux), (perro.y += uy);
    else if (W.libre(perro.x + ux, perro.y, 12)) perro.x += ux;
    else if (W.libre(perro.x, perro.y + uy, 12)) perro.y += uy;
    mirarHacia(dx, dy);
    const movido = Math.hypot(perro.x - antes[0], perro.y - antes[1]);
    perro.atasco = movido < v * 0.2 ? perro.atasco + dt : 0;
    return movido / Math.max(dt, 0.001) / CORRE;
  }
  const puedeMorder = (e) => e.activo && !e.muerto && !(e.d && e.d.blanco) && !e.companero && !e.holmr && e.tipo !== "muneco"; // en la piel del hólmr no se ayuda
  function elegirObjetivo() {
    let mejor = null,
      dm = Infinity;
    for (const e of A.enemigos) {
      if (!puedeMorder(e)) continue;
      const dj = Math.hypot(e.x - jug.x, e.y - jug.y);
      if (dj > ALCANCE_PELEA) continue;
      if (!(e.vio > 0 || e.estado === "persigue" || e.estado === "ataca" || e.aviso || e.vida < e.d.vida)) continue;
      const d = Math.hypot(e.x - perro.x, e.y - perro.y);
      if (d < dm) (dm = d), (mejor = e);
    }
    return mejor;
  }
  function morder(e) {
    perro.golpe = 1;
    perro.mord = MORDER;
    perro.aguante -= 12;
    const fuerte = e.d.jefe || e.patron || e.unico;
    const dano = Math.round((4 + nivelJug() * 1.6) * (1 + (nivel() - 1) * 0.1) * (fuerte ? 0.5 : 1));
    A.numero(e.x, e.y - 60, dano, "#B8AC9C");
    A.CB.golpear(J, e, dano, perro.x, perro.y, 0.25);
    st.mordiscos++;
    sumar(1);
    // derriba: cada tercer mordisco a las chicas
    if (sabe(2) && st.mordiscos % 3 === 0 && !e.muerto && !(e.d.pesado || e.lider || fuerte)) {
      e.aturdido = Math.max(e.aturdido || 0, 0.8);
      if (e.aviso) J.quitarAviso(e.aviso), (e.aviso = null);
    }
    if (window.SONIDO) SONIDO.tocar("grunido", { vol: 0.35, tono: 1.7, x: perro.x, y: perro.y });
  }
  // ladra: «¡Guau!» sobre la cabeza
  function ladrar(txt) {
    perro.ladra = 0.7;
    A.textoFlotante(perro.x, perro.y - 80, txt || t("cp.guau"), "#B8AC9C");
    if (window.SONIDO) SONIDO.tocar("grunido", { vol: 0.45, tono: 1.9, x: perro.x, y: perro.y });
  }
  function olfatear() {
    if (!sabe(3) || J.t - ultLadrido < 6) return;
    for (const e of A.enemigos) {
      if (!puedeMorder(e) || e.vio > 0 || e.estado !== "quieto" || olidas.some((o) => o.e === e)) continue;
      if (Math.hypot(e.x - jug.x, e.y - jug.y) > 650) continue;
      olidas.push({ e, t: 0 });
      ultLadrido = J.t;
      ladrar();
      return;
    }
  }
  function aullar() {
    if (!sabe(4) || J.t - ultAullido < 60 || jug.hp > jug.hpMax * 0.3) return;
    const cerca = A.enemigos.filter((e) => puedeMorder(e) && Math.hypot(e.x - perro.x, e.y - perro.y) < 420);
    if (!cerca.length) return;
    ultAullido = J.t;
    ladrar(t("cp.aullido"));
    perro.ladra = 1.4;
    cerca.forEach((e) => {
      if (e.d.pesado || e.lider || e.patron || e.d.jefe) return;
      e.aturdido = Math.max(e.aturdido || 0, 1.1);
      if (e.aviso) J.quitarAviso(e.aviso), (e.aviso = null);
      const l = Math.hypot(e.x - perro.x, e.y - perro.y) || 1;
      e.vx = ((e.x - perro.x) / l) * 380;
      e.vy = ((e.y - perro.y) / l) * 380;
    });
    if (window.SONIDO) SONIDO.tocar("rugido", { vol: 0.4, tono: 1.6, x: perro.x, y: perro.y });
  }
  // los avisos del piso: salta fuera justo antes de que peguen
  function esquivarAvisos() {
    for (const a of J.avisos) {
      if (a.t < a.dur - 0.4 || !A.CB.contiene(a, perro.x, perro.y)) continue;
      const l = Math.hypot(perro.x - a.x, perro.y - a.y) || 1;
      perro.vx = ((perro.x - a.x) / l) * 520;
      perro.vy = ((perro.y - a.y) / l) * 520;
      perro.salto = 0.35;
      return;
    }
  }
  function andar(dt) {
    const p = perro;
    p.t += dt;
    p.golpe = Math.max(0, p.golpe - dt * 4);
    p.ladra = Math.max(0, p.ladra - dt);
    p.cola = Math.max(0.3, p.cola - dt * 0.5);
    p.mord = Math.max(0, p.mord - dt);
    p.salto = Math.max(0, (p.salto || 0) - dt);
    p.mov = 0;
    // lejos (un viaje, una casa, se trabó): vuelve al lado
    const dj = Math.hypot(jug.x - p.x, jug.y - p.y);
    if (p.estado !== "quieto" && (dj > LEJOS || (p.atasco > 1.5 && dj > 300))) {
      ponerAlLado();
      p.atasco = 0;
      p.salto = 0;
      if (p.estado !== "busca") p.estado = "sigue";
      return;
    }
    if (p.salto > 0) {
      const ux = p.vx * dt,
        uy = p.vy * dt;
      if (W.libre(p.x + ux, p.y + uy, 12)) (p.x += ux), (p.y += uy);
      p.vx *= Math.pow(0.01, dt);
      p.vy *= Math.pow(0.01, dt);
      p.mov = 1;
      return;
    }
    esquivarAvisos();
    if (p.estado === "quieto") {
      p.sentado = true;
      return;
    }
    if (p.estado === "busca") {
      p.sentado = false;
      p.mov = 0.5;
      if (window.CALIDAD && CALIDAD.nivel !== "baja" && Math.random() < 0.4) J.fx.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y - 4, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 180, t: 0.4, c: "#5E4632", s: 3 + Math.random() * 2 });
      if (p.t > 1.4) {
        hallazgo();
        p.estado = "sigue";
      }
      return;
    }
    if (p.estado === "cansado") {
      p.aguante = Math.min(100, p.aguante + 14 * dt);
      if (p.aguante > 70) p.estado = "sigue";
    } else p.aguante = Math.min(100, p.aguante + (p.obj ? 2 : 8) * dt);
    // pelea
    if (p.estado !== "cansado") {
      if (p.obj && !puedeMorder(p.obj)) p.obj = null;
      if (!p.obj || p.t % 0.5 < dt) p.obj = elegirObjetivo() || (p.obj && puedeMorder(p.obj) && Math.hypot(p.obj.x - jug.x, p.obj.y - jug.y) < ALCANCE_PELEA ? p.obj : null);
      if (p.obj) {
        const e = p.obj,
          r = (e.d.radio || 22) + 30,
          d = Math.hypot(e.x - p.x, e.y - p.y);
        p.sentado = false;
        if (d > r) p.mov = Math.min(1, moverHacia(e.x - Math.sign(e.x - p.x) * r * 0.8, e.y, CORRE, dt) * 1.4);
        else {
          mirarHacia(e.x - p.x, e.y - p.y);
          if (p.mord <= 0) morder(e);
        }
        if (p.aguante < 12) {
          p.estado = "cansado";
          p.obj = null;
          A.textoFlotante(p.x, p.y - 80, t("cp.cansado"), "#8E8A86");
        }
        return;
      }
    }
    // seguir: un poco atrás y al costado (que no lo tape Eromash)
    const d = jug.dir || [0, 1],
      tx = jug.x - d[0] * 45 - d[1] * 75,
      ty = jug.y - d[1] * 30 + d[0] * 40,
      dt2 = Math.hypot(tx - p.x, ty - p.y);
    if (dt2 > 70) {
      p.sentado = false;
      p.quietoT = 0;
      p.mov = Math.min(1, moverHacia(tx, ty, dt2 > 380 ? CORRE * 1.15 : VEL, dt) * 1.3);
    } else {
      p.quietoT = (p.quietoT || 0) + dt;
      if (p.quietoT > 3) p.sentado = true;
      mirarHacia(jug.x - p.x, jug.y - p.y);
    }
  }

  // ---------- el sistema ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      lugar = buscarLugar();
      // un claro chico alrededor, para que se lo vea desde el camino
      W.cercanas(lugar[0] - 360, lugar[1] - 300, lugar[0] + 360, lugar[1] + 520, (o) => {
        if (!o.arbol && o.id !== "roca" && o.id !== "troncoCaido") return;
        const dy = o.y - lugar[1];
        if (Math.hypot(o.x - lugar[0], dy > 0 ? dy * 0.5 : dy) > 330) return;
        o.oculto = true;
        o.choque = null;
      });
      // el ícono de la Bolsa: la cabeza de Skuggi de frente
      if (window.INVENTARIO && INVENTARIO.iconoDe)
        INVENTARIO.iconoDe("cp_perro", (c) => CRIATURAS.dibujar(c, "perro", 0, 34, 0, { vista: "S", sentado: true, s: 0.95 }));
      if (window.RPG) RPG.aporte((s) => sabe(5) && sigue() && (s.dano *= 1.05), "companero");
    },
    alEmpezar(extra) {
      extra.companero = Object.assign(base(), extra.companero || {});
      st = extra.companero;
      if (A) sacarLobos();
      olidas = [];
      perro = { x: lugar[0], y: lugar[1], vx: 0, vy: 0, mira: { vista: "E", espejo: false }, mov: 0, estado: "herido", obj: null, mord: 0, golpe: 0, aguante: 100, ladra: 0, cola: 0.3, atasco: 0, t: 0, sentado: false };
      if (st.rescatado) {
        if (st.quieto) {
          perro.x = st.quieto[0];
          perro.y = st.quieto[1];
          perro.estado = "quieto";
          perro.sentado = true;
        } else {
          perro.estado = "sigue";
          colocar = true;
        }
      }
    },
    actualizar(dt) {
      if (!A || !perro) return;
      for (const o of olidas) o.t += dt;
      olidas = olidas.filter((o) => o.t < 4 && !o.e.muerto);
      if (J.dentro) {
        estabaDentro = true;
        return;
      }
      if (estabaDentro || colocar) {
        estabaDentro = colocar = false;
        if (sigue()) ponerAlLado();
      }
      if (!st.rescatado) {
        const d = Math.hypot(jug.x - lugar[0], jug.y - lugar[1]);
        if (!lobos && d < 520 && !jug.muerto) emboscada();
        if (lobos && (d > 2600 || jug.muerto)) sacarLobos();
        return;
      }
      if (J.modo !== "juego") return;
      andar(dt);
      if (sigue()) {
        olfatear();
        aullar();
      }
    },
    alMorir(e) {
      if (!sigue() || e.companero || !perro) return;
      if (Math.hypot(e.x - perro.x, e.y - perro.y) < 900) sumar(e.d.pesado || e.lider ? 10 : 4);
      perro.cola = 3;
    },
    cercanos(dar) {
      if (J.dentro || jug.muerto || !perro) return;
      const d = Math.hypot(perro.x - jug.x, perro.y - jug.y);
      if (!st.rescatado) {
        if (d < HABLAR + 30 && lobos && lobos.every((e) => e.muerto)) dar(d, t("cp.atender"), atender, perro.x, perro.y - 90);
        return;
      }
      if (d < HABLAR && !perro.obj) dar(d + 20, t("cp.ordenes"), ordenes, perro.x, perro.y - 100);
    },
    objetos(lista, visible, c) {
      if (J.dentro || !perro || !visible(perro.x, perro.y)) return;
      const p = perro;
      lista.push({
        x: p.x,
        y: p.y,
        f: () =>
          CRIATURAS.dibujar(c, "perro", p.x, p.y - (p.salto > 0 ? Math.sin((p.salto / 0.35) * Math.PI) * 26 : 0), J.t, {
            vista: p.mira.vista,
            espejo: p.mira.espejo,
            mov: p.mov,
            golpe: p.golpe,
            sentado: p.sentado && p.estado !== "herido",
            echado: p.estado === "herido",
            herido2: p.estado === "herido",
            ladra: p.ladra > 0,
            cola: p.cola,
            cansado: p.estado === "cansado",
          }),
      });
    },
    sobreLuz(c) {
      if (J.dentro) return;
      // olfato: una huella dorada sobre lo que olió
      for (const o of olidas) {
        const e = o.e,
          x = e.x,
          y = e.y - (e.d.barra || 80) - 34,
          a = Math.min(1, (4 - o.t) * 2);
        c.save();
        c.globalAlpha = a;
        DIB.E(c, x, y + 4, 9, 7, "#111111");
        DIB.E(c, x, y + 4, 7, 5.4, "#FFD98A");
        [[-8, -6], [-3, -10], [3, -10], [8, -6]].forEach(([dx, dy]) => {
          DIB.E(c, x + dx, y + dy, 3.4, 3.4, "#111111");
          DIB.E(c, x + dx, y + dy, 2.4, 2.4, "#FFD98A");
        });
        c.restore();
      }
    },
    marcasMapa() {
      if (!perro) return [];
      if (!st.rescatado) return [{ tipo: "companero", x: lugar[0], y: lugar[1], op: { nombre: t("cp.mapa_herido") } }];
      if (st.quieto) return [{ tipo: "companero", x: st.quieto[0], y: st.quieto[1], op: { nombre: t("cp.esperando") } }];
      return [];
    },
    celdasBolsa() {
      return st.rescatado ? [{ id: "cp_perro", icono: "cp_perro", nombre: t("cp.bolsa"), col: "#B8AC9C", desc: t("cp.bolsa_d", [nivel()]), cant: nivel(), fn: ordenes }] : [];
    },
    diario() {
      if (!st.rescatado) return `<div class="diario-resumen"><p>${t("cp.diario_herido")}</p></div>`;
      return `<div class="diario-resumen"><p><b>${t("cp.diario_t")}</b> ${t("cp.diario", [nivel(), st.mordiscos, st.hallazgos])}${st.quieto ? " " + t("cp.esperando") : ""}</p></div>`;
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { sistema, estado: () => st, perro: () => perro, olfatear, lugar: () => lugar, lobos: () => lobos, nivel, sabe, atender, acariciar, quedarse, seguir, llamar, buscar, ordenes, sumar, NIVELES, TRUCOS };
})();
