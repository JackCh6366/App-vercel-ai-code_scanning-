import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API 路由: 程式碼品質與 ESLint/Prettier 分析
  app.post("/api/lint", async (req, res) => {
    const { code, language, rules, prettierConfig } = req.body;

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "請提供有效的程式碼字串" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: "未設定 GEMINI_API_KEY 環境變數。請在 Settings > Secrets 設定您的金鑰。",
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // 構建系統提示 & 說明，讓模型提供精準的 ESLint / Prettier 評估
      const systemInstruction = `你是一個非常優秀的前端架構師與代碼品質審查專家。
你的任務是模擬 ESLint (搭配 TypeScript 與 React/React Hooks 插件) 與 Prettier 的行為，對使用者輸入的程式碼進行檢測與格式化排版。

使用者提供的程式碼語言主要為: ${language || "typescript/jsx"}。
使用者自訂的 ESLint 規則：${JSON.stringify(rules || {})}。
使用者自訂的 Prettier 設定：${JSON.stringify(prettierConfig || {})}。

請分析代碼，並做以下幾件事：
1. 作為 Prettier，請將其完全整理、理順與美化（例如：遵守 indent ${prettierConfig?.tabWidth || 2} 空格、${prettierConfig?.singleQuote ? "單引號" : "雙引號"}、${prettierConfig?.semi ? "加入尾端分號" : "省略分號"} 等規則）。
2. 作為 ESLint，請找出代碼中任何：
   - 語法錯誤 (syntax error)
   - 未使用的變數或導入 (no-unused-vars)
   - 比較運算子問題 (eqeqeq)
   - React 相關問題（例如：React 19 的新特性、應該用 className 卻用 class、危險的屬性、沒有 dependency array 的 useEffect 造成的無限渲染等等）
   - TypeScript 型別缺失或 any 濫用 (no-explicit-any, missing type annoations)
3. 將發現的 ESLint 警告與錯誤列成清單，準確寫出該問題發生在原代碼的哪一行 (line) 和 哪一欄 (column)。
4. 計算程式碼品質分數 (可用 0-100 評估)、圈複雜度 (complexity)、安全評級、可維護性指數，並提供重構與改善 suggestions。
5. 所有回傳的診斷、說明、美化提示，文字請均使用 **繁體中文 (Traditional Chinese)**。`;

      const userPrompt = `這是需要請你分析的程式碼：
\`\`\`${language || "tsx"}
${code}
\`\`\``;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.1, // 低溫度使其對格式與排版更為嚴謹和穩定
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN, description: "分析是否成功" },
              formattedCode: { type: Type.STRING, description: "套用了樣式格式化與簡單 Auto-fix 的最新乾淨完整代碼" },
              linterErrors: {
                type: Type.ARRAY,
                description: "ESLint 或語法錯誤警告清單",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    line: { type: Type.INTEGER, description: "錯誤或警告發生的行號 (1-indexed)" },
                    column: { type: Type.INTEGER, description: "錯誤或警告發生的欄位 (1-indexed)" },
                    severity: { type: Type.STRING, description: "嚴重性：'error' 或 'warning'" },
                    ruleId: { type: Type.STRING, description: "規則規則 ID (例如 'no-unused-vars', 'react-hooks/exhaustive-deps', 'eqeqeq', 'syntax-error', 'react/no-unknown-property')" },
                    message: { type: Type.STRING, description: "繁體中文編寫的錯誤說明與細節" },
                    fix: { type: Type.STRING, description: "自動修復建議說明（可選）" }
                  },
                  required: ["line", "column", "severity", "ruleId", "message"]
                }
              },
              qualityMetrics: {
                type: Type.OBJECT,
                description: "程式碼健檢與品質分數指標",
                properties: {
                  score: { type: Type.INTEGER, description: "綜合品質分數 (0-100)" },
                  complexity: { type: Type.STRING, description: "圈複雜度級別：'Low' | 'Medium' | 'High'" },
                  security: { type: Type.STRING, description: "安全評估級別：'Safe' | 'Suspect' | 'Vulnerable'" },
                  maintainability: { type: Type.INTEGER, description: "可維護性指標分數 (0-100)" },
                  performance: { type: Type.INTEGER, description: "效能最佳實踐分數 (0-100)" }
                },
                required: ["score", "complexity", "security", "maintainability", "performance"]
              },
              qualityReport: {
                type: Type.OBJECT,
                description: "完整的中文代碼品質報告",
                properties: {
                  summary: { type: Type.STRING, description: "對於程式碼的架構與寫法的整體繁體中文精緻簡評" },
                  issues: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "指出代碼裡的程式壞味道（Code Smells）或壞習慣" 
                  },
                  suggestions: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "具體的中文程式碼最佳化、重構、或寫法升級建議" 
                  }
                },
                required: ["summary", "issues", "suggestions"]
              }
            },
            required: ["success", "formattedCode", "linterErrors", "qualityMetrics", "qualityReport"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("模型未回傳任何資料");
      }

      const parsedResult = JSON.parse(responseText.trim());
      res.json(parsedResult);

    } catch (error: any) {
      console.error("SDK 呼叫或 JSON 解析出錯：", error);
      res.status(500).json({
        error: "分析程式碼時發生伺服器錯誤",
        details: error.message || error
      });
    }
  });

  // 挂载 Vite 中间件（在開發模式或 dist 尚未 build 建置時）
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV !== "production" || !hasDist) {
    console.log("正在使用 Vite 開發伺服器中間件進行前端熱重載與動態編譯...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // 生產環境下，靜態託管編譯產生的 dist/
    console.log("正在以靜態託管方式提供編譯完成的生產環境資源...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booting on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
