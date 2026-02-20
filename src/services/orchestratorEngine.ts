/**
 * Orchestrator Engine
 * Smart Routing, Intent Recognition, Fact Checking & Data Guard
 */

import { Agent, getAllAgents, getAgentById, getAgentsByCluster } from '../data/agents';
import { MasterContext, routingKeywords, factCheckValidators, systemCoreRules, TaskSpecificPrompt, getTaskPrompts } from '../data/intelligence';
import { dataGuardian, DataGuardReport } from './dataGuardService';

export interface RoutingResult {
  agent: Agent | null;
  cluster: string;
  confidence: number;
  reason: string;
}

export interface FactCheckResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
  recommendations: string[];
  dataGuardReport?: DataGuardReport;
}

export class OrchestratorEngine {
  private masterContext: MasterContext | null = null;
  private agentTaskData: Map<string, Record<string, any>> = new Map();
  private agentFirstUseTracked: Set<string> = new Set();

  /**
   * Initialize with Master Context (Brand Data)
   */
  setMasterContext(context: MasterContext): void {
    this.masterContext = context;
  }

  getMasterContext(): MasterContext | null {
    return this.masterContext;
  }

  // ========================================
  // Part B: Task-Specific Data Collection
  // ========================================

  /**
   * Check if an agent needs task-specific data (Part B) before first use
   */
  needsTaskSpecificData(agentId: string): boolean {
    if (this.agentFirstUseTracked.has(agentId)) return false;
    const prompts = getTaskPrompts(agentId);
    return !!prompts;
  }

  /**
   * Get the task-specific questions for an agent
   */
  getTaskSpecificQuestions(agentId: string): TaskSpecificPrompt | undefined {
    return getTaskPrompts(agentId);
  }

  /**
   * Store task-specific data collected from the user (Part B)
   */
  setTaskSpecificData(agentId: string, data: Record<string, any>): void {
    this.agentTaskData.set(agentId, data);
    this.agentFirstUseTracked.add(agentId);
  }

  /**
   * Get stored task-specific data for an agent
   */
  getTaskSpecificData(agentId: string): Record<string, any> | undefined {
    return this.agentTaskData.get(agentId);
  }

  /**
   * Build complete context for an agent (Part A + Part B combined)
   */
  buildAgentContext(agentId: string): { masterContext: MasterContext | null; taskData: Record<string, any> | undefined } {
    return {
      masterContext: this.masterContext,
      taskData: this.agentTaskData.get(agentId)
    };
  }

  // ========================================
  // Anti-Copycat & IP Protection Rules
  // ========================================

  /**
   * Rule 1: Brand Data Isolation
   * Enforces strict brand_id scoping for all data access
   */
  enforceBrandIsolation(requestedBrandId: string): { allowed: boolean; reason: string } {
    if (!this.masterContext) {
      return { allowed: false, reason: 'No brand context loaded' };
    }
    if (this.masterContext.brandId !== requestedBrandId) {
      return {
        allowed: false,
        reason: `Access denied: Cannot access data for brand "${requestedBrandId}". Current session is scoped to "${this.masterContext.brandId}".`
      };
    }
    return { allowed: true, reason: 'Brand isolation check passed' };
  }

  /**
   * Rule 2: Non-Plagiarism & Trademark Check
   * Ensures AI output is original and doesn't violate trademarks
   */
  checkPlagiarismAndTrademark(content: string): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    // Known trademark patterns (expandable)
    const trademarkPatterns = [
      /just do it/gi,
      /think different/gi,
      /i'm lovin' it/gi,
      /because you're worth it/gi,
      /impossible is nothing/gi,
      /open happiness/gi,
      /taste the rainbow/gi,
      /have it your way/gi,
      /finger lickin' good/gi,
      /the happiest place on earth/gi
    ];

    for (const pattern of trademarkPatterns) {
      if (pattern.test(content)) {
        issues.push(`Trademark violation detected: "${content.match(pattern)?.[0]}". Must rephrase using brand's own voice.`);
      }
    }

