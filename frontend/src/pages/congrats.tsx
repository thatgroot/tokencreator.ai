import { FunctionComponent, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../_layout";

const TokenCreatorAi2: FunctionComponent = () => {
  const navigate = useNavigate();

  const toHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <Layout>
      <div className="flex mx-auto flex-row max-w-[1200px] w-full  max-h-[720px] h-fit items-center justify-center self-stretch flex-1 rounded-3xl bg-aliceblue p-6 gap-[48px]">
        <div className="self-stretch flex-1 flex flex-col items-center justify-start gap-[12px] text-center text-[64px] text-royalblue">
          <div className="self-stretch flex-1 relative leading-[84px] font-medium text-transparent !bg-clip-text [background:linear-gradient(90deg,_#757575,_#999)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] flex items-center justify-center">
            Congratulations, Your token is created
          </div>
          <div className="flex flex-row items-start justify-start gap-[24px] text-3xl">
            <div className="flex flex-row items-center justify-start gap-[6px]">
              <span className="relative leading-[84px] font-medium">
                Transaction
              </span>
              <img
                className="w-[11.7px] relative h-[11.7px]"
                alt=""
                src="/vector10.svg"
              />
            </div>
            <div className="flex flex-row items-center justify-start gap-[6px]">
              <span className="relative leading-[84px] font-medium">Token</span>
              <img
                className="w-[11.7px] relative h-[11.7px]"
                alt=""
                src="/vector10.svg"
              />
            </div>
            <button
              onClick={toHome}
              className="flex flex-row items-center justify-start gap-[6px]"
            >
              <span className="relative leading-[84px] font-medium">Home</span>
              <img
                className="w-[11.7px] relative h-[11.7px]"
                alt=""
                src="/vector10.svg"
              />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TokenCreatorAi2;
