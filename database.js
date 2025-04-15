const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.key);

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
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting past questions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting past questions:', error);
    return [];
  }
};

/**
 * Check if a question is unique
 */
const isQuestionUnique = async (question) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id')
      .ilike('question', question)
      .limit(1);
    
    if (error) {
      console.error('Error checking if question is unique:', error);
      return true; // Assume unique on error to continue operation
    }
    
    return !data || data.length === 0;
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