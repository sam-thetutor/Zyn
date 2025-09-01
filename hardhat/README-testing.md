# 🧪 Testing Scripts for Claim Functionality

This directory contains comprehensive testing scripts for the PredictionMarket smart contract's claim functionality.

## 📁 Available Scripts

### 1. `test-claim-functionality.js` - Basic Test
A comprehensive test that covers the complete claim flow:
- Market creation
- User trading (YES/NO shares)
- Market resolution
- Claiming winnings
- Balance verification

### 2. `test-claim-advanced.js` - Advanced Test
An enhanced version that includes:
- Time manipulation (fast-forwarding)
- Edge case testing
- Double claim prevention
- Late trading prevention
- Double resolution prevention
- Detailed analytics and calculations

## 🚀 How to Run

### Prerequisites
- Hardhat environment configured
- Celo Alfajores testnet configured
- Sufficient CELO balance in admin account

### Basic Test
```bash
npx hardhat run scripts/test-claim-functionality.js --network celo-alfajores
```

### Advanced Test
```bash
npx hardhat run scripts/test-claim-advanced.js --network celo-alfajores
```

## 🎯 Test Flow

### Phase 1: Setup
1. **Deploy Contract**: Deploy PredictionMarket to testnet
2. **Fund Users**: Send CELO from admin to test users
3. **Create Market**: Admin creates a market with 2-minute end time

### Phase 2: Trading
1. **User 2**: Buys NO shares (0.05 CELO)
2. **User 1**: Buys YES shares (0.05 CELO)
3. **Verify**: Check market state and user shares

### Phase 3: Resolution
1. **Wait/Forward**: Market ends (or time is fast-forwarded)
2. **Admin Resolve**: Admin resolves market as NO outcome
3. **Verify**: Check market status and claimable amounts

### Phase 4: Claiming
1. **User 2 Claims**: User 2 claims winnings (won the bet)
2. **Verify**: Check final balances and claim status
3. **Edge Cases**: Test double claims, late trading, etc.

## 📊 Expected Results

### Market Creation
- Market ID: 1
- Question: "Will the price of CELO reach $1 by the end of this test?"
- End Time: 2 minutes from creation
- Status: ACTIVE

### Trading Results
- Total Pool: ~0.1 CELO (minus fees)
- User 2: 0.05 CELO in NO shares
- User 1: 0.05 CELO in YES shares

### Resolution
- Outcome: NO
- Status: RESOLVED
- User 2: Can claim winnings
- User 1: No claimable amount (lost bet)

### Claim Results
- User 2: Receives proportional winnings from total pool
- User 1: No winnings (lost the bet)
- Double claims: Rejected
- Late trading: Rejected

## 🔧 Customization

### Modify Test Parameters
- **Market Duration**: Change `endTime` calculation
- **Trade Amounts**: Modify `buyAmount` values
- **Market Question**: Update `marketQuestion` and related fields
- **Network**: Change `--network` parameter

### Add New Tests
- Copy existing script structure
- Modify market parameters
- Add new test scenarios
- Include additional verification steps

## ⚠️ Important Notes

1. **Network**: Scripts are configured for Celo Alfajores testnet
2. **Gas**: Ensure sufficient gas for all transactions
3. **Balances**: Admin account needs enough CELO for deployment and funding
4. **Timing**: Basic script waits for natural time progression
5. **Edge Cases**: Advanced script tests error conditions and rejections

## 🐛 Troubleshooting

### Common Issues
- **Insufficient Balance**: Ensure admin has enough CELO
- **Network Issues**: Check Celo Alfajores RPC connection
- **Gas Estimation**: Let Hardhat estimate gas automatically
- **Contract Errors**: Verify contract compilation and deployment

### Debug Mode
Add console.log statements to track execution flow:
```javascript
console.log("Debug: Current step", stepName);
console.log("Debug: Contract state", await contract.getState());
```

## 📈 Performance Metrics

The scripts provide comprehensive metrics:
- Transaction hashes for all operations
- Balance changes before/after each action
- Market state transitions
- User participation verification
- Claim status tracking
- Error handling validation

## 🎉 Success Criteria

A successful test run should show:
- ✅ All transactions completed successfully
- ✅ Market created and resolved correctly
- ✅ Winnings claimed successfully
- ✅ Edge cases properly rejected
- ✅ All balances updated correctly
- ✅ No unexpected errors or failures
