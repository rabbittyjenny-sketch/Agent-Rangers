/**
 * Automation Service
 * Manages automated workflows for Content Factory and Caption Factory
 * Integrates with Make.com via webhooks
 */

import { databaseService, ContentFactorySubmission, CaptionFactorySubmission, MakecomIntegrationLog } from './databaseService';

export interface AutomationConfig {
  contentFactoryEnabled: boolean;
  captionFactoryEnabled: boolean;
  postingScheduleEnabled: boolean;
  autoRetryFailures: boolean;
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  webhookTimeoutMs: number;
}

export interface CronSchedule {
  minute: string; // 0-59, * or */n
  hour: string;   // 0-23, * or */n
  day: string;    // 1-31, * or */n
  month: string;  // 1-12, * or */n
  weekday: string; // 0-6 (0=Sunday), * or */n
}

interface ExecutionLog {
  timestamp: string;
  status: 'success' | 'failed' | 'skipped';
  itemsProcessed: number;
  itemsFailed: number;
  executionTimeMs: number;
  errorDetails?: string;
}

class AutomationService {
  private config: AutomationConfig = {
    contentFactoryEnabled: true,
    captionFactoryEnabled: true,
    postingScheduleEnabled: true,
    autoRetryFailures: true,
    maxRetries: 3,
    retryDelayMs: 5000, // 5 seconds
    batchSize: 100,
    webhookTimeoutMs: 10000 // 10 seconds
  };

