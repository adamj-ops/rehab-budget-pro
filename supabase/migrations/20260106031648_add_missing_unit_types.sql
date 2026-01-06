-- Add missing unit types to the enum
-- Note: IF NOT EXISTS requires Postgres 9.1+, these will be added one by one
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'load' AND enumtypid = 'unit_type'::regtype) THEN
    ALTER TYPE unit_type ADD VALUE 'load';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ton' AND enumtypid = 'unit_type'::regtype) THEN
    ALTER TYPE unit_type ADD VALUE 'ton';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'set' AND enumtypid = 'unit_type'::regtype) THEN
    ALTER TYPE unit_type ADD VALUE 'set';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'opening' AND enumtypid = 'unit_type'::regtype) THEN
    ALTER TYPE unit_type ADD VALUE 'opening';
  END IF;
END$$;
