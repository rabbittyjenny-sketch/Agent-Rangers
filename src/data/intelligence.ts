/**
 * Intelligence & Knowledge Base
 * System Core Rules & Master Context Templates
 */

export interface MasterContext {
  brandId: string;
  brandNameTh: string;
  brandNameEn: string;
  industry: string;
  coreUSP: string;
  visualStyle: {
    primaryColor: string;
    moodKeywords: string[]; // e.g., ["vibrant", "modern", "luxury"]
  };
  targetAudience: string;
  toneOfVoice: 'formal' | 'casual' | 'playful' | 'professional' | 'luxury';
  createdAt: string;
  lastUpdated: string;
}

// System Core Rules - Isolation, Anti-Copycat, Fact Check
export const systemCoreRules = {
  isolation: {
    name: 'Brand Data Isolation',
    description: 'ห้ามแชร์ข้อมูลข้าม brand_id โดยเด็ดขาด',
    rules: [
      'ทุกข้อมูลลูกค้าต้องเก็บแยกตาม brand_id',
      'ห้ามเรียกข้อมูลแบรนด์อื่น',
      'Cache ต้องแยกตาม brand_id',
      'Cross-Agent Logic ให้เฉพาะข้อมูลที่เกี่ยวข้องเท่านั้น'
    ]
  },
  antiCopycat: {
    name: 'Non-Plagiarism & IP Protection',
    description: 'ป้องกันการเลียนแบบและรักษาสิทธิ์ทางปัญญา',
    rules: [
      'ห้ามใช้แคปชั่นหรือสโลแกนที่มีอยู่แล้ว 100%',
      'ทุกแคปชั่นต้อง Rephrase ให้เข้ากับ Brand Voice',
      'ห้ามเลียนแบบศิลปินมีตัวตน - ใช้เฉพาะ Mood & Tone Keywords',
      'ทุกผลลัพธ์ต้องมี Unique Value ของแบรนด์นี้'
    ]
  },
  factCheck: {
    name: 'Fact Check & Integrity',
    description: 'ตรวจสอบความถูกต้องและความสมบูรณ์ของข้อมูล',
    rules: [
      'USP Grounding: ทุกคำกล่าวอ้างต้องสอดคล้องกับ Core USP',
      'No Hallucination for Data: ถ้าไม่แน่ใจต้องบอกทันทีว่า "ประมาณการ"',
      'Consistency Check: ตรวจทานกับ Master Context ทุกครั้ง',
      'Reference Validation: ต้องระบุแหล่งที่มาเมื่ออ้างอิง'
    ]
  }
};

// Knowledge Base by Cluster
export const clusterKnowledge = {
  strategist: {
    name: 'The Strategist Knowledge Base',
    description: 'ความรู้เกี่ยวกับวิเคราะห์ธุรกิจ กลยุทธ์ การเงิน',
    domains: [
      'Market Analysis',
      'Business Strategy',
      'Financial Planning',
      'KPI Management',
      'Competitive Intelligence',
      'Customer Behavior',
      'Sales Forecasting',
      'Risk Assessment'
    ],
    examples: [
      'วิเคราะห์ SWOT ร้านกาแฟ',
      'ทำไมยอดขายตก?',
      'ขยายสาขาคุ้มไหม?',
      'จะตั้งราคาเท่าไหร่ดี?',
      'Dashboard ควรมีอะไรบ้าง?',
      'KPIs สำคัญมีอะไรบ้าง?'
    ]
  },
  studio: {
    name: 'The Studio Knowledge Base',
    description: 'ความรู้เกี่ยวกับออกแบบ แบรนด์ และศิลป์',
    domains: [
      'Brand Identity',
      'Visual Design',
      'UI/UX Design',
      'Color Theory',
      'Typography',
      'Layout Design',
      'Art Direction',
      'Mood & Tone'
    ],
    examples: [
      'ออกแบบโลโก้ร้านเสื้อผ้า',
      'Color Palette สำหรับแบรนด์อาหาร',
      'Brand Identity มีอะไรบ้าง?',
      'อยากได้โลโก้ใหม่',
      'สีแบรนด์เราคืออะไร?',
      'จัด Moodboard ให้หน่อย'
    ]
  },
  agency: {
    name: 'The Agency Knowledge Base',
    description: 'ความรู้เกี่ยวกับสื่อสาร คอนเทนต์ และการขาย',
    domains: [
      'Content Marketing',
      'Copywriting',
      'Social Media Strategy',
      'Influencer Marketing',
      'Campaign Planning',
      'Video Production',
      'Conversion Optimization',
      'Live Stream Strategy'
    ],
    examples: [
      'วางแผนแคมเปญ 30 วัน',
      'Content Calendar ยังไงดี?',
      'ช่วยคิดแคปชั่นโดนๆ',
      'ทำคลิปตามเทรนด์ TikTok',
      'Double Digit Strategy คืออะไร?',
      'Video Showroom ควรยาวเท่าไหร่?'
    ]
  }
};

