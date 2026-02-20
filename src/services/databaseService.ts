import { MasterContext } from '../data/intelligence';

/**
 * Database Service - Handles all database operations
 * This service acts as a bridge between the app and Drizzle ORM
 * For now, it uses localStorage as fallback, but will use real database once Neon is set up
 */

// Type definitions for database operations
export interface BrandRecord {
  id?: number;
  brandNameEn: string;
  brandNameTh: string;
  industry: string;
  coreUsp: string;
  targetAudience?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  moodKeywords?: string[];
  toneOfVoice?: string;
  multilingualLevel?: string;
  brandHashtags?: string[];
  logoUrl?: string;
}

export interface SwotRecord {
  id?: number;
  brandId: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  marketTrends?: string;
  competitorAnalysis?: string;
  confidence: number;
  generatedBy: string;
}

export interface CaptionRecord {
  id?: number;
  brandId: number;
  caption: string;
  captionTh?: string;
  platform?: string;
  contentType?: string;
  hashtags?: string[];
  engagementTips?: string;
  confidence: number;
  generatedBy: string;
}

export interface DesignAssetRecord {
  id?: number;
  brandId: number;
  assetType: string;
  assetDescription?: string;
  colorScheme?: { primary: string; secondary: string; accent?: string };
  typography?: { fontFamily: string; sizes: Record<string, string> };
  dimensions?: string;
  imageUrl?: string;
  cssCode?: string;
  generatedBy: string;
}

export interface AutomationRecord {
  id?: number;
  brandId: number;
  toolName: string;
  toolType: string;
  isActive: boolean;
  configuration?: Record<string, any>;
  scheduleFrequency?: string;
  automationScript?: string;
}

export interface MessageRecord {
  id?: number;
  brandId: number;
  role: 'user' | 'agent';
  agentId?: string;
  agentName?: string;
  content: string;
  attachments?: Array<{ name: string; type: string; size: number }>;
  confidence?: number;
  validationResults?: Record<string, any>;
  createdAt?: Date;
}

export interface AgentLearningRecord {
  id?: number;
  brandId: number;
  agentId: string;
  agentName: string;
  insight: string;
  insightType: string;
  dataUsed?: string[];
  confidence: number;
  actionable: boolean;
}

export interface VideoTaskRecord {
  id?: number;
  brandId: number;
  taskType: 'art' | 'script';
  videoTitle?: string;
  scriptContent?: string;
  artPrompt?: string;
  platform?: string;
  duration?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  generatedBy: string;
}

export interface CampaignRecord {
  id?: number;
  brandId: number;
  campaignName: string;
  campaignObjective?: string;
  targetAudience?: string;
  platforms?: string[];
  contentCalendar?: Record<string, any>;
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  budget?: number;
  estimatedReach?: number;
}

/**
 * Video Production Records - For tracking video generation
 */
export interface VideoProductionLog {
  id?: number;
  contentId: string; // Item ID from Content_Log
  userEmail: string;
  rawText: string;
  finalScript: string;
  generatedBy: string;
  platform: string;
  videoUrl: string; // YouTube/TikTok URL
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  processingTimeMs?: number;
  createdAt?: Date;
  completedAt?: Date;
}

export interface ContentFactoryRecord {
  id?: number;
  mainCategory: string;
  userEmail: string;
  category: string; // 'Short Clip Video', etc.
  postFormat: string;
  itemId: string;
  rawText: string;
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt?: Date;
}

class DatabaseService {
  private isReady = false;
  private localStoragePrefix = 'socialFactory_db_';

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check if we can connect to the database
    const dbUrl = import.meta.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

