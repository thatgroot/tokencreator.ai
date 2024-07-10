export interface IToken {
  contract_name: string;
 name: string;
 ticker: string;
 totalSupply: string;
 decimals:number;
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
