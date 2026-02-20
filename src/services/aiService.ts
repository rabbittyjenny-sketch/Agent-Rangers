/**
 * AI Service
 * Handles agent communication and response generation
 * Integrated with Database Service for data persistence
 */

import { Agent } from '../data/agents';
import { MasterContext } from '../data/intelligence';
import { orchestratorEngine, RoutingResult, FactCheckResult } from './orchestratorEngine';
import { databaseService, MessageRecord, AgentLearningRecord } from './databaseService';

export interface AIResponse {
  agentId: string;
  agentName: string;
  cluster: string;
  content: string;
  rawOutput: string;
  factCheckResult: FactCheckResult;
  confidence: number;
  timestamp: string;
}

export interface MessageRequest {
  userInput: string;
  brandId?: string;
  context?: MasterContext;
  forceAgent?: string; // Force specific agent
}

class AIService {
  private conversationHistory: AIResponse[] = [];
  private masterContext: MasterContext | null = null;

  /**
   * Initialize service with brand context
   */
  initialize(context: MasterContext): void {
    this.masterContext = context;
    orchestratorEngine.setMasterContext(context);
  }

  /**
   * Process user message and generate response
   */
  async processMessage(request: MessageRequest): Promise<AIResponse> {
    // Set context if provided
    if (request.context) {
      this.initialize(request.context);
    }

    if (!this.masterContext) {
      throw new Error('Master Context not initialized. Please complete onboarding first.');
    }

    // Save user message to database
    const userMessage: MessageRecord = {
      brandId: 1, // Will be set to actual brand ID from context when available
      role: 'user',
      content: request.userInput,
      createdAt: new Date()
    };
    await databaseService.saveMessage(userMessage);

    // Determine which agent to use
    let routingResult: RoutingResult;

    if (request.forceAgent) {
      // Force specific agent
      const agent = orchestratorEngine.route(request.userInput);
      routingResult = agent;
    } else {
      routingResult = orchestratorEngine.route(request.userInput);
    }

    if (!routingResult.agent) {
      throw new Error('Could not route to appropriate agent');
    }

    // Generate response based on agent type
    const agentResponse = await this.generateAgentResponse(
      routingResult.agent,
      request.userInput,
      this.masterContext
    );

    // Fact check the response
    const factCheckResult = orchestratorEngine.factCheck(agentResponse);

    // Create response object
    const aiResponse: AIResponse = {
      agentId: routingResult.agent.id,
      agentName: routingResult.agent.name,
      cluster: routingResult.agent.cluster,
      content: this.formatResponse(agentResponse, factCheckResult),
      rawOutput: agentResponse,
      factCheckResult,
      confidence: routingResult.confidence,
      timestamp: new Date().toISOString()
    };

    // Save agent message to database
    const agentMessage: MessageRecord = {
      brandId: 1,
      role: 'agent',
      agentId: routingResult.agent.id,
      agentName: routingResult.agent.name,
      content: aiResponse.content,
      confidence: routingResult.confidence,
      validationResults: {
        valid: factCheckResult.valid,
        violations: factCheckResult.violations,
        warnings: factCheckResult.warnings,
        recommendations: factCheckResult.recommendations
      },
      createdAt: new Date()
    };
    await databaseService.saveMessage(agentMessage);

    // Save agent learning/insights if applicable
    if (routingResult.agent.id === 'market-analyst' && request.userInput.toLowerCase().includes('swot')) {
      const learning: AgentLearningRecord = {
        brandId: 1,
        agentId: routingResult.agent.id,
        agentName: routingResult.agent.name,
        insight: 'Market analysis completed - SWOT analysis performed',
        insightType: 'Analysis',
        dataUsed: ['coreUSP', 'targetAudience', 'toneOfVoice', 'industry'],
        confidence: routingResult.confidence,
        actionable: true
      };
      await databaseService.saveAgentLearning(learning);
    }

    // Add to history
    this.conversationHistory.push(aiResponse);

    return aiResponse;
  }

