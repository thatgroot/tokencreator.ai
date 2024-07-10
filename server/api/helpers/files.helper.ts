import type { Request, Response } from "express";
import fs from "fs-extra";
import { join } from "path";
import { StringHelper } from "./string.helper";
import { CompilationHelper } from "./compilation.helper";
export const FilesHelper = {
  getFilePath: function (req: Request) {
    const fileName = req.params.fileName;
    const filePath = `${__dirname}/compiled/${fileName}`;
    return filePath;
  },

  getAbi: function (req: Request) {
    const fileName = req.params.fileName;
    const abi = `${__dirname}/artifacts/${fileName}`;
    console.log("abi", abi);
    return abi;
  },
};
