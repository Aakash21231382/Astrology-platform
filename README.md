# Astrology Platform

A complete astrology consultation platform with three main components: Frontend (User App), Admin Panel, and Backend API.

## 📁 Project Structure

```
Astrology/
├── frontend/          # User-facing web application
├── admin-panel/       # Admin dashboard
├── backend/           # Node.js API server
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Astrology
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   - Copy `.env.example` to `.env` and configure your database credentials
   - Run database migrations:
     ```bash
     node database/runMigrations.js
     ```
   
   - Start the backend server:
     ```bash
     npm start
     ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Admin Panel Setup**
   ```bash
   cd ../admin-panel
   npm install
   npm run dev
   ```

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- CSS3

### Admin Panel
- React
- Vite
- CSS3

### Backend
- Node.js
- Express.js
- MySQL
- Socket.io (for real-time chat)
- JWT Authentication

## 📝 Features

### User Features
- User registration and authentication
- Browse astrology experts
- Book consultations
- Real-time chat with experts
- Wallet management
- Payment integration

### Expert Features
- Expert registration and profile management
- Availability management
- Consultation handling
- Earnings tracking
- Withdrawal requests

### Admin Features
- Dashboard with analytics
- User management
- Expert approval and management
- Category management
- Banner management
- Withdrawal processing
- Platform settings

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Environment variables for sensitive data
- Input validation and sanitization

## 📄 License

This project is private and confidential.

## 👥 Contributing

Please contact the project administrator for contribution guidelines.
