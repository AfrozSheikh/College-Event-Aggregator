# 🎓 College Event Aggregator Management System

A full-stack web application for managing college events with role-based access control, built using **MySQL, Express.js, React.js, and Tailwind CSS**.

---

## 🌟 Key Features
- 🔐 Role-based Authentication (Admin, Faculty, Student)
- 🎉 Event Creation & Management (CRUD)
- 🖼️ Multiple Image Uploads (Event Gallery)
- 👨‍🎓 Student Event Registration & Feedback
- 👨‍🏫 Faculty Event Management (Post-Approval)
- 👨‍💼 Admin Dashboard & User Approval
- 📄 PDF Report Generation
- 📊 Event & Participation Analytics

---

## 👥 User Roles
- **Admin** – Full system control, approvals, reports
- **Faculty** – Create & manage events (after approval)
- **Student** – Register for events, submit feedback

---

## 🏗️ Tech Stack
- **Frontend:** React.js, Tailwind CSS, Vite  
- **Backend:** Node.js, Express.js  
- **Database:** MySQL  
- **Other:** Multer (uploads), PDF generation  

---

## 🏗️ System Architecture
React (Frontend)
↓
Express API (Backend)
↓
MySQL Database

---

## 📊 Database Tables
- users
- events
- participations
- event_gallery
- feedback

---

## 🚀 Installation (Quick)
```bash
git clone https://github.com/AfrozSheikh/College-Event-Aggregator
cd college-event-system
