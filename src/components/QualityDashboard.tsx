import React from "react";
import { QualityMetrics, QualityReport } from "../types";
import { 
  Zap, 
  ShieldAlert, 
  Settings2, 
  Lightbulb, 
  AlertTriangle, 
  PieChart, 
  CheckCircle2, 
  TrendingUp,
  Sliders,
  Code
} from "lucide-react";

interface QualityDashboardProps {
  metrics: QualityMetrics;
  report: QualityReport;
}

export default function QualityDashboard({ metrics, report }: QualityDashboardProps) {
  // 動態判定分數顏色
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  // 圈複雜度顏色
  const getComplexityColor = (comp: string) => {
    switch (comp?.toUpperCase()) {
      case "LOW":
        return "text-emerald-400 bg-emerald-500/10";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-500/10";
      case "HIGH":
        return "text-rose-400 bg-rose-500/10";
      default:
        return "text-slate-400 bg-slate-800";
    }
  };

  // 安全評級顏色
  const getSecurityColor = (sec: string) => {
    switch (sec?.toUpperCase()) {
      case "SAFE":
        return "text-emerald-400 bg-emerald-500/10";
      case "SUSPECT":
        return "text-yellow-400 bg-yellow-500/10";
      case "VULNERABLE":
        return "text-rose-400 bg-rose-500/10";
      default:
        return "text-slate-400 bg-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 頂部雙欄：分數圈環 與 摘要 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 品質總分環形卡片 */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
          {/* 背景光暈對抗單調 */}
          <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />

          <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4 inline-flex items-center space-x-1">
            <PieChart className="h-4 w-4 text-slate-400" />
            <span>程式碼綜合品質</span>
          </h3>

          {/* 品質分大環形 */}
          <div className="relative h-32 w-32 flex items-center justify-center">
            {/* 圓環背景 */}
            <svg className="absolute transform -rotate-90 w-full h-full">
              <circle
                cx="64"
                cy="64"
                r="50"
                strokeWidth="8"
                stroke="#1e293b"
                fill="transparent"
                className="stroke-slate-800"
              />
              <circle
                cx="64"
                cy="64"
                r="50"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * metrics.score) / 100}
                className={`transition-all duration-1000 ease-out ${
                  metrics.score >= 90
                    ? "text-emerald-500 animate-pulse-subtle"
                    : metrics.score >= 70
                    ? "text-yellow-500"
                    : "text-rose-500"
                }`}
              />
            </svg>
            <div className="text-center">
              <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                {metrics.score}
              </span>
              <span className="text-slate-500 text-xs block font-medium">/ 100 分</span>
            </div>
          </div>

          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide mt-5 border ${getScoreColor(metrics.score)}`}>
            {metrics.score >= 90 ? "優良等級 (Excellent)" : metrics.score >= 70 ? "尚可等級 (Acceptable)" : "亟待重構 (Action Required)"}
          </span>
        </div>

        {/* 整體摘要卡片 */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Code className="h-32 w-32 text-indigo-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
              <h3 className="text-base font-bold text-slate-200">AI 結構審查簡評</h3>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">
              {report.summary || "尚未開始檢測，請貼上程式碼並點擊執行檢測按鈕來獲取專業 AI 評語。"}
            </p>
          </div>

          {/* 指標快速回顧 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            {/* 指標 1 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <span className="text-xs text-slate-500 block font-medium mb-1">可維護性指數</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-slate-200 font-mono">{metrics.maintainability}</span>
                <span className="text-slate-600 text-xs font-mono">%</span>
              </div>
            </div>

            {/* 指標 2 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <span className="text-xs text-slate-500 block font-medium mb-1">效能最佳度</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-slate-200 font-mono">{metrics.performance}</span>
                <span className="text-slate-600 text-xs font-mono">%</span>
              </div>
            </div>

            {/* 指標 3 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <span className="text-xs text-slate-500 block font-medium mb-1">圈複雜度</span>
              <span className={`text-[13px] font-bold px-2 py-0.5 rounded inline-block tracking-wide mt-0.5 ${getComplexityColor(metrics.complexity)}`}>
                {metrics.complexity ? `${metrics.complexity}` : "--"}
              </span>
            </div>

            {/* 指標 4 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
              <span className="text-xs text-slate-500 block font-medium mb-1">安全性評估</span>
              <span className={`text-[13px] font-bold px-2 py-0.5 rounded inline-block tracking-wide mt-0.5 ${getSecurityColor(metrics.security)}`}>
                {metrics.security ? `${metrics.security}` : "--"}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 雙卡片：主要問題（缺點/Smells）與 優化重構建議 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 主要問題/品質缺陷 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center space-x-2 text-rose-400 mb-4 border-b border-slate-800 pb-3">
            <AlertTriangle className="h-5 w-5" />
            <h4 className="text-sm font-bold tracking-wide">識別出的程式壞味道 / 潛在問題 ({report.issues.length})</h4>
          </div>

          {report.issues.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
              <span>未檢測出任何值得擔憂的程式重構警告或架構缺陷！</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {report.issues.map((issue, idx) => (
                <li key={idx} className="flex items-start space-x-2.5 text-slate-300 text-[13px] leading-relaxed">
                  <span className="flex-shrink-0 h-4.5 w-4.5 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs mt-0.5 font-mono">
                    {idx + 1}
                  </span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 優化重構/效能建議 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center space-x-2 text-indigo-400 mb-4 border-b border-slate-800 pb-3">
            <Lightbulb className="h-5 w-5 text-indigo-400" />
            <h4 className="text-sm font-bold tracking-wide">AI 重構與昇華建議</h4>
          </div>

          {report.suggestions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
              <span>程式碼設計得非常精緻，暫無更高維度的重構建議。</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {report.suggestions.map((sug, idx) => (
                <li key={idx} className="flex items-start space-x-2.5 text-slate-300 text-[13px] leading-relaxed">
                  <span className="flex-shrink-0 h-4.5 w-4.5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs mt-0.5 font-mono">
                    {idx + 1}
                  </span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

    </div>
  );
}
