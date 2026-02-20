/**
 * Caption Factory Service
 * Replaces Make.com integration with local/AI caption generation
 * Generates multiple caption styles based on image mood and user input
 */

import { databaseService, CaptionFactorySubmission } from './databaseService';

export interface GeneratedCaption {
  text: string;
  textTh?: string;
  hashtags: string[];
  engagement: string;
  analysis?: string;
}

export interface CaptionResult {
  styleLight: GeneratedCaption;
  styleMedium: GeneratedCaption;
  styleHeavy: GeneratedCaption;
  aiAnalysis: string;
  mood: string;
  multilingualLevel: number;
}

class CaptionFactoryService {
  /**
   * Generate captions based on image analysis and mood
   * This replaces the Make.com webhook functionality
   */
  async generateCaptions(
    imageBase64: string,
    mood: string,
    multilingualLevel: number,
    userWords?: string,
    checkIn?: string
  ): Promise<CaptionResult> {
    try {
      console.log('🎨 Generating captions for mood:', mood);

      // Determine caption style based on mood
      const moodTemplates = this.getMoodTemplates(mood);

      // Generate 3 caption styles
      const styleLight = this.generateStyle(
        moodTemplates,
        'light',
        multilingualLevel,
        userWords
      );

      const styleMedium = this.generateStyle(
        moodTemplates,
        'medium',
        multilingualLevel,
        userWords
      );

      const styleHeavy = this.generateStyle(
        moodTemplates,
        'heavy',
        multilingualLevel,
        userWords
      );

      // AI Analysis (mock - in production could use actual AI)
      const aiAnalysis = this.analyzeImage(mood, userWords, checkIn);

      return {
        styleLight,
        styleMedium,
        styleHeavy,
        aiAnalysis,
        mood,
        multilingualLevel
      };
    } catch (error) {
      console.error('Error generating captions:', error);
      throw error;
    }
  }

