# Stage 1: Build frontend with Node.js
FROM node:20 AS frontend-builder

WORKDIR /app

# Copy only the necessary files first to leverage cache (package.json and package-lock.json)
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Install dependencies (npm install is cached unless package.json changes)
RUN npm install

# Install axios and other global dependencies here, rather than installing separately
RUN npm install axios --save

# Install react-quill-new for rich text editor (fork supporting React 19)
RUN npm install react-quill-new --save

# Copy only the necessary source files after installing dependencies
COPY ./frontend /app

# Build the frontend
RUN npm run build

# Stage 2: Serve frontend with Nginx
FROM nginx:alpine

# Copy built frontend files from the previous stage
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
