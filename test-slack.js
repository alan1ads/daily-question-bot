const { App } = require('@slack/bolt');
const config = require('./config');

// Initialize Slack app
const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
});

// Function to send a test message to Slack
const sendTestMessage = async () => {
  try {
    console.log('Sending test message to Slack...');
    console.log(`Channel ID: ${config.slack.channelId}`);
    
    // Start the app to establish connection
    await app.start();
    console.log('Connected to Slack!');
    
    // Send a test message
    const result = await app.client.chat.postMessage({
      channel: config.slack.channelId,
      text: `:test_tube: *Test Message* :wave:\n\nThis is a test message from your Daily Question Bot. If you can see this, your Slack integration is working correctly!`,
      unfurl_links: false
    });
    
    console.log('Test message sent successfully!');
    console.log(`Message timestamp: ${result.ts}`);
    console.log(`Channel: ${result.channel}`);
    
    // Close the connection
    await app.stop();
    console.log('Disconnected from Slack');
  } catch (error) {
    console.error('Error sending test message to Slack:');
    console.error(error);
  }
};

// Run the test
sendTestMessage(); 