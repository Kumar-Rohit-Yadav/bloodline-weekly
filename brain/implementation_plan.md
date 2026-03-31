# BloodLine FYP — 10-Day Simulated Development Plan

## Project Overview
- **Repo**: https://github.com/Kumar-Rohit-Yadav/bloodline-weekly.git
- **Stack**: React 19 + Vite (client) | Node.js + Express 5 + TypeScript (server) | MongoDB Atlas
- **Start Date**: March 30, 2026 (Day 1)

---

## Day-by-Day File Commit Map

---

### 🗓️ DAY 1 — Authentication Foundation (3 commits)

**Commit 1 — "Initialize project structure with TypeScript config and core dependencies"**
- `server/package.json`
- `server/tsconfig.json`
- `server/.env.example`
- `client/package.json`
- `client/tsconfig.json`
- `client/tsconfig.node.json`
- `client/index.html`
- `client/vite.config.ts`
- `.gitignore` (root-level)

**Commit 2 — "Add MongoDB connection, User schema with bcrypt encryption, and OTP model"**
- `server/src/config/db.ts`
- `server/src/models/User.ts`
- `server/src/models/OTP.ts`
- `server/src/middlewares/auth.ts`
- `server/src/server.ts`

**Commit 3 — "Implement multi-role registration with automated OTP verification and JWT authentication"**
- `server/src/controllers/authController.ts`
- `server/src/controllers/otpAuthController.ts`
- `server/src/controllers/verificationController.ts`
- `server/src/routes/authRoutes.ts`
- `server/src/utils/sendEmail.ts`
- `client/src/context/AuthContext.tsx`
- `client/src/pages/LoginPage.tsx`
- `client/src/pages/RegisterPage.tsx`
- `client/src/pages/VerifyEmailPage.tsx`
- `client/src/pages/ResetPasswordPage.tsx`
- `client/src/components/frontend/OTPInput.tsx`
- `client/src/components/frontend/RoleSelection.tsx`

---

### 🗓️ DAY 2 — Landing Page & Routing Setup (2 commits)

**Commit 1 — "Build responsive landing page with hero, features, and how-it-works sections"**
- `client/src/App.tsx`
- `client/src/main.tsx`
- `client/src/index.css`
- `client/src/pages/HomePage.tsx`
- `client/src/components/frontend/Hero.tsx`
- `client/src/components/frontend/Features.tsx`
- `client/src/components/frontend/HowItWorks.tsx`
- `client/src/components/frontend/CTA.tsx`
- `client/src/components/frontend/Navbar.tsx`
- `client/src/components/frontend/Footer.tsx`

**Commit 2 — "Add reusable UI component library: Button, Card, Input, and VerifiedBadge"**
- `client/src/components/ui/Button.tsx`
- `client/src/components/ui/Card.tsx`
- `client/src/components/ui/Input.tsx`
- `client/src/components/ui/VerifiedBadge.tsx`
- `client/src/utils/utils.ts`
- `client/src/config/` (axios config)
- `client/vite-env.d.ts`
- `client/.env.example`

---

### 🗓️ DAY 3 — User Profiles & Dashboard Shell (2 commits)

**Commit 1 — "Add profile management: complete profile page with blood type and medical notes"**
- `server/src/controllers/profileController.ts`
- `server/src/controllers/profileChangeController.ts`
- `server/src/models/ProfileChangeRequest.ts`
- `client/src/pages/CompleteProfilePage.tsx`
- `client/src/pages/ProfilePage.tsx`

**Commit 2 — "Scaffold dashboard shell with role-based routing for donors, receivers, and hospitals"**
- `client/src/pages/DashboardPage.tsx`
- `server/src/controllers/verificationController.ts` (extended)

---

### 🗓️ DAY 4 — Donor & Receiver Dashboards (2 commits)

**Commit 1 — "Build donor dashboard with activity history, donation tracker, and nearby request feed"**
- `client/src/components/dashboard/DonorDashboard.tsx`
- `client/src/components/dashboard/ActivityHistory.tsx`
- `server/src/models/ActivityHistory.ts`

**Commit 2 — "Implement receiver dashboard with blood request status and donor matching interface"**
- `client/src/components/dashboard/ReceiverDashboard.tsx`
- `server/src/controllers/matchController.ts`
- `server/src/models/BloodRequest.ts`
- `server/src/routes/matchRoutes.ts`

