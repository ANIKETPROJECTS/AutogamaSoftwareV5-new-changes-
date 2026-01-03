module.exports = {
  apps: [{
    name: "autogarage-crm",
    script: "./dist/index.cjs",
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      MONGODB_URI: "mongodb://localhost:27017/autogarage",
      SESSION_SECRET: "your-production-session-secret"
    }
  }]
};
