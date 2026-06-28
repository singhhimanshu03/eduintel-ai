-- ─────────────────────────────────────────────────────────────────────────────
-- EduIntel AI — Analytics DB Schema
-- Database: analytics_db
-- Purpose : Stores AI prediction audit logs and report export metadata.
--           Dashboard data itself is aggregated via REST from other services
--           and cached in Redis; it does NOT live here.
-- ─────────────────────────────────────────────────────────────────────────────

\c analytics_db;

-- ── AI Prediction Audit Log ───────────────────────────────────────────────────
-- Every prediction call is logged here for auditability, model monitoring,
-- and drift detection over time.
CREATE TABLE IF NOT EXISTS ai_prediction_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       TEXT        NOT NULL,
    model_name       TEXT        NOT NULL,  -- 'eligibility_risk' | 'performance_gpa' | 'dropout_risk' | 'attendance_forecast'
    model_version    TEXT,
    input_features   JSONB       NOT NULL,
    prediction       JSONB       NOT NULL,  -- full prediction result
    risk_score       TEXT,                  -- 'Low' | 'Medium' | 'High' | NULL for regression
    confidence       NUMERIC(5,4),
    requested_by     TEXT,                  -- userId of caller (API Gateway injects this)
    institution_id   TEXT,
    elapsed_ms       INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apl_student   ON ai_prediction_logs (student_id);
CREATE INDEX IF NOT EXISTS idx_apl_model     ON ai_prediction_logs (model_name);
CREATE INDEX IF NOT EXISTS idx_apl_created   ON ai_prediction_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apl_risk      ON ai_prediction_logs (risk_score) WHERE risk_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_apl_inst      ON ai_prediction_logs (institution_id);

-- ── Report Export Log ─────────────────────────────────────────────────────────
-- Tracks every report export (Excel / PDF) for auditing purposes.
CREATE TABLE IF NOT EXISTS report_exports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type      TEXT        NOT NULL,  -- 'attendance' | 'fees' | 'academic' | 'eligibility' | 'ai-predictions'
    format           TEXT        NOT NULL,  -- 'excel' | 'pdf'
    exported_by      TEXT,                  -- userId
    institution_id   TEXT,
    row_count        INTEGER,
    file_size_bytes  INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_re_type    ON report_exports (report_type);
CREATE INDEX IF NOT EXISTS idx_re_user    ON report_exports (exported_by);
CREATE INDEX IF NOT EXISTS idx_re_created ON report_exports (created_at DESC);

-- ── Dashboard Cache Metadata ───────────────────────────────────────────────────
-- Optional: lightweight record of when caches were last populated.
-- The actual cache lives in Redis; this table is for ops monitoring only.
CREATE TABLE IF NOT EXISTS dashboard_cache_meta (
    cache_key        TEXT        PRIMARY KEY,
    last_populated   TIMESTAMPTZ NOT NULL DEFAULT now(),
    hit_count        BIGINT      NOT NULL DEFAULT 0,
    last_hit         TIMESTAMPTZ
);
