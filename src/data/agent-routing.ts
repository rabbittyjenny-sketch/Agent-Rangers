/**
 * Agent Routing & Job Classification System
 * Smart distribution + Anti-copycat + Confidence scoring
 */

export interface JobRequest {
  intent: string;
  keywords: string[];
  masterContext: any;
  previousOutputs?: {
    agentId: string;
    output: any;
    timestamp: Date;
  }[];
}

export interface RoutingDecision {
  primaryAgent: string;
  secondaryAgents: string[];
  confidence: number; // 0-1
  reasoning: string;
  validationRules: string[];
  anticopycat: {
    needsDedup: boolean;
    skipAgents: string[];
  };
}

/**
 * Job Classification Keywords → Agent Mapping
 * ใช้สำหรับ Intent Recognition
 */
export const jobClassification = {
  // Strategy Team Keywords
  MARKET_ANALYSIS: {
    agents: ['market-analyst'],
    keywords: [
      'market',
      'competitor',
      'swot',
      'gap',
      'opportunity',
      'analysis',
      'research',
      'trend',
      'customer',
      'behavior'
    ],
    mustNotOverlapWith: ['business-planner', 'insights-agent']
  },

  FINANCIAL_PLANNING: {
    agents: ['business-planner'],
    keywords: [
      'cost',
      'price',
      'budget',
      'roi',
      'financial',
      'expense',
      'revenue',
      'profit',
      'break-even',
      'margin'
    ],
    mustNotOverlapWith: ['market-analyst', 'insights-agent']
  },

  PERFORMANCE_INSIGHTS: {
    agents: ['insights-agent'],
    keywords: [
      'kpi',
      'analytics',
      'performance',
      'metrics',
      'dashboard',
      'report',
      'insights',
      'data',
      'tracking',
      'monitoring'
    ],
    mustNotOverlapWith: ['market-analyst', 'business-planner']
  },

  // Creative Team Keywords
  BRAND_STRATEGY: {
    agents: ['brand-builder'],
    keywords: [
      'brand',
      'identity',
      'mood',
      'tone',
      'personality',
      'voice',
      'value proposition',
      'emotion',
      'connection'
    ],
    mustNotOverlapWith: ['design-agent', 'video-generator-art']
  },

  DESIGN_VISUAL: {
    agents: ['design-agent'],
    keywords: [
      'design',
      'logo',
      'ui',
      'ux',
      'visual',
      'color',
      'typography',
      'layout',
      'aesthetic',
      'artwork',
      'icon',
      'image'
    ],
    mustNotOverlapWith: ['brand-builder', 'video-generator-art']
  },

  VIDEO_ART_PLANNING: {
    agents: ['video-generator-art'],
    keywords: [
      'video',
      'theme',
      'visual direction',
      'shot list',
      'scene',
      'composition',
      'breakdown',
      'storyboard',
      'cinematography'
    ],
    mustNotOverlapWith: ['video-generator-script', 'design-agent']
  },

  // Growth Team Keywords
  CONTENT_STRATEGY: {
    agents: ['caption-creator'],
    keywords: [
      'caption',
      'copy',
      'content strategy',
      'hook',
      'style guide',
      'cta',
      'copywriting',
      'emotion',
      'engagement'
    ],
    mustNotOverlapWith: ['campaign-planner', 'video-generator-script']
  },

  CAMPAIGN_PLANNING: {
    agents: ['campaign-planner'],
    keywords: [
      'campaign',
      'calendar',
      'content schedule',
      '30 days',
      'promotion',
      'trend',
      'schedule',
      'planning'
    ],
    mustNotOverlapWith: ['caption-creator', 'video-generator-script']
  },

  VIDEO_SCRIPT_PLANNING: {
    agents: ['video-generator-script'],
    keywords: [
      'script',
      'video script',
      'content structure',
      'production plan',
      'script outline',
      'trend analysis',
      'viral'
    ],
    mustNotOverlapWith: ['video-generator-art', 'campaign-planner']
  },

  AUTOMATION_SETUP: {
    agents: ['automation-specialist'],
    keywords: [
      'automation',
      'workflow',
      'schedule',
      'make.com',
      'webhook',
      'cron',
      'batch',
      'posting',
      'integration'
    ],
    mustNotOverlapWith: ['campaign-planner']
  }
};

