-- ============================================
-- Kids Code Program - صفحة تقديم + لوحة أدمن
-- كل الجداول مبدوءة بـ program_ عشان لو اتحطت في نفس قاعدة بيانات مشروع تاني
-- (زي Code Academy) متتلخبطش مع جداوله.
-- ============================================

CREATE TABLE IF NOT EXISTS program_admins (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_applications (
  id                  SERIAL PRIMARY KEY,
  full_name           TEXT NOT NULL,
  age                 SMALLINT NOT NULL CHECK (age BETWEEN 8 AND 16),
  governorate         TEXT NOT NULL,
  student_phone       TEXT NOT NULL,
  guardian_phone      TEXT NOT NULL,
  whatsapp_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
  terms_acknowledged  BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'rejected')),
  admin_notes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_program_applications_created ON program_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_applications_status ON program_applications(status);

INSERT INTO program_settings (key, value) VALUES
  ('program_name', 'برنامج البرمجة للأطفال'),
  ('program_tagline', 'برنامج أونلاين بالكامل لتعليم البرمجة والتفكير الحاسوبي للأطفال من 8 إلى 16 سنة')
ON CONFLICT (key) DO NOTHING;
