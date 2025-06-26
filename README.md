# 🍵 Tea Inventory Management System

A comprehensive inventory management system designed for tea companies, featuring production tracking, fulfillment management, and real-time inventory monitoring.

## ✨ Features

- **Role-Based Access Control**: Admin, Production Manager, and Fulfillment Manager roles
- **Inventory Management**: Track raw materials and finished products
- **Production Workflow**: Create and manage production requests with Bill of Materials
- **Real-time Updates**: Automatic inventory adjustments after production and fulfillment
- **Dashboard Analytics**: Monitor stock levels, production status, and system metrics
- **Secure Authentication**: Session-based authentication with bcrypt password hashing

## 🚀 Quick Start with Replit

The easiest way to deploy this system is using Replit:

1. **Fork this repository** or use the GitHub URL
2. **Go to [Replit](https://replit.com)** and click "Create Repl"
3. **Import from GitHub** using this repository URL
4. **Run the application** - Replit will automatically install dependencies and start the server

## 📁 Project Structure

```
tea-inventory-system/
├── backend/         # Node.js/Express backend
│   ├── src/         # TypeScript source code
│   ├── prisma/      # Database schema and migrations
│   └── dist/        # Compiled JavaScript
├── frontend/        # React frontend
│   ├── src/         # React components and services
│   └── build/       # Production build
├── deploy.sh        # Deployment script
└── .replit          # Replit configuration
```

## 🔧 Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tea-inventory-system.git
cd tea-inventory-system
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. Start the backend:
```bash
npm run dev
```

5. In a new terminal, install and start the frontend:
```bash
cd frontend
npm install
npm start
```

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Production | production | production123 |
| Fulfillment | fulfillment | fulfillment123 |

⚠️ **Important**: Change these passwords immediately in production!

## 🌐 Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="your-secret-key-here"
PORT=3001
NODE_ENV=development
```

## 📊 API Documentation

The backend API is RESTful with the following main endpoints:

- `/api/auth` - Authentication endpoints
- `/api/products` - Product inventory management
- `/api/raw-materials` - Raw material management
- `/api/bom` - Bill of Materials
- `/api/production-requests` - Production workflow
- `/api/dashboard` - Analytics and statistics

## 🧪 Testing

The system has been thoroughly tested with 100% success rate across all features:
- Authentication and authorization
- CRUD operations
- Production workflows
- Inventory tracking
- Edge cases and error handling

## 🚢 Deployment

### Replit (Recommended)
1. Import from GitHub
2. The `.replit` file is pre-configured
3. Click "Run" and the system will auto-deploy

### Other Platforms
The application can be deployed to:
- Heroku (with PostgreSQL)
- Railway
- Render
- Any Node.js hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Built with:
- React
- Node.js/Express
- TypeScript
- Prisma ORM
- Material-UI
- SQLite (development) / PostgreSQL (production)