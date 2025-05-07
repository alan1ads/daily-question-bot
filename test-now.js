// Simple script to test posting a daily question right now
const { App } = require('@slack/bolt');
const config = require('./config');
const db = require('./database');
const { OpenAI } = require('openai');

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

// Run this when executed directly
(async () => {
  try {
    // Start the Slack app
    await app.start();
    console.log('⚡️ Slack app connected');
    
    // Post a daily question immediately
    console.log('Testing daily question functionality...');
    await postDailyQuestion();
    console.log('Test complete! Check your Slack channel');
    
    // Shut down the app after testing
    await app.stop();
  } catch (error) {
    console.error('Error during test:', error);
  }
})(); 