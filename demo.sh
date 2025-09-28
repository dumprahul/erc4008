#!/bin/bash

# Demo script for 0G Contract Indexer

echo "🌟 0G Contract Indexer Demo"
echo "=========================="
echo ""

# Check if .env exists and has basic configuration
if [ ! -f .env ]; then
    echo "❌ .env file not found. Running setup first..."
    ./setup.sh
    echo ""
fi

# Check configuration
echo "📋 Current Configuration:"
echo "------------------------"
echo "RPC URL: $(grep OG_RPC_URL .env | cut -d'=' -f2)"
echo "Contracts: $(grep CONTRACT_ADDRESSES .env | cut -d'=' -f2)"
echo "Start Block: $(grep START_BLOCK .env | cut -d'=' -f2)"
echo "API Port: $(grep API_PORT .env | cut -d'=' -f2)"
echo ""

echo "⚠️  Note: The default contract addresses are examples."
echo "   Update .env with real contract addresses for actual indexing."
echo ""

echo "🚀 Starting the indexer in development mode..."
echo "   - Logs will be displayed in the console"
echo "   - API will be available at http://localhost:3000"
echo "   - Press Ctrl+C to stop"
echo ""

# Start the indexer
npm run dev