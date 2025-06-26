# Tea Inventory Management System

A web-based inventory management system designed for an e-commerce tea brand, enabling fulfillment and production teams to track inventory, manage raw materials, and coordinate production requests.

## 🚀 One-Click Deploy

Deploy your own Tea Inventory System in seconds:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**After clicking:**
1. Connect your GitHub account
2. Fork this repo automatically  
3. Click "Apply" 
4. Your app will be live in ~5 minutes!

## Features

- **Role-based Access Control**: Admin, Fulfillment, and Production team roles
- **Product Inventory Management**: Track finished products with multiple size formats
- **Raw Materials Tracking**: Monitor raw tea, tins, labels, and packaging materials
- **Production Request Workflow**: Automated material requirement calculation and inventory updates
- **Bill of Materials (BoM)**: Define material requirements for each product
- **Low Stock Alerts**: Automatic warnings when inventory falls below thresholds
- **CSV Export**: Export inventory data for reporting

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM
- **Frontend**: React, TypeScript, Material-UI
- **Authentication**: Session-based with express-session
- **Deployment**: Optimized for cloud hosting (Railway, Vercel, etc.)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tea-inventory-system
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up the database:
   - Create a PostgreSQL database
   - Copy `.env.example` to `.env` in the backend directory
   - Update the `DATABASE_URL` in `.env` with your database credentials

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed the database (optional):
```bash
cd backend && npm run prisma:seed
```

## Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Backend API on http://localhost:3001
- Frontend on http://localhost:3000

## Project Structure

```
tea-inventory-system/
├── backend/
│   ├── prisma/           # Database schema and migrations
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── server.ts     # Express app setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── App.tsx       # Main app component
│   └── package.json
├── docs/                 # Documentation
└── package.json          # Root package.json
```

## API Documentation

See [API Documentation](docs/API_DOCUMENTATION.md) for detailed endpoint information.

## Database Schema

See [Database Schema](docs/DATABASE_SCHEMA.sql) for the complete database structure.

## Deployment

### Backend Deployment (Railway/Render)

1. Set environment variables on your hosting platform
2. Deploy using the platform's GitHub integration
3. Run database migrations after deployment

### Frontend Deployment (Vercel/Netlify)

1. Set the API URL environment variable
2. Deploy using the platform's GitHub integration

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3001)
- `SESSION_SECRET`: Secret for session encryption
- `NODE_ENV`: Environment (development/production)

### Frontend
- `REACT_APP_API_URL`: Backend API URL (production only)

## License

Private - All rights reserved