import React from "react";
import { LinterError } from "../types";
import { AlertCircle, AlertTriangle, CheckCircle, Info, Sparkles } from "lucide-react";

interface LinterIssuesListProps {
  errors: LinterError[];
  onGoToLine?: (line: number) => void;
}

export default function LinterIssuesList({ errors, onGoToLine }: LinterIssuesListProps) {
  // 分類
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      
      {/* 頂部整合面板標題 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-200">
            ESLint 語法與規則檢測報告
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            由 AI 模擬的靜態編譯檢測，即時指出 React hooks 規範、型別宣告、以及潛在執行期 Bug。
          </p>
        </div>

        {/* 錯誤警告快速標籤 */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/10">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            {errorCount} 個錯誤 (Error)
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/10">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            {warningCount} 個警告 (Warning)
          </span>
        </div>
      </div>

      {errors.length === 0 ? (
        /* 無錯誤時展現的超美畫面 */
        <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
          <div className="h-16 w-16 bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-100">完美代碼！過關 👍</h4>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              完美的程式碼！您的代碼中沒有任何一條 ESLint 規則被觸發。恭喜，這段程式碼十分整潔、安全且合乎規範！
            </p>
          </div>
        </div>
      ) : (
        /* 錯誤列表 */
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {errors.map((err, index) => {
            const isError = err.severity === "error";
            return (
              <div
                key={index}
                className={`flex gap-3.5 p-4 rounded-xl border transition-all duration-200 ${
                  isError
                    ? "bg-slate-950/40 border-rose-900/30 hover:border-rose-500/20"
                    : "bg-slate-950/40 border-amber-900/30 hover:border-amber-500/20"
                }`}
              >
                {/* 嚴重程度圖示 */}
                <div className={`mt-0.5 flex-shrink-0 ${isError ? "text-rose-500" : "text-amber-500"}`}>
                  {isError ? <AlertCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>

                {/* 錯誤內容說明 */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    {/* 規則名稱 & 行號 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold tracking-wide text-slate-400 bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded">
                        {err.ruleId}
                      </span>
                      <button
                        onClick={() => onGoToLine?.(err.line)}
                        type="button"
                        className="text-slate-500 text-xs font-semibold font-mono hover:text-indigo-400 transition cursor-pointer"
                        title="點擊捲動至此行"
                      >
                        第 {err.line} 行 : {err.column} 欄
                      </button>
                    </div>

                    {/* 嚴重性標籤 */}
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold rounded ${
                      isError ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {isError ? "error" : "warning"}
                    </span>
                  </div>

                  {/* 診斷訊息 */}
                  <p className="text-slate-200 text-sm font-medium leading-relaxed">
                    {err.message}
                  </p>

                  {/* 可用的修復建議 */}
                  {err.fix && (
                    <div className="flex items-start space-x-1.5 mt-2.5 p-2 px-3 bg-indigo-950/20 border border-indigo-900/40 rounded-lg text-indigo-300 text-xs">
                      <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-indigo-400 animate-pulse-subtle" />
                      <span>
                        <strong className="font-semibold text-slate-300">建議修復方式：</strong>
                        {err.fix}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
