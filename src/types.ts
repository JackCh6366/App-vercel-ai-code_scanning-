export interface LinterError {
  line: number;
  column: number;
  severity: "error" | "warning";
  ruleId: string;
  message: string;
  fix?: string;
}

export interface QualityMetrics {
  score: number;
  complexity: "Low" | "Medium" | "High";
  security: "Safe" | "Suspect" | "Vulnerable";
  maintainability: number;
  performance: number;
}

export interface QualityReport {
  summary: string;
  issues: string[];
  suggestions: string[];
}

export interface LintResult {
  success: boolean;
  formattedCode: string;
  linterErrors: LinterError[];
  qualityMetrics: QualityMetrics;
  qualityReport: QualityReport;
}

export interface PrettierConfig {
  tabWidth: number;
  singleQuote: boolean;
  semi: boolean;
  trailingComma: boolean;
}

export interface LinterRules {
  "no-unused-vars": boolean;
  "eqeqeq": boolean;
  "react-hooks/exhaustive-deps": boolean;
  "no-explicit-any": boolean;
  "react/no-unknown-property": boolean;
}

export interface CodeTemplate {
  name: string;
  description: string;
  language: string;
  code: string;
}
