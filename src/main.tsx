
  // @ts-expect-error react-dom/client has no available declaration in this project.
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  // CSS is handled by the bundler; TypeScript has no declaration for this side-effect import.
  // @ts-expect-error
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  