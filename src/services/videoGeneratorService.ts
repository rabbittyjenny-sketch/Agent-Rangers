/**
 * Video Generator Service
 * Orchestrates the video generation workflow:
 * 1. Read content from Google Sheets (Content_Log)
 * 2. Generate script using Claude API + Prompt_Library templates
 * 3. (Optional) Generate/upload video to YouTube
 * 4. Write results to Production_Log
 */

import { googleSheetsService, ContentLogEntry, ProductionLogEntry, PromptTemplate } from './googleSheetsService';
import { databaseService } from './databaseService';

export interface VideoGenerationInput {
  contentLogEntry: ContentLogEntry;
  promptTemplate: PromptTemplate;
}

export interface GeneratedScript {
  finalScript: string;
  hooks: string[];
  keyPoints: string[];
  cta: string;
  tone: string;
}

export interface VideoGenerationResult {
  contentId: string;
  finalScript: GeneratedScript;
  videoUrl: string;
  platform: string;
  status: 'completed' | 'failed';
  timestamp: string;
}

class VideoGeneratorService {
  /**
   * Main orchestration method
   * Processes content log entry and generates video script
   */
  async generateVideoContent(contentEntry: ContentLogEntry): Promise<VideoGenerationResult> {
    try {
      console.log('🎬 Starting video generation for:', contentEntry.itemId);

      // Step 1: Get prompt template for category
      const promptTemplate = await googleSheetsService.getPromptTemplate(contentEntry.category);
      if (!promptTemplate) {
        throw new Error(`No prompt template found for category: ${contentEntry.category}`);
      }

      // Step 2: Generate script using Claude API
      const generatedScript = await this.generateScriptWithClaude(
        contentEntry.rawText,
        promptTemplate
      );

      // Step 3: Generate/upload video (simulated for now)
      const videoUrl = await this.generateVideoUrl(
        contentEntry,
        generatedScript
      );

      // Step 4: Save to database
      await this.saveGenerationResult(contentEntry, generatedScript, videoUrl);

      // Step 5: Write to Production_Log
      await googleSheetsService.saveProductionLogEntry({
        timestampOut: new Date().toISOString(),
        mainCategory: contentEntry.mainCategory,
        userEmail: contentEntry.userEmail,
        category: contentEntry.category,
        finalScript: generatedScript.finalScript,
        videoResultUrl: videoUrl,
        status: 'completed'
      });

      // Step 6: Update status in Content_Log
      await googleSheetsService.updateEntryStatus(contentEntry.itemId, 'completed');

      const result: VideoGenerationResult = {
        contentId: contentEntry.itemId,
        finalScript: generatedScript,
        videoUrl,
        platform: contentEntry.platform,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      console.log('✅ Video generation completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Video generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate script using Claude API
   * Uses prompt template + raw content to create Final_Script
   */
  private async generateScriptWithClaude(
    rawText: string,
    promptTemplate: PromptTemplate
  ): Promise<GeneratedScript> {
    try {
      console.log('🤖 Generating script with Claude API...');

      // Build the prompt for Claude
      const systemPrompt = `You are a professional video script writer. Your task is to create engaging short-form video scripts.
Tone: ${promptTemplate.toneStyle}
Guidelines: ${promptTemplate.instructionPrompt}`;

      const userPrompt = `Create a compelling short video script based on this content:
"${rawText}"

Format your response as JSON with this structure:
{
  "hook": "attention-grabbing opening (1-2 sentences)",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "cta": "call-to-action statement",
  "fullScript": "complete script combining all elements"
}`;

      // Mock Claude API call (in production, would use real API)
      const scriptResponse = await this.mockClaudeApiCall(systemPrompt, userPrompt);

      // Parse response
      const parsedScript = this.parseScriptResponse(scriptResponse, rawText);

      console.log('📝 Script generated successfully');
      return parsedScript;
    } catch (error) {
      console.error('Error generating script with Claude:', error);
      throw error;
    }
  }

  /**
   * Mock Claude API call
   * In production, would call actual Claude API
   */
  private async mockClaudeApiCall(systemPrompt: string, userPrompt: string): Promise<string> {
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock response based on prompts
    const response = {
      hook: "ว่าแต่คุณรู้หรือเปล่า ว่าสิ่งเล็ก ๆ นี้มีพลังเปลี่ยนชีวิตได้! 🔥",
      keyPoints: [
        "🌟 ประเด็นแรก: การเข้าใจพื้นฐาน",
        "💪 ประเด็นที่สอง: การปฏิบัติจริง",
        "🎯 ประเด็นที่สาม: ผลลัพธ์ที่คาดหวัง"
      ],
      cta: "อยากรู้เพิ่มเติม? ไปดูคลิปเต็มของเรา! 👆",
      fullScript: "ว่าแต่คุณรู้หรือเปล่า ว่าสิ่งเล็ก ๆ นี้มีพลังเปลี่ยนชีวิตได้! 🔥\n\n📚 ในคลิปนี้เราจะแบ่งปัน 3 สิ่งสำคัญ:\n🌟 ประเด็นแรก: การเข้าใจพื้นฐาน\n💪 ประเด็นที่สอง: การปฏิบัติจริง\n🎯 ประเด็นที่สาม: ผลลัพธ์ที่คาดหวัง\n\nอยากรู้เพิ่มเติม? ไปดูคลิปเต็มของเรา! 👆"
    };

    return JSON.stringify(response);
  }

  /**
   * Parse Claude response into GeneratedScript structure
   */
  private parseScriptResponse(response: string, rawText: string): GeneratedScript {
    try {
      const parsed = JSON.parse(response);
      return {
        finalScript: parsed.fullScript || parsed.script || rawText,
        hooks: [parsed.hook] || [],
        keyPoints: parsed.keyPoints || [],
        cta: parsed.cta || 'Check our full video for more!',
        tone: 'Engaging & Educational'
      };
    } catch (error) {
      // Fallback if parsing fails
      console.warn('Could not parse script response, using raw text');
      return {
        finalScript: rawText,
        hooks: [],
        keyPoints: [],
        cta: 'Watch full video',
        tone: 'Standard'
      };
    }
  }

  /**
   * Generate video file and upload to YouTube
   * For now, returns mock YouTube URL
   * In production, would call YouTube API or Make.com webhook
   */
  private async generateVideoUrl(
    contentEntry: ContentLogEntry,
    generatedScript: GeneratedScript
  ): Promise<string> {
    try {
      console.log('📹 Generating video...');

      // Mock video generation
      // In production: call YouTube API or Make.com webhook to upload
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock YouTube URL
      const videoId = this.generateVideoId();
      const youtubeUrl = `https://youtu.be/${videoId}`;

      console.log('🎥 Video uploaded to YouTube:', youtubeUrl);
      return youtubeUrl;
    } catch (error) {
      console.error('Error generating/uploading video:', error);
      throw error;
    }
  }

  /**
   * Generate random video ID
   */
  private generateVideoId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < 11; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Save generation result to local database
   */
  private async saveGenerationResult(
    contentEntry: ContentLogEntry,
    generatedScript: GeneratedScript,
    videoUrl: string
  ): Promise<void> {
    try {
      const videoTask = {
        brandId: 1, // Default brand
        taskType: 'script' as const,
        videoTitle: contentEntry.itemId,
        scriptContent: generatedScript.finalScript,
        platform: contentEntry.platform,
        duration: '15-60s',
        status: 'completed' as const,
        videoUrl,
        generatedBy: 'VideoGeneratorService'
      };

      await databaseService.saveVideoTask(videoTask);
      console.log('💾 Generation result saved to database');
    } catch (error) {
      console.error('Error saving generation result:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Process all pending content entries
   */
  async processPendingContent(platform?: string): Promise<VideoGenerationResult[]> {
    try {
      console.log('🔄 Processing pending content entries...');

      let pendingEntries: ContentLogEntry[];

      if (platform) {
        pendingEntries = await googleSheetsService.getPendingEntriesByPlatform(platform);
      } else {
        // Get all pending entries
        const allEntries = await googleSheetsService.getContentLogEntries();
        pendingEntries = allEntries.filter(entry => entry.status === 'pending');
      }

      const results: VideoGenerationResult[] = [];

      for (const entry of pendingEntries) {
        try {
          const result = await this.generateVideoContent(entry);
          results.push(result);
        } catch (error) {
          console.error(`Failed to process entry ${entry.itemId}:`, error);
          // Continue with next entry
        }
      }

      console.log(`✅ Processed ${results.length} entries`);
      return results;
    } catch (error) {
      console.error('Error processing pending content:', error);
      throw error;
    }
  }

  /**
   * Get generation history
   */
  async getGenerationHistory(userEmail?: string): Promise<VideoGenerationResult[]> {
    try {
      // Get from database or Google Sheets
      if (userEmail) {
        const userEntries = await googleSheetsService.getEntriesByUser(userEmail);
        return userEntries
          .filter(entry => entry.status === 'completed')
          .map(entry => ({
            contentId: entry.itemId,
            finalScript: {
              finalScript: entry.rawText,
              hooks: [],
              keyPoints: [],
              cta: '',
              tone: ''
            },
            videoUrl: '', // Would get from Production_Log
            platform: entry.platform,
            status: 'completed' as const,
            timestamp: entry.timestampIn
          }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching generation history:', error);
      return [];
    }
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing VideoGeneratorService...');
      // Initialize Google Sheets service with sheet IDs
      googleSheetsService.initialize(
        71977369, // Content_Log sheet ID
        0, // Production_Log sheet ID (to be configured)
        0 // Prompt_Library sheet ID (to be configured)
      );
      console.log('✅ VideoGeneratorService initialized');
    } catch (error) {
      console.error('Error initializing VideoGeneratorService:', error);
      throw error;
    }
  }
}

export const videoGeneratorService = new VideoGeneratorService();

export default videoGeneratorService;
