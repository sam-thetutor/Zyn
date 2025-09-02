import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  networks: {
    // Celo Alfajores Testnet
    "celo-alfajores": {
      url: process.env.CELO_ALFAJORES_RPC_URL || "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
      timeout: 60000,
    },
    // Celo Mainnet
    "celo": {
      url: process.env.CELO_RPC_URL || "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
      gasPrice: 50000000000, // 50 gwei
      timeout: 60000,
    },
    // Base Mainnet (commented out for now)
    // base: {
    //   url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 8453,
    //   gasPrice: 500000000, // 0.5 gwei - reduced from 1 gwei
    //   timeout: 60000,
    // },
    // Base Sepolia Testnet (for testing)
    // "base-sepolia": {
    //   url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 84532,
    //   gasPrice: 1000000000, // 1 gwei
    //   timeout: 60000,
    // },
    // Local development
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      "celo-alfajores": process.env.CELOSCAN_API_KEY || "",
      "celo": process.env.CELOSCAN_API_KEY || "",
      // base: process.env.BASESCAN_API_KEY || "",
      // "base-sepolia": process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celo-alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
      // {
      //   network: "base",
      //   chainId: 8453,
      //   urls: {
      //     apiURL: "https://api.basescan.org/api",
      //     browserURL: "https://basescan.org",
      //   },
      // },
      // {
      //   network: "base-sepolia",
      //   chainId: 84532,
      //   urls: {
      //     apiURL: "https://api-sepolia.basescan.org/api",
      //     browserURL: "https://sepolia.basescan.org",
      //   },
      // },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
