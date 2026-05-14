export interface CodeVulnerability {
  pattern: RegExp;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export const SAFETY_VULNERABILITIES: CodeVulnerability[] = [
  {
    pattern: /rm\s+-rf\s+\//,
    reason: "Потенційно небезпечне видалення кореневої директорії.",
    severity: 'high'
  },
  {
    pattern: /os\.system|subprocess\.|os\.popen/,
    reason: "Виконання системних команд (shell injection risk).",
    severity: 'medium'
  },
  {
    pattern: /print\(os\.environ\)|print\(os\.environ\.get/,
    reason: "Друк змінних оточення може розкрити секрети.",
    severity: 'high'
  },
  {
    pattern: /curl\s+.*\s*\|\s*bash|wget\s+.*\s*\|\s*bash/,
    reason: "Запуск скриптів безпосередньо з інтернету.",
    severity: 'high'
  },
  {
    pattern: /HF_TOKEN|GEMINI_API_KEY/,
    reason: "Виявлено хардкод секретів або посилання на них.",
    severity: 'high'
  }
];

export function scanCode(code: string): CodeVulnerability[] {
  const found: CodeVulnerability[] = [];
  SAFETY_VULNERABILITIES.forEach(v => {
    if (v.pattern.test(code)) {
      found.push(v);
    }
  });
  return found;
}
