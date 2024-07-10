require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-toolbox");
const config = {
  solidity: {
    compilers: [{ version: "0.8.24" }, { version: "0.8.26" }],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    amoy: {
      url: `https://rpc-amoy.polygon.technology/`,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: "4SQ6123B47QF2QCPJYM1TPHIDR9X8E5DQV",
    },
  },
};
module.exports = config;
