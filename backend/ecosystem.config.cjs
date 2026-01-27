module.exports = {
    apps: [
        {
            name: 'antharangam-backend',
            script: 'server.js',
            instances: 1, // Fork mode recommended for Puppeteer stability
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 5001
            }
        },
        {
            name: 'antharangam-worker',
            script: 'services/enrichmentWorker.js', // If separate, otherwise server.js starts it
            instances: 1,
            autorestart: true,
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
