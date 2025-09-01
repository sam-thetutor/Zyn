const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying updated PredictionMarketClaims contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");

  // Get the existing core contract address from deployment
  const coreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6"; // Celo Mainnet Core Contract
  
  console.log("Using core contract address:", coreContractAddress);

  // Deploy the updated claims contract
  const PredictionMarketClaims = await ethers.getContractFactory("PredictionMarketClaims");
  const claimsContract = await PredictionMarketClaims.deploy(coreContractAddress);
  
  await claimsContract.waitForDeployment();
  
  console.log("✅ PredictionMarketClaims deployed to:", await claimsContract.getAddress());
  
  // Update the core contract to use the new claims contract
  console.log("🔄 Updating core contract to use new claims contract...");
  
  const coreContract = await ethers.getContractAt("PredictionMarketCore", coreContractAddress);
  
  try {
    const tx = await coreContract.setClaimsContract(await claimsContract.getAddress());
    await tx.wait();
    console.log("✅ Core contract updated successfully!");
  } catch (error) {
    console.log("⚠️  Warning: Could not update core contract automatically");
    console.log("   You may need to update it manually with address:", await claimsContract.getAddress());
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: "celo_mainnet",
    claimsContract: await claimsContract.getAddress(),
    coreContract: coreContractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("Network:", deploymentInfo.network);
  console.log("Claims Contract:", deploymentInfo.claimsContract);
  console.log("Core Contract:", deploymentInfo.coreContract);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Timestamp:", deploymentInfo.timestamp);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("Please update the frontend with the new claims contract address:", deploymentInfo.claimsContract);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
