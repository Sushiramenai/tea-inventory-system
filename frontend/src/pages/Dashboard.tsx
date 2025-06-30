import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Science as ScienceIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardStats } from '../types';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get<DashboardStats>('/dashboard/stats');
      setStats(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return null;
  }

  const StatCard: React.FC<{
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 1,
              p: 1,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.products.total}
            icon={<InventoryIcon color="primary" />}
            color="primary"
            onClick={() => navigate('/products')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Products"
            value={stats.products.lowStock}
            subtitle={stats.products.lowStock > 0 ? 'Need attention' : 'All good'}
            icon={<WarningIcon color="warning" />}
            color="warning"
            onClick={() => navigate('/products?lowStock=true')}
          />
        </Grid>
        {stats.rawMaterials && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Raw Materials"
                value={stats.rawMaterials.total}
                icon={<ScienceIcon color="secondary" />}
                color="secondary"
                onClick={() => navigate('/raw-materials')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Low Stock Materials"
                value={stats.rawMaterials.lowStock}
                subtitle={stats.rawMaterials.lowStock > 0 ? 'Need reorder' : 'Stock healthy'}
                icon={<WarningIcon color="error" />}
                color="error"
                onClick={() => navigate('/raw-materials?lowStock=true')}
              />
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Production Requests
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="warning.main">
                    {stats.productionRequests.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="info.main">
                    {stats.productionRequests.inProgress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="success.main">
                    {stats.productionRequests.completedToday}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Today
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Box mt={2} textAlign="center">
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/production-requests')}
              >
                View All Requests
              </Button>
            </Box>
          </Paper>
        </Grid>

        {stats.recentProductUpdates && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Product Updates
              </Typography>
              <List>
                {stats.recentProductUpdates.slice(0, 5).map((product) => (
                  <ListItem key={product.id} divider>
                    <ListItemText
                      primary={product.teaName}
                      secondary={`${product.quantitySize} - Stock: ${Number(product.physicalCount).toLocaleString()}`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {stats.recentMaterialUpdates && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Material Updates
              </Typography>
              <List>
                {stats.recentMaterialUpdates.slice(0, 5).map((material) => (
                  <ListItem key={material.id} divider>
                    <ListItemText
                      primary={material.itemName}
                      secondary={`${Number(material.totalQuantity).toLocaleString()} ${material.unit}`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(material.updatedAt).toLocaleDateString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};