---

### 🗓️ DAY 5 — Blood Request System (2 commits)

**Commit 1 — "Add blood request creation with urgency levels, blood type selection, and geolocation"**
- `client/src/pages/CreateRequestPage.tsx`
- `server/src/controllers/requestController.ts`
- `server/src/routes/requestRoutes.ts`

**Commit 2 — "Integrate Nepal map view for donor proximity matching using Leaflet"**
- `client/src/components/map/NepalMap.tsx`
- `client/src/components/dashboard/BloodBankExplorer.tsx`
- `server/src/controllers/hospitalCatalogController.ts`
- `server/src/routes/hospitalCatalogRoutes.ts`
- `server/src/models/VerifiedHospital.ts`

---

### 🗓️ DAY 6 — Hospital Portal & Inventory (2 commits)

**Commit 1 — "Build hospital dashboard with real-time blood inventory management per blood type"**
- `client/src/components/dashboard/HospitalDashboard.tsx`
- `server/src/controllers/hospitalController.ts`
- `server/src/routes/hospitalRoutes.ts`

**Commit 2 — "Add hospital search and blood bank catalog for public discovery"**
- `client/src/components/frontend/HospitalSearch.tsx`
- `server/src/seedHospitals.ts`
- `server/src/models/VerifiedHospital.ts` (extended)
- `server/src/scripts/fixDonorNames.ts`

---

### 🗓️ DAY 7 — Real-Time Chat & Connections (2 commits)

**Commit 1 — "Implement WebSocket-powered real-time messaging between donors and receivers"**
- `server/src/socket.ts`
- `server/src/controllers/messageController.ts`
- `server/src/models/Message.ts`
- `server/src/models/ChatConnection.ts`
- `server/src/routes/messageRoutes.ts`
- `client/src/context/SocketContext.tsx`

**Commit 2 — "Build full communications center with chat UI, connection requests, and online status"**
- `client/src/pages/CommunicationsCenter.tsx`
- `server/src/controllers/connectionController.ts`
- `server/src/routes/connectionRoutes.ts`

---

### 🗓️ DAY 8 — Notifications & Appointments (2 commits)

**Commit 1 — "Add real-time notification system with Bell icon, unread badge, and mark-as-read"**
- `client/src/components/dashboard/NotificationButton.tsx`
- `server/src/controllers/notificationController.ts`
- `server/src/models/Notification.ts`
- `server/src/routes/notificationRoutes.ts`

**Commit 2 — "Implement appointment booking system for hospital visits and donation events"**
- `server/src/controllers/appointmentController.ts`
- `server/src/models/Appointment.ts`
- `server/src/routes/appointmentRoutes.ts`

---

### 🗓️ DAY 9 — Admin Dashboard & AI Assistant (2 commits)

**Commit 1 — "Build admin panel with user verification, hospital approval, and system analytics"**
- `client/src/components/dashboard/AdminDashboard.tsx`
- `server/src/controllers/adminController.ts`
- `server/src/routes/adminRoutes.ts`

**Commit 2 — "Integrate Groq-powered AI assistant for blood type compatibility and donation guidance"**
- `server/src/services/aiService.ts`
- `server/src/routes/aiRoutes.ts`

---

### 🗓️ DAY 10 — Final Polish, README & Deployment Setup (2 commits)

**Commit 1 — "Add PORTABILITY_CHECK script, database seed files, and full .env configuration"**
- `server/PORTABILITY_CHECK.ps1` (moved to root)
- `server/src/seedHospitals.ts` (final version)
- `server/.env.example` (comprehensive)
- `client/.env.example`

**Commit 2 — "Write comprehensive README with setup guide, feature overview, and API reference"**
- `README.md` (root-level, comprehensive)
- `brain/task.md`
- `brain/implementation_plan.md`

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4, Framer Motion |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs + OTP (Nodemailer) |
| Real-time | Socket.io v4 |
| Maps | Leaflet + React-Leaflet |
| AI | Groq SDK (LLaMA) |
| Notifications | Sonner (toast) |

---

## Verification Plan

By Day 10, the repo will be 100% runnable from ZIP:
1. Clone → `npm install` in both `/client` and `/server`
2. Copy `.env.example` → `.env` and fill credentials
3. Run `npm run seed` in `/server` to populate hospitals + admin
4. `npm run dev` in both directories → App live at `localhost:3000`
