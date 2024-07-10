/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: "#242222",
        "chatopenaicom-nero": "#fff",
        gainsboro: {
          "100": "#e4e7ec",
          "200": "#e4e4e4",
        },
        "geminigooglecom-black": "#000",
        darkgray: "#a2a2a2",
        aliceblue: "#f0f4f9",
        "wwwpinksalefinance-cornflower-blue": "#627eea",
        "wwwpinksalefinance-catskill-white": "#f8fafc",
        "wwwpinksalefinance-athens-gray": "#e5e7eb",
        "wwwpinksalefinance-gray-chateau": "#9ca3af",
        "geminigooglecom-mystic": "#dde3ea",
        "wwwpinksalefinance-cerulean": "#0ea5e9",
        "geminigooglecom-cape-cod1": "#3c4043",
        "geminigooglecom-thunderbird": "#c5221f",
        "geminigooglecom-cape-cod": "#444746",
        "geminigooglecom-geyser-38": "rgba(211, 219, 229, 0.38)",
        "geminigooglecom-mine-shaft-38": "rgba(31, 31, 31, 0.38)",
        orange: "#ffb606",
        royalblue: "#0b57d0",
      },
      spacing: {},
      fontFamily: {
        roboto: "Roboto",
        poppins: "Poppins",
        "geminigooglecom-helvetica-neue-medium-12": "Raleway",
      },
      borderRadius: {
        "11xl": "30px",
        xl: "20px",
      },
    },
    fontSize: {
      smi: "13px",
      xs: "12px",
      sm: "14px",
      "sm-7": "13.7px",
      "3xl": "22px",
      inherit: "inherit",
    },
  },
  corePlugins: {
    preflight: false,
  },
};
