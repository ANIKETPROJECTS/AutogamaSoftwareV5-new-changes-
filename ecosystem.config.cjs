module.exports = {
  apps: [{
    name: "autogarage-crm",
    script: "./dist/index.cjs",
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      MONGODB_URI: "mongodb+srv://abhijeet18012001_db_user:SNXS0nh4tm8l2IYv@autogarage.pxrxaer.mongodb.net/?appName=Autogarage",
      SESSION_SECRET: "QmpMz4VloWsF7jLF58Q1La/Q937EqwHUCqZiLGk54XHF+6eRjSLzDGFAKFoMbfGtsZ2uzIwQiB4HCYQsC2fc3A=="
    }
  }]
};
