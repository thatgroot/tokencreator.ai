import express from "express";
import bodyParser from "body-parser";
import { getAbi, getFilePath, readAndCompileContract } from "../utils";
import { contractsDir } from "./constants";
import fs from "fs-extra";
import hre from "hardhat";
import cors from "cors";
import { CompilationController } from "./controllers/compilation.controller";
import { FilesController } from "./controllers/files.controller";
import { VerificatoinController } from "./controllers/verification.controller";
import { OpenAinController } from "./controllers/openai.controller";
require("dotenv").config();


const app = express();
const port = process.env.PORT || 80;

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));

// Serve compiled Solidity files
app.use("/compiled", express.static(contractsDir));
app.use("/artifacts", express.static(contractsDir));

// Endpoint to compile Solidity file
app.post("/compile", CompilationController.compile);

app.get("/contracts/:fileName", FilesController.contract);
app.get("/abi/:fileName", FilesController.abi);

app.post("/verify", VerificatoinController.verify);
app.get("/status", VerificatoinController.status);

// generate token idea
app.post("/generate-token", OpenAinController.generateTokenIdea);
app.get('hello',(req,res)=>{
  res.send("hello")
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Create the contracts directory if it doesn't exist
fs.ensureDir(contractsDir);

