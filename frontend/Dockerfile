# Stage 1: Build frontend with Node.js
FROM node:20 AS frontend-builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files
COPY ./frontend ./

# Build the frontend
RUN npm run build

# Stage 2: Serve frontend with Nginx
FROM nginx:alpine

# Copy built frontend files from the previous stage
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# Expose port 80 (Nginx default port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]