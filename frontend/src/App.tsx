import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { RawMaterials } from './pages/RawMaterials';
import { ProductionRequests } from './pages/ProductionRequests';
import { Users } from './pages/Users';
import { UserRole } from './types';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green - tea theme
    },
    secondary: {
      main: '#8D6E63', // Brown - earth tone
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#F57C00',
    },
    info: {
      main: '#1976D2',
    },
    success: {
      main: '#388E3C',
    },
    background: {
      default: '#FAFAFA',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Roboto", sans-serif',
    },
    h2: {
      fontFamily: '"Roboto", sans-serif',
    },
    h3: {
      fontFamily: '"Roboto", sans-serif',
    },
    h4: {
      fontFamily: '"Roboto", sans-serif',
    },
    h5: {
      fontFamily: '"Roboto", sans-serif',
    },
    h6: {
      fontFamily: '"Roboto", sans-serif',
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route
                    path="/raw-materials"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.production, UserRole.admin]}>
                        <RawMaterials />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/production-requests" element={<ProductionRequests />} />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.admin]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;