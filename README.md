# BodaZone - E-Commerce Platform for Motorbike Spare Parts

A comprehensive e-commerce solution connecting motorbike riders with spare parts vendors in Kenya. Built with React, Node.js, and MySQL.

**Project By**: Louise Sabrina Murugi Ngonge  
**Registration**: HDB 212-2240/2023  
**Supervisor**: Mr. Martin Kibe  
**Institution**: Jomo Kenyatta University of Agriculture and Technology

## 📋 Project Overview

BodaZone solves the challenge of inefficient access to quality motorbike spare parts by providing:

- **Direct Marketplace**: Connects riders directly with spare parts vendors
- **M-Pesa Integration**: Secure mobile money payments
- **Real-time Tracking**: Order and delivery tracking
- **Quality Assurance**: Rating and review system
- **Mobile-Responsive**: Optimized for smartphones and low bandwidth

## 🏗️ System Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   React App     │◄────────►│  Node.js API     │
│   (Frontend)    │ HTTP/REST│  (Backend)       │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   MySQL Database │
                            │   M-Pesa Gateway │
                            └──────────────────┘
```

## 📂 Project Structure

```
bodazone/
├── backend/                 # Node.js/Express API
│   ├── models/             # Database models
│   ├── controllers/        # Request handlers
│   ├── routes/             # API endpoints
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic & M-Pesa
│   ├── config/             # Configuration
│   ├── app.js              # Express app
│   ├── server.js           # Server entry
│   ├── package.json        # Dependencies
│   └── README.md           # Backend docs
│
├── frontend/               # React application
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # State management
│   │   ├── services/       # API client
│   │   ├── App.js          # Main app
│   │   └── index.js        # Entry point
│   ├── package.json        # Dependencies
│   └── README.md           # Frontend docs
│
├── db/                      # Database files
│   └── schema.sql          # Database schema
│
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v14+ and npm
- **MySQL** 5.7+
- **Git**
- M-Pesa Developer Account (optional for payment testing)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/bodazone.git
cd bodazone
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Create MySQL database
mysql -u root -p < ../db/schema.sql

# Start development server
npm run dev
```

Backend will run on: `http://localhost:5000`

### 3. Setup Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

Frontend will run on: `http://localhost:3000`

## 🔐 Authentication

### Test Accounts

**Rider Account:**
```
Email: rider@bodazone.com
Password: password123
```

**Seller Account:**
```
Email: seller@bodazone.com
Password: password123
```

**Admin Account:**
```
Email: admin@bodazone.com
Password: password123
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require JWT token:
```
Authorization: Bearer <token>
```

### Key Endpoints

**Products**
- `GET /products` - Get all products
- `GET /products/:id` - Get product details
- `POST /products` - Create product (seller)
- `PUT /products/:id` - Update product (seller)

**Orders**
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order details

**Payments**
- `POST /payments/initiate` - Start M-Pesa payment
- `GET /payments/:orderId/verify` - Verify payment

**Deliveries**
- `GET /deliveries/:id` - Get delivery info
- `GET /deliveries/track/:trackingNumber` - Track delivery

Full API documentation: [Backend README](./backend/README.md)

## 💳 Payment Integration (M-Pesa)

### Setup

1. Get M-Pesa credentials from [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Add to `.env` file:
   ```
   MPESA_CONSUMER_KEY=your_key
   MPESA_CONSUMER_SECRET=your_secret
   MPESA_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   ```

### Payment Flow

1. Customer initiates payment for order
2. STK Push sent to customer's M-Pesa registered phone
3. Customer enters PIN
4. Payment verified with M-Pesa API
5. Order status updated to "paid"
6. Delivery initiated

## 🎯 Core Features

### For Riders
- ✅ Browse and search spare parts
- ✅ Filter by price and category
- ✅ View seller ratings and reviews
- ✅ Place orders with M-Pesa payment
- ✅ Track delivery in real-time
- ✅ Leave reviews and ratings
- ✅ View order history

### For Sellers
- ✅ Register shop
- ✅ Add and manage products
- ✅ Set prices and inventory
- ✅ View pending orders
- ✅ Update delivery status
- ✅ View ratings and reviews
- ✅ Track sales

### For Admins
- ✅ Manage all users
- ✅ Approve seller registrations
- ✅ Monitor transactions
- ✅ View system analytics
- ✅ Manage disputes

## 🔍 Database Schema

### Key Tables

- **users** - User accounts (riders, sellers, admins)
- **sellers** - Seller shop profiles
- **products** - Spare parts inventory
- **orders** - Customer orders
- **order_items** - Items in each order
- **payments** - Payment records
- **deliveries** - Delivery tracking
- **reviews** - Product/seller reviews

See [schema.sql](./db/schema.sql) for complete schema

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
```

### Deploy Options

- **Backend**: Heroku, Railway, Render
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Database**: AWS RDS, Google Cloud SQL

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to database | Verify MySQL is running, check credentials |
| API connection fails | Ensure backend is running on port 5000 |
| CORS errors | Check `CORS_ORIGIN` in backend `.env` |
| M-Pesa payment fails | Verify credentials, check phone number format |
| Payment callback not received | Ensure callback URL is publicly accessible |

## 📋 Requirements Met

From project proposal:

- ✅ React frontend for responsive UI
- ✅ Node.js/Express backend API
- ✅ MySQL database for data storage
- ✅ M-Pesa payment integration
- ✅ Real-time order tracking
- ✅ Product catalog with categories
- ✅ Seller ratings and reviews
- ✅ User authentication (role-based)
- ✅ Mobile-responsive design
- ✅ Low-bandwidth optimization

## 🔄 Development Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Commit with clear messages
5. Push to GitHub
6. Create pull request

## 📞 Support & Contact

- **Email**: louise@bodazone.com
- **Supervisor**: Mr. Martin Kibe
- **University**: JKUAT

## 📄 License

This project is the intellectual property of Louise Sabrina Murugi Ngonge and JKUAT.

## 🙏 Acknowledgments

- Supervisor: Mr. Martin Kibe
- JKUAT Faculty and Staff
- Open source community

---

**Last Updated**: April 18, 2026  
**Project Status**: Final Year Project Submission

---

## 🚀 Next Steps

1. Set up both backend and frontend following Quick Start guide
2. Configure database and environment variables
3. Test authentication flow
4. Explore product browsing
5. Test order creation and payment
6. Set up M-Pesa for live payments

**Good luck with BodaZone! 🎉**
