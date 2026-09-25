/* =====================================================================
   ES Metals — Aplicación
   ---------------------------------------------------------------------
   Estado: escenario activo, línea de negocio activa (futuro),
   elemento seleccionado. Construye cabecera, franja de líneas,
   escenario de plantas y panel lateral a partir de ESM.data.
   ===================================================================== */
(function () {
  const D = ESM.data;
  const KIND_LABEL = { area: 'Área de proceso', machine: 'Máquina' };

  const state = {
    scenario: 'actual',
    focusPlant: null,  // planta destacada dentro del escenario (la otra se atenúa)
    line: null,        // id de línea de negocio activa
    products: [],      // ids de los productos (flujos) activos dentro de la línea
    selected: null,    // { plant, id }
    views: {}          // controladores de dibujo por planta
  };

  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const pad = n => String(n).padStart(2, '0');

  /* ---------- Cabecera: selector de escenario / planta ---------- */
  function renderScenarioNav() {
    const nav = $('#scenario-nav');
    nav.innerHTML = '';
    // Tres botones: ESM 1 y ESM 2 (escenario actual) y ESM 3 (escenario futuro)
    const row = h('div', 'nav-row');
    D.scenarios.forEach(sc => {
      sc.plants.forEach(pid => {
        const p = D.plants[pid];
        const b = h('button', 'nav-plant', p.short || p.name);
        b.type = 'button';
        b.title = p.subtitle ? p.name + ' · ' + p.subtitle : p.name;
        if (p.status !== 'ready') {
          b.disabled = true;
          b.title = 'Se incorporará en una etapa posterior';
        } else if (sc.id === state.scenario) {
          b.classList.add(!state.focusPlant || state.focusPlant === pid ? 'is-active' : 'is-muted');
        }
        b.addEventListener('click', () => {
          if (sc.id === state.scenario && sc.plants.length > 1) state.focusPlant = state.focusPlant === pid ? null : pid;
          else { state.scenario = sc.id; state.focusPlant = null; }
          render();
        });
        row.appendChild(b);
      });
    });
    nav.appendChild(row);
  }

  /* ---------- Franja superior: líneas de negocio + proyección ---------- */
  function renderLines() {
    const host = $('#lines-list');
    host.innerHTML = '';
    if (!D.businessLines.length) {
      for (let i = 0; i < 3; i++) host.appendChild(h('span', 'line-ghost', 'Por definir'));
      return;
    }
    D.businessLines.forEach(l => {
      const b = h('button', 'line-chip' + (state.line === l.id ? ' is-active' : (state.line ? ' is-muted' : '')), l.name);
      b.type = 'button';
      b.addEventListener('click', () => {
        const same = state.line === l.id;
        state.line = same ? null : l.id;
        state.products = same ? [] : [l.products[0].id];
        render();
      });
      host.appendChild(b);
    });

    /* Productos de la línea activa (solo cuando hay más de un flujo) */
    const line = currentLine();
    if (line && line.products.length > 1) {
      host.appendChild(h('span', 'line-sep'));
      line.products.forEach((pr, idx) => {
        const on = state.products.includes(pr.id);
        const b = h('button', 'line-chip line-chip--product flow-color-' + idx + (on ? ' is-active' : ' is-muted'), pr.name);
        b.type = 'button';
        b.title = 'Clic para activar o desactivar este flujo; pueden verse los dos a la vez';
        b.addEventListener('click', () => {
          state.products = on ? state.products.filter(id => id !== pr.id) : state.products.concat(pr.id);
          render();
        });
        host.appendChild(b);
      });
    }

  }

  function currentLine() { return D.businessLines.find(l => l.id === state.line) || null; }
  /* Productos activos de la línea, con su índice de color (0 = azul, 1 = ocre) */
  function activeProducts() {
    const l = currentLine();
    if (!l) return [];
    return l.products.map((p, idx) => ({ product: p, idx })).filter(x => state.products.includes(x.product.id));
  }

  /* Recorridos de un producto en el escenario activo:
     actual → [route] · futuro → [route3 en la mega planta (Propuesta 2), route3 repartido
     entre las plantas de la Propuesta 1] */
  function routesOf(product) {
    if (state.scenario !== 'futuro') return [product.route || []];
    const r3 = product.route3 || [];
    return r3.length ? [r3, toThreePlants(r3)] : [];
  }

  /* Propuesta 1: cada paso va a la planta que tiene el proceso; si está en
     varias, se queda en la planta del paso anterior (traslados mínimos) */
  function toThreePlants(r3) {
    let prev = null;
    return r3.map(step => {
      const areas = step.areas || [step.area];
      const has = pid => areas.every(a => D.plants[pid].areas.some(x => x.id === a));
      const pid = (prev && has(prev)) ? prev : (THREE.find(has) || prev || THREE[0]);
      prev = pid;
      return Object.assign({}, step, { plant: pid });
    });
  }

  /* Áreas que cubre un paso: área, alternativas (areas) o grupo de la planta */
  function stepAreas(plant, step) {
    if (step.group) return (plant.groups && plant.groups[step.group]) ? plant.groups[step.group].areas : [];
    return step.areas || [step.area];
  }

  /* Ilumina las áreas del recorrido del producto activo y atenúa el resto */
  function applyRoute() {
    const route = activeProducts().flatMap(x => routesOf(x.product).flat());
    Object.values(state.views).forEach(v => {
      Object.keys(v.nodes).forEach(id => {
        if (!route.length) { v.setState(id, null); return; }
        const inRoute = route.some(step => step.plant === v.plant.id && stepAreas(v.plant, step).includes(id));
        v.setState(id, inRoute ? 'active' : 'dim');
      });
    });
  }

  /* ---------- Escenario: plantas listas del escenario activo ---------- */
  const THREE = ['esm3a', 'esm3b', 'esm3c'];   // Propuesta 1 de ESM 3 (dos plantas independientes)
  function readyPlants() {
    const sc = D.scenarios.find(s => s.id === state.scenario);
    // ESM 3 muestra las dos propuestas a la vez: Propuesta 1 (dos plantas) y Propuesta 2 (mega planta)
    const ids = sc.id === 'futuro' ? sc.plants.concat(THREE) : sc.plants;
    return ids.map(id => D.plants[id]).filter(p => p && p.status === 'ready');
  }

  /* Bloque de propuesta en ESM 3: título + fila de plantas */
  function proposalBlock(stage, n, name) {
    const block = h('section', 'proposal-block');
    const title = h('div', 'proposal-title');
    title.appendChild(h('span', 'proposal-n', 'Propuesta ' + n));
    title.appendChild(h('span', 'proposal-name', name));
    block.appendChild(title);
    const row = h('div', 'proposal-plants');
    block.appendChild(row);
    stage.appendChild(block);
    return row;
  }

  function renderStage() {
    const stage = $('#stage');
    stage.innerHTML = '';
    state.views = {};
    const plants = readyPlants();
    stage.style.setProperty('--plants', plants.length || 1);
    const futuro = state.scenario === 'futuro';
    stage.classList.toggle('is-futuro', futuro);
    const hostTres = futuro ? proposalBlock(stage, 1, 'Dos plantas independientes') : stage;
    const hostMega = futuro ? proposalBlock(stage, 2, 'Mega planta integrada') : stage;

    plants.forEach(p => {
      const card = h('section', 'plant-card' + (state.focusPlant && state.focusPlant !== p.id ? ' is-muted' : ''));
      card.dataset.plant = p.id;

      const head = h('header', 'plant-head');
      const title = h('div', 'plant-title');
      // nombre vacío (p. ej. la planta sin nombre de la Propuesta 1): se conserva la altura
      title.appendChild(h('h2', 'plant-name', p.short === '' ? ' ' : (p.short || p.name)));
      head.appendChild(title);

      card.appendChild(head);

      const host = h('div', 'plant-host');
      host.style.setProperty('--ratio', p.canvas.w + ' / ' + p.canvas.h);
      host.dataset.ratio = p.canvas.w / p.canvas.h;
      card.appendChild(host);
      const view = ESM.renderPlant(p, host);
      state.views[p.id] = view;
      wireNodes(view);

      (THREE.includes(p.id) ? hostTres : hostMega).appendChild(card);
    });
  }

  function wireNodes(view) {
    const pid = view.plant.id;
    Object.entries(view.nodes).forEach(([id, g]) => {
      g.addEventListener('mouseenter', () => setHover(pid, id, true));
      g.addEventListener('mouseleave', () => setHover(pid, id, false));
      g.addEventListener('focus', () => setHover(pid, id, true));
      g.addEventListener('blur', () => setHover(pid, id, false));
      g.addEventListener('click', () => select(pid, id));
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(pid, id); }
      });
    });
  }

  function invItem(plant, id) {
    return document.querySelector('.inv-item[data-plant="' + plant + '"][data-id="' + id + '"]');
  }

  function isSelected(plant, id) {
    return !!state.selected && state.selected.plant === plant && state.selected.id === id;
  }

  function setHover(plant, id, on) {
    ESM.lightStep($('#stage'), plant, id, on);
    if (on) state.views[plant].setState(id, 'hover');
    else if (isSelected(plant, id)) state.views[plant].setState(id, 'selected');
    else applyRoute();
    const li = invItem(plant, id);
    if (li) li.classList.toggle('is-hover', on);
  }

  function select(plant, id) {
    // con un recorrido activo, el clic deja fijo el paso (recuadro + flecha)
    if (activeProducts().length) { ESM.pinStep($('#stage'), plant, id); return; }
    state.selected = isSelected(plant, id) ? null : { plant, id };
    applySelection();
  }

  function applySelection() {
    Object.values(state.views).forEach(v => v.clearStates());
    applyRoute();
    document.querySelectorAll('.inv-item.is-selected').forEach(n => n.classList.remove('is-selected'));
    if (state.selected) {
      const { plant, id } = state.selected;
      state.views[plant].setState(id, 'selected');
      const li = invItem(plant, id);
      if (li) li.classList.add('is-selected');
    }
    renderDetail();
  }

  /* ---------- Panel lateral ---------- */
  function renderDetail() {
    const box = $('#detail');
    if (!box) return;
    box.innerHTML = '';
    if (!state.selected) {
      box.appendChild(h('span', 'detail-eyebrow', 'Selección'));
      box.appendChild(h('p', 'detail-empty', 'Seleccione un área o máquina en el plano para ver su detalle.'));
      return;
    }
    const { plant, id } = state.selected;
    const p = D.plants[plant];
    const a = p.areas.find(x => x.id === id);
    box.appendChild(h('span', 'detail-eyebrow', KIND_LABEL[a.kind]));
    box.appendChild(h('h3', 'detail-name', a.unit ? a.label + ' ' + pad(a.unit) : a.label));
    const dl = h('dl', 'detail-list');
    row(dl, 'Planta', p.name);
    if (a.model) row(dl, 'Modelo', a.model);
    row(dl, 'Proceso', 'Pendiente', true);
    row(dl, 'Líneas de negocio', 'Pendiente', true);
    row(dl, 'Recorridos', 'Pendiente', true);
    if (a.source) row(dl, 'Fuente', a.source);
    box.appendChild(dl);
    if (a.children) {
      const named = a.children.filter(c => c.name);
      box.appendChild(h('span', 'detail-sub', 'Zonas identificadas en el plano'));
      const ul = h('ul', 'detail-zones');
      named.filter((c, i) => named.findIndex(o => o.name === c.name) === i)
        .forEach(c => ul.appendChild(h('li', null, c.name)));
      box.appendChild(ul);
    }
  }

  function row(dl, k, v, pending) {
    dl.appendChild(h('dt', null, k));
    dl.appendChild(h('dd', pending ? 'is-pending' : null, v));
  }

  function renderInventory() {
    const host = $('#inventory');
    if (!host) return;
    host.innerHTML = '';
    readyPlants().forEach(p => {
      ['area', 'machine'].forEach(kind => {
        const items = p.areas.filter(a => a.kind === kind);
        if (!items.length) return;
        const grp = h('div', 'inv-group');
        const head = h('div', 'inv-head');
        head.appendChild(h('span', null, kind === 'area' ? 'Áreas de proceso' : 'Máquinas'));
        head.appendChild(h('span', 'inv-count', String(items.length)));
        grp.appendChild(head);
        const ul = h('ul', 'inv-list');
        items.forEach(a => {
          const li = h('li', 'inv-item inv-item--' + kind);
          li.dataset.plant = p.id; li.dataset.id = a.id; li.tabIndex = 0;
          li.appendChild(h('span', 'inv-swatch'));
          li.appendChild(h('span', 'inv-name', a.label + (a.model ? ' · ' + a.model : '')));
          if (a.unit) li.appendChild(h('span', 'inv-unit', pad(a.unit)));
          li.addEventListener('mouseenter', () => setHover(p.id, a.id, true));
          li.addEventListener('mouseleave', () => setHover(p.id, a.id, false));
          li.addEventListener('click', () => select(p.id, a.id));
          li.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.id, a.id); }
          });
          ul.appendChild(li);
        });
        grp.appendChild(ul);
        host.appendChild(grp);
      });
    });
  }

  function renderPending() {
    const ul = $('#pending');
    if (!ul) return;
    ul.innerHTML = '';
    D.pending.forEach(it => {
      const li = h('li', 'pend-item');
      li.appendChild(h('span', 'pend-scope', it.scope));
      li.appendChild(h('span', 'pend-text', it.text));
      ul.appendChild(li);
    });
  }

  /* Capa de flechas del recorrido activo (coordenadas de pantalla) */
  function renderFlow() {
    const stage = $('#stage');
    ESM.clearFlow(stage);
    const active = activeProducts().filter(x => routesOf(x.product).length);
    if (active.length) {
      // esperar al layout para medir las áreas (setTimeout: también en pestañas en segundo plano)
      setTimeout(() => {
        let k = 0;
        active.forEach((x, n) => routesOf(x.product).forEach(r =>
          ESM.drawFlow(stage, r, state.views, { color: x.idx, layer: n, append: k++ > 0 })));
      }, 0);
    }
  }

  function render() {
    renderScenarioNav();
    renderPrintNav();
    renderLines();
    renderStage();
    fitPlants();
    renderInventory();
    renderPending();
    applySelection();
    renderFlow();
  }

  /* El marco de cada plano toma el alto disponible; su ancho sigue la
     proporción del plano para que nunca haya que desplazarse. */
  function fitPlants() {
    const cards = [...document.querySelectorAll('#stage .plant-card')];
    cards.forEach(card => {
      const host = card.querySelector('.plant-host');
      host.style.height = '';
      card.style.setProperty('--fit-w', (host.clientHeight * parseFloat(host.dataset.ratio)) + 'px');
    });
    // si los planos no caben a lo ancho (p. ej. las dos propuestas de ESM 3),
    // se reducen en proporción para que nunca haya que desplazarse
    const stage = $('#stage');
    const k = stage.clientWidth / Math.max(stage.scrollWidth, 1);
    if (k >= 0.999) return;
    // se miden todos los altos antes de tocarlos: cambiar uno reordena la fila
    const heights = cards.map(card => card.querySelector('.plant-host').clientHeight * k);
    cards.forEach((card, i) => {
      const host = card.querySelector('.plant-host');
      host.style.height = heights[i] + 'px';
      card.style.setProperty('--fit-w', (heights[i] * parseFloat(host.dataset.ratio)) + 'px');
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { fitPlants(); renderFlow(); }, 150);
  });

  /* =====================================================================
     Impresión / PDF — tabloide horizontal (11 × 17 pulgadas)
     ---------------------------------------------------------------------
     Cada vista se arma en hojas propias fuera de pantalla (mismo dibujo de
     plantas, filtros y recorridos) y se envía a imprimir. En el diálogo del
     navegador: destino «Guardar como PDF», tamaño «Tabloide», horizontal.
     ES Metals 3 imprime cada propuesta en su propia hoja.
     ===================================================================== */
  const SHEET = { long: 431.8, short: 279.4, margin: 9 };   // tabloide (11 × 17 pulg.)
  const PRINT_GAP = 16, PRINT_RESERVED = 100;               // separación y cabecera + rótulo
  const mmToPx = mm => mm * 96 / 25.4;

  /* Área útil de la hoja, horizontal o vertical */
  function sheetBox(portrait) {
    return {
      w: mmToPx((portrait ? SHEET.short : SHEET.long) - 2 * SHEET.margin),
      h: mmToPx((portrait ? SHEET.long : SHEET.short) - 2 * SHEET.margin),
      portrait
    };
  }

  /* Alto de plano que cabe en una hoja: manda el lado más restrictivo */
  function fitHost(spec, box) {
    const total = spec.plants.reduce((s, p) => s + p.canvas.w / p.canvas.h, 0);
    return Math.min(box.h - PRINT_RESERVED,
                    (box.w - PRINT_GAP * (spec.plants.length - 1)) / total);
  }

  function renderPrintNav() {
    const nav = $('#print-nav');
    if (!nav) return;
    nav.innerHTML = '';
    const futuro = state.scenario === 'futuro';
    const grp = h('div', 'print-group');
    grp.appendChild(h('span', 'print-label', 'Imprimir'));
    grp.appendChild(printBtn('todo', 'PDF', futuro
      ? 'Imprimir las dos propuestas, cada una en su hoja (tabloide horizontal)'
      : 'Imprimir la vista actual con los filtros aplicados (tabloide horizontal)', true));
    if (futuro) {
      grp.appendChild(printBtn('p1', '1', 'Imprimir solo la Propuesta 1 · dos plantas independientes'));
      grp.appendChild(printBtn('p2', '2', 'Imprimir solo la Propuesta 2 · mega planta integrada'));
    }
    nav.appendChild(grp);
  }

  function printBtn(which, text, title, icon) {
    const b = h('button', 'print-btn' + (icon ? '' : ' print-btn--n'));
    b.type = 'button';
    b.title = title;
    if (icon) b.appendChild(printerIcon());
    b.appendChild(h('span', null, text));
    b.addEventListener('click', () => printView(which));
    return b;
  }

  function printerIcon() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('class', 'print-icon');
    svg.setAttribute('aria-hidden', 'true');
    ['M4.75 6.25V2.75h6.5v3.5',
     'M11.25 11.75h1.5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-9.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1.5',
     'M4.75 9.75h6.5v3.5h-6.5z'].forEach(d => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  /* Hojas de la vista activa: en ESM 3, una por propuesta */
  function printSpecs(which) {
    if (state.scenario !== 'futuro') {
      const plants = readyPlants().filter(p => !state.focusPlant || p.id === state.focusPlant);
      return [{
        title: plants.map(p => p.name).join('  ·  '),
        plants, pick: 0, futuro: false
      }];
    }
    const specs = [];
    if (which !== 'p2') specs.push({
      title: 'Dos plantas independientes',
      plants: THREE.map(id => D.plants[id]).filter(p => p && p.status === 'ready'), pick: 1, futuro: true
    });
    if (which !== 'p1') specs.push({
      title: 'Mega planta integrada',
      plants: [D.plants.esm3], pick: 0, futuro: true
    });
    return specs;
  }

  /* Tamaño de papel del trabajo de impresión (tabloide, en la orientación elegida) */
  function pageRule(portrait) {
    let st = document.getElementById('print-page-rule');
    if (!st) {
      st = document.createElement('style');
      st.id = 'print-page-rule';
      document.head.appendChild(st);
    }
    st.textContent = '@page { size: ' +
      (portrait ? SHEET.short + 'mm ' + SHEET.long : SHEET.long + 'mm ' + SHEET.short) +
      'mm; margin: ' + SHEET.margin + 'mm; }';
  }

  function buildPrint(which) {
    const root = h('div', 'print-root');
    root.id = 'print-root';
    const specs = printSpecs(which).filter(s => s.plants.length);
    // toda la impresión va en una sola orientación: la que agranda los planos
    const portrait = specs.length > 0 &&
      specs.every(s => fitHost(s, sheetBox(true)) > fitHost(s, sheetBox(false)));
    const size = sheetBox(portrait);
    pageRule(portrait);
    const pages = [];
    specs.forEach(spec => {
      if (!spec.plants.length) return;
      const page = h('section', 'print-page');
      page.style.width = size.w + 'px';
      page.style.height = size.h + 'px';

      const head = h('header', 'print-head');
      const logo = document.createElement('img');
      logo.className = 'print-logo';
      logo.alt = 'ES Metals';
      const brand = $('.brand-logo');
      logo.src = brand ? brand.src : 'assets/logo.png';
      head.appendChild(logo);
      const titles = h('div', 'print-titles');
      titles.appendChild(h('h1', 'print-title', spec.title));
      head.appendChild(titles);
      page.appendChild(head);

      const stage = h('div', 'stage print-stage' + (spec.futuro ? ' is-futuro' : ''));
      page.appendChild(stage);
      root.appendChild(page);
      pages.push({ spec, page, stage, size });
    });
    document.body.appendChild(root);
    pages.forEach(drawPrintPage);
    return root;
  }

  /* Dibuja una hoja: plantas ajustadas al alto disponible y recorridos */
  function drawPrintPage(pg) {
    const { spec, page, stage, size } = pg;
    const headH = page.querySelector('.print-head').getBoundingClientRect().height;
    const TITLE_H = 34;
    const availW = size.w, availH = size.h - headH - TITLE_H - 14;
    const ratios = spec.plants.map(p => p.canvas.w / p.canvas.h);
    const total = ratios.reduce((a, b) => a + b, 0);
    const hostH = Math.min(availH, (availW - PRINT_GAP * (spec.plants.length - 1)) / total);

    const views = {};
    spec.plants.forEach((p, i) => {
      const card = h('section', 'plant-card');
      card.dataset.plant = p.id;
      card.style.setProperty('--fit-w', (hostH * ratios[i]) + 'px');
      const head = h('header', 'plant-head');
      const title = h('div', 'plant-title');
      title.appendChild(h('h2', 'plant-name', p.short === '' ? ' ' : (p.short || p.name)));
      head.appendChild(title);
      card.appendChild(head);
      const host = h('div', 'plant-host');
      host.style.width = (hostH * ratios[i]) + 'px';
      host.style.height = hostH + 'px';
      card.appendChild(host);
      stage.appendChild(card);
      views[p.id] = ESM.renderPlant(p, host);
    });

    const routes = activeProducts()
      .map(x => ({ idx: x.idx, steps: routesOf(x.product)[spec.pick] || [] }))
      .filter(r => r.steps.length);

    Object.values(views).forEach(v => {
      Object.keys(v.nodes).forEach(id => {
        if (!routes.length) { v.setState(id, null); return; }
        const on = routes.some(r => r.steps.some(s =>
          s.plant === v.plant.id && stepAreas(v.plant, s).includes(id)));
        v.setState(id, on ? 'active' : 'dim');
      });
    });

    let k = 0;
    routes.forEach((r, n) => ESM.drawFlow(stage, r.steps, views, { color: r.idx, layer: n, append: k++ > 0 }));
  }

  function clearPrint() {
    const r = document.getElementById('print-root');
    if (r) r.remove();
  }

  function printView(which) {
    clearPrint();
    buildPrint(which);
    setTimeout(() => window.print(), 120);
  }

  // Ctrl/Cmd + P y el menú del navegador imprimen la vista activa completa
  window.addEventListener('beforeprint', () => { if (!document.getElementById('print-root')) buildPrint('todo'); });
  window.addEventListener('afterprint', clearPrint);
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      printView('todo');
    }
  });

  render();
})();
