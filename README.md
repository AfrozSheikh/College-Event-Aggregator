# 🎓 College Event Management System

A comprehensive web-based platform for managing college events, enabling seamless organization, participation, and feedback collection for technical, cultural, and sports events.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Contributing](#contributing)

## 🌟 Overview

The College Event Management System is a full-stack web application designed to streamline event management in educational institutions. It provides role-based access for admins, faculty, and students, enabling efficient event creation, registration, and feedback collection.

### Key Highlights

- 🔐 **Secure Authentication** - Role-based access control (Admin, Faculty, Student)
- 📅 **Event Management** - Create, edit, and manage events with rich details
- 💳 **Payment Integration** - QR code upload for event registration fees
- 📊 **Dynamic Feedback** - Customizable feedback forms for each event
- 📧 **Email Notifications** - Automated emails for event creation and registration
- 📈 **Analytics & Reports** - Generate comprehensive event reports with participant details
- 🖼️ **Event Gallery** - Upload and showcase event photos
- 🔍 **Smart Filtering** - Filter events by category, department, and status

## ✨ Features

### For Admins
- ✅ Approve/reject faculty registrations
- ✅ Create and manage all events
- ✅ View comprehensive dashboard with statistics
- ✅ Delete past events
- ✅ Generate detailed event reports
- ✅ Manage user accounts

### For Faculty
- ✅ Create and manage department events
- ✅ Upload payment QR codes for paid events
- ✅ Create dynamic feedback forms
- ✅ View event registrations
- ✅ Generate event reports
- ✅ Upload event gallery photos

### For Students
- ✅ Browse upcoming and past events
- ✅ Filter events by category and department
- ✅ Register for events
- ✅ View payment QR codes for paid events
- ✅ Submit event feedback
- ✅ View registration status
- ✅ Receive email notifications

### Core Functionalities
- 📝 **Event Creation** - Rich event details with images, dates, rules, participant limits
- 💰 **Payment QR Codes** - Upload UPI/bank QR codes for event fees
- 📋 **Registration Management** - Track participants, team members, and documents
- 🎯 **Dynamic Feedback Forms** - Create custom feedback forms with multiple question types
- 🖼️ **Gallery Management** - Upload up to 10 images per event
- 📧 **Email Service** - Automated notifications using Nodemailer
- 🔔 **In-app Notifications** - Real-time updates for students
- 📊 **PDF Reports** - Downloadable event reports with all participant details

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 7.2.7
- **Routing:** React Router DOM 7.1.3
- **HTTP Client:** Axios 1.7.9
- **UI Notifications:** React Hot Toast 2.4.1
- **Icons:** Heroicons React 2.2.0
- **Styling:** Tailwind CSS (custom configuration)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 4.21.2
- **Database driver:** pg (node-postgres) 8.x
- **File Upload:** Multer 1.4.5-lts.1
- **Email Service:** Nodemailer 6.9.16
- **CORS:** cors 2.8.5
- **PDF Generation:** pdfkit 0.15.1
- **Development:** Nodemon 2.0.22

### Database
- **DBMS:** PostgreSQL, hosted on [Neon](https://neon.tech)
- **Tables:** 13 tables (Users, Events, Event Gallery, Event Payment QR, Event Reports, Participations, Participation Files, Feedback, Feedback Forms, Questions, Responses, Answers, Notifications)
- **Files:** event images, payment QR codes, payment screenshots and PDF reports are stored in the database (BYTEA), not on disk

## 🏗️ System Architecture

```
College Event Management System
│
├── Frontend (React + Vite)
│   ├── Pages (Login, Signup, Dashboard, Events, etc.)
│   ├── Components (Forms, Feedback Creator, etc.)
│   ├── Context (Authentication)
│   └── Utils (Validation)
│
├── Backend (Node.js + Express)
│   ├── Controllers (Auth, Events, Participation, Feedback, Reports, Notifications)
│   ├── Services (Email Service)
│   ├── Config (Database)
│   └── Files API (images, QR codes, screenshots, reports served from the DB)
│
└── Database (Neon Postgres)
    ├── Users (Admin, Faculty, Student)
    ├── Events (with Payment QR)
    ├── Gallery, Participations
    └── Dynamic Feedback System
```

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- Internet access to the Neon database (no local database needed)
- npm or yarn

### Clone Repository
```bash
git clone <repository-url>
cd event-agg-r-2
```

### Backend Setup
```bash
cd backend
npm install
```

### Frontend Setup
```bash
cd frontend
npm install
```

## 💾 Database Setup

The app uses a hosted **Neon Postgres** database. The connection string is set in
`backend/config/db.js`.

### 1. Create the tables (first time only)
```bash
cd backend
npm run db:init
```
This runs `backend/schema.sql` against Neon. It is safe to run again – it only creates what is
missing and never deletes data.

### 2. Database Tables
- `users` - User accounts with role-based access
- `events` - Event details
- `event_gallery` - Event images (stored in the DB)
- `event_payment_qr` - Payment QR code per event (stored in the DB)
- `event_reports` - Generated PDF reports (stored in the DB)
- `participations` - Student registrations
- `participation_files` - Payment screenshots / documents (stored in the DB)
- `feedback` - Legacy rating feedback
- `feedback_forms`, `feedback_questions`, `feedback_responses`, `feedback_answers` - Dynamic feedback
- `notifications` - In-app notifications

### 3. Default Admin Account
```
Email: admin@college.edu
Password: admin123
```

## ⚙️ Configuration

### Backend Configuration
There is no `.env` file. Settings live in the code:
- **Database:** connection string in `backend/config/db.js`
- **Port:** `5000`, set in `backend/server.js`
- **Email (Gmail):** sender address and app password in `backend/services/emailService.js`

### Email Setup (Gmail)
1. Enable 2-Factor Authentication in your Gmail account
2. Generate App-Specific Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password for "Mail"
3. Put the 16-character password in `backend/services/emailService.js`

### Frontend Configuration
The frontend is configured to connect to `http://localhost:5000` for API calls. Update `axios` base URLs in components if needed.

## 🚀 Usage

### Start Backend Server
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Build for Production
```bash
cd frontend
npm run build
```

## 👥 User Roles

### Admin
- **Access:** Full system access
- **Permissions:** Manage users, approve faculty, create/delete events, generate reports
- **Dashboard:** System statistics, pending approvals, recent events

### Faculty
- **Access:** Event management for their department
- **Permissions:** Create events, upload QR codes, create feedback forms, view registrations
- **Dashboard:** Department events, registrations, feedback

### Student
- **Access:** Event browsing and participation
- **Permissions:** Register for events, submit feedback, view gallery
- **Dashboard:** Registered events, upcoming events, past events

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/type/:type` - Get events by type (upcoming/past)
- `POST /api/events` - Create event (Admin/Faculty)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Participation
- `POST /api/participations/register` - Register for event
- `GET /api/participations/event/:id` - Get event participants
- `GET /api/participations/student/:id` - Get student registrations
- `GET /api/participations/status/:eventId/:studentId` - Check registration status

### Feedback
- `POST /api/feedback-forms` - Create feedback form
- `GET /api/feedback-forms/event/:id` - Get feedback form
- `POST /api/feedback/submit` - Submit feedback
- `GET /api/feedback/responses/:eventId` - Get feedback responses

### Reports
- `GET /api/reports/event/:id` - Generate event report (PDF)

### Users
- `GET /api/users/faculty/pending` - Get pending faculty approvals (Admin)
- `PUT /api/users/:id/approve` - Approve user (Admin)
- `PUT /api/users/:id/reject` - Reject user (Admin)

## 📱 Screenshots

### Admin Dashboard
- Statistics overview
- Pending faculty approvals
- Recent events management

### Event Creation
- Event details form
- Image upload (up to 10)
- Payment QR code upload (for paid events)
- Department selection

### Student Registration
- Event details view
- Payment QR code display
- Registration form
- Team member addition

### Feedback System
- Dynamic form creation
- Multiple question types (text, rating, textarea, multiple choice)
- Real-time feedback submission

### Gallery
- Event photo browsing
- Past event galleries
- Full-size image view

## 📝 Key Features Explained

### Payment QR Code System
- Admin/Faculty uploads QR code image when creating paid events
- QR appears automatically when registration fees > 0
- Students can view and download QR during registration
- Supports UPI, bank transfer, or any payment QR

### Dynamic Feedback Forms
- Create custom feedback forms for each event
- Question types: Text, Rating (1-5), Textarea, Multiple Choice
- Mark questions as required/optional
- Prevents duplicate submissions
- View aggregated responses

### Email Notifications
- Automated emails on event creation
- Registration confirmation emails
- Customizable email templates
- Uses Nodemailer with Gmail SMTP

### Form Validations
- Real-time validation on all forms
- Password strength indicator
- Email format validation
- Phone number (10-digit) validation
- File size and type validation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open-source and available under the MIT License.

## 👨‍💻 Developer

Developed with ❤️ for streamlining college event management

## 🐛 Known Issues & Fixes

### Database
If tables are missing (e.g. a new Neon database), run `npm run db:init` in `backend`.

### Email Service
Ensure the Gmail App Password in `backend/services/emailService.js` is valid for email functionality.

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time chat for event coordinators
- [ ] Calendar integration (Google Calendar)
- [ ] Analytics dashboard with charts
- [ ] Social media sharing
- [ ] WhatsApp notifications
- [ ] Event reminders
- [ ] Attendance tracking with QR codes

---

**Note:** This system is designed for educational purposes and can be customized for any institution's requirements.
