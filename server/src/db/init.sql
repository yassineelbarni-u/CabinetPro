-- ============================================
-- CabinetPro — Schéma de Base de Données
-- PostgreSQL 16
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table : cabinets
-- ============================================
CREATE TABLE cabinets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('dentiste', 'ophtalmologue', 'generaliste', 'clinique')),
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'clinique', 'sur_mesure')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : users (médecins, secrétaires, admins)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_ar VARCHAR(100),
    last_name_ar VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'medecin', 'secretaire')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : patients
-- ============================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_ar VARCHAR(100),
    last_name_ar VARCHAR(100),
    birth_date DATE,
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    city VARCHAR(100),
    quarter VARCHAR(100),
    patient_type VARCHAR(50) DEFAULT 'particulier' CHECK (patient_type IN ('particulier', 'cnss', 'cnops', 'mutuelle')),
    insurance_number VARCHAR(100),
    allergies TEXT,
    medical_history TEXT,
    photo_url VARCHAR(500),
    first_visit DATE DEFAULT CURRENT_DATE,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : appointments (rendez-vous)
-- ============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    care_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'present', 'absent', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : sessions (séances/consultations)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    care_type VARCHAR(100),
    clinical_notes TEXT,
    prescription TEXT,
    total_price DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    next_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : tooth_records (odontogramme)
-- ============================================
CREATE TABLE tooth_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    tooth_number INTEGER NOT NULL CHECK (tooth_number BETWEEN 11 AND 48),
    treatment_type VARCHAR(50) NOT NULL CHECK (treatment_type IN (
        'carie', 'couronne', 'extraction', 'devitalisation', 
        'detartrage', 'implant', 'facette', 'blanchiment', 
        'orthodontie', 'pont', 'sain'
    )),
    notes TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : payments (paiements)
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'especes' CHECK (payment_method IN ('especes', 'virement', 'cheque', 'assurance')),
    payer_type VARCHAR(30) DEFAULT 'patient' CHECK (payer_type IN ('patient', 'cnss', 'cnops', 'mutuelle')),
    notes TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : expenses (charges/dépenses)
-- ============================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'loyer', 'salaires', 'fournitures_medicales', 'materiel',
        'electricite_eau', 'maintenance', 'loyer_materiel', 'autres'
    )),
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    frequency VARCHAR(20) DEFAULT 'ponctuelle' CHECK (frequency IN ('mensuelle', 'ponctuelle', 'variable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : audit_log (journal d'activité)
-- ============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table : care_types (types de soins paramétrables)
-- ============================================
CREATE TABLE care_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    default_price DECIMAL(10, 2) DEFAULT 0,
    default_duration INTEGER DEFAULT 30,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Index pour performance
-- ============================================
CREATE INDEX idx_patients_cabinet ON patients(cabinet_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_phone ON patients(phone_primary);
CREATE INDEX idx_patients_type ON patients(patient_type);
CREATE INDEX idx_appointments_cabinet ON appointments(cabinet_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_sessions_cabinet ON sessions(cabinet_id);
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_payments_cabinet ON payments(cabinet_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_session ON payments(session_id);
CREATE INDEX idx_expenses_cabinet ON expenses(cabinet_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_tooth_records_patient ON tooth_records(patient_id);
CREATE INDEX idx_tooth_records_tooth ON tooth_records(tooth_number);
CREATE INDEX idx_audit_log_cabinet ON audit_log(cabinet_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_users_cabinet ON users(cabinet_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- Données initiales : Cabinet par défaut + Admin
-- Le mot de passe est : admin123 (hashé avec bcrypt)
-- ============================================
INSERT INTO cabinets (id, name, type, city, phone, plan) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Cabinet Dentaire Demo', 'dentiste', 'Casablanca', '0522000000', 'pro');

-- Le mot de passe 'admin123' sera hashé au premier lancement par le seed script
