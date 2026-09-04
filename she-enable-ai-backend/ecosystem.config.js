module.exports = {
  apps: [
    {
      name: 'she-enable-ai-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};