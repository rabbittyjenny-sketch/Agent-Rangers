/**
 * Agent Responsibility Matrix
 * ชัดว่า Agent ไหนทำไร + Dependencies + Workflow Order
 */

export interface ResponsibilityMatrix {
  agentId: string;
  agentName: string;
  cluster: 'strategy' | 'creative' | 'growth';

  // หน้าที่หลัก
  primaryResponsibilities: string[];

  // อะไรที่ต้องอิง (Input from)
  dependsOn: {
    agentId: string;
    reason: string;
  }[];

  // ใครต้องอิง output นี้ (Output to)
  requiredBy: {
    agentId: string;
    reason: string;
  }[];

  // ฟังก์ชันที่ห้าม (Conflicts)
  conflictsWith: {
    agentId: string;
    reason: string;
  }[];

  // ลำดับที่ควรทำ (Phase)
  executionPhase: 1 | 2 | 3 | 4;

  // Input Format ที่ต้องการ
  requiredInputs: string[];

  // Output Format
  expectedOutputs: string[];

  // Success Criteria
  successCriteria: string[];
}

/**
 * WORKFLOW PHASES:
 * Phase 1: STRATEGY (ทำก่อน - วิเคราะห์ธุรกิจ)
 * Phase 2: CREATIVE (ต่อมา - สร้างแบรนด์)
 * Phase 3: CONTENT PLANNING (สามารถขนาน)
 * Phase 4: EXECUTION (ดำเนินการจริง)
 */

