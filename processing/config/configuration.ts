export default () => ({
  port: +process.env.PORT || 3000,
  tmdb: {
    token: process.env.TMDB_TOKEN || 'token'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    name: process.env.DB_NAME || 'db',
  },
  directory: {
    data: process.env.DATA_DIR || '/media/data',
    results: process.env.RESULTS_DIR || '/media/results',
    logs: process.env.LOGS_DIR || '/media/logs',
  }
})