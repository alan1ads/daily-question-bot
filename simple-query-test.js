require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('Simple Supabase Query Test');
console.log('-------------------------');

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Make sure you have SUPABASE_URL and SUPABASE_KEY in your .env file.');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Using Supabase Key: ${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

const testQuery = async () => {
  try {
    console.log('\nAttempting to connect to Supabase...');
    
    // Simple query to get all questions
    console.log('Running query: SELECT * FROM questions LIMIT 5');
    const { data, error, status, statusText } = await supabase
      .from('questions')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error querying questions table:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('HTTP status:', status, statusText);
      
      console.log('\nPossible solutions:');
      console.log('1. Verify your SUPABASE_KEY is the service_role key (not anon/public)');
      console.log('2. Check if the "questions" table exists in your database');
      console.log('3. Ensure your table has proper permissions set up');
      console.log('4. Check if your API key has expired or been revoked');
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log(`✅ Retrieved ${data.length} questions from the database.`);
      
      if (data.length > 0) {
        console.log('\nFirst question:');
        console.log(`ID: ${data[0].id}`);
        console.log(`Question: ${data[0].question}`);
        console.log(`Created: ${data[0].created_at}`);
      } else {
        console.log('\nNo questions found in the database.');
      }
    }
  } catch (error) {
    console.error('Unexpected error during query:');
    console.error(error);
  }
};

testQuery(); 