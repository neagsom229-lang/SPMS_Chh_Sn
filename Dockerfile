# Root Dockerfile (at spms-dashboard/Dockerfile)
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm ci --only=production

# Copy backend source code
COPY backend/ ./backend/

# Copy database
COPY database/ ./database/

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]