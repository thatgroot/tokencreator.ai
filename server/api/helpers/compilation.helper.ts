// @ts-ignore
import solc from "solc";
import fs from "fs-extra";
import { join } from "path";
import { run } from "hardhat";

export const CompilationHelper = {
  compile: async function compileContract(source: string, file_name: string) {
    const input = {
      language: "Solidity",
      sources: {
        [file_name]: {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": [
              "metadata",
              "evm.bytecode", // Enable the metadata and bytecode outputs of every single contract.
              "evm.bytecode.sourceMap", // Enable the source map output of every single contract.
            ],
            "": [
              "ast", // Enable the AST output of every single file.
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

    const outputDir = join(__dirname, "artifacts");
    await fs.ensureDir(outputDir);

    const output_file = join(outputDir, `${file_name}.json`);
    await fs.writeFile(output_file, JSON.stringify(output), "utf8");

    return `${output_file}.json`;
  },
};
