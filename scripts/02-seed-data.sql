-- Insert sample warehouses
INSERT INTO warehouses (name, description) VALUES
  ('Almacén 1', 'Almacén principal de distribución'),
  ('Almacén 2', 'Almacén secundario de respaldo'),
  ('Almacén 3', 'Almacén de productos terminados')
ON CONFLICT (name) DO NOTHING;

-- Insert sample materials
INSERT INTO materials (name, description, unit_of_measure, location) VALUES
  ('Tuercas M6', 'Tuercas hexagonales de acero inoxidable M6', 'Caja', 'Estante A1'),
  ('Pernos 1/4', 'Pernos de acero galvanizado 1/4 x 2 pulgadas', 'Caja', 'Estante A2'),
  ('Arandelas Planas', 'Arandelas de acero galvanizado 1/4', 'Paquete', 'Estante B1'),
  ('Cable Eléctrico AWG12', 'Cable eléctrico 12 AWG cobre', 'Metro', 'Carrete 1'),
  ('Remaches Pop', 'Remaches pop aluminio 1/8x1/4', 'Caja', 'Estante C2'),
  ('Cinta Teflón', 'Cinta teflón para roscas 1/2x12 metros', 'Rollo', 'Estante D1'),
  ('Tornillos 3/8', 'Tornillos de acero inoxidable 3/8 x 1 pulgada', 'Caja', 'Estante A3'),
  ('Lubricante Industrial', 'Lubricante premium para máquinas industriales', 'Litro', 'Bodega 1')
ON CONFLICT DO NOTHING;

-- Insert sample inventory using the actual inserted IDs
INSERT INTO inventory (warehouse_id, material_id, quantity)
SELECT w.id, m.id, q FROM (
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 1') as wid,
         (SELECT id FROM materials WHERE name = 'Tuercas M6') as mid,
         150 as q
  UNION ALL
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 1'),
         (SELECT id FROM materials WHERE name = 'Pernos 1/4'),
         200
  UNION ALL
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 1'),
         (SELECT id FROM materials WHERE name = 'Arandelas Planas'),
         300
  UNION ALL
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 1'),
         (SELECT id FROM materials WHERE name = 'Cable Eléctrico AWG12'),
         500
  UNION ALL
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 2'),
         (SELECT id FROM materials WHERE name = 'Tuercas M6'),
         75
  UNION ALL
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 2'),
         (SELECT id FROM materials WHERE name = 'Remaches Pop'),
         120
  UNION ALL
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 2'),
         (SELECT id FROM materials WHERE name = 'Cinta Teflón'),
         45
  UNION ALL
  SELECT (SELECT id FROM warehouses WHERE name = 'Almacén 2'),
         (SELECT id FROM materials WHERE name = 'Tornillos 3/8'),
         180
) as data(wid, mid, q)
JOIN warehouses w ON w.id = data.wid
JOIN materials m ON m.id = data.mid
ON CONFLICT (warehouse_id, material_id) DO NOTHING;
