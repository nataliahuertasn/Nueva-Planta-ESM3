/* =====================================================================
   ES Metals 3 — planta macro integrada (escenario futuro)
   ---------------------------------------------------------------------
   Reproduce el diagrama de procesos suministrado (2026-09-14): tres
   columnas (Perfiles, Lámina, Lámina HPL) con el flujo de arriba hacia
   abajo y áreas únicas compartidas con doble borde (Soldadura, Pintura,
   Ensamble, Despacho). Sin escala ni dimensiones.

   Retícula: 3 columnas × 12 filas.
   ===================================================================== */
window.ESM = window.ESM || {};
ESM.plants = ESM.plants || {};

(function () {
  const X0 = 30, COLW = 220, W = 200;          // columnas (líneas)
  const Y0 = 30, ROWH = 66, H = 52;            // filas (procesos)
  const x = c => X0 + c * COLW;
  const y = r => Y0 + r * ROWH;

  /* Caja de proceso: texto horizontal centrado, sin ojo ni símbolos */
  function box(id, label, col, row, opts) {
    const o = Object.assign({ spanCols: 1, double: false }, opts || {});
    const bx = x(col), by = y(row);
    const bw = o.spanCols > 1 ? (x(col + o.spanCols - 1) + W - bx) : W;
    return {
      id, kind: 'area', label, small: true, noEyebrow: true, double: o.double,
      source: 'Diagrama de procesos ESM3',
      x: bx, y: by, w: bw, h: H,
      labels: [{ x: bx + bw / 2, y: by + H / 2 }]
    };
  }

  ESM.plants.esm3 = {
    id: 'esm3',
    name: 'ES Metals 3',
    short: 'ESM 3',
    subtitle: 'Propuesta 2 · planta macro integrada',
    hideCounts: true,
    status: 'ready',
    note: 'Diagrama de procesos de la planta integrada. Sin escala.',
    canvas: { w: 700, h: 848 },
    perimeter: { x: 0, y: 0, w: 700, h: 848 },
    annotations: [],

    areas: [
      /* fila 0: almacenes */
      box('e3-almacen-perfiles', 'Almacén / perfiles', 0, 0),
      box('e3-almacen-lamina', 'Almacén / lámina', 1, 0),
      box('e3-almacen-hpl', 'Almacén / lámina HPL', 2, 0),

      /* fila 1 */
      box('e3-cortadora-perfiles', 'Cortadora de / perfiles', 0, 1),
      box('e3-punzonado', 'Punzonado', 1, 1),
      box('e3-sierra-vertical', 'Sierra vertical', 2, 1),

      /* fila 2 */
      box('e3-cnc-perfiles', 'Mecanizado CNC / perfiles', 0, 2),
      box('e3-laser-lamina', 'Láser lámina', 1, 2),

      /* fila 3 */
      box('e3-enderezadora', 'Enderezadora', 1, 3),

      /* fila 4 */
      box('e3-cnc-lamina', 'Mecanizado CNC / lámina', 1, 4),
      box('e3-cnc-lamina-hpl', 'Mecanizado CNC / lámina', 2, 4),

      /* fila 5 */
      box('e3-dobladora', 'Dobladora', 1, 5),
      box('e3-planks', 'Mecanizado / planks', 2, 5),

      /* áreas compartidas (doble borde) */
      box('e3-soldadura', 'Soldadura', 0, 6, { spanCols: 2, double: true }),
      box('e3-pintura-liquida', 'Pintura líquida', 0, 7, { spanCols: 2, double: true }),
      box('e3-pintura-polvo', 'Pintura en polvo', 0, 8, { spanCols: 2, double: true }),
      box('e3-sublimado-perfiles', 'Sublimado / perfiles', 0, 9),
      box('e3-sublimado-lamina', 'Sublimado / lámina', 1, 9),
      box('e3-ensamble', 'Ensamble', 0, 10, { spanCols: 2, double: true }),
      box('e3-logistica', 'Logística', 0, 11, { spanCols: 2, double: true }),

      /* línea HPL: ensamble y logística propios */
      box('e3-ensamble-hpl', 'Ensamble', 2, 10, { double: true }),
      box('e3-logistica-hpl', 'Logística', 2, 11, { double: true })
    ]
  };

  /* =====================================================================
     Propuesta 1 — dos plantas independientes (misma retícula de filas)
     Planta 1: línea de lámina · Planta 2: línea de perfiles ·
     Planta 3: línea de lámina HPL. Los procesos compartidos se repiten en
     la planta donde tienen más sentido (Soldadura solo en Planta 1).
     ===================================================================== */
  const PW = X0 + W + X0;   // ancho de cada planta: una sola columna
  function smallPlant(id, name, boxes) {
    return {
      id, name: name || 'Planta adicional', short: name, status: 'ready', hideCounts: true,
      subtitle: 'Propuesta 1 · dos plantas',
      note: 'Distribución conceptual. Sin escala.',
      canvas: { w: PW, h: 848 }, perimeter: { x: 0, y: 0, w: PW, h: 848 },
      annotations: [], areas: boxes
    };
  }

  ESM.plants.esm3a = smallPlant('esm3a', 'ESM 1', [
    box('e3-almacen-lamina', 'Almacén / lámina', 0, 0),
    box('e3-punzonado', 'Punzonado', 0, 1),
    box('e3-laser-lamina', 'Láser lámina', 0, 2),
    box('e3-enderezadora', 'Enderezadora', 0, 3),
    box('e3-cnc-lamina', 'Mecanizado CNC / lámina', 0, 4),
    box('e3-dobladora', 'Dobladora', 0, 5),
    box('e3-soldadura', 'Soldadura', 0, 6, { double: true }),
    box('e3-pintura-liquida', 'Pintura líquida', 0, 7, { double: true }),
    box('e3-pintura-polvo', 'Pintura en polvo', 0, 8, { double: true }),
    box('e3-sublimado-lamina', 'Sublimado / lámina', 0, 9),
    box('e3-ensamble', 'Ensamble', 0, 10, { double: true }),
    box('e3-logistica', 'Logística', 0, 11, { double: true })
  ]);

  ESM.plants.esm3b = smallPlant('esm3b', 'Planta 2', [
    box('e3-almacen-perfiles', 'Almacén / perfiles', 0, 0),
    box('e3-cortadora-perfiles', 'Cortadora de / perfiles', 0, 1),
    box('e3-cnc-perfiles', 'Mecanizado CNC / perfiles', 0, 2),
    box('e3-pintura-liquida', 'Pintura líquida', 0, 7, { double: true }),
    box('e3-pintura-polvo', 'Pintura en polvo', 0, 8, { double: true }),
    box('e3-sublimado-perfiles', 'Sublimado / perfiles', 0, 9),
    box('e3-ensamble', 'Ensamble', 0, 10, { double: true }),
    box('e3-logistica', 'Logística', 0, 11, { double: true })
  ]);

  ESM.plants.esm3c = smallPlant('esm3c', '', [
    box('e3-almacen-hpl', 'Almacén / lámina HPL', 0, 0),
    box('e3-sierra-vertical', 'Sierra vertical', 0, 1),
    box('e3-cnc-lamina-hpl', 'Mecanizado CNC / lámina', 0, 4),
    box('e3-planks', 'Mecanizado / planks', 0, 5),
    box('e3-ensamble-hpl', 'Ensamble', 0, 10, { double: true }),
    box('e3-logistica-hpl', 'Logística', 0, 11, { double: true })
  ]);
})();
