# CabinetPro — Contexte Complet du Projet

> Fichier de contexte pour assistants IA (Claude, Antigravity, etc.)
> Lire ce fichier en entier avant d'implémenter toute fonctionnalité.

---

## 1. Description Générale

**CabinetPro** est une application web de gestion de cabinet médical (orientée dentisterie, mais extensible à d'autres spécialités).
Elle est développée pour le marché **marocain** et supporte le **français** et l'**arabe** (RTL).

**Statut** : En développement actif.

---

## 2. Stack Technique

### Backend
| Élément | Technologie |
|---|---|
| Runtime | Node.js 22 (LTS) |
| Framework | Express.js 4 |
| ORM | Sequelize 6 |
| Base de données | PostgreSQL 16 (via Docker/Podman) |
| Auth | JWT (jsonwebtoken) — token Bearer |
| Hashage | bcrypt |
| Validation | express-validator |
| Sécurité | helmet, cors |
| Logging | morgan |
| Dev | nodemon |

### Frontend
| Élément | Technologie |
|---|---|
| Framework | React 19 |
| Build | Vite 8 |
| Routeur | React Router DOM 7 |
| Styles | Tailwind CSS 4 |
| HTTP client | Axios (instance configurée dans `client/src/api/axios.js`) |
| Graphiques | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Icônes | lucide-react |
| Dates | date-fns |

### Infrastructure (Développement)
| Service | Port | Outil |
|---|---|---|
| PostgreSQL 16 | `localhost:5433` | Docker / Podman |
| pgAdmin 4 | `localhost:5050` | Docker / Podman |
| API Backend | `localhost:4000` | nodemon (local) |
| Frontend | `localhost:5173` | Vite (local) |

---

## 3. Structure des Dossiers

```
CabinetPro/
├── docker-compose.yml          # Lance PostgreSQL + pgAdmin (Podman/Docker)
├── CLAUDE.md                   # Ce fichier
├── .gitignore
│
├── server/                     # API Backend Node.js / Express
│   ├── package.json
│   └── src/
│       ├── index.js            # Point d'entrée — Express app, routes, démarrage
│       ├── config/
│       │   ├── db.js           # Connexion Sequelize (PostgreSQL)
│       │   └── jwt.js          # Génération et vérification du token JWT
│       ├── middleware/
│       │   ├── auth.js         # Vérifie le Bearer token JWT (protège les routes)
│       │   ├── rbac.js         # Contrôle d'accès par rôle : rbac('admin', 'medecin')
│       │   └── errorHandler.js # Gestionnaire d'erreurs global Express
│       ├── models/
│       │   ├── index.js        # Définit toutes les associations Sequelize
│       │   ├── Cabinet.js
│       │   ├── User.js
│       │   ├── Patient.js
│       │   ├── Appointment.js
│       │   ├── Session.js
│       │   ├── ToothRecord.js  # Odontogramme (notation FDI dent 11-48)
│       │   ├── Payment.js
│       │   └── Expense.js
│       ├── controllers/        # Logique métier
│       ├── routes/             # Définition des routes Express
│       └── db/
│           ├── init.sql        # Script SQL d'initialisation (tables + UUID)
│           └── seed.js         # Crée le cabinet demo + admin par défaut
│
└── client/                     # Frontend React / Vite
    ├── package.json
    ├── vite.config.js           # Proxy /api → localhost:4000
    └── src/
        ├── App.jsx              # Routeur principal + PrivateRoute
        ├── api/
        │   └── axios.js         # Instance Axios — baseURL: /api, intercepteurs JWT
        ├── context/
        │   ├── AuthContext.jsx  # État global : user, token, login(), logout(), hasRole()
        │   └── LanguageContext.jsx # i18n FR/AR — t('key'), toggleLanguage(), RTL support
        ├── components/
        │   ├── layout/          # MainLayout, Sidebar, Header
        │   └── patients/
        │       └── Odontogram.jsx  # Schéma dentaire interactif
        ├── pages/               # LoginPage, DashboardPage, PatientsPage, etc.
        └── utils/
            ├── formatters.js       # Formatage dates, montants MAD, etc.
            └── invoiceGenerator.js # Génération PDF via jsPDF
```

---

## 4. Modèles de Données & Relations

### Schéma des relations
```
Cabinet (1) ──< User (N)           [cabinet_id]
Cabinet (1) ──< Patient (N)        [cabinet_id]
Cabinet (1) ──< Appointment (N)    [cabinet_id]
Cabinet (1) ──< Session (N)        [cabinet_id]
Cabinet (1) ──< Expense (N)        [cabinet_id]

Patient (1) ──< Appointment (N)    [patient_id]
Patient (1) ──< Session (N)        [patient_id]
Patient (1) ──< ToothRecord (N)    [patient_id]
Patient (1) ──< Payment (N)        [patient_id]

User (1) ──< Appointment (N)       [doctor_id]
User (1) ──< Session (N)           [doctor_id]
User (1) ──< Expense (N)           [created_by]

Session (1) ──< Payment (N)        [session_id]
Session (1) ──< ToothRecord (N)    [session_id]
```

### Champs clés par modèle

**Cabinet** : id (UUID), name, type (dentiste|ophtalmologue|generaliste|clinique), address, city, phone, email, plan (starter|pro|clinique|sur_mesure), is_active

**User** : id, cabinet_id (FK), email (unique), password_hash, first_name, last_name, first_name_ar, last_name_ar, role (admin|medecin|secretaire), phone, is_active, last_login

**Patient** : id, cabinet_id (FK), first_name, last_name, first_name_ar, last_name_ar, birth_date, phone_primary, phone_secondary, city, quarter, patient_type (particulier|cnss|cnops|mutuelle), insurance_number, allergies, medical_history, photo_url, first_visit, total_sessions
→ Getters virtuels : full_name, full_name_ar, age

**Appointment** : id, cabinet_id, patient_id, doctor_id, appointment_date, duration_minutes (défaut 30), care_type, status (confirmed|pending|present|absent|cancelled), notes

**Session** : id, cabinet_id, patient_id, doctor_id, session_date, care_type, clinical_notes, prescription, total_price (DECIMAL), payment_status (paid|partial|unpaid), next_appointment_id

**ToothRecord** : id, session_id, patient_id, cabinet_id, tooth_number (11-48 notation FDI), treatment_type (carie|couronne|extraction|devitalisation|detartrage|implant|facette|blanchiment|orthodontie|pont|sain), notes, price

**Payment** : id, session_id, patient_id, cabinet_id, amount (DECIMAL), payment_method (especes|virement|cheque|assurance), payer_type (patient|cnss|cnops|mutuelle), notes, payment_date

**Expense** : id, cabinet_id, created_by (FK User), category (loyer|salaires|fournitures_medicales|materiel|electricite_eau|maintenance|loyer_materiel|autres), description, amount, expense_date, frequency (mensuelle|ponctuelle|variable)

---

## 5. API REST — Routes Complètes

**Base URL** : `http://localhost:4000/api`
**Auth** : Header `Authorization: Bearer <token>` requis sauf login/register

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Inscription (public) |
| POST | `/auth/login` | Connexion → { user, token } |
| GET | `/auth/me` | Profil utilisateur connecté |
| GET | `/patients` | Liste patients du cabinet |
| GET | `/patients/stats` | Stats patients |
| GET | `/patients/:id` | Détail patient |
| POST | `/patients` | Créer un patient |
| PUT | `/patients/:id` | Modifier un patient |
| DELETE | `/patients/:id` | Supprimer un patient |
| GET | `/appointments` | Rendez-vous du cabinet |
| GET | `/appointments/queue` | File d'attente du jour |
| POST | `/appointments` | Créer un RDV |
| PUT | `/appointments/:id` | Modifier un RDV |
| PUT | `/appointments/:id/status` | Changer le statut du RDV |
| POST | `/sessions` | Créer une séance/consultation |
| GET | `/sessions/patient/:patient_id` | Historique séances d'un patient |
| GET | `/payments` | Liste paiements |
| GET | `/payments/stats` | Stats paiements |
| POST | `/payments` | Enregistrer un paiement |
| PUT | `/payments/:id` | Modifier un paiement |
| DELETE | `/payments/:id` | Supprimer un paiement |
| GET | `/accounting/summary` | Résumé financier |
| GET | `/accounting/expenses` | Liste dépenses |
| POST | `/accounting/expenses` | Ajouter une dépense |
| DELETE | `/accounting/expenses/:id` | Supprimer une dépense |
| GET | `/cabinet` | Infos du cabinet |
| PUT | `/cabinet` | Modifier les infos du cabinet |
| GET | `/cabinet/backup` | Télécharger un backup |
| GET | `/dashboard` | Stats globales |
| GET | `/health` | Healthcheck API |

---

## 6. Sécurité

### Rôles
- **admin** : Accès total
- **medecin** : Patients, sessions, RDV, paiements
- **secretaire** : RDV, patients — pas de comptabilité avancée

### Middleware
- `auth` : Vérifie JWT, attache `req.user` (id, cabinet_id, email, role, is_active)
- `rbac('admin', 'medecin')` : Vérifie les rôles autorisés

### Multi-tenant CRITIQUE
Toutes les requêtes Sequelize DOIVENT filtrer par `cabinet_id: req.user.cabinet_id`.

---

## 7. Format des Réponses API

```json
// Succès
{ "success": true, "data": {...}, "message": "..." }

// Erreur
{ "success": false, "message": "Erreur...", "errors": [...] }
```

---

## 8. Frontend — Conventions

### Axios
- Toujours `import api from '../api/axios'` — jamais d'Axios direct
- baseURL = `/api` (proxy Vite → localhost:4000)
- JWT ajouté automatiquement via intercepteur
- 401 → logout automatique + redirect `/login`

### AuthContext — useAuth()
```js
const { user, token, loading, login, logout, hasRole } = useAuth();
// user: { id, cabinet_id, role, first_name, last_name, email }
// hasRole('admin', 'medecin') → boolean
```

### LanguageContext — useLanguage()
```js
const { language, toggleLanguage, t } = useLanguage();
// language: 'fr' | 'ar'
// t('dashboard') → 'Tableau de bord' (fr) ou 'لوحة القيادة' (ar)
// RTL appliqué automatiquement en arabe
```

### Routing
```
/login                              → LoginPage (publique)
/                                   → DashboardPage
/patients                           → PatientsPage
/patients/:id                       → PatientDetailPage
/patients/:patient_id/sessions/new  → SessionCreatePage
/appointments                       → AppointmentsPage
/payments                           → PaymentsPage
/accounting                         → AccountingPage
/settings                           → SettingsPage
```

---

## 9. Base de Données & Configuration

### Connexion PostgreSQL
```
Host     : localhost
Port     : 5433  ← ATTENTION : pas 5432 !
Database : cabinetpro
User     : cabinet_admin
Password : cabinet_secure_2026
```

### Variables d'environnement (.env dans server/)
```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=cabinetpro
DB_USER=cabinet_admin
DB_PASSWORD=cabinet_secure_2026
JWT_SECRET=cabinetpro_jwt_secret_key_2026_morocco
JWT_EXPIRES_IN=7d
PORT=4000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Compte admin par défaut
```
Email    : admin@cabinetpro.ma
Password : admin123
Rôle     : admin
Cabinet  : Cabinet Dentaire Demo (Casablanca, plan: pro)
```

---

## 10. Infrastructure Fedora — Docker/Podman

Le système tourne sur **Fedora 44** avec **Podman** (alias `docker` via `podman-docker`).
Images préfixées `docker.io/` pour éviter la sélection manuelle du registre.
Volume `init.sql` avec flag `:ro,z` pour SELinux.

```bash
# Démarrer la BDD + pgAdmin
docker compose up -d

# Voir les conteneurs
docker ps

# Logs PostgreSQL
docker logs cabinet_postgres --tail 30

# Reset complet de la base (SUPPRIME les données)
docker compose down -v && docker compose up -d
```

---

## 11. Commandes de Développement

```bash
# Terminal 1 — Base de données (depuis la racine)
docker compose up -d

# Terminal 2 — Backend
cd server && npm install && npm run dev
# → http://localhost:4000

# Terminal 3 — Frontend
cd client && npm install && npm run dev
# → http://localhost:5173
```

---

## 12. Conventions de Code

### Backend
- Logique métier dans les **controllers** (pas de couche service séparée pour l'instant)
- Associations Sequelize définies **uniquement** dans `models/index.js`
- Pas de migrations — `sequelize.sync()` en développement
- Toujours filtrer par `cabinet_id` (multi-tenant)

### Frontend
- CSS : Tailwind CSS 4 uniquement
- Composants : fonctionnels avec hooks React
- State global : via Context uniquement (AuthContext, LanguageContext)
- Montants : en **MAD (Dirhams marocains)** via `utils/formatters.js`
- Bilingue : Toujours ajouter les traductions FR + AR dans `LanguageContext.jsx`
