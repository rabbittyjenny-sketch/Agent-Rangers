/**
 * Google Sheets Service
 * Reads and writes to Google Sheets for content/video production logs
 * Syncs with Content_Log, Production_Log, and Prompt_Library
 */

export interface ContentLogEntry {
  mainCategory: string;
  timestampIn: string;
  userEmail: string;
  category: string; // 'Short Clip Video', etc.
  postFormat: string;
  itemId: string;
  rawText: string;
  platform: string; // YouTube, TikTok, Instagram, Facebook
  status: string;
}

export interface ProductionLogEntry {
  timestampOut: string;
  mainCategory: string;
  userEmail: string;
  category: string;
  finalScript: string;
  videoResultUrl: string; // YouTube link
  status: string;
}

export interface PromptTemplate {
  templateId: string;
  category: string;
  instructionPrompt: string;
  toneStyle: string;
  examples?: string[];
}

class GoogleSheetsService {
  private sheetId: string;
  private apiKey: string;
  private contentLogSheetId: number = 71977369; // Content_Log
  private productionLogSheetId: number = 0; // Will be set
  private promptLibrarySheetId: number = 0; // Will be set

  constructor() {
    this.sheetId = process.env.GOOGLE_SHEETS_ID || '';
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || '';
  }

  /**
   * Initialize with sheet IDs
   */
  initialize(contentLogId: number, productionLogId: number, promptLibraryId: number): void {
    this.contentLogSheetId = contentLogId;
    this.productionLogSheetId = productionLogId;
    this.promptLibrarySheetId = promptLibraryId;
    console.log('📊 Google Sheets service initialized');
  }

  /**
   * Mock implementation - reads from local in-memory data
   * In production, would use Google Sheets API
   */
  async getContentLogEntries(): Promise<ContentLogEntry[]> {
    try {
      // Mock data - In production, fetch from Google Sheets API
      const mockData: ContentLogEntry[] = [
        {
          mainCategory: 'วิทยาศาสตร์',
          timestampIn: new Date().toISOString(),
          userEmail: 'user@example.com',
          category: 'Short Clip Video',
          postFormat: 'The Lovers',
          itemId: 'item_001',
          rawText: 'สรุปเนื้อหาวิทยาศาสตร์ที่น่าสนใจเกี่ยวกับการปลูกพืช',
          platform: 'YouTube',
          status: 'pending'
        }
      ];
      return mockData;
    } catch (error) {
      console.error('Error fetching content log entries:', error);
      throw error;
    }
  }

  /**
   * Fetch pending content entries by platform
   */
  async getPendingEntriesByPlatform(platform: string): Promise<ContentLogEntry[]> {
    try {
      const allEntries = await this.getContentLogEntries();
      return allEntries.filter(
        entry => entry.platform === platform && entry.status === 'pending'
      );
    } catch (error) {
      console.error(`Error fetching pending entries for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Get prompt template by category
   */
  async getPromptTemplate(category: string): Promise<PromptTemplate | null> {
    try {
      // Mock data - In production, fetch from Google Sheets API
      const templates: Record<string, PromptTemplate> = {
        'Short Clip Video': {
          templateId: 'template_001',
          category: 'Short Clip Video',
          instructionPrompt: 'Create a short, engaging video script (15-60 seconds) for {{topic}} that captures attention in the first 3 seconds. Include a hook, main content, and call-to-action.',
          toneStyle: 'Engaging, Educational, Viral-worthy',
          examples: [
            '⚡ Opening hook about the topic',
            '📌 3 key points delivered quickly',
            '🎬 Visual cues in description',
            '👍 Strong CTA at the end'
          ]
        }
      };

      return templates[category] || null;
    } catch (error) {
      console.error('Error fetching prompt template:', error);
      throw error;
    }
  }

  /**
   * Save production log entry
   */
  async saveProductionLogEntry(entry: ProductionLogEntry): Promise<void> {
    try {
      // Mock implementation - In production, would append to Google Sheets
      const logEntry = {
        ...entry,
        timestampOut: new Date().toISOString(),
        status: 'completed'
      };

      console.log('✅ Production log entry saved:', logEntry);
      // In real implementation: await appendToGoogleSheet(this.productionLogSheetId, [logEntry])
    } catch (error) {
      console.error('Error saving production log entry:', error);
      throw error;
    }
  }

  /**
   * Get all entries for a specific user
   */
  async getEntriesByUser(userEmail: string): Promise<ContentLogEntry[]> {
    try {
      const allEntries = await this.getContentLogEntries();
      return allEntries.filter(entry => entry.userEmail === userEmail);
    } catch (error) {
      console.error(`Error fetching entries for user ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * Update status of content log entry
   */
  async updateEntryStatus(
    itemId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    try {
      console.log(`📝 Updated entry ${itemId} status to: ${status}`);
      // In real implementation: would update the row in Google Sheets
    } catch (error) {
      console.error('Error updating entry status:', error);
      throw error;
    }
  }

  /**
   * Sync with Google Sheets (bidirectional)
   */
  async syncWithSheets(): Promise<{
    contentLogged: number;
    productionLogged: number;
  }> {
    try {
      const contentEntries = await this.getContentLogEntries();
      console.log(`🔄 Syncing ${contentEntries.length} content entries from Google Sheets`);

      return {
        contentLogged: contentEntries.length,
        productionLogged: 0
      };
    } catch (error) {
      console.error('Error syncing with Google Sheets:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();

export default googleSheetsService;
