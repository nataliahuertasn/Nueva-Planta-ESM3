/* =====================================================================
   ES Metals — Fuente única de datos de la presentación
   ---------------------------------------------------------------------
   Todo lo que se dibuja en pantalla sale de este archivo.
   Para incorporar ES Metals 2, líneas de negocio, recorridos,
   proyecciones o ES Metals 3 se agregan datos aquí; el motor de
   dibujo (render.js) y la aplicación (app.js) no cambian.

   Coordenadas de planta: unidades relativas tomadas del plano de
   referencia (1 unidad ≈ 1 px del plano, origen en el marco del plano).
   NO son dimensiones arquitectónicas ni están a escala.

   Modelo de un área / máquina:
     { id, kind: 'area' | 'machine', label, [model], [unit], [small],
       x, y, w, h  |  shape: 'polygon', points: [[x,y], ...],
       [labels: [{ x, y, [rotate] }]],
       [source], [children: [...]] }
   Elementos internos (children), no interactivos:
     { type: 'zone',  name, [label], x, y, w, h, [rotate], [labelAt: 'top'] }
     { type: 'block', name, x, y, w, h }
     { type: 'stack', name, x, y, w, h, count, [gap], [dir: 'x' | 'y'] }
     { type: 'track', name, d }
     { type: 'label', name, label, x, y, [rotate] }
   ===================================================================== */
window.ESM = window.ESM || {};

