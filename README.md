# Senbird Tea Inventory Management System

A comprehensive inventory management system designed for tea companies, featuring product tracking, raw material management, production requests, and bill of materials management.

## Features

### Core Functionality
- **Product Inventory Management**: Track finished tea products with SKU, stock levels, and reorder points
- **Raw Material Tracking**: Manage tea leaves, packaging materials, and supplies
- **Bill of Materials (BOM)**: Define material requirements for each product
- **Production Requests**: Create and track production orders with material availability checks
- **Stock Adjustments**: Adjust inventory with full audit trail and reason tracking
- **Role-Based Access Control**: Admin, Production, and Fulfillment roles

### Recent Additions
- **Shopify Integration**: Sync orders and update inventory (ready for API credentials)
- **Stock Adjustment System**: Track all inventory changes with reasons and audit trail
- **Material Requirements Planning**: Automatic material availability checking
- **Export Functionality**: Export data to CSV format

## Tech Stack

### Frontend
- React 18 with TypeScript
- Material-UI for components
- React Query for data fetching
- React Hook Form for form management
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite database (easily switchable to PostgreSQL/MySQL)
- Session-based authentication
- Zod for validation

## Quick Start

### Prerequisites
- Node.js 20.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tea-inventory-system.git
cd tea-inventory-system
```

2. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

3. Set up the database:
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

4. Start the development servers:

**Option 1 - Using the deploy script (recommended):**
```bash
npm start
```

**Option 2 - Manual start:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

5. Access the application at http://localhost:3000

### Default Login Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Production**: username: `production`, password: `production123`
- **Fulfillment**: username: `fulfillment`, password: `fulfillment123`

⚠️ **Important**: Change these passwords immediately in production!

## Deployment

### Replit Deployment

1. Import this repository to Replit
2. The system will automatically detect and run the deployment script
3. Set environment variables in Replit Secrets:
   - `SESSION_SECRET`: Your session secret
   - `NODE_ENV`: Set to "production"
   - `DATABASE_URL`: Your database connection string (if not using SQLite)

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Required
SESSION_SECRET=your-secret-key-here
NODE_ENV=development

# Optional
DATABASE_URL=file:./dev.db
PORT=3001

# Shopify Integration (when ready)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=your-access-token
```

## Project Structure

```
tea-inventory-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
├── deploy.sh
└── README.md
```

## API Documentation

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout current session
- `GET /api/auth/session` - Get current user session

### Products
- `GET /api/products` - List products with pagination
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Raw Materials
- `GET /api/raw-materials` - List materials with pagination
- `POST /api/raw-materials` - Create new material
- `PUT /api/raw-materials/:id` - Update material
- `DELETE /api/raw-materials/:id` - Delete material

### Production Requests
- `GET /api/production-requests` - List requests
- `POST /api/production-requests` - Create new request
- `PUT /api/production-requests/:id` - Update request status
- `POST /api/production-requests/:id/complete` - Complete production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software for Senbird Tea Company.

## Support

For support, please contact the development team or create an issue in the repository.