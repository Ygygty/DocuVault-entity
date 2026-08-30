#!/usr/bin/env bash
# ========================================================
# DocuVault Enterprise File Versioning (Offline Launcher)
# ========================================================

set -e

echo "========================================================"
echo "  DocuVault Enterprise File Versioning (Offline Mode)"
echo "========================================================"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org or via package manager."
    exit 1
fi

echo "[1/3] Node.js version $(node -v) detected."

# 2. Check npm & node_modules
if [ ! -d "node_modules" ]; then
    echo "[2/3] Installing dependencies..."
    npm install
else
    echo "[2/3] Dependencies already installed."
fi

# 3. Open browser in background
echo "[3/3] Starting DocuVault Standalone Server..."
echo "Opening http://localhost:3000 in your browser..."

(sleep 2 && (open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null || true)) &

npm run dev
