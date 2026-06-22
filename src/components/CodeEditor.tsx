import React, { useMemo, useRef, useState } from "react";
import { PrettierConfig, LinterRules, CodeTemplate } from "../types";
import { TEMPLATES } from "../templates";
import { Settings, Play, CheckCircle, FileCode, Sliders, ChevronDown, FileUp, UploadCloud } from "lucide-react";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  prettierConfig: PrettierConfig;
  setPrettierConfig: (cfg: PrettierConfig) => void;
  rules: LinterRules;
  setRules: (rules: LinterRules) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onLoadTemplate: (tmpl: CodeTemplate) => void;
  onAutoFixAll: () => void;
}

export default function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  prettierConfig,
  setPrettierConfig,
  rules,
  setRules,
  isAnalyzing,
  onAnalyze,
  onLoadTemplate,
  onAutoFixAll,
}: CodeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 自動產生左側行號
  const lineNumbers = useMemo(() => {
    const lines = code.split("\n");
    return Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);
  }, [code]);

  // 更新 ESLint 規則開關
  const toggleRule = (key: keyof LinterRules) => {
    setRules({
      ...rules,
      [key]: !rules[key],
    });
  };

  // 更新 Prettier 設定項目
  const updatePrettier = (key: keyof PrettierConfig, value: any) => {
    setPrettierConfig({
      ...prettierConfig,
      [key]: value,
    });
  };

  // 處理讀取到的檔案內容
  const processFile = (file: File) => {
    if (!file) return;
    
    // 自動推判語言
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "tsx") {
      setLanguage("tsx");
    } else if (ext === "ts") {
      setLanguage("typescript");
    } else if (ext === "js" || ext === "jsx" || ext === "html") {
      setLanguage("javascript");
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCode(text);
      }
    };
    reader.readAsText(file);
  };

  // 點擊上傳原始碼檔案
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Drag & Drop 事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* 隱藏的原生 file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".js,.jsx,.ts,.tsx,.json,.html,.css,.txt"
        className="hidden"
      />

      {/* 頂部功能區：模板選擇 & 語言設定 */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileCode className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-slate-200 text-sm tracking-tight">
              輸入待檢測程式碼
            </span>
          </div>

          {/* 檔案導入按鈕 */}
          <button
            type="button"
            onClick={triggerFileSelect}
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-300 rounded border border-indigo-500/20 transition cursor-pointer font-medium"
            title="支援直接帶入程式碼檔案 (.js, .jsx, .ts, .tsx, .html 等)"
          >
            <FileUp className="h-3.5 w-3.5" />
            <span>導入原生檔案</span>
          </button>
        </div>

        {/* 快捷範例 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">貼上範例：</span>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => onLoadTemplate(tmpl)}
              type="button"
              className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 text-slate-300 rounded border border-slate-700 transition"
              title={tmpl.description}
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* 設定欄與編輯器主區 */}
      <div className="flex flex-col md:flex-row flex-1 min-h-[460px] overflow-hidden">
        
        {/* 左側：程式碼編寫區 */}
        <div 
          className={`flex-1 flex flex-col relative bg-slate-950 overflow-hidden transition-all duration-250 ${
            isDragging ? "ring-2 ring-emerald-500 ring-inset bg-slate-900/60" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag Overlay 提示 */}
          {isDragging && (
            <div className="absolute inset-0 bg-slate-950/85 z-20 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
              <UploadCloud className="h-12 w-12 text-emerald-400 animate-bounce mb-3" />
              <p className="text-sm font-semibold text-slate-200">
                放開滑鼠以載入程式檔 📄
              </p>
              <p className="text-xs text-slate-500 mt-1">
                支援 .js, .jsx, .ts, .tsx, .html, .json 等原生格式
              </p>
            </div>
          )}
          {/* 工具小徽章 / 語言切換 */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 text-xs">
            <div className="flex items-center space-x-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-850 text-slate-300 border border-slate-700 px-2.5 py-1 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer font-mono"
              >
                <option value="tsx">React (TSX)</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div className="text-slate-500 font-mono">
              {code.length} 字元 • {lineNumbers.length} 行
            </div>
          </div>

          {/* 程式碼輸入主體 (模擬專業編輯器帶行號) */}
          <div className="flex-1 flex overflow-y-auto font-mono text-[13px] leading-6 relative select-text custom-scrollbar">
            {/* 行號欄 */}
            <div className="py-4 select-none pr-3 pl-4 bg-slate-950 border-r border-slate-800/80 text-right text-slate-600 min-w-[3.5rem]">
              {lineNumbers.map((num) => (
                <div key={num} className="h-6">
                  {num}
                </div>
              ))}
            </div>

            {/* textarea 輸入區 (覆蓋在上面) */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// 在這裡貼上您的 React, TypeScript 或 JavaScript 程式碼..."
              spellCheck="false"
              className="flex-1 py-4 px-4 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-mono min-h-full whitespace-pre select-text h-[500px]"
              id="code-input-textarea"
            />
          </div>
        </div>

        {/* 右側：ESLint 與 Prettier 設定側邊面板 */}
        <div className="w-full md:w-80 bg-slate-900 borders-l border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col justify-between space-y-6 overflow-y-auto">
          
          {/* 微調設置 */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-1.5 text-slate-200">
                <Settings className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-sm font-semibold tracking-wide">Prettier 格式化設定</h3>
              </div>
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-lg space-y-3.5">
                {/* 縮排寬度 */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-medium">縮排大小 (Tab Width)</label>
                  <select
                    value={prettierConfig.tabWidth}
                    onChange={(e) => updatePrettier("tabWidth", Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  >
                    <option value={2}>2 格太空</option>
                    <option value={4}>4 格太空</option>
                    <option value={8}>8 格太空</option>
                  </select>
                </div>

                {/* 單引號 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">優先使用單引號</span>
                  <button
                    type="button"
                    onClick={() => updatePrettier("singleQuote", !prettierConfig.singleQuote)}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prettierConfig.singleQuote ? "bg-indigo-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prettierConfig.singleQuote ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 結尾分號 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">結尾補齊分號</span>
                  <button
                    type="button"
                    onClick={() => updatePrettier("semi", !prettierConfig.semi)}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prettierConfig.semi ? "bg-indigo-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prettierConfig.semi ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 結尾逗號 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">多行結尾逗號</span>
                  <button
                    type="button"
                    onClick={() => updatePrettier("trailingComma", !prettierConfig.trailingComma)}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      prettierConfig.trailingComma ? "bg-indigo-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prettierConfig.trailingComma ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ESLint 檢測規則開關 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-1.5 text-slate-200">
                <Sliders className="h-4.5 w-4.5 text-emerald-400" />
                <h3 className="text-sm font-semibold tracking-wide">ESLint 規則整合</h3>
              </div>
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-lg space-y-3.5 text-xs text-slate-300">
                {/* 規則一：未使用的變數 */}
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rules["no-unused-vars"]}
                    onChange={() => toggleRule("no-unused-vars")}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 h-4.5 w-4.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-200 font-mono">no-unused-vars</div>
                    <p className="text-[11px] text-slate-400 leading-normal">禁止定義未使用的變數/模組引入</p>
                  </div>
                </label>

                {/* 規則二：eqeqeq */}
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rules["eqeqeq"]}
                    onChange={() => toggleRule("eqeqeq")}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 h-4.5 w-4.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-200 font-mono">eqeqeq</div>
                    <p className="text-[11px] text-slate-400 leading-normal">要求一律使用強型別比對 === & !==</p>
                  </div>
                </label>

                {/* 規則三：React Hooks 依賴 */}
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rules["react-hooks/exhaustive-deps"]}
                    onChange={() => toggleRule("react-hooks/exhaustive-deps")}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 h-4.5 w-4.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-200 font-mono font-sans inline-flex items-center">
                      react-hooks/deps
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">驗證 Hook 的依賴清單，防範無限迴圈</p>
                  </div>
                </label>

                {/* 規則四：no-explicit-any */}
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rules["no-explicit-any"]}
                    onChange={() => toggleRule("no-explicit-any")}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 h-4.5 w-4.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-200 font-mono">no-explicit-any</div>
                    <p className="text-[11px] text-slate-400 leading-normal">要求明確寫出型別，禁止使用 unsafe any</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 常用 ESLint 異常一鍵修復 & 送出偵測按鈕 */}
          <div className="space-y-3">
            <button
              onClick={onAutoFixAll}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl font-medium tracking-wide flex items-center justify-center space-x-1.5 transition text-xs border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 hover:text-indigo-200 cursor-pointer hover:border-indigo-500/50"
              title="一鍵修復代碼中的 class -> className, == -> ===, useEffect 缺失依賴等極常見 ESLint/語法問題"
            >
              <span className="animate-pulse">⚡</span>
              <span>一鍵智慧 Auto-Fix 常用錯誤</span>
            </button>

            <button
              onClick={onAnalyze}
              disabled={isAnalyzing || !code.trim()}
              type="button"
              className={`w-full py-3.5 px-4 rounded-xl font-medium tracking-wide flex items-center justify-center space-x-2 transition shadow-lg ${
                isAnalyzing 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-semibold hover:-translate-y-0.5 active:translate-y-0 active:opacity-90 cursor-pointer shadow-emerald-500/10"
              }`}
              id="analyze-run-button"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-slate-300">AI 雲端檢測中...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 text-emerald-300 fill-emerald-300/40" />
                  <span>執行品質排版檢測</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
