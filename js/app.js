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

  /* Recorrido de un producto en el escenario activo (actual: route · futuro: route3) */
  function routeOf(product) {
    return (state.scenario === 'futuro' ? product.route3 : product.route) || [];
  }

  /* Áreas que cubre un paso: área, alternativas (areas) o grupo de la planta */
  function stepAreas(plant, step) {
    if (step.group) return (plant.groups && plant.groups[step.group]) ? plant.groups[step.group].areas : [];
    return step.areas || [step.area];
  }

  /* Ilumina las áreas del recorrido del producto activo y atenúa el resto */
  function applyRoute() {
    const route = activeProducts().flatMap(x => routeOf(x.product));
    Object.values(state.views).forEach(v => {
      Object.keys(v.nodes).forEach(id => {
        if (!route.length) { v.setState(id, null); return; }
        const inRoute = route.some(step => step.plant === v.plant.id && stepAreas(v.plant, step).includes(id));
        v.setState(id, inRoute ? 'active' : 'dim');
      });
    });
  }

  /* ---------- Escenario: plantas listas del escenario activo ---------- */
  function readyPlants() {
    const sc = D.scenarios.find(s => s.id === state.scenario);
    return sc.plants.map(id => D.plants[id]).filter(p => p.status === 'ready');
  }

  function renderStage() {
    const stage = $('#stage');
    stage.innerHTML = '';
    state.views = {};
    const plants = readyPlants();
    stage.style.setProperty('--plants', plants.length || 1);
    stage.classList.toggle('is-futuro', state.scenario === 'futuro');

    plants.forEach(p => {
      const card = h('section', 'plant-card' + (state.focusPlant && state.focusPlant !== p.id ? ' is-muted' : ''));
      card.dataset.plant = p.id;

      const head = h('header', 'plant-head');
      const title = h('div', 'plant-title');
      title.appendChild(h('h2', 'plant-name', p.short || p.name));
      head.appendChild(title);

      if (!p.hideCounts) {
        const counts = h('div', 'plant-counts');
        counts.appendChild(countTile(p.areas.filter(a => a.kind === 'area').length, 'áreas de proceso'));
        counts.appendChild(countTile(machineCount(p), 'máquinas'));
        head.appendChild(counts);
      }
      card.appendChild(head);

      const host = h('div', 'plant-host');
      host.style.setProperty('--ratio', p.canvas.w + ' / ' + p.canvas.h);
      host.dataset.ratio = p.canvas.w / p.canvas.h;
      card.appendChild(host);
      const view = ESM.renderPlant(p, host);
      state.views[p.id] = view;
      wireNodes(view);

      stage.appendChild(card);
    });
  }

  /* Máquinas rotuladas + maquinaria dibujada dentro de áreas (symbol / benches) */
  function machineCount(p) {
    return p.areas.reduce((n, a) => {
      if (a.kind === 'machine') return n + 1;
      return n + (a.children || []).reduce((m, c) =>
        m + (c.type === 'symbol' ? 1 : c.type === 'benches' ? c.count : 0), 0);
    }, 0);
  }

  function countTile(n, label) {
    const t = h('div', 'count');
    t.appendChild(h('span', 'count-n', String(n)));
    t.appendChild(h('span', 'count-l', label));
    return t;
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
    const active = activeProducts().filter(x => routeOf(x.product).length);
    if (active.length) {
      // esperar al layout para medir las áreas (setTimeout: también en pestañas en segundo plano)
      setTimeout(() => active.forEach((x, n) =>
        ESM.drawFlow(stage, routeOf(x.product), state.views, { color: x.idx, layer: n, append: n > 0 })), 0);
    }
  }

  function render() {
    renderScenarioNav();
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
    document.querySelectorAll('.plant-host').forEach(host => {
      const ratio = parseFloat(host.dataset.ratio);
      host.closest('.plant-card').style.setProperty('--fit-w', (host.clientHeight * ratio) + 'px');
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { fitPlants(); renderFlow(); }, 150);
  });

  render();
})();
