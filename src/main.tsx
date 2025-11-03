import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { InstallPrompt } from './components/pwa/InstallPrompt';

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <InstallPrompt />
  </>
);
