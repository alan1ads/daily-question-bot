const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const path = require('path');
const config = require('./config');
const db = require('./database');

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

// Function to test the full flow
const testFullFlow = async () => {
  try {
    console.log('Starting full test (generate question and send to Slack)...');
    
    // Get past questions count
    const pastQuestions = await db.getPastQuestions();
    console.log(`Current question count in database: ${pastQuestions.length}`);
    
    // Generate a unique question
    console.log('Generating a unique question...');
    const question = await generateUniqueQuestion();
    
    if (!question) {
      console.error('Failed to generate a unique question after multiple attempts');
      return;
    }
    
    console.log('\nGenerated unique question:');
    console.log('-------------------------');
    console.log(question);
    console.log('-------------------------');
    
    // Ask user if they want to send to Slack
    console.log('\nAbout to send this question to Slack.');
    console.log(`Channel ID: ${config.slack.channelId}`);
    console.log('This will tag everyone in the channel with @channel');
    console.log('Press Ctrl+C now if you do NOT want to send this to Slack.');
    console.log('Waiting 5 seconds before sending...');
    
    // Wait 5 seconds before sending
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Start the app to establish connection
    await app.start();
    console.log('Connected to Slack!');
    
    // Send the question to Slack with channel tag
    const result = await app.client.chat.postMessage({
      channel: config.slack.channelId,
      text: `<!channel> :wave: *Test: Daily Team Question* :thinking_face:\n\n${question}\n\n_Reply in channel to share your answer!_`,
      unfurl_links: false
    });
    
    console.log('\nQuestion sent successfully to Slack!');
    console.log(`Message timestamp: ${result.ts}`);
    console.log(`Channel: ${result.channel}`);
    
    // Save the question
    await db.saveQuestion(question);
    console.log('Question saved to database.');
    
    // Close the connection
    await app.stop();
    console.log('Disconnected from Slack');
    
  } catch (error) {
    console.error('Error in full test:');
    console.error(error);
  }
};

// Run the full test
testFullFlow(); 