/**
 * ============================================
 * CabinetPro — Associations (Relations)
 * Équivalent de @OneToMany, @ManyToOne, @BelongsTo en JPA/Hibernate
 * ============================================
 */
const Cabinet = require('./Cabinet');
const User = require('./User');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const Session = require('./Session');
const ToothRecord = require('./ToothRecord');
const Payment = require('./Payment');
const Expense = require('./Expense');

// ============================================
// Cabinet <-> Users (1:N)
// ============================================
Cabinet.hasMany(User, { foreignKey: 'cabinet_id', as: 'users' });
User.belongsTo(Cabinet, { foreignKey: 'cabinet_id', as: 'cabinet' });

// ============================================
// Cabinet <-> Patients (1:N)
// ============================================
Cabinet.hasMany(Patient, { foreignKey: 'cabinet_id', as: 'patients' });
Patient.belongsTo(Cabinet, { foreignKey: 'cabinet_id', as: 'cabinet' });

// ============================================
// Cabinet <-> Appointments (1:N)
// ============================================
Cabinet.hasMany(Appointment, { foreignKey: 'cabinet_id', as: 'appointments' });
Appointment.belongsTo(Cabinet, { foreignKey: 'cabinet_id' });

// ============================================
// Cabinet <-> Sessions (1:N)
// ============================================
Cabinet.hasMany(Session, { foreignKey: 'cabinet_id', as: 'sessions' });
Session.belongsTo(Cabinet, { foreignKey: 'cabinet_id' });

// ============================================
// Cabinet <-> Expenses (1:N)
// ============================================
Cabinet.hasMany(Expense, { foreignKey: 'cabinet_id', as: 'expenses' });
Expense.belongsTo(Cabinet, { foreignKey: 'cabinet_id', as: 'cabinet' });

// ============================================
// Patient <-> Appointments (1:N)
// ============================================
Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// ============================================
// Patient <-> Sessions (1:N)
// ============================================
Patient.hasMany(Session, { foreignKey: 'patient_id', as: 'sessions' });
Session.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// ============================================
// Patient <-> ToothRecords (1:N)
// ============================================
Patient.hasMany(ToothRecord, { foreignKey: 'patient_id', as: 'tooth_records' });
ToothRecord.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// ============================================
// Patient <-> Payments (1:N)
// ============================================
Patient.hasMany(Payment, { foreignKey: 'patient_id', as: 'payments' });
Payment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// ============================================
// User (Doctor) <-> Appointments (1:N)
// ============================================
User.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
Appointment.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// ============================================
// User (Doctor) <-> Sessions (1:N)
// ============================================
User.hasMany(Session, { foreignKey: 'doctor_id', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// ============================================
// Session <-> Payments (1:N)
// ============================================
Session.hasMany(Payment, { foreignKey: 'session_id', as: 'payments' });
Payment.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// ============================================
// Session <-> ToothRecords (1:N)
// ============================================
Session.hasMany(ToothRecord, { foreignKey: 'session_id', as: 'tooth_records' });
ToothRecord.belongsTo(Session, { foreignKey: 'session_id', as: 'session' });

// ============================================
// ToothRecord <-> Cabinet (N:1)
// ============================================
ToothRecord.belongsTo(Cabinet, { foreignKey: 'cabinet_id' });
Cabinet.hasMany(ToothRecord, { foreignKey: 'cabinet_id' });

// ============================================
// Payment <-> Cabinet (N:1)
// ============================================
Payment.belongsTo(Cabinet, { foreignKey: 'cabinet_id' });

// ============================================
// Expense <-> User (N:1 — created_by)
// ============================================
Expense.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
    Cabinet,
    User,
    Patient,
    Appointment,
    Session,
    ToothRecord,
    Payment,
    Expense,
};
