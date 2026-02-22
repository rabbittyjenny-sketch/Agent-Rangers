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
        'market-analyzer': this.generateMarketAnalyzerResponse(userInput, context, dbContext),
        'positioning-strategist': this.generatePositioningStrategistResponse(userInput, context, dbContext),
        'customer-insight-specialist': this.generateCustomerInsightResponse(userInput, context, dbContext),
        'visual-strategist': this.generateVisualStrategistResponse(userInput, context, dbContext),
        'brand-voice-architect': this.generateBrandVoiceResponse(userInput, context, dbContext),
        'narrative-designer': this.generateNarrativeDesignerResponse(userInput, context, dbContext),
        'content-creator': this.generateContentCreatorResponse(userInput, context, dbContext),
        'campaign-planner': this.generateCampaignResponse(userInput, context, dbContext),
        'automation-specialist': this.generateAutomationResponse(userInput, context, dbContext),
        'analytics-master': this.generateAnalyticsMasterResponse(userInput, context, dbContext)
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
    if (agentId === 'market-analyzer' && userInput.toLowerCase().includes('swot')) {
      insight = `SWOT analysis completed for market evaluation`;
    } else if (agentId === 'positioning-strategist' && userInput.toLowerCase().includes('positioning')) {
      insight = `Brand positioning and value proposition defined`;
    } else if (agentId === 'customer-insight-specialist' && userInput.toLowerCase().includes('customer')) {
      insight = `Customer journey mapping and persona analysis completed`;
    } else if (agentId === 'visual-strategist' && userInput.toLowerCase().includes('design')) {
      insight = `Visual system and brand identity designed`;
    } else if (agentId === 'brand-voice-architect' && userInput.toLowerCase().includes('voice')) {
      insight = `Brand voice and tone playbook created`;
    } else if (agentId === 'narrative-designer' && userInput.toLowerCase().includes('story')) {
      insight = `Brand story architecture and narrative patterns designed`;
    } else if (agentId === 'content-creator' && (userInput.toLowerCase().includes('caption') || userInput.toLowerCase().includes('script'))) {
      insight = `Content strategy framework generated (dual-mode)`;
    } else if (agentId === 'campaign-planner' && userInput.toLowerCase().includes('campaign')) {
      insight = `Campaign timeline and milestone mapping planned`;
    } else if (agentId === 'automation-specialist' && userInput.toLowerCase().includes('automat')) {
      insight = `Automation workflows configured and optimized`;
    } else if (agentId === 'analytics-master' && userInput.toLowerCase().includes('kpi')) {
      insight = `KPI dashboard and measurement framework designed`;
    }

    return insight;
  }

  /**
   * Market Analyzer Response Template (Comparative Analysis Engine)
   */
  private generateMarketAnalyzerResponse(input: string, context: MasterContext, dbContext?: any): string {
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
   * Positioning Strategist Response Template (Positioning Triangle Mapping)
   */
  private generatePositioningStrategistResponse(input: string, context: MasterContext, dbContext?: any): string {
    return `🎯 Positioning Framework สำหรับ ${context.brandNameTh}

POSITIONING TRIANGLE:
├─ Axis 1: Price vs Value → ${context.coreUSP}
├─ Axis 2: Traditional vs Modern → ${context.toneOfVoice}
└─ Axis 3: Community vs Individual → ${context.targetAudience}

POSITIONING STATEMENT:
"${context.brandNameEn} is the choice for ${context.targetAudience} who values ${context.coreUSP}"

PRIMARY PILLARS:
1. ${context.coreUSP} - จุดเด่นหลัก
2. ${context.toneOfVoice} - Brand Personality
3. Community Connection - สร้างความผูกพัน

VALUE PROPOSITION HIERARCHY:
✓ Functional: ${context.coreUSP}
✓ Emotional: ${context.visualStyle?.moodKeywords?.join(', ') || 'Trust & Connection'}
✓ Social: ${context.targetAudience}

📌 Next Step: ใช้ Positioning นี้เป็นแม่แบบสำหรับ Creative & Growth Teams`;
  }

  /**
   * Customer Insight Specialist Response Template (Journey Stage Mapping)
   */
  private generateCustomerInsightResponse(input: string, context: MasterContext, dbContext?: any): string {
    return `👥 Customer Journey Map สำหรับ ${context.brandNameTh}

TARGET PERSONA: ${context.targetAudience}

STAGE 1: AWARENESS (Social discovery)
├─ Touchpoints: Instagram, TikTok, Blog
├─ Customer Mindset: "Is there a better option?"
├─ Pain Point: Information overload
└─ Emotion: Curious but skeptical

STAGE 2: CONSIDERATION (Research phase)
├─ Touchpoints: Website, Reviews, FAQ
├─ Customer Mindset: "Does this solve my problem?"
├─ Pain Point: Lack of proof/testimonials
└─ Emotion: Interested but cautious

STAGE 3: DECISION (Purchase)
├─ Touchpoints: Email, Checkout, Support
├─ Customer Mindset: "Will I regret this?"
├─ Pain Point: Trust & guarantee
└─ Emotion: Hopeful & committed

KEY METRICS:
📊 Awareness: Reach & Impressions
📊 Consideration: Engagement Rate
📊 Decision: Conversion Rate
📊 Retention: Customer Lifetime Value

💡 Recommendation: ให้บอกตัวเลขจริงได้เลย - จะช่วยวิเคราะห์ได้ลึกขึ้น`;
  }

  /**
   * Visual Strategist Response Template (Personality-to-Visual Translation)
   */
  private generateVisualStrategistResponse(input: string, context: MasterContext, dbContext?: any): string {
    return `🎨 Visual System Blueprint สำหรับ ${context.brandNameTh}

COLOR PSYCHOLOGY:
🎨 Primary: ${context.visualStyle.primaryColor}
   Psychology: Trust, Stability, Brand Recognition
🎨 Secondary: Complementary color (derive from primary)
🎨 Accent: Highlights and CTAs
🎨 Neutral: Grays for backgrounds and text

TYPOGRAPHY HIERARCHY:
📝 Headlines: Bold serif - Authority & Heritage
📝 Body: Clean sans-serif - Modern & Accessible
📝 Accent: Script (subtle) - Personality

VISUAL PATTERNS:
✓ Imagery: Authentic lifestyle (not stock photos)
✓ Whitespace: 40-50% for premium feel
✓ Mobile-First: Responsive Design
✓ WCAG 2.1 Accessible

MOOD TRANSLATION:
Brand Personality: ${context.toneOfVoice}
→ Visual Feel: ${context.visualStyle?.moodKeywords?.join(', ') || 'Modern & Clean'}

📌 All visuals must reflect USP: ${context.coreUSP}`;
  }

  /**
   * Brand Voice Architect Response Template (Tone Context Matrix)
   */
  private generateBrandVoiceResponse(input: string, context: MasterContext, dbContext?: any): string {
    return `🗣️ Voice & Tone Playbook สำหรับ ${context.brandNameTh}

CORE VOICE: ${context.toneOfVoice}

VOICE PERSONALITY:
${this.generatePersonalityTraits(context.toneOfVoice)}

TONE VARIATIONS BY CONTEXT:
Context           | Tone            | Example
──────────────────────────────────────────────
Happy news       | Celebratory     | "We did it together!"
Problem solving  | Empathetic      | "We hear you, here's how..."
Education        | Patient mentor  | "Let's break this down..."
Marketing        | Warm + excited  | "You're part of our story!"

DO's & DON'Ts:
✓ DO: Use contractions (we're, it's)
✓ DO: Ask questions to engage
✓ DO: Share stories and examples
✗ DON'T: Use corporate jargon
✗ DON'T: Be overly formal or casual
✗ DON'T: Use forbidden words

📌 Brand Voice must align with USP: ${context.coreUSP}`;
  }

  /**
   * Narrative Designer Response Template (Hero's Journey)
   */
  private generateNarrativeDesignerResponse(input: string, context: MasterContext, dbContext?: any): string {
    return `📚 Brand Story Architecture สำหรับ ${context.brandNameTh}

THE BRAND ORIGIN STORY:

ACT I: THE INCITING INCIDENT
"The founding moment - what problem sparked the creation of ${context.brandNameEn}"

ACT II: THE JOURNEY & STRUGGLE
"The challenges faced, lessons learned, and growth moments"

ACT III: THE TRANSFORMATION
"How ${context.brandNameEn} became what it is today - ${context.coreUSP}"

HERO'S JOURNEY ARCHETYPE:
Role: Guide ${context.targetAudience} through transformation

NARRATIVE PATTERNS TO TELL:
✓ Origin story (heritage + authenticity)
✓ Customer transformation stories (social proof)
✓ Behind-the-scenes (humanizes brand)
✓ Community stories (belonging)

VISUAL STORYTELLING:
🎬 Mood: ${context.visualStyle?.moodKeywords?.join(' + ') || context.toneOfVoice}
🎬 Style: Authentic, Emotional, Brand-aligned

📌 Every story must reflect USP: ${context.coreUSP}`;
  }

  /**
   * Content Creator Response Template (Dual-Mode: Caption + Script)
   */
  private generateContentCreatorResponse(input: string, context: MasterContext, dbContext?: any): string {
    const isScript = input.toLowerCase().includes('script') || input.toLowerCase().includes('video') || input.toLowerCase().includes('scene');

    if (isScript) {
      return `🎬 Video Script Outline สำหรับ ${context.brandNameTh}

SCENE 1: HOOK (0-3s)
Visual: Eye-catching opening
Audio: "${context.coreUSP}" - trending sound
Mood: ${context.visualStyle?.moodKeywords?.[0] || 'Warm'}

SCENE 2: BODY (3-12s)
Visual: Storytelling + product showcase
Audio: Brand narrative
Mood: Authentic, trustworthy

SCENE 3: CTA (12-15s)
Visual: Logo + contact info
Audio: Clear call-to-action
Mood: Inviting, action-oriented

PRODUCTION:
• Format: 9:16 (TikTok/Reels)
• Duration: 15 seconds
• Music: Match brand tone "${context.toneOfVoice}"

📌 Script reflects USP: ${context.coreUSP}`;
    }

    return `✨ Caption Strategy Framework สำหรับ ${context.brandNameTh}

HOOK PATTERNS:
• Pattern A: Pain point + Solution
  "Tired of [problem]? Here's the fix."
• Pattern B: Lifestyle aspirational
  "${context.visualStyle?.moodKeywords?.[0] || 'Quality'} is not just a word, it's a feeling"
• Pattern C: Community belonging
  "Join ${context.targetAudience} discovering ${context.coreUSP}"

CTA FORMULAS:
• Action: "Try now", "Discover our story"
• Engagement: "Tag a friend", "Share your experience"
• Question: "What's yours?", "Do you agree?"

STYLE VARIATIONS:
1️⃣ Professional/Expert - Knowledge & Authority
2️⃣ Storytelling - Emotion & Connection
3️⃣ Casual/Fun - Personality & Engagement
4️⃣ CTA-Focused - Action & Conversion

📌 All captions must use Tone: "${context.toneOfVoice}" and emphasize: "${context.coreUSP}"`;
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
   * Analytics Master Response Template (KPI Hierarchy + Metric Relationships)
   */
  private generateAnalyticsMasterResponse(input: string, context: MasterContext, dbContext?: any): string {
    return `📊 Measurement Framework สำหรับ ${context.brandNameTh}

BUSINESS OBJECTIVE: Growth for ${context.industry}

PRIMARY KPI:
├─ Customer Lifetime Value (CLV)
└─ Target: Increase by 50%+ in 6 months

SECONDARY METRICS:
├─ Average Order Value (AOV)
├─ Repeat Purchase Rate
├─ Customer Retention Rate
└─ Net Promoter Score (NPS)

DIAGNOSTIC METRICS:
├─ Content engagement (by type)
├─ Email open rates (by segment)
├─ Social conversion (by platform)
└─ Support satisfaction (by issue type)

DASHBOARD LAYOUT:
Top Row:    Revenue | CLV | AOV | Repeat Rate
Mid Row:    Engagement | Retention | NPS | CAC
Bottom Row: Channel Performance | Content Analysis | Cohort Trends

TRACKING TEMPLATE:
┌─────────────┬──────────┬────────┬──────────┐
│ Metric      │ Current  │ Target │ Progress │
├─────────────┼──────────┼────────┼──────────┤
│ CLV         │ TBD      │ +50%   │ Pending  │
│ AOV         │ TBD      │ +30%   │ Pending  │
│ Repeat Rate │ TBD      │ +40%   │ Pending  │
└─────────────┴──────────┴────────┴──────────┘

💡 ให้บอกตัวเลขจริงได้เลย - จะช่วยวิเคราะห์ได้ลึกขึ้น`;
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
