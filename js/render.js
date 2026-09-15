/* =====================================================================
   ES Metals — Motor de dibujo de plantas (SVG generado desde datos)
   ---------------------------------------------------------------------
   renderPlant(plant, host) dibuja cualquier planta descrita en datos
   y devuelve un controlador con:
     .nodes[id]            grupo SVG de cada área / máquina
     .setState(id, state)  'hover' | 'selected' | 'active' | 'dim' | null
     .clearStates()
   Los estados 'active' y 'dim' están previstos para los recorridos
   de producto (etapas siguientes).

   Lenguaje gráfico tipo plano (CAD):
     - áreas: contorno + tinte, rótulo con ojo "Área"
     - máquinas: símbolo en planta (mesa, bastidor, rodillos…) según
       `symbol`, rótulo junto a la máquina como en un plano
     - elementos: estanterías con bahías, tanques, canecas, cabinas con
       extractores, escaleras, puertas, ejes y columnas
   ===================================================================== */
window.ESM = window.ESM || {};

(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const KIND_LABEL = { area: 'Área', machine: 'Máquina' };

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  const rect = (x, y, w, h, cls, parent, extra) =>
    el('rect', Object.assign({ x, y, width: w, height: h, class: cls }, extra || {}), parent);
  const line = (x1, y1, x2, y2, cls, parent) =>
    el('line', { x1, y1, x2, y2, class: cls }, parent);

  function bounds(a) {
    if (a.shape === 'polygon') {
      const xs = a.points.map(p => p[0]), ys = a.points.map(p => p[1]);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    return { x: a.x, y: a.y, w: a.w, h: a.h };
  }

  /* ---------- Rótulos ---------- */
  /* Áreas: ojo ("Área") + nombre. Máquinas: nombre (+ modelo).
     `anchor.rotate` gira el bloque; `a.small` reduce el tamaño. */
  function label(a, anchor, g) {
    const lines = a.label.split(' / ');
    const machine = a.kind === 'machine';
    const lineH = machine ? 13 : (a.small ? 16 : 22);
    const eyebrowH = (machine || a.noEyebrow) ? 0 : 13;
    const modelH = a.model ? 11 : 0;
    const total = eyebrowH + lines.length * lineH + modelH;
    let y = anchor.y - total / 2;

    const grp = el('g', anchor.rotate
      ? { transform: `rotate(${anchor.rotate} ${anchor.x} ${anchor.y})` } : {}, g);

    if (eyebrowH) {
      y += eyebrowH - 2;
      el('text', { x: anchor.x, y, class: 'node-eyebrow', 'text-anchor': 'middle' }, grp)
        .textContent = KIND_LABEL[a.kind] || '';
    }
    lines.forEach(ln => {
      y += lineH;
      el('text', {
        x: anchor.x, y, 'text-anchor': 'middle',
        class: 'node-label' + (a.small ? ' node-label--small' : '')
      }, grp).textContent = ln;
    });
    if (a.model) {
      y += modelH;
      el('text', { x: anchor.x, y, class: 'node-model', 'text-anchor': 'middle' }, grp)
        .textContent = a.model;
    }
  }

  function unitMark(a, g) {
    el('text', { x: a.x + a.w - 3, y: a.y - 3, class: 'node-unit', 'text-anchor': 'end' }, g)
      .textContent = String(a.unit).padStart(2, '0');
  }

  /* ---------- Símbolos de máquina en planta ----------
     Se dibujan en un marco local (0,0)-(w,h) con el eje largo en X;
     `rot: 90` gira el símbolo dentro del rectángulo de la máquina. */
  const SYMBOLS = {
    laser(w, h, g) {
      // bloque de carga, pórtico, mesa de corte con rejilla y módulos de control
      rect(w * 0.05, h * 0.15, w * 0.12, h * 0.7, 'sym-bed', g);
      rect(w * 0.18, h * 0.05, w * 0.03, h * 0.9, 'sym-unit', g);
      rect(w * 0.22, h * 0.15, w * 0.36, h * 0.7, 'sym-bed', g);
      rect(w * 0.62, h * 0.1, w * 0.33, h * 0.4, 'sym-unit', g);
      [0.7, 0.78, 0.86].forEach(t => line(w * t, h * 0.1, w * t, h * 0.5, 'sym-line', g));
      rect(w * 0.62, h * 0.62, w * 0.36, h * 0.24, 'sym-unit', g);
    },
    cizalla(w, h, g) {
      // cizalla: bastidor, cuchilla y mesa de entrada
      rect(0, h * 0.1, w * 0.12, h * 0.8, 'sym-unit', g);
      rect(w * 0.88, h * 0.1, w * 0.12, h * 0.8, 'sym-unit', g);
      rect(w * 0.12, h * 0.3, w * 0.76, h * 0.12, 'sym-head', g);
      rect(w * 0.12, h * 0.5, w * 0.76, h * 0.3, 'sym-bed', g);
    },
    punzonadora(w, h, g) {
      // mesa con cepillos (rejilla), bastidor en C y cabezal
      rect(w * 0.18, h * 0.1, w * 0.64, h * 0.8, 'sym-bed', g);
      rect(0, h * 0.28, w * 0.18, h * 0.44, 'sym-unit', g);
      rect(w * 0.82, h * 0.2, w * 0.18, h * 0.6, 'sym-unit', g);
      rect(w * 0.42, h * 0.36, w * 0.16, h * 0.28, 'sym-head', g);
      line(w * 0.18, h * 0.5, w * 0.82, h * 0.5, 'sym-line', g);
    },
    dobladora(w, h, g) {
      // bastidores laterales, trancha superior, mesa y tope trasero
      rect(0, h * 0.08, w * 0.1, h * 0.84, 'sym-unit', g);
      rect(w * 0.9, h * 0.08, w * 0.1, h * 0.84, 'sym-unit', g);
      rect(w * 0.1, h * 0.22, w * 0.8, h * 0.14, 'sym-head', g);
      rect(w * 0.1, h * 0.42, w * 0.8, h * 0.22, 'sym-bed', g);
      rect(w * 0.18, h * 0.7, w * 0.64, h * 0.14, 'sym-gauge', g);
    },
    roladora(w, h, g) {
      // rodillos (cilindro en planta) sobre dos soportes
      rect(0, h * 0.1, w * 0.14, h * 0.8, 'sym-unit', g);
      rect(w * 0.86, h * 0.1, w * 0.14, h * 0.8, 'sym-unit', g);
      rect(w * 0.14, h * 0.3, w * 0.72, h * 0.4, 'sym-head', g);
      line(w * 0.14, h * 0.5, w * 0.86, h * 0.5, 'sym-line', g);
    },
    gantry(w, h, g) {
      // centro de mecanizado de lámina: bancada con guías, pórtico y control
      rect(0, h * 0.12, w * 0.1, h * 0.76, 'sym-unit', g);
      rect(w * 0.1, h * 0.06, w * 0.9, h * 0.88, 'sym-bed', g);
      [0.3, 0.5, 0.7].forEach(t => line(w * 0.1, h * t, w, h * t, 'sym-line', g));
      rect(w * 0.36, 0, w * 0.06, h, 'sym-unit', g);
      rect(w * 0.34, h * 0.38, w * 0.1, h * 0.24, 'sym-head', g);
    },
    center(w, h, g) {
      // centro de mecanizado de perfiles: bancada larga, cabezal y mordazas
      rect(0, h * 0.2, w, h * 0.6, 'sym-unit', g);
      line(0, h * 0.5, w, h * 0.5, 'sym-line', g);
      rect(w * 0.3, h * 0.05, w * 0.16, h * 0.9, 'sym-head', g);
      [0.08, 0.6, 0.85].forEach(t => rect(w * t, h * 0.28, w * 0.06, h * 0.44, 'sym-unit', g));
    },
    saw(w, h, g) {
      // sierra: mesa con disco
      rect(0, 0, w, h, 'sym-unit', g);
      el('circle', { cx: w * 0.5, cy: h * 0.5, r: Math.min(w, h) * 0.36, class: 'sym-drum' }, g);
      line(w * 0.5, h * 0.1, w * 0.5, h * 0.9, 'sym-line', g);
    },
    bench(w, h, g) {
      // mesa de trabajo con superficie rayada
      rect(0, 0, w, h, 'sym-bed', g);
      rect(0, 0, w, h * 0.18, 'sym-unit', g);
    },
    sublimadora(w, h, g) {
      // cámara con tambor y mesa auxiliar
      rect(w * 0.04, h * 0.1, w * 0.62, h * 0.8, 'sym-unit', g);
      el('circle', { cx: w * 0.35, cy: h * 0.5, r: Math.min(w * 0.62, h * 0.8) * 0.34, class: 'sym-drum' }, g);
      rect(w * 0.72, h * 0.18, w * 0.26, h * 0.64, 'sym-bed', g);
    }
  };

  function symbol(a, g) {
    const draw = SYMBOLS[a.symbol];
    if (!draw) return;
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    const rot = a.rot || 0;
    const w = rot ? a.h : a.w, h = rot ? a.w : a.h;
    const sg = el('g', {
      class: 'sym',
      transform: `translate(${cx} ${cy}) rotate(${rot}) translate(${-w / 2} ${-h / 2})`
    }, g);
    draw(w, h, sg);
  }

  /* Máquina sin rótulo propio dentro de un área (p. ej. plano ESM2) */
  function symbolElement(c, layer) {
    rect(c.x, c.y, c.w, c.h, 'sym-outline', layer);
    symbol(c, layer);
  }

  /* ---------- Elementos internos y anotaciones ---------- */
  function fan(cx, cy, r, g) {
    el('circle', { cx, cy, r, class: 'sym-fan' }, g);
    line(cx - r * 0.7, cy - r * 0.7, cx + r * 0.7, cy + r * 0.7, 'sym-line', g);
    line(cx - r * 0.7, cy + r * 0.7, cx + r * 0.7, cy - r * 0.7, 'sym-line', g);
    el('circle', { cx, cy, r: r * 0.22, class: 'sym-unit' }, g);
  }

  function element(c, layer) {
    switch (c.type) {
      case 'zone': {
        rect(c.x, c.y, c.w, c.h, 'zone-shape', layer);
        if (c.label) {
          const lines = c.label.split(' / '), lh = 12.5;
          const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
          const tg = el('g', c.rotate ? { transform: `rotate(${c.rotate} ${cx} ${cy})` } : {}, layer);
          let y = c.labelAt === 'top' ? c.y + 12 : cy - (lines.length - 1) * lh / 2 + 4;
          lines.forEach(ln => {
            el('text', { x: cx, y, class: 'zone-label', 'text-anchor': 'middle' }, tg).textContent = ln;
            y += lh;
          });
        }
        break;
      }
      case 'block':
        rect(c.x, c.y, c.w, c.h, 'block-shape', layer);
        break;
      case 'marker':
        rect(c.x, c.y, c.w, c.h, 'sym-marker', layer);
        break;
      case 'symbol':
        symbolElement(c, layer);
        break;
      case 'benches':
        for (let i = 0; i < c.count; i++) {
          symbolElement({ symbol: 'bench', x: c.x, y: c.y + i * c.pitch, w: c.w, h: c.h }, layer);
        }
        break;
      case 'stack': {
        const gap = c.gap || 0, horizontal = c.dir === 'x';
        const size = ((horizontal ? c.w : c.h) - gap * (c.count - 1)) / c.count;
        for (let i = 0; i < c.count; i++) {
          const off = i * (size + gap);
          rect(horizontal ? c.x + off : c.x, horizontal ? c.y : c.y + off,
            horizontal ? size : c.w, horizontal ? c.h : size, 'block-shape', layer);
        }
        break;
      }
      case 'rack': {
        // estantería: contorno + divisiones de bahía
        rect(c.x, c.y, c.w, c.h, 'rack-shape', layer);
        const n = c.bays || 1;
        for (let i = 1; i < n; i++) {
          if (c.dir === 'x') line(c.x + c.w * i / n, c.y, c.x + c.w * i / n, c.y + c.h, 'sym-line', layer);
          else line(c.x, c.y + c.h * i / n, c.x + c.w, c.y + c.h * i / n, 'sym-line', layer);
        }
        break;
      }
      case 'tank':
        rect(c.x, c.y, c.w, c.h, 'tank-shape', layer);
        rect(c.x + 2.5, c.y + 2.5, c.w - 5, c.h - 5, c.fill === 'stipple' ? 'tank-stipple' : 'tank-inner', layer);
        break;
      case 'fans': {
        rect(c.x, c.y, c.w, c.h, 'block-shape', layer);
        const n = c.fans || 1, r = Math.min(c.w, c.h / n) * 0.34;
        for (let i = 0; i < n; i++) fan(c.x + c.w / 2, c.y + c.h * (i + 0.5) / n, r, layer);
        break;
      }
      case 'drums':
        for (let i = 0; i < c.cols; i++) for (let j = 0; j < c.rows; j++) {
          el('circle', { cx: c.x + c.r + i * c.pitch, cy: c.y + c.r + j * c.pitch, r: c.r, class: 'sym-drum' }, layer);
        }
        break;
      case 'stairs': {
        rect(c.x, c.y, c.w, c.h, 'rack-shape', layer);
        const steps = Math.max(3, Math.round(c.w / 7));
        for (let i = 1; i < steps; i++) line(c.x + c.w * i / steps, c.y, c.x + c.w * i / steps, c.y + c.h, 'sym-line', layer);
        line(c.x + 3, c.y + c.h / 2, c.x + c.w - 6, c.y + c.h / 2, 'sym-arrow', layer);
        break;
      }
      case 'track':
        el('path', { d: c.d, class: 'track' }, layer);
        break;
      case 'door':
        el('path', { d: c.d, class: 'door' }, layer);
        break;
      case 'wall':
        el('path', { d: c.d, class: 'wall' }, layer);
        break;
      case 'axis':
        el('path', { d: c.d, class: 'axis' }, layer);
        break;
      case 'columns': {
        const n = c.count, s = 4;
        for (let i = 0; i < n; i++) {
          const t = n === 1 ? 0 : i / (n - 1);
          rect(c.x1 + (c.x2 - c.x1) * t - s / 2, c.y1 + (c.y2 - c.y1) * t - s / 2, s, s, 'column', layer);
        }
        break;
      }
      case 'label': {
        const attrs = { x: c.x, y: c.y, class: 'child-label' + (c.muted ? ' child-label--muted' : ''), 'text-anchor': 'middle' };
        if (c.rotate) attrs.transform = `rotate(${c.rotate} ${c.x} ${c.y})`;
        el('text', attrs, layer).textContent = c.label;
        break;
      }
    }
  }

  function children(a, g) {
    const layer = el('g', { class: 'node-children' }, g);
    a.children.forEach(c => element(c, layer));
  }

  /* ---------- Planta ---------- */
  ESM.renderPlant = function (plant, host) {
    const { w, h } = plant.canvas;
    const svg = el('svg', {
      viewBox: `-3 -3 ${w + 6} ${h + 6}`, class: 'plant', role: 'group',
      'aria-label': `Distribución ${plant.name}`
    });

    const defs = el('defs', {}, svg);
    const grid = el('pattern', { id: `grid-${plant.id}`, width: 40, height: 40, patternUnits: 'userSpaceOnUse' }, defs);
    el('path', { d: 'M40 0H0V40', class: 'plant-grid' }, grid);
    const hatch = el('pattern', { id: `hatch-${plant.id}`, width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('path', { d: 'M0 0V5', class: 'hatch-line' }, hatch);
    const stipple = el('pattern', { id: `stipple-${plant.id}`, width: 5, height: 5, patternUnits: 'userSpaceOnUse' }, defs);
    el('circle', { cx: 2.5, cy: 2.5, r: 0.6, class: 'stipple-dot' }, stipple);
    svg.style.setProperty('--hatch', `url(#hatch-${plant.id})`);
    svg.style.setProperty('--stipple', `url(#stipple-${plant.id})`);

    const p = plant.perimeter;
    rect(p.x, p.y, p.w, p.h, 'plant-floor', svg);
    rect(p.x, p.y, p.w, p.h, '', svg, { fill: `url(#grid-${plant.id})` });
    rect(p.x, p.y, p.w, p.h, 'plant-perimeter', svg);

    /* Edificación y anotaciones bajo las áreas */
    if (plant.annotations) {
      const ann = el('g', { class: 'plant-annotations' }, svg);
      plant.annotations.filter(c => c.type !== 'label').forEach(c => element(c, ann));
    }

    const layer = el('g', { class: 'plant-nodes' }, svg);
    const nodes = {}, labelGroups = {};
    // los rótulos de las áreas van en una capa superior para que la maquinaria no los tape
    const labelLayer = el('g', { class: 'plant-labels' });

    plant.areas.forEach((a, i) => {
      const name = a.unit ? `${a.label} ${a.unit}` : a.label;
      const g = el('g', {
        class: `node node--${a.kind}`, 'data-id': a.id, tabindex: 0, role: 'button',
        'aria-label': `${KIND_LABEL[a.kind]} ${name}${a.model ? ' ' + a.model : ''}`
      }, layer);
      g.style.setProperty('--i', i);

      if (a.shape === 'polygon') {
        el('polygon', { points: a.points.map(pt => pt.join(',')).join(' '), class: 'node-shape' }, g);
      } else {
        rect(a.x, a.y, a.w, a.h, 'node-shape' + (a.compact ? ' node-shape--compact' : ''), g);
        if (a.double) rect(a.x + 4, a.y + 4, a.w - 8, a.h - 8, 'node-shape-double', g);
      }
      if (a.children) children(a, g);
      if (a.symbol) symbol(a, g);

      const b = bounds(a);
      const anchors = a.labels || [{ x: b.x + b.w / 2, y: b.y + b.h / 2 }];
      if (a.hideLabel) {
        // máquina sin rótulo propio (el área que la contiene ya lo lleva)
      } else if (a.compact) {
        // zona de proceso: rótulo pequeño en la cabecera, sin ojo
        el('text', { x: a.x + a.w / 2, y: a.y + 12, class: 'zone-label', 'text-anchor': 'middle' }, g).textContent = a.label;
      } else {
        const target = a.kind === 'area' ? el('g', { class: 'node-label-group' }, labelLayer) : g;
        if (a.kind === 'area') labelGroups[a.id] = target;
        anchors.forEach(an => label(a, an, target));
      }
      if (a.unit) unitMark(a, g);

      nodes[a.id] = g;
    });

    svg.appendChild(labelLayer);

    /* Rótulos de anotación sobre todo lo demás */
    if (plant.annotations) {
      const top = el('g', { class: 'plant-annotations' }, svg);
      plant.annotations.filter(c => c.type === 'label').forEach(c => element(c, top));
    }

    host.appendChild(svg);

    return {
      plant, svg, nodes,
      setState(id, state) {
        const g = nodes[id]; if (!g) return;
        [g, labelGroups[id]].filter(Boolean).forEach(n => {
          n.classList.remove('is-hover', 'is-selected', 'is-active', 'is-dim');
          if (state) n.classList.add('is-' + state);
        });
      },
      clearStates() {
        Object.values(nodes).concat(Object.values(labelGroups)).forEach(g => g.classList.remove('is-hover', 'is-selected', 'is-active', 'is-dim'));
      }
    };
  };
})();
