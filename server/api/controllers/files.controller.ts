import type { Request, Response } from "express";
import fs from "fs-extra";
import { getAbi,   getFilePath } from "../../utils";

export const FilesController = {
  /**
   * Sends the link to a specific Solidity file asynchronously.
   *
   * @param {Request} req - The request object containing the Solidity file to compile.
   * @param {Response} res - The response object to send the compilation result.
   * @return {void} A promise that resolves when the compilation is complete.
   */
  contract: (req: Request, res: Response): void => {
    const filePath = getFilePath(req);
    console.log("first", filePath);
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("File not found");
    }
  },
  abi: async (req: Request, res: Response): Promise<void> => {
    const abi = getAbi(req);
    const fileName = req.params.fileName;
    // remove the .json extension  from the fileName using regex, the extension is the last 5 characters that are .json
    const fileNameWithoutExtension = fileName.replace(/\.json$/, "");
    const nameRegex = /-([^-\d]+)\.sol/;
    const name = fileName.match(nameRegex)![1];

    await fs.ensureFile(abi); // Check if the file exists
    if (fs.existsSync(abi)) {
      const fileContent = fs.readFileSync(abi, "utf8");
      console.log('abi', abi)
      console.log("fileContent", fileContent);
      const jsonData = JSON.parse(fileContent);

      const data = jsonData.contracts[fileNameWithoutExtension][name];
      res.json({ abi: data.abi, bytecode: data.evm.bytecode }); // Send the JSON data in the response
    } else {
      res.status(404).send("File not found");
    }
  },
};
