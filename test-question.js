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
          content: "You are a helpful assistant that generates engaging, thought-provoking questions for a remote team to answer in Slack. Your goal is to create highly unique questions that have not been asked before. The questions should balance professional development and respectful personal insights, fostering team bonding and engagement. Vary your question formats, topics, and themes to ensure diversity. Avoid starting questions in similar ways (like 'What's your favorite...' or 'If you could...'). Focus on originality while maintaining professionalism and respect for personal boundaries."
        },
        {
          role: "user",
          content: "Generate a truly unique question for our remote team's daily team building activity. Aim for a question that team members haven't encountered before, either professional or personal (but respectful). Make it thought-provoking and conversation-sparking without being too similar to common icebreaker questions. Vary the question format from typical patterns."
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