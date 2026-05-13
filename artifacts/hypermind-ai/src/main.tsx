import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Wire up auth token for all API calls
setAuthTokenGetter(() => localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(<App />);