  /**
   * Generate response based on agent
   */
  private async generateAgentResponse(
    agent: Agent,
    userInput: string,
    context: MasterContext
  ): Promise<string> {
    // Simulate agent processing (in real implementation, would call actual API)
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, processingTime));

    const agentResponses: { [key: string]: string } = {
      'market-analyst': this.generateMarketAnalystResponse(userInput, context),
      'business-planner': this.generateBusinessPlannerResponse(userInput, context),
      'insights-agent': this.generateInsightsResponse(userInput, context),
      'brand-builder': this.generateBrandBuilderResponse(userInput, context),
      'design-agent': this.generateDesignResponse(userInput, context),
      'video-generator-art': this.generateVideoArtResponse(userInput, context),
      'caption-creator': this.generateCaptionResponse(userInput, context),
      'campaign-planner': this.generateCampaignResponse(userInput, context),
      'video-generator-script': this.generateVideoScriptResponse(userInput, context)
    };

    return agentResponses[agent.id] || 'Agent response not available';
  }

  /**
   * Market Analyst Response Template
   */
  private generateMarketAnalystResponse(input: string, context: MasterContext): string {
    const isSwot = input.toLowerCase().includes('swot');

    if (isSwot) {
      return `📊 SWOT Analysis สำหรับ ${context.brandNameTh}

🔥 Strengths (จุดแข็ง):
• ${context.coreUSP} - จุดเด่นของแบรนด์
• มี Target Audience ชัดเจน: ${context.targetAudience}
• Brand Voice มีเอกลักษณ์: ${context.toneOfVoice}

⚠️ Weaknesses (จุดอ่อน):
• ขาดข้อมูลรายละเอียด - ควรเพิ่มการศึกษา
• ความสามารถในการแข่งขันต้องประเมินต่อ

🌍 Opportunities (โอกาส):
• ตลาดสำหรับ ${context.industry} ยังมีพื้นที่เติบโต
• Social Media ช่องใหม่สำหรับการเข้าถึง Target Audience
• Partnership กับผู้มีอิทธิพล (Influencer)

🔴 Threats (ภัยคุกคาม):
• คู่แข่งในอุตสาหกรรม ${context.industry}
• การเปลี่ยนแปลงพฤติกรรมผู้บริโภค
• ความผันผวนของตลาดโลก

📌 Recommendation: ควรศึกษาข้อมูลคู่แข่ง เพื่อให้ได้ SWOT ที่ชัดเจนและแม่นยำ`;
    }

    return `📊 Market Analysis สำหรับ ${context.brandNameTh}

ในอุตสาหกรรม: ${context.industry}
Target Market: ${context.targetAudience}
Core Value: ${context.coreUSP}

ผลการวิเคราะห์เบื้องต้น:
✓ มีความชัดเจนในการจำแนกตัวตนแบรนด์
✓ Group เป้าหมายชัดเจน
✓ สามารถสร้างกลยุทธ์ได้ตามจุดเด่น`;
  }

  /**
   * Business Planner Response Template
   */
  private generateBusinessPlannerResponse(input: string, context: MasterContext): string {
    if (input.toLowerCase().includes('pricing') || input.toLowerCase().includes('ราคา')) {
      return `💰 Pricing Strategy สำหรับ ${context.brandNameTh}

กลยุทธ์การตั้งราคา 3 แนวทาง:

1️⃣ Premium Pricing
   • เน้นคุณภาพและจุดเด่น: ${context.coreUSP}
   • เหมาะสำหรับ: High-end products, luxury positioning
   • โอกาส: Target audience ที่มีกำลังซื้อสูง

2️⃣ Competitive Pricing
   • ตั้งราคาเทียบเท่าคู่แข่ง
   • เน้นมูลค่าส่วนเพิ่ม (Value Add)
   • ต้องศึกษาราคาคู่แข่งก่อน

3️⃣ Value-Based Pricing
   • ตั้งราคาตามคุณค่าที่ให้แก่ลูกค้า
   • ตรงกับ Brand Voice: ${context.toneOfVoice}
   • เหมาะสำหรับบ้านและเล็กน้อย

📌 ข้อแนะนำ: ต้องคำนวณต้นทุนจริงก่อน เพื่อให้ได้ราคาที่เหมาะสม`;
    }

    return `💰 Business Planning Guide

ขั้นตอนหลักในการวางแผนธุรกิจ:
1. คำนวณต้นทุน (Cost Analysis)
2. กำหนดราคา (Pricing Strategy)
3. วางแผนงบประมาณ (Budget Planning)
4. คาดการณ์ ROI (Return on Investment)

พร้อมช่วยคุณในแต่ละขั้นตอน - ให้รายละเอียดเพิ่มเติมได้`;
  }

  /**
   * Insights Agent Response Template
   */
  private generateInsightsResponse(input: string, context: MasterContext): string {
    return `📈 Analytics & Insights สำหรับ ${context.brandNameTh}

Key Metrics to Track:
📊 Conversion Rate - จำนวนผู้ดูที่กลายเป็นลูกค้า
👥 Engagement Rate - ปฏิสัมพันธ์จากออดิเอนส์
💬 Reach & Impressions - ความกว้างของการเข้าถึง
⏱️ Customer Lifetime Value - มูลค่าลูกค้าตลอดอายุ

Dashboard ควรมี:
✓ Daily/Weekly/Monthly Performance
✓ Channel Performance (Social, Website, Store)
✓ Customer Acquisition Cost (CAC)
✓ Brand Sentiment Analysis

💡 Recommendation: ให้บอกตัวเลขจริงได้เลย - จะช่วยวิเคราะห์ได้ลึกขึ้น`;
  }

  /**
   * Brand Builder Response Template
   */
  private generateBrandBuilderResponse(input: string, context: MasterContext): string {
    return `🎨 Brand Identity Guide สำหรับ ${context.brandNameTh}

Brand Essence:
✨ Brand Name: ${context.brandNameTh} (${context.brandNameEn})
🎯 Core USP: ${context.coreUSP}
🎨 Primary Color: ${context.visualStyle.primaryColor}
🎭 Mood & Tone: ${context.visualStyle.moodKeywords.join(', ')}
👥 Target Audience: ${context.targetAudience}
💬 Tone of Voice: ${context.toneOfVoice}

Brand Personality:
${this.generatePersonalityTraits(context.toneOfVoice)}

Brand Promise:
✓ สัญญาที่ส่งให้ลูกค้า: ${context.coreUSP}
✓ Emotional Connection: ${context.visualStyle.moodKeywords[0]}
✓ Consistency ในทุกจุดสัมผัส

📌 Next Step: ใช้ Brand Identity นี้เป็นแม่แบบสำหรับ Design, Content, Marketing`;
  }

  /**
   * Design Agent Response Template
   */
  private generateDesignResponse(input: string, context: MasterContext): string {
    return `✏️ Design Guidelines สำหรับ ${context.brandNameTh}

Color Palette:
🎨 Primary: ${context.visualStyle.primaryColor}
🎨 Secondary: Complementary color (derive from primary)
🎨 Accent: Highlights and CTAs
🎨 Neutral: Grays for backgrounds and text

Typography System:
📝 Heading Font: Oswald (Bold, Modern)
📝 Body Font: Spectral (Readable, Elegant)
📝 Font Size Hierarchy: Clear distinction between h1, h2, h3

UI/UX Principles:
✓ Mobile-First Approach (Responsive Design)
✓ Legibility Check: ทุกข้อความต้องอ่านออกชัด
✓ Accessibility: คิดถึงผู้พิการ
✓ Consistency: ใช้ Component Library

Landing Page Structure (Reference: Land-book.com):
1. Hero Section - จับสายตา (3-4 วินาที)
2. Value Proposition - อธิบายจุดเด่น
3. Social Proof - ความเชื่อมั่น
4. CTA Section - ส่ง Call to Action
5. Footer - ข้อมูลติดต่อ`;
  }

  /**
   * Video Generator (Art) Response Template
   */
  private generateVideoArtResponse(input: string, context: MasterContext): string {
    return `🎬 Video Creative Direction สำหรับ ${context.brandNameTh}

Theme Concept:
🎥 Visual Mood: ${context.visualStyle.moodKeywords.join(' + ')}
🎥 Color Grading: ตามสีแบรนด์ ${context.visualStyle.primaryColor}
🎥 Animation Style: ${this.getAnimationStyle(context.toneOfVoice)}
🎥 Target Emotion: ${context.visualStyle.moodKeywords[0]}

Scene Planning:
📍 Opening: ดึงความสนใจแบบ Hard-Hitting
📍 Middle: Storytelling ที่เน้น ${context.coreUSP}
📍 Close: Strong CTA และ Brand Presence

Production Notes:
✓ Duration: 15-60 seconds (สั้นแต่มีประสิทธิภาพ)
✓ Quality: 4K Minimum สำหรับ Professional
✓ Sound Design: ตรงกับ Mood
✓ Typography Integration: Brand Font ชัดเจน

📌 Avoid: เลียนแบบศิลปินอื่น - ใช้ Mood Keywords เท่านั้น`;
  }

  /**
   * Caption Creator Response Template
   */
  private generateCaptionResponse(input: string, context: MasterContext): string {
    return `💬 Caption Writing - 6 Styles × Multi-language

Caption Styles สำหรับ ${context.brandNameTh}:

1️⃣ Emotional Hook
   "สไตล์ดึงอารมณ์ - ทำให้คนรู้สึก"
   ตัวอย่าง: "${context.visualStyle.moodKeywords[0].toUpperCase()} is not just a word, it's a feeling..."

2️⃣ Educational/Value
   "สอนและให้คุณค่า"
   ตัวอย่าง: "Did you know? ${context.coreUSP}..."

3️⃣ Playful/Fun
   "สนุก ฮา ทำให้ยิ้ม"
   ตัวอย่าง: "Who else thinks... 🎉"

4️⃣ Problem-Solution
   "เสนอแก้ปัญหา"
   ตัวอย่าง: "Tired of...? We have the answer."

5️⃣ Social Proof
   "สร้างความเชื่อมั่น"
   ตัวอย่าง: "Join 10k+ happy customers..."

6️⃣ Call-to-Action
   "เรียกให้ลูกค้าทำอะไรบางอย่าง"
   ตัวอย่าง: "Tap the link in bio 👆"

Language Variations:
🇹🇭 Thai - ${context.toneOfVoice} tone
🇬🇧 English - Professional variation
🇨🇳 Chinese - Cultural adaptation
🇯🇵 Japanese - Market-specific

📌 Key Rule: ทั้ง 6 สไตล์ต้องเน้น "${context.coreUSP}" และสอดคล้องกับ Tone "${context.toneOfVoice}"`;
  }

  /**
   * Campaign Planner Response Template
   */
  private generateCampaignResponse(input: string, context: MasterContext): string {
    return `📅 30-Day Content Calendar สำหรับ ${context.brandNameTh}

Campaign Strategy - Double Digit Approach:

🔴 Phase 1: Gain Friends (Days 1-10)
   • Objective: สะสม Followers & LINE OA subscribers
   • Ad Strategy: Lookalike Audience + Broad Targeting
   • Content Type: Entertainment + Educational
   • Budget: 30% of total

🟡 Phase 2: Conversion Drive (Days 11-27)
   • Objective: ขับเคลื่อนการขาย
   • Ad Strategy: Conversion Optimization
   • Content Type: Product Focus + Testimonials
   • Budget: 50% of total (Peak Days)

🟢 Phase 3: Retargeting (Days 28-30)
   • Objective: จับคืนลูกค้า "เกือบซื้อ"
   • Ad Strategy: Re-engagement campaigns
   • Content Type: Urgency + Limited Offers
   • Budget: 20% of total

Content Mix (Diversify):
📍 Promotion Posts: 40%
📍 Educational Content: 30%
📍 Viral/Trending: 20%
📍 Community Engagement: 10%

📌 Success Metric: Target 10-20% Conversion Rate`;
  }

  /**
   * Video Generator (Script) Response Template
   */
  private generateVideoScriptResponse(input: string, context: MasterContext): string {
    return `🎞️ Video Script & Production Guide สำหรับ ${context.brandNameTh}

Production Specifications:
📹 Camera Setup: 2-4× 4K Cameras
📸 Lens: 50mm f/1.8 (Prime for clarity)
🌐 Internet: 20-50 Mbps Upload Speed
⏱️ Duration: 30-60 minutes (Optimal for Conversion)
🎯 Target: 12.8% Conversion Rate

Script Structure:

[OPENING - 0-2 min]
🎬 Hook: ดึงความสนใจทันที
📝 Show: ${context.coreUSP}
🎯 Tell: ทำไมผู้ดูควรสนใจ

[MIDDLE - 2-50 min]
📍 Product Showcase: ที่มีสไตล์ ${context.visualStyle.moodKeywords.join(', ')}
📍 Benefits Deep Dive: ตรงจุดต้องการของ ${context.targetAudience}
📍 Social Proof: Customer testimonials
📍 Address Objections: ตอบข้ออ้างปกติ

[CLOSING - 50-60 min]
🎯 CTA: ชัดเจน "Click link below" / "Comment your interest"
📞 Contact: ช่องติดต่อให้หลากหลาย
✨ Brand Sign-off: ตรงกับ Tone "${context.toneOfVoice}"

Editing Notes:
✓ Color Grading: ${context.visualStyle.primaryColor} dominance
✓ Pacing: เร็วในช่วงแรก ช้าๆ ตอนขาย
✓ Graphics: ใช้ Brand Font "${context.toneOfVoice}"`;
  }

  /**
   * Format response with fact check warnings
   */
  private formatResponse(response: string, factCheck: FactCheckResult): string {
    let formatted = response;

    if (!factCheck.valid && factCheck.violations.length > 0) {
      formatted += '\n\n⚠️ WARNINGS:\n';
      factCheck.violations.forEach(v => {
        formatted += `• ${v}\n`;
      });
    }

    if (factCheck.warnings.length > 0) {
      formatted += '\n💡 RECOMMENDATIONS:\n';
      factCheck.recommendations.forEach(r => {
        formatted += `• ${r}\n`;
      });
    }

    return formatted;
  }

  /**
   * Helper: Generate personality traits based on tone
   */
  private generatePersonalityTraits(tone: string): string {
    const traits: { [key: string]: string } = {
      formal: '• Professional, Trustworthy, Established, Authoritative, Sophisticated',
      casual: '• Friendly, Approachable, Relatable, Warm, Conversational',
      playful: '• Fun, Creative, Energetic, Young, Witty',
      professional: '• Competent, Reliable, Expert, Methodical, Results-driven',
      luxury: '• Exclusive, Premium, Elegant, Sophisticated, Aspirational'
    };

    return traits[tone] || traits['professional'];
  }

  /**
   * Helper: Generate animation style based on tone
   */
  private getAnimationStyle(tone: string): string {
    const styles: { [key: string]: string } = {
      formal: 'Smooth & Minimal - เซ็นทบริชเรื่อย',
      casual: 'Playful & Dynamic - มีชีวิต สดใจ',
      playful: 'Energetic & Bold - กล้าๆ มี Energy',
      professional: 'Clean & Efficient - เรียบร้อย ตรงจุด',
      luxury: 'Elegant & Sophisticated - หรูหรา ละมุน'
    };

    return styles[tone] || styles['professional'];
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): AIResponse[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}

export const aiService = new AIService();