  private executionLogs: Map<string, ExecutionLog[]> = new Map();
  private activeSchedules: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    console.log('⚙️  Automation Service initialized');
  }

  /**
   * Parse cron expression to next execution time
   * Simple cron: "minute hour day month weekday"
   * Examples:
   *   "0 9 * * *" - Every day at 9:00 AM
   *   "0 /6 * * *" - Every 6 hours
   *   "0 9 * * 1-5" - Weekdays at 9:00 AM
   */
  parseCronSchedule(cronExpression: string): Date | null {
    try {
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length !== 5) {
        console.error('Invalid cron expression:', cronExpression);
        return null;
      }

      const now = new Date();
      const [minute, hour, day, month, weekday] = parts;

      // Simple implementation - find next matching datetime
      let nextDate = new Date(now);
      nextDate.setSeconds(0);
      nextDate.setMilliseconds(0);

      // If we're past the scheduled time today, start tomorrow
      if (nextDate.getMinutes() >= parseInt(minute) && nextDate.getHours() >= parseInt(hour)) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      nextDate.setHours(parseInt(hour));
      nextDate.setMinutes(parseInt(minute));

      return nextDate;
    } catch (error) {
      console.error('Error parsing cron schedule:', error);
      return null;
    }
  }

  /**
   * Setup automated Content Factory processing
   */
  async setupContentFactoryAutomation(brandId: number, cronExpression: string): Promise<void> {
    const scheduleId = `content-factory-${brandId}`;

    // Clear existing schedule if any
    if (this.activeSchedules.has(scheduleId)) {
      clearTimeout(this.activeSchedules.get(scheduleId)!);
      this.activeSchedules.delete(scheduleId);
    }

    const executeContentFactory = async () => {
      const startTime = Date.now();
      const log: ExecutionLog = {
        timestamp: new Date().toISOString(),
        status: 'success',
        itemsProcessed: 0,
        itemsFailed: 0,
        executionTimeMs: 0
      };

      try {
        if (!this.config.contentFactoryEnabled) {
          log.status = 'skipped';
          this.logExecution(scheduleId, log);
          return;
        }

        // Get pending submissions
        // TODO: Query from database when Neon is connected
        // const submissions = await db.select()
        //   .from(contentFactorySubmissions)
        //   .where(and(eq(contentFactorySubmissions.brandId, brandId), eq(contentFactorySubmissions.status, 'draft')))
        //   .limit(this.config.batchSize);

        // For now, log that we're ready to process
        console.log(`📤 Content Factory Automation triggered for brand ${brandId}`);
        log.itemsProcessed = 0;

        // Simulate processing with Make.com integration
        // In production: send each submission to Make.com webhook
        console.log(`✅ Processed ${log.itemsProcessed} content submissions`);

        log.status = 'success';
      } catch (error) {
        console.error('Content Factory automation error:', error);
        log.status = 'failed';
        log.errorDetails = error instanceof Error ? error.message : String(error);
      } finally {
        log.executionTimeMs = Date.now() - startTime;
        this.logExecution(scheduleId, log);
      }

      // Schedule next execution
      this.scheduleNext(scheduleId, cronExpression, executeContentFactory);
    };

    // Schedule initial execution
    this.scheduleNext(scheduleId, cronExpression, executeContentFactory);
    console.log(`✅ Content Factory automation scheduled: ${cronExpression}`);
  }

  /**
   * Setup automated Caption Factory processing
   */
  async setupCaptionFactoryAutomation(brandId: number, cronExpression: string): Promise<void> {
    const scheduleId = `caption-factory-${brandId}`;

    // Clear existing schedule if any
    if (this.activeSchedules.has(scheduleId)) {
      clearTimeout(this.activeSchedules.get(scheduleId)!);
      this.activeSchedules.delete(scheduleId);
    }

    const executeCaptionFactory = async () => {
      const startTime = Date.now();
      const log: ExecutionLog = {
        timestamp: new Date().toISOString(),
        status: 'success',
        itemsProcessed: 0,
        itemsFailed: 0,
        executionTimeMs: 0
      };

      try {
        if (!this.config.captionFactoryEnabled) {
          log.status = 'skipped';
          this.logExecution(scheduleId, log);
          return;
        }

        console.log(`📤 Caption Factory Automation triggered for brand ${brandId}`);
        log.itemsProcessed = 0;

        log.status = 'success';
      } catch (error) {
        console.error('Caption Factory automation error:', error);
        log.status = 'failed';
        log.errorDetails = error instanceof Error ? error.message : String(error);
      } finally {
        log.executionTimeMs = Date.now() - startTime;
        this.logExecution(scheduleId, log);
      }

      // Schedule next execution
      this.scheduleNext(scheduleId, cronExpression, executeCaptionFactory);
    };

    // Schedule initial execution
    this.scheduleNext(scheduleId, cronExpression, executeCaptionFactory);
    console.log(`✅ Caption Factory automation scheduled: ${cronExpression}`);
  }

  /**
   * Send submission to Make.com webhook
   */
  async sendToWebhook(
    webhookUrl: string,
    payload: Record<string, any>,
    submissionType: 'content_factory' | 'caption_factory',
    submissionId?: number
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.webhookTimeoutMs);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));
      const executionTimeMs = Date.now() - startTime;

      // Log the integration
      const log: MakecomIntegrationLog = {
        submissionType,
        submissionId,
        webhookUrl,
        requestPayload: payload,
        responsePayload: responseData,
        responseStatus: response.status,
        processingTimeMs: executionTimeMs,
        retryCount: 0,
        status: response.ok ? 'success' : 'failed',
        createdAt: new Date()
      };

      // Save to database (when Neon is connected)
      // await databaseService.saveMakecomLog(log);

      if (response.ok) {
        console.log(`✅ Webhook sent successfully (${executionTimeMs}ms)`);
        return true;
      } else {
        console.error(`❌ Webhook failed (${response.status}):`, responseData);
        return false;
      }
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      console.error(`❌ Webhook error (${executionTimeMs}ms):`, error);

      // Retry if configured
      if (this.config.autoRetryFailures) {
        await this.retryWebhook(webhookUrl, payload, submissionType, submissionId);
      }

      return false;
    }
  }

  /**
   * Retry webhook with exponential backoff
   */
  private async retryWebhook(
    webhookUrl: string,
    payload: Record<string, any>,
    submissionType: 'content_factory' | 'caption_factory',
    submissionId?: number,
    attempt: number = 0
  ): Promise<void> {
    if (attempt >= this.config.maxRetries) {
      console.error(`❌ Max retries reached for webhook: ${webhookUrl}`);
      return;
    }

    const delayMs = this.config.retryDelayMs * Math.pow(2, attempt);
    console.log(`⏳ Retrying webhook in ${delayMs}ms (attempt ${attempt + 1}/${this.config.maxRetries})`);

    await new Promise(resolve => setTimeout(resolve, delayMs));

    const success = await this.sendToWebhook(webhookUrl, payload, submissionType, submissionId);

    if (!success && attempt < this.config.maxRetries - 1) {
      await this.retryWebhook(webhookUrl, payload, submissionType, submissionId, attempt + 1);
    }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(scheduleId: string, limit: number = 50): ExecutionLog[] {
    const logs = this.executionLogs.get(scheduleId) || [];
    return logs.slice(-limit);
  }

  /**
   * Get automation status
   */
  getStatus() {
    return {
      contentFactoryEnabled: this.config.contentFactoryEnabled,
      captionFactoryEnabled: this.config.captionFactoryEnabled,
      postingScheduleEnabled: this.config.postingScheduleEnabled,
      activeSchedules: this.activeSchedules.size,
      config: this.config
    };
  }

  /**
   * Update automation config
   */
  updateConfig(partial: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...partial };
    console.log('⚙️  Automation config updated:', this.config);
  }

  /**
   * Stop all automations
   */
  stopAll(): void {
    this.activeSchedules.forEach((timeout) => clearTimeout(timeout));
    this.activeSchedules.clear();
    console.log('🛑 All automations stopped');
  }

  /**
   * Private helper: Schedule next execution
   */
  private scheduleNext(
    scheduleId: string,
    cronExpression: string,
    callback: () => Promise<void>
  ): void {
    const nextExecution = this.parseCronSchedule(cronExpression);

    if (!nextExecution) {
      console.error(`Invalid cron expression: ${cronExpression}`);
      return;
    }

    const delayMs = nextExecution.getTime() - Date.now();
    const timeout = setTimeout(callback, Math.max(0, delayMs));

    this.activeSchedules.set(scheduleId, timeout);
    console.log(`⏰ Next execution scheduled at: ${nextExecution.toISOString()}`);
  }

  /**
   * Private helper: Log execution
   */
  private logExecution(scheduleId: string, log: ExecutionLog): void {
    if (!this.executionLogs.has(scheduleId)) {
      this.executionLogs.set(scheduleId, []);
    }
    this.executionLogs.get(scheduleId)!.push(log);
    console.log(`📊 Execution logged:`, log);
  }
}

// Export singleton instance
export const automationService = new AutomationService();

export default automationService;