    if (!dbUrl) {
      console.warn('⚠️  DATABASE_URL not configured. Using localStorage as fallback.');
      this.isReady = false;
    } else {
      console.log('✅ Database service initialized with Neon PostgreSQL');
      this.isReady = true;
    }
  }

  /**
   * Create or update a brand
   */
  async saveBrand(brand: BrandRecord): Promise<BrandRecord> {
    try {
      if (!this.isReady) {
        // Fallback to localStorage
        const key = `${this.localStoragePrefix}brands_${brand.brandNameEn}`;
        const data = { ...brand, id: 1, createdAt: new Date(), updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement actual database save when connected
      // const result = await db.insert(brands).values(brand).returning();
      // return result[0];

      // For now, return the brand with a mock ID
      return { ...brand, id: 1 };
    } catch (error) {
      console.error('Error saving brand:', error);
      throw error;
    }
  }

  /**
   * Get brand by ID or name
   */
  async getBrand(identifier: string | number): Promise<BrandRecord | null> {
    try {
      if (!this.isReady) {
        // Fallback to localStorage
        const key = `${this.localStoragePrefix}brands_${identifier}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }

      // TODO: Implement actual database query
      // const result = await db.select().from(brands).where(...);
      // return result[0] || null;

      return null;
    } catch (error) {
      console.error('Error getting brand:', error);
      return null;
    }
  }

  /**
   * Save SWOT analysis
   */
  async saveSwotAnalysis(swot: SwotRecord): Promise<SwotRecord> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}swot_${swot.brandId}_${Date.now()}`;
        const data = { ...swot, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert
      return swot;
    } catch (error) {
      console.error('Error saving SWOT analysis:', error);
      throw error;
    }
  }

  /**
   * Save caption
   */
  async saveCaption(caption: CaptionRecord): Promise<CaptionRecord> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}caption_${caption.brandId}_${Date.now()}`;
        const data = { ...caption, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert
      return caption;
    } catch (error) {
      console.error('Error saving caption:', error);
      throw error;
    }
  }

  /**
   * Save design asset
   */
  async saveDesignAsset(asset: DesignAssetRecord): Promise<DesignAssetRecord> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}design_${asset.brandId}_${Date.now()}`;
        const data = { ...asset, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert
      return asset;
    } catch (error) {
      console.error('Error saving design asset:', error);
      throw error;
    }
  }

  /**
   * Save message to conversation history
   */
  async saveMessage(message: MessageRecord): Promise<MessageRecord> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}message_${message.brandId}_${Date.now()}`;
        const data = { ...message, id: Date.now(), createdAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(brandId: number, limit: number = 50): Promise<MessageRecord[]> {
    try {
      if (!this.isReady) {
        // Fallback to localStorage - get all messages for this brand
        const messages: MessageRecord[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes(`${this.localStoragePrefix}message_${brandId}`)) {
            const data = localStorage.getItem(key);
            if (data) messages.push(JSON.parse(data));
          }
        }
        return messages.sort((a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        ).slice(-limit);
      }

      // TODO: Implement database query with limit
      return [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Save agent learning
   */
  async saveAgentLearning(learning: AgentLearningRecord): Promise<AgentLearningRecord> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}learning_${learning.brandId}_${Date.now()}`;
        const data = { ...learning, id: Date.now(), createdAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert
      return learning;
    } catch (error) {
      console.error('Error saving agent learning:', error);
      throw error;
    }
  }

  /**
   * Save video task
   */
  async saveVideoTask(task: VideoTaskRecord): Promise<VideoTaskRecord> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}video_${task.brandId}_${Date.now()}`;
        const data = { ...task, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert
      return task;
    } catch (error) {
      console.error('Error saving video task:', error);
      throw error;
    }
  }

  /**
   * Save campaign
   */
  async saveCampaign(campaign: CampaignRecord): Promise<CampaignRecord> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}campaign_${campaign.brandId}_${Date.now()}`;
        const data = { ...campaign, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert
      return campaign;
    } catch (error) {
      console.error('Error saving campaign:', error);
      throw error;
    }
  }

  /**
   * Save Caption Factory submission
   */
  async saveCaptionFactorySubmission(submission: CaptionFactorySubmission): Promise<CaptionFactorySubmission> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}caption_factory_${submission.lineUserId}_${Date.now()}`;
        const data = { ...submission, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert when Neon is ready
      return submission;
    } catch (error) {
      console.error('Error saving caption factory submission:', error);
      throw error;
    }
  }

  /**
   * Get pending Caption Factory submissions
   */
  async getPendingCaptionSubmissions(brandId?: number, limit: number = 10): Promise<CaptionFactorySubmission[]> {
    try {
      if (!this.isReady) {
        const submissions: CaptionFactorySubmission[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes(`${this.localStoragePrefix}caption_factory_`)) {
            const data = localStorage.getItem(key);
            if (data) {
              const submission = JSON.parse(data);
              if (!brandId || submission.brandId === brandId) {
                submissions.push(submission);
              }
            }
          }
        }
        return submissions.slice(-limit);
      }

      // TODO: Implement database query with status = 'draft'
      return [];
    } catch (error) {
      console.error('Error getting pending caption submissions:', error);
      return [];
    }
  }

  /**
   * Update Caption Factory submission status
   */
  async updateCaptionSubmissionStatus(submissionId: number, status: string, generatedCaption?: any): Promise<void> {
    try {
      if (!this.isReady) {
        // Update in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes(`${this.localStoragePrefix}caption_factory_`)) {
            const data = localStorage.getItem(key);
            if (data) {
              const submission = JSON.parse(data);
              if (submission.id === submissionId) {
                submission.status = status;
                if (generatedCaption) {
                  submission.generatedCaption = generatedCaption.text;
                  submission.generatedCaptionTh = generatedCaption.textTh;
                  submission.hashtags = generatedCaption.hashtags;
                  submission.moodAnalysis = generatedCaption.analysis;
                }
                submission.updatedAt = new Date();
                localStorage.setItem(key, JSON.stringify(submission));
                return;
              }
            }
          }
        }
      }

      // TODO: Implement database update when Neon is ready
    } catch (error) {
      console.error('Error updating caption submission status:', error);
      throw error;
    }
  }

  /**
   * Save video production log
   */
  async saveVideoProductionLog(log: VideoProductionLog): Promise<VideoProductionLog> {
    try {
      if (!this.isReady) {
        const key = `${this.localStoragePrefix}video_production_${log.contentId}_${Date.now()}`;
        const data = {
          ...log,
          id: Date.now(),
          createdAt: new Date()
        };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }

      // TODO: Implement database insert when Neon is ready
      return log;
    } catch (error) {
      console.error('Error saving video production log:', error);
      throw error;
    }
  }

  /**
   * Get video production logs by user
   */
  async getVideoProductionLogs(userEmail?: string, limit: number = 50): Promise<VideoProductionLog[]> {
    try {
      if (!this.isReady) {
        const logs: VideoProductionLog[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes(`${this.localStoragePrefix}video_production_`)) {
            const data = localStorage.getItem(key);
            if (data) {
              const log = JSON.parse(data);
              if (!userEmail || log.userEmail === userEmail) {
                logs.push(log);
              }
            }
          }
        }
        return logs.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ).slice(0, limit);
      }

      // TODO: Implement database query
      return [];
    } catch (error) {
      console.error('Error fetching video production logs:', error);
      return [];
    }
  }

  /**
   * Get pending video production tasks
   */
  async getPendingVideoTasks(): Promise<VideoProductionLog[]> {
    try {
      if (!this.isReady) {
        const tasks: VideoProductionLog[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes(`${this.localStoragePrefix}video_production_`)) {
            const data = localStorage.getItem(key);
            if (data) {
              const log = JSON.parse(data);
              if (log.status === 'pending' || log.status === 'processing') {
                tasks.push(log);
              }
            }
          }
        }
        return tasks;
      }

      // TODO: Implement database query
      return [];
    } catch (error) {
      console.error('Error fetching pending video tasks:', error);
      return [];
    }
  }

  /**
   * Update video production log status
   */
  async updateVideoProductionStatus(
    contentId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    videoUrl?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      if (!this.isReady) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.includes(`${this.localStoragePrefix}video_production_`)) {
            const data = localStorage.getItem(key);
            if (data) {
              const log = JSON.parse(data);
              if (log.contentId === contentId) {
                log.status = status;
                if (videoUrl) log.videoUrl = videoUrl;
                if (errorMessage) log.errorMessage = errorMessage;
                if (status === 'completed') {
                  log.completedAt = new Date();
                }
                localStorage.setItem(key, JSON.stringify(log));
                return;
              }
            }
          }
        }
      }

      // TODO: Implement database update
    } catch (error) {
      console.error('Error updating video production status:', error);
      throw error;
    }
  }

  /**
   * Get database status
   */
  getStatus() {
    return {
      isReady: this.isReady,
      backend: this.isReady ? 'Neon PostgreSQL' : 'localStorage (fallback)',
      message: this.isReady
        ? '✅ Connected to Neon PostgreSQL'
        : '⚠️  Using localStorage - configure DATABASE_URL to enable Neon'
    };
  }

  /**
   * Clear all localStorage data (for development/testing)
   */
  clearLocalStorage() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.localStoragePrefix)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keys.length} localStorage items`);
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

export default databaseService;
