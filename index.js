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
          content: "You are a helpful assistant that generates engaging, thought-provoking questions for a remote team to answer in Slack. The questions should inspire team members to share personal experiences, opinions, or insights, fostering team bonding and engagement."
        },
        {
          role: "user",
          content: "Generate a unique, engaging question for our remote team to answer in our daily team building activity. Make it fun, thoughtful, and likely to spark conversation."
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating question:', error);
    return null;
  }
};

// Function to generate a unique question (retry if duplicate)
const generateUniqueQuestion = async (maxAttempts = 5) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const question = await generateQuestion();
    
    if (question && await db.isQuestionUnique(question)) {
      return question;
    }
    
    console.log(`Generated a duplicate question, retrying... (Attempt ${attempts + 1}/${maxAttempts})`);
    attempts++;
  }
  
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
  const port = process.env.PORT || 3000;
  
  // Start the Slack app
  await app.start();
  console.log(`⚡️ Slack Bot connected and running!`);
  
  // Start the Express HTTP server
  expressApp.listen(port, () => {
    console.log(`HTTP server listening on port ${port}!`);
  });
  
  // Schedule the daily question
  scheduleDailyQuestion();
})(); 