require('dotenv').config();

console.log('Environment Variable Check');
console.log('-------------------------');
console.log('Checking for Supabase configuration:');

// Check Supabase URL
if (process.env.SUPABASE_URL) {
  const url = process.env.SUPABASE_URL;
  const maskedUrl = url.replace(/^(https?:\/\/[^.]+)(.*)$/, '$1***$2');
  console.log(`✅ SUPABASE_URL is set: ${maskedUrl}`);
} else {
  console.log('❌ SUPABASE_URL is NOT set');
}

// Check Supabase Key
if (process.env.SUPABASE_KEY) {
  const key = process.env.SUPABASE_KEY;
  // Only show first and last few characters
  const maskedKey = key.length > 10 
    ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}`
    : '***';
  console.log(`✅ SUPABASE_KEY is set: ${maskedKey}`);
  
  // Warn if key seems to be anon key (usually starts with "eyJ")
  if (key.startsWith('eyJ')) {
    console.log('⚠️ Warning: Key appears to be an anonymous/public key.');
    console.log('   For server applications, you should use the service_role key.');
  }
} else {
  console.log('❌ SUPABASE_KEY is NOT set');
}

console.log('\nTo fix:');
console.log('1. Make sure you have a .env file in the project root');
console.log('2. Ensure it contains both SUPABASE_URL and SUPABASE_KEY');
console.log('3. For SUPABASE_KEY, use the "service_role" key from Supabase settings');
console.log('\nSample .env contents:');
console.log('SUPABASE_URL=https://your-project-id.supabase.co');
console.log('SUPABASE_KEY=your-service-role-key-here');

console.log('Environment variables check:');
console.log('---------------------------');
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('OPENAI_API_KEY first 10 chars:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set');
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'Set (length: ' + process.env.SLACK_BOT_TOKEN.length + ')' : 'Not set');
console.log('SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? 'Set (length: ' + process.env.SLACK_SIGNING_SECRET.length + ')' : 'Not set');
console.log('SLACK_APP_TOKEN:', process.env.SLACK_APP_TOKEN ? 'Set (length: ' + process.env.SLACK_APP_TOKEN.length + ')' : 'Not set');
console.log('SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID || 'Not set');
console.log('QUESTION_TIME:', process.env.QUESTION_TIME || 'Not set (will use default 9:00)');
console.log('---------------------------'); 