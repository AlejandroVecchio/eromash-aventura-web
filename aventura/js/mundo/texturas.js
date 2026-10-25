// ---------- las texturas hechas en el editor (TEXTURAS) ----------
// Cada textura es un cuadro de 256 × 256 que se repite sin costura. Puede ser una receta (un tipo de dibujo con sus
// cuatro colores, tamaño, densidad y semilla: se dibuja acá con caras planas y la luz de arriba a la derecha, como el
// resto del juego) o una imagen (generada con IA o subida, ya pasada a los colores del juego y espejada para que no
// tenga costura). Viven en AGREGADOS.texturas: { id: { nombre: { es, en }, receta | img, uso: "parche" | "bloque" | "ambos" } }.
// Al cargarlas se suman a ASSETS.LISTA como assets propios: tx_<id> (un parche pintado en el piso) y txb_<id> (un
// bloque bajo, como una losa o una plataforma), en el grupo «texturas» del editor y del catálogo.
window.TEXTURAS = (function () {
  "use strict";
  const N = 256;
  const TIPOS = ["pasto", "tierra", "piedras", "tablas", "musgo", "nieve", "hojas", "ceniza", "runas", "barro", "arena", "paja", "hielo", "ladrillos"];
  // los colores de base de cada tipo: fondo, dos tonos y la luz (o el brillo)
  const COLORES = {
    pasto: ["#3E5A2C", "#4E6E34", "#2F4724", "#7A9046"],
    tierra: ["#5A4632", "#6E5A3A", "#4A3828", "#8A7350"],
    piedras: ["#3A3430", "#6E6A64", "#5A5650", "#8C8880"],
    tablas: ["#4A3220", "#6E4A2E", "#5A3C24", "#8A6040"],
    musgo: ["#2E3A20", "#4E6A2C", "#3E5226", "#8AA050"],
    nieve: ["#E6EEF0", "#C8D4DC", "#B0BEC8", "#FFFFFF"],
    hojas: ["#4A3828", "#9C2315", "#C8402D", "#F5A524"],
    ceniza: ["#2A2624", "#3E3834", "#C8402D", "#FF8D71"],
    runas: ["#3A3632", "#5A5650", "#4A4642", "#73D5DB"],
    barro: ["#3E2E20", "#2A1E16", "#4E3A28", "#8A7350"],
    arena: ["#B89A6A", "#A0845A", "#8A7050", "#E0C890"],
    paja: ["#8A6E3A", "#B0904A", "#6E5630", "#E0C070"],
    hielo: ["#9EC4D4", "#BEDCE6", "#7EA6B8", "#F2FAFC"],
    ladrillos: ["#3A2A24", "#9C2315", "#7A2A1C", "#C8402D"],
  };
  // los que brillan solos (runas grabadas y brasas): en el juego laten despacio si la calidad gráfica lo deja
  const BRILLAN = { runas: true, ceniza: true };
  const tabla = {}, // id → textura
    cache = {}; // receta o imagen → { cv }
  function azar(sem) {
    let a = (sem | 0) + 0x6d2b79f5;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const aclarar = (hex, k) => {
    const n = parseInt(hex.slice(1), 16),
      f = (v) => Math.max(0, Math.min(255, Math.round(v + (k > 0 ? (255 - v) * k : v * k))));
    return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
  };

  // ---------- recetas: cada forma se dibuja nueve veces corrida un cuadro, así el borde de un lado sigue en el otro ----------
  function generar(rc) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const c = cv.getContext("2d"),
      col = (rc.colores && rc.colores.length === 4 ? rc.colores : COLORES[rc.tipo] || COLORES.pasto).slice(),
      r = azar((rc.sem || 1) * 7919),
      tam = Math.max(6, Math.min(80, rc.tam || 24)),
      dens = Math.max(1, Math.min(12, rc.dens || 5));
    const [fondo, c1, c2, luz] = col;
    c.fillStyle = fondo;
    c.fillRect(0, 0, N, N);
    const rep = (fn) => {
      for (let dx = -N; dx <= N; dx += N) for (let dy = -N; dy <= N; dy += N) fn(dx, dy);
    };
    const poli = (pts, color, dx, dy) => {
      c.beginPath();
      for (let i = 0; i < pts.length; i += 2) (i ? c.lineTo : c.moveTo).call(c, pts[i] + dx, pts[i + 1] + dy);
      c.closePath();
      c.fillStyle = color;
      c.fill();
    };
    // una piedra o mancha de caras planas: el cuerpo, la cara clara arriba a la derecha y la sombra abajo a la izquierda
    const piedra = (x, y, rx, ry, color, conLuz) => {
      const n = 7,
        a0 = r() * 6.28,
        k = Array.from({ length: n }, () => 0.78 + r() * 0.3),
        pts = [];
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * 6.283;
        pts.push(x + Math.cos(a) * rx * k[i], y + Math.sin(a) * ry * k[i]);
      }
      rep((dx, dy) => {
        poli(pts, color, dx, dy);
        if (conLuz) {
          poli([x - rx * 0.1, y - ry * 0.85, x + rx * 0.85, y - ry * 0.35, x + rx * 0.35, y + ry * 0.05, x - rx * 0.05, y - ry * 0.25], aclarar(color, 0.22), dx, dy);
          poli([x - rx * 0.9, y + ry * 0.1, x - rx * 0.2, y + ry * 0.8, x + rx * 0.2, y + ry * 0.75, x - rx * 0.4, y + ry * 0.15], aclarar(color, -0.22), dx, dy);
        }
      });
    };
    const cuantos = (base) => Math.round(base * dens * (24 / tam) * (24 / tam));
    const tipo = rc.tipo;
    if (tipo === "pasto" || tipo === "musgo") {
      for (let i = 0; i < cuantos(3); i++) piedra(r() * N, r() * N, tam * (0.8 + r()), tam * (0.45 + r() * 0.4), r() < 0.5 ? c1 : c2, false);
      // matas: dos o tres hojas en punta, la clara del lado de la luz
      for (let i = 0; i < cuantos(9); i++) {
        const x = r() * N,
          y = r() * N,
          h = tam * (0.35 + r() * 0.4),
          w = h * 0.28,
          izq = r() < 0.5 ? c2 : c1,
          conLuz = r() < 0.45;
        rep((dx, dy) => {
          poli([x - w * 2, y, x - w * 1.3, y - h * 0.8, x - w * 0.4, y], izq, dx, dy);
          poli([x - w * 0.6, y, x + w * 0.3, y - h, x + w, y], tipo === "musgo" ? c1 : aclarar(c1, 0.1), dx, dy);
          if (conLuz) poli([x + w * 0.4, y, x + w * 1.6, y - h * 0.7, x + w * 2, y], luz, dx, dy);
        });
      }
      if (tipo === "musgo") for (let i = 0; i < cuantos(4); i++) piedra(r() * N, r() * N, tam * 0.2, tam * 0.14, luz, false);
    } else if (tipo === "tierra" || tipo === "ceniza") {
      for (let i = 0; i < cuantos(3); i++) piedra(r() * N, r() * N, tam * (0.9 + r()), tam * (0.5 + r() * 0.4), c1, false);
      if (tipo === "ceniza") {
        // grietas oscuras y brasas sueltas
        c.strokeStyle = aclarar(fondo, -0.35);
        c.lineWidth = 2;
        for (let i = 0; i < cuantos(1.2); i++) {
          let x = r() * N,
            y = r() * N;
          const pasos = [[x, y]];
          for (let k = 0; k < 5; k++) pasos.push([(x += (r() - 0.5) * tam * 1.4), (y += (r() - 0.5) * tam * 1.4)]);
          rep((dx, dy) => {
            c.beginPath();
            pasos.forEach(([px, py], j) => (j ? c.lineTo(px + dx, py + dy) : c.moveTo(px + dx, py + dy)));
            c.stroke();
          });
        }
        for (let i = 0; i < cuantos(3); i++) piedra(r() * N, r() * N, tam * 0.12, tam * 0.09, r() < 0.6 ? c2 : luz, false);
      } else for (let i = 0; i < cuantos(5); i++) piedra(r() * N, r() * N, tam * (0.14 + r() * 0.18), tam * (0.1 + r() * 0.12), r() < 0.6 ? c2 : luz, true);
    } else if (tipo === "piedras" || tipo === "runas") {
      // adoquines o losas: una grilla movida, cada pieza con sus caras
      const paso = tipo === "runas" ? tam * 2.4 : tam * 1.2,
        n = Math.max(2, Math.round(N / paso)),
        p = N / n;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const corr = j % 2 ? p / 2 : 0,
            x = i * p + corr + p / 2,
            y = j * p + p / 2,
            color = r() < 0.5 ? c1 : c2;
          if (tipo === "piedras") piedra(x + (r() - 0.5) * p * 0.12, y + (r() - 0.5) * p * 0.12, p * 0.44, p * 0.4, color, true);
          else {
            const m = p * 0.06;
            rep((dx, dy) => {
              poli([x - p / 2 + m, y - p / 2 + m, x + p / 2 - m, y - p / 2 + m, x + p / 2 - m, y + p / 2 - m, x - p / 2 + m, y + p / 2 - m], color, dx, dy);
              poli([x - p / 2 + m, y - p / 2 + m, x + p / 2 - m, y - p / 2 + m, x + p / 2 - m * 3, y - p / 2 + m * 3], aclarar(color, 0.18), dx, dy);
              poli([x - p / 2 + m, y + p / 2 - m, x + p / 2 - m, y + p / 2 - m, x + p / 2 - m * 3, y + p / 2 - m * 3, x - p / 2 + m * 3, y + p / 2 - m * 3], aclarar(color, -0.2), dx, dy);
            });
            // una runa grabada que brilla, en algunas losas
            if (r() < 0.12 * dens) {
              const h = p * 0.32,
                trazos = [[[0, -h], [0, h]], [[0, -h * 0.4], [h * 0.5, -h]], [[0, 0], [h * 0.5, -h * 0.5]], [[0, -h * 0.2], [-h * 0.5, -h * 0.7]], [[0, h * 0.2], [h * 0.5, h * 0.7]]],
                usados = trazos.slice(0, 1).concat(trazos.slice(1).filter(() => r() < 0.5));
              c.strokeStyle = luz;
              c.lineWidth = Math.max(2, p * 0.05);
              c.lineCap = "round";
              rep((dx, dy) =>
                usados.forEach(([a, b]) => {
                  c.beginPath();
                  c.moveTo(x + a[0] + dx, y + a[1] + dy);
                  c.lineTo(x + b[0] + dx, y + b[1] + dy);
                  c.stroke();
                }),
              );
            }
          }
        }
    } else if (tipo === "tablas") {
      const alto = Math.max(10, tam),
        filas = Math.max(2, Math.round(N / alto)),
        h = N / filas;
      for (let j = 0; j < filas; j++) {
        let x = r() * N;
        const fin = x + N;
        while (x < fin) {
          const largo = Math.min(fin - x, h * (3 + r() * 5)),
            color = r() < 0.5 ? c1 : c2,
            y = j * h;
          rep((dx, dy) => {
            poli([x + 1, y + 1, x + largo - 1, y + 1, x + largo - 1, y + h - 1, x + 1, y + h - 1], color, dx, dy);
            poli([x + 1, y + 1, x + largo - 1, y + 1, x + largo - 1, y + h * 0.28], aclarar(color, 0.16), dx, dy);
            poli([x + 1, y + h - 1, x + largo - 1, y + h - 1, x + largo - 1, y + h * 0.8, x + 1, y + h * 0.86], aclarar(color, -0.18), dx, dy);
          });
          if (r() < 0.08 * dens) piedra(x + largo * r(), j * h + h / 2, h * 0.16, h * 0.12, aclarar(color, -0.3), false);
          x += largo;
        }
      }
    } else if (tipo === "nieve") {
      for (let i = 0; i < cuantos(3); i++) piedra(r() * N, r() * N, tam * (1 + r()), tam * (0.5 + r() * 0.4), r() < 0.5 ? c1 : c2, false);
      for (let i = 0; i < cuantos(3); i++) piedra(r() * N, r() * N, tam * (0.6 + r() * 0.6), tam * (0.3 + r() * 0.2), fondo, false);
      for (let i = 0; i < cuantos(6); i++) piedra(r() * N, r() * N, 1.6, 1.6, luz, false);
    } else if (tipo === "hojas") {
      for (let i = 0; i < cuantos(2); i++) piedra(r() * N, r() * N, tam, tam * 0.6, aclarar(fondo, 0.08), false);
      // hojas caídas: rombos con su nervio claro, cada una para un lado
      for (let i = 0; i < cuantos(10); i++) {
        const x = r() * N,
          y = r() * N,
          a = r() * 6.28,
          l = tam * (0.3 + r() * 0.25),
          w = l * 0.45,
          ca = Math.cos(a),
          sa = Math.sin(a),
          q = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca],
          color = [c1, c2, luz][Math.floor(r() * 3)];
        rep((dx, dy) => {
          poli([].concat(q(-l, 0), q(0, -w), q(l, 0), q(0, w)), color, dx, dy);
          poli([].concat(q(-l, 0), q(0, -w), q(l, 0)), aclarar(color, 0.15), dx, dy);
        });
      }
    } else if (tipo === "barro") {
      for (let i = 0; i < cuantos(3); i++) piedra(r() * N, r() * N, tam * (0.9 + r()), tam * (0.5 + r() * 0.4), c2, false);
      // charcos con su reflejo claro arriba a la derecha
      for (let i = 0; i < cuantos(1); i++) {
        const x = r() * N,
          y = r() * N,
          rx = tam * (0.8 + r() * 0.8);
        piedra(x, y, rx, rx * 0.5, aclarar(c1, -0.15), false);
        piedra(x + rx * 0.3, y - rx * 0.15, rx * 0.35, rx * 0.08, luz, false);
      }
      for (let i = 0; i < cuantos(3); i++) piedra(r() * N, r() * N, tam * 0.16, tam * 0.1, c2, true);
    } else if (tipo === "arena") {
      // ondas de viento: tiras finas onduladas, y alguna piedrita
      const filas = Math.max(3, Math.round(N / Math.max(8, tam * 0.8)));
      for (let j = 0; j < filas; j++) {
        const y0 = (j + r() * 0.4) * (N / filas),
          fase = r() * 6.28,
          amp = tam * 0.18,
          color = j % 2 ? c1 : c2,
          pts = [];
        for (let x = 0; x <= N; x += 8) pts.push(x, y0 + Math.sin((x / N) * 6.283 * 2 + fase) * amp);
        for (let x = N; x >= 0; x -= 8) pts.push(x, y0 + Math.sin((x / N) * 6.283 * 2 + fase) * amp + Math.max(2, tam * 0.08));
        rep((dx, dy) => poli(pts, color, 0, dy));
      }
      for (let i = 0; i < cuantos(1.5); i++) piedra(r() * N, r() * N, tam * 0.12, tam * 0.08, r() < 0.5 ? c2 : luz, true);
    } else if (tipo === "paja") {
      // hebras largas y finas, casi acostadas, cada una con su lado claro
      for (let i = 0; i < cuantos(14); i++) {
        const x = r() * N,
          y = r() * N,
          a = (r() - 0.5) * 0.9,
          l = tam * (0.8 + r() * 0.9),
          w = Math.max(1.5, tam * 0.06),
          ca = Math.cos(a),
          sa = Math.sin(a),
          color = [c1, c2, luz][Math.floor(r() * 3)];
        rep((dx, dy) => poli([x - ca * l, y - sa * l, x + ca * l, y + sa * l, x + ca * l - sa * w, y + sa * l + ca * w, x - ca * l - sa * w, y - sa * l + ca * w], color, dx, dy));
      }
    } else if (tipo === "hielo") {
      // placas de caras planas con su filo de luz, y grietas finas
      for (let i = 0; i < cuantos(2); i++) piedra(r() * N, r() * N, tam * (1 + r()), tam * (0.6 + r() * 0.5), r() < 0.5 ? c1 : c2, true);
      c.strokeStyle = luz;
      c.lineWidth = 1.5;
      for (let i = 0; i < cuantos(1); i++) {
        let x = r() * N,
          y = r() * N;
        const pasos = [[x, y]];
        for (let k = 0; k < 4; k++) pasos.push([(x += (r() - 0.5) * tam * 2), (y += (r() - 0.5) * tam * 2)]);
        rep((dx, dy) => {
          c.beginPath();
          pasos.forEach(([px, py], j) => (j ? c.lineTo(px + dx, py + dy) : c.moveTo(px + dx, py + dy)));
          c.stroke();
        });
      }
    } else if (tipo === "ladrillos") {
      // hiladas de ladrillos iguales, cada fila corrida medio ladrillo, con la junta del color de fondo
      const h = Math.max(8, tam * 0.8),
        filas = Math.max(2, Math.round(N / h)),
        hh = N / filas,
        cols = Math.max(2, Math.round(N / (hh * 2.2))),
        ww = N / cols,
        m = Math.max(1.5, hh * 0.1);
      for (let j = 0; j < filas; j++)
        for (let i = 0; i <= cols; i++) {
          const x = i * ww - (j % 2 ? ww / 2 : 0),
            y = j * hh,
            color = r() < 0.5 ? c1 : c2;
          rep((dx, dy) => {
            poli([x + m, y + m, x + ww - m, y + m, x + ww - m, y + hh - m, x + m, y + hh - m], color, dx, dy);
            poli([x + m, y + m, x + ww - m, y + m, x + ww - m, y + hh * 0.32], aclarar(color, 0.14), dx, dy);
            poli([x + m, y + hh - m, x + ww - m, y + hh - m, x + ww - m, y + hh * 0.8, x + m, y + hh * 0.86], aclarar(color, -0.2), dx, dy);
          });
          if (r() < 0.04 * dens) piedra(x + ww * 0.6, y + hh * 0.4, hh * 0.12, hh * 0.08, luz, false);
        }
    }
    return cv;
  }

  // ---------- imágenes: a los colores del juego, posterizadas y espejadas en cuatro para que no tengan costura ----------
  function coloresDelJuego() {
    const s = new Set();
    const juntar = (v) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? s.add(v.toUpperCase()) : Array.isArray(v) ? v.forEach(juntar) : null);
    if (window.ASSETS && ASSETS.C) Object.values(ASSETS.C).forEach(juntar);
    Object.values(COLORES).forEach(juntar);
    return [...s].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  }
  // img: una imagen ya cargada. Devuelve un dataURL PNG de 256 × 256.
  // opc: paleta (a los colores del juego), espejo (sin costura), colores (0 todos, o los N más usados), brillo,
  // contraste y saturacion (de -1 a 1), liviana (128 × 128: pesa la cuarta parte)
  function procesar(img, opc) {
    opc = opc || {};
    const N = opc.liviana ? 128 : 256,
      cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const c = cv.getContext("2d"),
      m = N / 2,
      lado = Math.min(img.width, img.height),
      sx = (img.width - lado) / 2,
      sy = (img.height - lado) / 2;
    if (opc.espejo !== false) {
      // un cuarto y sus tres reflejos: el borde de la derecha es el de la izquierda, y lo mismo arriba y abajo
      c.drawImage(img, sx, sy, lado, lado, 0, 0, m, m);
      [[-1, 1, N, 0], [1, -1, 0, N], [-1, -1, N, N]].forEach(([ex, ey, tx, ty]) => {
        c.save();
        c.translate(tx, ty);
        c.scale(ex, ey);
        c.drawImage(cv, 0, 0, m, m, 0, 0, m, m);
        c.restore();
      });
    } else c.drawImage(img, sx, sy, lado, lado, 0, 0, N, N);
    const br = opc.brillo || 0,
      co = opc.contraste || 0,
      sa = opc.saturacion || 0;
    if (br || co || sa) {
      const d = c.getImageData(0, 0, N, N),
        px = d.data,
        kc = 1 + co;
      for (let i = 0; i < px.length; i += 4) {
        let r = px[i],
          g = px[i + 1],
          b = px[i + 2];
        const gris = r * 0.3 + g * 0.59 + b * 0.11;
        r = gris + (r - gris) * (1 + sa);
        g = gris + (g - gris) * (1 + sa);
        b = gris + (b - gris) * (1 + sa);
        px[i] = (r - 128) * kc + 128 + br * 110;
        px[i + 1] = (g - 128) * kc + 128 + br * 110;
        px[i + 2] = (b - 128) * kc + 128 + br * 110;
      }
      c.putImageData(d, 0, 0);
    }
    if (opc.paleta !== false) {
      // cada píxel al color del juego más cercano: así queda plano, sin degradés, como lo demás
      let pal = coloresDelJuego();
      const d = c.getImageData(0, 0, N, N),
        px = d.data;
      let memo = new Map();
      const cercano = (r, g, b, lista) => {
        let bd = 1e9,
          best = lista[0];
        for (const p of lista) {
          const dr = r - p[0],
            dg = g - p[1],
            db = b - p[2],
            dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
          if (dd < bd) (bd = dd), (best = p);
        }
        return best;
      };
      // con pocos colores: primero se cuenta cuáles del juego se usarían y se quedan los N que más aparecen
      if (opc.colores > 0) {
        const cuenta = new Map();
        for (let i = 0; i < px.length; i += 16) {
          const p = cercano(px[i], px[i + 1], px[i + 2], pal);
          cuenta.set(p, (cuenta.get(p) || 0) + 1);
        }
        pal = [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, opc.colores).map((q) => q[0]);
      }
      for (let i = 0; i < px.length; i += 4) {
        const k = ((px[i] >> 3) << 10) | ((px[i + 1] >> 3) << 5) | (px[i + 2] >> 3);
        let best = memo.get(k);
        if (!best) memo.set(k, (best = cercano(px[i], px[i + 1], px[i + 2], pal)));
        px[i] = best[0];
        px[i + 1] = best[1];
        px[i + 2] = best[2];
        px[i + 3] = 255;
      }
      c.putImageData(d, 0, 0);
    }
    return cv.toDataURL("image/png");
  }

  // ---------- el lienzo de cada textura (se arma una vez por receta o imagen) ----------
  function lienzoDe(tx) {
    if (!tx) return null;
    const firma = tx.img ? tx.img.length + ":" + tx.img.slice(-48) : JSON.stringify(tx.receta);
    const k = cache[firma];
    if (k) return k.cv;
    if (tx.img) {
      const im = new Image(),
        hueco = { cv: null };
      cache[firma] = hueco;
      im.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = N;
        const g = cv.getContext("2d");
        // la liviana (128) se agranda sin suavizar: sigue viéndose plana
        g.imageSmoothingEnabled = false;
        g.drawImage(im, 0, 0, N, N);
        hueco.cv = cv;
      };
      im.src = tx.img;
      return null;
    }
    cache[firma] = { cv: generar(tx.receta || {}) };
    return cache[firma].cv;
  }
  const lienzo = (id) => lienzoDe(tabla[id]);
  const colorDe = (id) => {
    const tx = tabla[id];
    return (tx && tx.receta && tx.receta.colores && tx.receta.colores[0]) || (tx && tx.color) || "#4A3828";
  };
  function patron(c, id, x, y, k) {
    const cv = lienzo(id);
    if (!cv) return colorDe(id);
    const p = c.createPattern(cv, "repeat");
    // en el piso se ve de costado: la textura se achata un poco a lo alto
    if (p.setTransform) p.setTransform(new DOMMatrix().translate(x, y).scale(0.5 * k, 0.34 * k));
    return p;
  }

  // ---------- los dos assets de cada textura ----------
  // el latido de lo que brilla solo: la misma forma otra vez, en el color de la luz y sumada, más o menos fuerte
  function latir(c, tx, t, forma) {
    if (!tx || !tx.receta || !BRILLAN[tx.receta.tipo] || (window.CALIDAD && CALIDAD.nivel === "baja")) return;
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 0.07 + 0.06 * Math.sin((t || 0) * 2.2);
    forma();
    c.fillStyle = tx.receta.colores[3];
    c.fill();
    c.restore();
  }
  // parche: una mancha pintada en el piso. o.s tamaño, o.rx / o.ry radios, o.k escala de la textura, o.sem forma.
  // Su forma sale de la textura (tx.forma): quebrado (el borde roto), redondo, alargado o manchas (varias juntas)
  function parche(id) {
    return (c, x, y, t, o) => {
      const tx = tabla[id] || {},
        s = o.s || 1,
        tipoForma = o.forma || tx.forma || "quebrado",
        alarga = tipoForma === "alargado" ? [1.5, 0.6] : [1, 1],
        rx = (o.rx || 200) * s * alarga[0],
        ry = (o.ry || 100) * s * alarga[1],
        r = azar((o.sem || 1) * 131 + 3),
        redondo = tipoForma === "redondo",
        n = redondo ? 28 : 14,
        // manchas: tres o cuatro óvalos juntos, cada uno con su borde
        partes = tipoForma === "manchas" ? Array.from({ length: 3 + Math.floor(r() * 2) }, (q, i) => (i ? [(r() - 0.5) * rx * 1.1, (r() - 0.5) * ry * 1.1, 0.45 + r() * 0.3] : [0, 0, 0.7])) : [[0, 0, 1]],
        ks = partes.map(() => Array.from({ length: n }, () => (redondo ? 1 : 0.82 + r() * 0.22))),
        forma = (m) => {
          c.beginPath();
          partes.forEach(([px, py, e], j) => {
            for (let i = 0; i < n; i++) {
              const a = (i / n) * 6.283;
              (i ? c.lineTo : c.moveTo).call(c, x + px + Math.cos(a) * rx * e * ks[j][i] * m, y + py + Math.sin(a) * ry * e * ks[j][i] * m);
            }
            c.closePath();
          });
        };
      c.save();
      // un borde apenas más grande y oscuro, para que se asiente en el pasto sin contorno
      forma(1.08);
      c.fillStyle = "rgba(17,17,17,0.16)";
      c.fill("nonzero");
      forma(1);
      c.fillStyle = patron(c, id, x, y, (o.k || tx.k || 1) * s);
      c.fill("nonzero");
      latir(c, tx, t, () => forma(1));
      c.restore();
    };
  }
  // bloque: una losa o plataforma baja con la textura arriba y al frente; la cara izquierda en sombra.
  // Ancho, fondo y alto salen de la textura (tx.w, tx.d, tx.h) o de o.w, o.d, o.h
  function bloque(id) {
    return (c, x, y, t, o) => {
      const tx = tabla[id] || {},
        s = o.s || 1,
        w = (o.w || tx.w || 160) * s,
        d = (o.d || tx.d || 70) * s,
        h = (o.h || tx.h || 26) * s,
        x0 = x - w / 2,
        x1 = x + w / 2,
        k = (o.k || tx.k || 1) * s;
      c.save();
      c.beginPath();
      c.ellipse(x + 6 * s, y + 4 * s, w * 0.56, h * 0.6 + 6 * s, 0, 0, 6.283);
      c.fillStyle = "rgba(17,17,17,0.25)";
      c.fill();
      const pat = patron(c, id, x, y, k);
      // el frente, más oscuro
      c.fillStyle = pat;
      c.fillRect(x0, y - h, w, h);
      c.fillStyle = "rgba(17,17,17,0.38)";
      c.fillRect(x0, y - h, w, h);
      // arriba
      const arriba = () => {
        c.beginPath();
        c.moveTo(x0, y - h);
        c.lineTo(x1, y - h);
        c.lineTo(x1, y - h - d);
        c.lineTo(x0, y - h - d);
        c.closePath();
      };
      arriba();
      c.fillStyle = pat;
      c.fill();
      // la luz viene de arriba a la derecha: la mitad izquierda queda en sombra
      c.fillStyle = "rgba(17,17,17,0.12)";
      c.fillRect(x0, y - h - d, w / 2, d);
      c.fillStyle = "rgba(242,236,236,0.10)";
      c.fillRect(x0, y - h - d, w, Math.max(2, 3 * s));
      latir(c, tx, t, arriba);
      c.restore();
    };
  }
  // el bloque armado con caras: la textura en las cinco caras, más oscura de costado y en sombra del lado de la
  // izquierda (gira con el bloque y con la cámara)
  function bloqueV(id) {
    return (c, x, y, t, o) => {
      const tx = tabla[id] || {},
        pr = VOL.pr(x, y, o),
        w = o.w || tx.w || 160,
        d = o.d || tx.d || 70,
        h = o.h || tx.h || 26,
        pat = patron(c, id, x, y, (o.k || tx.k || 1) * pr.s),
        velo = (cc, l, hh, nx, nz) => {
          const a = nz > 0.5 ? 0.04 : 0.24 + Math.max(0, -nx) * 0.22;
          cc.fillStyle = "rgba(17,17,17," + a + ")";
          cc.fillRect(0, -hh, l, hh);
          if (nz > 0.5) {
            cc.fillStyle = "rgba(242,236,236,0.10)";
            cc.fillRect(0, -hh, l, Math.max(2, 3));
          }
        };
      VOL.sombra(c, pr, 6, 0, w * 0.56, d * 0.6 + 6, 0.25);
      VOL.caja(c, pr, -w / 2, -d / 2, 0, w / 2, d / 2, h, () => pat, { frente: velo, atras: velo, izq: velo, der: velo, arriba: velo });
    };
  }
  // para la vista del editor: dibujar una textura que todavía no está guardada como parche o como bloque
  function dibujarCon(c, tx, como, x, y, t, o) {
    tabla._vista = tx;
    (como === "bloque" ? bloque : parche)("_vista")(c, x, y, t, o || {});
    delete tabla._vista;
  }

  // ---------- registrar ----------
  const ids = (id) => ["tx_" + id, "txb_" + id];
  function registrar(id, tx) {
    if (!window.ASSETS || !tx || (!tx.receta && !tx.img)) return;
    tabla[id] = tx;
    const uso = tx.uso || "parche",
      [ip, ib] = ids(id),
      nom = tx.nombre || {},
      textos = {};
    delete ASSETS.LISTA[ip];
    delete ASSETS.LISTA[ib];
    if (uso !== "bloque") {
      ASSETS.LISTA[ip] = { f: parche(id), alto: 20, choque: null, grupo: "texturas", piso: true, textura: id };
      textos["as." + ip] = { es: nom.es || id, en: nom.en || nom.es || id };
      ASSETS.EJEMPLO[ip] = { rx: 64, ry: 13 };
    }
    if (uso !== "parche") {
      ASSETS.LISTA[ib] = { f: bloque(id), fv: bloqueV(id), vol: true, alto: (tx.h || 26) + (tx.d || 70) * 0.5, choque: { w: tx.w || 160, h: tx.d || 70 }, grupo: "texturas", textura: id };
      textos["as." + ib] = { es: I18N.t("as.tex_bloque", [nom.es || id]), en: I18N.t("as.tex_bloque", [nom.en || nom.es || id]) };
    }
    I18N.textos(textos);
  }
  function quitar(id) {
    ids(id).forEach((k) => (delete ASSETS.LISTA[k], delete ASSETS.EJEMPLO[k]));
    delete tabla[id];
  }
  // todas las de una tabla (las del archivo o las del editor); las que ya no están se sacan
  function cargar(t) {
    t = t || {};
    Object.keys(tabla).forEach((id) => !t[id] && quitar(id));
    Object.keys(t).forEach((id) => registrar(id, t[id]));
  }
  // un id corto y sin tildes desde el nombre
  const idDe = (nombre) =>
    (nombre || "textura")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 28) || "textura";
  cargar(window.AGREGADOS && window.AGREGADOS.texturas);
  return { N, TIPOS, COLORES, BRILLAN, aclarar, dibujarCon, generar, procesar, lienzo, lienzoDe, registrar, quitar, cargar, idDe, lista: () => Object.assign({}, tabla), coloresDelJuego };
})();
