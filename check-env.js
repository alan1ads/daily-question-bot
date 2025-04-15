require('dotenv').config();

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