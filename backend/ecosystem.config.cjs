module.exports = {
  apps: [{
    name: 'enterprise-backend',
    script: 'src/index.js',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 22351
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 22351
    }
  }]
}