// Routing Keywords Mapping
export const routingKeywords = {
  strategist: [
    // Market Analyst
    'SWOT', 'competitor', 'market', 'gap', 'opportunity', 'trend',
    'analysis', 'research', 'customer behavior', 'audience insight',
    // Business Planner
    'cost', 'pricing', 'budget', 'plan', 'financial', 'ROI', 'break-even',
    'expense', 'investment', 'profit', 'margin',
    // Insights Agent
    'KPI', 'analytics', 'performance', 'metrics', 'report', 'dashboard',
    'insight', 'data', 'forecast', 'projection'
  ],
  studio: [
    // Brand Builder
    'brand', 'identity', 'mood', 'tone', 'personality', 'value', 'voice',
    'positioning', 'guidelines',
    // Design Agent
    'design', 'logo', 'UI', 'UX', 'visual', 'color', 'palette', 'typography',
    'layout', 'landing page', 'website', 'template',
    // Video Generator (Art)
    'video', 'theme', 'concept', 'visual', 'story', 'motion', 'animation',
    'showroom', 'media'
  ],
  agency: [
    // Caption Creator
    'caption', 'content', 'copy', 'text', 'multilingual', 'emoji', 'CTA',
    'hashtag', 'style', 'emotion',
    // Campaign Planner
    'campaign', 'calendar', 'schedule', 'plan', 'promotion', '30 days',
    'content strategy', 'posting schedule', 'viral',
    // Video Generator (Script)
    'script', 'production', 'trending', 'viral', 'live stream', 'editing',
    'concept', 'direction'
  ]
};

// Fact Check Validators
export interface FactCheckValidator {
  name: string;
  check: (context: MasterContext, claim: string) => { valid: boolean; message: string };
}

export const factCheckValidators: FactCheckValidator[] = [
  {
    name: 'USP Consistency',
    check: (context: MasterContext, claim: string) => {
      const uspLower = context.coreUSP.toLowerCase();
      const claimLower = claim.toLowerCase();

      // Check if claim contradicts known USP
      if (uspLower.includes('eco') && claimLower.includes('plastic')) {
        return {
          valid: false,
          message: 'เตือน: คำกล่าวอ้างขัดกับ USP ของแบรนด์ (ระบุไว้ว่า eco-friendly)'
        };
      }

      return { valid: true, message: 'ผ่านการตรวจสอบ USP' };
    }
  },
  {
    name: 'Tone Alignment',
    check: (context: MasterContext, claim: string) => {
      const tone = context.toneOfVoice;

      // Simple validation - can be expanded
      if (tone === 'formal' && (claim.includes('lol') || claim.includes('omg'))) {
        return {
          valid: false,
          message: `เตือน: สไตล์การพูดไม่สอดคล้องกับ Tone (${tone})`
        };
      }

      return { valid: true, message: 'ผ่านการตรวจสอบ Tone' };
    }
  }
];

