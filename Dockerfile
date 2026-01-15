# Use Node.js LTS (Long Term Support) version
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files ensuring correct cache behavior
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (Frontend + Backend)
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
# Copy any other necessary files (e.g., migrations, public assets if any)
# server/index.ts is bundled to dist/index.cjs, but if there are other runtime needs:

# Expose the application port
EXPOSE 5000

# Start command
CMD ["npm", "run", "start"]
