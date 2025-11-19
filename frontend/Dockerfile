# Multi-stage build for Tailwind CSS
FROM node:18-alpine AS build

# Set working directory
WORKDIR /ap

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY . .

# Build Tailwind CSS
RUN npm run build-css-prod

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from build stage
COPY --from=build /app /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
