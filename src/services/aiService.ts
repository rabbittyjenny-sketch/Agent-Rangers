/**
 * AI Service
 * Handles agent communication and response generation
 * Integrated with Database Service for data persistence
 */

import { Agent, getAgentById } from '../data/agents';
import { MasterContext } from '../data/intelligence';
import { orchestratorEngine, RoutingResult, FactCheckResult } from './orchestratorEngine';
import { databaseService, MessageRecord, AgentLearningRecord } from './databaseService';
import { databaseContextService, getAgentContext, recordLearning } from './databaseContextService';
import { automationService } from './automationService';

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
  attachments?: Array<{ name: string; type: string; size: number; data?: string }>;
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
   * Safely save to database without blocking the response flow
   */
  private async safeSave(operation: () => Promise<any>, label: string): Promise<void> {
    try {
      await operation();
    } catch (err) {
      console.warn(`[AI Service] Non-blocking DB save failed (${label}):`, err);
    }
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

    // Get brandId from request or use masterContext
    const brandId = request.brandId || this.masterContext?.brandId || '1';
    const numericBrandId = typeof brandId === 'string' ? parseInt(brandId) : brandId || 1;

    // Save user message to database (non-blocking)
    const userMessage: MessageRecord = {
      brandId: numericBrandId,
      role: 'user',
      content: request.userInput,
      attachments: request.attachments?.map(f => ({ name: f.name, type: f.type, size: f.size })),
      createdAt: new Date()
    };
    this.safeSave(() => databaseService.saveMessage(userMessage), 'user message');

    // Determine which agent to use
    let routingResult: RoutingResult;

    if (request.forceAgent) {
      // Force specific agent - use the forceAgent ID directly
      const forcedAgent = getAgentById(request.forceAgent);
      if (forcedAgent) {
        routingResult = {
          agent: forcedAgent,
          cluster: forcedAgent.cluster,
          confidence: 100,
          reason: `Forced to agent: ${forcedAgent.name}`
        };
      } else {
        routingResult = orchestratorEngine.route(request.userInput);
      }
    } else {
      routingResult = orchestratorEngine.route(request.userInput);
    }

    if (!routingResult.agent) {
      throw new Error('Could not route to appropriate agent');
    }

    // ✨ NEW: Fetch database context for the agent
    const dbContext = await getAgentContext(numericBrandId, routingResult.agent.cluster);

    // Generate response based on agent type
    const agentResponse = await this.generateAgentResponse(
      routingResult.agent,
      request.userInput,
      this.masterContext,
      dbContext
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

    // Save agent message to database (non-blocking)
    const agentMessage: MessageRecord = {
      brandId: numericBrandId,
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
    this.safeSave(() => databaseService.saveMessage(agentMessage), 'agent message');

    // ✨ NEW: Universal agent learning - ALL agents record insights (non-blocking)
    const insight = this.extractInsightFromResponse(
      routingResult.agent.id,
      request.userInput,
      agentResponse
    );

    if (insight) {
      const fieldsUsed = dbContext
        ? databaseContextService.getFieldsUsedByAgent(routingResult.agent.id, dbContext)
        : [];

      this.safeSave(
        () => recordLearning(
          numericBrandId,
          routingResult.agent.id,
          routingResult.agent.name,
          insight,
          fieldsUsed,
          routingResult.confidence
        ),
        'agent learning'
      );
    }

    // Add to history
    this.conversationHistory.push(aiResponse);

    return aiResponse;
  }

  /**
   * Generate response based on agent
   * Now calls Claude API with proper system prompt and context
   * ✨ NEW: Includes database context for smarter decisions
   */
  private async generateAgentResponse(
    agent: Agent,
    userInput: string,
    context: MasterContext,
    dbContext?: any
  ): Promise<string> {
    try {
      // Try to call Claude API with system prompt
      const response = await this.callClaudeAPI(agent, userInput, context, dbContext);
      return response;
    } catch (error) {
      console.warn(`Claude API call failed for ${agent.id}, falling back to template:`, error);
      // Fallback to template if API fails
      const agentResponses: { [key: string]: string } = {
        'market-analyst': this.generateMarketAnalystResponse(userInput, context, dbContext),
        'business-planner': this.generateBusinessPlannerResponse(userInput, context, dbContext),
        'insights-agent': this.generateInsightsResponse(userInput, context, dbContext),
        'brand-builder': this.generateBrandBuilderResponse(userInput, context, dbContext),
        'design-agent': this.generateDesignResponse(userInput, context, dbContext),
        'video-generator-art': this.generateVideoArtResponse(userInput, context, dbContext),
        'caption-creator': this.generateCaptionResponse(userInput, context, dbContext),
        'campaign-planner': this.generateCampaignResponse(userInput, context, dbContext),
        'video-generator-script': this.generateVideoScriptResponse(userInput, context, dbContext),
        'automation-specialist': this.generateAutomationResponse(userInput, context, dbContext)
      };
      return agentResponses[agent.id] || 'Agent response not available';
    }
  }

  /**
   * Call Claude API with agent system prompt and context
   * This is the REAL AI integration - uses Claude model with proper prompting
   * ✨ NEW: Includes database context for enhanced responses
   */
  private async callClaudeAPI(
    agent: Agent,
    userInput: string,
    context: MasterContext,
    dbContext?: any
  ): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    // Build context message with Brand Knowledge Template (3-bucket style)
    // ✨ NEW: Include database context for enriched data
    const contextInfo = this.buildContextMessage(agent, context, dbContext);

    // Construct messages for Claude API
    const messages = [
      {
        role: 'user',
        content: `${contextInfo}\n\nUser Request: ${userInput}`
      }
    ];

    // Call Claude API via fetch
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: agent.systemPrompt,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error (${response.status}): ${error}`);
    }

    const data = await response.json() as any;
    const textBlock = data.content?.find((block: any) => block.type === 'text');
    return textBlock?.text || 'No response from Claude';
  }

  /**
   * Build context message with Brand Knowledge Template
   * Sends relevant data based on agent cluster (Smart Lazy distribution)
   * ✨ NEW: Enhanced with database context for richer decision-making
   */
  private buildContextMessage(agent: Agent, context: MasterContext, dbContext?: any): string {
    const uspArray = Array.isArray(context.coreUSP) ? context.coreUSP : [context.coreUSP];

    let contextMsg = `# Brand Context for ${context.brandNameTh}

## Basic Info
- Brand (TH): ${context.brandNameTh}
- Brand (EN): ${context.brandNameEn}
- Industry: ${context.industry}
- Core USP: ${uspArray.join(', ')}`;

    // Add cluster-specific context from MasterContext
    if (agent.cluster === 'strategy') {
      contextMsg += `\n## Strategy Data
- Business Model: ${context.businessModel || 'B2C'}
- Target Audience: ${context.targetAudience}
- Tone of Voice: ${context.toneOfVoice}`;

      // ✨ Enrich with database context
      if (dbContext?.competitors && dbContext.competitors.length > 0) {
        contextMsg += `\n- Competitors: ${dbContext.competitors.join(', ')}`;
      }
    } else if (agent.cluster === 'creative') {
      contextMsg += `\n## Creative Data
- Primary Color: ${context.visualStyle?.primaryColor}
- Mood & Tone: ${context.visualStyle?.moodKeywords?.join(', ')}
- Video Style: ${context.visualStyle?.videoStyle || 'Not specified'}`;

      // ✨ Enrich with database context
      if (dbContext?.forbiddenElements && dbContext.forbiddenElements.length > 0) {
        contextMsg += `\n- Forbidden Elements: ${dbContext.forbiddenElements.join(', ')}`;
      }
      if (dbContext?.secondaryColors && dbContext.secondaryColors.length > 0) {
        contextMsg += `\n- Secondary Colors: ${dbContext.secondaryColors.join(', ')}`;
      }
    } else if (agent.cluster === 'growth') {
      contextMsg += `\n## Growth Data
- Target Persona: ${context.targetPersona || context.targetAudience}
- Tone of Voice: ${context.toneOfVoice}
- Brand Hashtags: ${context.brandHashtags?.join(', ') || 'Not specified'}`;

      // ✨ Enrich with database context
      if (dbContext?.forbiddenWords && dbContext.forbiddenWords.length > 0) {
        contextMsg += `\n- Forbidden Words: ${dbContext.forbiddenWords.join(', ')}`;
      }
      if (dbContext?.painPoints && dbContext.painPoints.length > 0) {
        contextMsg += `\n- Customer Pain Points: ${dbContext.painPoints.join(', ')}`;
      }
    }

    return contextMsg;
  }

  /**
   * Extract insight from agent response for learning database
   * Analyzes response to identify actionable insights
   */
  private extractInsightFromResponse(agentId: string, userInput: string, response: string): string | null {
    // Skip if response is too short
    if (!response || response.length < 50) return null;

    // Generate insight based on agent and input
    const inputKeywords = userInput.toLowerCase().split(' ');
    let insight = `${agentId} analyzed: ${userInput.substring(0, 100)}...`;

    // Add specific insights based on agent type
    if (agentId === 'market-analyst' && userInput.toLowerCase().includes('swot')) {
      insight = `SWOT analysis completed for market evaluation`;
    } else if (agentId === 'brand-builder' && userInput.toLowerCase().includes('brand')) {
      insight = `Brand identity and positioning analysis performed`;
    } else if (agentId === 'design-agent' && userInput.toLowerCase().includes('design')) {
      insight = `Design system and visual guidelines created`;
    } else if (agentId === 'caption-creator' && userInput.toLowerCase().includes('caption')) {
      insight = `Social media captions generated and optimized`;
    } else if (agentId === 'campaign-planner' && userInput.toLowerCase().includes('campaign')) {
      insight = `Campaign strategy and content calendar planned`;
    } else if (agentId === 'automation-specialist' && userInput.toLowerCase().includes('automat')) {
      insight = `Automation workflows configured and optimized`;
    }

    return insight;
  }

  /**
   * Market Analyst Response Template
   * ✨ NEW: Includes database context parameter
   */
  private generateMarketAnalystResponse(input: string, context: MasterContext, dbContext?: any): string {
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
  private generateBusinessPlannerResponse(input: string, context: MasterContext, dbContext?: any): string {
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
  private generateInsightsResponse(input: string, context: MasterContext, dbContext?: any): string {
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
  private generateBrandBuilderResponse(input: string, context: MasterContext, dbContext?: any): string {
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
  private generateDesignResponse(input: string, context: MasterContext, dbContext?: any): string {
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
  private generateVideoArtResponse(input: string, context: MasterContext, dbContext?: any): string {
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
  private generateCaptionResponse(input: string, context: MasterContext, dbContext?: any): string {
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
  private generateCampaignResponse(input: string, context: MasterContext, dbContext?: any): string {
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
   * Automation Specialist Response Template
   */
  private generateAutomationResponse(input: string, context: MasterContext, dbContext?: any): string {
    const isScheduling = input.toLowerCase().includes('schedule') || input.toLowerCase().includes('automat');
    const isMakeCom = input.toLowerCase().includes('make.com') || input.toLowerCase().includes('webhook');

    if (isScheduling) {
      return `⚙️ Automation Setup สำหรับ ${context.brandNameTh}

🎯 Automation Features Available:
1️⃣ Content Factory Automation
   • Auto-process submitted content
   • Send to Make.com webhook
   • Schedule: Every day at 9 AM
   • Webhook: https://hook.us2.make.com/3kcyu1ygkc8fjv19193apv8oxfhd1c6h

2️⃣ Caption Factory Automation
   • Auto-generate captions from images
   • Send to Make.com webhook
   • Schedule: Every 6 hours
   • Webhook: https://hook.us2.make.com/e7yel6e6t3ouyf8sv3dbni25nap685tf

3️⃣ Posting Schedule
   • Auto-post to Social Media
   • Based on Campaign Calendar
   • Timezone-aware scheduling
   • Support: TikTok, Facebook, Instagram, YouTube

⏰ Cron Expression Examples:
   • "0 9 * * *" - Every day at 9:00 AM
   • "0 */6 * * *" - Every 6 hours
   • "0 9 * * 1-5" - Weekdays at 9:00 AM
   • "0 17 * * *" - Every day at 5:00 PM

📌 Setup Instructions:
1. Tell me the cron schedule you want
2. Choose: Content Factory, Caption Factory, or Posting Schedule
3. I'll configure and activate the automation
4. You can monitor execution logs in dashboard

⚡ Current Status: ${automationService.getStatus().activeSchedules} active schedules`;
    }

    if (isMakeCom) {
      return `🔌 Make.com Integration Guide สำหรับ ${context.brandNameTh}

✅ Your Make.com Webhooks:

🎬 Content Factory Workflow:
   URL: https://hook.us2.make.com/3kcyu1ygkc8fjv19193apv8oxfhd1c6h
   Purpose: Auto-process content submissions (knowledge, sales)
   Expected Payload:
   {
     "user_email": "user@example.com",
     "category": "knowledge", // or 'sales'
     "platform": "TikTok",
     "post_format": "Short Clip Video",
     "raw_text": "Content description",
     "file_asset": "/path/to/image.jpg"
   }

📝 Caption Factory Workflow:
   URL: https://hook.us2.make.com/e7yel6e6t3ouyf8sv3dbni25nap685tf
   Purpose: Auto-generate captions from images
   Expected Payload:
   {
     "line_user_id": "U1234567890abc",
     "image_data": "data:image/jpeg;base64,...",
     "mood": "VIBRANT",
     "multilingual_level": 50
   }

🛠️ Automation Features:
✓ Automatic retry on failure (up to 3 attempts)
✓ Exponential backoff: 5s, 10s, 20s
✓ Request timeout: 10 seconds
✓ Batch processing: Up to 100 items per cycle
✓ Full logging and monitoring

📊 Execution Monitoring:
   • View past executions
   • Check error logs
   • Estimate next run time
   • Pause/resume automations

💡 Tips for Best Results:
1. Keep Make.com webhook URLs active
2. Test webhooks before scheduling
3. Monitor execution logs weekly
4. Adjust batch size if timeouts occur`;
    }

    return `⚙️ Automation Specialist Services สำหรับ ${context.brandNameTh}

I can help you:
✅ Set up automated content creation
✅ Schedule posts to social media
✅ Integrate with Make.com workflows
✅ Monitor automation execution logs
✅ Handle failures with auto-retry

What would you like to automate?
• "schedule content factory" - Auto-process content submissions
• "schedule caption factory" - Auto-generate captions
• "make.com setup" - Configure webhook integration
• "automation status" - Check current automations
• "stop automations" - Disable all automations`;
  }

  /**
   * Video Generator (Script) Response Template
   */
  private generateVideoScriptResponse(input: string, context: MasterContext, dbContext?: any): string {
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
