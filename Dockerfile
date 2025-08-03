# Multi-stage Dockerfile for BoxdBuddies Tauri App

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Build the Rust backend
FROM rust:1.75 AS backend-builder

# Install system dependencies for Tauri
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock* ./
COPY src-tauri ./src-tauri

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Build the Tauri app (this will create a bundle, not a runnable binary for containers)
# Note: This is mainly for CI/CD purposes as Tauri apps are typically distributed as desktop apps
RUN cd src-tauri && cargo build --release

# Stage 3: Development environment (for development use)
FROM node:18-alpine AS development

# Install Rust
RUN apk add --no-cache curl build-base
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install system dependencies (Alpine equivalents)
RUN apk add --no-cache \
    webkit2gtk-dev \
    gtk+3.0-dev \
    libayatana-appindicator3-dev \
    librsvg-dev \
    openssl-dev

WORKDIR /app

# Copy source code
COPY . .

# Install Node.js dependencies
RUN npm ci

# Expose the Vite dev server port
EXPOSE 1420

# Default command for development
CMD ["npm", "run", "dev"]

# Stage 4: Production image (minimal runtime)
FROM alpine:latest AS production

# This stage is mainly for demonstration - Tauri apps typically run as desktop applications
# You might use this for serving built assets or running in a headless environment

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy built assets
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/src-tauri/target/release ./release

# Serve the built frontend (if needed for web deployment)
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