  /**
   * Save caption factory submission to database
   */
  async saveSubmission(
    lineUserId: string,
    displayName: string,
    imageData: string,
    mood: string,
    multilingualLevel: number,
    userWords?: string,
    checkIn?: string
  ): Promise<CaptionFactorySubmission> {
    const submission: CaptionFactorySubmission = {
      lineUserId,
      displayName,
      imageData,
      mimeType: 'image/jpeg',
      mood,
      userWords: userWords || '',
      multilingualLevel,
      status: 'submitted',
      makeWebhookUrl: '', // No longer using Make.com
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await databaseService.saveCaptionFactorySubmission(submission);
  }

  /**
   * Process and update submission with generated captions
   */
  async processSubmission(
    submissionId: number,
    captionResult: CaptionResult
  ): Promise<void> {
    const generatedCaption = {
      text: captionResult.styleLight.text,
      textTh: captionResult.styleLight.textTh,
      hashtags: captionResult.styleLight.hashtags,
      analysis: captionResult.aiAnalysis,
      styles: {
        light: captionResult.styleLight,
        medium: captionResult.styleMedium,
        heavy: captionResult.styleHeavy
      }
    };

    await databaseService.updateCaptionSubmissionStatus(
      submissionId,
      'completed',
      generatedCaption
    );
  }

  /**
   * Get mood-specific templates
   */
  private getMoodTemplates(mood: string): Record<string, string[]> {
    const templates: Record<string, Record<string, string[]>> = {
      VIBRANT: {
        light: [
          'ทีนี้สดใส ✨',
          'พลังบวก 💪',
          'มีชีวิตชีวา ⚡'
        ],
        medium: [
          'พาใจออกมา กับมุมมองใหม่ 🌟',
          'ความสดใสในแต่ละวินาที ✨',
          'พลังบวกที่สร้างสรรค์ 💫'
        ],
        heavy: [
          'นี่คือสีของชีวิต! ถูกสร้างมาให้เปล่งประกายแล้ว ✨',
          'ทุกช่วงเวลา ทุกสีสัน คือการเฉลิมฉลองตัวตน 🌈',
          'พลังบวก ความหลากหลาย และความสุข คือภาษาของเรา 🔥'
        ]
      },
      CALM: {
        light: [
          'ช่วงพักสงบ 🌊',
          'ใจเย็น 💙',
          'ประมาณนี้ก็ดี ☁️'
        ],
        medium: [
          'เมื่อทุกอย่างช้าลง เราจึงได้ยิน 🌿',
          'สมาธิในความเงียบ 🧘',
          'ปล่อยวาง และสมาธิ ✨'
        ],
        heavy: [
          'ในโลกที่วุ่นวาย เราหา ช่วงเวลาเงียบสงบสำหรับตัวเอง 🌊',
          'สมาธิไม่ใช่เพียงการนั่ง มันคือศิลปะแห่งการใช้ชีวิต 🧘‍♀️',
          'ความสงบอย่างลึกซึ้ง คือกำลังแห่งการเปลี่ยนแปลง 💎'
        ]
      },
      FUN: {
        light: [
          'สนุกไปเลย! 🎉',
          'ยิ้มไม่ไหวแล้ว 😄',
          'มีความสุข 🎊'
        ],
        medium: [
          'ชีวิตคือเรื่องเล่า เรามันมีสาระ! 🎭',
          'ความสุขคือการเลือก มาเลือกกันเถอะ! 🎪',
          'วันนี้มีเรื่องหนุกหนานเกิดขึ้น ✨'
        ],
        heavy: [
          'ความสนุกไม่ใช่หรูหรา มันคือการเลือกเห็นความดีในแต่ละช่วงเวลา 🎨',
          'เมื่อชีวิตเป็นการแสดง เรามีสิทธิ์เป็นตัวแสดงหลัก! 🌟',
          'ความสุขเหล่านั้น ทำให้ชีวิตกลายเป็นศิลปะชิ้นเอก 🎪'
        ]
      },
      LUXURY: {
        light: [
          'บิดตา ✨',
          'สวยงาม 👑',
          'หรูหรา 💎'
        ],
        medium: [
          'บางครั้ง ความหรูหรา คือการเลือก ไม่ใช่ราคา 👑',
          'คุณภาพ คือภาษาที่ชาวโลกพูดกัน ✨',
          'เมื่อรสนิยม พบกับประณีต 💫'
        ],
        heavy: [
          'ความหรูหรา ไม่มีสิ่งที่หรูหรากว่าการเลือกตัวตนของตัวเอง 👑💎',
          'ในโลกของความหรูหรา ความแตกต่างคือรสชาติ ✨🌟',
          'นี่คือศิลปะของการใช้ชีวิตอย่างประณีต มีคุณค่า และตั้งตรง 💫👑'
        ]
      },
      AESTHETIC: {
        light: [
          'สวยซึ่ง 🎨',
          'ศิลปะแห่งชีวิต 🖼️',
          'ความงาม ✨'
        ],
        medium: [
          'ศิลปะ ไม่ใช่เพียงสีสัน มันคือแบบที่เราเลือกมองชีวิต 🎭',
          'ความสุขคือการค้นหาความงามในสิ่งเล็กน้อย 🌸',
          'หากชีวิตเป็นแคนวาส เราคือศิลปิน 🎨'
        ],
        heavy: [
          'ศิลปะของชีวิต คือการสร้างความงามจากทุกช่วงเวลา ทุกลมหายใจ 🎨✨',
          'ความสวยงามที่แท้จริง มาจากการรักษาตัวตนของเรา ด้วยความปลื้ม 🌹',
          'นี่คือตัวตน บันทึกศิลปะของเราในชีวิตประจำวัน 🖼️💫'
        ]
      }
    };

    return templates[mood] || templates.VIBRANT;
  }

  /**
   * Generate caption with specific style
   */
  private generateStyle(
    templates: Record<string, string[]>,
    style: 'light' | 'medium' | 'heavy',
    multilingualLevel: number,
    userWords?: string
  ): GeneratedCaption {
    const baseTexts = templates[style] || templates.medium;
    const baseText = baseTexts[Math.floor(Math.random() * baseTexts.length)];

    // Add user words if provided
    let finalText = baseText;
    if (userWords) {
      finalText = `${baseText}\n\n${userWords}`;
    }

    // Adjust for multilingual level
    let additionalText = '';
    if (multilingualLevel > 33) {
      additionalText = '\n\n✨ สดใส งดงาม ประณีต';
    }
    if (multilingualLevel > 66) {
      additionalText += ' | Aesthetic, Beautiful, Refined';
    }

    finalText += additionalText;

    // Generate hashtags based on style and mood
    const hashtags = this.generateHashtags(style, multilingualLevel);

    // Estimate engagement
    const engagement = this.estimateEngagement(style);

    return {
      text: finalText,
      textTh: finalText, // Both are Thai for now
      hashtags,
      engagement,
      analysis: `Style: ${style} | Mood-matched caption with user preferences`
    };
  }

  /**
   * Generate relevant hashtags
   */
  private generateHashtags(style: string, multilingualLevel: number): string[] {
    const baseHashtags = [
      '#Aesthetic',
      '#DailyVibe',
      '#Mindfulness',
      '#LifeStyle',
      '#Moments',
      '#Inspiration'
    ];

    if (style === 'light') {
      return [...baseHashtags, '#Simple', '#SelfCare'];
    }

    if (style === 'heavy') {
      return [
        ...baseHashtags,
        '#DeepThoughts',
        '#SoulfulMoments',
        '#Wanderlust',
        '#Authentic',
        '#InnerBeauty'
      ];
    }

    return baseHashtags;
  }

  /**
   * Estimate engagement potential
   */
  private estimateEngagement(style: string): string {
    const baseScore = Math.random() * 100;
    const styleBoost = style === 'medium' ? 20 : style === 'light' ? 10 : 5;
    const score = Math.min(baseScore + styleBoost, 100);

    if (score >= 80) return 'Very High 🔥';
    if (score >= 60) return 'High 📈';
    if (score >= 40) return 'Good 👍';
    return 'Moderate 📊';
  }

  /**
   * Analyze image and provide AI insights (mock)
   */
  private analyzeImage(
    mood: string,
    userWords?: string,
    checkIn?: string
  ): string {
    const moodDescriptions: Record<string, string> = {
      VIBRANT: 'วิเคราะห์ภาพ: พบว่ามีพลังบวกและความสดใส จากสีสันที่ส่องแสง',
      CALM: 'วิเคราะห์ภาพ: บรรยากาศเงียบสงบและเต็มไปด้วยความสุข',
      FUN: 'วิเคราะห์ภาพ: พบพลังการสนุก และความร่าเริง',
      LUXURY: 'วิเคราะห์ภาพ: สัมผัสความหรูหรา ประณีต และน่าทึ่ง',
      AESTHETIC: 'วิเคราะห์ภาพ: ศิลปะของช่วงเวลา ความงาม และเอกลักษณ์'
    };

    let analysis = moodDescriptions[mood] || moodDescriptions.VIBRANT;

    if (checkIn) {
      analysis += ` ที่ ${checkIn}`;
    }

    if (userWords) {
      analysis += ` สะท้อนคำว่า "${userWords}"`;
    }

    return analysis + ' ✨';
  }
}

export const captionFactoryService = new CaptionFactoryService();

export default captionFactoryService;
