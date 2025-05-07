const db = require('./database');
const { OpenAI } = require('openai');
const config = require('./config');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Function to generate embedding
const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: config.similarity.model || "text-embedding-3-small",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
};

// Function to calculate cosine similarity
const calculateSimilarity = (vecA, vecB) => {
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  
  // Calculate magnitudes
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  // Calculate cosine similarity
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
};

// Check for duplicate questions in the database
const checkDuplicates = async () => {
  try {
    console.log('Checking for similar questions in the database...');
    
    // Get all past questions
    const questions = await db.getPastQuestions();
    
    console.log(`Found ${questions.length} questions in the database.`);
    
    if (questions.length < 2) {
      console.log('Not enough questions to check for duplicates.');
      return;
    }
    
    // Set threshold from config
    const threshold = config.similarity.threshold;
    console.log(`Using similarity threshold: ${threshold}`);
    
    // Store pairs with similarity above threshold
    const similarPairs = [];
    
    // Generate embeddings for all questions
    console.log('Generating embeddings for all questions...');
    const embeddings = [];
    
    for (const question of questions) {
      const embedding = await generateEmbedding(question.question);
      embeddings.push({
        id: question.id,
        question: question.question,
        created_at: question.created_at,
        embedding: embedding
      });
    }
    
    console.log('Comparing all question pairs...');
    
    // Compare all pairs of questions
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const q1 = embeddings[i];
        const q2 = embeddings[j];
        
        // Calculate similarity
        const similarity = calculateSimilarity(q1.embedding, q2.embedding);
        
        // If similarity exceeds threshold, add to similarPairs
        if (similarity >= threshold) {
          similarPairs.push({
            question1: {
              id: q1.id,
              text: q1.question,
              created_at: q1.created_at
            },
            question2: {
              id: q2.id,
              text: q2.question,
              created_at: q2.created_at
            },
            similarity: similarity
          });
        }
      }
    }
    
    // Sort by similarity (highest first)
    similarPairs.sort((a, b) => b.similarity - a.similarity);
    
    // Display results
    if (similarPairs.length > 0) {
      console.log(`\nFound ${similarPairs.length} similar question pairs above threshold ${threshold}:`);
      
      similarPairs.forEach((pair, index) => {
        console.log(`\nSimilar Pair #${index + 1} - Similarity: ${pair.similarity.toFixed(4)}`);
        console.log(`Question 1 (${pair.question1.created_at}):`);
        console.log(`"${pair.question1.text}"`);
        console.log(`\nQuestion 2 (${pair.question2.created_at}):`);
        console.log(`"${pair.question2.text}"`);
        console.log('-'.repeat(80));
      });
      
      console.log('\nConsider removing one question from each similar pair to improve variety.');
    } else {
      console.log('\nNo similar question pairs found above threshold.');
    }
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
  }
};

// Run the check
checkDuplicates(); 