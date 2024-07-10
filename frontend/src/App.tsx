import { useEffect } from "react";
import {
  Routes,
  Route,
  useNavigationType,
  useLocation,
} from "react-router-dom";
import TokenCreatorAi from "./pages/dashboard";
import TokenCreatorAi1 from "./pages/token_creator";
import TokenCreatorAi2 from "./pages/congrats";

function App() {
  const action = useNavigationType();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (action !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [action, pathname]);

  useEffect(() => {
    let title = "";
    let metaDescription = "";

    switch (pathname) {
      case "/":
        title = "";
        metaDescription = "";
        break;
      case "/tokencreatorai":
        title = "";
        metaDescription = "";
        break;
      case "/tokencreatorai1":
        title = "";
        metaDescription = "";
        break;
    }

    if (title) {
      document.title = title;
    }

    if (metaDescription) {
      const metaDescriptionTag: HTMLMetaElement | null = document.querySelector(
        'head > meta[name="description"]'
      );
      if (metaDescriptionTag) {
        metaDescriptionTag.content = metaDescription;
      }
    }
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<TokenCreatorAi />} />
      <Route path="/tokencreatorai" element={<TokenCreatorAi1 />} />
      <Route path="/tokencreatorai1" element={<TokenCreatorAi2 />} />
    </Routes>
  );
}
export default App;
