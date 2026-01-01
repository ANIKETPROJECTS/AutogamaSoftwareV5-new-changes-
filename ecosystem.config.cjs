module.exports = {
  apps: [{
    name: "autogarage-crm",
    script: "./dist/index.cjs",
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      // IMPORTANT: Replace these with your actual credentials on the server
      MONGODB_URI: "mongodb://your_mongodb_connection_string",
      SESSION_SECRET: "your_random_session_secret_here"
    }
  }]
};
