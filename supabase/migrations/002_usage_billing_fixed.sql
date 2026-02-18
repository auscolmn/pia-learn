-- LearnStudio Usage-Based Billing Schema
-- Migration: 002_usage_billing.sql

-- ============================================
-- CUSTOM TYPES
-- ============================================

CREATE TYPE usage_event_type AS ENUM (
    'student.login',
    'student.active',
    'video.upload',
    'video.stream',
    'video.delete',
    'certificate.issued',
    'course.created',
    'course.published',
    'lesson.created',
    'quiz.completed',
    'storage.upload',
    'storage.delete'
);

CREATE TYPE invoice_status AS ENUM (
    'draft',
    'open',
    'paid',
    'void',
    'uncollectible'
);

CREATE TYPE feature_key AS ENUM (
    'custom_domain',
    'white_label',
    'api_access',
    'priority_support',
    'advanced_analytics',
    'bulk_enrollment',
    'sso',
    'webhooks'
);

-- ============================================
-- USAGE TRACKING TABLES
-- ============================================

-- Append-only usage event log
CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type usage_event_type NOT NULL,
    quantity DECIMAL(20, 6) NOT NULL DEFAULT 1,
    unit TEXT, -- 'bytes', 'seconds', 'count'
    resource_id UUID, -- course_id, lesson_id, certificate_id, etc.
    resource_type TEXT, -- 'course', 'lesson', 'video', 'certificate'
    user_id UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly usage aggregates (calculated daily, finalized at month end)
CREATE TABLE usage_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL, -- First day of month
    period_end DATE NOT NULL, -- Last day of month
    
    -- Metered usage
    active_students INTEGER DEFAULT 0,
    video_storage_bytes BIGINT DEFAULT 0,
    video_bandwidth_bytes BIGINT DEFAULT 0,
    certificates_issued INTEGER DEFAULT 0,
    courses_created INTEGER DEFAULT 0,
    lessons_created INTEGER DEFAULT 0,
    
    -- Calculated amounts (in cents)
    student_amount INTEGER DEFAULT 0,
    storage_amount INTEGER DEFAULT 0,
    bandwidth_amount INTEGER DEFAULT 0,
    certificate_amount INTEGER DEFAULT 0,
    feature_amount INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    
    -- Status
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, period_start)
);

-- ============================================
-- BILLING TABLES
-- ============================================

-- Pricing configuration (admin-managed)
CREATE TABLE pricing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'default', 'early_adopter', 'enterprise'
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Per-unit pricing (in cents)
    price_per_active_student INTEGER DEFAULT 200, -- $2.00
    price_per_gb_storage INTEGER DEFAULT 10, -- $0.10
    price_per_gb_bandwidth INTEGER DEFAULT 5, -- $0.05
    price_per_certificate INTEGER DEFAULT 50, -- $0.50
    
    -- Feature add-ons (monthly, in cents)
    price_custom_domain INTEGER DEFAULT 1000, -- $10.00
    price_white_label INTEGER DEFAULT 5000, -- $50.00
    price_api_access INTEGER DEFAULT 2500, -- $25.00
    price_priority_support INTEGER DEFAULT 10000, -- $100.00
    price_advanced_analytics INTEGER DEFAULT 2000, -- $20.00
    price_sso INTEGER DEFAULT 5000, -- $50.00
    
    -- Limits for free tier
    free_students_limit INTEGER DEFAULT 10,
    free_storage_gb DECIMAL DEFAULT 1,
    free_bandwidth_gb DECIMAL DEFAULT 5,
    
    -- Minimum monthly charge
    minimum_charge INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization feature subscriptions
