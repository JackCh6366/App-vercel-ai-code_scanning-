import React, { useState, useEffect } from "react";
import CodeEditor from "./components/CodeEditor";
import QualityDashboard from "./components/QualityDashboard";
import LinterIssuesList from "./components/LinterIssuesList";
import { LintResult, PrettierConfig, LinterRules, CodeTemplate } from "./types";
import { TEMPLATES } from "./templates";
import { 
  FileCode, 
  Terminal, 
  ShieldCheck, 
  AlertCircle, 
  Settings, 
  Copy, 
  Check, 
  FolderPlus,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  History,
  FileJson,
  Download,
  FileDown
} from "lucide-react";

export default function App() {
  // 程式碼與編輯狀態
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [language, setLanguage] = useState<string>("tsx");
  
  // Prettier & ESLint 設定
  const [prettierConfig, setPrettierConfig] = useState<PrettierConfig>({
    tabWidth: 2,
    singleQuote: false,
    semi: true,
    trailingComma: true,
  });

  const [rules, setRules] = useState<LinterRules>({
    "no-unused-vars": true,
    "eqeqeq": true,
    "react-hooks/exhaustive-deps": true,
    "no-explicit-any": true,
    "react/no-unknown-property": true,
  });

  // 分析結果與狀態標記
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<LintResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<{timestamp: string, score: number, issuesCount: number}[]>([]);

  // 左側 mock 專案樹選取狀態
  const [selectedFile, setSelectedFile] = useState<string>("App.tsx");

  // 初始分析
  useEffect(() => {
    handleAnalyze();
  }, []);

  // 執行檢測/分析
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/lint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          rules,
          prettierConfig,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "伺服器分析發生錯誤。");
      }

      const data: LintResult = await response.json();
      setResult(data);

      // 儲存至歷史分析記錄
      const timeStr = new Date().toLocaleTimeString("zh-TW", { hour12: false });
      setHistory(prev => [
        {
          timestamp: timeStr,
          score: data.qualityMetrics.score,
          issuesCount: data.linterErrors.length
        },
        ...prev.slice(0, 4) // 保留最近 5 筆
      ]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "連線至服務端失敗，請確認伺服器運作狀態。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 支持直接傳遞程式碼進行分析（防止 React useState 異步問題）
  const triggerDirectAnalyze = async (codeToAnalyze: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/lint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: codeToAnalyze,
          language,
          rules,
          prettierConfig,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "伺服器分析發生錯誤。");
      }

      const data: LintResult = await response.json();
      setResult(data);

      // 儲存至歷史分析記錄
      const timeStr = new Date().toLocaleTimeString("zh-TW", { hour12: false });
      setHistory(prev => [
        {
          timestamp: timeStr,
          score: data.qualityMetrics.score,
          issuesCount: data.linterErrors.length
        },
        ...prev.slice(0, 4)
      ]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "連線至服務端失敗，請確認伺服器運作狀態。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 一鍵智慧修復常用 ESLint / 語法錯誤並隨即執行掃描
  const handleAutoFixAll = () => {
    let fixed = code;

    // 1. 修復 class -> className (JSX 特性)
    fixed = fixed.replace(/\bclass=(['"])(.*?)\1/g, 'className=$1$2$1');

    // 2. 修復 eqeqeq (== 替換為 ===, != 替換為 !==)
    fixed = fixed.replace(/\s==\s(['"].*?['"]|\d+|true|false|\w+(\.\w+)*)/g, ' === $1');
    fixed = fixed.replace(/\s!=\s(['"].*?['"]|\d+|true|false|\w+(\.\w+)*)/g, ' !== $1');

    // 3. 修復 style 字串（例如 style="color: red" -> style={{color: "red"}}）
    fixed = fixed.replace(/style=["']color:\s*['"]?(\w+)['"]?["']/gi, 'style={{color: "$1"}}');

    // 4. 修復 React useEffect 無限渲染/依賴缺失 (非常常見的依賴缺陷)
    if (fixed.includes("useEffect") && (fixed.includes("fetch") || fixed.includes("setData") || fixed.includes("setCount"))) {
      const lines = fixed.split("\n");
      let inUseEffect = false;
      let openBraces = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("useEffect")) {
          inUseEffect = true;
          openBraces = 0;
        }
        if (inUseEffect) {
          openBraces += (lines[i].match(/{/g) || []).length;
          openBraces -= (lines[i].match(/}/g) || []).length;
          
          if (openBraces === 0 && lines[i].includes("});")) {
            lines[i] = lines[i].replace("});", "}, []); // AI 自動補上依賴陣列防止無限渲染");
            inUseEffect = false;
          }
        }
      }
      fixed = lines.join("\n");
    }

    // 5. 本地安全排除常見的 no-unused-vars (如範例中被列為警告的未使用變數)
    fixed = fixed.replace(/const tempVal\s*=\s*\d+;/g, "// const tempVal = 100; // 已自動排除未使用變數");
    fixed = fixed.replace(/const unusedSecretToken\s*=\s*['"][^'"]*['"];/g, "// 已自動移除未使用的 unusedSecretToken 變數 \n  // const unusedSecretToken = '...'");

    // 更新 React State 呈現到編輯器
    setCode(fixed);

    // 立刻不等待非同步 State 立即執行高品質掃描
    triggerDirectAnalyze(fixed);
  };

  // 載入快捷模板
  const handleLoadTemplate = (tmpl: CodeTemplate) => {
    setCode(tmpl.code);
    setLanguage(tmpl.language);
  };

  // 下載 JSON 報告
  const handleDownloadJSON = () => {
    if (!result) return;
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-analysis-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 下載 Markdown 報告 (Markdown Report Format)
  const handleDownloadMarkdown = () => {
    if (!result) return;
    
    const errorsMarkdown = result.linterErrors.length === 0 
      ? "*恭喜！未偵測到任何代碼風格或 ESLint 異常規範問題。🟢*\n" 
      : result.linterErrors.map((err, idx) => 
          `### ${idx + 1}. [${err.severity.toUpperCase()}] ${err.message}\n` +
          `- **行號 / 欄位**: L${err.line}:${err.column}\n` +
          `- **法規規則**: \`${err.ruleId || "Syntax Error"}\`\n` +
          (err.context ? `- **代碼上下文**:\n\`\`\`javascript\n${err.context}\n\`\`\`\n` : "")
        ).join("\n");

    const mdContent = `# 🚀 原始碼排版與 ESLint 品質健檢報告

## 📊 代碼品質指標
- **代碼品質總分數**: **${result.qualityMetrics.score}分** ${result.qualityMetrics.score >= 90 ? "🟢 (優秀)" : result.qualityMetrics.score >= 70 ? "🟡 (佳)" : "🔴 (待重構)"}
- **行數 (Lines)**: ${result.qualityMetrics.loc} 行
- **發現異常數 (Issues)**: ${result.linterErrors.length} 個

## 🔍 AI 深度品質建議報告
${result.qualityReport}

---

## 🐞 異常條目與 ESLint 風格問題細節
${errorsMarkdown}

---
*報告產生時間: ${new Date().toLocaleString("zh-TW")} - 由 AI 雲端代碼健檢大師自動產生*
`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-quality-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 複製格式化完成的程式碼
  const handleCopyFormattedCode = () => {
    if (!result?.formattedCode) return;
    navigator.clipboard.writeText(result.formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 套用美化代碼至編輯器
  const handleApplyFormatting = () => {
    if (!result?.formattedCode) return;
    setCode(result.formattedCode);
  };

  // 即時計算行號供狀態列顯示
  const cursorLine = code.split("\n").length;
  const cursorCol = code.length;

  return (
    <div className="flex flex-col h-screen w-full bg-[#0f172a] text-slate-300 font-sans overflow-hidden">
      
      {/* 頂部導航列 (14-h px) */}
      <header className="h-14 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m18.536 4.475L11.215 22.38a2.454 2.454 0 01-3.43 0L1.846 12.947a2.454 2.454 0 010-3.43l9.369-9.369a2.454 2.454 0 013.43 0l9.369 9.369a2.454 2.454 0 010 3.43z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              <span>ViteInspector</span>
              <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1 py-0.5 rounded font-mono font-normal">v1.2.0</span>
            </h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Vite • TypeScript • Prettier • ESLint</p>
          </div>
        </div>

        {/* 狀態快捷監控 */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${prettierConfig.semi ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"}`}></span>
            <span className="text-[11px] font-medium text-slate-400">Prettier Mode: {prettierConfig.semi ? "Strict" : "Standard"}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${result && result.linterErrors.length > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></span>
            <span className="text-xs font-semibold text-slate-200">
              {isAnalyzing ? "正在偵測中..." : result ? `發現 ${result.linterErrors.length} 個異常項目` : "尚未開展檢測"}
            </span>
          </div>

          <button 
            type="button"
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-xs font-bold rounded shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-95 transition"
          >
            {isAnalyzing ? "AI 掃描中..." : "即時全面掃描"}
          </button>
        </div>
      </header>

      {/* 主體展示區域 */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* 左側：Mock 目錄架構與歷史 */}
        <aside className="hidden lg:flex w-64 bg-[#090d16] border-r border-slate-800 flex-col overflow-y-auto">
          
          {/* 目錄結構 */}
          <div className="p-4 border-b border-slate-800/60">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Project Workspace</h2>
            <ul className="space-y-1 text-xs">
              <li className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800/40 text-slate-400 cursor-pointer">
                <span className="flex items-center gap-2">
                  <span className="text-amber-500 font-semibold font-sans">📁</span> src
                </span>
                <span className="text-[10px] text-slate-600">3 檔案</span>
              </li>
              <li className="flex items-center gap-2 ml-4 px-2 py-1.5 rounded hover:bg-slate-800/40 text-slate-400 cursor-pointer">
                <span>📁</span> components
              </li>
              <li 
                onClick={() => setSelectedFile("App.tsx")}
                className={`flex items-center justify-between ml-8 px-2 py-1.5 rounded cursor-pointer transition ${
                  selectedFile === "App.tsx" 
                    ? "bg-indigo-500/15 text-indigo-400 font-semibold" 
                    : "hover:bg-slate-800/40 text-slate-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-indigo-400">⚛️</span> App.tsx
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              </li>
              <li 
                onClick={() => setSelectedFile("index.css")}
                className={`flex items-center justify-between ml-8 px-2 py-1.5 rounded cursor-pointer transition ${
                  selectedFile === "index.css"
                    ? "bg-indigo-500/15 text-indigo-400 font-semibold"
                    : "hover:bg-slate-800/40 text-slate-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🎨</span> index.css
                </span>
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/40 text-slate-500 cursor-not-allowed">
                <span>⚙️</span> eslint.config.js
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/40 text-slate-500 cursor-not-allowed">
                <span>📄</span> .prettierrc
              </li>
            </ul>
          </div>

          {/* 靜態環境資訊 */}
          <div className="p-4 border-b border-slate-800/60">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">檢測執行核心環境</h2>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Vite Engine</span>
                  <span className="text-slate-400 font-mono">v6.2.3</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">TypeScript</span>
                  <span className="text-slate-400 font-mono">v5.8.2</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">React Core</span>
                  <span className="text-slate-400 font-mono">v19.0.1</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">ESLint AI Mode</span>
                  <span className="text-emerald-400 font-semibold font-mono">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* 掃描歷史 */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">分析歷史紀錄</h2>
              <History className="h-3.5 w-3.5 text-slate-600" />
            </div>
            {history.length === 0 ? (
              <p className="text-[11px] text-slate-600 italic">尚未有檢測紀錄</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800/50 p-2 rounded text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-500 font-mono">
                      <span>{h.timestamp}</span>
                      <span className={`font-semibold ${h.score >= 90 ? "text-emerald-400" : h.score >= 70 ? "text-yellow-400" : "text-rose-400"}`}>
                        {h.score}分
                      </span>
                    </div>
                    <div className="text-slate-400">
                      發現了 <span className="text-rose-400/90 font-semibold">{h.issuesCount}</span> 個語法或規範缺陷
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

        {/* 右側：主工作區。包含：上部 CodeEditor，下部 Linter結果與 AI Dashboard */}
        <section className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden">
          
          {/* 上方麵包屑指示 */}
          <div className="h-10 bg-[#151b2e] border-b border-slate-800 flex items-center justify-between px-6 z-10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">workspace / src /</span>
              <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-slate-400" />
                {selectedFile}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {result && (
                <button
                  onClick={handleApplyFormatting}
                  type="button"
                  className="px-2.5 py-1 text-xs text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 rounded cursor-pointer transition flex items-center space-x-1"
                  title="將美化後的程式碼直接寫回編輯區"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>套用 AI 格式化</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            
            {/* 錯誤資訊橫幅 */}
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-r-xl text-xs text-rose-300 flex items-start gap-2.5 shadow-md">
                <AlertCircle className="h-4 w-4 mt-0.5 text-rose-400 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-sm text-rose-200 mb-0.5">執行檢測分析出錯</span>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* 輸入與設定編輯器 */}
            <div className="relative">
              <CodeEditor
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
                prettierConfig={prettierConfig}
                setPrettierConfig={setPrettierConfig}
                rules={rules}
                setRules={setRules}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyze}
                onLoadTemplate={handleLoadTemplate}
                onAutoFixAll={handleAutoFixAll}
              />
            </div>

            {/* Tabs 切換/展示檢測成果 & 原始碼處理 */}
            {result && (
              <div className="space-y-6">
                
                {/* 分割線與下載報告功能 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-400" />
                    <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      檢測成果與品質報告
                    </span>
                  </div>
                  
                  {/* 下載按鈕組 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadJSON}
                      type="button"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-700/85 text-slate-300 font-medium rounded-lg border border-slate-700 transition cursor-pointer"
                      title="下載原始分析報告數據 (JSON 格式)"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      <span>匯出 JSON 報表</span>
                    </button>

                    <button
                      onClick={handleDownloadMarkdown}
                      type="button"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-300 font-medium rounded-lg border border-indigo-500/20 transition cursor-pointer hover:border-indigo-500/40"
                      title="下載排版美觀、適合 PR 附加的 豐富 Markdown 文件"
                    >
                      <FileDown className="h-3.5 w-3.5 text-indigo-400" />
                      <span>下載 Markdown 報表</span>
                    </button>
                  </div>
                </div>

                {/* ESLint 條目明細 */}
                <LinterIssuesList 
                  errors={result.linterErrors} 
                  onGoToLine={() => {
                    // 滑動到編輯器頂部
                    const editor = document.getElementById("code-input-textarea");
                    if (editor) {
                      editor.scrollIntoView({ behavior: "smooth", block: "center" });
                      editor.focus();
                    }
                  }}
                />

                {/* 格式化後程式碼 & 品質大盤 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 品質大盤 */}
                  <QualityDashboard metrics={result.qualityMetrics} report={result.qualityReport} />

                  {/* Prettier 美化整合 / Formatted 結果 */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-slate-200">
                          Prettier 排版美化程式碼
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyFormattedCode}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-705 text-slate-300 rounded border border-slate-700 cursor-pointer flex items-center space-x-1 transition"
                          title="複製至剪貼簿"
                        >
                          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copied ? "已複製!" : "複製排版代碼"}</span>
                        </button>
                      </div>
                    </div>

                    {/* 排版後的程式碼預覽 */}
                    <div className="flex-1 min-h-[300px] h-[350px] bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col">
                      <div className="flex items-center px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-[11px] text-slate-500 font-mono justify-between">
                        <span>PRETTIER AUTO-FIXED OUTPUT:</span>
                        <span>{language.toUpperCase()}</span>
                      </div>
                      <textarea
                        readOnly
                        value={result.formattedCode}
                        className="flex-1 p-4 bg-transparent text-emerald-300/90 font-mono text-xs focus:outline-none resize-none overflow-y-auto whitespace-pre leading-relaxed custom-scrollbar selection:bg-indigo-500/30"
                      />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-400">
                      <span>規格一致：整合 Tailwind CSS 縮排模式</span>
                      <button
                        onClick={handleApplyFormatting}
                        type="button"
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-semibold rounded-lg flex items-center space-x-1 cursor-pointer transition shadow-lg shadow-emerald-500/5 active:scale-95"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>覆蓋目前程式碼 (Apply)</span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* 說明區 (當使用者首次進入，未進行任何檢測時) */}
            {!result && !isAnalyzing && (
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6 shadow-xl py-12">
                <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-3xl flex items-center justify-center p-0.5 shadow-lg shadow-indigo-500/10">
                  <div className="h-full w-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                    <FileCode className="h-7 w-7 text-indigo-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-100">設定您的檢測規則並點擊開始</h3>
                  <p className="text-slate-400 text-sm max-w-md leading-relaxed mx-auto">
                    我們的 AI 技術即時編譯並自動整合 ESLint 條例與 Prettier 設定，能精準找出潛在死循環、不安全型別、無效 React 特性並一鍵格式化修復。
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left pt-2 font-medium">
                  <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                      <span>⚙️</span>
                      <h3>ESLint 精確度</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      支援 eqeqeq, no-unused-vars, 以及 React Hooks 的全方位依賴關係完整性檢驗。
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                      <span>🎨</span>
                      <h3>Prettier 自訂排版</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      配置您喜歡的縮排、單雙引號、結尾分號限制，取得最精緻、簡潔乾淨的代碼。
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  className="px-6 py-2.5 bg-[#141b2e] hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition inline-flex items-center space-x-2"
                >
                  <Play className="h-4 w-4 text-emerald-400 fill-emerald-500/30" />
                  <span>立刻執行首發代碼掃描</span>
                </button>
              </div>
            )}

          </div>

          {/* 底部裝飾與版權(Footer) */}
          <footer className="h-6 bg-indigo-600 flex items-center px-4 justify-between text-[10px] text-white font-medium flex-shrink-0 z-10 shadow-inner">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>主分支 (main branch)</span>
              </span>
              <span>行: {cursorLine}, 列: {cursorCol}</span>
              <span>萬國碼 UTF-8</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="opacity-90">技術核心: Gemini-3.5-Flash</span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> 
                <span>實時程式碼品質守護中 (Live Monitoring)</span>
              </span>
            </div>
          </footer>

        </section>

      </main>

    </div>
  );
}
