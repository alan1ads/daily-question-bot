const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to .env file
const envPath = path.join(__dirname, '.env');

// Template for .env file
const envTemplate = `# Slack Configuration
SLACK_BOT_TOKEN=xoxb-
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=xapp-
SLACK_CHANNEL_ID=

# OpenAI Configuration
OPENAI_API_KEY=

# Bot Configuration
QUESTION_TIME=9:00 # Time to send the daily question (24-hour format in EST)

# Supabase Configuration
SUPABASE_URL=
SUPABASE_KEY=

# Similarity Detection Configuration
SIMILARITY_THRESHOLD=0.85 # Value between 0-1, higher = more strict (require more similarity to detect as duplicate)
EMBEDDING_MODEL=text-embedding-3-small # OpenAI embedding model to use
MIN_QUESTIONS_FOR_CHECK=5 # Minimum number of past questions required before enabling similarity checks
`;

// Questions to ask
const questions = [
  {
    prompt: 'Enter your Slack Bot Token (starts with xoxb-):',
    key: 'SLACK_BOT_TOKEN'
  },
  {
    prompt: 'Enter your Slack Signing Secret:',
    key: 'SLACK_SIGNING_SECRET'
  },
  {
    prompt: 'Enter your Slack App Token (starts with xapp-):',
    key: 'SLACK_APP_TOKEN'
  },
  {
    prompt: 'Enter your Slack Channel ID (where questions will be posted):',
    key: 'SLACK_CHANNEL_ID'
  },
  {
    prompt: 'Enter your OpenAI API Key:',
    key: 'OPENAI_API_KEY'
  },
  {
    prompt: 'Enter the time to send the daily question (24-hour format, default 9:00):',
    key: 'QUESTION_TIME',
    default: '9:00'
  },
  {
    prompt: 'Enter your Supabase URL:',
    key: 'SUPABASE_URL'
  },
  {
    prompt: 'Enter your Supabase Anon Key:',
    key: 'SUPABASE_KEY'
  },
  {
    prompt: 'Enter similarity threshold for duplicate detection (0-1, higher is more strict, default 0.85):',
    key: 'SIMILARITY_THRESHOLD',
    default: '0.85'
  },
  {
    prompt: 'Enter OpenAI embedding model to use (default text-embedding-3-small):',
    key: 'EMBEDDING_MODEL',
    default: 'text-embedding-3-small'
  },
  {
    prompt: 'Enter minimum questions required before similarity check (default 5):',
    key: 'MIN_QUESTIONS_FOR_CHECK',
    default: '5'
  }
];

console.log('Daily Question Bot Setup');
console.log('------------------------');
console.log('This script will help you set up your environment variables.');
console.log('These credentials will be stored in a .env file locally.\n');

// Check if .env file exists and create it if it doesn't
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envTemplate);
  console.log('Created .env file with template values.\n');
} else {
  console.log('Found existing .env file.\n');
}

// Load current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Function to ask questions sequentially
function askQuestions(questionIndex = 0) {
  if (questionIndex >= questions.length) {
    // All questions answered
    console.log('\nSetup complete! Your .env file has been updated.');
    console.log('You can now run the bot with: npm start\n');
    rl.close();
    return;
  }

  const question = questions[questionIndex];
  
  // Extract current value from .env file if exists
  const regex = new RegExp(`${question.key}=(.*)`, 'g');
  const match = regex.exec(envContent);
  const currentValue = match ? match[1].trim() : '';
  
  // Show default or current value in the prompt
  let defaultDisplay = '';
  if (currentValue && currentValue !== question.key && !currentValue.includes('your-')) {
    defaultDisplay = ` (current: ${currentValue})`;
  } else if (question.default) {
    defaultDisplay = ` (default: ${question.default})`;
  }

  rl.question(`${question.prompt}${defaultDisplay}: `, (answer) => {
    // Use entered value, or keep current value if empty, or use default if provided
    let value = answer.trim();
    
    if (!value) {
      if (currentValue && currentValue !== question.key && !currentValue.includes('your-')) {
        value = currentValue;
        console.log(`Using existing value for ${question.key}`);
      } else if (question.default) {
        value = question.default;
        console.log(`Using default value for ${question.key}: ${value}`);
      }
    }

    // Update .env content
    if (match) {
      envContent = envContent.replace(regex, `${question.key}=${value}`);
    } else {
      envContent += `${question.key}=${value}\n`;
    }

    // Save .env file after each answer
    fs.writeFileSync(envPath, envContent);
    
    // Ask next question
    askQuestions(questionIndex + 1);
  });
}

// Start asking questions
askQuestions(); 