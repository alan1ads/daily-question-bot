const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const path = require('path');
const cron = require('node-cron');
const config = require('./config');
const db = require('./database');
const express = require('express');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Initialize Slack app
const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
});

// Create an Express app for handling HTTP requests
const expressApp = express();
expressApp.get('/', (req, res) => {
  res.send('Daily Question Bot is running!');
});

expressApp.get('/health', (req, res) => {
  res.send('OK');
});

// Function to generate a question using OpenAI
const generateQuestion = async () => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates engaging, thought-provoking personal questions for a remote team to answer in Slack. Your goal is to create highly unique personal questions that have not been asked before. Focus exclusively on respectful personal insights that foster team bonding and engagement without crossing professional boundaries. Questions should help team members share appropriate personal details about their lives, interests, preferences, experiences, and thoughts. Vary your question formats, topics, and themes to ensure diversity. Avoid starting questions in similar ways. Ensure all questions are appropriate for a work environment while still being engaging and personal."
        },
        {
          role: "user",
          content: "Generate a truly unique personal question for our remote team's daily team building activity. Focus only on personal questions that are respectful and appropriate for a work environment. Make it thought-provoking and conversation-sparking without being too similar to common icebreaker questions or crossing professional boundaries. The question should help team members share appropriate personal details about themselves in a friendly, respectful manner."
        }
      ],
      temperature: 0.9,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating question:', error);
    return null;
  }
};

// Function to generate a unique question (retry if duplicate)
const generateUniqueQuestion = async (maxAttempts = 12) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} to generate a unique question`);
    
    const question = await generateQuestion();
    
    if (!question) {
      console.error('Failed to generate question from OpenAI');
      continue;
    }
    
    console.log(`Generated question: "${question.substring(0, 50)}..."`);
    
    const isUnique = await db.isQuestionUnique(question);
    if (isUnique) {
      console.log('Question is unique! Proceeding to post');
      return question;
    } else {
      console.log('Question is a duplicate (exact match or thematically similar). Trying again...');
    }
  }
  
  console.error(`Failed to generate a unique question after ${maxAttempts} attempts`);
  return null;
};

// Function to post the daily question to Slack
const postDailyQuestion = async () => {
  try {
    const question = await generateUniqueQuestion();
    
    if (!question) {
      console.error('Failed to generate a unique question after multiple attempts');
      return;
    }
    
    // Post to Slack with channel tag
    await app.client.chat.postMessage({
      channel: config.slack.channelId,
      text: `<!channel> :wave: *Daily Team Question* :thinking_face:\n\n${question}\n\n_Reply in channel to share your answer!_`,
      unfurl_links: false
    });
    
    // Save the question
    await db.saveQuestion(question);
    console.log('Posted daily question:', question);
  } catch (error) {
    console.error('Error posting daily question:', error);
  }
};

// Schedule the daily question
const scheduleDailyQuestion = () => {
  // Parse the scheduled time
  const [hour, minute] = config.schedule.questionTime.split(':');
  
  // Schedule the cron job to run daily at the specified time
  // Format: minute hour * * * (Monday-Sunday)
  const cronSchedule = `${minute} ${hour} * * 1-5`; // Monday to Friday
  
  console.log(`Scheduled daily question for ${hour}:${minute} EST on weekdays`);
  
  // Set timezone to Eastern Time
  cron.schedule(cronSchedule, postDailyQuestion, {
    scheduled: true,
    timezone: config.schedule.timezone
  });
};

// Manual command to post a question immediately (useful for testing)
app.command('/ask-daily-question', async ({ command, ack, respond }) => {
  await ack();
  await postDailyQuestion();
  await respond('Daily question has been posted!');
});

// Start the app
(async () => {
  const port = process.env.PORT || 10000;
  
  // Start the Slack app with error handling for socket reconnection
  try {
    await app.start();
    console.log(`⚡️ Slack Bot connected and running!`);
    
    // Add error handling for socket mode disconnects
    app.error(async (error) => {
      console.error(`Error in Slack app: ${error.message}`);
      
      // Handle socket disconnection errors
      if (error.message && (error.message.includes('server explicit disconnect') || 
                           error.message.includes('too_many_websockets'))) {
        console.log('Socket connection issue detected, will attempt to reconnect after delay...');
        
        // Implement exponential backoff to avoid rate limiting
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const reconnect = async (attempt = 1, maxAttempts = 5) => {
          if (attempt > maxAttempts) {
            console.error(`Failed to reconnect after ${maxAttempts} attempts`);
            return;
          }
          
          const backoffTime = Math.min(30000 * Math.pow(1.5, attempt - 1), 300000); // 30s to 5min backoff
          console.log(`Waiting ${backoffTime/1000}s before reconnection attempt ${attempt}/${maxAttempts}`);
          
          await wait(backoffTime);
          
          try {
            // Simple ping to test connection
            const pingResult = await app.client.auth.test();
            console.log(`Reconnection successful: ${pingResult.ok}`);
          } catch (reconnectError) {
            console.error(`Reconnection attempt ${attempt} failed: ${reconnectError.message}`);
            reconnect(attempt + 1, maxAttempts);
          }
        };
        
        reconnect();
      }
    });
  } catch (startupError) {
    console.error(`Failed to start Slack app: ${startupError.message}`);
  }
  
  // Start the Express HTTP server
  expressApp.listen(port, () => {
    console.log(`HTTP server listening on port ${port}!`);
  });
  
  // Schedule the daily question
  scheduleDailyQuestion();
})(); 