# API Response Format Changes

## Summary
All API responses have been standardized to return data directly without wrapper objects.

## Changes Made

### Raw Materials Controller (`raw-materials.controller.ts`)
- **GET /raw-materials**: Returns array directly `[]` instead of `{ materials: [], pagination: {} }`
- **GET /raw-materials/:id**: Returns material object directly instead of `{ material: {} }`
- **POST /raw-materials**: Returns created material object directly instead of `{ material: {} }`
- **PUT /raw-materials/:id**: Returns updated material object directly instead of `{ material: {} }`

### Products Controller (`products.controller.ts`)
- **GET /products**: Returns array directly `[]` instead of `{ products: [], pagination: {} }`
- **GET /products/:id**: Returns product object directly instead of `{ product: {} }`
- **GET /products/sku/:sku**: Returns product object directly instead of `{ product: {} }`
- **POST /products**: Returns created product object directly instead of `{ product: {} }`
- **PUT /products/:id**: Returns updated product object directly instead of `{ product: {} }`

### Dashboard Controller (`dashboard.controller.ts`)
- **GET /dashboard/stats**: Returns stats object directly instead of `{ stats: {} }`
- **GET /dashboard/low-stock**: Kept as is (already returns structured data with products and rawMaterials)

### Production Requests Controller (`production-requests.controller.ts`)
- **GET /production-requests**: Returns array directly `[]` instead of `{ requests: [], pagination: {} }`
- **GET /production-requests/:id**: Returns request object directly instead of `{ request: {} }`
- **POST /production-requests**: Returns created request object directly instead of `{ request: {}, materialsCheck: {} }`
- **PUT /production-requests/:id**: Returns updated request object directly instead of `{ request: {} }`
- **POST /production-requests/:id/complete**: Returns completed request object directly instead of `{ request: {}, inventoryUpdates: {} }`

### Bill of Materials Controller (`bom.controller.ts`)
- **GET /bom/product/:productId**: Returns materials array directly `[]` instead of `{ productId, productName, materials: [] }`
- **POST /bom**: Returns created BOM entry directly instead of `{ bom: {} }`
- **PUT /bom/:id**: Returns updated BOM entry directly instead of `{ bom: {} }`

## Error Responses
All error responses remain consistent with the existing format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Note
Pagination information has been removed from list endpoints. If pagination is needed in the future, it can be added back using response headers (e.g., `X-Total-Count`, `X-Page`, `X-Per-Page`) or as a separate metadata endpoint.