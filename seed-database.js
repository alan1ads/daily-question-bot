const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.key);

// Sample questions to seed the database
const sampleQuestions = [
  "If you could have any superpower for a day, what would it be and how would you use it?",
  "What's a small daily habit that has improved your life significantly?",
  "If you could instantly master any skill, what would it be and why?",
  "What's the most memorable concert or live performance you've ever attended?",
  "If you could time travel to any period in history for a week, when and where would you go?",
  "What's a book or movie that changed your perspective on something important?",
  "If you could have dinner with any three people, living or dead, who would they be and why?",
  "What's your favorite way to recharge after a long work week?",
  "If you had to live in another country for a year, where would you choose and why?",
  "What's a personal goal you're currently working toward?"
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding process...');
    
    // Check if we can connect to the database
    console.log('Checking database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('questions')
      .select('count');
    
    if (connectionError) {
      if (connectionError.code === '42P01') {
        console.error('Error: "questions" table does not exist. Creating table...');
        
        // Try to create the table
        const { error: createError } = await supabase
          .rpc('create_questions_table');
          
        if (createError) {
          console.error('Failed to create questions table:', createError);
          console.log('Please create a table named "questions" manually with the following columns:');
          console.log('- id: integer (primary key, auto-increment)');
          console.log('- question: text (not null)');
          console.log('- created_at: timestamp with timezone (default: now())');
          return;
        } else {
          console.log('Successfully created questions table.');
        }
      } else {
        console.error('Error connecting to database:', connectionError);
        return;
      }
    } else {
      console.log('Successfully connected to database.');
    }
    
    // Get current questions to avoid duplicates
    const { data: existingQuestions, error: getError } = await supabase
      .from('questions')
      .select('question');
    
    if (getError) {
      console.error('Error getting existing questions:', getError);
      return;
    }
    
    console.log(`Found ${existingQuestions ? existingQuestions.length : 0} existing questions.`);
    
    // Filter out questions that already exist
    const existingSet = new Set(existingQuestions.map(q => q.question.toLowerCase()));
    const newQuestions = sampleQuestions.filter(q => !existingSet.has(q.toLowerCase()));
    
    console.log(`Adding ${newQuestions.length} new sample questions to the database...`);
    
    if (newQuestions.length === 0) {
      console.log('All sample questions already exist in the database. Nothing to add.');
      return;
    }
    
    // Insert questions one by one for better error reporting
    let addedCount = 0;
    
    for (const question of newQuestions) {
      const { data, error } = await supabase
        .from('questions')
        .insert([{ question }]);
      
      if (error) {
        console.error(`Error adding question "${question.substring(0, 30)}...":`, error);
      } else {
        addedCount++;
        console.log(`Added: "${question.substring(0, 50)}..."`);
      }
    }
    
    console.log(`Successfully added ${addedCount} questions to the database.`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Run the seeding process
seedDatabase(); 