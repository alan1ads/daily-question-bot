const { OpenAI } = require('openai');
const config = require('./config');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Sample questions that are thematically similar
const samplePairs = [
  {
    q1: "If you could have dinner with any historical figure, who would it be and why?",
    q2: "If you could invite three historical figures to a dinner party, who would they be?",
    shouldMatch: true
  },
  {
    q1: "What's your favorite book and how did it impact your life?",
    q2: "If you could only read one book for the rest of your life, which would it be?", 
    shouldMatch: true
  },
  {
    q1: "If you could travel anywhere in the world, where would you go?",
    q2: "What's your dream vacation destination?",
    shouldMatch: true
  },
  {
    q1: "What's your favorite food and why?",
    q2: "What's the most unusual food you've ever tried?",
    shouldMatch: false
  },
  {
    q1: "What hobby would you take up if you had unlimited time and money?",
    q2: "If you could master any skill instantly, what would it be?",
    shouldMatch: false
  },
  {
    q1: "What was your favorite childhood toy?",
    q2: "If you could bring back one discontinued product, what would it be?",
    shouldMatch: false
  }
];

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

// Test similarity detection with different thresholds
const testSimilarity = async () => {
  // Get threshold from config or use test values
  const defaultThreshold = config.similarity.threshold || 0.85;
  const thresholds = [0.75, 0.80, 0.85, 0.90, 0.95];
  
  console.log("📊 Testing Semantic Similarity Detection\n");
  console.log("Default threshold:", defaultThreshold);
  console.log("Testing with thresholds:", thresholds.join(", "));
  console.log("====================================\n");
  
  for (const pair of samplePairs) {
    console.log(`🔍 Comparing Questions:`);
    console.log(`1️⃣ "${pair.q1}"`);
    console.log(`2️⃣ "${pair.q2}"`);
    console.log(`Expected to be flagged as similar: ${pair.shouldMatch ? "✓ YES" : "✗ NO"}`);
    
    // Generate embeddings
    const embedding1 = await generateEmbedding(pair.q1);
    const embedding2 = await generateEmbedding(pair.q2);
    
    if (!embedding1 || !embedding2) {
      console.log("❌ Error generating embeddings. Skipping...\n");
      continue;
    }
    
    // Calculate similarity
    const similarity = calculateSimilarity(embedding1, embedding2);
    console.log(`\nSimilarity score: ${similarity.toFixed(4)}`);
    
    // Test against different thresholds
    console.log("\nResults with different thresholds:");
    for (const threshold of thresholds) {
      const wouldMatch = similarity >= threshold;
      const emoji = wouldMatch === pair.shouldMatch ? "✅" : "❌";
      console.log(`${emoji} Threshold ${threshold.toFixed(2)}: Questions would ${wouldMatch ? "" : "NOT "}be considered similar`);
    }
    console.log("\n====================================\n");
  }
  
  console.log("Test Complete!");
  console.log("Based on these results, adjust your SIMILARITY_THRESHOLD in the .env file if needed.");
  console.log("Recommended: Choose a threshold that correctly identifies most of the examples.");
};

// Run the test
testSimilarity(); 