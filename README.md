BloodLine – Blood Donation Management System
BloodLine is a web-based system designed to connect blood donors with recipients in real time. The platform streamlines the entire blood donation lifecycle — from registration and donor matching to appointment booking and real-time communication — making it easier for hospitals, blood banks, and individuals to manage and access critical blood supply information efficiently.

Project Objective
The main objective of this project is to develop a centralized blood donation management platform that bridges the gap between blood donors and those in need. By providing real-time notifications, intelligent donor–recipient matching, and a secure communication channel, BloodLine aims to improve response times during medical emergencies and promote a culture of voluntary blood donation.

Features
The system provides the following features:

User Registration & Email Verification – Secure sign-up with OTP-based email verification
User Login & Authentication – JWT-based authentication with role-based access control (Donor, Hospital, Admin)
Dashboard – Personalized dashboard displaying blood requests, donation stats, and activity summaries
Blood Request Management – Create, browse, and respond to urgent blood requests
Donor–Recipient Matching – Smart matching system to connect compatible donors with recipients
Appointment Booking – Schedule blood donation appointments with hospitals
Real-Time Chat – Socket.io powered messaging between donors and recipients
Notifications – Real-time push notifications for requests, matches, and messages
Blood Bank Explorer – Interactive map (Leaflet) to discover nearby blood banks and hospitals
Inventory Management – Hospitals can manage their blood stock levels
Profile Management – Complete profile with blood group, location, and donation history
Admin Panel – System-wide user management, request moderation, and profile verification
Activity History – Track past donations, requests, and interactions
AI-Powered Assistance – Integrated Groq AI for intelligent support
Password Reset – Secure password recovery via email
Secure Logout System – Token invalidation and session cleanup


Technologies Used
Frontend
TechnologyPurposeReact 19UI libraryTypeScriptType-safe developmentViteBuild tool & dev serverTailwind CSS 4Utility-first stylingFramer MotionAnimations & transitionsReact Router 7Client-side routingSocket.io ClientReal-time communicationLeafletInteractive mapsLucide ReactIcon libraryAxiosHTTP clientSonnerToast notifications
Backend
TechnologyPurposeNode.jsRuntime environmentExpress 5Web frameworkTypeScriptType-safe developmentMongooseMongoDB ODMSocket.ioReal-time WebSocket serverJWTAuthentication tokensbcrypt.jsPassword hashingNodemailerEmail service (OTP & alerts)Groq SDKAI integrationHelmetSecurity headersMorganHTTP request logging
Database

MongoDB – NoSQL document database

Deployment

Render / Railway – Backend hosting
Vercel / Netlify – Frontend hosting


System Requirements
Hardware

Computer or smartphone
Internet connection

Software

Web browser such as Google Chrome or Firefox
Node.js (v18.x or higher)
MongoDB (running locally on port 27017 or a MongoDB Atlas connection string)
npm (comes with Node.js)


Installation and Setup
Steps to run the project locally:
1. Clone the repository
bashgit clone https://github.com/Kumar-Rohit-Yadav/bloodline-weekly.git
2. Go to the project folder
bashcd bloodline-weekly
3. Install required dependencies
For the Server:
bashcd server
npm install
For the Client:
bashcd client
npm install
4. Environment Configuration
The project includes .env files for convenience. If you need to change any settings (like the database URL or API keys), you can modify the .env files in both the server/ and client/ directories. Refer to .env.example in each directory for the required variables.
5. Initialize the Database (Seeding)
To populate the database with the initial Admin account and verified hospitals list, run the following in the server/ directory:
bashnpm run seed
Default Admin Credentials:

Email: admin@bloodline.com
Password: password123

6. Run the Application
Start the Server (in the server/ directory):
bashnpm run dev
The backend will be running on http://localhost:5000.
Start the Frontend (in a separate terminal, in the client/ directory):
bashnpm run dev
The frontend will be running on http://localhost:3000.

Live Project
Live URL of the deployed system:

https://bloodline-weekly.vercel.app (or update with your actual deployment link)


Project Structure
bloodline-weekly/
│
├── client/                     # Frontend (React + Vite)
│   ├── public/                 # Static assets
│   └── src/
│       ├── assets/             # Images & media
│       ├── components/         # Reusable UI components
│       │   ├── dashboard/      # Dashboard widgets
│       │   ├── frontend/       # Landing page components
│       │   ├── layout/         # Layout wrappers (Sidebar, Navbar)
│       │   ├── map/            # Leaflet map components
│       │   └── ui/             # Shared UI primitives
│       ├── config/             # App configuration
│       ├── context/            # React Context providers (Auth, Socket)
│       ├── hooks/              # Custom React hooks
│       ├── pages/              # Route-level page components
│       │   ├── admin/          # Admin panel pages
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── CreateRequestPage.tsx
│       │   ├── BookAppointmentPage.tsx
│       │   ├── CommunicationsCenter.tsx
│       │   └── ...
│       ├── utils/              # Utility functions
│       ├── App.tsx             # Root component & routing
│       └── main.tsx            # Entry point
│
├── server/                     # Backend (Node.js + Express)
│   └── src/
│       ├── config/             # Database & environment config
│       ├── controllers/        # Route handler logic
│       ├── middlewares/        # Auth & validation middleware
│       ├── models/             # Mongoose schemas
│       │   ├── User.ts
│       │   ├── BloodRequest.ts
│       │   ├── Appointment.ts
│       │   ├── Message.ts
│       │   ├── Notification.ts
│       │   └── ...
│       ├── routes/             # API route definitions
│       ├── services/           # Business logic services
│       ├── socket/             # Socket.io event handlers
│       ├── utils/              # Helper utilities
│       ├── server.ts           # App entry point
│       └── seedHospitals.ts    # Database seeding script
│
├── .gitignore
├── PORTABILITY_CHECK.ps1       # System environment checker
└── README.md

Screenshots

Add screenshots of the system here.


Login Page = ![alt text](image-1.png)
Registration Page = ![alt text](image-2.png)
User Dashboard =![alt text](image-3.png)
Blood Request Creation =![alt text](image-4.png)
Real-Time Chat =![alt text](image-5.png)
Blood Bank Explorer (Map) =![alt text](image-6.png)
Admin Panel =![alt text](image-7.png)
Appointment Booking = ![alt text](image-8.png)


Future Improvements
Possible improvements for the system:

Mobile application version (React Native)
Improved user interface and accessibility
Two-factor authentication (2FA)
Advanced analytics and reporting dashboard
Blood expiry tracking and automated alerts
Multi-language support (i18n)
GPS-based nearest donor discovery
ospital API integration for live inventory sync


Authors
Kumar Rohit Yadav
Final Year Project


License
This project is created for educational purposes as part of a Final Year Project.
