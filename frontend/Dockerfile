# Frontend Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY public ./public
COPY src ./src
COPY tsconfig.json ./

# Build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_NAME
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_NAME=$REACT_APP_NAME

# Build the app
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]