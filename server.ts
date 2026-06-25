import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config();

function cleanKey(key: string | undefined): string {
  if (!key) return "";
  return key.trim().replace(/^["']|["']$/g, "");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API 路由: 程式碼品質與 ESLint/Prettier 分析
  app.post("/api/analyze", async (req, res) => {
    const { provider, code, language, rules, prettierConfig } = req.body;

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "請提供有效的程式碼字串" });
      return;
    }

    const selectedProvider = provider || "gemini";
    let resultText = "";

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
   - TypeScript 型別缺失或 any 濫用 (no-explicit-any, missing type annotations)
3. 將發現的 ESLint 警告與錯誤列成清單，準確寫出該問題發生在原代碼的哪一行 (line) 和 哪一欄 (column)。
4. 計算程式碼品質分數 (可用 0-100 評估)、圈複雜度 (complexity)、安全評級、可維護性指數，並提供重構與改善 suggestions。
5. 所有回傳的診斷、說明、美化提示，文字請均使用 **繁體中文 (Traditional Chinese)**。`;

    const userPrompt = `這是需要請你分析的程式碼：
\`\`\`${language || "tsx"}
${code}
\`\`\``;

    const responseSchema = {
      type: "object",
      properties: {
        success: { type: "boolean", description: "分析是否成功" },
        formattedCode: { type: "string", description: "套用了樣式格式化與簡單 Auto-fix 的最新乾淨完整代碼" },
        linterErrors: {
          type: "array",
          description: "ESLint 或語法錯誤警告清單",
          items: {
            type: "object",
            properties: {
              line: { type: "integer", description: "錯誤或警告發生的行號 (1-indexed)" },
              column: { type: "integer", description: "錯誤或警告發生的欄位 (1-indexed)" },
              severity: { type: "string", description: "嚴重性：'error' 或 'warning'" },
              ruleId: { type: "string", description: "規則規則 ID (例如 'no-unused-vars', 'react-hooks/exhaustive-deps', 'eqeqeq', 'syntax-error', 'react/no-unknown-property')" },
              message: { type: "string", description: "繁體中文編寫的錯誤說明與細節" },
              fix: { type: "string", description: "自動修復建議說明（可選）" }
            },
            required: ["line", "column", "severity", "ruleId", "message"]
          }
        },
        qualityMetrics: {
          type: "object",
          description: "程式碼健檢與品質分數指標",
          properties: {
            score: { type: "integer", description: "綜合品質分數 (0-100)" },
            complexity: { type: "string", description: "圈複雜度級別：'Low' | 'Medium' | 'High'" },
            security: { type: "string", description: "安全評估級別：'Safe' | 'Suspect' | 'Vulnerable'" },
            maintainability: { type: "integer", description: "可維護性指標分數 (0-100)" },
            performance: { type: "integer", description: "效能最佳實踐分數 (0-100)" }
          },
          required: ["score", "complexity", "security", "maintainability", "performance"]
        },
        qualityReport: {
          type: "object",
          description: "完整的中文代碼品質報告",
          properties: {
            summary: { type: "string", description: "對於程式碼的架構與寫法的整體繁體中文精緻簡評" },
            issues: { 
              type: "array", 
              items: { type: "string" },
              description: "指出代碼裡的程式壞味道（Code Smells）或壞習慣" 
            },
            suggestions: { 
              type: "array", 
              items: { type: "string" },
              description: "具體的中文程式碼最佳化、重構、或寫法升級建議" 
            }
          },
          required: ["summary", "issues", "suggestions"]
        }
      },
      required: ["success", "formattedCode", "linterErrors", "qualityMetrics", "qualityReport"]
    };

    try {
      if (selectedProvider === "gemini") {
        const rawKey = process.env.GEMINI_API_KEY;
        const apiKey = cleanKey(rawKey);
        if (!apiKey) {
          res.status(500).json({ error: "未設定 GEMINI_API_KEY 環境變數。" });
          return;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
        const payloadData = {
          contents: [
            {
              parts: [
                { text: userPrompt }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              { text: systemInstruction }
            ]
          },
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payloadData)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        const rawKey = process.env.NVIDIA_API_KEY;
        const apiKey = cleanKey(rawKey);
        if (!apiKey) {
          res.status(500).json({ error: "未設定 NVIDIA_API_KEY 環境變數。" });
          return;
        }

        let modelName = "";
        if (selectedProvider === "nvidia-code") {
          modelName = "nvidia/nv-embedcode-7b-v1";
        } else if (selectedProvider === "nvidia") {
          modelName = "nvidia/nemotron-3-ultra-550b-a55b";
        } else if (selectedProvider === "meta") {
          modelName = "meta/llama-3.3-70b-instruct";
        } else {
          res.status(400).json({ error: `未支援的服務商: ${selectedProvider}` });
          return;
        }

        const url = "https://integrate.api.nvidia.com/v1/chat/completions";
        
        let enhancedUserPrompt = userPrompt;
        enhancedUserPrompt += `\n\n[IMPORTANT REQUIREMENT] You must output a JSON object adhering strictly to this schema:
${JSON.stringify(responseSchema, null, 2)}
Ensure the response contains no markdown wrapper or only valid JSON.`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: enhancedUserPrompt }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Nvidia/Meta API error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        resultText = data.choices?.[0]?.message?.content;
      }

      if (!resultText) {
        throw new Error("模型未回傳任何 analysis 資料");
      }

      let cleanedJson = resultText.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      const parsedResult = JSON.parse(cleanedJson);
      res.status(200).json(parsedResult);

    } catch (error: any) {
      console.error("API 呼叫或 JSON 解析出錯：", error);
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
