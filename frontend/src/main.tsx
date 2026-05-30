import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Configure the generated API client (orval) to:
//  1. Prefix relative /api paths with REACT_APP_BACKEND_URL.
//  2. Attach Authorization: Bearer <token> from localStorage to every request.
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { API_BASE_URL, getAuthToken } from "@/lib/api";

setBaseUrl(API_BASE_URL || null);
setAuthTokenGetter(() => getAuthToken());

createRoot(document.getElementById("root")!).render(<App />);
