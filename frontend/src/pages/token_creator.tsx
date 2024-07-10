import { FunctionComponent, useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import Layout from "../_layout";
import { IToken } from "..";
import FormField from "../components/FormField";
import { deploy, verify } from "../utils/contract";

const TokenCreatorAi1: FunctionComponent = () => {
  const [token, setToken] = useState<IToken>();
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate();
  const deployContract = useCallback(async () => {
    const _token: IToken = JSON.parse(localStorage.getItem("token")!);
    if (!_token) {
      return;
    }
    setLoading(true);
    const address = await deploy(_token);
    const info = JSON.parse(localStorage.getItem("rest")!);
    if (address && info) {
      const v_data = await verify(address, _token?.contract_name, info["file"]);
      console.log(`verification data : ${JSON.stringify(v_data)}`);
      setLoading(false);
    } else {
      //
    }

    // navigate("/tokencreatorai1");
  }, []);

  const getTheToken = async () => {
    const _token = JSON.parse(localStorage.getItem("token")!);
    setToken(_token);
    console.log("token", _token);
  };

  // useEffect()
  useEffect(() => {
    getTheToken();
  }, []);

  return (
    <Layout>
      <div className="flex mx-auto flex-row max-w-[1200px] w-full  max-h-[720px] h-fit items-center justify-center self-stretch flex-1 rounded-3xl bg-aliceblue p-6 gap-[48px]">
        <div className="self-stretch flex-1 flex flex-col items-center justify-start gap-[12px] text-xs text-geminigooglecom-black">
          <div className="self-stretch bg-chatopenaicom-nero h-14 flex flex-row items-center justify-between py-1.5 px-2 box-border">
            <div className="w-[244px] rounded-3xl bg-geminigooglecom-mystic h-11 overflow-hidden shrink-0 flex flex-row items-center justify-center py-2.5 px-4 box-border">
              <div className="flex-1 flex flex-row items-center justify-between">
                <div className="flex flex-row items-center justify-center gap-[8px]">
                  <img
                    className="w-4 relative h-4 object-cover"
                    alt=""
                    src="/image-5@2x.png"
                  />
                  <div className="relative leading-[20px] font-medium">
                    SAITA CHAIN
                  </div>
                </div>
                <div className="flex flex-row items-center justify-start gap-[8px]">
                  <div className="flex flex-row items-start justify-start gap-[2px]">
                    <img
                      className="w-4 relative h-4 overflow-hidden shrink-0"
                      alt=""
                      src="/icbsca3213bd0svg.svg"
                    />
                    <img
                      className="w-4 relative h-4"
                      alt=""
                      src="/vector6.svg"
                    />
                    <img
                      className="w-4 relative rounded-lg h-4 object-cover"
                      alt=""
                      src="/image-3@2x.png"
                    />
                    <img
                      className="w-4 relative h-4 object-cover"
                      alt=""
                      src="/image-4@2x.png"
                    />
                  </div>
                  <img className="w-3 relative h-3" alt="" src="/vector7.svg" />
                </div>
              </div>
            </div>
            <div className="self-stretch rounded-3xl bg-geminigooglecom-mystic flex flex-row items-center justify-center py-2.5 px-4 box-border gap-[8px] min-w-[64px]">
              <img className="w-4 relative h-4" alt="" src="/vector8.svg" />
              <div className="relative tracking-[0.1px] font-medium">
                0x.....98j
              </div>
            </div>
          </div>
          <div className="self-stretch flex flex-row items-center justify-center gap-[10px] font-poppins">
            <div className="self-stretch w-[251px] rounded-[18px] bg-wwwpinksalefinance-catskill-white box-border flex flex-col items-start justify-start py-6 px-3 gap-[24px] text-sm border-[1px] border-solid border-wwwpinksalefinance-athens-gray">
              <div className="relative leading-[20px]">Tokenomics</div>
              <div className="self-stretch flex-1 rounded-xl bg-wwwpinksalefinance-catskill-white flex flex-col items-start justify-start py-2 px-3 gap-[6px] text-center text-xs font-roboto">
                {token?.tokenomics?.map(({ bucket, percentage }, index) => (
                  <div
                    key={index}
                    className="self-stretch rounded-md bg-gainsboro-200 flex flex-row items-start justify-between py-2 px-3"
                  >
                    <div className="relative">{bucket}</div>
                    <div className="relative">{percentage}</div>
                  </div>
                ))}

                <div className="self-stretch rounded-md bg-gainsboro-200 flex flex-row items-center justify-start py-2 px-3 text-left">
                  <div className="flex-1 relative">{token?.description}</div>
                </div>
              </div>
            </div>
            {token && (
              <>
                <div className="self-stretch flex-1 shadow-[0px_1px_2px_rgba(0,_0,_0,_0.05)] rounded-3xl bg-chatopenaicom-nero flex flex-col items-center justify-start p-6 gap-[24px]">
                  <div className="self-stretch flex flex-row flex-wrap items-start justify-start gap-[16px]">
                    <FormField label="Name" defaultValue={token.contract_name} />
                    <FormField label="Symbol" defaultValue={token.ticker} />
                  </div>
                  <div className="self-stretch flex flex-row flex-wrap items-start justify-start gap-[16px]">
                    <FormField
                      label="Decimals"
                      defaultValue={token.decimals.toString()}
                    />

                    <FormField
                      label="Total supply"
                      defaultValue={`${token.totalSupply}`}
                    />
                  </div>
                  <div className="self-stretch flex flex-row items-start justify-start gap-[16px]">
                    <FormField
                      label="Buy Tax %"
                      defaultValue={`${token.taxRates.buy}`}
                    />
                    <FormField
                      label="Sell Tax %"
                      defaultValue={`${token.taxRates.sell}`}
                    />
                  </div>
                </div>
                <div className="self-stretch flex-1 shadow-[0px_1px_2px_rgba(0,_0,_0,_0.05)] rounded-3xl bg-chatopenaicom-nero flex flex-col items-center justify-start p-6 gap-[24px]">
                  <div className="self-stretch flex flex-col items-start justify-start gap-[12px]">
                    <b className="relative text-[16px] leading-[20px]">
                      Advance Functions
                    </b>
                    <div className="self-stretch flex flex-row items-start justify-start gap-[16px]">
                      <FormField
                        label="Buy Limit"
                        defaultValue={`${token.limits.buyLimit}`}
                      />
                      <FormField
                        label="Sell Limit"
                        defaultValue={`${token.limits.sellLimit}`}
                      />
                    </div>
                    <FormField
                      label="Transfer Limit"
                      defaultValue={`${token.limits.transferLimit}`}
                    />

                    <div className="self-stretch flex flex-col items-start justify-start gap-[4.3px]">
                      <div className="relative leading-[20px]">
                        Fee Receiver
                      </div>
                      <div className="self-stretch rounded-3xl bg-wwwpinksalefinance-catskill-white flex flex-row items-center justify-start pt-[7.5px] px-3 pb-2 text-wwwpinksalefinance-gray-chateau border-[1px] border-solid border-wwwpinksalefinance-athens-gray">
                        <div className="relative">0x0000....</div>
                      </div>
                    </div>
                  </div>
                  <div className="self-stretch flex flex-row items-center justify-between">
                    <div className="flex flex-col items-start justify-center gap-[12px]">
                      <div className="relative leading-[20px]">Antisnipe</div>
                      <input
                        type="checkbox"
                        checked={token.protection.sniperProtection}
                      />
                    </div>
                    <div className="flex flex-col items-start justify-center gap-[12px]">
                      <div className="relative leading-[20px]">
                        Whitelisting
                      </div>
                      <input
                        type="checkbox"
                        checked={token.protection.whitelisting}
                      />
                    </div>
                  </div>

                  <button
                    // disabled={loading}
                    className="w-[109.5px] relative rounded-3xl [background:linear-gradient(90deg,_#4193cf,_#244b96)] h-[51px] cursor-pointer text-center text-smi text-chatopenaicom-nero font-roboto"
                    onClick={deployContract}
                  >
                    <img
                      className="absolute top-[18.5px] left-[15px] w-[14.5px] h-[14.5px]"
                      alt=""
                      src="/vector9.svg"
                    />
                    <span className="absolute top-[18px] left-[44.5px]">
                      {loading ? "Deploying..." : "Deploy"}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TokenCreatorAi1;
