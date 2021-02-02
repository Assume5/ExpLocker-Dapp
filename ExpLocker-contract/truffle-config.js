const HDWalletProvider = require("@truffle/hdwallet-provider");
mnemonic=''
module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, ''),
      network_id: 3,
      gas: 8000000,
      skipDryRun: true
    },
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    }
  },
  compilers: {
    solc: {
       version: "0.5.8"
    }
  }
};