// Sample Master Context for Testing
export const sampleMasterContexts: MasterContext[] = [
  {
    brandId: 'coffee-shop-01',
    brandNameTh: 'คาเฟ่อาร์ต',
    brandNameEn: 'Art Coffee Studio',
    industry: 'Cafe & Coffee Shop',
    coreUSP: 'Premium specialty coffee with artist workspace - ที่ทำกาแฟสูตรพิเศษและสถานที่สำหรับศิลปิน',
    visualStyle: {
      primaryColor: '#8B4513',
      moodKeywords: ['warm', 'artistic', 'cozy', 'creative', 'sophisticated']
    },
    targetAudience: 'Creative professionals, artists, students, coffee enthusiasts (25-45 years old)',
    toneOfVoice: 'casual',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    brandId: 'fashion-boutique-01',
    brandNameTh: 'บูติกแฟชั่นสยาม',
    brandNameEn: 'Siam Fashion Boutique',
    industry: 'Fashion & Apparel',
    coreUSP: 'Sustainable Thai fashion with local artisans - แฟชั่นไทยแบบยั่งยืนสนับสนุนศิลปิชีวนีในท้องถิ่น',
    visualStyle: {
      primaryColor: '#2C5F2D',
      moodKeywords: ['elegant', 'sustainable', 'Thai pride', 'modern', 'minimalist']
    },
    targetAudience: 'Conscious fashion consumers, eco-aware millennials, Thai supporters (28-45 years)',
    toneOfVoice: 'professional',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    brandId: 'food-delivery-01',
    brandNameTh: 'เดลิเวอรี่อาหารหวาน',
    brandNameEn: 'Sweet Delivery',
    industry: 'Food Delivery Service',
    coreUSP: 'Same-day premium dessert delivery with freshness guarantee - ส่งขนมหวานสดใหม่วันเดียวกัน',
    visualStyle: {
      primaryColor: '#FF69B4',
      moodKeywords: ['fun', 'sweet', 'vibrant', 'playful', 'energetic']
    },
    targetAudience: 'Young professionals, celebration seekers, dessert lovers (18-40 years)',
    toneOfVoice: 'playful',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
];

// Onboarding Data Collection Template
export interface OnboardingData {
  step: 1 | 2 | 3 | 4;
  section: 'basic' | 'visual' | 'audience' | 'confirmation';
  completed: boolean;
}

export const onboardingSteps = [
  {
    step: 1,
    title: 'ข้อมูลพื้นฐาน',
    fields: [
      { id: 'brandNameTh', label: 'ชื่อแบรนด์ (ไทย)', required: true },
      { id: 'brandNameEn', label: 'Brand Name (English)', required: true },
      { id: 'industry', label: 'ประเภทธุรกิจ', required: true },
      { id: 'coreUSP', label: 'จุดเด่นหลัก (Core USP)', required: true }
    ]
  },
  {
    step: 2,
    title: 'ลักษณะทางสายตา',
    fields: [
      { id: 'primaryColor', label: 'สีหลัก', type: 'color', required: true },
      { id: 'moodKeywords', label: 'Mood Keywords (3 คำ)', required: true }
    ]
  },
  {
    step: 3,
    title: 'กลุ่มเป้าหมาย',
    fields: [
      { id: 'targetAudience', label: 'อธิบายกลุ่มเป้าหมาย', required: true },
      { id: 'toneOfVoice', label: 'ระดับความทางการ', type: 'select', required: true }
    ]
  },
  {
    step: 4,
    title: 'ยืนยันข้อมูล',
    section: 'confirmation'
  }
];

// Daily Learning Topics (For Content Inspiration)
export const dailyLearningTopics = {
  topics: [
    {
      date: new Date().toISOString().split('T')[0],
      topic: 'Valentine\'s Day Trend',
      keywords: ['love', 'couple', 'gift', 'celebration'],
      platforms: ['TikTok', 'Instagram', 'Facebook']
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      topic: 'CNY Preparation Content',
      keywords: ['red', 'lucky', 'tradition', 'family'],
      platforms: ['TikTok', 'Instagram', 'Xiaohongshu']
    }
  ]
};
