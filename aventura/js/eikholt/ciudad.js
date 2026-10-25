// ---------- Eikholt en 3D (sistema EIKHOLT) ----------
// La capital es un mapa aparte: al cruzar una de sus puertas (o al aparecer adentro) el bosque queda en pausa
// (J.dentro, como en los interiores) y la ciudad se juega en 3D sobre su propio lienzo, con el HUD, la mochila, el
// mapa, los diálogos y el guardado de siempre: lo que cambia es el mapa, no el juego.
// - El plano sale de EIKPLANO (plano.js); las casas, de CASAS; las cosas, de PIEZAS.
// - Eromash y la gente son dibujos planos parados (el mismo dibujo del bosque, en un lienzo chico que se pinta
//   cada cuadro), con su sombra en el piso; la vista (frente, costado, espalda) depende de hacia dónde miran respecto
//   de la cámara.
// - Cámaras: cada zona tiene la suya (calle, Roble, toldos, mercado de los forasteros, Ting, puertas, patio de las
//   Lindes, oficios, muelle, adarve, escalera del Roble, mirador e interiores, donde se corta el techo y la pared del
//   frente para ver adentro). Además se gira (Z / X o el stick derecho), se acerca con la rueda y se cambia a la
//   vista baja con V. Si Eromash sube, la cámara sube con él.
// - La historia: la ciudad 3D tiene anclas con el mismo nombre que los puntos y nombradas del bosque. Cerca de una,
//   Eromash «se asoma» un momento a ese punto del bosque (jug.x/y) y le pregunta al motor qué hay para hacer ahí:
//   así Svanhild, la mesa, la losa, el aro de la herrería, la campana o las piedras siguen funcionando igual.
window.EIKHOLT = (function () {
  "use strict";
  const t = (k, v) => I18N.t(k, v);
  const PI = Math.PI,
    TAU = PI * 2;
  let A, J, jug, W, H;
  let st = null; // E.extra.eikholt
  let listo = false,
    activo = false;
  let T, R, escena, camara, plano, lienzo3d;
  let sol, luna, cielo, luces = [],
    poolLuces = [];
  const pos = { x: 0, z: 140, y: 0 },
    cam = { yaw: 0, pitch: 0.85, dist: 17, fov: 50, ty: 1.2, x: 0, y: 0, z: 0 },
    meta = { yaw: 0, pitch: 0.85, dist: 17, fov: 50 };
  let zoom = 1,
    vistaBaja = false,
    girado = 10, // segundos desde que el jugador giró la cámara a mano
    rig = "calle",
    rigAntes = "",
    zonaAvisada = "",
    edificioDentro = null,
    guardar = 0,
    modoAntes = "juego",
    tiempo = 0;

  // ---------- grillas de choques y de superficies ----------
  const CEL = 8;
  let gChoques, gSup;
  function grilla(lista, caja) {
    const g = new Map();
    for (const o of lista) {
      const [x0, z0, x1, z1] = caja(o);
      for (let i = Math.floor(x0 / CEL); i <= Math.floor(x1 / CEL); i++)
        for (let k = Math.floor(z0 / CEL); k <= Math.floor(z1 / CEL); k++) {
          const key = i * 4096 + k;
          let l = g.get(key);
          if (!l) g.set(key, (l = []));
          l.push(o);
        }
    }
    return g;
  }
  const enCelda = (g, x, z) => g.get(Math.floor(x / CEL) * 4096 + Math.floor(z / CEL)) || [];
  function cajaChoque(c) {
    if (c.circulo) {
      const [x, z, r] = c.circulo;
      return [x - r, z - r, x + r, z + r];
    }
    if (c.obb) {
      const [x, z, mx, mz] = c.obb,
        r = Math.hypot(mx, mz);
      return [x - r, z - r, x + r, z + r];
    }
    const [ax, az, bx, bz, g] = c.seg;
    return [Math.min(ax, bx) - g, Math.min(az, bz) - g, Math.max(ax, bx) + g, Math.max(az, bz) + g];
  }
  function cajaTri(s) {
    const p = s.p;
    return [Math.min(p[0][0], p[1][0], p[2][0]), Math.min(p[0][1], p[1][1], p[2][1]), Math.max(p[0][0], p[1][0], p[2][0]), Math.max(p[0][1], p[1][1], p[2][1])];
  }
  // alto de un triángulo en (x, z), o null si cae afuera
  function enTri(s, x, z) {
    const [a, b, c] = s.p;
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(d) < 1e-9) return null;
    const l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (z - c[1])) / d,
      l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (z - c[1])) / d,
      l3 = 1 - l1 - l2;
    if (l1 < -0.002 || l2 < -0.002 || l3 < -0.002) return null;
    return a[2] * l1 + b[2] * l2 + c[2] * l3;
  }
  // el piso donde se pararía alguien en (x, z) que viene de la altura y: la superficie más alta que se alcanza de
  // un paso, o la tierra
  function alturaEn(x, z, y) {
    let mejor = plano.h0(x, z),
      sup = null;
    for (const s of enCelda(gSup, x, z)) {
      const h = enTri(s, x, z);
      if (h == null) continue;
      if (h <= y + 0.7 && (sup == null || h > mejor)) {
        mejor = Math.max(mejor, h);
        sup = s;
      }
    }
    return { h: mejor, sup };
  }
  // ¿hay alguna superficie justo ahí (aunque no se alcance)?
  function haySup(x, z, y, tol) {
    for (const s of enCelda(gSup, x, z)) {
      const h = enTri(s, x, z);
      if (h != null && Math.abs(h - y) < tol) return true;
    }
    return false;
  }
  // empuja un círculo (x, z, r) fuera de todo lo que choca a esa altura
  function empujar(p, r, y) {
    for (let it = 0; it < 2; it++)
      for (const c of enCelda(gChoques, p.x, p.z)) {
        if (y + 1.6 < c.y0 || y > c.y1 - 0.05) continue;
        if (c.circulo) {
          const [cx, cz, cr] = c.circulo,
            dx = p.x - cx,
            dz = p.z - cz,
            d = Math.hypot(dx, dz),
            m = cr + r;
          if (d < m && d > 1e-6) {
            p.x = cx + (dx / d) * m;
            p.z = cz + (dz / d) * m;
          }
        } else if (c.obb) {
          const [cx, cz, mx, mz, ang] = c.obb,
            cs = Math.cos(ang),
            sn = Math.sin(ang);
          // al marco local (el +z local mira a donde apunta el frente: x local = (cos, -sen), z local = (sen, cos))
          const dx = p.x - cx,
            dz = p.z - cz,
            lx = dx * cs - dz * sn,
            lz = dx * sn + dz * cs;
          const qx = Math.max(-mx, Math.min(mx, lx)),
            qz = Math.max(-mz, Math.min(mz, lz));
          let ex = lx - qx,
            ez = lz - qz,
            d = Math.hypot(ex, ez);
          let nx, nz;
          if (d > 1e-6) {
            if (d >= r) continue;
            nx = qx + (ex / d) * r;
            nz = qz + (ez / d) * r;
          } else {
            // adentro: sale por el lado más cercano
            const px = mx - Math.abs(lx),
              pz = mz - Math.abs(lz);
            if (px < pz) {
              nx = Math.sign(lx || 1) * (mx + r);
              nz = lz;
            } else {
              nx = lx;
              nz = Math.sign(lz || 1) * (mz + r);
            }
          }
          p.x = cx + nx * cs + nz * sn;
          p.z = cz - nx * sn + nz * cs;
        } else {
          const [ax, az, bx, bz, g] = c.seg,
            vx = bx - ax,
            vz = bz - az,
            l = vx * vx + vz * vz;
          let u = l ? ((p.x - ax) * vx + (p.z - az) * vz) / l : 0;
          u = Math.max(0, Math.min(1, u));
          const qx = ax + vx * u,
            qz = az + vz * u,
            dx = p.x - qx,
            dz = p.z - qz,
            d = Math.hypot(dx, dz),
            m = g + r;
          if (d < m) {
            if (d > 1e-6) {
              p.x = qx + (dx / d) * m;
              p.z = qz + (dz / d) * m;
            } else {
              p.x = qx - (vz / Math.sqrt(l)) * m;
              p.z = qz + (vx / Math.sqrt(l)) * m;
            }
          }
        }
      }
  }

  // ---------- de la ciudad al bosque y vuelta ----------
  // el círculo de 150 m de la empalizada corresponde a la elipse de la ciudad en el mapa de Eldervald
  const aBosque = (x, z) => [W.CIUDAD.c[0] + (x / 150) * W.CIUDAD.rx, W.CIUDAD.c[1] + (z / 150) * W.CIUDAD.ry];
  const aCiudad = (fx, fy) => [((fx - W.CIUDAD.c[0]) / W.CIUDAD.rx) * 150, ((fy - W.CIUDAD.c[1]) / W.CIUDAD.ry) * 150];
  const dentroElipse = (x, y, f = 1) => ((x - W.CIUDAD.c[0]) / W.CIUDAD.rx) ** 2 + ((y - W.CIUDAD.c[1]) / W.CIUDAD.ry) ** 2 < f * f;

  // los puntos del bosque que tienen su lugar en la ciudad 3D (ancla del plano o lugar fijo)
  const ANCLAS_BOSQUE = {
    eikholt: [0, 122], eydis_eikholt: [-3.5, 127], orm_eikholt: [3.5, 129], trab_eikholt: [9, 124], plaza: [0, 56],
    mirador: "mirador", losa: "losa", mesa: "mesa", svanhild_casa: "svanhild_casa", svanhild_patio: "svanhild_patio", herreria_puerta: "herreria_puerta",
    puerta_sur: "puerta_sur_dentro", gran_tablero: "gran_tablero", casa_guardia: "casa_guardia", puerta_norte: "puerta_norte_dentro",
    roble: "roble", ting: "ting", pozo: "pozo", campana: "campana", tablon_avisos: "tablon_avisos", camas_hongos: "camas_hongos",
    herreria: "herreria", carpinteria: "carpinteria", cordeleria: "cordeleria", curtiembre: "curtiembre", sanacion: "sanacion",
    hongo_dorado: "hongo_dorado", guardia: "guardia", carreta_grim: "carreta_grim", buey: "buey",
  };
  for (let i = 0; i < 12; i++) ANCLAS_BOSQUE["ancla" + i] = "ancla" + i;
  let sondas = []; // { x, z, fx, fy, k }
  function armarSondas() {
    sondas = [];
    for (const k in ANCLAS_BOSQUE) {
      const v = ANCLAS_BOSQUE[k],
        p3 = typeof v === "string" ? plano.anclas[v] : v;
      const nb = W.NOMBRADAS[k] && !Array.isArray(W.NOMBRADAS[k]) ? [W.NOMBRADAS[k].x, W.NOMBRADAS[k].y] : W.PUNTOS[k];
      if (!p3 || !nb) continue;
      sondas.push({ k, x: p3[0], z: p3[1], fx: nb[0], fy: nb[1] });
    }
  }
  // dónde va en la ciudad algo que en el bosque está en (fx, fy): junto al ancla más cercana
  function lugarDe(fx, fy) {
    let m = null,
      dm = Infinity;
    for (const s of sondas) {
      const d = Math.hypot(s.fx - fx, s.fy - fy);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    if (!m || dm > 900) {
      const [x, z] = aCiudad(fx, fy);
      return [x, z];
    }
    let ox = (fx - m.fx) / 40,
      oz = (fy - m.fy) / 40;
    const l = Math.hypot(ox, oz);
    if (l > 5) {
      ox *= 5 / l;
      oz *= 5 / l;
    }
    return [m.x + ox, m.z + oz];
  }
  // asomarse a un punto del bosque: el motor ve a Eromash ahí mientras dura fn
  function asomado(fx, fy, fn) {
    const px = jug.x,
      py = jug.y;
    jug.x = fx;
    jug.y = fy;
    try {
      return fn();
    } finally {
      jug.x = px;
      jug.y = py;
    }
  }
  // lo que el motor ofrece cerca del ancla (o de la persona de la historia) más próxima
  function sondear() {
    let m = null,
      dm = 3.2;
    for (const s of sondas) {
      const d = Math.hypot(s.x - pos.x, s.z - pos.z);
      if (d < dm) {
        dm = d;
        m = s;
      }
    }
    for (const n of historia) {
      const d = Math.hypot(n.x - pos.x, n.z - pos.z);
      if (d < 2.4 && d - 0.6 < dm) {
        dm = d - 0.6;
        m = { fx: n.fx, fy: n.fy + 40, x: n.x, z: n.z };
      }
    }
    if (!m) return null;
    const fx = m.fx + (pos.x - m.x) * 12,
      fy = m.fy + (pos.z - m.z) * 12 + (m.k ? 30 : 0);
    const r = asomado(fx, fy, () => A.cercano());
    if (!r || nativos.has(r.texto) || r.texto.startsWith(prefijoEntrar())) return null;
    return { texto: r.texto, d: dm, fn: () => asomado(fx, fy, r.fn), fx, fy };
  }
  let nativos = new Set();
  // las casas del bosque viejo no se entran desde la ciudad 3D (sus casas se entran caminando)
  const prefijoEntrar = () => t("in.accion_entrar", ["\u0001"]).split("\u0001")[0];
  // la bodega del Hongo Dorado (con la puerta de piedra de Góinn) sigue siendo el sótano de siempre
  function bajarBodega() {
    const s0 = sondas.find((q) => q.k === "hongo_dorado");
    if (!s0) return;
    for (const dy of [40, 0, 80]) {
      const r = asomado(s0.fx, s0.fy + dy, () => A.cercano());
      if (r && r.texto.startsWith(prefijoEntrar())) return asomado(s0.fx, s0.fy + dy, r.fn);
    }
  }

  // ---------- la gente ----------
  // dibujos planos: cada persona tiene su lienzo de 256 × 256 con los pies abajo al medio
  const LADO = 256,
    PIES = 232,
    PX_M = 84; // píxeles por metro en el lienzo (Eromash mide 1,85 m)
  let gente = [], // todos los que se dibujan: { tipo, id, x, z, y, mira, ... }
    historia = [], // los de la historia en este momento (con su lugar en el bosque)
    sombras;
  function borrarSombra(ctx) {
    // la sombra elíptica del dibujo 2D no va (en 3D la sombra está en el piso)
    ctx.fill = function (...a) {
      const f = this.fillStyle;
      if (typeof f === "string" && /^rgba\(0, 0, 0, 0\.[34]\d*\)$/.test(f)) return;
      return CanvasRenderingContext2D.prototype.fill.apply(this, a);
    };
  }
  function figura(o) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = LADO;
    const ctx = cv.getContext("2d");
    borrarSombra(ctx);
    const tex = new T.CanvasTexture(cv);
    tex.encoding = T.sRGBEncoding;
    tex.minFilter = T.LinearFilter;
    tex.generateMipmaps = false;
    const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: T.DoubleSide, depthWrite: true });
    const m = new T.Mesh(planoFigura, mat);
    m.renderOrder = 2;
    escena.add(m);
    return Object.assign(o, { cv, ctx, tex, mat, malla: m, pintado: -1, mira: o.mira || { vista: "S", espejo: false } });
  }
  let planoFigura;
  // la vista de alguien que mira hacia (dx, dz) del mundo, vista desde la cámara
  function vistaDe(dx, dz, previa) {
    const c = Math.cos(cam.yaw),
      s = Math.sin(cam.yaw);
    const sx = dx * c - dz * s,
      sy = dx * s + dz * c;
    return VIKINGO.vista(sx, sy, previa);
  }

  // los vecinos sin nombre: fichas hechas a partir de una semilla (nadie se viste igual)
  const PIELES = ["#E0C0A8", "#D8B49A", "#C89A7A", "#E0B898", "#B8907A", "#D0A080", "#C09070"],
    PELOS = ["#3A2A1E", "#5A3A2A", "#8A6A3A", "#C8A050", "#D8B060", "#B4542A", "#1E1814", "#9A9890", "#E8E4DC"],
    ROPAS = ["#5E4A36", "#4E5C32", "#3E4E66", "#7A3A2A", "#6E6A54", "#5A6A4A", "#56667A", "#7A2A1E", "#6E5A3E", "#4A6A7A", "#8A6A48", "#5E2C20"],
    CAPAS = ["#3E5A34", "#2C4226", "#9A948C", "#5E4A36", "#4A5868", "#7A3A2A"],
    PANTS = ["#3A3026", "#46362A", "#3A2A1E", "#45392E", "#3A4A56", "#5E4430"];
  function fichaVecino(i, rol) {
    const r = GEO.azar(9000 + i * 13);
    const elige = (l) => l[Math.floor(r() * l.length)];
    const ropa = elige(ROPAS),
      mujer = r() < 0.5,
      nino = rol === "nino",
      viejo = !nino && r() < 0.18;
    const f = {
      nombre: "vecino", alto: nino ? 0.62 + r() * 0.12 : 0.9 + r() * 0.2, ancho: nino ? 0.78 + r() * 0.06 : 0.88 + r() * 0.3,
      piel: elige(PIELES), pelo: viejo ? elige(["#E8E4DC", "#B8B4AC", "#9A9890"]) : elige(PELOS), ropa, ropaSombra: GEO.aclarar(ropa, -0.25),
      pantalon: elige(PANTS), botas: elige(["#2A2018", "#241C16", "#3A2A1A"]), cinto: elige(["#7A5634", "#C8B48C", "#3A2A1A", "#8A6A2A", "#5E4430"]),
    };
    f.pielSombra = GEO.aclarar(f.piel, -0.15);
    ["ropaSombra", "pielSombra"].forEach((k) => (f[k] = "#" + new T.Color(...f[k]).getHexString()));
    if (mujer) {
      f.falda = r() < 0.8;
      if (r() < 0.5) f.trenza = true;
      else if (r() < 0.6) f.rodete = true;
    } else if (!nino) {
      if (r() < 0.7) f.barba = f.pelo;
      if (r() < 0.2) f.calvo = true;
    }
    if (r() < 0.35 && !nino) {
      f.capa = elige(CAPAS);
      f.capaSombra = "#" + new T.Color(...GEO.aclarar(f.capa, -0.25)).getHexString();
    }
    if (r() < 0.25 || rol === "vendedor") {
      f.delantal = elige(["#7A5030", "#C8B48C", "#5E4A36", "#E6DCC8"]);
      f.delantalSombra = "#" + new T.Color(...GEO.aclarar(f.delantal, -0.2)).getHexString();
    }
    if (r() < 0.25) f.gorro = elige(["#E6DCC8", "#9C2315", "#46423E", "#E8B04A", "#5E6A4A"]);
    if (rol === "guardia" || rol === "recluta") {
      f.gorro = "#6E6A6E";
      f.lanza = true;
      f.capa = rol === "guardia" ? "#2C4226" : undefined;
      f.capaSombra = "#1E3018";
      f.ropa = "#5A5E5A";
      f.ropaSombra = "#464A46";
    }
    if (rol === "pescador") f.gorro = "#4A6A7A";
    if (rol === "viajero") {
      f.capa = elige(["#9C2315", "#56667A", "#6E5A3E"]);
      f.capaSombra = "#" + new T.Color(...GEO.aclarar(f.capa, -0.25)).getHexString();
    }
    const id = "ek_" + rol + "_" + i;
    GENTE.FICHAS[id] = f;
    return id;
  }

  // ---------- armar la escena ----------
  function armar() {
    T = THREE;
    plano = EIKPLANO.armar();
    gChoques = grilla(plano.choques, cajaChoque);
    gSup = grilla(plano.superficies, cajaTri);
    armarSondas();
    lienzo3d = document.createElement("canvas");
    lienzo3d.id = "lienzo3d";
    lienzo3d.className = "lienzo3d";
    const base = document.getElementById("lienzo");
    base.parentNode.insertBefore(lienzo3d, base.nextSibling);
    const nv = nivel();
    R = new T.WebGLRenderer({ canvas: lienzo3d, antialias: nv !== "baja", powerPreference: "high-performance" });
    R.outputEncoding = T.sRGBEncoding;
    R.shadowMap.enabled = nv !== "baja";
    R.shadowMap.type = nv === "alta" ? T.PCFSoftShadowMap : T.PCFShadowMap;
    escena = new T.Scene();
    escena.add(plano.raiz);
    escena.fog = new T.Fog(0x9db4c0, 70, 330);
    camara = new T.PerspectiveCamera(50, 1, 0.3, 2400);
    cielo = new T.HemisphereLight(0xdfe8f0, 0x3a3a30, 0.55);
    escena.add(cielo);
    sol = new T.DirectionalLight(0xfff0d8, 0.95);
    sol.castShadow = nv !== "baja";
    const tam = nv === "alta" ? 2048 : 1024;
    sol.shadow.mapSize.set(tam, tam);
    Object.assign(sol.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 320 });
    sol.shadow.bias = -0.0006;
    sol.shadow.normalBias = 0.04;
    escena.add(sol, sol.target);
    luna = new T.DirectionalLight(0x8aa0d0, 0);
    luna.position.set(-80, 120, 60);
    escena.add(luna);
    // las luces de cerca (los faroles más próximos se prenden de verdad; el resto solo brilla)
    const nl = nv === "alta" ? 10 : nv === "media" ? 5 : 0;
    for (let i = 0; i < nl; i++) {
      const l = new T.PointLight(0xffb060, 0, 15, 2);
      escena.add(l);
      poolLuces.push(l);
    }
    luces = plano.luces.concat(plano.fuegos.map((f) => ({ x: f[0], y: f[1], z: f[2], f: 1.4, tipo: "fuego" })));
    // el bosque de afuera: pinos y abedules como instancias
    armarBosque(nv);
    armarCupula();
    armarHumo(nv);
    // las figuras
    planoFigura = new T.PlaneGeometry(LADO / PX_M, LADO / PX_M);
    planoFigura.translate(0, LADO / PX_M / 2 - (LADO - PIES) / PX_M, 0);
    const geoSombra = new T.CircleGeometry(0.42, 12);
    geoSombra.rotateX(-PI / 2);
    sombras = new T.InstancedMesh(geoSombra, new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }), 260);
    sombras.renderOrder = 1;
    sombras.frustumCulled = false;
    escena.add(sombras);
    armarGente(nv);
    medir();
    addEventListener("resize", medir);
    addEventListener("wheel", (e) => {
      if (!activo || J.modo !== "juego") return;
      zoom = Math.max(0.45, Math.min(2.2, zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1)));
    }, { passive: true });
    listo = true;
  }
  function nivel() {
    return window.CALIDAD ? CALIDAD.nivel : "alta";
  }
  function medir() {
    if (!R) return;
    const k = window.CALIDAD && CALIDAD.escala ? CALIDAD.escala() : Math.min(2, devicePixelRatio || 1);
    R.setPixelRatio(k);
    R.setSize(innerWidth, innerHeight, false);
    camara.aspect = innerWidth / innerHeight;
    camara.updateProjectionMatrix();
  }
  function armarBosque(nv) {
    const parte = nv === "alta" ? 1 : nv === "media" ? 0.6 : 0.35;
    const lista = plano.pinos.filter((p, i) => (i * 0.618) % 1 < parte);
    const pinos = lista.filter((p) => !p.ab),
      abedules = lista.filter((p) => p.ab);
    const geo = (fn) => {
      const a = GEO.armador(31);
      fn(a);
      return a.geometria();
    };
    const gp = geo((a) => PIEZAS.pino(a, 0, 0, 1, 3)),
      gb = geo((a) => PIEZAS.abedul(a, 0, 0, 1));
    const m = new T.Matrix4(),
      q = new T.Quaternion(),
      e = new T.Euler();
    for (const [g, l] of [[gp, pinos], [gb, abedules]]) {
      if (!l.length) continue;
      const im = new T.InstancedMesh(g, GEO.MAT.mate, l.length);
      l.forEach((p, i) => {
        e.set(0, p.c * TAU, 0);
        q.setFromEuler(e);
        m.compose(new T.Vector3(p.x, p.y - 0.1, p.z), q, new T.Vector3(p.s, p.s * (0.9 + p.c * 0.3), p.s));
        im.setMatrixAt(i, m);
        const k = 0.8 + p.c * 0.35;
        im.setColorAt(i, new T.Color(k, k, k));
      });
      im.castShadow = nv === "alta";
      im.receiveShadow = true;
      escena.add(im);
    }
  }
  // las runas enormes de la cúpula, sobre una curva invisible: solo se ven desde adentro, tenues
  let matCupula;
  function armarCupula() {
    const b = GEO.armador(77);
    for (const rc of plano.runasCupula) {
      const tr = FUTHARK.T[rc.runa];
      if (!tr) continue;
      b.con({ x: rc.x, y: rc.y, z: rc.z, ry: rc.sem, rx: -PI / 2 }, () => tr.forEach((s) => PIEZAS.trazo(b, s, 14, "#73D5DB", 0.5)));
    }
    matCupula = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.2, side: T.DoubleSide, depthWrite: false, fog: false });
    const m = b.malla(matCupula);
    if (m) {
      m.castShadow = m.receiveShadow = false;
      escena.add(m);
    }
  }
  // humo de las chimeneas y las forjas: bolitas grises que suben y se deshacen
  let humo = null,
    bolitas = [];
  function armarHumo(nv) {
    const n = nv === "alta" ? 220 : nv === "media" ? 90 : 0;
    if (!n) return;
    const g = new T.IcosahedronGeometry(0.5, 0);
    humo = new T.InstancedMesh(g, new T.MeshLambertMaterial({ color: 0xb8b4ac, transparent: true, opacity: 0.45, depthWrite: false }), n);
    humo.frustumCulled = false;
    humo.renderOrder = 3;
    escena.add(humo);
    for (let i = 0; i < n; i++) bolitas.push({ t: Math.random() * 6, f: null });
  }

  // ---------- la gente ----------
  const LINEAS_ROL = { vecino: 8, vecina: 8, nino: 5, vendedor: 6, recluta: 4, viajero: 6, pescador: 4, guardia: 5 };
  function armarGente(nv) {
    gente = [];
    // Eromash
    gente.push(figura({ tipo: "eromash", x: 0, z: 0, y: 0 }));
    // los vecinos con nombre, en sus lugares de trabajo
    const nombrados = {};
    for (const p of plano.puestos) if (p.id) nombrados[p.id] = p;
    const ids = new Set(Object.keys(nombrados));
    if (window.CAPITAL) CAPITAL.gente.forEach((n) => ids.add(n.id));
    ["asa", "svend", "thora", "ulf"].forEach((id) => ids.add(id));
    for (const id of ids) {
      if (!GENTE.FICHAS[id] && id !== "bror_cama") continue;
      gente.push(figura({ tipo: "nombrado", id: id === "bror_cama" ? "herido" : id, nid: id, puesto: nombrados[id] || null, x: 0, z: 0, y: 0 }));
    }
    nativos = new Set();
    for (const g of gente) if (g.tipo === "nombrado") nativos.add(t("av.accion_hablar") + " · " + t("av.nombre_" + g.nid));
    // los quietos: vendedores, reclutas, viajeros, el pescador
    let i = 0;
    for (const p of plano.puestos) {
      if (p.id) continue;
      if (nv === "baja" && i % 2) {
        i++;
        continue;
      }
      const rol = p.tipo;
      const id = fichaVecino(i++, rol);
      gente.push(figura({ tipo: "quieto", id, rol, x: p.x, z: p.z, y: plano.h0(p.x, p.z), mira0: p.mira, mira: { vista: "S", espejo: false } }));
    }
    // los que caminan por las calles
    const n = nv === "alta" ? 110 : nv === "media" ? 64 : 30;
    const { nodos } = plano.rutas;
    const r = GEO.azar(321);
    for (let k = 0; k < n; k++) {
      const rol = r() < 0.12 ? "nino" : r() < 0.5 ? "vecina" : "vecino";
      const id = fichaVecino(500 + k, rol);
      const a = Math.floor(r() * nodos.length);
      const b = nodos[a].v[Math.floor(r() * nodos[a].v.length)];
      gente.push(figura({ tipo: "caminante", id, rol, a, b, u: r(), lado: (r() - 0.5) * 3, vel: (rol === "nino" ? 1.6 : 1.05) + r() * 0.4, pausa: 0, x: 0, z: 0, y: 0, sem: k }));
    }
    // la Guardia del Roble en el adarve
    const ng = nv === "baja" ? 3 : 7;
    for (let k = 0; k < ng; k++) {
      const id = fichaVecino(800 + k, "guardia");
      gente.push(figura({ tipo: "ronda", id, rol: "guardia", ang: (k / ng) * TAU + 0.3, sentido: k % 2 ? 1 : -1, x: 0, z: 0, y: plano.ADARVE, pausa: 0 }));
    }
    // los de la historia (se crean cuando aparecen)
  }

  // dónde está cada vecino con nombre ahora (de día en su puesto, de noche donde dice la vida de Eikholt)
  function ubicarNombrados() {
    const noche = luzAhora.n > 0.5;
    for (const g of gente) {
      if (g.tipo !== "nombrado") continue;
      const cap = window.CAPITAL && CAPITAL.gente.find((n) => n.id === g.nid);
      g.fuera = !!(cap && cap.fuera);
      if (g.puesto && (!noche || g.puesto.noche || !cap)) {
        g.x = g.puesto.x;
        g.z = g.puesto.z;
        g.mira0 = g.puesto.mira;
        g.acostado = g.puesto.acostado;
      } else if (cap) {
        const [x, z] = lugarDe(cap.x, cap.y);
        g.x = x;
        g.z = z;
        g.mira0 = null;
      } else if (g.puesto) {
        g.x = g.puesto.x;
        g.z = g.puesto.z;
      }
      // que no quede adentro de una pared
      const p = { x: g.x, z: g.z };
      empujar(p, 0.35, 0);
      g.x = p.x;
      g.z = p.z;
      g.y = alturaEn(g.x, g.z, 1).h;
    }
  }
  // los de la historia que hoy están en la ciudad (Eydis, Orm, Svanhild, la cuadrilla)
  function ubicarHistoria() {
    const vivos = [];
    const poner = (id, n, clave) => {
      if (!dentroElipse(n.x, n.y, 1.08)) return;
      let g = historia.find((h) => h.clave === clave);
      if (!g) {
        g = figura({ tipo: "historia", id, clave, x: 0, z: 0, y: 0 });
        gente.push(g);
        historia.push(g);
      }
      g.fx = n.x;
      g.fy = n.y;
      g.mira = n.mira || g.mira;
      g.hablando = n.hablando;
      g.camina = n.camina;
      const [x, z] = lugarDe(n.x, n.y);
      if (Math.hypot(g.x - x, g.z - z) > 0.05) {
        const p = { x, z };
        empujar(p, 0.35, 0);
        g.x = p.x;
        g.z = p.z;
        g.y = alturaEn(g.x, g.z, 1).h;
      }
      vivos.push(g);
    };
    for (const id in A.npcs) poner(id, A.npcs[id], "n_" + id);
    if (A.trabajadores) A.trabajadores().forEach((tr) => poner(tr.id, tr, "t_" + tr.id));
    // los que se fueron de la ciudad
    for (const g of historia.slice()) {
      if (vivos.includes(g)) continue;
      escena.remove(g.malla);
      g.tex.dispose();
      g.mat.dispose();
      historia.splice(historia.indexOf(g), 1);
      gente.splice(gente.indexOf(g), 1);
    }
  }

  // ---------- la luz del momento ----------
  let luzAhora = { h: 12, n: 0, o: 0 };
  const C_DIA = new THREE.Color(0x9db4c0),
    C_OCASO = new THREE.Color(0xd89878),
    C_NOCHE = new THREE.Color(0x0c1220),
    tmpC = new THREE.Color();
  function luz(dt) {
    const a = LUZ.ambiente(H.E.tiempo, 0, dt);
    luzAhora = a;
    const n = a.n,
      o = a.o;
    tmpC.copy(C_DIA).lerp(C_OCASO, o * 0.8).lerp(C_NOCHE, n);
    if (!escena.background) escena.background = new T.Color();
    escena.background.copy(tmpC);
    escena.fog.color.copy(tmpC);
    const nv = nivel();
    escena.fog.near = nv === "baja" ? 40 : 70;
    escena.fog.far = (nv === "baja" ? 200 : nv === "media" ? 270 : 340) * (1 - n * 0.35);
    // el sol da la vuelta con la hora (luz de arriba a la derecha a media tarde, como en todo el juego)
    const ang = ((a.h - 6) / 12) * PI;
    sol.intensity = Math.max(0, Math.sin(ang)) * 0.95 * (1 - n);
    sol.color.setRGB(1, 0.94 - o * 0.25, 0.85 - o * 0.4);
    const sx = Math.cos(ang) * 90 + 60,
      sy = 60 + Math.max(0, Math.sin(ang)) * 90,
      sz = -50;
    sol.position.set(pos.x + sx, pos.y + sy, pos.z + sz);
    sol.target.position.set(pos.x, pos.y, pos.z);
    luna.intensity = 0.22 * n;
    cielo.intensity = 0.16 + 0.5 * (1 - n);
    cielo.color.setRGB(0.87 - n * 0.4, 0.9 - n * 0.35, 0.94 - n * 0.2);
    cielo.groundColor.setRGB(0.23 - n * 0.12, 0.23 - n * 0.12, 0.19 - n * 0.08);
    // lo que brilla se nota más de noche
    const b = 0.62 + n * 0.75 + o * 0.2;
    GEO.MAT.brillo.color.setRGB(b, b, b);
    const ru = 0.75 + n * 0.5;
    GEO.MAT.runico.color.setRGB(ru, ru, ru);
    if (matCupula) matCupula.opacity = 0.08 + n * 0.3 + Math.sin(tiempo * 0.7) * 0.03;
  }
  let cadaLuz = 0;
  function lucesCerca(dt) {
    cadaLuz -= dt;
    if (cadaLuz > 0 || !poolLuces.length) return;
    cadaLuz = 0.35;
    const cerca = luces
      .map((l) => ({ l, d: (l.x - pos.x) ** 2 + (l.z - pos.z) ** 2 + (l.y - pos.y) ** 2 * 4 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, poolLuces.length);
    const n = luzAhora.n;
    poolLuces.forEach((p, i) => {
      const c = cerca[i];
      if (!c) return (p.intensity = 0);
      p.position.set(c.l.x, c.l.y, c.l.z);
      const fuego = c.l.tipo === "fuego" || c.l.tipo === "forja" || c.l.tipo === "brasero";
      p.intensity = (fuego ? 0.5 + n * 1.4 : n * 1.5) * c.l.f;
      p.distance = fuego ? 16 : 13;
      p.color.setHex(c.l.tipo === "mirador" ? 0xf2c46a : fuego ? 0xff9a4a : 0xffb868);
    });
  }

  // ---------- cámaras ----------
  // cada rig: inclinación (rad), distancia, campo de visión; yaw opcional (se gira al entrar a la zona)
  const RIGS = {
    calle: { pitch: 0.86, dist: 17, fov: 50 },
    roble: { pitch: 0.62, dist: 15, fov: 54, ty: 1.6 },
    toldos: { pitch: 0.72, dist: 19, fov: 52 },
    mercado: { pitch: 0.8, dist: 24, fov: 52 },
    ting: { pitch: 0.95, dist: 21, fov: 50 },
    puerta: { pitch: 0.62, dist: 19, fov: 52, ty: 2 },
    patio: { pitch: 0.8, dist: 16, fov: 50 },
    oficio: { pitch: 0.78, dist: 15, fov: 50 },
    muelle: { pitch: 0.6, dist: 18, fov: 52 },
    adarve: { pitch: 0.55, dist: 15, fov: 54, ty: 1.6 },
    escalera: { pitch: 0.55, dist: 14, fov: 54, ty: 1.6 },
    mirador: { pitch: 0.42, dist: 14, fov: 62, ty: 1.4 },
    interior: { pitch: 0.92, dist: 13, fov: 46, ty: 0.8 },
    lindes: { pitch: 0.95, dist: 15, fov: 48, ty: 0.8 },
    taberna: { pitch: 0.95, dist: 17, fov: 48, ty: 0.8 },
    sanacion: { pitch: 0.95, dist: 15, fov: 48, ty: 0.8 },
    casa: { pitch: 0.98, dist: 11.5, fov: 46, ty: 0.8 },
  };
  function enZona(z, x, y) {
    if (z.circulo) return Math.hypot(x - z.circulo[0], y - z.circulo[1]) < z.circulo[2];
    if (z.caja) {
      const [cx, cz, mx, mz, ang] = z.caja,
        dx = x - cx,
        dz = y - cz,
        c = Math.cos(ang),
        s = Math.sin(ang);
      return Math.abs(dx * c - dz * s) < mx && Math.abs(dx * s + dz * c) < mz;
    }
    if (z.anillo) {
      const [cx, cz, r0, r1, a0, a1] = z.anillo,
        r = Math.hypot(x - cx, y - cz);
      if (r < r0 || r > r1) return false;
      let a = Math.atan2(y - cz, x - cx);
      while (a < a0) a += TAU;
      return a <= a1;
    }
    return false;
  }
  function adentroDe(ed) {
    const a = ed.adentro;
    if (!a) return false;
    const dx = pos.x - a.x,
      dz = pos.z - a.z,
      c = Math.cos(a.ry),
      s = Math.sin(a.ry);
    return Math.abs(dx * c - dz * s) < a.mx && Math.abs(dx * s + dz * c) < a.mz && pos.y > ed.casa.medidas.yp - 0.4;
  }
  const corto = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let cadaEdificio = 0,
    edificiosCerca = [];
  function elegirRig(dt) {
    // adentro de un edificio
    cadaEdificio -= dt;
    if (cadaEdificio <= 0) {
      cadaEdificio = 0.5;
      edificiosCerca = plano.edificios.filter((e) => e.adentro && Math.hypot(e.x - pos.x, e.z - pos.z) < 30);
    }
    const ed = edificiosCerca.find(adentroDe) || null;
    if (ed !== edificioDentro) {
      if (edificioDentro) cortar(edificioDentro, false);
      if (ed) {
        cortar(ed, true);
        if (ed.nombre === "lindes") H.descubrir && H.descubrir("casa_lindes");
        avisarZona(ed.nombre === "lindes" ? "lindes" : ed.nombre === "hongo_dorado" ? "taberna" : ed.nombre === "sanacion" ? "sanacion" : ed.comun ? "" : "");
      }
      edificioDentro = ed;
    }
    if (ed) return { nombre: ed.rig || "casa", yaw: ed.ry, forzar: true };
    // en alto
    const s = alturaEn(pos.x, pos.z, pos.y + 0.05).sup;
    if (pos.y > 14) return { nombre: "mirador", yaw: PI, forzar: true };
    if (s && s.nivel === "roble") return { nombre: "escalera", yaw: Math.atan2(pos.x, pos.z), forzar: true };
    if (pos.y > 2.5 && s && (s.nivel === "adarve" || s.nivel === "escalera")) {
      const a = Math.atan2(pos.z, pos.x);
      return { nombre: "adarve", yaw: Math.atan2(Math.cos(a), Math.sin(a)), forzar: true };
    }
    let mejor = null;
    for (const z of plano.zonas) if (enZona(z, pos.x, pos.z) && (!mejor || z.prioridad > mejor.prioridad)) mejor = z;
    if (!mejor) return { nombre: "calle" };
    let yaw = mejor.yaw;
    if (mejor.rig === "puerta") {
      // en la puerta la cámara queda del lado de adentro mirando hacia afuera (o al revés si se está afuera)
      const r = Math.hypot(pos.x, pos.z),
        a = Math.atan2(pos.z, pos.x);
      yaw = r < plano.R_MURO ? Math.atan2(-Math.cos(a), -Math.sin(a)) : Math.atan2(Math.cos(a), Math.sin(a));
    }
    return { nombre: mejor.rig, yaw };
  }
  function cortar(ed, si) {
    const p = ed.casa.partes;
    p.techo.forEach((m) => (m.visible = !si));
    p.paredes.frente.forEach((m) => (m.visible = !si));
    p.paredes.izq.forEach((m) => (m.visible = !si));
    p.paredes.der.forEach((m) => (m.visible = !si));
    // desde adentro los vidrios de las otras paredes no se ven
    for (const k of ["atras"]) p.paredes[k].forEach((m) => m.material === GEO.MAT.brillo && (m.visible = !si));
    // el ala vieja de piedra de las Lindes queda delante: se corta entera
    if (ed.extraPartes) [ed.extraPartes.techo, ...Object.values(ed.extraPartes.paredes)].forEach((l) => l.forEach((m) => (m.visible = !si)));
  }
  const ZONAS_AVISO = { mercado: "ek.zona_mercado", toldos: "ek.zona_toldos", ting: "ek.zona_ting", roble: "ek.zona_roble", patio: "ek.zona_lindes", lindes: "ek.zona_lindes", taberna: "ek.zona_taberna", sanacion: "ek.zona_sanacion", muelle: "ek.zona_muelle", oficio: "ek.zona_herreria", mirador: "ek.zona_mirador", adarve: "ek.zona_adarve" };
  let avisoEspera = 0;
  function avisarZona(r) {
    const k = ZONAS_AVISO[r];
    if (!k || k === zonaAvisada || avisoEspera > 0) return;
    zonaAvisada = k;
    avisoEspera = 6;
    HUD.aviso(t(k), "#FFD98A");
  }
  function camaraPaso(dt) {
    const elegido = elegirRig(dt);
    const r = RIGS[elegido.nombre] || RIGS.calle;
    if (elegido.nombre !== rigAntes) {
      rigAntes = elegido.nombre;
      if (elegido.yaw != null && girado > 3) meta.yaw = cam.yaw + corto(elegido.yaw - cam.yaw);
      avisarZona(elegido.nombre);
    }
    if (elegido.forzar && elegido.yaw != null && girado > 1.5) meta.yaw = cam.yaw + corto(elegido.yaw - cam.yaw);
    rig = elegido.nombre;
    // a mano: Z / X, el stick derecho
    let giro = (CONTROLES.pulsado("camaraIzq") ? -1 : 0) + (CONTROLES.pulsado("camaraDer") ? 1 : 0);
    const ed = CONTROLES.ejeDer ? CONTROLES.ejeDer() : { x: 0, y: 0 };
    if (Math.abs(ed.x) > 0.25) giro += ed.x;
    if (Math.abs(ed.y) > 0.35) zoom = Math.max(0.45, Math.min(2.2, zoom * (1 + ed.y * dt * 1.4)));
    if (giro && J.modo === "juego") {
      meta.yaw += giro * dt * 1.9;
      girado = 0;
    } else girado += dt;
    if (CONTROLES.recien("camara") && J.modo === "juego") {
      vistaBaja = !vistaBaja;
      HUD.aviso(t(vistaBaja ? "ek.camara_baja" : "ek.camara_alta"), "#F2ECEC");
    }
    const baja = vistaBaja && !edificioDentro;
    meta.pitch = baja ? Math.max(0.2, r.pitch - 0.45) : r.pitch;
    meta.dist = r.dist * zoom * (baja ? 0.6 : 1);
    meta.fov = r.fov;
    const k = 1 - Math.exp(-dt * 3.2),
      ky = 1 - Math.exp(-dt * (giro ? 12 : elegido.forzar ? 5 : 2.6));
    cam.yaw += (meta.yaw - cam.yaw) * ky;
    cam.pitch += (meta.pitch - cam.pitch) * k;
    cam.dist += (meta.dist - cam.dist) * k;
    cam.fov += (meta.fov - cam.fov) * k;
    cam.ty += ((r.ty || 1.2) - cam.ty) * k;
    // el punto que mira: Eromash (y si sube, sube con él)
    const tx = pos.x,
      tz = pos.z;
    cam.y += (pos.y - cam.y) * Math.min(1, dt * 6);
    const cy = cam.y + cam.ty;
    const h = Math.cos(cam.pitch) * cam.dist,
      v = Math.sin(cam.pitch) * cam.dist;
    camara.position.set(tx + Math.sin(cam.yaw) * h, cy + v, tz + Math.cos(cam.yaw) * h);
    // la cámara no se mete bajo tierra
    const suelo = plano.h0(camara.position.x, camara.position.z) + 0.6;
    if (camara.position.y < suelo) camara.position.y = suelo;
    camara.lookAt(tx, cy, tz);
    camara.fov = cam.fov;
    camara.updateProjectionMatrix();
    // los techos abiertos (el galpón de la forja) se esconden con Eromash abajo
    for (const ta of plano.techosAbiertos) {
      const dx = pos.x - ta.x,
        dz = pos.z - ta.z,
        c = Math.cos(ta.ry),
        s = Math.sin(ta.ry);
      ta.malla.visible = !(Math.abs(dx * c - dz * s) < ta.mx + 2 && Math.abs(dx * s + dz * c) < ta.mz + 2);
    }
    // la copa del Roble se vuelve transparente si tapa a Eromash
    const rr = Math.hypot(pos.x, pos.z);
    const tapa = rr < 42 && (camara.position.y > 14 || pos.y > 12);
    const mc = plano.roble.matCopa;
    mc.opacity += ((tapa ? 0.22 : 1) - mc.opacity) * Math.min(1, dt * 4);
    mc.depthWrite = mc.opacity > 0.95;
  }

  // ---------- Eromash en la ciudad ----------
  const VEL = [0, 2.5, 4.3, 7.2],
    VEL_ESQ = 12,
    RADIO = 0.42;
  function moverA(nx, nz) {
    const p = { x: nx, z: nz };
    empujar(p, RADIO, pos.y);
    // la gente también ocupa lugar
    for (const g of gente) {
      if (g.tipo === "eromash" || g.oculto || Math.abs(g.y - pos.y) > 1.2) continue;
      const dx = p.x - g.x,
        dz = p.z - g.z,
        d = Math.hypot(dx, dz);
      if (d < 0.7 && d > 1e-4) {
        p.x = g.x + (dx / d) * 0.7;
        p.z = g.z + (dz / d) * 0.7;
      }
    }
    const a = alturaEn(p.x, p.z, pos.y);
    // en alto (adarve, escaleras, mirador, puentes) no se cae por los bordes
    if (pos.y > 1.1 && a.h < pos.y - 0.75) return;
    if (a.h > pos.y + 0.75) return;
    pos.x = p.x;
    pos.z = p.z;
    pos.y = a.h;
  }
  let jugUlt = null;
  // si algo de la historia mandó a Eromash a otro lado (un cuarto, un viaje, otra zona), la ciudad se suspende
  function vigilar() {
    if (!activo) return true;
    if (J.dentro !== sistemaCiudad) {
      suspender();
      return true;
    }
    if (jugUlt && Math.hypot(jug.x - jugUlt[0], jug.y - jugUlt[1]) > 60) {
      if (!dentroElipse(jug.x, jug.y, 1)) {
        suspender();
        J.dentro = null;
        st.dentro = false;
        salida = 2;
        return true;
      }
      const [x, z] = lugarDe(jug.x, jug.y),
        p = buscarLibre(x, z);
      pos.x = p.x;
      pos.z = p.z;
      pos.y = alturaEn(p.x, p.z, 0.3).h;
    }
    return false;
  }
  function suspender() {
    activo = false;
    if (edificioDentro) cortar(edificioDentro, false);
    edificioDentro = null;
    lienzo3d.style.display = "none";
  }
  function jugadorPaso(dt) {
    if (vigilar()) return;
    jug.inv = Math.max(0, (jug.inv || 0) - dt);
    if (jug.salto > 0) jug.salto = Math.max(0, jug.salto - dt);
    if (!jug.muerto) jug.hp = Math.min(jug.hpMax, jug.hp + 4 * dt);
    const libre = J.modo === "juego";
    const e = libre ? CONTROLES.eje() : { x: 0, y: 0 },
      mov = Math.hypot(e.x, e.y) > 0.15,
      mag = Math.min(1, Math.hypot(e.x, e.y));
    jug.staEspera = Math.max(0, (jug.staEspera || 0) - dt);
    if (CONTROLES.mando() && libre && CONTROLES.recien("correr")) jug.sprintFijo = !jug.sprintFijo;
    if (!mov || jug.cansado || !CONTROLES.mando()) jug.sprintFijo = false;
    jug.correr = libre && mov && (CONTROLES.pulsado("correr") || jug.sprintFijo) && !jug.cansado;
    if (jug.correr) {
      jug.sta -= 20 * dt;
      jug.staEspera = 0.6;
    } else if ((jug.esq || 0) <= 0 && jug.staEspera <= 0) jug.sta += (mov ? 20 : 30) * dt;
    if (jug.sta <= 0) {
      jug.sta = 0;
      jug.cansado = true;
      jug.correr = false;
    }
    if (jug.cansado && jug.sta > jug.staMax * 0.35) jug.cansado = false;
    jug.sta = Math.min(jug.staMax, jug.sta);
    jug.paso = !mov ? 0 : jug.correr ? 3 : jug.cansado || mag < 0.6 ? 1 : 2;
    jug.atk = null;
    const c = Math.cos(cam.yaw),
      s = Math.sin(cam.yaw);
    if (jug.esq > 0) {
      jug.esq -= dt;
      moverA(pos.x + jug.esqMundo[0] * VEL_ESQ * dt, pos.z + jug.esqMundo[1] * VEL_ESQ * dt);
    } else if (libre) {
      if (mov) {
        const l = Math.hypot(e.x, e.y),
          dx = (e.x * c + e.y * s) / l,
          dz = (-e.x * s + e.y * c) / l;
        jug.dirMundo = [dx, dz];
        const v = VEL[jug.paso] * dt;
        moverA(pos.x + dx * v, pos.z + dz * v);
      }
      if (CONTROLES.recien("esquivar") && jug.sta >= 20 && jug.salto <= 0) {
        jug.sta -= 20;
        jug.staEspera = 0.6;
        jug.esq = 0.3;
        jug.esqMundo = (jug.dirMundo || [0, 1]).slice();
      }
      if (CONTROLES.recien("saltar") && jug.salto <= 0) jug.salto = 0.42;
    }
    jug.anda = mov ? (jug.correr ? 2 : 1) : 0;
    // la vista del dibujo según hacia dónde va respecto de la cámara
    const dm = jug.dirMundo || [0, 1];
    const sx = dm[0] * c - dm[1] * s,
      sy = dm[0] * s + dm[1] * c;
    jug.dir = [sx, sy];
    if (mov || jug.esq > 0 || girado < 0.2) jug.mira = VIKINGO.vista(sx, sy, jug.mira);
    // el motor ve a Eromash en el lugar del bosque que corresponde (mapa, misiones, guardado)
    const [fx, fy] = aBosque(pos.x, pos.z);
    jug.x = fx;
    jug.y = fy;
    jugUlt = [fx, fy];
    // salir de la ciudad por un camino de afuera
    if (Math.hypot(pos.x, pos.z) > 203 && libre) salir();
    if (!libre) return;
    if (CONTROLES.recien("interactuar") && modoAntes === "juego") {
      const c0 = cercano();
      if (c0) c0.fn();
      if (J.dentro !== sistemaCiudad) return suspender();
    }
    if (CONTROLES.recien("lente") && A.usarLente) {
      const s0 = sondaCercana(6);
      if (s0) asomado(s0.fx + (pos.x - s0.x) * 12, s0.fy + (pos.z - s0.z) * 12, A.usarLente);
      else A.usarLente();
    }
    if (CONTROLES.recien("inventario") && window.INVENTARIO) INVENTARIO.abrir("equipo");
    if (CONTROLES.recien("mapa") && window.MAPA) MAPA.abrir();
  }
  function sondaCercana(dmax) {
    let m = null,
      dm = dmax;
    for (const s0 of sondas) {
      const d = Math.hypot(s0.x - pos.x, s0.z - pos.z);
      if (d < dm) {
        dm = d;
        m = s0;
      }
    }
    return m;
  }

  // ---------- lo que se puede hacer cerca ----------
  function cercano() {
    if (J.modo !== "juego") return null;
    let mejor = null,
      dm = Infinity;
    for (const g of gente) {
      if (g.tipo === "eromash" || g.tipo === "historia" || g.oculto || g.fuera) continue;
      const d = Math.hypot(g.x - pos.x, g.z - pos.z);
      if (d > 2.2 || Math.abs(g.y - pos.y) > 1.5 || d >= dm) continue;
      dm = d;
      if (g.tipo === "nombrado") mejor = { texto: t("av.accion_hablar") + " · " + t("av.nombre_" + g.nid), fn: () => hablarNombrado(g) };
      else mejor = { texto: t("av.accion_hablar") + " · " + t("av.nombre_ek_" + g.rol), fn: () => hablarVecino(g) };
    }
    const b = plano.anclas.hongo_trampilla;
    if (b) {
      const d = Math.hypot(b[0] - pos.x, b[1] - pos.z);
      if (d < 1.8 && d < dm) {
        dm = d;
        mejor = { texto: t("ek.bajar_bodega"), fn: bajarBodega };
      }
    }
    const s0 = sondear();
    if (s0 && s0.d < dm + 0.3) mejor = { texto: s0.texto, fn: s0.fn };
    return mejor;
  }
  function mirarA(g) {
    g.mira = vistaDe(pos.x - g.x, pos.z - g.z, g.mira);
    jug.dirMundo = [g.x - pos.x, g.z - pos.z];
    jug.mira = vistaDe(g.x - pos.x, g.z - pos.z, jug.mira);
    g.charla = 6;
  }
  function hablarNombrado(g) {
    mirarA(g);
    const n = { id: g.nid, x: jug.x, y: jug.y + 40, mira: { vista: "S", espejo: false } };
    PODERES.hablarCon(n);
  }
  const charlas = {};
  function hablarVecino(g) {
    mirarA(g);
    const n = LINEAS_ROL[g.rol] || 4;
    charlas[g.id] = charlas[g.id] == null ? g.sem || 0 : charlas[g.id] + 1;
    A.dialogoLibre([["ek_" + g.rol, "ek.dice_" + g.rol + "_" + (charlas[g.id] % n)]]);
  }

  // ---------- la gente se mueve ----------
  function gentePaso(dt) {
    const { nodos } = plano.rutas;
    const r = Math.random;
    for (const g of gente) {
      if (g.charla > 0) g.charla -= dt;
      if (g.tipo === "caminante") {
        if (g.charla > 0) {
          g.camina = 0;
          continue;
        }
        if (g.pausa > 0) {
          g.pausa -= dt;
          g.camina = 0;
          continue;
        }
        const A0 = nodos[g.a],
          B0 = nodos[g.b];
        const l = Math.hypot(B0.x - A0.x, B0.z - A0.z) || 1;
        g.u += (g.vel * dt) / l;
        if (g.u >= 1) {
          // en cada esquina elige otra calle (casi nunca la de vuelta)
          const prev = g.a;
          g.a = g.b;
          const v = nodos[g.a].v.filter((k) => k !== prev);
          g.b = v.length && r() < 0.9 ? v[Math.floor(r() * v.length)] : prev;
          g.u = 0;
          if (r() < 0.15) g.pausa = 2 + r() * 6;
          continue;
        }
        const dx = (B0.x - A0.x) / l,
          dz = (B0.z - A0.z) / l;
        // cada uno va por su lado de la calle
        let x = A0.x + (B0.x - A0.x) * g.u - dz * g.lado,
          z = A0.z + (B0.z - A0.z) * g.u + dx * g.lado;
        // si Eromash está en el camino, lo esquiva
        const ex = x - pos.x,
          ez = z - pos.z,
          ed = Math.hypot(ex, ez);
        if (ed < 1.2 && ed > 1e-3) {
          x = pos.x + (ex / ed) * 1.2;
          z = pos.z + (ez / ed) * 1.2;
        }
        g.x = x;
        g.z = z;
        g.y = plano.h0(x, z);
        g.dir = [dx, dz];
        g.camina = 1;
      } else if (g.tipo === "ronda") {
        if (g.pausa > 0) {
          g.pausa -= dt;
          g.camina = 0;
        } else {
          g.ang += (g.sentido * 0.9 * dt) / plano.R_MURO;
          g.camina = 1;
          if (r() < dt * 0.04) g.pausa = 3 + r() * 5;
        }
        const rr = plano.R_MURO - 1.8;
        g.x = Math.cos(g.ang) * rr;
        g.z = Math.sin(g.ang) * rr;
        g.y = plano.ADARVE;
        g.dir = g.pausa > 0 ? [Math.cos(g.ang), Math.sin(g.ang)] : [-Math.sin(g.ang) * g.sentido, Math.cos(g.ang) * g.sentido];
      }
    }
  }

  // ---------- pintar las figuras ----------
  const mtx = new THREE.Matrix4(),
    vS = new THREE.Vector3(),
    frustum = new THREE.Frustum(),
    pm = new THREE.Matrix4();
  function figurasPaso() {
    pm.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse);
    frustum.setFromProjectionMatrix(pm);
    const escY = 1 / Math.max(0.62, Math.cos(cam.pitch * 0.85));
    const n = luzAhora.n;
    let ns = 0;
    for (const g of gente) {
      if (g.tipo === "eromash") {
        g.x = pos.x;
        g.z = pos.z;
        g.y = pos.y;
      }
      const m = g.malla,
        d = Math.hypot(g.x - pos.x, g.z - pos.z);
      const visible = !g.fuera && d < 150 && frustum.containsPoint(vS.set(g.x, g.y + 0.9, g.z));
      m.visible = visible;
      if (!visible) continue;
      m.position.set(g.x, g.y, g.z);
      m.rotation.set(0, cam.yaw, 0);
      m.scale.set(1, escY, 1);
      // la noche los oscurece salvo cerca de una luz
      const k = 1 - n * 0.55;
      g.mat.color.setRGB(k, k, k * 1.04);
      // la sombra en el piso
      if (ns < sombras.count) {
        const s = g.tipo === "eromash" && jug.salto > 0 ? 0.75 : 1;
        mtx.makeScale(s * (g.ancho || 1), 1, s * 0.75).setPosition(g.x, g.y + 0.04, g.z);
        sombras.setMatrixAt(ns++, mtx);
      }
      // se repinta cerca cada cuadro; lejos, de vez en cuando
      const cada = d < 30 ? 0 : d < 70 ? 0.12 : 0.6;
      if (tiempo - g.pintado < cada) continue;
      g.pintado = tiempo;
      pintar(g);
    }
    sombras.count = Math.max(ns, 0);
    sombras.instanceMatrix.needsUpdate = true;
  }
  function pintar(g) {
    const c = g.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, LADO, LADO);
    if (g.tipo === "eromash") {
      A.dibujarJugadorEn(c, LADO / 2, PIES, 1.3);
    } else {
      let mira = g.mira;
      if (g.charla > 0) mira = vistaDe(pos.x - g.x, pos.z - g.z, g.mira);
      else if (g.dir && g.camina) mira = vistaDe(g.dir[0], g.dir[1], g.mira);
      else if (g.mira0 != null) mira = vistaDe(Math.sin(g.mira0), Math.cos(g.mira0), g.mira);
      else if (g.tipo === "historia" && g.fx != null) {
        // los de la historia miran a Eromash cuando está cerca
        if (Math.hypot(pos.x - g.x, pos.z - g.z) < 6) mira = vistaDe(pos.x - g.x, pos.z - g.z, g.mira);
      }
      g.mira = mira;
      GENTE.dibujar(c, g.id, LADO / 2, PIES, tiempo + (g.sem || 0), { vista: mira.vista, espejo: mira.espejo, s: 1.95, camina: g.camina, hablando: g.hablando || (g.charla > 0 && J.modo === "dialogo") });
    }
    g.tex.needsUpdate = true;
  }
  // la silueta de Eromash a través de lo que lo tapa: una segunda figura tenue sin prueba de profundidad
  let fantasma = null;
  function fantasmaPaso() {
    const g = gente[0];
    if (!fantasma) {
      fantasma = new T.Mesh(planoFigura, new T.MeshBasicMaterial({ map: g.tex, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false, color: 0xf2ecec }));
      fantasma.renderOrder = 10;
      escena.add(fantasma);
    }
    fantasma.position.copy(g.malla.position);
    fantasma.rotation.copy(g.malla.rotation);
    fantasma.scale.copy(g.malla.scale);
    fantasma.visible = !edificioDentro;
  }

  // ---------- el humo ----------
  const mH = new THREE.Matrix4(),
    qH = new THREE.Quaternion(),
    vH = new THREE.Vector3(),
    sH = new THREE.Vector3();
  let fuentes = [],
    cadaFuente = 0;
  function humoPaso(dt) {
    if (!humo) return;
    cadaFuente -= dt;
    if (cadaFuente <= 0) {
      cadaFuente = 1;
      fuentes = plano.humos.filter((h) => Math.hypot(h[0] - pos.x, h[2] - pos.z) < 90);
    }
    bolitas.forEach((b, i) => {
      b.t += dt;
      if (!b.f || b.t > 6) {
        b.f = fuentes.length ? fuentes[i % fuentes.length] : null;
        b.t = Math.random() * 0.4;
        b.dx = (Math.random() - 0.5) * 0.4;
        b.dz = (Math.random() - 0.5) * 0.4;
      }
      if (!b.f) {
        mH.makeScale(0, 0, 0);
        humo.setMatrixAt(i, mH);
        return;
      }
      const u = b.t / 6,
        s = 0.4 + u * 1.6;
      vH.set(b.f[0] + b.dx + u * 3.5, b.f[1] + b.t * 1.4, b.f[2] + b.dz - u * 1.5);
      sH.set(s, s, s);
      mH.compose(vH, qH, sH);
      humo.setMatrixAt(i, mH);
    });
    humo.instanceMatrix.needsUpdate = true;
    humo.material.opacity = 0.35 * (1 - luzAhora.n * 0.5);
  }

  // ---------- entrar y salir ----------
  function buscarLibre(x, z) {
    for (let r = 0; r < 30; r += 0.8)
      for (let k = 0; k < Math.max(1, r * 4); k++) {
        const a = (k / Math.max(1, r * 4)) * TAU,
          p = { x: x + Math.cos(a) * r, z: z + Math.sin(a) * r };
        const q = { x: p.x, z: p.z };
        empujar(q, RADIO, 0);
        if (Math.hypot(q.x - p.x, q.z - p.z) < 0.01) return p;
      }
    return { x, z };
  }
  function entrar(desde) {
    if (activo) return;
    J.modo = "cine";
    HUD.fundido(true);
    if (!listo) HUD.aviso(t("ek.llegando"), "#FFD98A");
    setTimeout(() => {
      try {
        if (!listo) armar();
      } catch (e) {
        console.error(e);
        HUD.fundido(false);
        J.modo = "juego";
        return;
      }
      activo = true;
      lienzo3d.style.display = "block";
      let p;
      if (desde && desde.guardado) p = { x: desde.x, z: desde.z, y: desde.y || 0 };
      else {
        const a = Math.atan2(jug.y - W.CIUDAD.c[1], (jug.x - W.CIUDAD.c[0]) * (W.CIUDAD.ry / W.CIUDAD.rx));
        const puerta = desde && desde.puerta;
        if (puerta) p = { x: plano.anclas["puerta_" + puerta + "_dentro"][0], z: plano.anclas["puerta_" + puerta + "_dentro"][1] };
        else {
          const [x, z] = lugarDe(jug.x, jug.y);
          p = buscarLibre(x, z);
        }
        cam.yaw = meta.yaw = puerta ? Math.atan2(Math.cos(a), Math.sin(a)) : 0;
      }
      pos.x = p.x;
      pos.z = p.z;
      pos.y = alturaEn(p.x, p.z, (p.y || 0) + 0.3).h;
      cam.y = pos.y;
      if (desde && desde.guardado && desde.yaw != null) cam.yaw = meta.yaw = desde.yaw;
      cam.dist = meta.dist;
      J.dentro = sistemaCiudad;
      jug.atk = null;
      jug.anda = 0;
      st.dentro = true;
      zonaAvisada = "";
      rigAntes = "";
      if (window.CARTEL) CARTEL.entra("eikholt");
      else if (H.descubrir) H.descubrir("eikholt");
      ubicarNombrados();
      ubicarHistoria();
      if (!window.CARTEL) HUD.aviso(t("ek.nombre"), "#FFD98A");
      setTimeout(() => {
        HUD.fundido(false);
        J.modo = "juego";
        CONTROLES.soltar();
      }, 150);
    }, listo ? 650 : 700);
  }
  function salir() {
    if (!activo || J.modo !== "juego") return;
    J.modo = "cine";
    HUD.fundido(true);
    // la puerta más cercana a por donde se fue
    const a = Math.atan2(pos.z, pos.x);
    let mejor = null,
      dm = Infinity;
    for (const k in plano.PUERTAS) {
      const d = Math.abs(corto(plano.PUERTAS[k] - a));
      if (d < dm) {
        dm = d;
        mejor = plano.PUERTAS[k];
      }
    }
    setTimeout(() => {
      activo = false;
      st.dentro = false;
      if (window.CARTEL) CARTEL.sale("eikholt");
      if (edificioDentro) cortar(edificioDentro, false);
      edificioDentro = null;
      lienzo3d.style.display = "none";
      J.dentro = null;
      const C = W.CIUDAD;
      let x = C.c[0] + Math.cos(mejor) * (C.rx + 320),
        y = C.c[1] + Math.sin(mejor) * (C.ry + 320);
      for (let r = 0; r < 600 && !W.libre(x, y, 18); r += 20) {
        x += Math.cos(mejor) * 20;
        y += Math.sin(mejor) * 20;
      }
      jug.x = x;
      jug.y = y;
      jug.z = 0;
      jug.mira = { vista: Math.abs(Math.sin(mejor)) > 0.5 ? (Math.sin(mejor) > 0 ? "S" : "N") : "E", espejo: Math.cos(mejor) < -0.5 };
      J.cam.x = x;
      J.cam.y = y - 30;
      salida = 2.5; // que no vuelva a entrar enseguida
      setTimeout(() => {
        HUD.fundido(false);
        J.modo = "juego";
        CONTROLES.soltar();
      }, 150);
    }, 650);
  }
  let salida = 0,
    dtUlt = 1 / 60;

  // ---------- el cuadro ----------
  function paso(dt) {
    if (!activo) return;
    dt = Math.min(dt, 0.05);
    dtUlt = dt;
    tiempo += dt;
    avisoEspera = Math.max(0, avisoEspera - dt);
    luz(dt);
    if (J.modo === "juego" || J.modo === "dialogo") {
      jugadorPaso(dt);
      gentePaso(dt);
    }
    // cada tanto: quién está dónde (la historia avanza, cae la noche)
    guardar += dt;
    if ((guardar % 1) < dt) {
      ubicarHistoria();
      if (Math.floor(guardar) % 5 === 0) ubicarNombrados();
      st.x = pos.x;
      st.z = pos.z;
      st.y = pos.y;
      st.yaw = cam.yaw;
    }
    if (guardar > 30) {
      guardar = 0;
      H.guardar();
    }
    // los surcos de la losa se encienden cuando apareció la huella del guardián
    const lindes = plano.edificios.find((e) => e.nombre === "lindes");
    if (lindes && lindes.surcos) lindes.surcos.opacity = H.tiene("huella_patio") ? 0.9 : 0.25 + Math.sin(tiempo * 1.3) * 0.05;
    modoAntes = J.modo;
  }
  function dibujar(c, cw, ch) {
    if (!activo) return;
    const dt = J.modo === "juego" || J.modo === "dialogo" ? dtUlt : 0;
    camaraPaso(dt || 1e-4);
    lucesCerca(dt);
    humoPaso(dt);
    figurasPaso();
    fantasmaPaso();
    R.render(escena, camara);
  }
  const sistemaCiudad = { paso, dibujar, cercano };

  // ---------- el sistema (en el bosque: detecta cuando Eromash llega a la ciudad) ----------
  const sistema = {
    iniciar(api) {
      A = api;
      J = A.J;
      jug = A.jug;
      W = A.W;
      H = A.H;
    },
    alEmpezar(extra) {
      extra.eikholt = Object.assign({ dentro: false }, extra.eikholt || {});
      st = extra.eikholt;
      if (activo) {
        activo = false;
        if (lienzo3d) lienzo3d.style.display = "none";
        if (J.dentro === sistemaCiudad) J.dentro = null;
      }
      salida = 0;
      // ?eikholt=1 (pruebas): arranca en la Puerta del Sur, del lado de adentro
      if (/[?&]eikholt=1/.test(location.search) && !st.dentro) {
        jug.x = W.CIUDAD.c[0];
        jug.y = W.CIUDAD.c[1] + W.CIUDAD.ry * 0.97;
      }
    },
    actualizar(dt) {
      if (salida > 0) salida -= dt;
      if (activo || !st || J.modo !== "juego" || salida > 0) return;
      if (!dentroElipse(jug.x, jug.y, 0.985)) return;
      // por cuál puerta llegó
      const C = W.CIUDAD;
      const a = Math.atan2((jug.y - C.c[1]) / C.ry, (jug.x - C.c[0]) / C.rx);
      let puerta = null;
      for (const k in EIKPLANO.PUERTAS) if (Math.abs(corto(EIKPLANO.PUERTAS[k] - a)) < 0.12 && !dentroElipse(jug.x, jug.y, 0.9)) puerta = k;
      if (st.dentro && st.x != null && !puerta && Math.hypot(aBosque(st.x, st.z)[0] - jug.x, aBosque(st.x, st.z)[1] - jug.y) < 2500) entrar({ guardado: true, x: st.x, z: st.z, y: st.y, yaw: st.yaw });
      else entrar({ puerta });
    },
  };
  (window.SISTEMAS = window.SISTEMAS || []).push(sistema);
  return { activo: () => activo, info: () => R && { calls: R.info.render.calls, tris: R.info.render.triangles, rig, dentro: edificioDentro && edificioDentro.nombre }, pos, cam, plano: () => plano, entrar, salir, RIGS };
})();
