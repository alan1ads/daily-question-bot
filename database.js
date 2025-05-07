const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const { OpenAI } = require('openai');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.key);

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Get similarity settings from config
const SIMILARITY_THRESHOLD = config.similarity.threshold;  
const EMBEDDING_MODEL = config.similarity.model;
const MIN_QUESTIONS_FOR_CHECK = config.similarity.minQuestionsForCheck;

/**
 * Initialize the database and create tables if they don't exist
 */
const initDatabase = async () => {
  try {
    // Check if we can connect to Supabase
    const { data, error } = await supabase.from('questions').select('count');
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating questions table...');
      await createTables();
    } else if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Connected to Supabase successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

/**
 * Create the necessary tables in Supabase
 */
const createTables = async () => {
  try {
    // This is using Supabase's SQL execution capability
    // You would create these tables using the Supabase dashboard instead
    console.log('Please create a "questions" table in your Supabase dashboard with the following schema:');
    console.log(`
    Table name: questions
    Columns:
    - id (int8, primary key)
    - question (text, not null)
    - created_at (timestamptz, default: now())
    `);
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

/**
 * Get all past questions
 */
const getPastQuestions = async () => {
  try {
    console.log('Attempting to retrieve questions from Supabase...');
    
    // First, check if we can connect to the questions table
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('Error checking question count:', countError);
      console.error('Error code:', countError.code);
      console.error('Error message:', countError.message);
      console.error('Error details:', countError.details);
    } else {
      console.log(`Supabase reports ${count} questions in the table.`);
    }
    
    // Then try to retrieve all questions
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting past questions:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      return [];
    }
    
    console.log(`Retrieved ${data ? data.length : 0} questions from database.`);
    if (data && data.length > 0) {
      console.log('First question:', data[0]);
    } else {
      console.log('No questions returned from database query.');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting past questions:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }
};

/**
 * Generate an embedding for a text string using OpenAI
 */
const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
};

/**
 * Calculate cosine similarity between two vectors
 * Returns a value from 0 to 1, where 1 is identical
 */
const calculateCosineSimilarity = (vecA, vecB) => {
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

/**
 * Check if a question is semantically similar to any existing questions
 */
const isSemanticallySimilar = async (newQuestion, pastQuestions) => {
  try {
    // Generate embedding for the new question
    const newEmbedding = await generateEmbedding(newQuestion);
    if (!newEmbedding) return false;
    
    // Check similarity against each past question
    for (const pastQuestion of pastQuestions) {
      // Generate embedding for past question
      const pastEmbedding = await generateEmbedding(pastQuestion.question);
      if (!pastEmbedding) continue;
      
      // Calculate similarity
      const similarity = calculateCosineSimilarity(newEmbedding, pastEmbedding);
      
      // Log similarity for debugging (can remove later)
      console.log(`Similarity [${similarity.toFixed(2)}] between:
        New: ${newQuestion.substring(0, 50)}...
        Old: ${pastQuestion.question.substring(0, 50)}...`);
      
      // Check if similarity exceeds threshold
      if (similarity >= SIMILARITY_THRESHOLD) {
        console.log(`Thematic duplicate detected! Similarity score: ${similarity.toFixed(2)}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking semantic similarity:', error);
    return false;
  }
};

/**
 * Check if a question is unique (not a duplicate)
 */
const isQuestionUnique = async (question) => {
  try {
    // First check for exact text matches (case-insensitive)
    const { data, error } = await supabase
      .from('questions')
      .select('id')
      .ilike('question', question)
      .limit(1);
    
    if (error) {
      console.error('Error checking if question is unique:', error);
      return true; // Assume unique on error to continue operation
    }
    
    // If there's an exact match, it's not unique
    if (data && data.length > 0) {
      console.log('Exact duplicate detected!');
      return false;
    }
    
    // If no exact match, check for semantic similarity
    const pastQuestions = await getPastQuestions();
    console.log(`Found ${pastQuestions.length} past questions in the database.`);
    
    // Always perform similarity check regardless of question count
    // Remove the minimum question check to prevent similar questions being posted
    
    // Check for semantic similarity with past questions
    const isSimilar = await isSemanticallySimilar(question, pastQuestions);
    
    // Return true if not similar, false if similar (false = not unique)
    return !isSimilar;
  } catch (error) {
    console.error('Error checking if question is unique:', error);
    return true; // Assume unique on error to continue operation
  }
};

/**
 * Save a new question
 */
const saveQuestion = async (question) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .insert([{ question }]);
    
    if (error) {
      console.error('Error saving question:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving question:', error);
    return false;
  }
};

// Initialize the database when this module is imported
initDatabase();

module.exports = {
  getPastQuestions,
  isQuestionUnique,
  saveQuestion
}; 