# Prediction Markets Smart Contract on Base Blockchain

A decentralized prediction markets smart contract built with Solidity and Hardhat, designed to run on the Base blockchain mainnet.

## 🚀 Features

- **Create Markets**: Users can create prediction markets with questions and end times
- **Trade Shares**: Buy and sell shares for Yes/No outcomes
- **Automatic Resolution**: Markets can be resolved by the contract owner
- **Fee System**: Configurable creation and trading fees
- **Security**: Built with OpenZeppelin contracts for security best practices
- **Base Blockchain**: Optimized for Base mainnet deployment

## 📁 Project Structure

```
├── contracts/
│   └── PredictionMarket.sol    # Main smart contract
├── scripts/
│   └── deploy.js               # Deployment script
├── test/                       # Test files (to be created)
├── hardhat.config.js           # Hardhat configuration
├── env.example                 # Environment variables template
├── package.json                # Dependencies
└── README-HARDHAT.md          # This file
```

## 🛠️ Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or another Web3 wallet
- Base ETH for gas fees
- BaseScan API key (optional, for contract verification)

## 📦 Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd zyn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Hardhat and required packages**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npm install @openzeppelin/contracts dotenv
   ```

## ⚙️ Configuration

1. **Copy environment template**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file with your values**
   ```bash
   # Required
   PRIVATE_KEY=your_private_key_here_without_0x_prefix
   BASE_RPC_URL=https://mainnet.base.org
   
   # Optional
   BASESCAN_API_KEY=your_basescan_api_key_here
   REPORT_GAS=true
   ```

3. **Get Base ETH**
   - Bridge ETH from Ethereum mainnet to Base
   - Or use Base faucet for testnet

## 🔧 Compilation

Compile the smart contracts:

```bash
npx hardhat compile
```

This will create the `artifacts/` directory with compiled contract data.

## 🧪 Testing

Run the test suite:

```bash
npx hardhat test
```

## 🚀 Deployment

### Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy.js --network base
```

### Deploy to Base Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network base-sepolia
```

### Deploy Locally

```bash
npx hardhat run scripts/deploy.js --network hardhat
```

## 📋 Deployment Output

The deployment script will output:
- Contract address
- Deployer address
- Transaction hash
- Contract ABI (saved to `deployments/` folder)
- BaseScan verification link

## 🔍 Contract Verification

After deployment, verify your contract on BaseScan:

1. Go to [BaseScan](https://basescan.org)
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Use the verification data from the deployment output

## 💰 Contract Functions

### Core Functions
- `createMarket(question, description, endTime)` - Create a new prediction market
- `buyShares(marketId, outcome)` - Buy shares for Yes/No outcome
- `sellShares(marketId, outcome, amount)` - Sell shares
- `resolveMarket(marketId, outcome)` - Resolve market (owner only)
- `claimWinnings(marketId)` - Claim winnings after resolution

### View Functions
- `getMarket(marketId)` - Get market details
- `getUserShares(marketId, user, outcome)` - Get user's shares
- `getTotalMarkets()` - Get total number of markets

### Admin Functions
- `setMarketCreationFee(newFee)` - Update creation fee
- `setTradingFee(newFee)` - Update trading fee
- `withdrawFees()` - Withdraw accumulated fees

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Access control for admin functions
- **Input Validation**: Comprehensive parameter checking
- **Safe Math**: Built-in overflow protection (Solidity 0.8+)
- **Fee Limits**: Maximum trading fee capped at 5%

## 🌐 Network Configuration

### Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Block Explorer**: https://basescan.org
- **Currency**: ETH

### Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Currency**: ETH

## 📊 Gas Optimization

The contract is optimized for gas efficiency:
- Solidity optimizer enabled (200 runs)
- Efficient data structures
- Minimal storage operations
- Batch operations where possible

## 🚨 Important Notes

1. **Never commit your private key** to version control
2. **Test thoroughly** on testnet before mainnet deployment
3. **Verify your contract** on BaseScan after deployment
4. **Keep your deployment keys secure**
5. **Monitor gas prices** on Base network

## 🆘 Troubleshooting

### Common Issues

1. **Insufficient Balance**
   - Ensure you have enough Base ETH for gas fees
   - Check your account balance: `npx hardhat balance --account 0`

2. **Network Connection Issues**
   - Verify RPC URL in `.env` file
   - Check network status at [Base Status](https://status.base.org)

3. **Compilation Errors**
   - Ensure all dependencies are installed
   - Check Solidity version compatibility

4. **Deployment Failures**
   - Verify private key format (no 0x prefix)
   - Check gas price settings
   - Ensure sufficient balance for deployment

## 📚 Additional Resources

- [Base Documentation](https://docs.base.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [BaseScan](https://basescan.org)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the contract source code for details.

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. The authors are not responsible for any financial losses or damages resulting from the use of this contract.

---

**Happy predicting on Base! 🎯**
