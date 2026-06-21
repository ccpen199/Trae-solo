import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "dayjs/locale/zh-cn";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "找不到根节点 #root，请检查 index.html 配置是否正确"
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
