#!/bin/bash

# Example API usage for the 0G Contract Indexer

BASE_URL="http://localhost:3000/api"

echo "🔍 0G Contract Indexer API Examples"
echo "=================================="

# Check if server is running
echo "📡 Checking server status..."
curl -s "${BASE_URL}/../health" | jq '.' || {
    echo "❌ Server is not running. Please start the indexer first with 'npm start'"
    exit 1
}

echo ""
echo "📊 Getting overall statistics..."
curl -s "${BASE_URL}/stats" | jq '.'

echo ""
echo "🏗️  Getting tracked contracts..."
curl -s "${BASE_URL}/contracts" | jq '.'

echo ""
echo "📦 Getting latest blocks..."
curl -s "${BASE_URL}/blocks?limit=5" | jq '.'

echo ""
echo "💰 Getting latest transactions..."
curl -s "${BASE_URL}/transactions?limit=5" | jq '.'

echo ""
echo "🎯 Getting latest events..."
curl -s "${BASE_URL}/events?limit=5" | jq '.'

echo ""
echo "📈 Getting event statistics for last 24 hours..."
curl -s "${BASE_URL}/events/stats?timeframe=24h" | jq '.'

echo ""
echo "🔍 Example: Getting events for a specific contract (replace with actual address)..."
# Replace with an actual contract address from your indexer
CONTRACT_ADDRESS="0x1234567890abcdef1234567890abcdef12345678"
curl -s "${BASE_URL}/events/contract/${CONTRACT_ADDRESS}" | jq '.'

echo ""
echo "🔗 Getting transactions for a specific contract..."
curl -s "${BASE_URL}/transactions/contract/${CONTRACT_ADDRESS}" | jq '.'

echo ""
echo "⚡ Getting function calls for a specific contract..."
curl -s "${BASE_URL}/functions/contract/${CONTRACT_ADDRESS}" | jq '.'

echo ""
echo "✅ API examples completed!"
echo ""
echo "📚 For more endpoints, visit: ${BASE_URL}/docs"