CREATE TABLE org_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    feature feature_key NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    disabled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, feature)
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Amounts in cents
    subtotal INTEGER NOT NULL DEFAULT 0,
    discount INTEGER DEFAULT 0,
    tax INTEGER DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    amount_paid INTEGER DEFAULT 0,
    amount_due INTEGER DEFAULT 0,
    
    -- Line items breakdown
    line_items JSONB DEFAULT '[]',
    /*
    [
      {"description": "Active Students (25)", "quantity": 25, "unit_price": 200, "amount": 5000},
      {"description": "Video Storage (2.5 GB)", "quantity": 2.5, "unit_price": 10, "amount": 25},
      {"description": "Custom Domain", "quantity": 1, "unit_price": 1000, "amount": 1000}
    ]
    */
    
    status invoice_status DEFAULT 'draft',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods (stored in Stripe, reference only)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'card', 'bank_account', etc.
    is_default BOOLEAN DEFAULT FALSE,
    card_brand TEXT, -- 'visa', 'mastercard', etc.
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active student tracking (daily snapshots for accurate billing)
CREATE TABLE daily_active_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, user_id, active_date)
);

-- ============================================
-- INDEXES
-- ============================================

-- Usage Events
CREATE INDEX idx_usage_events_org_id ON usage_events(org_id);
CREATE INDEX idx_usage_events_org_created ON usage_events(org_id, created_at DESC);
CREATE INDEX idx_usage_events_type ON usage_events(org_id, event_type);
CREATE INDEX idx_usage_events_resource ON usage_events(resource_id) WHERE resource_id IS NOT NULL;

-- Usage Snapshots
CREATE INDEX idx_usage_snapshots_org ON usage_snapshots(org_id);
CREATE INDEX idx_usage_snapshots_period ON usage_snapshots(org_id, period_start);
CREATE INDEX idx_usage_snapshots_finalized ON usage_snapshots(is_finalized) WHERE is_finalized = FALSE;

-- Invoices
CREATE INDEX idx_invoices_org ON invoices(org_id);
CREATE INDEX idx_invoices_status ON invoices(org_id, status);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_invoices_period ON invoices(org_id, period_start);

-- Org Features
CREATE INDEX idx_org_features_org ON org_features(org_id);
CREATE INDEX idx_org_features_enabled ON org_features(org_id, enabled) WHERE enabled = TRUE;

-- Daily Active Students
CREATE INDEX idx_daily_active_students_org_date ON daily_active_students(org_id, active_date);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_usage_snapshots_updated_at
    BEFORE UPDATE ON usage_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_config_updated_at
    BEFORE UPDATE ON pricing_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_features_updated_at
    BEFORE UPDATE ON org_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_active_students ENABLE ROW LEVEL SECURITY;

-- Usage Events (org admins can view)
CREATE POLICY "Org admins can view usage events"
    ON usage_events FOR SELECT
    USING (is_org_admin(org_id));

-- System can insert usage events (via service role)
CREATE POLICY "System can insert usage events"
    ON usage_events FOR INSERT
    WITH CHECK (TRUE); -- Controlled via service role key

-- Usage Snapshots
CREATE POLICY "Org admins can view usage snapshots"
    ON usage_snapshots FOR SELECT
    USING (is_org_admin(org_id));

-- Pricing Config (platform admins only)
CREATE POLICY "Platform admins can manage pricing"
    ON pricing_config FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
    );

CREATE POLICY "Anyone can view active pricing"
    ON pricing_config FOR SELECT
    USING (is_active = TRUE);

-- Org Features
CREATE POLICY "Org admins can view their features"
    ON org_features FOR SELECT
    USING (is_org_admin(org_id));

CREATE POLICY "Platform admins can manage features"
    ON org_features FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
    );

-- Invoices
CREATE POLICY "Org admins can view their invoices"
    ON invoices FOR SELECT
    USING (is_org_admin(org_id));

CREATE POLICY "Platform admins can manage invoices"
    ON invoices FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_platform_admin = TRUE)
    );

-- Payment Methods
CREATE POLICY "Org admins can view payment methods"
    ON payment_methods FOR SELECT
    USING (is_org_admin(org_id));

CREATE POLICY "Org admins can manage payment methods"
    ON payment_methods FOR ALL
    USING (is_org_admin(org_id));

