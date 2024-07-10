import { OpenAI } from "openai";
import { IToken } from "../../utils";
const api_key =
  process.env.OPENAI_API_KEY ??
  "sk-proj-xtNEaaw3181W9ZNHIUssT3BlbkFJgIaTyqjnJRktLRQKetrQ";

const openai = new OpenAI({
  apiKey: api_key,
  dangerouslyAllowBrowser: true,
});

export const OpenAIHelper = {
  async getToken(prompt: string): Promise<{
    token?: IToken;
    error?: any;
  }> {
    const new_prompt = `generate a detailed developer-friendly JSON response for this blockchain token idea (${prompt}). Don't include other instructional text; I need a pure JSON object as the response. Avoid using \`\`\`, \`\`\`json, or newline characters in the response. Make sure it includes the token's name, symbol, decimals, total supply, buy and sell tax rates (just numbers), and a comprehensive concept description. In the JSON, I want to see potential use cases and the target audience, along with a breakdown of tokenomics covering Development, Marketing, Reserve, Staking Rewards, Team, and Liquidity, which should always fall between 40 and 60%. Include fields for buy, sell, and transfer limits expressed as percentages (numbers only, no percent sign), and specify the status of sniper protection. Additionally, design a minimalist logo for the token. It should be a perfect circle with a 1:1 aspect ratio, using a limited color palette that matches the token's theme. The logo should be centered within the circle with enough space for social media cropping. It must visually represent the token's concept, suitable for cryptocurrency branding, and free of text or intricate details to maintain minimalism. Here are the JSON keys to use: token: name, ticker, decimals, totalSupply, taxRates (nested: buy, sell), description, potentialUseCases, targetAudience, tokenomics (array of objects: bucket, percentage), limits (nested: buyLimit, sellLimit, transferLimit), protection (nested: sniperProtection, whitelisting), logo (nested: theme, aspectRatio, designConcept). The format should be like this: { name: string, ticker: string, decimals: number, totalSupply: number, taxRates: { buy: number, sell: number}, description: string, potentialUseCases: string, targetAudience: string, tokenomics: [ { bucket: 'Development', percentage: number }, { bucket: 'Marketing', percentage: number }, { bucket: 'Reserve', percentage: number }, { bucket: 'Staking Rewards', percentage: number }, { bucket: 'Team', percentage: number}, { bucket: 'Liquidity', percentage: number}, ...others ], limits: { buyLimit: number, sellLimit: number, transferLimit: number }, protection: { sniperProtection: boolean, whitelisting: boolean }, logo: { theme: string, aspectRatio: string, designConcept: string } }`;
    console.log("content", new_prompt);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful blockchain smart contract development assistant.",
          },
          {
            role: "user",
            content: new_prompt,
          },
        ],
      });

      console.log("response.choices", response.choices);

      const content = JSON.parse(response.choices[0].message.content!);
      const token = content["token"] ?? content;
      console.log(
        typeof response.choices[0].message.content,
        content["token"] ?? content
      );
      return {
       token:{
        ...token,
        contract_name: token.name.replace(/\s/g, ""),
       }
      };
    } catch (error: any) {
      console.log("error", error);
      return { error: error.message };
    }
  },
};
