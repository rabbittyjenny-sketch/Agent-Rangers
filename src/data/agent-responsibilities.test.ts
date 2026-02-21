import { describe, it, expect } from 'vitest';
import {
  getWorkflowOrder,
  validateDependencies,
  responsibilityMatrices,
  type ResponsibilityMatrix
} from './agent-responsibilities';

describe('Agent Responsibilities & Workflow', () => {
  describe('Responsibility Matrices', () => {
    it('should have defined matrices for all agents', () => {
      const agentIds = [
        'market-analyst',
        'business-planner',
        'insights-agent',
        'brand-builder',
        'design-agent',
        'video-generator-art',
        'caption-creator',
        'campaign-planner',
        'video-generator-script',
        'automation-specialist'
      ];

      for (const agentId of agentIds) {
        const matrix = responsibilityMatrices.find(m => m.agentId === agentId);
        expect(matrix).toBeDefined();
        expect(matrix?.agentId).toBe(agentId);
      }
    });

    it('should have all required fields in each matrix', () => {
      for (const matrix of responsibilityMatrices) {
        expect(matrix.agentId).toBeDefined();
        expect(matrix.agentName).toBeDefined();
        expect(matrix.cluster).toBeDefined();
        expect(['strategy', 'creative', 'growth']).toContain(matrix.cluster);

        expect(matrix.primaryResponsibilities).toBeDefined();
        expect(Array.isArray(matrix.primaryResponsibilities)).toBe(true);
        expect(matrix.primaryResponsibilities.length).toBeGreaterThan(0);

        expect(matrix.dependsOn).toBeDefined();
        expect(Array.isArray(matrix.dependsOn)).toBe(true);

        expect(matrix.requiredBy).toBeDefined();
        expect(Array.isArray(matrix.requiredBy)).toBe(true);

        expect(matrix.conflictsWith).toBeDefined();
        expect(Array.isArray(matrix.conflictsWith)).toBe(true);

        expect([1, 2, 3, 4]).toContain(matrix.executionPhase);
        expect(matrix.requiredInputs).toBeDefined();
        expect(matrix.expectedOutputs).toBeDefined();
        expect(matrix.successCriteria).toBeDefined();
      }
    });

    it('should have clear cluster assignments', () => {
      const strategyAgents = responsibilityMatrices.filter(
        m => m.cluster === 'strategy'
      );
      const creativeAgents = responsibilityMatrices.filter(
        m => m.cluster === 'creative'
      );
      const growthAgents = responsibilityMatrices.filter(
        m => m.cluster === 'growth'
      );

      expect(strategyAgents.length).toBe(3); // market-analyst, business-planner, insights-agent
      expect(creativeAgents.length).toBe(3); // brand-builder, design-agent, video-generator-art
      expect(growthAgents.length).toBe(4); // caption-creator, campaign-planner, video-generator-script, automation-specialist
    });
  });

  describe('Workflow Phases', () => {
    it('should organize agents into 4 phases', () => {
      const phases = getWorkflowOrder();

      expect(phases.length).toBe(4);
      expect(phases[0]).toBeDefined(); // Phase 1
      expect(phases[1]).toBeDefined(); // Phase 2
      expect(phases[2]).toBeDefined(); // Phase 3
      expect(phases[3]).toBeDefined(); // Phase 4
    });

    it('should have Strategy agents in Phase 1', () => {
      const phases = getWorkflowOrder();
      const phase1 = phases[0];

      expect(phase1).toContain('market-analyst');
      expect(phase1).toContain('business-planner');
      expect(phase1).toContain('insights-agent');
    });

    it('should have Creative agents in Phase 2', () => {
      const phases = getWorkflowOrder();
      const phase2 = phases[1];

      expect(phase2).toContain('brand-builder');
      expect(phase2).toContain('design-agent');
      expect(phase2).toContain('video-generator-art');
    });

    it('should have Planning agents in Phase 3', () => {
      const phases = getWorkflowOrder();
      const phase3 = phases[2];

      expect(phase3).toContain('caption-creator');
      expect(phase3).toContain('campaign-planner');
      expect(phase3).toContain('video-generator-script');
    });

    it('should have Execution agents in Phase 4', () => {
      const phases = getWorkflowOrder();
      const phase4 = phases[3];

      expect(phase4).toContain('automation-specialist');
    });

    it('should not have overlapping agents across phases', () => {
      const phases = getWorkflowOrder();
      const allAgents = phases.flat();
      const uniqueAgents = new Set(allAgents);

      expect(allAgents.length).toBe(uniqueAgents.size);
    });
  });

  describe('Dependency Management', () => {
    it('should identify market-analyst as first (no dependencies)', () => {
      const marketAnalyst = responsibilityMatrices.find(
        m => m.agentId === 'market-analyst'
      );

      expect(marketAnalyst?.dependsOn.length).toBe(0);
    });

    it('should show business-planner depends on market-analyst', () => {
      const businessPlanner = responsibilityMatrices.find(
        m => m.agentId === 'business-planner'
      );

      expect(businessPlanner?.dependsOn.length).toBeGreaterThan(0);
      expect(businessPlanner?.dependsOn[0].agentId).toBe('market-analyst');
    });

    it('should show brand-builder depends on market-analyst and business-planner', () => {
      const brandBuilder = responsibilityMatrices.find(
        m => m.agentId === 'brand-builder'
      );

      const dependsOnIds = brandBuilder?.dependsOn.map(d => d.agentId) || [];

      expect(dependsOnIds).toContain('market-analyst');
      expect(dependsOnIds).toContain('business-planner');
    });

    it('should show design-agent depends on brand-builder', () => {
      const designAgent = responsibilityMatrices.find(
        m => m.agentId === 'design-agent'
      );

      const dependsOnIds = designAgent?.dependsOn.map(d => d.agentId) || [];

      expect(dependsOnIds).toContain('brand-builder');
    });

    it('should show campaign-planner depends on multiple agents', () => {
      const campaignPlanner = responsibilityMatrices.find(
        m => m.agentId === 'campaign-planner'
      );

      expect(campaignPlanner?.dependsOn.length).toBeGreaterThan(2);
    });

    it('should show automation-specialist depends on campaign-planner', () => {
      const automationSpecialist = responsibilityMatrices.find(
        m => m.agentId === 'automation-specialist'
      );

      const dependsOnIds = automationSpecialist?.dependsOn.map(d => d.agentId) || [];

      expect(dependsOnIds).toContain('campaign-planner');
    });
  });

  describe('Conflict Detection', () => {
    it('should define conflicts for each agent', () => {
      for (const matrix of responsibilityMatrices) {
        expect(matrix.conflictsWith).toBeDefined();
        expect(Array.isArray(matrix.conflictsWith)).toBe(true);
      }
    });

    it('should show market-analyst conflicts with business-planner', () => {
      const marketAnalyst = responsibilityMatrices.find(
        m => m.agentId === 'market-analyst'
      );

      const conflictIds = marketAnalyst?.conflictsWith.map(c => c.agentId) || [];

      expect(conflictIds).toContain('business-planner');
    });

    it('should show bidirectional conflicts', () => {
      const agent1 = responsibilityMatrices.find(
        m => m.agentId === 'market-analyst'
      );
      const agent2 = responsibilityMatrices.find(
        m => m.agentId === 'business-planner'
      );

      const agent1Conflicts = agent1?.conflictsWith.map(c => c.agentId) || [];
      const agent2Conflicts = agent2?.conflictsWith.map(c => c.agentId) || [];

      if (agent1Conflicts.includes('business-planner')) {
        expect(agent2Conflicts).toContain('market-analyst');
      }
    });

    it('should specify reason for each conflict', () => {
      for (const matrix of responsibilityMatrices) {
        for (const conflict of matrix.conflictsWith) {
          expect(conflict.reason).toBeDefined();
          expect(conflict.reason.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('validateDependencies Function', () => {
    it('should return ready=true when no dependencies', () => {
      const result = validateDependencies('market-analyst', []);

      expect(result.isReady).toBe(true);
      expect(result.missingDependencies.length).toBe(0);
    });

    it('should return ready=false when dependencies not completed', () => {
      const result = validateDependencies('business-planner', []);

      expect(result.isReady).toBe(false);
      expect(result.missingDependencies).toContain('market-analyst');
    });

    it('should return ready=true when all dependencies completed', () => {
      const result = validateDependencies('business-planner', ['market-analyst']);

      expect(result.isReady).toBe(true);
      expect(result.missingDependencies.length).toBe(0);
    });

    it('should list all missing dependencies', () => {
      const result = validateDependencies('campaign-planner', ['market-analyst']);

      expect(result.isReady).toBe(false);
      expect(result.missingDependencies.length).toBeGreaterThan(1);
    });

    it('should return false for non-existent agent', () => {
      const result = validateDependencies('non-existent-agent', []);

      expect(result.isReady).toBe(false);
      expect(result.missingDependencies).toContain('non-existent-agent');
    });
  });

  describe('Output Requirements', () => {
    it('should specify required inputs for each agent', () => {
      for (const matrix of responsibilityMatrices) {
        expect(matrix.requiredInputs.length).toBeGreaterThan(0);
      }
    });

    it('should specify expected outputs for each agent', () => {
      for (const matrix of responsibilityMatrices) {
        expect(matrix.expectedOutputs.length).toBeGreaterThan(0);
      }
    });

    it('should define success criteria for each agent', () => {
      for (const matrix of responsibilityMatrices) {
        expect(matrix.successCriteria.length).toBeGreaterThan(0);
      }
    });

    it('market-analyst should require specific inputs', () => {
      const marketAnalyst = responsibilityMatrices.find(
        m => m.agentId === 'market-analyst'
      );

      expect(marketAnalyst?.requiredInputs).toContain('Master Context (Product Info)');
      expect(marketAnalyst?.requiredInputs).toContain('Business Goals');
    });

    it('market-analyst should produce specific outputs', () => {
      const marketAnalyst = responsibilityMatrices.find(
        m => m.agentId === 'market-analyst'
      );

      const outputs = marketAnalyst?.expectedOutputs || [];

      expect(outputs.some(o => o.includes('SWOT'))).toBe(true);
      expect(outputs.some(o => o.includes('Competitor'))).toBe(true);
    });

    it('business-planner should have different outputs than market-analyst', () => {
      const marketAnalyst = responsibilityMatrices.find(
        m => m.agentId === 'market-analyst'
      );
      const businessPlanner = responsibilityMatrices.find(
        m => m.agentId === 'business-planner'
      );

      const analystOutputs = new Set(marketAnalyst?.expectedOutputs || []);
      const plannerOutputs = new Set(businessPlanner?.expectedOutputs || []);

      const intersection = Array.from(analystOutputs).filter(o =>
        plannerOutputs.has(o)
      );

      expect(intersection.length).toBe(0);
    });
  });

  describe('Cross-Team Collaboration', () => {
    it('should show strategy outputs required by creative agents', () => {
      const marketAnalyst = responsibilityMatrices.find(
        m => m.agentId === 'market-analyst'
      );
      const brandBuilder = responsibilityMatrices.find(
        m => m.agentId === 'brand-builder'
      );

      const requiredByIds = marketAnalyst?.requiredBy.map(r => r.agentId) || [];

      expect(requiredByIds).toContain('brand-builder');
    });

    it('should show creative outputs required by growth agents', () => {
      const brandBuilder = responsibilityMatrices.find(
        m => m.agentId === 'brand-builder'
      );
      const captionCreator = responsibilityMatrices.find(
        m => m.agentId === 'caption-creator'
      );

      const requiredByIds = brandBuilder?.requiredBy.map(r => r.agentId) || [];

      expect(requiredByIds).toContain('caption-creator');
    });

    it('should specify reason for each required-by relationship', () => {
      for (const matrix of responsibilityMatrices) {
        for (const required of matrix.requiredBy) {
          expect(required.reason).toBeDefined();
          expect(required.reason.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Phase Sequencing', () => {
    it('should have Strategy in Phase 1', () => {
      const strategyAgents = responsibilityMatrices.filter(
        m => m.cluster === 'strategy'
      );

      for (const agent of strategyAgents) {
        expect(agent.executionPhase).toBe(1);
      }
    });

    it('should have Creative in Phase 2', () => {
      const creativeAgents = responsibilityMatrices.filter(
        m => m.cluster === 'creative'
      );

      for (const agent of creativeAgents) {
        expect(agent.executionPhase).toBe(2);
      }
    });

    it('should have Growth Planning in Phase 3', () => {
      const growthPlanningAgents = responsibilityMatrices.filter(
        m => m.cluster === 'growth' && m.agentId !== 'automation-specialist'
      );

      for (const agent of growthPlanningAgents) {
        expect(agent.executionPhase).toBe(3);
      }
    });

    it('should have Execution in Phase 4', () => {
      const automationSpecialist = responsibilityMatrices.find(
        m => m.agentId === 'automation-specialist'
      );

      expect(automationSpecialist?.executionPhase).toBe(4);
    });
  });
});