-- Daily Active Students
CREATE POLICY "Org admins can view daily active students"
    ON daily_active_students FOR SELECT
    USING (is_org_admin(org_id));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Track usage event
CREATE OR REPLACE FUNCTION track_usage(
    p_org_id UUID,
    p_event_type usage_event_type,
    p_quantity DECIMAL DEFAULT 1,
    p_unit TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO usage_events (
        org_id, event_type, quantity, unit,
        resource_id, resource_type, user_id, metadata
    ) VALUES (
        p_org_id, p_event_type, p_quantity, p_unit,
        p_resource_id, p_resource_type, p_user_id, p_metadata
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track active student (call on login/activity)
CREATE OR REPLACE FUNCTION track_active_student(p_org_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_active_students (org_id, user_id, active_date)
    VALUES (p_org_id, p_user_id, CURRENT_DATE)
    ON CONFLICT (org_id, user_id, active_date) DO NOTHING;
    
    -- Also log as usage event (for detailed tracking)
    PERFORM track_usage(
        p_org_id, 'student.login', 1, 'count',
        NULL, 'student', p_user_id, '{}'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current month usage for an org
CREATE OR REPLACE FUNCTION get_current_usage(p_org_id UUID)
RETURNS TABLE (
    active_students BIGINT,
    video_storage_bytes BIGINT,
    video_bandwidth_bytes BIGINT,
    certificates_issued BIGINT,
    estimated_amount INTEGER
) AS $$
DECLARE
    month_start DATE;
    pricing RECORD;
BEGIN
    month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    -- Get active pricing
    SELECT * INTO pricing FROM pricing_config WHERE name = 'default' AND is_active = TRUE;
    
    RETURN QUERY
    WITH usage AS (
        SELECT
            (SELECT COUNT(DISTINCT user_id) 
             FROM daily_active_students 
             WHERE org_id = p_org_id AND active_date >= month_start) AS students,
            (SELECT COALESCE(SUM(quantity), 0)
             FROM usage_events
             WHERE org_id = p_org_id 
             AND event_type = 'video.upload'
             AND created_at >= month_start) AS storage,
            (SELECT COALESCE(SUM(quantity), 0)
             FROM usage_events
             WHERE org_id = p_org_id 
             AND event_type = 'video.stream'
             AND created_at >= month_start) AS bandwidth,
            (SELECT COUNT(*)
             FROM usage_events
             WHERE org_id = p_org_id 
             AND event_type = 'certificate.issued'
             AND created_at >= month_start) AS certs
    )
    SELECT 
        usage.students,
        usage.storage::BIGINT,
        usage.bandwidth::BIGINT,
        usage.certs,
        (
            -- Student cost (after free tier)
            GREATEST(0, usage.students - COALESCE(pricing.free_students_limit, 10)) * COALESCE(pricing.price_per_active_student, 200) +
            -- Storage cost (after free tier)
            GREATEST(0, (usage.storage / 1073741824.0) - COALESCE(pricing.free_storage_gb, 1)) * COALESCE(pricing.price_per_gb_storage, 10) +
            -- Bandwidth cost (after free tier)
            GREATEST(0, (usage.bandwidth / 1073741824.0) - COALESCE(pricing.free_bandwidth_gb, 5)) * COALESCE(pricing.price_per_gb_bandwidth, 5) +
            -- Certificate cost
            usage.certs * COALESCE(pricing.price_per_certificate, 50)
        )::INTEGER AS estimated
    FROM usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if org has a feature enabled
CREATE OR REPLACE FUNCTION has_feature(p_org_id UUID, p_feature feature_key)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM org_features
        WHERE org_id = p_org_id
        AND feature = p_feature
        AND enabled = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DEFAULT PRICING
-- ============================================

INSERT INTO pricing_config (name, is_active) VALUES ('default', TRUE)
ON CONFLICT (name) DO NOTHING;
