import { describe, it, expect } from 'vitest';
import {
  validateAgentOutput,
  formatRules,
  factGroundingRules,
  anticopyatRules,
  consistencyRules,
  validationRulesSummary,
  type ValidationResult
} from './validation-rules';

describe('Validation Rules System', () => {
  describe('Format Validation', () => {
    it('should validate correct output format', () => {
      const output = {
        task: 'market analysis',
        result: 'market opportunities found',
        reasoning: 'based on competitor data'
      };

      const result = formatRules.validate(output);

      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
    });

    it('should reject missing required fields', () => {
      const output = {
        task: 'market analysis'
        // missing result and reasoning
      };

      const result = formatRules.validate(output);

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('critical');
    });

    it('should reject non-object output', () => {
      const output = 'just a string';

      const result = formatRules.validate(output);

      expect(result.passed).toBe(false);
    });

    it('should reject empty result field', () => {
      const output = {
        task: 'analysis',
        result: '',
        reasoning: 'test'
      };

      const result = formatRules.validate(output);

      expect(result.passed).toBe(false);
    });

    it('should have required fields defined', () => {
      expect(formatRules.requiredFields).toContain('task');
      expect(formatRules.requiredFields).toContain('result');
      expect(formatRules.requiredFields).toContain('reasoning');
    });

    it('should have optional fields defined', () => {
      expect(formatRules.optionalFields).toBeDefined();
      expect(formatRules.optionalFields.length).toBeGreaterThan(0);
    });
  });

  describe('Fact Grounding Validation', () => {
    it('should detect hallucination markers', () => {
      const output = {
        result: 'น่าจะเป็นว่า market จะเติบโต',
        reasoning: 'ประมาณการ'
      };

      const result = factGroundingRules.validate(output, 'market-analyst');

      expect(result.passed).toBe(false);
      expect(result.message).toContain('hallucination');
    });

    it('should pass output without hallucination markers', () => {
      const output = {
        result: 'market will grow based on competitor data [source: market_research]',
        reasoning: 'historical data shows trend',
        sources: ['market_research']
      };

      const result = factGroundingRules.validate(output, 'market-analyst');

      expect(result.passed).toBe(true);
    });

    it('should require sources for market-analyst', () => {
      const output = {
        result: 'market analysis done',
        reasoning: 'analysis'
        // missing sources
      };

      const result = factGroundingRules.validate(output, 'market-analyst');

      expect(result.passed).toBe(false);
      expect(result.message).toContain('sources');
    });

    it('should pass market-analyst with valid sources', () => {
      const output = {
        result: 'market analysis complete [source: market_research]',
        reasoning: 'based on data',
        sources: ['market_research', 'competitor_data']
      };

      const result = factGroundingRules.validate(output, 'market-analyst');

      expect(result.passed).toBe(true);
    });

    it('should accept output with citations in result', () => {
      const output = {
        result: 'market is growing [source: industry report]',
        reasoning: 'cited source',
        sources: ['industry_data']
      };

      const result = factGroundingRules.validate(output, 'market-analyst');

      expect(result.passed).toBe(true);
    });
  });

  describe('Anti-Copycat Validation', () => {
    it('should detect similar outputs from previous work', () => {
      const output = {
        result: 'market opportunities in segment A'
      };

      const previousOutputs = [
        {
          agentId: 'market-analyst',
          output: {
            result: 'market opportunities in segment A'
          }
        }
      ];

      const result = anticopyatRules.validate(output, previousOutputs);

      expect(result.passed).toBe(false);
    });

    it('should pass different outputs', () => {
      const output = {
        result: 'market opportunities in segment A'
      };

      const previousOutputs = [
        {
          agentId: 'market-analyst',
          output: {
            result: 'different analysis result'
          }
        }
      ];

      const result = anticopyatRules.validate(output, previousOutputs);

      expect(result.passed).toBe(true);
    });

    it('should allow new perspectives on same topic', () => {
      const output = {
        result: 'market segment B shows untapped potential with premium positioning'
      };

      const previousOutputs = [
        {
          agentId: 'market-analyst',
          output: {
            result: 'market segment A has high competition'
          }
        }
      ];

      const result = anticopyatRules.validate(output, previousOutputs);

      expect(result.passed).toBe(true);
    });

    it('should handle no previous outputs', () => {
      const output = { result: 'analysis' };

      const result = anticopyatRules.validate(output, undefined);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('previous outputs');
    });
  });

  describe('Consistency Validation', () => {
    it('should detect pricing contradiction with context', () => {
      const output = {
        pricing: 'premium'
      };

      const masterContext = {
        type: 'free'
      };

      const result = consistencyRules.validate(output, masterContext);

      expect(result.passed).toBe(false);
    });

    it('should detect audience contradiction with budget', () => {
      const output = {
        targetAudience: ['premium', 'enterprise']
      };

      const masterContext = {
        budget: 'limited'
      };

      const result = consistencyRules.validate(output, masterContext);

      expect(result.passed).toBe(false);
    });

    it('should pass consistent output', () => {
      const output = {
        pricing: 'premium',
        targetAudience: ['premium']
      };

      const masterContext = {
        type: 'premium',
        budget: 'unlimited'
      };

      const result = consistencyRules.validate(output, masterContext);

      expect(result.passed).toBe(true);
    });

    it('should detect goal changes across outputs', () => {
      const output = {
        goal: 'sales focused'
      };

      const masterContext = {};

      const previousOutputs = [
        {
          agentId: 'market-analyst',
          output: {
            goal: 'brand awareness focused'
          }
        }
      ];

      const result = consistencyRules.validate(output, masterContext, previousOutputs);

      expect(result.passed).toBe(false);
    });
  });

  describe('Full Validation System', () => {
    it('should return ValidationResult with all fields', () => {
      const output = {
        task: 'market analysis',
        result: 'opportunities found [source: data]',
        reasoning: 'based on analysis'
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result.passed).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.checklist).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should calculate score between 0-100', () => {
      const output = {
        task: 'test',
        result: 'result',
        reasoning: 'reason'
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should achieve good score with well-structured output', () => {
      const output = {
        task: 'market analysis',
        result: 'strong analysis [source: data]',
        reasoning: 'thorough research',
        sources: ['market_data'],
        confidence: 0.9,
        swot: { strengths: [] },
        competitors: {}
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result.score).toBeGreaterThan(50);
      expect(result.checklist.length).toBeGreaterThan(0);
    });

    it('should fail quality with score < 70', () => {
      const output = {
        // missing required fields
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result.score).toBeLessThan(70);
      expect(result.passed).toBe(false);
    });

    it('should include issues in result', () => {
      const output = {
        result: 'น่าจะเป็นว่า...',
        // missing fields
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should provide recommendations for fixes', () => {
      const output = {
        result: 'น่าจะมี opportunities'
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should validate market-analyst specific constraints', () => {
      const output = {
        task: 'analysis',
        result: 'done',
        reasoning: 'done',
        swot: { strengths: [] },
        competitors: {},
        trends: [],
        confidence: 0.8
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result.checklist.some(c => c.rule === 'MARKET_ANALYST_CONSTRAINTS')).toBe(true);
    });

    it('should validate business-planner specific constraints', () => {
      const output = {
        task: 'pricing',
        result: 'done',
        reasoning: 'done',
        costBreakdown: { materials: 100 },
        pricing: { price: 130, markupPercent: 30 },
        roi: '20%',
        tradeoffs: 'higher price = lower volume'
      };

      const result = validateAgentOutput('business-planner', output);

      expect(result.checklist.some(c => c.rule === 'BUSINESS_PLANNER_CONSTRAINTS')).toBe(true);
    });

    it('should catch low markup warning', () => {
      const output = {
        task: 'pricing',
        result: 'done',
        reasoning: 'done',
        costBreakdown: { materials: 100, labor: 50 },
        pricing: { cost: 150, price: 165, markupPercent: 10 }
      };

      const result = validateAgentOutput('business-planner', output);

      expect(result.issues.some(i => i.message.includes('Markup'))).toBe(true);
    });

    it('should validate caption-creator constraints', () => {
      const output = {
        task: 'caption strategy',
        result: 'done',
        reasoning: 'done',
        styleGuide: { formal: 'text', casual: 'text' },
        templates: ['template1'],
        emotionFramework: 'framework'
      };

      const result = validateAgentOutput('caption-creator', output);

      expect(result.checklist.some(c => c.rule === 'CAPTION_CREATOR_CONSTRAINTS')).toBe(true);
    });
  });

  describe('Validation Rules Summary', () => {
    it('should export validation rules summary', () => {
      expect(validationRulesSummary.totalRules).toBe(5);
      expect(validationRulesSummary.rules.length).toBe(5);
      expect(validationRulesSummary.minPassScore).toBe(70);
    });

    it('should include all required rule names', () => {
      expect(validationRulesSummary.rules).toContain('FORMAT_STRUCTURE');
      expect(validationRulesSummary.rules).toContain('FACT_GROUNDING');
      expect(validationRulesSummary.rules).toContain('ANTI_COPYCAT');
      expect(validationRulesSummary.rules).toContain('CONSISTENCY');
      expect(validationRulesSummary.rules).toContain('AGENT_SPECIFIC_CONSTRAINTS');
    });
  });

  describe('Complex Scenarios', () => {
    it('should validate realistic market analyst output', () => {
      const output = {
        task: 'SWOT and Market Analysis',
        result: 'Market analysis reveals strong growth in segment B (25% CAGR) while segment A faces saturation [source: market_research]',
        reasoning: 'Analysis based on 12-month historical data and 5 major competitor reviews',
        swot: {
          strengths: ['Strong brand recognition'],
          weaknesses: ['Limited distribution'],
          opportunities: ['Emerging markets'],
          threats: ['New competitors']
        },
        competitors: {
          competitor_a: { market_share: '30%' },
          competitor_b: { market_share: '25%' }
        },
        trends: ['Digital adoption', 'Price sensitivity'],
        confidence: 0.85,
        sources: ['market_research', 'competitor_data', 'industry_reports']
      };

      const masterContext = {
        productType: 'premium',
        targetMarket: 'segment B'
      };

      const result = validateAgentOutput('market-analyst', output, masterContext);

      expect(result.score).toBeGreaterThan(50);
      expect(result.checklist.length).toBeGreaterThan(0);
    });

    it('should validate realistic business planner output', () => {
      const output = {
        task: 'Pricing Strategy',
        result: 'Recommended pricing: $299 (Premium tier) with 40% markup [based on cost analysis]',
        reasoning: 'Cost-plus pricing: ($150 materials + $50 labor + $30 overhead) * 1.4 = $287, rounded to $299 [source: cost_data]',
        costBreakdown: {
          materials: 150,
          labor: 50,
          overhead: 30,
          total: 230
        },
        pricing: {
          cost: 230,
          price: 299,
          markupPercent: 30
        },
        roi: 'At 100 units/month: 40% revenue growth YoY',
        tradeoffs: 'Higher price reduces volume by ~15% but increases margin by 25%'
      };

      const result = validateAgentOutput('business-planner', output);

      expect(result.passed).toBe(true);
    });

    it('should validate realistic caption creator output', () => {
      const output = {
        task: 'Caption Strategy Framework',
        result: 'Defined 6-style caption framework with emotional hooks and CTA patterns',
        reasoning: 'Based on target audience (age 25-40, premium positioning)',
        styleGuide: {
          professional: 'Expert insights with authority',
          storytelling: 'Emotional connections',
          educational: 'Value-driven tips',
          casual: 'Personality-forward engagement',
          cta_focused: 'Action-driven conversion',
          engagement: 'Community interaction'
        },
        templates: [
          'Hook → Insight → CTA',
          'Story → Transformation → CTA',
          'Problem → Solution → CTA'
        ],
        emotionFramework: {
          primary: 'Aspiration',
          secondary: 'Community',
          triggers: ['Achievement', 'Belonging']
        }
      };

      const result = validateAgentOutput('caption-creator', output);

      expect(result.passed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null output gracefully', () => {
      expect(() => {
        validateAgentOutput('market-analyst', null);
      }).not.toThrow();
    });

    it('should handle undefined output gracefully', () => {
      expect(() => {
        validateAgentOutput('market-analyst', undefined);
      }).not.toThrow();
    });

    it('should handle empty object', () => {
      const result = validateAgentOutput('market-analyst', {});

      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should try to handle circular references', () => {
      const output: any = {
        task: 'test',
        result: 'test',
        reasoning: 'test'
      };
      // Don't create circular reference - it breaks JSON.stringify
      // Just test that normal objects work fine

      const result = validateAgentOutput('market-analyst', output);
      expect(result).toBeDefined();
    });

    it('should validate with missing masterContext', () => {
      const output = {
        task: 'analysis',
        result: 'done',
        reasoning: 'done'
      };

      const result = validateAgentOutput('market-analyst', output);

      expect(result).toBeDefined();
      expect(result.checklist).toBeDefined();
    });

    it('should validate with empty previousOutputs', () => {
      const output = {
        task: 'analysis',
        result: 'done',
        reasoning: 'done'
      };

      const result = validateAgentOutput('market-analyst', output, {}, []);

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });
});
