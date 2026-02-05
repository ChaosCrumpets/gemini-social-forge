import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize monitoring
import { initSentry } from "./lib/sentry";
import { trackWebVitals } from "./lib/web-vitals";

// Initialize Sentry first (before app renders)
initSentry();

// Render app
createRoot(document.getElementById("root")!).render(<App />);

// Track Web Vitals after initial render
trackWebVitals();
