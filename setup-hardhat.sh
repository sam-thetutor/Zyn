#!/bin/bash

echo "🚀 Setting up Hardhat Prediction Markets Project for Base Blockchain"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js version $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version $(npm -v) detected"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  IMPORTANT: Please edit .env file with your actual values!"
    echo "   - Set your PRIVATE_KEY (without 0x prefix)"
    echo "   - Set your BASE_RPC_URL"
    echo "   - Optionally set BASESCAN_API_KEY"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Hardhat and required packages
echo "🔧 Installing Hardhat and development dependencies..."
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv

# Compile contracts
echo "🔨 Compiling smart contracts..."
npx hardhat compile

if [ $? -eq 0 ]; then
    echo "✅ Contracts compiled successfully!"
else
    echo "❌ Contract compilation failed. Please check the errors above."
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npx hardhat test

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Please check the errors above."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your private key and RPC URL"
echo "   2. Get some Base ETH for deployment"
echo "   3. Deploy to testnet: npx hardhat run scripts/deploy.js --network base-sepolia"
echo "   4. Deploy to mainnet: npx hardhat run scripts/deploy.js --network base"
echo ""
echo "📚 For more information, see README-HARDHAT.md"
echo ""
echo "🔒 Remember: Never commit your .env file or private keys!"
