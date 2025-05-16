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