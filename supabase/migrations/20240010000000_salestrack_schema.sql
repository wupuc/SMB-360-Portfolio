-- ============================================================
-- SMB 360 Platform — SalesTrack Schema
-- Migration: 20240010000000_salestrack_schema
-- Phase 3 / PRP-012
-- ============================================================

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'lead',
  industry TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'PL',
  assigned_to UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  lead_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client contacts (multiple per client)
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline stages (admin-configured per company)
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  system_flag TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  probability_default INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE
);

-- Products (admin-managed)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  category TEXT,
  sku TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  stage_id UUID REFERENCES pipeline_stages(id),
  owner_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  estimated_value DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  actual_close_date DATE,
  close_reason TEXT,
  last_activity_at TIMESTAMPTZ,
  inactivity_flag TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity products
CREATE TABLE opportunity_products (
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(14,2),
  discount_percent DECIMAL(5,2) DEFAULT 0,
  PRIMARY KEY (opportunity_id, product_id)
);

-- Close reasons (admin-configured)
CREATE TABLE close_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Campaigns (defined before interactions due to FK dependency)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  owner_id UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(14,2),
  currency_id UUID REFERENCES currencies(id),
  goal TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactions / Tasks
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  opportunity_id UUID REFERENCES opportunities(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  email_to TEXT,
  email_subject TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact segments
CREATE TABLE contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at triggers
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER interactions_updated_at
  BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_clients" ON clients
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_client_contacts" ON client_contacts
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "company_isolation_pipeline_stages" ON pipeline_stages
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_products" ON products
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_opportunities" ON opportunities
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_opportunity_products" ON opportunity_products
  FOR ALL USING (
    opportunity_id IN (SELECT id FROM opportunities WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "company_isolation_close_reasons" ON close_reasons
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_campaigns" ON campaigns
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_interactions" ON interactions
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_contact_segments" ON contact_segments
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "company_isolation_email_templates" ON email_templates
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
