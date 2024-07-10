import type { Request, Response } from "express";
import { readAndCompileContract } from "../../utils";

export const CompilationController = {
  /**
   * Compiles a Solidity file asynchronously.
   *
   * @param {Request} req - The request object containing the Solidity file to compile.
   * @param {Response} res - The response object to send the compilation result.
   * @return {Promise<void>} A promise that resolves when the compilation is complete.
   */
  compile: async (req: Request, res: Response): Promise<void> => {
    const result = await readAndCompileContract(res, req);
    if (result.error) {
      res.status(500).send(result.error);
    } else {
      res.json(result);
    }
  },
};
