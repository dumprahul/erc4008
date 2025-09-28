#!/bin/bash

# 0G Contract Indexer Setup Script

echo "🚀 Setting up 0G Contract Indexer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or later is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p logs

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before starting the indexer"
fi

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your 0G network RPC URL and contract addresses"
echo "2. Run 'npm start' to start the indexer"
echo "3. The API will be available at http://localhost:3000"
echo ""
echo "📚 For more information, see README.md"