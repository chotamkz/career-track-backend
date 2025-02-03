# Dockerfile for frontend
FROM node:16 AS frontend-builder

WORKDIR /app

# Copy package.json and package-lock.json if available
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files
COPY ./frontend .

# Expose the port (if applicable)
EXPOSE 3000

# Command to run the frontend app
CMD ["npm", "start"]
