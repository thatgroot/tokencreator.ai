import type { Response, Request } from "express";
// @ts-ignore
import solc from "solc";
import fs from "fs-extra";
import { join } from "path";
require("dotenv").config();
export interface IToken {
  name: string;
  ticker: string;
  totalSupply: string;
  decimals: number;
  taxRates: {
    buy: number;
    sell: number;
  };
  description: string;
  potentialUseCases: string;
  targetAudience: string;
  tokenomics: Array<{
    bucket: string;
    percentage: number;
  }>;
  limits: {
    buyLimit: number;
    sellLimit: number;
    transferLimit: number;
  };
  protection: {
    sniperProtection: boolean;
    whitelisting: boolean;
  };
  Logo: {
    theme: string;
    aspectRatio: string;
    designConcept: string;
  };
}
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

// Function to replace placeholders in the contract
function replacePlaceholders(
  contract: string,
  values: { [key: string]: any }
): string {
  return Object.entries(values).reduce((replacedContract, [key, value]) => {
    const placeholder = new RegExp(`<${key}>`, "g");
    // if placeholder is CONTRACT_NAME remove all spaces from the value
    return replacedContract.replace(placeholder, value);
  }, contract);
}

export function getFilePath(req: Request) {
  const fileName = req.params.fileName;
  return `${__dirname}/compiled/${fileName}`;
}

//  read solidity file contente from the path returned by getFilePath and return the content
export async function getFileContent(file: string) {
  return await fs.readFile(join(__dirname, "compiled", file), "utf8");
}

export function getAbi(req: Request) {
  const fileName = req.params.fileName;
  const abi = `${__dirname}/artifacts/${fileName}`;
  console.log("abi", abi);
  return abi;
}
// Function to compile Solidity contract
async function compileContract(
  contractSource: string,
  contractFilename: string
) {
  const input = {
    language: "Solidity",
    sources: {
      [contractFilename]: {
        content: contractSource,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "": ["ast"],
          "*": [
            "abi",
            "metadata",
            "devdoc",
            "userdoc",
            "storageLayout",
            "evm.legacyAssembly",
            "evm.bytecode",
            "evm.deployedBytecode",
            "evm.methodIdentifiers",
            "evm.gasEstimates",
            "evm.assembly",
          ],
        },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    throw new Error(
      output.errors.map((err: any) => err.formattedMessage).join("\n")
    );
  }

  const outputDir = join(__dirname, "artifacts", "contracts", contractFilename);

  // Ensure the output directory exists
  await fs.ensureDir(outputDir);

  // Define file paths for ABI and bytecode
  const output_file = join(outputDir, `${contractFilename}.json`);
  // Write ABI and bytecode to files
  await fs.writeFile(output_file, JSON.stringify(output), "utf8");
  const nameRegex = /-([^-\d]+)\.sol/;
  const contract_name = contractFilename.match(nameRegex)![1];
  console.log("contractFilename", contractFilename);
  return {
    file: `${contractFilename}.json`,
    standard_json: input,
    artifact: {
      abi: output.contracts[contractFilename][contract_name].abi,
      bytecode: output.contracts[contractFilename][contract_name].evm.bytecode,
    },
  };
}

// Endpoint to compile Solidity file
export async function readAndCompileContract(res: Response, req: Request) {
  const { wallet, tokenName, placeholders } = req.body;
  if (!wallet || !tokenName || !placeholders) {
    return {
      error: "Wallet address, token name, and placeholders are required.",
    };
  }

  const currentTimestamp = Date.now();
  const contract_file_path = `${wallet}-${currentTimestamp}-${tokenName}.sol`;
  const contract_file_name = `${tokenName}.sol`;
  const compiled_path = join(__dirname, "compiled", contract_file_path);

  try {
    const template_contract = join(__dirname, "contracts", "Token2022.sol");
    const contractTemplate = await fs.readFile(template_contract, "utf8");

    // Replace placeholders and write updated contract
    const updatedContract = replacePlaceholders(contractTemplate, placeholders);

    await fs.outputFile(compiled_path, updatedContract);

    // Compile contract
    const { file, artifact } = await compileContract(
      updatedContract,
      contract_file_path
    );

    return {
      name: tokenName,
      file: contract_file_path,
      contract: `${req.protocol}://${req.get(
        "host"
      )}/contracts/${contract_file_path}`,
      abi: `${req.protocol}://${req.get("host")}/abi/${file}`,
      error: null,
      artifact,
    };
  } catch (err: any) {
    console.error("Error:", err.message);
    return { error: `Error: ${err.message}` };
  }
}

export const contractVerification = {
  async verify(params: VerifyContractParams): Promise<
    | {
        status: number | string;
        message: string;
        result: string;
        error: null;
      }
    | {
        status: null;
        message: null;
        result: null;
        error: string;
      }
  > {
    const {
      apiKey,
      chainId,
      contractAddress,
      contractName,
      sourceCode,
      compilerVersion,
      codeFormat = "solidity-standard-json-input",
      constructorArguments = [],
    } = params;

    const apiUrl = "https://api.etherscan.io/api";

    console.log('contractName', contractName)
    const requestParams = new URLSearchParams({
      module: "contract",
      action: "verifysourcecode",
      apikey: apiKey,
      chainId: chainId.toString(),
      contractaddress: contractAddress,
      contractname: contractName,
      sourceCode: sourceCode,
      codeformat: codeFormat,
      compilerversion: compilerVersion,
      constructorArguments: constructorArguments.length
        ? this.encodeConstructorArgs(constructorArguments)
        : "",
      licenseType: "3",
    });

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: requestParams,
      });
      const data = await response.json();
      return {
        ...data,
        error: null,
      }; // Return the GUID for checking status later
    } catch (error: any) {
      console.error("Error verifying contract:", error.message);
      return {
        error: JSON.stringify(error),
        status: null,
        message: null,
        result: null,
      };
    }
  },

  async status({
    guid,
  }: {
    guid: string;
  }): Promise<{ status: number | string; message: string; result: string }> {
    const apiUrl = "https://api.etherscan.io/api";
    const requestParams = new URLSearchParams({
      module: "contract",
      action: "checkverifystatus",
      guid: guid,
      apikey:
        process.env.ETHERSCAN_API_KEY ?? "UF4393F2AE87FC4DPT3AJHSZ154ZVTBG39",
    });

    try {
      const response = await fetch(`${apiUrl}?${requestParams.toString()}`);
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error checking verification status:", error.message);
      return { status: -1, message: error.message, result: "" };
    }
  },

  encodeConstructorArgs(constructorArguments: any[]): string {
    // Placeholder for ABI encoding logic
    // Replace with actual ABI definition and encoding logic
    return ""; // Replace with actual encoded constructor arguments
  },
};

