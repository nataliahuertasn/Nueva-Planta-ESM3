/* =====================================================================
   ES Metals 1 — datos de planta (distribución suministrada 2026-09-14)
   ---------------------------------------------------------------------
   Coordenadas: 1 unidad ≈ 1 px del esquema de referencia, origen en la
   esquina superior izquierda del marco. Sin escala real.
   ===================================================================== */
window.ESM = window.ESM || {};
ESM.plants = ESM.plants || {};

ESM.plants.esm1 = {
  id: 'esm1',
  name: 'ES Metals 1',
  short: 'ESM 1',
  status: 'ready',
  note: 'Planta reconstruida a partir de la distribución suministrada. Sin escala.',
  canvas: { w: 740, h: 868 },
  perimeter: { x: 0, y: 0, w: 740, h: 868 },

  /* Grupos de proceso: varias áreas que actúan como un solo paso en los
     recorridos. `outline` es el contorno resaltado; `areas[0]` recibe /
     emite las flechas. */
  groups: {
    pintura: {
      label: 'Pintura',
      areas: ['pintura', 'canastas-cromado', 'pretratamiento'],
      outline: [[30, 22], [578, 22], [578, 170], [222, 170], [222, 190], [178, 190], [178, 835], [30, 835]]
    }
  },

  annotations: [
    /* Estantería larga del costado oriental (sin rótulo en el esquema) */
    { type: 'rack', name: 'Elemento sin rótulo', x: 690, y: 208, w: 25, h: 515, bays: 1 }
  ],

  areas: [
    /* ---------- Pintura ---------- */
    {
      id: 'pintura', kind: 'area', label: 'Pintura',
      source: 'Distribución suministrada',
      x: 37, y: 28, w: 133, h: 800,
      labels: [{ x: 90, y: 493, rotate: -90 }],
      children: [
        { type: 'rack', name: 'Recinto (sin rótulo)', x: 43, y: 35, w: 104, h: 83, bays: 1 },
        { type: 'track', name: 'Transportador de la línea de pintura',
          d: 'M62 183 V785 A26.5 26.5 0 0 0 115 785 V183 Z' },
        { type: 'track', name: 'Transportador de la línea de pintura (retorno)',
          d: 'M68 183 V785 A20.5 20.5 0 0 0 109 785 V183' },
        { type: 'fans', name: 'Cabina con extractores', x: 95, y: 121, w: 45, h: 52, fans: 2 },
        { type: 'fans', name: 'Cabina con extractores', x: 125, y: 188, w: 32, h: 53, fans: 2 },
        { type: 'block', name: 'Equipo sobre la línea (sin rótulo)', x: 65, y: 298, w: 23, h: 25 },
        { type: 'drums', name: 'Canecas', x: 121, y: 250, cols: 3, rows: 12, r: 4.2, pitch: 12 },
        { type: 'fans', name: 'Cabina con extractores', x: 90, y: 378, w: 48, h: 45, fans: 2 },
        { type: 'fans', name: 'Cabina con extractores', x: 125, y: 448, w: 32, h: 50, fans: 2 },
        { type: 'zone', name: 'Producto en proceso', label: 'Pdto. en proceso',
          x: 128, y: 516, w: 34, h: 140, rotate: -90 },
        { type: 'rack', name: 'Estantería producto en proceso', x: 131, y: 519, w: 10, h: 134, bays: 5, dir: 'y' },
        { type: 'rack', name: 'Estantería producto en proceso', x: 149, y: 519, w: 10, h: 134, bays: 5, dir: 'y' }
      ]
    },
    {
      id: 'canastas-cromado', kind: 'area', label: 'Canastas / cromado', small: true,
      source: 'Distribución suministrada',
      x: 155, y: 28, w: 60, h: 155,
      labels: [{ x: 171, y: 78, rotate: -90 }],
      children: [
        { type: 'rack', name: 'Estantería de canastas', x: 183, y: 36, w: 13, h: 50, bays: 3, dir: 'y' },
        { type: 'rack', name: 'Estantería de canastas', x: 198, y: 36, w: 13, h: 50, bays: 3, dir: 'y' },
        { type: 'rack', name: 'Estantería de canastas', x: 158, y: 122, w: 24, h: 28, bays: 2, dir: 'x' },
        { type: 'rack', name: 'Estantería de canastas', x: 184, y: 122, w: 24, h: 28, bays: 2, dir: 'x' },
        { type: 'rack', name: 'Estantería de canastas', x: 158, y: 152, w: 24, h: 28, bays: 2, dir: 'x' },
        { type: 'rack', name: 'Estantería de canastas', x: 184, y: 152, w: 24, h: 28, bays: 2, dir: 'x' }
      ]
    },
    {
      id: 'pretratamiento', kind: 'area', label: 'Pretratamiento',
      source: 'Distribución suministrada',
      x: 220, y: 28, w: 350, h: 135,
      labels: [{ x: 395, y: 95 }],
      children: [
        { type: 'tank', name: 'Tanque de pretratamiento', x: 240, y: 38, w: 85, h: 115 },
        { type: 'tank', name: 'Tanque de pretratamiento', x: 355, y: 38, w: 85, h: 115 },
        { type: 'tank', name: 'Tanque de pretratamiento', x: 470, y: 38, w: 85, h: 115 }
      ]
    },
    {
      id: 'almacen', kind: 'area', label: 'Almacén',
      source: 'Distribución suministrada',
      x: 585, y: 28, w: 120, h: 155,
      labels: [{ x: 607, y: 105, rotate: -90 }],
      children: [
        { type: 'rack', name: 'Estantería', x: 626, y: 36, w: 16, h: 138, bays: 8, dir: 'y' },
        { type: 'rack', name: 'Estantería', x: 645, y: 36, w: 16, h: 138, bays: 8, dir: 'y' },
        { type: 'rack', name: 'Estantería', x: 664, y: 36, w: 16, h: 138, bays: 8, dir: 'y' },
        { type: 'rack', name: 'Estantería', x: 683, y: 36, w: 16, h: 138, bays: 8, dir: 'y' }
      ]
    },

    /* ---------- Manufactura ---------- */
    { id: 'laser', kind: 'machine', label: 'Corte láser', symbol: 'laser',
      source: 'Distribución suministrada', x: 220, y: 218, w: 303, h: 105,
      labels: [{ x: 380, y: 268 }] },

    {
      id: 'producto-terminado', kind: 'area', label: 'Producto / terminado', small: true,
      source: 'Distribución suministrada',
      x: 605, y: 208, w: 70, h: 105,
      labels: [{ x: 640, y: 260, rotate: -90 }]
    },

    { id: 'cizalla', kind: 'machine', label: 'Cizalla', symbol: 'cizalla',
      source: 'Distribución suministrada', x: 570, y: 343, w: 60, h: 80, rot: 90,
      labels: [{ x: 590, y: 383, rotate: -90 }] },

    { id: 'punzonado', kind: 'area', label: 'Punzonado',
      source: 'Distribución suministrada', x: 220, y: 343, w: 110, h: 360,
      labels: [{ x: 275, y: 523, rotate: -90 }] },
    { id: 'punzonadora-1', kind: 'machine', label: 'Punzonadora', model: 'Trupunch 3000', unit: 1, symbol: 'punzonadora', hideLabel: true,
      source: 'Distribución suministrada', x: 225, y: 343, w: 98, h: 110, rot: 90 },
    { id: 'punzonadora-2', kind: 'machine', label: 'Punzonadora', model: 'Trupunch 1000', unit: 2, symbol: 'punzonadora', hideLabel: true,
      source: 'Distribución suministrada', x: 225, y: 468, w: 98, h: 110, rot: 90 },
    { id: 'punzonadora-3', kind: 'machine', label: 'Punzonadora', model: 'Trupunch 3000', unit: 3, symbol: 'punzonadora', hideLabel: true,
      source: 'Distribución suministrada', x: 225, y: 598, w: 98, h: 105, rot: 90 },

    { id: 'doblez', kind: 'area', label: 'Doblez',
      source: 'Distribución suministrada', x: 425, y: 343, w: 100, h: 360,
      labels: [{ x: 465, y: 523, rotate: -90 }] },
    { id: 'dobladora-1', kind: 'machine', label: 'Dobladora', model: 'Trubent 3170', unit: 1, symbol: 'dobladora', hideLabel: true,
      source: 'Distribución suministrada', x: 430, y: 343, w: 93, h: 110, rot: 90 },
    { id: 'dobladora-2', kind: 'machine', label: 'Dobladora', model: 'Trumpf 1700', unit: 2, symbol: 'dobladora', hideLabel: true,
      source: 'Distribución suministrada', x: 430, y: 468, w: 93, h: 110, rot: 90 },
    { id: 'dobladora-3', kind: 'machine', label: 'Dobladora', model: 'Trubent 1225', unit: 3, symbol: 'dobladora', hideLabel: true,
      source: 'Distribución suministrada', x: 430, y: 598, w: 93, h: 105, rot: 90 },

    { id: 'sublimadora', kind: 'machine', label: 'Sublimado', symbol: 'sublimadora',
      source: 'Distribución suministrada', x: 555, y: 513, w: 80, h: 190, rot: 90,
      labels: [{ x: 595, y: 608, rotate: -90 }] },

    /* ---------- Sur ---------- */
    {
      id: 'soldadura', kind: 'area', label: 'Soldadura',
      source: 'Distribución suministrada',
      x: 285, y: 733, w: 185, h: 115,
      labels: [{ x: 377, y: 790 }],
      children: [
        { type: 'symbol', symbol: 'bench', name: 'Mesa de soldadura', x: 297, y: 742, w: 40, h: 34 },
        { type: 'symbol', symbol: 'bench', name: 'Mesa de soldadura', x: 357, y: 742, w: 40, h: 34 },
        { type: 'symbol', symbol: 'bench', name: 'Mesa de soldadura', x: 417, y: 742, w: 40, h: 34 },
        { type: 'symbol', symbol: 'bench', name: 'Mesa de soldadura', x: 297, y: 802, w: 40, h: 34 },
        { type: 'symbol', symbol: 'bench', name: 'Mesa de soldadura', x: 357, y: 802, w: 40, h: 34 },
        { type: 'symbol', symbol: 'bench', name: 'Mesa de soldadura', x: 417, y: 802, w: 40, h: 34 }
      ]
    },
    {
      id: 'logistica', kind: 'area', label: 'Logística',
      source: 'Distribución suministrada',
      x: 490, y: 733, w: 90, h: 115,
      labels: [{ x: 535, y: 790 }]
    }
  ]
};
