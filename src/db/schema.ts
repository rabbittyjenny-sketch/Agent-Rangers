import { pgTable, text, serial, timestamp, boolean, integer, jsonb, varchar } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

// Brands Table - Core brand information
export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  brandNameEn: varchar('brand_name_en', { length: 255 }).notNull(),
  brandNameTh: varchar('brand_name_th', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 255 }).notNull(),
  coreUsp: text('core_usp').notNull(),
  targetAudience: text('target_audience'),
  primaryColor: varchar('primary_color', { length: 7 }),
  secondaryColor: varchar('secondary_color', { length: 7 }),
  fontFamily: varchar('font_family', { length: 255 }),
  moodKeywords: jsonb('mood_keywords'), // Array of mood keywords
  toneOfVoice: varchar('tone_of_voice', { length: 255 }),
  multilingualLevel: varchar('multilingual_level', { length: 50 }), // EN-only, EN-TH mix, TH-primary
  brandHashtags: jsonb('brand_hashtags'), // Array of hashtags
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Brand = InferSelectModel<typeof brands>;

// SWOT Analyses Table - Market analysis outputs
export const swotAnalyses = pgTable('swot_analyses', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  strengths: jsonb('strengths'), // Array of strings
  weaknesses: jsonb('weaknesses'),
  opportunities: jsonb('opportunities'),
  threats: jsonb('threats'),
  marketTrends: text('market_trends'),
  competitorAnalysis: text('competitor_analysis'),
  confidence: integer('confidence'), // 0-100 percentage
  generatedBy: varchar('generated_by', { length: 100 }), // Agent name
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type SwotAnalysis = InferSelectModel<typeof swotAnalyses>;

// Captions Table - Generated social media captions
export const captions = pgTable('captions', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  caption: text('caption').notNull(),
  captionTh: text('caption_th'), // Thai version if multilingual
  platform: varchar('platform', { length: 50 }), // Instagram, TikTok, Facebook, etc.
  contentType: varchar('content_type', { length: 100 }), // Product launch, Behind-the-scenes, etc.
  hashtags: jsonb('hashtags'), // Array of hashtags
  engagementTips: text('engagement_tips'),
  confidence: integer('confidence'),
  generatedBy: varchar('generated_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Caption = InferSelectModel<typeof captions>;

// Design Assets Table - Design outputs and specifications
export const designAssets = pgTable('design_assets', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  assetType: varchar('asset_type', { length: 100 }), // Logo, Banner, Social Card, etc.
  assetDescription: text('asset_description'),
  colorScheme: jsonb('color_scheme'), // Object with primary, secondary, accent colors
  typography: jsonb('typography'), // Object with font families and sizes
  dimensions: varchar('dimensions', { length: 50 }), // e.g., "1200x630"
  imageUrl: text('image_url'),
  cssCode: text('css_code'), // CSS for styling
  generatedBy: varchar('generated_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type DesignAsset = InferSelectModel<typeof designAssets>;

// Automated Tools Table - Automation and scheduling data
export const automatedTools = pgTable('automated_tools', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  toolName: varchar('tool_name', { length: 255 }).notNull(),
  toolType: varchar('tool_type', { length: 100 }), // Scheduler, Analytics, Content Generator, etc.
  isActive: boolean('is_active').default(true),
  configuration: jsonb('configuration'), // Tool-specific settings
  scheduleFrequency: varchar('schedule_frequency', { length: 50 }), // Daily, Weekly, Monthly
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  automationScript: text('automation_script'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type AutomatedTool = InferSelectModel<typeof automatedTools>;

// Chat Messages Table - Conversation history
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'agent'
  agentId: varchar('agent_id', { length: 100 }),
  agentName: varchar('agent_name', { length: 255 }),
  content: text('content').notNull(),
  attachments: jsonb('attachments'), // Array of file metadata
  confidence: integer('confidence'),
  validationResults: jsonb('validation_results'), // Anti-copycat, USP grounding, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Message = InferSelectModel<typeof messages>;

// Agent Learnings Table - Agent insights and improvements
export const agentLearnings = pgTable('agent_learnings', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  agentId: varchar('agent_id', { length: 100 }).notNull(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  insight: text('insight').notNull(),
  insightType: varchar('insight_type', { length: 100 }), // Trend, Recommendation, Warning, etc.
  dataUsed: jsonb('data_used'), // Which fields from brand data were used
  confidence: integer('confidence'),
  actionable: boolean('actionable').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AgentLearning = InferSelectModel<typeof agentLearnings>;

// Video Generation Tasks Table - For video generation outputs
export const videoTasks = pgTable('video_tasks', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  taskType: varchar('task_type', { length: 100 }), // 'art', 'script'
  videoTitle: varchar('video_title', { length: 255 }),
  scriptContent: text('script_content'),
  artPrompt: text('art_prompt'),
  platform: varchar('platform', { length: 50 }), // Instagram, TikTok, YouTube
  duration: varchar('duration', { length: 20 }), // e.g., "15s", "60s"
  status: varchar('status', { length: 50 }).default('pending'), // pending, processing, completed, failed
  videoUrl: text('video_url'),
  generatedBy: varchar('generated_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type VideoTask = InferSelectModel<typeof videoTasks>;

// Campaign Schedules Table - Campaign planning and execution
export const campaignSchedules = pgTable('campaign_schedules', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  campaignName: varchar('campaign_name', { length: 255 }).notNull(),
  campaignObjective: text('campaign_objective'),
  targetAudience: text('target_audience'),
  platforms: jsonb('platforms'), // Array of platform names
  contentCalendar: jsonb('content_calendar'), // Schedule of posts
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 50 }).default('draft'), // draft, scheduled, active, completed
  budget: integer('budget'), // Budget in cents or base units
  estimatedReach: integer('estimated_reach'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CampaignSchedule = InferSelectModel<typeof campaignSchedules>;

// ============================================================================
// CONTENT FACTORY TABLES - Knowledge & Sales Content Generation System
// ============================================================================

// Content Factory Submissions - Store content creation requests
export const contentFactorySubmissions = pgTable('content_factory_submissions', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  mainCategory: varchar('main_category', { length: 255 }).notNull(), // e.g., "The Lean Billionaire Factory"
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'knowledge' or 'sales'
  postFormat: varchar('post_format', { length: 100 }), // Short Clip Video, Photo, Info Graphic, etc.
  itemId: varchar('item_id', { length: 255 }), // Card name for knowledge content
  platform: varchar('platform', { length: 50 }).notNull(), // TikTok, Facebook, Instagram, YouTube, etc.
  rawText: text('raw_text'), // Content details or product description
  fileAsset: text('file_asset'), // Image file path/URL (uploaded)
  mimeType: varchar('mime_type', { length: 100 }), // image/jpeg, image/png, etc.
  status: varchar('status', { length: 50 }).default('draft'), // draft, submitted, processing, completed, failed
  makeWebhookUrl: text('make_webhook_url'), // Make.com webhook for processing
  makeWebhookResponse: jsonb('make_webhook_response'), // Response from Make.com
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ContentFactorySubmission = InferSelectModel<typeof contentFactorySubmissions>;

// ============================================================================
// CAPTION FACTORY TABLES - AI Caption Generation from Images
// ============================================================================

// Caption Factory Submissions - Store caption generation requests
export const captionFactorySubmissions = pgTable('caption_factory_submissions', {
  id: serial('id').primaryKey(),
  lineUserId: varchar('line_user_id', { length: 255 }).notNull(), // LINE User ID from LIFF
  displayName: varchar('display_name', { length: 255 }), // LINE profile name
  lineProfileImage: text('line_profile_image'), // LINE profile image URL
  imageData: text('image_data'), // Image in Base64 format
  mimeType: varchar('mime_type', { length: 100 }), // image/jpeg, image/png, etc.
  mood: varchar('mood', { length: 50 }), // VIBRANT, CALM, FUN, LUXURY, AESTHETIC, etc.
  userWords: text('user_words'), // Optional additional context from user
  multilingualLevel: integer('multilingual_level'), // 0-100 percentage (language mix)
  status: varchar('status', { length: 50 }).default('draft'), // draft, submitted, processing, completed, failed
  generatedCaption: text('generated_caption'), // AI-generated caption
  generatedCaptionTh: text('generated_caption_th'), // Thai version if multilingual
  hashtags: jsonb('hashtags'), // Generated hashtags
  moodAnalysis: jsonb('mood_analysis'), // AI analysis of mood and tone
  makeWebhookUrl: text('make_webhook_url'), // Make.com webhook for processing
  makeWebhookResponse: jsonb('make_webhook_response'), // Response from Make.com
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CaptionFactorySubmission = InferSelectModel<typeof captionFactorySubmissions>;

// Make.com Integration Logs - Track all webhook interactions
export const makecomIntegrationLogs = pgTable('makecom_integration_logs', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  submissionType: varchar('submission_type', { length: 50 }).notNull(), // 'content_factory' or 'caption_factory'
  submissionId: integer('submission_id'), // Foreign key to either table
  webhookUrl: text('webhook_url').notNull(),
  requestPayload: jsonb('request_payload'), // What we sent to Make.com
  responsePayload: jsonb('response_payload'), // What Make.com returned
  responseStatus: integer('response_status'), // HTTP status code (200, 400, 500, etc.)
  errorMessage: text('error_message'), // If failed, the error details
  processingTimeMs: integer('processing_time_ms'), // How long Make.com took
  retryCount: integer('retry_count').default(0),
  status: varchar('status', { length: 50 }).notNull(), // 'success' or 'failed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type MakecomIntegrationLog = InferSelectModel<typeof makecomIntegrationLogs>;

// Automation Schedules - For Automation Specialist agent
export const automationSchedules = pgTable('automation_schedules', {
  id: serial('id').primaryKey(),
  brandId: integer('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  automationName: varchar('automation_name', { length: 255 }).notNull(),
  automationType: varchar('automation_type', { length: 100 }), // 'content_factory', 'caption_factory', 'post_scheduling'
  isActive: boolean('is_active').default(true),
  schedule: varchar('schedule', { length: 100 }), // 'daily', 'weekly', 'custom cron'
  cronExpression: varchar('cron_expression', { length: 255 }), // e.g., "0 9 * * 1-5" (9am weekdays)
  linkedContentFactories: jsonb('linked_content_factories'), // Array of content_factory_ids
  linkedCaptionFactories: jsonb('linked_caption_factories'), // Array of caption_factory_ids
  automationConfig: jsonb('automation_config'), // Settings specific to this automation
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  executionLogs: jsonb('execution_logs'), // Array of execution records
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type AutomationSchedule = InferSelectModel<typeof automationSchedules>;
