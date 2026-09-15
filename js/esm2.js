/* =====================================================================
   ES Metals 2 — datos de planta (distribución suministrada 2026-09-14)
   ---------------------------------------------------------------------
   Coordenadas: 1 unidad ≈ 1 px del esquema de referencia, origen en la
   esquina superior izquierda del marco. Sin escala real.

   La maquinaria sin rótulo individual se dibuja como símbolos en planta
   dentro de cada área.
   ===================================================================== */
window.ESM = window.ESM || {};
ESM.plants = ESM.plants || {};

ESM.plants.esm2 = {
  id: 'esm2',
  name: 'ES Metals 2',
  short: 'ESM 2',
  status: 'ready',
  note: 'Planta reconstruida a partir de la distribución suministrada. Sin escala.',
  canvas: { w: 749, h: 878 },
  perimeter: { x: 0, y: 0, w: 749, h: 878 },

  annotations: [
    /* Máquina larga junto a Mecanizado lámina (sin rótulo en el esquema) */
    { type: 'symbol', symbol: 'center', name: 'Máquina sin rótulo', x: 224, y: 32, w: 212, h: 52 }
  ],

  areas: [
    /* ---------- Mecanizado de lámina ---------- */
    {
      id: 'mecanizado-lamina', kind: 'area', label: 'Mecanizado / lámina',
      source: 'Distribución suministrada',
      x: 32, y: 30, w: 190, h: 85,
      labels: [{ x: 142, y: 72 }],
      children: [
        { type: 'symbol', symbol: 'gantry', name: 'Centro de mecanizado de lámina', x: 36, y: 34, w: 182, h: 77 }
      ]
    },

    /* ---------- Corte de perfilería ---------- */
    {
      id: 'corte-perfileria', kind: 'area', label: 'Corte / perfilería',
      source: 'Distribución suministrada',
      x: 52, y: 150, w: 170, h: 260,
      labels: [{ x: 160, y: 280, rotate: -90 }],
      children: [
        { type: 'rack', name: 'Mesas de corte', x: 57, y: 155, w: 150, h: 40, bays: 7, dir: 'x' },
        { type: 'symbol', symbol: 'saw', name: 'Sierra', x: 128, y: 158, w: 22, h: 18 },
        { type: 'rack', name: 'Mesas de corte', x: 77, y: 205, w: 65, h: 40, bays: 3, dir: 'x' },
        { type: 'block', name: 'Elemento sin rótulo', x: 58, y: 228, w: 9, h: 9 },
        { type: 'rack', name: 'Mesas de corte', x: 67, y: 255, w: 130, h: 65, bays: 5, dir: 'x' },
        { type: 'symbol', symbol: 'saw', name: 'Sierra', x: 112, y: 262, w: 24, h: 20 },
        { type: 'rack', name: 'Mesas de corte', x: 57, y: 305, w: 150, h: 40, bays: 7, dir: 'x' },
        { type: 'rack', name: 'Mesas de corte', x: 62, y: 355, w: 145, h: 50, bays: 6, dir: 'x' },
        { type: 'symbol', symbol: 'saw', name: 'Sierra', x: 66, y: 368, w: 26, h: 22 },
        { type: 'block', name: 'Elemento sin rótulo', x: 122, y: 378, w: 16, h: 10 }
      ]
    },

    /* ---------- Mecanizado de perfiles (nave central) ---------- */
    {
      id: 'mecanizado-perfiles', kind: 'area', label: 'Mecanizado / de perfiles',
      source: 'Distribución suministrada',
      x: 237, y: 120, w: 180, h: 280,
      labels: [{ x: 262, y: 260, rotate: -90 }],
      children: [
        { type: 'symbol', symbol: 'center', name: 'Centro de mecanizado de perfiles', x: 267, y: 130, w: 30, h: 75, rot: 90 },
        { type: 'symbol', symbol: 'center', name: 'Centro de mecanizado de perfiles', x: 267, y: 325, w: 30, h: 70, rot: 90 },
        { type: 'rack', name: 'Mesas de trabajo', x: 312, y: 125, w: 40, h: 270, bays: 10, dir: 'y' },
        { type: 'rack', name: 'Mesas de trabajo', x: 367, y: 125, w: 40, h: 270, bays: 10, dir: 'y' },
      ]
    },

    /* ---------- Mecanizado de perfiles (nave oriental) ---------- */
    {
      id: 'mecanizado-perfiles-2', kind: 'area', label: 'Mecanizado / de perfiles',
      source: 'Distribución suministrada',
      x: 467, y: 25, w: 260, h: 195,
      labels: [{ x: 592, y: 100 }],
      children: [
        { type: 'rack', name: 'Mesas de trabajo', x: 507, y: 30, w: 210, h: 25, bays: 9, dir: 'x' },
        { type: 'rack', name: 'Mesas de trabajo', x: 687, y: 55, w: 30, h: 125, bays: 5, dir: 'y' }
      ]
    },

    /* ---------- Ensamble ---------- */
    {
      id: 'ensamble', kind: 'area', label: 'Ensamble',
      source: 'Distribución suministrada',
      x: 482, y: 240, w: 245, h: 375,
      labels: [{ x: 555, y: 450, rotate: -90 }],
      children: [
        { type: 'benches', name: 'Mesas de ensamble', x: 492, y: 250, w: 45, h: 26, count: 9, pitch: 40 },
        { type: 'benches', name: 'Mesas de ensamble', x: 562, y: 250, w: 45, h: 26, count: 9, pitch: 40 },
        { type: 'benches', name: 'Mesas de ensamble', x: 642, y: 250, w: 50, h: 26, count: 9, pitch: 40 },
      ]
    },

    /* ---------- Almacenes ---------- */
    {
      id: 'almacen-perfiles-a', kind: 'area', label: 'Almacén / de perfiles',
      source: 'Distribución suministrada',
      x: 57, y: 440, w: 150, h: 405,
      labels: [{ x: 132, y: 642, rotate: -90 }],
      children: [
        { type: 'rack', name: 'Estantería de perfiles', x: 62, y: 445, w: 45, h: 395, bays: 12, dir: 'y' },
        { type: 'rack', name: 'Estantería de perfiles', x: 157, y: 445, w: 45, h: 395, bays: 12, dir: 'y' }
      ]
    },
    {
      id: 'almacen-laminas', kind: 'area', label: 'Almacén / de láminas',
      source: 'Distribución suministrada',
      x: 262, y: 440, w: 155, h: 405,
      labels: [{ x: 340, y: 642, rotate: -90 }],
      children: [
        { type: 'rack', name: 'Estantería de láminas', x: 267, y: 445, w: 45, h: 395, bays: 12, dir: 'y' },
        { type: 'rack', name: 'Estantería de láminas', x: 367, y: 445, w: 45, h: 395, bays: 12, dir: 'y' }
      ]
    },

    /* ---------- Logística ---------- */
    {
      id: 'logistica', kind: 'area', label: 'Logística',
      source: 'Distribución suministrada',
      x: 482, y: 650, w: 245, h: 195,
      labels: [{ x: 604, y: 748 }],
      children: [
        { type: 'wall', d: 'M484 652 H725 V843 H484 Z' },
        { type: 'columns', x1: 488, y1: 652, x2: 721, y2: 652, count: 9 },
        { type: 'axis', d: 'M484 725 H725' },
        { type: 'axis', d: 'M602 652 V843' },
        { type: 'block', name: 'Elemento sin rótulo', x: 606, y: 718, w: 16, h: 12 },
      ]
    }
  ]
};