/**
 * Smart Routing Logic
 * ใช้สำหรับหา Agent ที่เหมาะสม
 */
export function findBestRoute(request: JobRequest): RoutingDecision {
  const matches: {
    jobType: string;
    agents: string[];
    score: number;
    keywords: string[];
  }[] = [];

  // Score each job type
  for (const [jobType, config] of Object.entries(jobClassification)) {
    const matchedKeywords = request.keywords.filter(k =>
      config.keywords.some(jk => jk.toLowerCase().includes(k.toLowerCase()))
    );

    if (matchedKeywords.length > 0) {
      const score = matchedKeywords.length / config.keywords.length;
      matches.push({
        jobType,
        agents: config.agents,
        score,
        keywords: matchedKeywords
      });
    }
  }

  // Sort by score
  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return {
      primaryAgent: 'orchestrator',
      secondaryAgents: [],
      confidence: 0,
      reasoning: 'ไม่พบ Agent ที่เหมาะสม - ต้องการข้อมูลเพิ่มเติม',
      validationRules: ['ask_for_clarification'],
      anticopycat: {
        needsDedup: false,
        skipAgents: []
      }
    };
  }

  const topMatch = matches[0];
  const primaryAgent = topMatch.agents[0];
  const secondaryAgents = matches
    .slice(1, 3)
    .flatMap(m => m.agents)
    .filter(a => a !== primaryAgent);

  // Anti-copycat: find agents that should NOT work
  const config = jobClassification[topMatch.jobType as keyof typeof jobClassification];
  const skipAgents = config.mustNotOverlapWith || [];

  return {
    primaryAgent,
    secondaryAgents: Array.from(new Set(secondaryAgents)), // Dedup
    confidence: Math.min(1, topMatch.score),
    reasoning: `ตรงกับ "${topMatch.jobType}" - Keywords: ${topMatch.keywords.join(', ')}`,
    validationRules: [
      'check_output_format',
      'verify_consistency',
      'validate_constraints'
    ],
    anticopycat: {
      needsDedup: skipAgents.length > 0,
      skipAgents
    }
  };
}

/**
 * Quick Output Validation (Lightweight version)
 * Use validation-rules.ts for comprehensive validation
 * This is for quick routing checks only
 */
export interface OutputValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  confidence: number;
}

export function validateAgentOutput(
  agentId: string,
  output: any
): OutputValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  let confidence = 1.0;

  // Basic checks only
  if (!output || typeof output !== 'object') {
    issues.push(`Output ต้องเป็น Object - ได้รับ ${typeof output}`);
    return { isValid: false, issues, warnings, confidence: 0 };
  }

  // Check required fields
  const requiredFields = ['task', 'result', 'reasoning'];
  const missingFields = requiredFields.filter(f => !output[f]);

  if (missingFields.length > 0) {
    issues.push(`ขาดฟิลด์: ${missingFields.join(', ')}`);
    confidence -= missingFields.length * 0.15;
  }

  return {
    isValid: issues.length === 0 && confidence > 0.5,
    issues,
    warnings,
    confidence: Math.max(0, confidence)
  };
}

/**
 * Duplicate Job Detection
 * หลีกเลี่ยงการให้หลาย agents ทำงานเดียวกัน
 */