// Example usage
const apiKey = "UF4393F2AE87FC4DPT3AJHSZ154ZVTBG39";
const chainId = 0x61; // For Binance Testnet
const contractAddress = "0x71F7A7C82aaA73449dAc6b8216192437563c2F5b";
const contractName = `QuantumQuartz.sol:QuantumQuartz`;

const sourceCode = JSON.stringify({
  language: "Solidity",
  sources: {
    "QuantumQuartz.sol": {
      content:
        '// SPDX-License-Identifier: MIT\n\npragma solidity ^0.8.24;\n\nlibrary SafeMath {\n    /**\n     * @dev Returns the addition of two unsigned integers, with an overflow flag.\n     *\n     * _Available since v3.4._\n     */\n    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {\n        unchecked {\n            uint256 c = a + b;\n            if (c < a) return (false, 0);\n            return (true, c);\n        }\n    }\n\n    /**\n     * @dev Returns the subtraction of two unsigned integers, with an overflow flag.\n     *\n     * _Available since v3.4._\n     */\n    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {\n        unchecked {\n            if (b > a) return (false, 0);\n            return (true, a - b);\n        }\n    }\n\n    /**\n     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.\n     *\n     * _Available since v3.4._\n     */\n    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {\n        unchecked {\n            // Gas optimization: this is cheaper than requiring \'a\' not being zero, but the\n            // benefit is lost if \'b\' is also tested.\n            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522\n            if (a == 0) return (true, 0);\n            uint256 c = a * b;\n            if (c / a != b) return (false, 0);\n            return (true, c);\n        }\n    }\n\n    /**\n     * @dev Returns the division of two unsigned integers, with a division by zero flag.\n     *\n     * _Available since v3.4._\n     */\n    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {\n        unchecked {\n            if (b == 0) return (false, 0);\n            return (true, a / b);\n        }\n    }\n\n    /**\n     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.\n     *\n     * _Available since v3.4._\n     */\n    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {\n        unchecked {\n            if (b == 0) return (false, 0);\n            return (true, a % b);\n        }\n    }\n\n    /**\n     * @dev Returns the addition of two unsigned integers, reverting on\n     * overflow.\n     *\n     * Counterpart to Solidity\'s `+` operator.\n     *\n     * Requirements:\n     *\n     * - Addition cannot overflow.\n     */\n    function add(uint256 a, uint256 b) internal pure returns (uint256) {\n        return a + b;\n    }\n\n    /**\n     * @dev Returns the subtraction of two unsigned integers, reverting on\n     * overflow (when the result is negative).\n     *\n     * Counterpart to Solidity\'s `-` operator.\n     *\n     * Requirements:\n     *\n     * - Subtraction cannot overflow.\n     */\n    function sub(uint256 a, uint256 b) internal pure returns (uint256) {\n        return a - b;\n    }\n\n    /**\n     * @dev Returns the multiplication of two unsigned integers, reverting on\n     * overflow.\n     *\n     * Counterpart to Solidity\'s `*` operator.\n     *\n     * Requirements:\n     *\n     * - Multiplication cannot overflow.\n     */\n    function mul(uint256 a, uint256 b) internal pure returns (uint256) {\n        return a * b;\n    }\n\n    /**\n     * @dev Returns the integer division of two unsigned integers, reverting on\n     * division by zero. The result is rounded towards zero.\n     *\n     * Counterpart to Solidity\'s `/` operator.\n     *\n     * Requirements:\n     *\n     * - The divisor cannot be zero.\n     */\n    function div(uint256 a, uint256 b) internal pure returns (uint256) {\n        return a / b;\n    }\n\n    /**\n     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),\n     * reverting when dividing by zero.\n     *\n     * Counterpart to Solidity\'s `%` operator. This function uses a `revert`\n     * opcode (which leaves remaining gas untouched) while Solidity uses an\n     * invalid opcode to revert (consuming all remaining gas).\n     *\n     * Requirements:\n     *\n     * - The divisor cannot be zero.\n     */\n    function mod(uint256 a, uint256 b) internal pure returns (uint256) {\n        return a % b;\n    }\n\n    /**\n     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on\n     * overflow (when the result is negative).\n     *\n     * CAUTION: This function is deprecated because it requires allocating memory for the error\n     * message unnecessarily. For custom revert reasons use {trySub}.\n     *\n     * Counterpart to Solidity\'s `-` operator.\n     *\n     * Requirements:\n     *\n     * - Subtraction cannot overflow.\n     */\n    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {\n        unchecked {\n            require(b <= a, errorMessage);\n            return a - b;\n        }\n    }\n\n    /**\n     * @dev Returns the integer division of two unsigned integers, reverting with custom message on\n     * division by zero. The result is rounded towards zero.\n     *\n     * Counterpart to Solidity\'s `/` operator. Note: this function uses a\n     * `revert` opcode (which leaves remaining gas untouched) while Solidity\n     * uses an invalid opcode to revert (consuming all remaining gas).\n     *\n     * Requirements:\n     *\n     * - The divisor cannot be zero.\n     */\n    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {\n        unchecked {\n            require(b > 0, errorMessage);\n            return a / b;\n        }\n    }\n\n    /**\n     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),\n     * reverting with custom message when dividing by zero.\n     *\n     * CAUTION: This function is deprecated because it requires allocating memory for the error\n     * message unnecessarily. For custom revert reasons use {tryMod}.\n     *\n     * Counterpart to Solidity\'s `%` operator. This function uses a `revert`\n     * opcode (which leaves remaining gas untouched) while Solidity uses an\n     * invalid opcode to revert (consuming all remaining gas).\n     *\n     * Requirements:\n     *\n     * - The divisor cannot be zero.\n     */\n    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {\n        unchecked {\n            require(b > 0, errorMessage);\n            return a % b;\n        }\n    }\n}\n\ninterface IERC20Errors {\n    /**\n     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     * @param balance Current balance for the interacting account.\n     * @param needed Minimum amount required to perform a transfer.\n     */\n    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);\n\n    /**\n     * @dev Indicates a failure with the token `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     */\n    error ERC20InvalidSender(address sender);\n\n    /**\n     * @dev Indicates a failure with the token `receiver`. Used in transfers.\n     * @param receiver Address to which tokens are being transferred.\n     */\n    error ERC20InvalidReceiver(address receiver);\n\n    /**\n     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.\n     * @param spender Address that may be allowed to operate on tokens without being their owner.\n     * @param allowance Amount of tokens a `spender` is allowed to operate with.\n     * @param needed Minimum amount required to perform a transfer.\n     */\n    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);\n\n    /**\n     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.\n     * @param approver Address initiating an approval operation.\n     */\n    error ERC20InvalidApprover(address approver);\n\n    /**\n     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.\n     * @param spender Address that may be allowed to operate on tokens without being their owner.\n     */\n    error ERC20InvalidSpender(address spender);\n}\n\ninterface IERC721Errors {\n    /**\n     * @dev Indicates that an address can\'t be an owner. For example, `address(0)` is a forbidden owner in EIP-20.\n     * Used in balance queries.\n     * @param owner Address of the current owner of a token.\n     */\n    error ERC721InvalidOwner(address owner);\n\n    /**\n     * @dev Indicates a `tokenId` whose `owner` is the zero address.\n     * @param tokenId Identifier number of a token.\n     */\n    error ERC721NonexistentToken(uint256 tokenId);\n\n    /**\n     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     * @param tokenId Identifier number of a token.\n     * @param owner Address of the current owner of a token.\n     */\n    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);\n\n    /**\n     * @dev Indicates a failure with the token `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     */\n    error ERC721InvalidSender(address sender);\n\n    /**\n     * @dev Indicates a failure with the token `receiver`. Used in transfers.\n     * @param receiver Address to which tokens are being transferred.\n     */\n    error ERC721InvalidReceiver(address receiver);\n\n    /**\n     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     * @param tokenId Identifier number of a token.\n     */\n    error ERC721InsufficientApproval(address operator, uint256 tokenId);\n\n    /**\n     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.\n     * @param approver Address initiating an approval operation.\n     */\n    error ERC721InvalidApprover(address approver);\n\n    /**\n     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     */\n    error ERC721InvalidOperator(address operator);\n}\n\ninterface IERC1155Errors {\n    /**\n     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     * @param balance Current balance for the interacting account.\n     * @param needed Minimum amount required to perform a transfer.\n     * @param tokenId Identifier number of a token.\n     */\n    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);\n\n    /**\n     * @dev Indicates a failure with the token `sender`. Used in transfers.\n     * @param sender Address whose tokens are being transferred.\n     */\n    error ERC1155InvalidSender(address sender);\n\n    /**\n     * @dev Indicates a failure with the token `receiver`. Used in transfers.\n     * @param receiver Address to which tokens are being transferred.\n     */\n    error ERC1155InvalidReceiver(address receiver);\n\n    /**\n     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     * @param owner Address of the current owner of a token.\n     */\n    error ERC1155MissingApprovalForAll(address operator, address owner);\n\n    /**\n     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.\n     * @param approver Address initiating an approval operation.\n     */\n    error ERC1155InvalidApprover(address approver);\n\n    /**\n     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.\n     * @param operator Address that may be allowed to operate on tokens without being their owner.\n     */\n    error ERC1155InvalidOperator(address operator);\n\n    /**\n     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.\n     * Used in batch transfers.\n     * @param idsLength Length of the array of token identifiers\n     * @param valuesLength Length of the array of token amounts\n     */\n    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);\n}\n\nabstract contract Context {\n    function _msgSender() internal view virtual returns (address) {\n        return msg.sender;\n    }\n\n    function _msgData() internal view virtual returns (bytes calldata) {\n        return msg.data;\n    }\n\n    function _contextSuffixLength() internal view virtual returns (uint256) {\n        return 0;\n    }\n}\n\nabstract contract Ownable is Context {\n    address private _owner;\n\n    /**\n     * @dev The caller account is not authorized to perform an operation.\n     */\n    error OwnableUnauthorizedAccount(address account);\n\n    /**\n     * @dev The owner is not a valid owner account. (eg. `address(0)`)\n     */\n    error OwnableInvalidOwner(address owner);\n\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\n\n    /**\n     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.\n     */\n    constructor(address initialOwner) {\n        if (initialOwner == address(0)) {\n            revert OwnableInvalidOwner(address(0));\n        }\n        _transferOwnership(initialOwner);\n    }\n\n    /**\n     * @dev Throws if called by any account other than the owner.\n     */\n    modifier onlyOwner() {\n        _checkOwner();\n        _;\n    }\n\n    /**\n     * @dev Returns the address of the current owner.\n     */\n    function owner() public view virtual returns (address) {\n        return _owner;\n    }\n\n    /**\n     * @dev Throws if the sender is not the owner.\n     */\n    function _checkOwner() internal view virtual {\n        if (owner() != _msgSender()) {\n            revert OwnableUnauthorizedAccount(_msgSender());\n        }\n    }\n\n    /**\n     * @dev Leaves the contract without owner. It will not be possible to call\n     * `onlyOwner` functions. Can only be called by the current owner.\n     *\n     * NOTE: Renouncing ownership will leave the contract without an owner,\n     * thereby disabling any functionality that is only available to the owner.\n     */\n    function renounceOwnership() public virtual onlyOwner {\n        _transferOwnership(address(0));\n    }\n\n    /**\n     * @dev Transfers ownership of the contract to a new account (`newOwner`).\n     * Can only be called by the current owner.\n     */\n    function transferOwnership(address newOwner) public virtual onlyOwner {\n        if (newOwner == address(0)) {\n            revert OwnableInvalidOwner(address(0));\n        }\n        _transferOwnership(newOwner);\n    }\n\n    /**\n     * @dev Transfers ownership of the contract to a new account (`newOwner`).\n     * Internal function without access restriction.\n     */\n    function _transferOwnership(address newOwner) internal virtual {\n        address oldOwner = _owner;\n        _owner = newOwner;\n        emit OwnershipTransferred(oldOwner, newOwner);\n    }\n}\n\ninterface IERC20 {\n    /**\n     * @dev Emitted when `value` tokens are moved from one account (`from`) to\n     * another (`to`).\n     *\n     * Note that `value` may be zero.\n     */\n    event Transfer(address indexed from, address indexed to, uint256 value);\n\n    /**\n     * @dev Emitted when the allowance of a `spender` for an `owner` is set by\n     * a call to {approve}. `value` is the new allowance.\n     */\n    event Approval(address indexed owner, address indexed spender, uint256 value);\n\n    /**\n     * @dev Returns the value of tokens in existence.\n     */\n    function totalSupply() external view returns (uint256);\n\n    /**\n     * @dev Returns the value of tokens owned by `account`.\n     */\n    function balanceOf(address account) external view returns (uint256);\n\n    /**\n     * @dev Moves a `value` amount of tokens from the caller\'s account to `to`.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * Emits a {Transfer} event.\n     */\n    function transfer(address to, uint256 value) external returns (bool);\n\n    /**\n     * @dev Returns the remaining number of tokens that `spender` will be\n     * allowed to spend on behalf of `owner` through {transferFrom}. This is\n     * zero by default.\n     *\n     * This value changes when {approve} or {transferFrom} are called.\n     */\n    function allowance(address owner, address spender) external view returns (uint256);\n\n    /**\n     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the\n     * caller\'s tokens.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * IMPORTANT: Beware that changing an allowance with this method brings the risk\n     * that someone may use both the old and the new allowance by unfortunate\n     * transaction ordering. One possible solution to mitigate this race\n     * condition is to first reduce the spender\'s allowance to 0 and set the\n     * desired value afterwards:\n     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729\n     *\n     * Emits an {Approval} event.\n     */\n    function approve(address spender, uint256 value) external returns (bool);\n\n    /**\n     * @dev Moves a `value` amount of tokens from `from` to `to` using the\n     * allowance mechanism. `value` is then deducted from the caller\'s\n     * allowance.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * Emits a {Transfer} event.\n     */\n    function transferFrom(address from, address to, uint256 value) external returns (bool);\n}\n\ninterface IERC20Metadata is IERC20 {\n    /**\n     * @dev Returns the name of the token.\n     */\n    function name() external view returns (string memory);\n\n    /**\n     * @dev Returns the symbol of the token.\n     */\n    function symbol() external view returns (string memory);\n\n    /**\n     * @dev Returns the decimals places of the token.\n     */\n    function decimals() external view returns (uint8);\n}\n\nabstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {\n    mapping(address account => uint256) private _balances;\n\n    mapping(address account => mapping(address spender => uint256)) private _allowances;\n\n    uint256 private _totalSupply;\n\n    string private _name;\n    string private _symbol;\n\n    /**\n     * @dev Sets the values for {name} and {symbol}.\n     *\n     * All two of these values are immutable: they can only be set once during\n     * construction.\n     */\n    constructor(string memory name_, string memory symbol_) {\n        _name = name_;\n        _symbol = symbol_;\n    }\n\n    /**\n     * @dev Returns the name of the token.\n     */\n    function name() public view virtual returns (string memory) {\n        return _name;\n    }\n\n    /**\n     * @dev Returns the symbol of the token, usually a shorter version of the\n     * name.\n     */\n    function symbol() public view virtual returns (string memory) {\n        return _symbol;\n    }\n\n    /**\n     * @dev Returns the number of decimals used to get its user representation.\n     * For example, if `decimals` equals `2`, a balance of `505` tokens should\n     * be displayed to a user as `5.05` (`505 / 10 ** 2`).\n     *\n     * Tokens usually opt for a value of 18, imitating the relationship between\n     * Ether and Wei. This is the default value returned by this function, unless\n     * it\'s overridden.\n     *\n     * NOTE: This information is only used for _display_ purposes: it in\n     * no way affects any of the arithmetic of the contract, including\n     * {IERC20-balanceOf} and {IERC20-transfer}.\n     */\n    function decimals() public view virtual returns (uint8) {\n        return 18;\n    }\n\n    /**\n     * @dev See {IERC20-totalSupply}.\n     */\n    function totalSupply() public view virtual returns (uint256) {\n        return _totalSupply;\n    }\n\n    /**\n     * @dev See {IERC20-balanceOf}.\n     */\n    function balanceOf(address account) public view virtual returns (uint256) {\n        return _balances[account];\n    }\n\n    /**\n     * @dev See {IERC20-transfer}.\n     *\n     * Requirements:\n     *\n     * - `to` cannot be the zero address.\n     * - the caller must have a balance of at least `value`.\n     */\n    function transfer(address to, uint256 value) public virtual returns (bool) {\n        address owner = _msgSender();\n        _transfer(owner, to, value);\n        return true;\n    }\n\n    /**\n     * @dev See {IERC20-allowance}.\n     */\n    function allowance(address owner, address spender) public view virtual returns (uint256) {\n        return _allowances[owner][spender];\n    }\n\n    /**\n     * @dev See {IERC20-approve}.\n     *\n     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on\n     * `transferFrom`. This is semantically equivalent to an infinite approval.\n     *\n     * Requirements:\n     *\n     * - `spender` cannot be the zero address.\n     */\n    function approve(address spender, uint256 value) public virtual returns (bool) {\n        address owner = _msgSender();\n        _approve(owner, spender, value);\n        return true;\n    }\n\n    /**\n     * @dev See {IERC20-transferFrom}.\n     *\n     * Emits an {Approval} event indicating the updated allowance. This is not\n     * required by the EIP. See the note at the beginning of {ERC20}.\n     *\n     * NOTE: Does not update the allowance if the current allowance\n     * is the maximum `uint256`.\n     *\n     * Requirements:\n     *\n     * - `from` and `to` cannot be the zero address.\n     * - `from` must have a balance of at least `value`.\n     * - the caller must have allowance for ``from``\'s tokens of at least\n     * `value`.\n     */\n    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {\n        address spender = _msgSender();\n        _spendAllowance(from, spender, value);\n        _transfer(from, to, value);\n        return true;\n    }\n\n    /**\n     * @dev Moves a `value` amount of tokens from `from` to `to`.\n     *\n     * This internal function is equivalent to {transfer}, and can be used to\n     * e.g. implement automatic token fees, slashing mechanisms, etc.\n     *\n     * Emits a {Transfer} event.\n     *\n     * NOTE: This function is not virtual, {_update} should be overridden instead.\n     */\n    function _transfer(address from, address to, uint256 value) internal {\n        if (from == address(0)) {\n            revert ERC20InvalidSender(address(0));\n        }\n        if (to == address(0)) {\n            revert ERC20InvalidReceiver(address(0));\n        }\n        _update(from, to, value);\n    }\n\n    /**\n     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`\n     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding\n     * this function.\n     *\n     * Emits a {Transfer} event.\n     */\n    function _update(address from, address to, uint256 value) internal virtual {\n        if (from == address(0)) {\n            // Overflow check required: The rest of the code assumes that totalSupply never overflows\n            _totalSupply += value;\n        } else {\n            uint256 fromBalance = _balances[from];\n            if (fromBalance < value) {\n                revert ERC20InsufficientBalance(from, fromBalance, value);\n            }\n            unchecked {\n                // Overflow not possible: value <= fromBalance <= totalSupply.\n                _balances[from] = fromBalance - value;\n            }\n        }\n\n        if (to == address(0)) {\n            unchecked {\n                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.\n                _totalSupply -= value;\n            }\n        } else {\n            unchecked {\n                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.\n                _balances[to] += value;\n            }\n        }\n\n        emit Transfer(from, to, value);\n    }\n\n    /**\n     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).\n     * Relies on the `_update` mechanism\n     *\n     * Emits a {Transfer} event with `from` set to the zero address.\n     *\n     * NOTE: This function is not virtual, {_update} should be overridden instead.\n     */\n    function _mint(address account, uint256 value) internal {\n        if (account == address(0)) {\n            revert ERC20InvalidReceiver(address(0));\n        }\n        _update(address(0), account, value);\n    }\n\n    /**\n     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.\n     * Relies on the `_update` mechanism.\n     *\n     * Emits a {Transfer} event with `to` set to the zero address.\n     *\n     * NOTE: This function is not virtual, {_update} should be overridden instead\n     */\n    function _burn(address account, uint256 value) internal {\n        if (account == address(0)) {\n            revert ERC20InvalidSender(address(0));\n        }\n        _update(account, address(0), value);\n    }\n\n    /**\n     * @dev Sets `value` as the allowance of `spender` over the `owner` s tokens.\n     *\n     * This internal function is equivalent to `approve`, and can be used to\n     * e.g. set automatic allowances for certain subsystems, etc.\n     *\n     * Emits an {Approval} event.\n     *\n     * Requirements:\n     *\n     * - `owner` cannot be the zero address.\n     * - `spender` cannot be the zero address.\n     *\n     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.\n     */\n    function _approve(address owner, address spender, uint256 value) internal {\n        _approve(owner, spender, value, true);\n    }\n\n    /**\n     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.\n     *\n     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by\n     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any\n     * `Approval` event during `transferFrom` operations.\n     *\n     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to\n     * true using the following override:\n     * ```\n     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {\n     *     super._approve(owner, spender, value, true);\n     * }\n     * ```\n     *\n     * Requirements are the same as {_approve}.\n     */\n    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {\n        if (owner == address(0)) {\n            revert ERC20InvalidApprover(address(0));\n        }\n        if (spender == address(0)) {\n            revert ERC20InvalidSpender(address(0));\n        }\n        _allowances[owner][spender] = value;\n        if (emitEvent) {\n            emit Approval(owner, spender, value);\n        }\n    }\n\n    /**\n     * @dev Updates `owner` s allowance for `spender` based on spent `value`.\n     *\n     * Does not update the allowance value in case of infinite allowance.\n     * Revert if not enough allowance is available.\n     *\n     * Does not emit an {Approval} event.\n     */\n    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {\n        uint256 currentAllowance = allowance(owner, spender);\n        if (currentAllowance != type(uint256).max) {\n            if (currentAllowance < value) {\n                revert ERC20InsufficientAllowance(spender, currentAllowance, value);\n            }\n            unchecked {\n                _approve(owner, spender, currentAllowance - value, false);\n            }\n        }\n    }\n}\n\ncontract QuantumQuartz is ERC20, Ownable {\n    using SafeMath for uint256;\n\n    string private _name = "Quantum Quartz";\n    string private _symbol = "QQ";\n    uint256 private _totalSupply;\n\n    uint256 public constant FEE_DENOMINATOR = 1000;\n\n    uint256 public buyTax;\n    uint256 public sellTax;\n\n    uint256 public buyLimit;\n    uint256 public sellLimit;\n    uint256 public transferLimit;\n\n    uint256 public nextTransactionTimeGap = 2 minutes;\n\n    address public feeReceiver;\n\n    constructor() ERC20(_name, _symbol) Ownable(_msgSender()) {\n        _totalSupply = 1000000000 * 10**decimals();\n\n        _mint(_msgSender(), _totalSupply);\n\n        buyTax = 2;\n        sellTax = 5;\n\n        buyLimit = 5;\n        sellLimit = 10;\n        transferLimit = 2;\n\n        feeReceiver = _msgSender();\n    }\n\n    function isContract(address _addr) private view returns (bool) {\n        uint32 size;\n        assembly {\n            size := extcodesize(_addr)\n        }\n        return (size > 0);\n    }\n\n    modifier limitProtect(\n        address sender,\n        address recipient,\n        uint256 amount\n    ) {\n        uint256 limit = transferLimit;\n        string memory _type = "transfer";\n\n        if (isContract(sender)) {\n            limit = buyLimit;\n            _type = "buy";\n        } else if (isContract(recipient)) {\n            limit = sellLimit;\n            _type = "sell";\n        } else {\n            limit = transferLimit;\n            _type = "transfer";\n        }\n\n        require(\n            limit >= amount,\n            string(\n                abi.encode(\n                    "The transfer amount of ",\n                    amount,\n                    " exceeds the allowed ",\n                    _type,\n                    " limit. The maximum allowed amount is ",\n                    limit\n                )\n            )\n        );\n\n        _;\n    }\n\n    receive() external payable {}\n\n    function updateTransactionTimeLimit(uint256 _seconds) external onlyOwner {\n        nextTransactionTimeGap = _seconds;\n    }\n\n    function transfer(address recipient, uint256 amount)\n        public\n        override\n        limitProtect(msg.sender, recipient, amount)\n        returns (bool)\n    {\n        require(amount > 0, "Invalid amount");\n        require(recipient != address(0), "Invalid recipient");\n\n        return _transferFrom(_msgSender(), recipient, amount);\n    }\n\n    function transferFrom(\n        address sender,\n        address recipient,\n        uint256 amount\n    ) public override returns (bool) {\n        require(amount > 0, "Invalid amount");\n        require(recipient != address(0), "Invalid recipient");\n        require(sender != address(0), "Invalid sender");\n\n        uint256 currentAllowance = allowance(sender, _msgSender());\n        require(currentAllowance >= amount, "Insufficient Allowance");\n\n        return _transferFrom(sender, recipient, amount);\n    }\n\n    function _transferFrom(\n        address sender,\n        address recipient,\n        uint256 amount\n    ) internal limitProtect(sender, recipient, amount) returns (bool) {\n        uint256 senderBalance = balanceOf(sender);\n        require(senderBalance >= amount, "Insufficient Balance");\n\n        uint256 amountReceived = takeFee(sender, amount);\n        _transfer(sender, recipient, amountReceived);\n\n        return true;\n    }\n\n    function takeFee(address sender, uint256 amount)\n        internal\n        returns (uint256)\n    {\n        uint256 fee = sender == _msgSender() ? sellTax : buyTax;\n\n        uint256 feeAmount = amount.mul(fee).div(FEE_DENOMINATOR);\n        uint256 transferable_amount = amount.sub(feeAmount);\n\n        uint256 senderBalance = balanceOf(sender);\n        require(senderBalance >= amount, "Insufficient Balance");\n        _transfer(sender, feeReceiver, feeAmount);\n\n        return transferable_amount;\n    }\n\n    function manualSend() external {\n        require(\n            _msgSender() == feeReceiver,\n            "only fee receiver can transfer funds"\n        );\n        payable(feeReceiver).transfer(address(this).balance);\n    }\n\n    function clearStuckToken(address tokenAddress, uint256 tokens)\n        external\n        returns (bool success)\n    {\n        require(\n            _msgSender() == feeReceiver,\n            "only fee receiver can transfer funds"\n        );\n\n        if (tokens == 0) {\n            tokens = ERC20(tokenAddress).balanceOf(address(this));\n        }\n        return ERC20(tokenAddress).transfer(feeReceiver, tokens);\n    }\n\n    function setFee(uint256 _buy, uint256 _sell) external onlyOwner {\n        buyTax = _buy;\n        sellTax = _sell;\n    }\n\n    function setFeeReceiver(address _feeReceiver) external {\n        require(\n            _msgSender() == feeReceiver,\n            "You are not allowed to set fee receiver"\n        );\n\n        feeReceiver = _feeReceiver;\n    }\n}\n ',
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

// (async () => {
//   const guid = await verifyContract({
//     process.env.ETHER_SCAN_API_KEY,
//     chainId,
//     contractAddress,
//     contractName,
//     sourceCode,
//     compilerVersion:process.env.SOLIDITY_COMPILER_VERSION,
//   });

// if (guid) {
//   // Check verification status after a delay to allow time for processing
//   setTimeout(async () => {
//     await checkVerificationStatus({ apiKey, guid });
//   }, 12000); // 1 minute delay
// }
// })();
