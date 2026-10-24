// ---------- geometría de caras planas (módulo GEO) ----------
// La base de todo lo que se arma en 3D en Eikholt: un «armador» junta triángulos con su color (sin texturas), cada cara
// con su normal propia, así la luz pinta caras planas como en la arena (la mitad que no mira al sol queda en sombra).
// Cada pieza (caja, prisma, cilindro, cono, losa, triángulo) se pone con la transformación de turno (mover, girar,
// escalar), y al final arm.malla(material) devuelve una sola malla: pocas llamadas de dibujo aunque la casa tenga
// cientos de tablas. El color de cada cara varía un poco (vario) para que no se vea de plástico.
// Uso: const a = GEO.armador(semilla); a.caja(x, y, z, ancho, alto, fondo, "#5E4A36"); a.malla(GEO.MAT.mate);
window.GEO = (function () {
  "use strict";
  const T = THREE;
  // números al azar con semilla (el mismo Eikholt en cada partida)
  function azar(s) {
    let a = (s * 2654435761) >>> 0 || 1;
    return () => {
      a ^= a << 13;
      a >>>= 0;
      a ^= a >>> 17;
      a ^= a << 5;
      a >>>= 0;
      return a / 4294967296;
    };
  }
  const cache = {};
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (cache[c]) return cache[c];
    const k = new T.Color(c);
    return (cache[c] = [k.r, k.g, k.b]);
  }
  // mezcla dos colores (para el musgo, el hollín, la noche)
  function mezclar(a, b, f) {
    const x = rgb(a),
      y = rgb(b);
    return [x[0] + (y[0] - x[0]) * f, x[1] + (y[1] - x[1]) * f, x[2] + (y[2] - x[2]) * f];
  }
  function aclarar(a, f) {
    const x = rgb(a);
    return f >= 0 ? mezclar(x, [1, 1, 1], f) : mezclar(x, [0, 0, 0], -f);
  }

  // ---------- el armador ----------
  function armador(semilla = 1, vario = 0.05) {
    const pos = [],
      col = [];
    const r = azar(semilla);
    const pila = [new T.Matrix4()];
    const v = new T.Vector3();
    let M = pila[0];
    const tono = (c) => {
      const k = rgb(c),
        d = (r() - 0.5) * 2 * vario;
      return [Math.max(0, k[0] * (1 + d)), Math.max(0, k[1] * (1 + d)), Math.max(0, k[2] * (1 + d))];
    };
    function punto(p) {
      v.set(p[0], p[1], p[2]).applyMatrix4(M);
      pos.push(v.x, v.y, v.z);
    }
    // un triángulo en sentido antihorario visto desde afuera
    function tri(a, b, c, color) {
      const k = tono(color);
      punto(a);
      punto(b);
      punto(c);
      col.push(...k, ...k, ...k);
    }
    function quad(a, b, c, d, color) {
      const k = tono(color);
      punto(a);
      punto(b);
      punto(c);
      punto(a);
      punto(c);
      punto(d);
      for (let i = 0; i < 6; i++) col.push(...k);
    }
    // la transformación de turno: con(fn, { x, y, z, ry, rx, rz, s, sx, sy, sz })
    const mt = new T.Matrix4(),
      q = new T.Quaternion(),
      e = new T.Euler();
    function con(o, fn) {
      e.set(o.rx || 0, o.ry || 0, o.rz || 0, "YXZ");
      q.setFromEuler(e);
      const s = o.s || 1;
      mt.compose(new T.Vector3(o.x || 0, o.y || 0, o.z || 0), q, new T.Vector3((o.sx || 1) * s, (o.sy || 1) * s, (o.sz || 1) * s));
      const nueva = M.clone().multiply(mt);
      pila.push(nueva);
      M = nueva;
      try {
        fn();
      } finally {
        pila.pop();
        M = pila[pila.length - 1];
      }
    }
    // caja con la base en y (no el centro): color puede ser { arriba, abajo, lados, frente } o un solo color
    function caja(x, y, z, w, h, d, color, ry) {
      const c = typeof color === "object" && !Array.isArray(color) ? color : { arriba: color, lados: color };
      const lados = c.lados || c.arriba,
        arriba = c.arriba || lados,
        abajo = c.abajo || lados;
      const f = (fn) => (ry ? con({ x, y, z, ry }, () => fn(0, 0, 0)) : fn(x, y, z));
      f((x, y, z) => {
        const a = w / 2,
          b = d / 2;
        const p = [
          [x - a, y, z - b], [x + a, y, z - b], [x + a, y, z + b], [x - a, y, z + b],
          [x - a, y + h, z - b], [x + a, y + h, z - b], [x + a, y + h, z + b], [x - a, y + h, z + b],
        ];
        quad(p[4], p[7], p[6], p[5], arriba);
        if (c.abajo !== false) quad(p[0], p[1], p[2], p[3], abajo);
        quad(p[3], p[2], p[6], p[7], c.frente || lados); // +z
        quad(p[1], p[0], p[4], p[5], c.atras || lados); // -z
        quad(p[2], p[1], p[5], p[6], c.der || lados); // +x
        quad(p[0], p[3], p[7], p[4], c.izq || lados); // -x
      });
    }
    // prisma: un polígono (en x, z, antihorario visto desde arriba) extruido de y0 a y1
    function prisma(pts, y0, y1, color, colorArriba, sinTapas) {
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const [ax, az] = pts[i],
          [bx, bz] = pts[(i + 1) % n];
        quad([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], color);
      }
      if (sinTapas) return;
      for (let i = 1; i < n - 1; i++) {
        tri([pts[0][0], y1, pts[0][1]], [pts[i + 1][0], y1, pts[i + 1][1]], [pts[i][0], y1, pts[i][1]], colorArriba || color);
        tri([pts[0][0], y0, pts[0][1]], [pts[i][0], y0, pts[i][1]], [pts[i + 1][0], y0, pts[i + 1][1]], color);
      }
    }
    // cilindro (o tronco de cono) de n caras, base en y; r1 = 0 da un cono
    function cilindro(x, y, z, r0, r1, h, n, color, colorArriba, tapa = true) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2,
          a1 = ((i + 1) / n) * Math.PI * 2;
        const c0 = Math.cos(a0),
          s0 = Math.sin(a0),
          c1 = Math.cos(a1),
          s1 = Math.sin(a1);
        if (r1 > 0) quad([x + c0 * r0, y, z + s0 * r0], [x + c0 * r1, y + h, z + s0 * r1], [x + c1 * r1, y + h, z + s1 * r1], [x + c1 * r0, y, z + s1 * r0], color);
        else tri([x + c0 * r0, y, z + s0 * r0], [x, y + h, z], [x + c1 * r0, y, z + s1 * r0], color);
        if (tapa && r1 > 0) tri([x, y + h, z], [x + c1 * r1, y + h, z + s1 * r1], [x + c0 * r1, y + h, z + s0 * r1], colorArriba || color);
      }
    }
    // un palo entre dos puntos (vigas, sogas gruesas, ramas): prisma de n caras
    function palo(a, b, r, color, n = 5, r2) {
      const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
        l = d.length();
      if (l < 1e-4) return;
      const up = new T.Vector3(0, 1, 0),
        qq = new T.Quaternion().setFromUnitVectors(up, d.clone().normalize());
      const m = new T.Matrix4().compose(new T.Vector3(a[0], a[1], a[2]), qq, new T.Vector3(1, 1, 1));
      const nueva = M.clone().multiply(m);
      pila.push(nueva);
      M = nueva;
      cilindro(0, 0, 0, r, r2 != null ? r2 : r, l, n, color, color, false);
      pila.pop();
      M = pila[pila.length - 1];
    }
    // bola de caras planas (copas, piedras, hongos): un icosaedro deformado con semilla
    function bola(x, y, z, rx, ry, rz, color, detalle = 0, deform = 0.18, colorAbajo) {
      const g = new T.IcosahedronGeometry(1, detalle);
      const p = g.attributes.position;
      const rr = azar(Math.floor(x * 31 + z * 17 + y * 7) + semilla);
      const desp = {};
      for (let i = 0; i < p.count; i++) {
        const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3);
        if (!desp[k]) desp[k] = 1 + (rr() - 0.5) * 2 * deform;
        const f = desp[k];
        p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
      }
      for (let i = 0; i < p.count; i += 3) {
        const yy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
        const c = colorAbajo && yy < -0.25 ? colorAbajo : color;
        tri([x + p.getX(i) * rx, y + p.getY(i) * ry, z + p.getZ(i) * rz], [x + p.getX(i + 1) * rx, y + p.getY(i + 1) * ry, z + p.getZ(i + 1) * rz], [x + p.getX(i + 2) * rx, y + p.getY(i + 2) * ry, z + p.getZ(i + 2) * rz], c);
      }
      g.dispose();
    }
    // una losa inclinada con grosor: cuatro esquinas de arriba (antihorario visto desde arriba) y el grosor hacia abajo
    function losa(p0, p1, p2, p3, grosor, color, colorCanto) {
      const b = (p) => [p[0], p[1] - grosor, p[2]];
      quad(p0, p1, p2, p3, color);
      quad(b(p3), b(p2), b(p1), b(p0), colorCanto || color);
      const cc = colorCanto || color;
      [[p0, p1], [p1, p2], [p2, p3], [p3, p0]].forEach(([a, c]) => quad(b(a), b(c), c, a, cc));
    }
    function geometria() {
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      g.computeVertexNormals(); // sin índices: cada triángulo tiene su normal (caras planas)
      g.computeBoundingSphere();
      return g;
    }
    function malla(mat) {
      if (!pos.length) return null;
      const m = new T.Mesh(geometria(), mat || MAT.mate);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }
    return { tri, quad, caja, prisma, cilindro, palo, bola, losa, con, geometria, malla, r, vacio: () => !pos.length, cuenta: () => pos.length / 9 };
  }

  // ---------- materiales compartidos ----------
  // mate: todo lo que recibe luz · brillo: lo que alumbra (ventanas, faroles, runas): no lo apaga la noche;
  // su color se sube de noche desde ciudad.js · runico: el azul de lo antiguo (#73D5DB)
  const MAT = {
    mate: new T.MeshLambertMaterial({ vertexColors: true }),
    brillo: new T.MeshBasicMaterial({ vertexColors: true }),
    runico: new T.MeshBasicMaterial({ vertexColors: true }),
    agua: new T.MeshLambertMaterial({ color: 0x2a4a58, transparent: true, opacity: 0.88 }),
    piedraNegra: new T.MeshLambertMaterial({ color: 0x141414 }),
  };
  // funde mallas ya ubicadas (con su matrixWorld al día) en una por material: cientos de casas, pocas llamadas de dibujo
  function fundir(mallas) {
    const por = new Map();
    for (const m of mallas) {
      if (!m || !m.geometry) continue;
      const g = m.geometry;
      if (!g.attributes.color || g.index) continue;
      if (!por.has(m.material)) por.set(m.material, []);
      por.get(m.material).push(m);
    }
    const salida = [];
    const v = new T.Vector3(),
      nm = new T.Matrix3();
    for (const [mat, lista] of por) {
      let n = 0;
      for (const m of lista) n += m.geometry.attributes.position.count;
      const pos = new Float32Array(n * 3),
        nor = new Float32Array(n * 3),
        col = new Float32Array(n * 3);
      let o = 0;
      for (const m of lista) {
        const g = m.geometry,
          P = g.attributes.position,
          N = g.attributes.normal,
          C = g.attributes.color;
        nm.getNormalMatrix(m.matrixWorld);
        for (let i = 0; i < P.count; i++, o += 3) {
          v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
          pos[o] = v.x;
          pos[o + 1] = v.y;
          pos[o + 2] = v.z;
          v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
          nor[o] = v.x;
          nor[o + 1] = v.y;
          nor[o + 2] = v.z;
          col[o] = C.getX(i);
          col[o + 1] = C.getY(i);
          col[o + 2] = C.getZ(i);
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.BufferAttribute(pos, 3));
      g.setAttribute("normal", new T.BufferAttribute(nor, 3));
      g.setAttribute("color", new T.BufferAttribute(col, 3));
      g.computeBoundingSphere();
      const m = new T.Mesh(g, mat);
      m.castShadow = lista[0].castShadow;
      m.receiveShadow = true;
      salida.push(m);
    }
    return salida;
  }
  return { armador, azar, rgb, mezclar, aclarar, fundir, MAT };
})();
