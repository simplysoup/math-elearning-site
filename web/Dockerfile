# Stage 1: Build the app
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies (prefer yarn if available)
RUN npm install -g pnpm && \
    if [ -f yarn.lock ]; then yarn; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then pnpm i; \
    else npm install; fi

# Copy all files
COPY . .

# Build the Vite app
RUN npm run build

# Stage 2: Serve the app
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port and start
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]