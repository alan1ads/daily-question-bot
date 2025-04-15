# Daily Question Bot for Slack

A Node.js application that posts a daily question to a Slack channel. The bot uses OpenAI to generate unique questions and keeps track of past questions to avoid duplicates.

## Features

- Daily question posting on a schedule (default: weekdays at 9:00 AM EST)
- AI-generated engaging questions via OpenAI
- Duplicate question detection
- Slack integration with threading support
- Manual trigger via Slack slash command
- Persistent storage with Supabase

## Setup

### 1. Slack App Setup

1. Create a new Slack app at [https://api.slack.com/apps](https://api.slack.com/apps)
2. Add the following Bot Token Scopes under "OAuth & Permissions":
   - `chat:write`
   - `commands`
3. Enable Socket Mode in your Slack app
4. Create a slash command `/ask-daily-question` that points to your app
5. Install the app to your workspace
6. Copy the Bot Token (`xoxb-...`), Signing Secret, and App Token (`xapp-...`)

### 2. Supabase Setup

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase project
3. Create a new table with the following SQL:

```sql
CREATE TABLE questions (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_question ON questions USING gin (question gin_trgm_ops);
```

4. Copy your Supabase URL and anon key from the API settings page

### 3. Environment Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the setup script to configure your environment:
   ```
   npm run setup
   ```
   This interactive script will guide you through setting up your .env file with all required credentials.

### 4. Run the Bot Locally

Development mode:
```
npm start
```

Testing:
```
npm run test:question   # Test question generation
npm run test:slack      # Test Slack connection
npm run test:full       # Test full workflow
```

### 5. Deploy to Render.com

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Sign up for [Render.com](https://render.com)
3. Create a new Web Service and connect to your repository
4. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all your environment variables from your .env file
   - **Important**: Make sure the `PORT` environment variable is set (Render sets this automatically)
5. Deploy your service

The application includes an Express web server that listens on the specified port, which is required for Render.com web services. It provides simple endpoints:
- `/` - Returns a simple status message
- `/health` - Health check endpoint for monitoring

You can also use the included `render.yaml` file for Blueprint deployments:
```
render blueprint render.yaml
```

## Security

This application follows security best practices:

1. **No hardcoded secrets**: All API keys and tokens are stored in environment variables
2. **Centralized configuration**: Environment variables are loaded once via the config module
3. **Environment isolation**: The `.env` file is excluded from version control via `.gitignore`
4. **Validation**: The application validates required environment variables are set
5. **Minimal permissions**: The Slack app only requests the minimum necessary permissions
6. **Database Security**: Supabase provides secure, encrypted storage for past questions

When deploying to production:

- Store your environment variables in your Render.com environment variable settings
- Never commit the `.env` file to version control
- Consider using a secrets manager for more sensitive environments

## Customization

- Edit the OpenAI prompt in `index.js` to change the type of questions generated
- Adjust the scheduling in the `scheduleDailyQuestion` function
- Modify the Slack message formatting in the `postDailyQuestion` function

## How It Works

1. At the scheduled time (or when triggered manually), the bot generates a question using OpenAI
2. It checks if the question has been asked before by comparing against the Supabase database
3. If it's a duplicate, it tries again (up to 5 times)
4. Once a unique question is found, it posts to the specified Slack channel
5. The question is saved to the database to avoid future duplicates 