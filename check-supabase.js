const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.key);

const checkSupabase = async () => {
  try {
    console.log('Checking Supabase connection and configuration...');
    console.log(`Using Supabase URL: ${config.supabase.url}`);
    
    // Check the Supabase connection
    const { data: healthData, error: healthError } = await supabase.rpc('pg_health');
    
    if (healthError) {
      console.error('Connection error:', healthError);
    } else {
      console.log('Supabase connection health check successful.');
    }
    
    // Try to list tables
    console.log('\nAttempting to list tables in the database...');
    
    try {
      // This uses the pgMeta extension, which might not be enabled
      const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
      
      if (tablesError) {
        console.error('Error listing tables:', tablesError);
      } else {
        console.log('Tables in database:');
        tables.forEach(table => {
          console.log(`- ${table.name}`);
        });
        
        // Check if questions table exists
        const questionsTable = tables.find(t => t.name === 'questions');
        if (questionsTable) {
          console.log('\n✅ "questions" table found!');
        } else {
          console.error('\n❌ "questions" table NOT found! Check table name case sensitivity.');
        }
      }
    } catch (rpcError) {
      console.log('Could not list tables using RPC. Trying alternate method...');
      
      // Alternative approach using SQL query
      const { data: schemaData, error: schemaError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (schemaError) {
        console.error('Error querying table list:', schemaError);
      } else if (schemaData) {
        console.log('Tables in database:');
        schemaData.forEach(table => {
          console.log(`- ${table.tablename}`);
        });
        
        // Check if questions table exists
        const questionsTable = schemaData.find(t => t.tablename === 'questions');
        if (questionsTable) {
          console.log('\n✅ "questions" table found!');
        } else {
          console.error('\n❌ "questions" table NOT found! Check table name case sensitivity.');
        }
      }
    }
    
    // Try directly querying the questions table
    console.log('\nAttempting to get question count directly...');
    const { data: questionCountData, error: questionCountError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (questionCountError) {
      console.error('Error getting question count:', questionCountError);
    } else {
      console.log(`Question count: ${questionCountData.count}`);
    }
    
    // Try alternative table names (case sensitivity)
    console.log('\nTrying alternative table names in case of case sensitivity...');
    const alternativeNames = ['Questions', 'QUESTIONS', 'Question', 'question'];
    
    for (const name of alternativeNames) {
      const { data, error } = await supabase
        .from(name)
        .select('count');
      
      if (!error) {
        console.log(`✅ Table "${name}" exists and can be queried.`);
      }
    }
    
  } catch (error) {
    console.error('Error checking Supabase:', error);
  }
};

checkSupabase(); 