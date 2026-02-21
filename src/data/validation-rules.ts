/**
 * Agent Output Validation Rules
 * Quality Checks + Fact Grounding + Anti-Copycat + Consistency
 */

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  checklist: CheckResult[];
  issues: ValidationIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface CheckResult {
  rule: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface ValidationIssue {
  category: 'format' | 'content' | 'fact' | 'consistency' | 'conflict';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

/**
 * RULE 1: Output Format Validation
 * ตรวจว่า Output มี structure ที่ถูกต้อง
 */
export const formatRules = {
  requiredFields: ['task', 'result', 'reasoning'],
  optionalFields: ['confidence', 'sources', 'next_steps', 'timestamp'],

  validate: (output: any): CheckResult => {
    const issues: string[] = [];

    // Check required fields
    for (const field of formatRules.requiredFields) {
      if (!output || !output[field]) {
        issues.push(`ไม่พบ required field: "${field}"`);
      }
    }

    // Check data types
    if (output && typeof output !== 'object') {
      issues.push(`Output ต้องเป็น Object, ได้รับ ${typeof output}`);
    }

    if (output?.result && typeof output.result === 'string' && output.result.length === 0) {
      issues.push('Result ไม่ควรเป็นค่าว่าง');
    }

    return {
      rule: 'FORMAT_STRUCTURE',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'critical' : 'info',
      message:
        issues.length === 0 ? 'Format ถูกต้อง' : issues.join('; ')
    };
  }
};

/**
 * RULE 2: Fact Grounding Validation
 * ตรวจว่า Output อิงข้อมูลจริง ไม่ Hallucinate
 */
export const factGroundingRules = {
  hallucMarkers: [
    'ฉันประมาณ',
    'น่าจะ',
    'อาจจะ',
    'สมมุติว่า',
    'ถ้าหาก',
    'เหมือนว่า',
    'อาจเป็นไปได้',
    'อนุมาน',
    'ตามลำดับ',
    'คิดว่า',
    'ประมาณการ'
  ],

  requiredSources: {
    'market-analyst': ['competitor_data', 'market_research', 'trend_data'],
    'business-planner': ['cost_data', 'pricing_benchmarks', 'financial_data'],
    'insights-agent': ['performance_data', 'analytics', 'metrics']
  },

  validate: (output: any, agentId: string): CheckResult => {
    const issues: string[] = [];

    // Check for hallucination markers
    const content = JSON.stringify(output).toLowerCase();
    const foundMarkers = factGroundingRules.hallucMarkers.filter(m =>
      content.includes(m.toLowerCase())
    );

    if (foundMarkers.length > 0) {
      issues.push(`พบ hallucination markers: ${foundMarkers.join(', ')}`);
    }

    // Check sources
    if (factGroundingRules.requiredSources[agentId as keyof typeof factGroundingRules.requiredSources]) {
      const requiredSources =
        factGroundingRules.requiredSources[
          agentId as keyof typeof factGroundingRules.requiredSources
        ];

      if (!output?.sources || requiredSources.some(s => !output.sources?.includes(s))) {
        issues.push(`ต้องระบุ sources: ${requiredSources.join(', ')}`);
      }
    }

    // Check citations
    if (output?.result && typeof output.result === 'string') {
      const citationPattern = /\[.*?\]|\(source:.*?\)/i;
      if (!citationPattern.test(output.result)) {
        issues.push('ควรมี citations หรือ references');
      }
    }

    return {
      rule: 'FACT_GROUNDING',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'critical' : 'info',
      message: issues.length === 0 ? 'Fact grounding ดี' : issues.join('; ')
    };
  }
};

/**
 * RULE 3: Anti-Copycat Validation
 * ตรวจว่า Output ไม่เลียนแบบงานเก่า
 */
export const anticopyatRules = {
  validate: (
    output: any,
    previousOutputs?: { agentId: string; output: any }[]
  ): CheckResult => {
    const issues: string[] = [];

    if (!previousOutputs || previousOutputs.length === 0) {
      return {
        rule: 'ANTI_COPYCAT',
        passed: true,
        severity: 'info',
        message: 'ไม่มี previous outputs ให้เปรียบเทียบ'
      };
    }

    // ตรวจ Similarity ของ output
    const currentResult = JSON.stringify(output.result || '').toLowerCase();

    for (const prev of previousOutputs) {
      const prevResult = JSON.stringify(prev.output.result || '').toLowerCase();

      // Simple similarity check (ควรใช้ algorithm ที่ซับซ้อนมากกว่า)
      const similarity = calculateSimilarity(currentResult, prevResult);

      if (similarity > 0.8) {
        issues.push(`Output คล้ายกับ output เก่าจาก ${prev.agentId} (Similarity: ${similarity.toFixed(2)})`);
      }
    }

    return {
      rule: 'ANTI_COPYCAT',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'ไม่ค้นพบการเลียนแบบ' : issues.join('; ')
    };
  }
};

/**
 * RULE 4: Consistency Validation
 * ตรวจว่า Output ไม่ขัดกับ Master Context หรือ output เก่า
 */
export const consistencyRules = {
  validate: (
    output: any,
    masterContext: any,
    previousOutputs?: { agentId: string; output: any }[]
  ): CheckResult => {
    const issues: string[] = [];

    // Check 1: Consistency with master context
    if (masterContext) {
      // ถ้า output บอก price แต่ master context บอก free → conflict
      if (
        output.pricing === 'premium' &&
        masterContext.type === 'free'
      ) {
        issues.push('Output pricing ขัดกับ master context');
      }

      // ถ้า output บอก target premium แต่ master context บอก budget = conflict
      if (
        output.targetAudience?.includes('premium') &&
        masterContext.budget === 'limited'
      ) {
        issues.push('Target audience ไม่สอดคล้องกับ budget');
      }
    }

    // Check 2: Cross-output consistency
    if (previousOutputs && previousOutputs.length > 0) {
      // ตรวจ contradiction กับ output ก่อนหน้า
      const prevGoal = previousOutputs[0].output?.goal;
      const currentGoal = output?.goal;

      if (prevGoal && currentGoal && prevGoal !== currentGoal) {
        issues.push(`Goal เปลี่ยนจาก "${prevGoal}" เป็น "${currentGoal}"`);
      }
    }

    return {
      rule: 'CONSISTENCY',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'Consistency ดี' : issues.join('; ')
    };
  }
};

/**
 * RULE 5: Agent-Specific Constraints
 * ตรวจว่า Output ตรงตามเงื่อนไข Agent นั้น ๆ
 */
export const agentConstraints: {
  [agentId: string]: (output: any) => CheckResult;
} = {
  'market-analyst': (output) => {
    const issues: string[] = [];

    if (!output.swot) issues.push('ต้องมี SWOT Analysis');
    if (!output.competitors) issues.push('ต้องมี Competitor Analysis');
    if (!output.trends) issues.push('ต้องมี Trend Analysis');
    if (!output.confidence) issues.push('ต้องมี Confidence Score');

    return {
      rule: 'MARKET_ANALYST_CONSTRAINTS',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'ครบ constraints' : issues.join('; ')
    };
  },

  'business-planner': (output) => {
    const issues: string[] = [];

    if (!output.costBreakdown) issues.push('ต้องมี Cost Breakdown');
    if (!output.pricing) issues.push('ต้องมี Pricing Strategy');
    if (!output.roi) issues.push('ต้องมี ROI Projection');
    if (!output.tradeoffs) issues.push('ต้องมี Trade-offs Analysis');

    // ตรวจ Math
    if (output.costBreakdown && output.pricing) {
      const totalCost = Object.values(output.costBreakdown as any).reduce(
        (a: any, b: any) => (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0),
        0
      );
      const markup = output.pricing.markupPercent;

      if (markup && markup < 20) {
        issues.push('Markup ต่ำเกินไป (ต้องอย่างน้อย 20%)');
      }
    }

    return {
      rule: 'BUSINESS_PLANNER_CONSTRAINTS',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'ครบ constraints' : issues.join('; ')
    };
  },

  'insights-agent': (output) => {
    const issues: string[] = [];

    if (!output.kpi) issues.push('ต้องมี KPI Tracking');
    if (!output.metrics) issues.push('ต้องมี Performance Metrics');
    if (!output.dataSource) issues.push('ต้องระบุ Data Source');

    return {
      rule: 'INSIGHTS_AGENT_CONSTRAINTS',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'ครบ constraints' : issues.join('; ')
    };
  },

  'brand-builder': (output) => {
    const issues: string[] = [];

    if (!output.brandPersonality) issues.push('ต้องมี Brand Personality');
    if (!output.toneOfVoice) issues.push('ต้องมี Tone of Voice');
    if (!output.valueProposition) issues.push('ต้องมี Value Proposition');

    return {
      rule: 'BRAND_BUILDER_CONSTRAINTS',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'ครบ constraints' : issues.join('; ')
    };
  },

  'caption-creator': (output) => {
    const issues: string[] = [];

    if (!output.styleGuide) issues.push('ต้องมี Style Guide');
    if (!output.templates) issues.push('ต้องมี Templates');
    if (!output.emotionFramework) issues.push('ต้องมี Emotion Framework');

    return {
      rule: 'CAPTION_CREATOR_CONSTRAINTS',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'ครบ constraints' : issues.join('; ')
    };
  },

  'campaign-planner': (output) => {
    const issues: string[] = [];

    if (!output.contentCalendar) issues.push('ต้องมี Content Calendar');
    if (!output.contentMix) issues.push('ต้องมี Content Mix');
    if (
      output.contentCalendar &&
      !output.contentCalendar.every((d: any) => d.date && d.content)
    ) {
      issues.push('Content Calendar ต้องมี date และ content');
    }

    return {
      rule: 'CAMPAIGN_PLANNER_CONSTRAINTS',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'info',
      message: issues.length === 0 ? 'ครบ constraints' : issues.join('; ')
    };
  }
};

/**
 * Main Validation Function
 */
export function validateAgentOutput(
  agentId: string,
  output: any,
  masterContext?: any,
  previousOutputs?: { agentId: string; output: any }[]
): ValidationResult {
  const checklist: CheckResult[] = [];
  const issues: ValidationIssue[] = [];
  let score = 100;

  // Rule 1: Format
  const formatCheck = formatRules.validate(output);
  checklist.push(formatCheck);
  if (!formatCheck.passed) {
    score -= 30;
    issues.push({
      category: 'format',
      severity: 'critical',
      message: formatCheck.message,
      suggestion: 'ตรวจ required fields และ data types'
    });
  }

  // Rule 2: Fact Grounding
  const factCheck = factGroundingRules.validate(output, agentId);
  checklist.push(factCheck);
  if (!factCheck.passed) {
    score -= 20;
    issues.push({
      category: 'fact',
      severity: 'critical',
      message: factCheck.message,
      suggestion: 'ลบ hallucination markers และ เพิ่ม sources/citations'
    });
  }

  // Rule 3: Anti-Copycat
  const anticopyatCheck = anticopyatRules.validate(output, previousOutputs);
  checklist.push(anticopyatCheck);
  if (!anticopyatCheck.passed) {
    score -= 15;
    issues.push({
      category: 'conflict',
      severity: 'warning',
      message: anticopyatCheck.message,
      suggestion: 'เพิ่มข้อมูลใหม่ หรือ unique perspectives'
    });
  }

  // Rule 4: Consistency
  const consistencyCheck = consistencyRules.validate(output, masterContext, previousOutputs);
  checklist.push(consistencyCheck);
  if (!consistencyCheck.passed) {
    score -= 15;
    issues.push({
      category: 'consistency',
      severity: 'warning',
      message: consistencyCheck.message,
      suggestion: 'ตรวจ master context และ previous outputs'
    });
  }

  // Rule 5: Agent-Specific Constraints
  if (agentConstraints[agentId]) {
    const agentCheck = agentConstraints[agentId](output);
    checklist.push(agentCheck);
    if (!agentCheck.passed) {
      score -= 20;
      issues.push({
        category: 'content',
        severity: 'warning',
        message: agentCheck.message,
        suggestion: 'เพิ่ม required fields ตามเงื่อนไขของ Agent นี้'
      });
    }
  }

  return {
    passed: score >= 70,
    score: Math.max(0, score),
    checklist,
    issues,
    recommendations: issues.map(i => i.suggestion),
    timestamp: new Date()
  };
}

/**
 * Utility: Calculate Similarity
 * Simple string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

/**
 * Export Summary
 */
export const validationRulesSummary = {
  totalRules: 5,
  rules: [
    'FORMAT_STRUCTURE',
    'FACT_GROUNDING',
    'ANTI_COPYCAT',
    'CONSISTENCY',
    'AGENT_SPECIFIC_CONSTRAINTS'
  ],
  minPassScore: 70,
  description: 'Comprehensive validation system for Agent outputs'
};
