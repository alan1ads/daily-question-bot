const db = require('./database');

const testDatabase = async () => {
  try {
    console.log('Testing database connection...');
    
    // Get all past questions
    const pastQuestions = await db.getPastQuestions();
    
    console.log(`Found ${pastQuestions.length} questions in the database:`);
    console.log('==============================================');
    
    // Print all questions with their creation date
    pastQuestions.forEach((q, index) => {
      console.log(`[${index + 1}] ID: ${q.id}`);
      console.log(`Created: ${q.created_at}`);
      console.log(`Question: ${q.question}`);
      console.log('----------------------------------------------');
    });
    
    // Check for potential duplicates
    console.log('\nChecking for potential duplicate questions...');
    
    // Map to store questions by first few words as key
    const questionMap = new Map();
    const potentialDuplicates = [];
    
    // Group questions by first few words
    pastQuestions.forEach(q => {
      // Get first 5 words as key
      const words = q.question.split(' ');
      const key = words.slice(0, 5).join(' ').toLowerCase();
      
      if (questionMap.has(key)) {
        questionMap.get(key).push(q);
        if (questionMap.get(key).length === 2) {
          potentialDuplicates.push(questionMap.get(key));
        }
      } else {
        questionMap.set(key, [q]);
      }
    });
    
    if (potentialDuplicates.length > 0) {
      console.log(`Found ${potentialDuplicates.length} potential duplicate sets:`);
      potentialDuplicates.forEach((duplicates, index) => {
        console.log(`\nPotential Duplicate Set #${index + 1}:`);
        duplicates.forEach(q => {
          console.log(`- Created ${q.created_at}: "${q.question}"`);
        });
      });
      
      console.log('\nYou should consider running the similarity test on these questions.');
    } else {
      console.log('No obvious potential duplicates found based on first few words.');
    }
    
    console.log('\nDatabase test complete!');
  } catch (error) {
    console.error('Error testing database:', error);
  }
};

// Run the test
testDatabase(); 