// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "electromart-api",
      script: "dist/server.js",
      instances: "max",        // use all CPU cores
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      env: { NODE_ENV: "development" },
      env_production: { NODE_ENV: "production" },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};