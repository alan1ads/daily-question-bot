require('dotenv').config();

const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    channelId: process.env.SLACK_CHANNEL_ID
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  schedule: {
    questionTime: process.env.QUESTION_TIME || '9:00',
    timezone: 'America/New_York' // Eastern Time
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  }
};

// Validate required configuration
const validateConfig = () => {
  const missingVars = [];
  
  if (!config.slack.botToken) missingVars.push('SLACK_BOT_TOKEN');
  if (!config.slack.signingSecret) missingVars.push('SLACK_SIGNING_SECRET');
  if (!config.slack.appToken) missingVars.push('SLACK_APP_TOKEN');
  if (!config.slack.channelId) missingVars.push('SLACK_CHANNEL_ID');
  if (!config.openai.apiKey) missingVars.push('OPENAI_API_KEY');
  if (!config.supabase.url) missingVars.push('SUPABASE_URL');
  if (!config.supabase.key) missingVars.push('SUPABASE_KEY');
  
  if (missingVars.length > 0) {
    console.error('Error: Missing required environment variables:');
    missingVars.forEach(variable => console.error(`- ${variable}`));
    console.error('\nPlease run "npm run setup" to configure these variables.');
    process.exit(1);
  }
};

// Only validate in production to make development easier
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}

module.exports = config; 