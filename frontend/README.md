# BodaZone Frontend

React-based frontend for the BodaZone e-commerce platform for motorbike spare parts.

## 🚀 Getting Started

### Prerequisites
- Node.js v14+ and npm

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── context/        # React context (Auth, Cart)
│   ├── services/       # API services
│   ├── App.js          # Main app component
│   ├── index.js        # Entry point
│   └── index.css       # Global styles
└── package.json
```

## 🎨 Key Components

### Pages
- **LoginPage**: User authentication
- **ProductsPage**: Product browsing with filters
- **HomePage**: Landing page (to be expanded)

### Components
- **Navigation**: Top navigation bar with cart and user menu

### Context
- **AuthContext**: Authentication state management
- **CartContext**: Shopping cart state management

## 🔧 Features

- ✅ User Authentication (Login/Register)
- ✅ Product Browsing & Filtering
- ✅ Shopping Cart
- ✅ Responsive Design
- ✅ Mobile-friendly Navigation

## 📦 Available Scripts

### Start Development
```bash
npm start
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## 🎯 To-Do Features

- [ ] Product Details Page
- [ ] Shopping Cart Checkout
- [ ] Order History
- [ ] Payment Integration
- [ ] Delivery Tracking
- [ ] Product Reviews
- [ ] User Profile Management
- [ ] Seller Dashboard

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🛠️ Tech Stack

- React 18
- React Router v6
- Tailwind CSS
- Axios
- React Icons

## 📝 Code Style

- Use functional components with hooks
- Keep components small and reusable
- Use consistent naming conventions
- Add PropTypes for components

## 🐛 Troubleshooting

**CORS Errors**: Ensure backend is running on `http://localhost:5000`

**API Connection Issues**: Check `REACT_APP_API_URL` in `.env`

**Port Already in Use**: Change port with `PORT=3001 npm start`

## 📞 Support

For issues or questions, contact the development team.

---

**Last Updated**: 2026-04-18
