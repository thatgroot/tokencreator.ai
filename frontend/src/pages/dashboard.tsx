import { createRef, FunctionComponent, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../_layout";
import { tokenIdea } from "../utils/contract";

const TokenCreatorAi: FunctionComponent = () => {
  const navigate = useNavigate();
  const ref = createRef<HTMLInputElement>();
  const [loading, setLoading] = useState(false);
  const generateIdea = useCallback(async () => {
    setLoading(true);
    const data = await tokenIdea(ref.current?.value ?? "");
    console.log('data', data)
    localStorage.setItem("token", JSON.stringify(data.token));
    if (data.token) {
      setLoading(false);
      console.log("Token name", data.token.name);
      navigate("/tokencreatorai");
    } else {
      setLoading(false);
      alert(data.error);
    }
  }, []);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center gap-[24px]">
        <img
          className="w-[646.4px] relative h-[107.6px]"
          alt=""
          src="/intersect.svg"
        />
        <div className="self-stretch rounded-[9999px] bg-chatopenaicom-nero overflow-hidden flex flex-row items-center justify-between py-1.5 pr-1.5 pl-6 border-[2px] border-solid border-gainsboro-100">
          <input
            ref={ref}
            className="relative flex-1 self-stretch outline-none"
            placeholder="Describe your token inspiration in few words i.e inspired by quantum world..."
          />

          <button
            className="w-[109.5px] relative rounded-3xl [background:linear-gradient(90deg,_#d9d9d9,_#737373)] h-[51px] cursor-pointer text-geminigooglecom-black"
            onClick={generateIdea}
          >
            <img
              className="absolute top-[18.5px] left-[15px] w-[14.5px] h-[14.5px]"
              alt=""
              src="/vector.svg"
            />
            <div className="absolute top-[18px] left-[34.5px] inline-block w-[60px]">
              {loading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Generate"
              )}
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TokenCreatorAi;
