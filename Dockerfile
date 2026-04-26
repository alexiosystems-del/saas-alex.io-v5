# Stage 1: Build the React Client
FROM node:20-alpine as client-builder
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm install

# Copy client source code
COPY client/ .
RUN npm run build


# Stage 2: Setup the Server
FROM node:20-alpine
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache ffmpeg git

# Create a non-root user and set permissions
RUN addgroup -S alexgroup && adduser -S alexuser -G alexgroup && \
    mkdir -p /app/server/sessions /app/server/uploads && \
    chown -R alexuser:alexgroup /app

# Copy server package files
COPY --chown=alexuser:alexgroup server/package*.json ./server/
RUN cd server && npm install

# Copy server source code
COPY --chown=alexuser:alexgroup server/ ./server/

# Copy built frontend assets from Stage 1
COPY --from=client-builder --chown=alexuser:alexgroup /app/client/build ./client/build

# Switch to non-root user
USER alexuser

WORKDIR /app/server

# Production environment
ENV NODE_ENV=production
ENV ALLOW_MOCK_AUTH=false

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "index.js"]
