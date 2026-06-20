#!/bin/bash
set -e
echo "==> Installing Python dependencies"
pip install -r requirements.txt

echo "==> Building React frontend"
cd frontend
npm install
npm run build
cd ..

echo "==> Build complete"
