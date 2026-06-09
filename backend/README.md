# BodaZone Backend API Documentation

## 🚀 Project Overview

BodaZone is an e-commerce platform for motorbike spare parts in Kenya. The backend is built with Node.js, Express, and MySQL, featuring M-Pesa payment integration and real-time order tracking.

## 📋 Prerequisites

- Node.js v14+ and npm
- MySQL 5.7+
- M-Pesa Developer Account (for payment integration)

## 🔧 Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bodazone
DB_PORT=3306

# JWT
JWT_SECRET=your_very_strong_secret_key_here
JWT_EXPIRE=7d

# M-Pesa
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=http://localhost:5000/api/payments/mpesa-callback

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Create Database

```bash
mysql -u root -p
CREATE DATABASE bodazone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## 🚀 Starting the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API will be available at `http://localhost:5000`

## 📊 Database Models

### Core Entities
- **Users**: Riders, Sellers, Admins
- **Sellers**: Shop profiles for vendors
- **Products**: Spare parts inventory
- **Orders**: Customer orders
- **OrderItems**: Individual items in orders
- **Payments**: Payment records
- **Deliveries**: Delivery tracking
- **Reviews**: Product and seller reviews

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile
- `POST /refresh-token` - Refresh JWT token
- `GET /logout` - Logout

### Products (`/api/products`)
- `GET /` - Get all products (paginated, filterable)
- `GET /:id` - Get product details
- `POST /` - Create product (sellers only)
- `PUT /:id` - Update product (sellers only)
- `DELETE /:id` - Delete product (sellers only)

### Orders (`/api/orders`)
- `POST /` - Create new order
- `GET /` - Get user's orders
- `GET /:id` - Get order details
- `POST /:id/cancel` - Cancel order

### Payments (`/api/payments`)
- `POST /initiate` - Initiate M-Pesa payment
- `POST /mpesa-callback` - M-Pesa callback handler
- `GET /:orderId/verify` - Verify payment status
- `GET /history` - Get payment history

### Deliveries (`/api/deliveries`)
- `GET /:id` - Get delivery details
- `GET /track/:trackingNumber` - Track delivery
- `PUT /:id/status` - Update delivery status

### Reviews (`/api/reviews`)
- `POST /` - Create review
- `GET /product/:productId` - Get product reviews
- `GET /seller/:sellerId` - Get seller reviews

## 🛡️ User Roles & Permissions

### Rider
- Browse products
- Place orders
- Make payments
- Track deliveries
- Leave reviews

### Seller
- Create/manage products
- Manage inventory
- View orders
- Update delivery status
- View ratings

### Admin
- Manage all users
- Approve sellers
- Monitor transactions
- View system analytics

## 🏗️ Project Structure

```
backend/
├── models/          # Database models
├── controllers/     # Request handlers
├── routes/          # API routes
├── middleware/      # Custom middleware
├── services/        # Business logic
├── config/          # Configuration files
├── app.js           # Express app setup + server entry point
└── package.json     # Dependencies
```

## 💳 M-Pesa Integration

### Payment Flow

1. **Initiate Payment**: `POST /api/payments/initiate`
   - Sends STK Push to customer's phone
   - M-Pesa API responds with checkout request ID

2. **Customer Authorization**: 
   - User enters M-Pesa PIN on their phone

3. **Callback**: `POST /api/payments/mpesa-callback`
   - M-Pesa sends payment result
   - System updates payment status

4. **Verification**: `GET /api/payments/:orderId/verify`
   - Check if payment was successful

### M-Pesa Credentials

Get these from [Safaricom Developer Portal](https://developer.safaricom.co.ke/):
- Consumer Key
- Consumer Secret  
- Business Shortcode
- Passkey (for STK Push)

## 🔍 Query Parameters

### Product Filtering
```
GET /api/products?category=tires&minPrice=500&maxPrice=5000&search=michelin&page=1&limit=20
```

### Order Listing
```
GET /api/orders?status=pending&page=1&limit=10
```

## ⚡ Performance Tips

1. **Pagination**: Always paginate large datasets
2. **Indexing**: Database queries are indexed on frequently searched fields
3. **Caching**: Implement Redis for product catalog caching
4. **Rate Limiting**: Consider adding rate limiting middleware

## 🐛 Error Handling

All errors return JSON with this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": []  // Optional validation errors
}
```

## 📝 Logging

- Development: Console logging enabled
- Production: Use Winston or Bunyan for file-based logging

## 🔄 Database Migration

To sync models with database:
```javascript
// Automatic on server start in development
sequelize.sync({ alter: true })
```

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 📦 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use environment-specific configurations
3. Enable HTTPS/SSL
4. Set up PM2 for process management

### Production Database
1. Configure MySQL backups
2. Set up read replicas for scaling
3. Enable query logging

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: M-Pesa payment fails
- Solution: Verify phone number format (254xxxxxxxxx)
- Check M-Pesa credentials are correct

**Issue**: Database connection fails
- Solution: Verify MySQL is running
- Check credentials in .env

**Issue**: CORS errors
- Solution: Update CORS_ORIGIN in .env
- Ensure frontend is running on correct port

## 📄 License

MIT License - See LICENSE file

## 👥 Contributors

- Louise Sabrina Murugi Ngonge
- Supervisor: Mr. Martin Kibe

## 🎯 Future Enhancements

- [ ] Admin dashboard analytics
- [ ] Seller inventory management
- [ ] SMS notifications
- [ ] Email notifications
- [ ] Advanced search with Elasticsearch
- [ ] Multi-currency support
- [ ] Seller analytics

---

**Last Updated**: 2026-04-18
**API Version**: 1.0.0