export const responsibilityMatrices: ResponsibilityMatrix[] = [
  // ============= PHASE 1: STRATEGY =============
  {
    agentId: 'market-analyst',
    agentName: 'Market Analyst',
    cluster: 'strategy',
    primaryResponsibilities: [
      'SWOT Analysis',
      'Competitor Analysis',
      'Market Gap Identification',
      'Trend Analysis',
      'Opportunity Identification'
    ],
    dependsOn: [], // ไม่ต้องอิงใครเลย - First step
    requiredBy: [
      { agentId: 'business-planner', reason: 'ต้องรู้โอกาสตลาด เพื่อคำนวณต้นทุนและราคา' },
      { agentId: 'brand-builder', reason: 'ต้องรู้ตำแหน่งในตลาด เพื่อตั้ง Brand Positioning' },
      { agentId: 'campaign-planner', reason: 'ต้องรู้เทรนด์ ช่องว่าง เพื่อวางแผน Content' }
    ],
    conflictsWith: [
      { agentId: 'business-planner', reason: 'ต่างงานต่างคน - Market Analyst วิเคราะห์ Business Planner คำนวณ' },
      { agentId: 'insights-agent', reason: 'Market Analyst = Forward Looking, Insights Agent = Backward Looking' }
    ],
    executionPhase: 1,
    requiredInputs: [
      'Master Context (Product Info)',
      'Target Audience Profile',
      'Business Goals',
      'Market Data (Optional)'
    ],
    expectedOutputs: [
      'SWOT Analysis Report',
      'Competitor Landscape',
      'Market Opportunities',
      'Risks & Threats',
      'Trend Insights'
    ],
    successCriteria: [
      'Data-backed analysis (ต้องมี sources)',
      'Actionable insights (ไม่ใช่ทั่วไป)',
      'Clear positioning opportunities',
      'Risk assessment included'
    ]
  },

  {
    agentId: 'business-planner',
    agentName: 'Business Planner',
    cluster: 'strategy',
    primaryResponsibilities: [
      'Cost Calculation',
      'Pricing Strategy',
      'Financial Planning',
      'Budget Allocation',
      'ROI Projection'
    ],
    dependsOn: [
      { agentId: 'market-analyst', reason: 'ต้องรู้ตำแหน่งตลาด เพื่อตั้งราคาให้สมควร' }
    ],
    requiredBy: [
      { agentId: 'brand-builder', reason: 'ต้องรู้ Budget เพื่อกำหนด Brand Positioning' },
      { agentId: 'campaign-planner', reason: 'ต้องรู้ Budget ก่อนวางแผน Marketing Spend' },
      { agentId: 'automation-specialist', reason: 'ต้องรู้ Budget ก่อนตั้งค่า Automation Scale' }
    ],
    conflictsWith: [
      { agentId: 'market-analyst', reason: 'ต่างงานต่างคน' },
      { agentId: 'insights-agent', reason: 'Business Planner = Forward, Insights Agent = Backward' }
    ],
    executionPhase: 1,
    requiredInputs: [
      'Market Analysis Output',
      'Product/Service Specification',
      'Target Margin %',
      'Historical Cost Data (Optional)'
    ],
    expectedOutputs: [
      'Cost Breakdown',
      'Pricing Strategy',
      'Budget Allocation Plan',
      'ROI Projections',
      'Break-even Analysis'
    ],
    successCriteria: [
      'All calculations transparent (สูตรชัดเจน)',
      'Trade-offs explained',
      'Data sources cited',
      'Realistic assumptions'
    ]
  },

  {
    agentId: 'insights-agent',
    agentName: 'Insights Agent',
    cluster: 'strategy',
    primaryResponsibilities: [
      'KPI Tracking',
      'Performance Analysis',
      'Data Insights',
      'Trend Forecasting',
      'Recommendations'
    ],
    dependsOn: [
      { agentId: 'market-analyst', reason: 'ต้องรู้ Market Context' },
      { agentId: 'business-planner', reason: 'ต้องรู้ Financial Targets' }
    ],
    requiredBy: [
      { agentId: 'campaign-planner', reason: 'ต้องรู้ Performance Trends เพื่อปรับแผน' },
      { agentId: 'orchestrator', reason: 'Dashboard Monitoring' }
    ],
    conflictsWith: [
      { agentId: 'market-analyst', reason: 'Market Analyst = Analysis, Insights Agent = Monitoring' },
      { agentId: 'business-planner', reason: 'Budget Planning vs Performance Tracking' }
    ],
    executionPhase: 1,
    requiredInputs: [
      'Performance Data',
      'KPI Targets',
      'Historical Data (Optional)',
      'Benchmarks (Optional)'
    ],
    expectedOutputs: [
      'KPI Dashboard',
      'Performance Report',
      'Trend Analysis',
      'Actionable Recommendations',
      'Alert Notifications'
    ],
    successCriteria: [
      'Data-grounded (ต้องมี sources)',
      'Metrics clear and measurable',
      'Recommendations specific',
      'Trend analysis accurate'
    ]
  },

  // ============= PHASE 2: CREATIVE =============
  {
    agentId: 'brand-builder',
    agentName: 'Brand Builder',
    cluster: 'creative',
    primaryResponsibilities: [
      'Brand Identity Design',
      'Tone of Voice',
      'Mood Definition',
      'Brand Personality',
      'Value Proposition'
    ],
    dependsOn: [
      { agentId: 'market-analyst', reason: 'ต้องรู้ Market Position & Target Audience' },
      { agentId: 'business-planner', reason: 'ต้องรู้ Price Point & Budget' }
    ],
    requiredBy: [
      { agentId: 'design-agent', reason: 'ต้องรู้ Brand Tone ก่อนออกแบบ Visual' },
      { agentId: 'caption-creator', reason: 'ต้องรู้ Brand Voice ก่อนเขียน Copy' },
      { agentId: 'video-generator-art', reason: 'ต้องรู้ Mood & Tone ก่อนวางแผน Visual' }
    ],
    conflictsWith: [
      { agentId: 'design-agent', reason: 'Brand Builder = Strategy, Design Agent = Execution' },
      { agentId: 'video-generator-art', reason: 'ต่างลักษณะงาน' }
    ],
    executionPhase: 2,
    requiredInputs: [
      'Market Analysis',
      'Business Strategy',
      'Target Audience Insights',
      'Competitor Brand Analysis'
    ],
    expectedOutputs: [
      'Brand Mission & Vision',
      'Brand Personality Profile',
      'Tone of Voice Guide',
      'Value Proposition Statement',
      'Brand Positioning Document'
    ],
    successCriteria: [
      'Unique positioning (ไม่ใช่ copy คู่แข่ง)',
      'Aligned with market position',
      'Emotionally resonant',
      'Consistent across all descriptions'
    ]
  },

  {
    agentId: 'design-agent',
    agentName: 'Design Agent',
    cluster: 'creative',
    primaryResponsibilities: [
      'Logo Design',
      'Visual Identity',
      'UI/UX Design',
      'Layout Design',
      'Color Palette'
    ],
    dependsOn: [
      { agentId: 'brand-builder', reason: 'ต้องรู้ Brand Tone ก่อนออกแบบ' }
    ],
    requiredBy: [
      { agentId: 'video-generator-art', reason: 'ต้องรู้ Visual Identity ก่อนสร้างวิดีโอ' },
      { agentId: 'caption-creator', reason: 'ต้องรู้ Design Language ก่อนเลือก Typography' }
    ],
    conflictsWith: [
      { agentId: 'brand-builder', reason: 'Brand Builder = Strategy, Design Agent = Execution' },
      { agentId: 'video-generator-art', reason: 'Design Agent = Static, Video Generator Art = Motion' }
    ],
    executionPhase: 2,
    requiredInputs: [
      'Brand Identity Document',
      'Color Psychology Preferences',
      'Target Audience Aesthetic',
      'Competitor Design Analysis'
    ],
    expectedOutputs: [
      'Logo Design',
      'Color Palette',
      'Typography Guidelines',
      'UI Components Library',
      'Design System'
    ],
    successCriteria: [
      'WCAG Accessible',
      'Visually distinctive',
      'Consistent with brand',
      'Works on all devices'
    ]
  },

  {
    agentId: 'video-generator-art',
    agentName: 'Video Generator (Art)',
    cluster: 'creative',
    primaryResponsibilities: [
      'Video Concept Planning',
      'Theme Breakdown',
      'Visual Direction Planning',
      'Scene Composition',
      'Shot List Development'
    ],
    dependsOn: [
      { agentId: 'brand-builder', reason: 'ต้องรู้ Mood & Tone' },
      { agentId: 'design-agent', reason: 'ต้องรู้ Visual Identity' }
    ],
    requiredBy: [
      { agentId: 'video-generator-script', reason: 'ต้องรู้ Visual Plan ก่อนเขียน Script' }
    ],
    conflictsWith: [
      { agentId: 'video-generator-script', reason: 'Video Generator Art = Visual, Script = Story' },
      { agentId: 'design-agent', reason: 'Design Agent = Static, Video Generator Art = Motion' }
    ],
    executionPhase: 2,
    requiredInputs: [
      'Brand Identity',
      'Campaign Theme',
      'Target Audience',
      'Content Pillars'
    ],
    expectedOutputs: [
      'Video Concept Breakdown',
      'Scene-by-Scene Breakdown',
      'Shot List',
      'Visual Direction Guide',
      'Mood Board Reference'
    ],
    successCriteria: [
      'Visual plan is detailed & actionable',
      'Consistent with brand',
      'Technically feasible',
      'Clear shot requirements'
    ]
  },

  // ============= PHASE 3: CONTENT PLANNING =============
  {
    agentId: 'caption-creator',
    agentName: 'Caption Creator',
    cluster: 'growth',
    primaryResponsibilities: [
      'Caption Strategy Planning',
      'Style Guide Development',
      'Emotion Framework',
      'Multilingual Content Planning',
      'CTA Strategy'
    ],
    dependsOn: [
      { agentId: 'brand-builder', reason: 'ต้องรู้ Brand Voice' },
      { agentId: 'market-analyst', reason: 'ต้องรู้ Target Audience' }
    ],
    requiredBy: [
      { agentId: 'campaign-planner', reason: 'ต้องรู้ Content Style ก่อนวางแผน Calendar' }
    ],
    conflictsWith: [
      { agentId: 'campaign-planner', reason: 'Caption Creator = Strategy, Campaign Planner = Execution' },
      { agentId: 'video-generator-script', reason: 'Caption Creator = Copy, Video Generator Script = Narrative' }
    ],
    executionPhase: 3,
    requiredInputs: [
      'Brand Identity',
      'Target Audience Profile',
      'Campaign Theme',
      'Platform Guidelines'
    ],
    expectedOutputs: [
      'Caption Strategy Framework',
      'Style Guide Templates',
      'Copywriting Formulas',
      'CTA Templates',
      'Multilingual Guide'
    ],
    successCriteria: [
      'Templates are actionable',
      'Brand voice clear',
      'Covers all caption styles',
      'Multilingual nuances captured'
    ]
  },

  {
    agentId: 'campaign-planner',
    agentName: 'Campaign Planner',
    cluster: 'growth',
    primaryResponsibilities: [
      'Content Calendar',
      'Campaign Strategy',
      'Promotion Planning',
      'Trend Forecasting',
      'Schedule Optimization'
    ],
    dependsOn: [
      { agentId: 'caption-creator', reason: 'ต้องรู้ Content Style ก่อนวางแผน' },
      { agentId: 'video-generator-script', reason: 'ต้องรู้ Video Content ก่อน' },
      { agentId: 'insights-agent', reason: 'ต้องรู้ Performance Trends' }
    ],
    requiredBy: [
      { agentId: 'automation-specialist', reason: 'ต้องรู้ Calendar ก่อน Automate' }
    ],
    conflictsWith: [
      { agentId: 'caption-creator', reason: 'Caption Creator = Strategy, Campaign Planner = Execution' },
      { agentId: 'video-generator-script', reason: 'ต่างงานต่างคน' }
    ],
    executionPhase: 3,
    requiredInputs: [
      'Caption Style Strategies',
      'Video Content Plans',
      'Performance Data',
      'Trend Insights',
      'Business Goals'
    ],
    expectedOutputs: [
      'Content Calendar (30 days)',
      'Campaign Timeline',
      'Content Mix Strategy',
      'Promotion Plan',
      'Posting Schedule'
    ],
    successCriteria: [
      'Balanced content mix',
      'Trend-aligned',
      'Goals-aligned',
      'Execution-ready'
    ]
  },

  {
    agentId: 'video-generator-script',
    agentName: 'Video Generator (Script)',
    cluster: 'growth',
    primaryResponsibilities: [
      'Script Outline Planning',
      'Content Structure Planning',
      'Trend Analysis',
      'Production Flow Planning',
      'Timing Optimization'
    ],
    dependsOn: [
      { agentId: 'video-generator-art', reason: 'ต้องรู้ Visual Plan ก่อน' },
      { agentId: 'caption-creator', reason: 'ต้องรู้ Content Style ก่อน' }
    ],
    requiredBy: [
      { agentId: 'campaign-planner', reason: 'ต้องรู้ Video Content ก่อนวางแผน Calendar' }
    ],
    conflictsWith: [
      { agentId: 'video-generator-art', reason: 'Video Generator Art = Visual, Script = Story' },
      { agentId: 'caption-creator', reason: 'Video Generator Script = Narrative, Caption Creator = Copy' }
    ],
    executionPhase: 3,
    requiredInputs: [
      'Visual Direction Plan',
      'Caption Style Guide',
      'Campaign Theme',
      'Trend Analysis',
      'Audience Insights'
    ],
    expectedOutputs: [
      'Script Outline',
      'Scene-by-Scene Structure',
      'Production Planning',
      'Timing Guide',
      'Platform Optimization Tips'
    ],
    successCriteria: [
      'Script structure is clear',
      'Trend-aligned',
      'Matches visual plan',
      'Production-ready'
    ]
  },

  // ============= PHASE 4: EXECUTION =============
  {
    agentId: 'automation-specialist',
    agentName: 'Automation Specialist',
    cluster: 'growth',
    primaryResponsibilities: [
      'Workflow Automation',
      'Content Scheduling',
      'Make.com Integration',
      'Webhook Management',
      'Batch Processing'
    ],
    dependsOn: [
      { agentId: 'campaign-planner', reason: 'ต้องรู้ Calendar ก่อน Automate' },
      { agentId: 'business-planner', reason: 'ต้องรู้ Budget & Scale ก่อน' }
    ],
    requiredBy: [],
    conflictsWith: [
      { agentId: 'campaign-planner', reason: 'Campaign Planner = Planning, Automation Specialist = Execution' }
    ],
    executionPhase: 4,
    requiredInputs: [
      'Content Calendar',
      'Campaign Details',
      'Platform Credentials',
      'Webhook Endpoints',
      'Batch Configuration'
    ],
    expectedOutputs: [
      'Workflow Configurations',
      'Automation Setup Documentation',
      'Schedule Status Report',
      'Error Logs & Monitoring',
      'Performance Metrics'
    ],
    successCriteria: [
      'Workflows run without errors',
      'Scheduling is precise',
      'Error handling in place',
      'Monitoring & alerts setup'
    ]
  }
];

/**
 * Helper: Get Workflow Dependencies
 * แสดงลำดับการทำงานที่ถูกต้อง
 */
export function getWorkflowOrder(): string[][] {
  const phases: { [key: number]: string[] } = {};

  for (const matrix of responsibilityMatrices) {
    if (!phases[matrix.executionPhase]) {
      phases[matrix.executionPhase] = [];
    }
    phases[matrix.executionPhase].push(matrix.agentId);
  }

  return [
    phases[1] || [],
    phases[2] || [],
    phases[3] || [],
    phases[4] || []
  ];
}

/**
 * Helper: Validate Agent Dependencies
 * ตรวจว่า Input ครบหรือยัง
 */
export function validateDependencies(
  agentId: string,
  completedAgents: string[]
): { isReady: boolean; missingDependencies: string[] } {
  const matrix = responsibilityMatrices.find(m => m.agentId === agentId);
  if (!matrix) {
    return { isReady: false, missingDependencies: [agentId] };
  }

  const missingDependencies = matrix.dependsOn
    .map(d => d.agentId)
    .filter(d => !completedAgents.includes(d));

  return {
    isReady: missingDependencies.length === 0,
    missingDependencies
  };
}