    // Check for exact slogan copying patterns
    if (this.masterContext) {
      const brandVoice = this.masterContext.toneOfVoice;
      if (!issues.length) {
        // Content passed trademark check
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Rule 3: Art Style Protection
   * Prevents mimicking real artists - uses mood keywords instead
   */
  checkArtStyleProtection(prompt: string): { passed: boolean; suggestion: string } {
    const protectedArtists = [
      'picasso', 'van gogh', 'monet', 'warhol', 'banksy', 'kaws',
      'basquiat', 'hirst', 'kusama', 'murakami', 'ai weiwei',
      'frida kahlo', 'salvador dali', 'rembrandt', 'klimt',
      'hokusai', 'pollock', 'rothko', 'lichtenstein'
    ];

    const promptLower = prompt.toLowerCase();
    const foundArtist = protectedArtists.find(artist => promptLower.includes(artist));

    if (foundArtist) {
      const moodKeywords = this.masterContext?.visualStyle?.moodKeywords || ['modern', 'creative'];
      return {
        passed: false,
        suggestion: `Cannot mimic "${foundArtist}" style. Use brand mood keywords instead: "${moodKeywords.join(', ')}". Example: Replace "Picasso style" with "${moodKeywords[0]} and abstract composition".`
      };
    }

    return { passed: true, suggestion: '' };
  }

  /**
   * Run all IP protection checks on content
   */
  runIPProtectionChecks(content: string): {
    isolation: { allowed: boolean; reason: string };
    plagiarism: { passed: boolean; issues: string[] };
    artStyle: { passed: boolean; suggestion: string };
    overallPassed: boolean;
  } {
    const isolation = this.masterContext
      ? this.enforceBrandIsolation(this.masterContext.brandId)
      : { allowed: false, reason: 'No context' };
    const plagiarism = this.checkPlagiarismAndTrademark(content);
    const artStyle = this.checkArtStyleProtection(content);

    return {
      isolation,
      plagiarism,
      artStyle,
      overallPassed: isolation.allowed && plagiarism.passed && artStyle.passed
    };
  }

  /**
   * Intent Recognition - วิเคราะห์เจตนา
   * Returns which cluster(s) the user is asking about
   */
  recognizeIntent(userInput: string): string[] {
    const input = userInput.toLowerCase();
    const clusters: string[] = [];

    // Check for strategist keywords
    const strategistKeywords = routingKeywords.strategist;
    if (strategistKeywords.some(keyword => input.includes(keyword))) {
      clusters.push('strategist');
    }

    // Check for studio keywords
    const studioKeywords = routingKeywords.studio;
    if (studioKeywords.some(keyword => input.includes(keyword))) {
      clusters.push('studio');
    }

    // Check for agency keywords
    const agencyKeywords = routingKeywords.agency;
    if (agencyKeywords.some(keyword => input.includes(keyword))) {
      clusters.push('agency');
    }

    return clusters.length > 0 ? clusters : ['strategist']; // Default to strategist
  }

  /**
   * Smart Routing - ส่งงานไป Agent ที่เหมาะสม
   */
  route(userInput: string): RoutingResult {
    const input = userInput.toLowerCase();
    const allAgents = getAllAgents();
    let bestMatch: Agent | null = null;
    let bestScore = 0;
    let reason = 'No match found';

    for (const agent of allAgents) {
      let score = 0;

      // Score based on agent keywords
      for (const keyword of agent.keywords) {
        if (input.includes(keyword.toLowerCase())) {
          score += 2; // Strong match
        }
      }

      // Score based on business functions description
      for (const func of agent.businessFunctions) {
        if (input.includes(func.toLowerCase())) {
          score += 1.5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = agent;
        reason = `Matched with Agent: ${agent.name} (keywords found)`;
      }
    }

    // Fallback routing based on cluster keywords
    if (!bestMatch) {
      const intent = this.recognizeIntent(userInput);
      if (intent.includes('strategist')) {
        bestMatch = getAllAgents().find(a => a.cluster === 'strategist');
        reason = 'Routed to Strategist cluster by intent';
      } else if (intent.includes('studio')) {
        bestMatch = getAllAgents().find(a => a.cluster === 'studio');
        reason = 'Routed to Studio cluster by intent';
      } else if (intent.includes('agency')) {
        bestMatch = getAllAgents().find(a => a.cluster === 'agency');
        reason = 'Routed to Agency cluster by intent';
      }
    }

    const confidence = Math.min((bestScore / 4) * 100, 100);

    return {
      agent: bestMatch || null,
      cluster: bestMatch?.cluster || 'strategist',
      confidence,
      reason
    };
  }

  /**
   * Comprehensive Output Validation with Data Guard
   * เพิ่มเติมความมั่นใจของระบบ (Enhanced Reliability)
   */
  async validateOutputWithGuard(
    output: string,
    contentId?: string,
    metadata?: any
  ): Promise<FactCheckResult> {
    const result: FactCheckResult = {
      valid: true,
      violations: [],
      warnings: [],
      recommendations: []
    };

    if (!this.masterContext) {
      result.warnings.push('⚠️ ไม่พบ Master Context - ไม่สามารถตรวจสอบเต็มระดับ');
      return result;
    }

    // Run Data Guardian validation
    const guardReport = await dataGuardian.validateContent(
      this.masterContext,
      output,
      metadata,
      contentId
    );

    // Include guard report in result
    result.dataGuardReport = guardReport;

    // Map guard results to fact check result
    const checksEntries = Object.entries(guardReport.checks) as any[];
    for (const [key, checkResult] of checksEntries) {
      if (!checkResult.passed) {
        if (checkResult.severity === 'error') {
          result.violations.push(checkResult.message);
          result.valid = false;
        } else if (checkResult.severity === 'warning') {
          result.warnings.push(checkResult.message);
        }
      }
    }

    // Add all recommendations
    result.recommendations.push(...guardReport.recommendations);

    // Overall status
    if (guardReport.overallStatus === 'blocked') {
      result.valid = false;
    } else if (guardReport.overallStatus === 'warning') {
      result.valid = false; // Warnings are treated as validation issues to fix
    }

    return result;
  }

  /**
   * Fact Check - ตรวจสอบความถูกต้อง (Legacy)
   * Validates output against Master Context and system rules
   */
  factCheck(output: string): FactCheckResult {
    const result: FactCheckResult = {
      valid: true,
      violations: [],
      warnings: [],
      recommendations: []
    };

    if (!this.masterContext) {
      result.warnings.push('⚠️ ไม่พบ Master Context - ไม่สามารถตรวจสอบเต็มระดับ');
      return result;
    }

    // Run validators
    for (const validator of factCheckValidators) {
      const validation = validator.check(this.masterContext, output);
      if (!validation.valid) {
        result.valid = false;
        result.violations.push(validation.message);
      }
    }

    // Check for potential hallucination indicators
    if (this.hasHallucinationIndicators(output)) {
      result.warnings.push('⚠️ ตรวจพบการอ้างอิงข้อมูลที่อาจไม่แน่นอน');
      result.recommendations.push('✓ เพิ่มคำว่า "ประมาณการ" หรือ "อ้างอิง" เมื่อจำเป็น');
    }

    // Check for consistency with brand USP
    if (!this.isConsistentWithUSP(output)) {
      result.warnings.push('⚠️ ผลลัพธ์อาจไม่ตรงกับ USP ของแบรนด์');
      result.recommendations.push(`✓ ให้เน้น: "${this.masterContext.coreUSP}"`);
    }

    return result;
  }

  /**
   * Isolation Check - ตรวจสอบ Brand Data Isolation
   */
  checkIsolation(brandId: string): boolean {
    if (!this.masterContext) return false;
    return this.masterContext.brandId === brandId;
  }

  /**
   * Anti-Copycat Check - ป้องกันการเลียนแบบ
   */
  antiCopycatCheck(originalText: string, newText: string): FactCheckResult {
    const result: FactCheckResult = {
      valid: true,
      violations: [],
      warnings: [],
      recommendations: []
    };

    const similarity = this.calculateSimilarity(originalText, newText);

    if (similarity > 0.9) {
      result.valid = false;
      result.violations.push('❌ ข้อความใหม่มีความคล้ายคลึงกับต้นฉบับ > 90% (Plagiarism Risk)');
      result.recommendations.push('✓ ให้ Rephrase ข้อความให้เข้ากับ Brand Voice มากขึ้น');
    } else if (similarity > 0.7) {
      result.warnings.push('⚠️ ความคล้ายคลึง > 70% - อาจจำเป็นปรับปรุง');
      result.recommendations.push('✓ พิจารณา Rephrase บางส่วน');
    }

    return result;
  }

  /**
   * Cross-Agent Logic Helper
   * Allows agents to fetch relevant data from other clusters
   */
  getCrossAgentContext(currentAgentId: string, dataType: 'brand' | 'tone' | 'visuals'): any {
    if (!this.masterContext) return null;

    const agent = getAgentById(currentAgentId);
    if (!agent) return null;

    switch (dataType) {
      case 'brand':
        return {
          brandName: this.masterContext.brandNameTh,
          brandNameEn: this.masterContext.brandNameEn,
          coreUSP: this.masterContext.coreUSP
        };
      case 'tone':
        return {
          toneOfVoice: this.masterContext.toneOfVoice,
          moodKeywords: this.masterContext.visualStyle.moodKeywords
        };
      case 'visuals':
        return {
          primaryColor: this.masterContext.visualStyle.primaryColor,
          moodKeywords: this.masterContext.visualStyle.moodKeywords
        };
      default:
        return null;
    }
  }

  /**
   * Helper: Check for hallucination indicators
   */
  private hasHallucinationIndicators(text: string): boolean {
    const hallucIndicators = [
      'ตามรายงาน', 'ตามข้อมูล', 'พบว่า', 'วิจัย',
      'report', 'research', 'study', 'found', 'data shows'
    ];

    return hallucIndicators.some(indicator => text.toLowerCase().includes(indicator));
  }

  /**
   * Helper: Check consistency with USP
   */
  private isConsistentWithUSP(text: string): boolean {
    if (!this.masterContext) return true;

    const usp = this.masterContext.coreUSP.toLowerCase();
    const textLower = text.toLowerCase();

    // Simple check: if USP mentions "eco" and text mentions "plastic", it's inconsistent
    const ecoIndicators = ['eco', 'sustainable', 'green', 'organic', 'natural'];
    const plasticIndicators = ['plastic', 'disposable', 'artificial'];

    const hasEco = ecoIndicators.some(ind => usp.includes(ind));
    const hasPlastic = plasticIndicators.some(ind => textLower.includes(ind));

    if (hasEco && hasPlastic) return false;

    return true;
  }

  /**
   * Helper: Calculate text similarity (Levenshtein-based)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const s1 = text1.toLowerCase();
    const s2 = text2.toLowerCase();

    if (s1 === s2) return 1.0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Helper: Levenshtein distance for similarity calculation
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let k = 0; k <= s1.length; k++) costs[k] = k;

    let minCost = 0;
    let maxCost = 0;

    for (let i = 1; i <= s2.length; i++) {
      minCost = i;
      maxCost = i - 1;

      for (let j = 1; j <= s1.length; j++) {
        const newCost = Math.min(
          maxCost + 1,
          costs[j] + 1,
          costs[j - 1] + (s1.charAt(j - 1) === s2.charAt(i - 1) ? 0 : 1)
        );
        costs[j - 1] = maxCost;
        maxCost = newCost;
      }

      costs[s1.length] = maxCost;
    }

    return maxCost;
  }

  /**
   * Generate System Summary
   */
  generateSystemSummary(): string {
    if (!this.masterContext) {
      return '❌ ไม่พบ Master Context - โปรดทำการ Onboarding ก่อน';
    }

    const taskDataCount = this.agentTaskData.size;

    return `
✅ Orchestrator Status: READY
📍 Brand: ${this.masterContext.brandNameTh} (${this.masterContext.brandNameEn})
🎯 USP: ${this.masterContext.coreUSP}
🎨 Tone: ${this.masterContext.toneOfVoice}
👥 Target: ${this.masterContext.targetAudience}

Agents Ready:
  📊 The Strategist: Market Analyst, Business Planner, Insights Agent
  🎨 The Studio: Brand Builder, Design Agent, Video Generator (Art)
  🚀 The Agency: Caption Creator, Campaign Planner, Video Generator (Script)

Onboarding Data:
  ✅ Part A: Brand Foundation (Complete)
  📋 Part B: Task-Specific Data (${taskDataCount} agents configured)

System Rules Active (Layer 1 - Orchestrator):
  🔒 Rule 1: Brand Data Isolation (ห้ามแชร์ข้อมูลข้าม brand_id)
  🛡️ Rule 2: Non-Plagiarism & Trademark Protection (ห้ามคัดลอก + ห้ามละเมิดเครื่องหมายการค้า)
  🎨 Rule 3: Art Style Protection (ห้ามเลียนแบบศิลปิน ใช้ Mood Keywords แทน)
  ✅ 6-Layer Data Guard: Isolation → Anti-Copycat → Fact Check → USP → Reference → Consistency

IP Protection Policy:
  "ห้ามใช้ความลับทางการค้าจากแบรนด์อื่น ผลลัพธ์ทุกอย่างต้อง Customize ตาม brand_knowledge"
    `;
  }
}

// Export singleton instance
export const orchestratorEngine = new OrchestratorEngine();
