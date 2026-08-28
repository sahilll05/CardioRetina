-- CardioRetina AI — PostgreSQL Row-Level Security (RLS) Policies
-- Migration: 001_rls_multi_tenant_policies.sql
-- Governs tenant data isolation on patients, visits, analyses, and audit_log tables.

-- Enable RLS on all tenant-sensitive tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 1. Patients Table Policies
CREATE POLICY tenant_patients_isolation ON patients
    FOR ALL
    USING (org_id = current_setting('app.current_org_id', true)::INTEGER)
    WITH CHECK (org_id = current_setting('app.current_org_id', true)::INTEGER);

-- 2. Visits Table Policies
CREATE POLICY tenant_visits_isolation ON visits
    FOR ALL
    USING (org_id = current_setting('app.current_org_id', true)::INTEGER)
    WITH CHECK (org_id = current_setting('app.current_org_id', true)::INTEGER);

-- 3. Analyses Table Policies
CREATE POLICY tenant_analyses_isolation ON analyses
    FOR ALL
    USING (org_id = current_setting('app.current_org_id', true)::INTEGER)
    WITH CHECK (org_id = current_setting('app.current_org_id', true)::INTEGER);

-- 4. Audit Log Table Policies (Append-only & read-restricted by org_id)
CREATE POLICY tenant_audit_log_select ON audit_log
    FOR SELECT
    USING (
        org_id = current_setting('app.current_org_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'SUPER_ADMIN'
    );

CREATE POLICY tenant_audit_log_insert ON audit_log
    FOR INSERT
    WITH CHECK (org_id = current_setting('app.current_org_id', true)::INTEGER);

-- Prevent UPDATE and DELETE operations on audit_log to guarantee append-only integrity
CREATE POLICY tenant_audit_log_no_update ON audit_log
    FOR UPDATE
    USING (false);

CREATE POLICY tenant_audit_log_no_delete ON audit_log
    FOR DELETE
    USING (false);