export function detectDuplicateWork(
  currentRequest: JobRequest,
  previousOutputs?: JobRequest['previousOutputs']
): { isDuplicate: boolean; duplicateAgents: string[] } {
  if (!previousOutputs || previousOutputs.length === 0) {
    return { isDuplicate: false, duplicateAgents: [] };
  }

  const duplicateAgents: string[] = [];
  const currentKeywords = new Set(currentRequest.keywords.map(k => k.toLowerCase()));

  for (const prevOutput of previousOutputs) {
    // ถ้า Intent เหมือน + Keywords ซ้อน > 50% = Duplicate
    if (prevOutput.output?.intent === currentRequest.intent) {
      duplicateAgents.push(prevOutput.agentId);
    }
  }

  return {
    isDuplicate: duplicateAgents.length > 0,
    duplicateAgents
  };
}

/**
 * Get Agent Responsibilities (สำหรับ Reference)
 */
export const agentResponsibilities: {
  [key: string]: {
    primary: string[];
    canCollaborate: string[];
    cannotDo: string[];
  };
} = {
  'market-analyst': {
    primary: ['SWOT Analysis', 'Competitor Analysis', 'Market Gap Identification'],
    canCollaborate: ['business-planner', 'insights-agent'],
    cannotDo: [
      'Financial Calculation',
      'Design',
      'Content Creation',
      'Automation'
    ]
  },
  'business-planner': {
    primary: ['Cost Calculation', 'Pricing Strategy', 'Budget Planning'],
    canCollaborate: ['market-analyst', 'insights-agent'],
    cannotDo: [
      'Market Analysis',
      'Design',
      'Content Creation',
      'Automation'
    ]
  },
  'insights-agent': {
    primary: ['KPI Tracking', 'Performance Analysis', 'Recommendation'],
    canCollaborate: ['market-analyst', 'business-planner', 'campaign-planner'],
    cannotDo: ['Design', 'Content Creation', 'Script Writing', 'Automation']
  },
  'brand-builder': {
    primary: ['Brand Identity', 'Tone of Voice', 'Brand Guidelines'],
    canCollaborate: ['design-agent', 'caption-creator'],
    cannotDo: [
      'Financial Calculation',
      'Market Analysis',
      'Content Writing',
      'Automation'
    ]
  },
  'design-agent': {
    primary: ['Logo Design', 'Visual Identity', 'UI/UX Design'],
    canCollaborate: ['brand-builder', 'video-generator-art'],
    cannotDo: [
      'Brand Strategy',
      'Financial Calculation',
      'Content Writing',
      'Automation'
    ]
  },
  'video-generator-art': {
    primary: ['Video Concept Planning', 'Visual Direction', 'Shot List'],
    canCollaborate: ['design-agent', 'video-generator-script'],
    cannotDo: [
      'Script Writing',
      'Caption Writing',
      'Financial Calculation',
      'Automation'
    ]
  },
  'caption-creator': {
    primary: ['Caption Strategy', 'Style Guide', 'Copywriting Framework'],
    canCollaborate: ['brand-builder', 'campaign-planner'],
    cannotDo: [
      'Video Creation',
      'Design',
      'Financial Calculation',
      'Market Analysis',
      'Automation'
    ]
  },
  'campaign-planner': {
    primary: ['Content Calendar', 'Campaign Strategy', 'Trend Integration'],
    canCollaborate: ['caption-creator', 'insights-agent', 'automation-specialist'],
    cannotDo: [
      'Design',
      'Financial Calculation',
      'Market Analysis',
      'Video Creation'
    ]
  },
  'video-generator-script': {
    primary: ['Script Outline Planning', 'Trend Analysis', 'Production Flow'],
    canCollaborate: ['video-generator-art', 'campaign-planner'],
    cannotDo: [
      'Design',
      'Caption Writing',
      'Financial Calculation',
      'Market Analysis',
      'Automation'
    ]
  },
  'automation-specialist': {
    primary: [
      'Workflow Automation',
      'Content Scheduling',
      'Make.com Integration'
    ],
    canCollaborate: ['campaign-planner'],
    cannotDo: [
      'Design',
      'Content Writing',
      'Financial Calculation',
      'Market Analysis',
      'Brand Strategy'
    ]
  }
};
