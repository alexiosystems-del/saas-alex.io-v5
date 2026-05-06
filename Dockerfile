# --- Stage 1: Build Frontend ---
FROM node:18-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# Inject production environment variables for Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: Final Image ---
FROM node:18-slim
WORKDIR /app

# Install system dependencies for WhatsApp (Puppeteer/Baileys if needed)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Copy built frontend to the expected location for the server
COPY --from=client-builder /app/client/dist /app/client/dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose port
EXPOSE 10000

# Start server
CMD ["npm", "start"]
