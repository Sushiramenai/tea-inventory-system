import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import { Box, Paper, Typography } from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Info as InfoIcon 
} from '@mui/icons-material';

interface DataTableProps<T extends { id: string }> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  onRowClick?: (row: T) => void;
  height?: number | string;
  toolbar?: boolean;
  title?: string;
  actions?: boolean;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onEdit,
  onDelete,
  onView,
  onRowClick,
  height = 600,
  toolbar = true,
  title,
  actions = true,
}: DataTableProps<T>) {
  const actionColumn: GridColDef = {
    field: 'actions',
    headerName: 'Actions',
    type: 'actions',
    width: 120,
    getActions: (params: GridRowParams<T>) => {
      const actions = [];
      if (onView) {
        actions.push(
          <GridActionsCellItem
            icon={<InfoIcon />}
            label="View Details"
            onClick={() => onView(params.row)}
          />
        );
      }
      if (onEdit) {
        actions.push(
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEdit(params.row)}
          />
        );
      }
      if (onDelete) {
        actions.push(
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => onDelete(params.row)}
            color="error"
          />
        );
      }
      return actions;
    },
  };

  const allColumns = actions && (onEdit || onDelete || onView) 
    ? [...columns, actionColumn]
    : columns;

  return (
    <Paper sx={{ width: '100%', height }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <DataGrid
        rows={rows || []}
        columns={allColumns}
        loading={loading}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize,
            },
          },
        }}
        pageSizeOptions={pageSizeOptions}
        onRowClick={(params) => onRowClick && onRowClick(params.row as T)}
        slots={toolbar ? { toolbar: GridToolbar } : {}}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: onRowClick ? 'pointer' : 'default',
          },
        }}
        disableRowSelectionOnClick
      />
    </Paper>
  );
}