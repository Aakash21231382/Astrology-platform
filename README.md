# 🌟 Astrotalk-Style Vedic Astrology & Consultation Platform

A comprehensive, full-stack **Astrology Consultation & Vedic Services Platform** built with **React**, **Node.js (Express)**, **Microsoft SQL Server (MSSQL)**, and **Socket.io / WebRTC**.

---

## 📁 Project Architecture

```
Astrology/
├── backend/          # Node.js + Express API & Socket.io Server (MSSQL Database)
├── frontend/         # React + Vite User & Astrologer Portal
├── admin-panel/      # React + Vite Super Admin Management Dashboard
└── README.md         # Documentation & Setup Guide
```

---

## 🚀 Key Features

### 🔮 Customer Portal (Frontend)
- **Astrologer Discovery:** Filter by Vedic categories, language, price, and ratings.
- **Live Consultation Room:**
  - Real-time instant messaging via Socket.io with typing indicators & unread badges.
  - WebRTC Peer-to-Peer **Audio & Video Calling** with call timers and auto-billing.
- **Wallet & Billing:** Automated per-minute wallet deduction, Razorpay recharge integration, and transaction history.
- **Kundali Calculator & Matchmaking:** Instant Kundali chart calculations (Lagna, Moon, planetary positions, Dasha, Ashtakavarga).
- **Vedic E-Commerce:**
  - **Puja Services:** Online Pooja booking with Gotra, Sankalpa, and address details.
  - **Gemstones & Products:** Certified gemstones and astrology products purchase flow.
- **Customer Dashboard:** Manage profile, view active orders, appointments, chat/call history, and wallet transactions.

### 🧘 Expert / Astrologer Portal
- **Onboarding & Verification:** Multi-step signup with document uploads (ID proof, certification, experience).
- **Schedule Management:** Flexible hourly availability setup, weekly schedule matrix, and instant Online/Offline status toggles.
- **Incoming Call & Chat Modal:** Real-time ringing notifications to accept/reject incoming sessions.
- **Consultation Workspace:** Live chat interface, user Kundali insights, review notes, and prescription/remedies sharing.
- **Earnings & Payouts:** Real-time earnings tracker, commission breakdown, and withdrawal requests.

### 🛡️ Admin Dashboard (Admin Panel)
- **Analytics & Metrics:** Platform revenue, active consultations, expert performance, and user growth charts.
- **Astrologer Management:** Review KYC documents, approve/reject astrologer registrations, and toggle verification badges.
- **Consultations & Live Sessions:** Real-time monitor for active chats and calls.
- **E-Commerce & Puja Management:** Add/edit products, manage Puja listings, update order delivery statuses, and upload recording URLs.
- **Financial Controls:** Process astrologer withdrawal payouts and manage platform commission rates.
- **CMS & Banners:** Dynamic banners, FAQ editor, and policy pages management.

---

## 🛠️ Tech Stack

- **Frontend & Admin:** React 19 / 18, Vite, Vanilla CSS Design System, Lucide Icons, Socket.io Client.
- **Backend Server:** Node.js, Express.js, Socket.io, WebRTC Signaling.
- **Database:** Microsoft SQL Server (MSSQL / SQL Express) using `mssql` pool.
- **Authentication:** JWT (JSON Web Tokens) with secure HTTP headers and role-based authorization (`customer`, `expert`, `admin`).
- **Payments:** Razorpay Gateway integration & in-app wallet ledger.

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher
- **MSSQL Server**: SQL Server 2019/2022 or SQL Server Express (with Windows Auth or SQL Auth)

---

### 2. Backend Setup

```bash
cd backend
npm install
```

1. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
2. Configure database credentials in `.env`:
   ```env
   PORT=5000
   DB_SERVER=.\\SQLEXPRESS
   DB_DATABASE=AstrologyDB
   DB_AUTH_MODE=WINDOWS
   JWT_SECRET=your_jwt_secret_key
   ```
3. Initialize database schema & seed data:
   - Run the all-in-one migration file `backend/database/all_in_one_database.sql` in **SQL Server Management Studio (SSMS)** or Azure Data Studio.
4. Start the backend API & Socket server:
   ```bash
   npm start
   ```
   *The server will run on `http://localhost:5000`.*

---

### 3. Frontend Portal Setup

```bash
cd ../frontend
npm install
npm run dev
```
*User application will run on `http://localhost:5173`.*

---

### 4. Admin Panel Setup

```bash
cd ../admin-panel
npm install
npm run dev
```
*Admin application will run on `http://localhost:5174`.*

---

## 🔐 Default Admin Credentials (Seed)

- **Email:** `admin@astrology.com`
- **Password:** `Admin@123`

---

## 📄 License

This repository is maintained for Vedic Astrology Consultation Platform services. All rights reserved.
