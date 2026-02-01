-- Insert default employee tax configurations for all existing branches
-- These are the standard Brazilian labor tax rates

-- INSS Patronal: 20% (standard rate)
-- FGTS: 8% (standard rate)
-- INSS sobre 13º: 20% (same as regular INSS)
-- FGTS sobre 13º: 8% (same as regular FGTS)

-- Using fixed UUIDs for consistency (similar to units of measurement migration)
-- Format: 550e8400-e29b-41d4-a716-44665544XXXX where XXXX is unique per config type and branch

DO $$
DECLARE
  branch_record RECORD;
  branch_counter INTEGER := 0;
  inss_uuid TEXT;
  fgts_uuid TEXT;
  inss_13th_uuid TEXT;
  fgts_13th_uuid TEXT;
BEGIN
  FOR branch_record IN SELECT id, "companyId" FROM "branches" LOOP
    branch_counter := branch_counter + 1;
    
    -- Generate UUIDs based on branch counter to ensure uniqueness
    inss_uuid := '550e8400-e29b-41d4-a716-44665544' || LPAD((branch_counter * 4 - 3)::TEXT, 4, '0');
    fgts_uuid := '550e8400-e29b-41d4-a716-44665544' || LPAD((branch_counter * 4 - 2)::TEXT, 4, '0');
    inss_13th_uuid := '550e8400-e29b-41d4-a716-44665544' || LPAD((branch_counter * 4 - 1)::TEXT, 4, '0');
    fgts_13th_uuid := '550e8400-e29b-41d4-a716-44665544' || LPAD((branch_counter * 4)::TEXT, 4, '0');
    
    -- Insert INSS Patronal
    INSERT INTO "employee_tax_configs" ("id", "type", "name", "rate", "description", "active", "companyId", "branchId", "createdAt", "updatedAt")
    SELECT 
      inss_uuid,
      'INSS'::"EmployeeTaxType",
      'INSS Patronal',
      20.00,
      'INSS sobre folha de pagamento - alíquota patronal',
      true,
      branch_record."companyId",
      branch_record.id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM "employee_tax_configs" etc 
      WHERE etc."companyId" = branch_record."companyId" 
        AND etc."branchId" = branch_record.id 
        AND etc.type = 'INSS'
        AND etc."deletedAt" IS NULL
    );
    
    -- Insert FGTS
    INSERT INTO "employee_tax_configs" ("id", "type", "name", "rate", "description", "active", "companyId", "branchId", "createdAt", "updatedAt")
    SELECT 
      fgts_uuid,
      'FGTS'::"EmployeeTaxType",
      'FGTS',
      8.00,
      'Fundo de Garantia do Tempo de Serviço',
      true,
      branch_record."companyId",
      branch_record.id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM "employee_tax_configs" etc 
      WHERE etc."companyId" = branch_record."companyId" 
        AND etc."branchId" = branch_record.id 
        AND etc.type = 'FGTS'
        AND etc."deletedAt" IS NULL
    );
    
    -- Insert INSS sobre 13º
    INSERT INTO "employee_tax_configs" ("id", "type", "name", "rate", "description", "active", "companyId", "branchId", "createdAt", "updatedAt")
    SELECT 
      inss_13th_uuid,
      'INSS_13TH'::"EmployeeTaxType",
      'INSS sobre 13º Salário',
      20.00,
      'INSS sobre 13º salário - alíquota patronal',
      true,
      branch_record."companyId",
      branch_record.id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM "employee_tax_configs" etc 
      WHERE etc."companyId" = branch_record."companyId" 
        AND etc."branchId" = branch_record.id 
        AND etc.type = 'INSS_13TH'
        AND etc."deletedAt" IS NULL
    );
    
    -- Insert FGTS sobre 13º
    INSERT INTO "employee_tax_configs" ("id", "type", "name", "rate", "description", "active", "companyId", "branchId", "createdAt", "updatedAt")
    SELECT 
      fgts_13th_uuid,
      'FGTS_13TH'::"EmployeeTaxType",
      'FGTS sobre 13º Salário',
      8.00,
      'Fundo de Garantia do Tempo de Serviço sobre 13º salário',
      true,
      branch_record."companyId",
      branch_record.id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM "employee_tax_configs" etc 
      WHERE etc."companyId" = branch_record."companyId" 
        AND etc."branchId" = branch_record.id 
        AND etc.type = 'FGTS_13TH'
        AND etc."deletedAt" IS NULL
    );
  END LOOP;
END $$;
