import type { Request, Response } from "express";
import { OpenAIHelper } from "../helpers/openai.helper";
import { IToken } from "../../utils";

export const OpenAinController = {
  /**
   * Compiles a Solidity file asynchronously.
   *
   * @param {Request} req - The request object containing the Solidity file to compile.
   * @param {Response} res - The response object to send the compilation result.
   * @return {Promise<void>} A promise that resolves when the compilation is complete.
   */
  generateTokenIdea: async (req: Request, res: Response): Promise<void> => {
   const {prompt} = req.body;
    const result  = await  OpenAIHelper.getToken(prompt);
    if (result.error) {
      res.status(500).send(result.error);
    } else {
      res.json(result);
    }
  },
};
