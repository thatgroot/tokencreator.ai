import type { Request, Response } from "express";
import hre from "hardhat";
import { contractVerification, getFileContent } from "../../utils";
import { join } from "path";

interface VerifyContractParams {
  apiKey: string;
  chainId: number;
  contractAddress: string;
  contractName: string;
  sourceCode: string;
  compilerVersion: string;
  codeFormat?: string;
  constructorArguments?: any[];
}

interface CheckVerificationStatusParams {
  apiKey: string;
  guid: string;
}

async function verifyContract({
  apiKey,
  chainId,
  contractAddress,
  contractName,
  sourceCode,
  compilerVersion,
  codeFormat = "solidity-standard-json-input",
  constructorArguments = [],
}: VerifyContractParams): Promise<string | null> {
  const url = "https://api.etherscan.io/api";

  // ABI encode the constructor arguments if provided
  // let encodedConstructorArgs = '';
  // if (constructorArguments.length > 0) {
  //   const abi = [
  //     // Replace this with the actual ABI definition of your contract
  //     "constructor(address _owner, uint256 _value)"
  //   ];
  //   const iface = new ethers.utils.Interface(abi);
  //   encodedConstructorArgs = iface.encodeDeploy(constructorArguments).slice(2);
  // }

  const params = new URLSearchParams({
    module: "contract",
    action: "verifysourcecode",
    apikey: apiKey,
    chainId: chainId.toString(),
    contractaddress: contractAddress,
    contractname: contractName,
    sourceCode: sourceCode,
    codeformat: codeFormat,
    compilerversion: compilerVersion,
    constructorArguments: "",
    licenseType: "3",
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      body: params,
    });

    const data = await response.json();

    if (data.status === "1") {
      console.log("Verification submitted successfully. GUID:", data.result);
      return data.result; // Return the GUID for checking status later
    } else {
      console.error("Verification failed:", data.result);
      return null;
    }
  } catch (error: any) {
    console.error("Error verifying contract:", error.message);
    return null;
  }
}

async function checkVerificationStatus({
  apiKey,
  guid,
}: CheckVerificationStatusParams): Promise<void> {
  const url = "https://api.etherscan.io/api";

  const params = new URLSearchParams({
    module: "contract",
    action: "checkverifystatus",
    guid: guid,
    apikey: apiKey,
  });

  try {
    const response = await fetch(url + "?" + params.toString());

    const data = await response.json();

    if (data.status === "1") {
      console.log("Verification status:", data.result);
    } else {
      console.error("Verification status check failed:", data.result);
    }
  } catch (error: any) {
    console.error("Error checking verification status:", error.message);
  }
}

export const VerificatoinController = {
  verify: async (req: Request, res: Response) => {
    const { chainId, contract_address, token_name, file } = req.body; // For Binance Testnet
    const contractName = `${token_name}.sol:${token_name}`;

    const content = await getFileContent(file);

    const sourceCode = JSON.stringify({
      language: "Solidity",
      sources: {
        [`${token_name}.sol`]: {
          content,
        },
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    });
    contractVerification
      .verify({
        apiKey:
          process.env.ETHER_SCAN_API_KEY ??
          "UF4393F2AE87FC4DPT3AJHSZ154ZVTBG39",
        chainId: chainId,
        contractAddress: contract_address,
        contractName: contractName,
        sourceCode: sourceCode,
        compilerVersion:
          process.env.SOLIDITY_COMPILER_VERSION ?? "v0.8.26+commit.8a97fa7a",
      })
      .then((data) => {
        if (data.error) {
          res.status(500).send({ error: JSON.stringify(data) });
        } else {
          res.status(200).send({ ...data });
        }
      })
      .catch((error: any) => {
        console.error("Error verifying contract:", error.message);
        res.status(500).send({ error: JSON.stringify(error) });
      });
  },

  status: (req: Request, res: Response) => {
    contractVerification
      .status({
        guid: req.query.guid as string,
      })
      .then((data) => {
        res.status(200).send({ ...data });
      })
      .catch((error: any) => {
        console.error("Error checking verification status:", error.message);
        res.status(500).send({ error: JSON.stringify(error) });
      });
  },
};
