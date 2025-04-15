const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Path to past questions file
const pastQuestionsPath = path.join(__dirname, 'data', 'past-questions.json');

// Function to read past questions
const getPastQuestions = () => {
  try {
    const data = fs.readFileSync(pastQuestionsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading past questions:', error);
    return [];
  }
};

// Function to check if a question is unique
const isQuestionUnique = (question) => {
  const pastQuestions = getPastQuestions();
  return !pastQuestions.some(q => q.question.toLowerCase() === question.toLowerCase());
};

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

// Test function
const testQuestion = async () => {
  try {
    console.log('Generating a test question...');
    const question = await generateQuestion();
    
    if (!question) {
      console.error('Failed to generate a question');
      return;
    }
    
    console.log('\nGenerated question:');
    console.log('-------------------');
    console.log(question);
    console.log('-------------------');
    
    const isUnique = isQuestionUnique(question);
    console.log(`\nIs this question unique? ${isUnique ? 'Yes' : 'No'}`);
    
    if (!isUnique) {
      console.log('This question has been asked before.');
    }
    
    console.log('\nPast questions count:', getPastQuestions().length);
  } catch (error) {
    console.error('Error in test:', error);
  }
};

// Run the test
testQuestion(); 