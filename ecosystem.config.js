module.exports = {
  apps: [
    {
      name: 'coupon-server',
      script: 'npm',
      args: 'run dev',
      cwd: './server',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 28443
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'coupon-client',
      script: 'npm',
      args: 'run dev',
      cwd: './client',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PORT: 28080
      },
      error_file: './logs/client-error.log',
      out_file: './logs/client-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