ESM.data = {
  meta: {
    company: 'ES Metals',
    title: 'Distribución de plantas y flujo de procesos',
    stage: 'Etapa 1 · ES Metals 1 y 2'
  },

  /* Escenarios de la historia: actual (ESM1 + ESM2) → futuro (ESM3) */
  scenarios: [
    { id: 'actual', label: 'Escenario actual', plants: ['esm1', 'esm2'] },
    { id: 'futuro', label: 'Escenario futuro', plants: ['esm3'] }
  ],

  plants: {
    /* Datos de planta en js/esm1.js (se carga antes de este archivo) */
    esm1: ESM.plants.esm1,

    /* Se incorporarán en las siguientes etapas */
    esm2: ESM.plants.esm2,
    esm3: ESM.plants.esm3,
    /* Propuesta 2 de ESM 3: tres plantas independientes */
    esm3a: ESM.plants.esm3a,
    esm3b: ESM.plants.esm3b,
    esm3c: ESM.plants.esm3c
  },

  /* Líneas de negocio y productos.
     Estructura prevista (a completar con datos reales):
     { id, name, products: [ { id, name,
         route: [ { plant: 'esm1', area: 'laser' }, ... ] } ] }            */
  businessLines: [
    { id: 'fachadas', name: 'Fachadas', products: [
      { id: 'perfileria', name: 'Perfilería',
        /* recorrido en ES Metals 3 */
        route3: [
          { plant: 'esm3', area: 'e3-almacen-perfiles' },
          { plant: 'esm3', area: 'e3-cortadora-perfiles' },
          { plant: 'esm3', area: 'e3-cnc-perfiles' },
          { plant: 'esm3', area: 'e3-soldadura' },
          { plant: 'esm3', areas: ['e3-pintura-liquida', 'e3-pintura-polvo'], name: 'Pintura (líquida o en polvo)' },
          { plant: 'esm3', area: 'e3-ensamble' },
          { plant: 'esm3', area: 'e3-logistica' }
        ],
      route: [
        { plant: 'esm2', area: 'almacen-perfiles-a' },
        { plant: 'esm2', area: 'corte-perfileria' },
        { plant: 'esm2', area: 'mecanizado-perfiles' },
        { plant: 'esm1', area: 'soldadura' },
        { plant: 'esm1', group: 'pintura' },
        { plant: 'esm2', area: 'ensamble' },
        { plant: 'esm2', area: 'logistica' }
      ] },
      { id: 'laminas', name: 'Láminas',
        /* recorrido en ES Metals 3 */
        route3: [
          { plant: 'esm3', area: 'e3-almacen-lamina' },
          { plant: 'esm3', areas: ['e3-punzonado', 'e3-laser-lamina'], name: 'Punzonado o Láser' },
          { plant: 'esm3', area: 'e3-enderezadora' },
          { plant: 'esm3', area: 'e3-cnc-lamina' },
          { plant: 'esm3', area: 'e3-dobladora' },
          { plant: 'esm3', area: 'e3-soldadura' },
          { plant: 'esm3', areas: ['e3-pintura-liquida', 'e3-pintura-polvo'], name: 'Pintura (líquida o en polvo)' },
          { plant: 'esm3', area: 'e3-sublimado-lamina' },
          { plant: 'esm3', area: 'e3-ensamble' },
          { plant: 'esm3', area: 'e3-logistica' }
        ],
      route: [
        { plant: 'esm2', area: 'almacen-laminas' },
        { plant: 'esm1', areas: ['punzonado', 'laser'], name: 'Punzonado o Láser' },
        { plant: 'esm2', area: 'mecanizado-lamina' },
        { plant: 'esm1', area: 'doblez' },
        { plant: 'esm1', area: 'soldadura' },
        { plant: 'esm1', group: 'pintura' },
        { plant: 'esm1', area: 'sublimadora' },
        { plant: 'esm2', area: 'ensamble' },
        { plant: 'esm2', area: 'logistica' }
      ] }
    ] },
    /* Brake Metals: mismo recorrido que Fachadas / Láminas */
    { id: 'brake-metals', name: 'Brake Metals', products: [{ id: 'brake-metals', name: 'Brake Metals',
      /* recorrido en ES Metals 3 */
      route3: [
        { plant: 'esm3', area: 'e3-almacen-lamina' },
        { plant: 'esm3', areas: ['e3-punzonado', 'e3-laser-lamina'], name: 'Punzonado o Láser' },
        { plant: 'esm3', area: 'e3-enderezadora' },
        { plant: 'esm3', area: 'e3-dobladora' },
        { plant: 'esm3', area: 'e3-soldadura' },
        { plant: 'esm3', areas: ['e3-pintura-liquida', 'e3-pintura-polvo'], name: 'Pintura (líquida o en polvo)' },
        { plant: 'esm3', area: 'e3-ensamble' },
        { plant: 'esm3', area: 'e3-logistica' }
      ],
      route: [
      { plant: 'esm2', area: 'almacen-laminas' },
      { plant: 'esm1', areas: ['punzonado', 'laser'], name: 'Punzonado o Láser' },
      { plant: 'esm1', area: 'doblez' },
      { plant: 'esm1', area: 'soldadura' },
      { plant: 'esm1', group: 'pintura' },
      { plant: 'esm2', area: 'ensamble' },
      { plant: 'esm2', area: 'logistica' }
    ] }] },
    /* Louvers y Pérgolas: líneas distintas con el mismo recorrido */
    { id: 'louvers', name: 'Louvers', products: [{ id: 'louvers', name: 'Louvers',
      /* recorrido en ES Metals 3 */
      route3: [
        { plant: 'esm3', area: 'e3-almacen-perfiles' },
        { plant: 'esm3', area: 'e3-cortadora-perfiles' },
        { plant: 'esm3', area: 'e3-cnc-perfiles' },
        { plant: 'esm3', areas: ['e3-pintura-liquida', 'e3-pintura-polvo'], name: 'Pintura (líquida o en polvo)' },
        { plant: 'esm3', area: 'e3-ensamble' },
        { plant: 'esm3', area: 'e3-logistica' }
      ],
      route: [
      { plant: 'esm2', area: 'almacen-perfiles-a' },
      { plant: 'esm2', area: 'corte-perfileria' },
      { plant: 'esm2', area: 'mecanizado-perfiles' },
      { plant: 'esm1', group: 'pintura' },
      { plant: 'esm2', area: 'ensamble' },
      { plant: 'esm2', area: 'logistica' }
    ] }] },
    { id: 'pergolas', name: 'Pérgolas', products: [{ id: 'pergolas', name: 'Pérgolas',
      /* recorrido en ES Metals 3 */
      route3: [
        { plant: 'esm3', area: 'e3-almacen-perfiles' },
        { plant: 'esm3', area: 'e3-cortadora-perfiles' },
        { plant: 'esm3', area: 'e3-cnc-perfiles' },
        { plant: 'esm3', area: 'e3-ensamble' },
        { plant: 'esm3', areas: ['e3-pintura-liquida', 'e3-pintura-polvo'], name: 'Pintura (líquida o en polvo)' },
        { plant: 'esm3', area: 'e3-logistica' }
      ],
      route: [
      { plant: 'esm2', area: 'almacen-perfiles-a' },
      { plant: 'esm2', area: 'corte-perfileria' },
      { plant: 'esm2', area: 'mecanizado-perfiles' },
      { plant: 'esm2', area: 'ensamble' },
      { plant: 'esm1', group: 'pintura' },
      { plant: 'esm2', area: 'logistica' }
    ] }] },
    /* ACS: tres flujos. "Pintura líquida" no existe como área propia en los
       planos: se representa sobre Pintura hasta que se indique su ubicación. */
    { id: 'acs', name: 'ACS', products: [
      { id: 'acs-subframe', name: 'Subframe del HPL',
        /* recorrido en ES Metals 3 */
        route3: [
          { plant: 'esm3', area: 'e3-almacen-perfiles' },
          { plant: 'esm3', area: 'e3-cortadora-perfiles' },
          { plant: 'esm3', areas: ['e3-pintura-liquida', 'e3-pintura-polvo'], name: 'Pintura (líquida o en polvo)' },
          { plant: 'esm3', area: 'e3-ensamble' },
          { plant: 'esm3', area: 'e3-logistica' }
        ],
      route: [
        { plant: 'esm2', area: 'almacen-perfiles-a' },
        { plant: 'esm2', area: 'corte-perfileria' },
        { plant: 'esm1', group: 'pintura', name: 'Pintura líquida' },
        { plant: 'esm2', area: 'ensamble' },
        { plant: 'esm2', area: 'logistica' }
      ] },
      { id: 'acs-hpl', name: 'ACS (HPL)',
        /* recorrido en ES Metals 3 */
        route3: [
          { plant: 'esm3', area: 'e3-almacen-hpl' },
          { plant: 'esm3', area: 'e3-sierra-vertical' },
          { plant: 'esm3', area: 'e3-cnc-lamina-hpl' },
          { plant: 'esm3', area: 'e3-planks' },
          { plant: 'esm3', area: 'e3-ensamble-hpl' },
          { plant: 'esm3', area: 'e3-logistica-hpl' }
        ],
      route: [
        { plant: 'esm2', area: 'almacen-perfiles-a' },
        { plant: 'esm2', area: 'corte-perfileria' },
        { plant: 'esm2', area: 'mecanizado-perfiles' },
        { plant: 'esm2', area: 'ensamble' },
        { plant: 'esm2', area: 'logistica' }
      ] },
      { id: 'acs-woodlook', name: 'Woodlook Aluminum',
        /* recorrido en ES Metals 3 */
        route3: [
          { plant: 'esm3', area: 'e3-almacen-perfiles' },
          { plant: 'esm3', area: 'e3-cortadora-perfiles' },
          { plant: 'esm3', area: 'e3-cnc-perfiles' },
          { plant: 'esm3', area: 'e3-pintura-polvo' },
          { plant: 'esm3', area: 'e3-sublimado-perfiles' },
          { plant: 'esm3', area: 'e3-ensamble' },
          { plant: 'esm3', area: 'e3-logistica' }
        ],
      route: [
        { plant: 'esm2', area: 'almacen-perfiles-a' },
        { plant: 'esm2', area: 'corte-perfileria' },
        { plant: 'esm2', area: 'mecanizado-perfiles' },
        { plant: 'esm1', group: 'pintura' },
        { plant: 'esm2', area: 'ensamble' },
        { plant: 'esm1', area: 'sublimadora' },
        { plant: 'esm2', area: 'logistica' }
      ] }
    ] }
  ],

  /* Proyección de facturación por línea de negocio.
     Estructura prevista: { unit: 'COP', periods: ['2026', ...],
                            series: { lineId: [v1, v2, ...] } }           */
  projections: { unit: null, periods: [], series: {} },

  /* Información aún no suministrada o no identificable en la referencia */
  pending: [
    { scope: 'ES Metals 1', text: 'Dimensiones y escala real del layout' },
    { scope: 'ES Metals 1', text: 'Contorno exacto de la edificación: se usa el marco del plano como perímetro' },
    { scope: 'ES Metals 1', text: 'Procesos que ejecuta cada área y máquina' },
    { scope: 'ES Metals 1', text: 'Dobladoras: 3 según el plano actual; los modelos asignados (Trubent 3170, Trumpf 1700, Trubent 1225) vienen del plano anterior — confirmar' },
    { scope: 'ES Metals 1', text: 'Cromado: el plano solo rotula "Área de canastas cromado"; el proceso de cromado como área no aparece' },
    { scope: 'ES Metals 1', text: 'Elementos dibujados sin rótulo en el plano (mesas, cajas, equipos de línea): nombrar si aplica' },
    { scope: 'Pintura', text: 'Equipos sobre la línea (cabinas / hornos) sin rótulo en el plano' },
    { scope: 'ACS', text: 'Pintura líquida (Subframe del HPL): confirmar si es un área distinta de Pintura y dónde está' },
    { scope: 'Operación', text: 'Proyección de facturación por línea' },
    { scope: 'ES Metals 2', text: 'Maquinaria sin rótulo individual en el plano: nombres y modelos' },
    { scope: 'ES Metals 2', text: 'Contorno de la edificación: se usa el marco del plano como perímetro' },
    { scope: 'ES Metals 3', text: 'Referencia visual de la planta macro integrada' }
  ]
};
