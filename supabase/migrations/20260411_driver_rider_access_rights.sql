-- Tailored access rights for Driver and Rider roles
-- Adds granular delivery permissions and assigns role defaults

INSERT INTO permissions (name, description, category)
VALUES
  ('Queue Deliveries', 'Access and manage queued or unassigned deliveries', 'Delivery'),
  ('Manage Mileage Logs', 'Capture and update trip mileage records for deliveries', 'Delivery'),
  ('Manage Refueling', 'Log and manage fuel/refueling records for delivery operations', 'Delivery')
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  category = EXCLUDED.category;

DO $$
DECLARE
  rider_role_id UUID;
  driver_role_id UUID;
BEGIN
  SELECT id INTO rider_role_id FROM roles WHERE name = 'Rider' LIMIT 1;
  SELECT id INTO driver_role_id FROM roles WHERE name = 'Driver' LIMIT 1;

  IF rider_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT rider_role_id, p.id
    FROM permissions p
    WHERE p.name IN ('View Deliveries', 'Queue Deliveries', 'Manage Deliveries')
    ON CONFLICT DO NOTHING;
  END IF;

  IF driver_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT driver_role_id, p.id
    FROM permissions p
    WHERE p.name IN (
      'View Deliveries',
      'Queue Deliveries',
      'Manage Deliveries',
      'Manage Mileage Logs',
      'Manage Refueling'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
