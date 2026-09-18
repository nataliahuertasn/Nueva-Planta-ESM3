/* =====================================================================
   ES Metals — Capa de flujo (recorridos de producto)
   ---------------------------------------------------------------------
   Dibuja sobre el escenario (por encima de las plantas) el recorrido
   de un producto: encierra cada área en orden, la numera y conecta los
   pasos con flechas ortogonales que se trazan secuencialmente.

   Enrutado:
     · Las flechas salen y entran por el lado del área que mira al
       destino; si varias comparten un lado, se reparten a lo largo de él.
     · Entre plantas, cada flecha usa su propio carril en el pasillo
       central (ordenados para no superponerse).
     · Dentro de una planta, codos en ángulo recto con esquinas suaves.

   ESM.drawFlow(stage, steps, views, { color, layer, append })
     steps: [{ plant, area | areas | group }, ...]
   ESM.clearFlow(stage)
   ===================================================================== */
window.ESM = window.ESM || {};

(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const STEP_MS = 650;        // ritmo de aparición de cada paso
  const PAD = 5;              // margen del recuadro alrededor del área
  const LANE = 9;             // separación entre carriles paralelos
  const SPREAD = 16;          // separación entre anclas sobre un mismo lado
  const CORNER = 8;           // radio de las esquinas

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function overlay(stage, append) {
    let svg = stage.querySelector('.flow-overlay');
    if (!svg) {
      svg = el('svg', { class: 'flow-overlay', 'aria-hidden': 'true' });
      stage.appendChild(svg);
    }
    if (!append) svg.innerHTML = '';
    const r = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    svg.setAttribute('width', r.width);
    svg.setAttribute('height', r.height);
    return svg;
  }

  function toStage(stage, r) {
    const s = stage.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height,
             cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2 };
  }

  /* Caja de un área en coordenadas del escenario */
  function box(stage, views, plant, area) {
    const view = views[plant];
    const g = view && view.nodes[area];
    if (!g) return null;
    const b = toStage(stage, g.querySelector('.node-shape').getBoundingClientRect());
    b.plant = plant;
    return b;
  }

  /* Marco de la planta (para ubicar el pasillo entre plantas) */
  function plantBox(stage, views, plant) {
    return toStage(stage, views[plant].svg.getBoundingClientRect());
  }

  function rectPath(b, pad) {
    const x = b.x - pad, y = b.y - pad, w = b.w + 2 * pad, h = b.h + 2 * pad, r = 3;
    return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  }

  /* Polilínea → trazado con esquinas redondeadas */
  function roundedPath(pts) {
    const p = pts.filter((q, i) => i === 0 || Math.abs(q[0] - pts[i - 1][0]) > 0.5 || Math.abs(q[1] - pts[i - 1][1]) > 0.5);
    if (p.length < 2) return '';
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i - 1], b = p[i], c = p[i + 1];
      const r = Math.min(CORNER, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, Math.hypot(c[0] - b[0], c[1] - b[1]) / 2);
      const u1 = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
      const u2 = [Math.sign(c[0] - b[0]), Math.sign(c[1] - b[1])];
      d += ` L${b[0] - u1[0] * r} ${b[1] - u1[1] * r} Q${b[0]} ${b[1]} ${b[0] + u2[0] * r} ${b[1] + u2[1] * r}`;
    }
    const last = p[p.length - 1];
    return d + ` L${last[0]} ${last[1]}`;
  }

  /* Punto de ancla sobre un lado de la caja, desplazado a lo largo del lado */
  function anchorAt(b, side, k, base) {
    // `base` sustituye al centro del lado (p. ej. la columna compartida con el otro extremo)
    switch (side) {
      case 'right': return [b.x + b.w + PAD, (base == null ? b.cy : base) + k];
      case 'left': return [b.x - PAD, (base == null ? b.cy : base) + k];
      case 'bottom': return [(base == null ? b.cx : base) + k, b.y + b.h + PAD];
      default: return [(base == null ? b.cx : base) + k, b.y - PAD];
    }
  }

  /* Decide lados de salida y llegada y si el enlace cruza el pasillo */
  function plan(link, plants) {
    const a = link.a, b = link.b;
    if (a.plant !== b.plant) {
      const pa = plants[a.plant], pb = plants[b.plant];
      if (pa.x + pa.w <= pb.x || pb.x + pb.w <= pa.x) {
        // plantas lado a lado: pasillo vertical
        const leftFirst = pa.x < pb.x;
        link.mode = 'gutter-v';
        link.from = leftFirst ? 'right' : 'left';
        link.to = leftFirst ? 'left' : 'right';
        link.gutter = leftFirst ? (pa.x + pa.w + pb.x) / 2 : (pb.x + pb.w + pa.x) / 2;
        return;
      }
      // plantas apiladas: pasillo horizontal
      const topFirst = pa.y < pb.y;
      link.mode = 'gutter-h';
      link.from = topFirst ? 'bottom' : 'top';
      link.to = topFirst ? 'top' : 'bottom';
      link.gutter = topFirst ? (pa.y + pa.h + pb.y) / 2 : (pb.y + pb.h + pa.y) / 2;
      return;
    }
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    // si comparten columna (solape en x) el enlace es vertical por esa columna;
    // si comparten fila (solape en y), horizontal por esa fila
    const ox1 = Math.max(a.x, b.x), ox2 = Math.min(a.x + a.w, b.x + b.w);
    const oy1 = Math.max(a.y, b.y), oy2 = Math.min(a.y + a.h, b.y + b.h);
    if (ox2 - ox1 > 20 && !(oy2 - oy1 > 20)) {
      link.mode = 'v';
      link.sBase = link.tBase = (ox1 + ox2) / 2;
    } else if (oy2 - oy1 > 20 && !(ox2 - ox1 > 20)) {
      link.mode = 'h';
      link.sBase = link.tBase = (oy1 + oy2) / 2;
    } else {
      link.mode = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }
    if (link.mode === 'h') {
      link.from = dx > 0 ? 'right' : 'left';
      link.to = dx > 0 ? 'left' : 'right';
    } else {
      link.from = dy > 0 ? 'bottom' : 'top';
      link.to = dy > 0 ? 'top' : 'bottom';
    }
  }

  /* Reparte las anclas que comparten un lado de una misma caja */
  function spreadAnchors(links) {
    const groups = {};
    const key = (b, side) => `${b.plant}|${b.x}|${b.y}|${side}`;
    links.forEach(l => {
      (groups[key(l.a, l.from)] = groups[key(l.a, l.from)] || []).push({ l, end: 'a' });
      (groups[key(l.b, l.to)] = groups[key(l.b, l.to)] || []).push({ l, end: 'b' });
    });
    Object.values(groups).forEach(list => {
      // ordenar por la posición del otro extremo para que no se crucen al salir
      list.sort((p, q) => {
        const op = p.end === 'a' ? p.l.b : p.l.a, oq = q.end === 'a' ? q.l.b : q.l.a;
        const side = p.end === 'a' ? p.l.from : p.l.to;
        return (side === 'left' || side === 'right') ? op.cy - oq.cy : op.cx - oq.cx;
      });
      list.forEach((item, i) => {
        item.l[item.end === 'a' ? 'ka' : 'kb'] = (i - (list.length - 1) / 2) * SPREAD;
      });
    });
  }

  /* Polilínea (sin redondear) de un enlace para un desplazamiento de carril dado */
  /* Obstáculos (todas las cajas de cada planta) y rótulos, en coordenadas
     del escenario; se cargan en cada drawFlow */
  let OBST = {}, LABELS = {}, PLANTS = {};

  /* ¿El tramo p→q (ortogonal) atraviesa la caja o? */
  function segCrossesBox(p, q, o) {
    const x1 = Math.min(p[0], q[0]), x2 = Math.max(p[0], q[0]);
    const y1 = Math.min(p[1], q[1]), y2 = Math.max(p[1], q[1]);
    return x2 > o.x + 1 && x1 < o.x + o.w - 1 && y2 > o.y + 1 && y1 < o.y + o.h - 1;
  }

  /* Número de cajas (distintas del origen y el destino) que atraviesa una polilínea */
  function boxCrossings(l, pts) {
    const obst = (OBST[l.a.plant] || []).filter(o => o !== l.a && o !== l.b &&
      !(o.x === l.a.x && o.y === l.a.y) && !(o.x === l.b.x && o.y === l.b.y));
    let n = 0;
    for (let i = 0; i < pts.length - 1; i++) obst.forEach(o => { if (segCrossesBox(pts[i], pts[i + 1], o)) n++; });
    return n;
  }

  function points(l, idx, off) {
    const s = anchorAt(l.a, l.from, l.ka || 0, l.sBase), t = anchorAt(l.b, l.to, l.kb || 0, l.tBase);
    const mid = (idx % 3 - 1) * LANE + (l.midOff || 0);
    switch (l.mode) {
      case 'gutter-v': { const gx = l.gutter + off; return [s, [gx, s[1]], [gx, t[1]], t]; }
      case 'gutter-h': { const gy = l.gutter + off; return [s, [s[0], gy], [t[0], gy], t]; }
    }
    const P = PLANTS[l.a.plant] || { x: 0, y: 0, w: 1e9, h: 1e9 };
    let cands;
    if (l.mode === 'h') {
      const mx = (s[0] + t[0]) / 2 + mid, sg = Math.sign(t[0] - s[0]);
      cands = [[s, [mx, s[1]], [mx, t[1]], t]];
      // rodeos por el margen superior e inferior de la planta, con distintas
      // separaciones de salida / llegada para no rozar cajas vecinas
      [6, 10, 3].forEach(k => { const d = sg * k;
        [P.y + 10 + mid, P.y + P.h - 10 - mid].forEach(my =>
          cands.push([s, [s[0] + d, s[1]], [s[0] + d, my], [t[0] - d, my], [t[0] - d, t[1]], t])); });
    } else {
      const my = (s[1] + t[1]) / 2 + mid, sg = Math.sign(t[1] - s[1]);
      cands = [[s, [s[0], my], [t[0], my], t]];
      // rodeos por el margen izquierdo y derecho de la planta, con distintas
      // separaciones de salida / llegada para no rozar cajas vecinas
      [6, 10, 3].forEach(k => { const d = sg * k;
        [P.x + 10 + mid, P.x + P.w - 10 - mid].forEach(mx =>
          cands.push([s, [s[0], s[1] + d], [mx, s[1] + d], [mx, t[1] - d], [t[0], t[1] - d], t])); });
    }
    // el trazado directo si no atraviesa cajas; si no, el rodeo con menos cruces (y más corto)
    let best = null;
    cands.forEach(p => {
      const c = boxCrossings(l, p), len = length(p);
      if (!best || c < best.c || (c === best.c && len < best.len)) best = { c, len, p };
    });
    return best.p;
  }

  /* ¿Un tramo recto pasa sobre algún rótulo? */
  function hitsLabel(p, q, labels) {
    const horizontal = Math.abs(p[1] - q[1]) < 0.5;
    const x1 = Math.min(p[0], q[0]), x2 = Math.max(p[0], q[0]);
    const y1 = Math.min(p[1], q[1]), y2 = Math.max(p[1], q[1]);
    return labels.some(b => horizontal
      ? (p[1] > b.y - 2 && p[1] < b.y + b.h + 2 && x2 > b.x && x1 < b.x + b.w)
      : (p[0] > b.x - 2 && p[0] < b.x + b.w + 2 && y2 > b.y && y1 < b.y + b.h));
  }

  /* Ajusta anclas y tramo medio para que ningún tramo tape un rótulo */
  function dodgeLabels(l, idx) {
    const labels = (LABELS[l.a.plant] || []).concat(l.b.plant !== l.a.plant ? (LABELS[l.b.plant] || []) : []);
    const tries = [0, 12, -12, 24, -24, 36, -36, 48, -48];
    const limit = (b, side) => ((side === 'left' || side === 'right') ? b.h : b.w) / 2 - 8;
    const off = l.laneOff || 0;
    const ka0 = l.ka || 0, kb0 = l.kb || 0;
    // tramo de salida
    for (const d of tries) {
      if (Math.abs(ka0 + d) > limit(l.a, l.from)) continue;
      l.ka = ka0 + d;
      const p = points(l, idx, off);
      if (!hitsLabel(p[0], p[1], labels)) break;
    }
    // tramo de llegada
    for (const d of tries) {
      if (Math.abs(kb0 + d) > limit(l.b, l.to)) continue;
      l.kb = kb0 + d;
      const p = points(l, idx, off);
      if (!hitsLabel(p[p.length - 2], p[p.length - 1], labels)) break;
    }
    // tramos intermedios (modos h / v)
    if (l.mode === 'h' || l.mode === 'v') {
      for (const d of tries) {
        l.midOff = d;
        const p = points(l, idx, off);
        let clear = true;
        for (let i = 1; i < p.length - 2; i++) if (hitsLabel(p[i], p[i + 1], labels)) { clear = false; break; }
        if (clear) break;
      }
    }
  }
  /* Cruces entre dos polilíneas ortogonales */
  function crossings(pa, pb) {
    let n = 0;
    for (let i = 0; i < pa.length - 1; i++) for (let j = 0; j < pb.length - 1; j++) {
      const [a1, a2] = [pa[i], pa[i + 1]], [b1, b2] = [pb[j], pb[j + 1]];
      const aH = Math.abs(a1[1] - a2[1]) < 0.5, bH = Math.abs(b1[1] - b2[1]) < 0.5;
      if (aH === bH) continue;                     // paralelos
      const h = aH ? [a1, a2] : [b1, b2], v = aH ? [b1, b2] : [a1, a2];
      const hx1 = Math.min(h[0][0], h[1][0]), hx2 = Math.max(h[0][0], h[1][0]);
      const vy1 = Math.min(v[0][1], v[1][1]), vy2 = Math.max(v[0][1], v[1][1]);
      if (v[0][0] > hx1 + 1 && v[0][0] < hx2 - 1 && h[0][1] > vy1 + 1 && h[0][1] < vy2 - 1) n++;
    }
    return n;
  }

  function length(p) { let s = 0; for (let i = 1; i < p.length; i++) s += Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]); return s; }

  /* Asigna carriles del pasillo a los enlaces entre plantas probando todas las
     permutaciones (≤ 8 enlaces) y eligiendo la de menos cruces; a igualdad,
     la de menor longitud total. */
  function assignLanes(links) {
    const cross = links.filter(l => l.mode.startsWith('gutter'));
    const rest = links.filter(l => !l.mode.startsWith('gutter'));
    const n = cross.length;
    if (!n) return;
    const offsets = cross.map((_, i) => (i - (n - 1) / 2) * LANE);
    const fixed = rest.map(l => points(l, links.indexOf(l), 0));

    let best = null;
    const evaluate = perm => {
      const polys = cross.map((l, i) => points(l, 0, offsets[perm[i]]));
      let c = 0, len = 0;
      for (let i = 0; i < polys.length; i++) {
        len += length(polys[i]);
        for (let j = i + 1; j < polys.length; j++) c += crossings(polys[i], polys[j]);
        fixed.forEach(f => { c += crossings(polys[i], f); });
      }
      if (!best || c < best.c || (c === best.c && len < best.len)) best = { c, len, perm: perm.slice() };
    };

    if (n <= 8) {
      // permutaciones (algoritmo de Heap)
      const perm = cross.map((_, i) => i), cnt = new Array(n).fill(0);
      evaluate(perm);
      let i = 0;
      while (i < n) {
        if (cnt[i] < i) {
          const k = i % 2 === 0 ? 0 : cnt[i];
          [perm[k], perm[i]] = [perm[i], perm[k]];
          evaluate(perm);
          cnt[i]++; i = 0;
        } else { cnt[i] = 0; i++; }
      }
    } else {
      evaluate(cross.map((_, i) => i));
    }
    cross.forEach((l, i) => { l.laneOff = offsets[best.perm[i]]; });
  }

  function pathFor(l, idx) {
    return roundedPath(points(l, idx, l.laneOff || 0));
  }

  function drawIn(path, delay) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len} ${len}`;
    path.style.strokeDashoffset = len;
    path.style.animationDelay = `${delay}ms`;
    path.classList.add('flow-draw');
  }

  function fadeIn(node, delay) {
    node.style.animationDelay = `${delay}ms`;
    node.classList.add('flow-fade');
  }

  ESM.clearFlow = function (stage) {
    const svg = stage.querySelector('.flow-overlay');
    if (svg) svg.remove();
  };

  function arrow(links, d, delay, l) {
    const g = el('g', { class: 'flow-arrow' }, links);
    if (l && l.fromItem) {
      g.setAttribute('data-from-plant', l.fromItem.plant);
      g.setAttribute('data-from-areas', l.fromItem.areas.join(','));
      g.setAttribute('data-to-plant', l.toItem.plant);
      g.setAttribute('data-to-areas', l.toItem.areas.join(','));
      g.setAttribute('data-step', l.step);
    }
    el('path', { d, class: 'flow-halo' }, g);
    const line = el('path', { d, class: 'flow-line' }, g);
    drawIn(line, delay);
    // con las flechas ocultas (ESM 3) la longitud es 0 y no hay punta que ubicar
    const len = line.getTotalLength();
    if (len > 0) {
      const p1 = line.getPointAtLength(Math.max(0, len - 6)), p2 = line.getPointAtLength(len);
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      const head = el('path', {
        d: 'M-7 -3.5 L0 0 L-7 3.5 Z', class: 'flow-head',
        transform: `translate(${p2.x} ${p2.y}) rotate(${ang})`
      }, g);
      fadeIn(head, delay + STEP_MS * 0.6);
    }
    // zona de acierto para encender la flecha con el cursor
    const hit = el('path', { d, class: 'flow-hit' }, g);
    hit.addEventListener('mouseenter', () => g.classList.add('is-lit'));
    hit.addEventListener('mouseleave', () => g.classList.remove('is-lit'));
  }

  /* Elementos del flujo que pertenecen al paso de un área: recuadro,
     número y flecha que sale hacia el paso siguiente. */
  function stepElements(stage, plant, area) {
    const svg = stage.querySelector('.flow-overlay');
    if (!svg) return [];
    const has = (el, attr) => (el.getAttribute(attr) || '').split(',').includes(area);
    const out = new Set();
    // el paso completo dentro de su flujo: todas sus piezas (p. ej. "Punzonado o
    // Láser") y todas las flechas que salen de él
    svg.querySelectorAll('.flow-frame').forEach(f => {
      if (f.getAttribute('data-plant') !== plant || !has(f, 'data-areas')) return;
      const step = f.getAttribute('data-step');
      const color = [...f.parentElement.classList].find(c => c.startsWith('flow-color-'));
      svg.querySelectorAll(`.${color} [data-step="${step}"]`).forEach(n => out.add(n));
    });
    return [...out];
  }

  /* Enciende (o apaga) el paso al pasar el cursor */
  ESM.lightStep = function (stage, plant, area, on) {
    stepElements(stage, plant, area).forEach(n => n.classList.toggle('is-lit', on));
  };

  /* Deja fijo (o libera) el paso al hacer clic; devuelve el nuevo estado */
  ESM.pinStep = function (stage, plant, area) {
    const els = stepElements(stage, plant, area);
    if (!els.length) return false;
    const on = !els[0].classList.contains('is-pinned');
    els.forEach(n => n.classList.toggle('is-pinned', on));
    return on;
  };

  /* Desplaza un polígono hacia afuera una distancia d */
  function offsetPolygon(pts, d) {
    if (!d) return pts;
    const n = pts.length;
    let area = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const sgn = area > 0 ? 1 : -1;
    const lines = pts.map((a, i) => {
      const b = pts[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      return { p: [a[0] + sgn * dy / len * d, a[1] - sgn * dx / len * d], v: [dx, dy] };
    });
    return pts.map((_, i) => {
      const l1 = lines[(i - 1 + n) % n], l2 = lines[i];
      const det = l1.v[0] * l2.v[1] - l1.v[1] * l2.v[0];
      if (Math.abs(det) < 1e-6) return l2.p;
      const t = ((l2.p[0] - l1.p[0]) * l2.v[1] - (l2.p[1] - l1.p[1]) * l2.v[0]) / det;
      return [l1.p[0] + l1.v[0] * t, l1.p[1] + l1.v[1] * t];
    });
  }

  /* Contorno de un grupo de proceso (coordenadas de planta → escenario) */
  function groupItem(stage, views, plant, groupId, layer) {
    const view = views[plant];
    const grp = view && view.plant.groups && view.plant.groups[groupId];
    if (!grp) return null;
    const svg = view.svg, ctm = svg.getScreenCTM(), r = stage.getBoundingClientRect();
    const pts = grp.outline.map(([x, y]) => {
      const p = svg.createSVGPoint(); p.x = x; p.y = y;
      const s = p.matrixTransform(ctm);
      return [s.x - r.left, s.y - r.top];
    });
    const out = offsetPolygon(pts, layer * 4);
    return {
      box: box(stage, views, plant, grp.areas[0]), plant, areas: grp.areas,
      frame: 'M' + out.map(p => p.join(' ')).join(' L') + ' Z',
      badge: out[0]
    };
  }

  function areaItem(stage, views, plant, area, layer) {
    const b = box(stage, views, plant, area);
    return b && { box: b, plant, areas: [area], frame: rectPath(b, PAD + layer * 4), badge: [b.x - PAD - layer * 4, b.y - PAD - layer * 4] };
  }

  /* steps: cada paso puede ser un área (`area`), varias alternativas
     (`areas`) o un grupo de proceso (`group`). Todas las piezas de un paso
     llevan el mismo número y cada una conecta con el paso siguiente. */
  ESM.drawFlow = function (stage, steps, views, opts) {
    const { color = 0, layer = 0, append = false } = opts || {};
    const cls = ' flow-color-' + color + (layer ? ' flow-layer-' + layer : '');
    const svg = overlay(stage, append);
    const groups = steps.map(s => {
      if (s.group) { const it = groupItem(stage, views, s.plant, s.group, layer); return it ? [it] : []; }
      return (s.areas || [s.area]).map(a => areaItem(stage, views, s.plant, a, layer)).filter(Boolean);
    }).filter(g => g.length);
    if (groups.length < 2) return;

    const plants = {};
    Object.keys(views).forEach(id => { plants[id] = plantBox(stage, views, id); });

    // enlaces entre pasos consecutivos
    const links = [];
    groups.forEach((items, i) => {
      if (i < groups.length - 1) items.forEach(a => groups[i + 1].forEach(b => links.push({ a: a.box, b: b.box, step: i, fromItem: a, toItem: b })));
    });
    // obstáculos y rótulos de cada planta para el enrutado
    OBST = {}; LABELS = {}; PLANTS = plants;
    Object.keys(views).forEach(id => {
      OBST[id] = Object.keys(views[id].nodes).map(a => box(stage, views, id, a)).filter(Boolean);
      LABELS[id] = [...views[id].svg.querySelectorAll('.node-label, .child-label')].map(t => toStage(stage, t.getBoundingClientRect()));
    });
    links.forEach(l => plan(l, plants));
    spreadAnchors(links);
    assignLanes(links);
    links.forEach((l, idx) => dodgeLabels(l, idx));

    const linksG = el('g', { class: 'flow-links' + cls }, svg);
    const frames = el('g', { class: 'flow-frames' + cls }, svg);
    const badges = el('g', { class: 'flow-badges' + cls }, svg);

    groups.forEach((items, i) => {
      const t = i * STEP_MS;
      items.forEach(it => {
        drawIn(el('path', { d: it.frame, class: 'flow-frame', 'data-plant': it.plant, 'data-areas': it.areas.join(','), 'data-step': i }, frames), t);
        const bg = el('g', { class: 'flow-badge', 'data-plant': it.plant, 'data-areas': it.areas.join(','), 'data-step': i, transform: `translate(${it.badge[0]} ${it.badge[1]})` }, badges);
        el('circle', { r: 11, class: 'flow-badge-bg' }, bg);
        el('text', { y: 4.5, class: 'flow-badge-n', 'text-anchor': 'middle' }, bg).textContent = i + 1;
        fadeIn(bg, t + 200);
      });
    });
    links.forEach((l, idx) => {
      const t = l.step * STEP_MS + STEP_MS * 0.45;
      arrow(linksG, pathFor(l, idx), t, l);
    });
  };
})();
