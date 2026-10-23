import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ShipIt from "./ShipIt";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing root element");
}

createRoot(rootEl).render(
  <StrictMode>
    <ShipIt />
  </StrictMode>,
);
