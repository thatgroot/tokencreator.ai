import { ethers } from "ethers";
import { IToken } from "..";
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}
export const HOST = "http://localhost";
export async function tokenIdea(prompt: string): Promise<{
  token?: IToken;
  error?: unknown;
}> {
  // fetch /generate-token return this object {token:IToken, error:any}
  const response = await fetch(`${HOST}/generate-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  const data: {
    token?: IToken;
    error?: unknown;
  } = await response.json();

  return data;
}

export async function verify(
  contract_address: string,
  token_name: string,
  file: string
) {
  try {
    const response = await fetch(`${HOST}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId: "97",
        contract_address,
        token_name,
        file,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    //
  }
}

export async function deploy(token: IToken) {
  function splitCamelCase(str: string) {
    return str.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  let data;
  try {
    const response = await fetch(`${HOST}/compile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet: "0x111111111",
        tokenName: token.contract_name,
        placeholders: {
          // remove all space from a string
          CONTRACT_NAME: token.contract_name,
          NAME: splitCamelCase(token.name),
          SYMBOL: token.ticker,
          SUPPLY: token.totalSupply,
          buy: token.taxRates.buy,
          sell: token.taxRates.sell,
          buyLimit: token.limits.buyLimit,
          sellLimit: token.limits.sellLimit,
          transferLimit: token.limits.transferLimit,
        },
      }),
    });

    data = await response.json();
    console.log("data", data);
    // fetch json from the file: abi_uri
  } catch (error) {
    console.error("Error:", error);
  }

  const { artifact, ...rest } = data;
  localStorage.setItem("rest", JSON.stringify(rest));

  const provider = new ethers.BrowserProvider(window.ethereum);
  // Set the signer ( MetaMask account)
  const signer = await provider.getSigner();

  // Deploy the contract
  const contract = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );
  const deployTransaction = await contract.deploy();

  const late = await deployTransaction.waitForDeployment();
  const contract_address = await late.getAddress();
  const receipt = await deployTransaction.waitForDeployment();

  const address = await receipt.getAddress();
  console.log("address", address);
  return contract_address;
}
