module.exports = {
  apps: [
    {
      name: 'mop-union-server',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 22531,
      },
    },
  ],
};
