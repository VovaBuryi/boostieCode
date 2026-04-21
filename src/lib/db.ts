export const dbConfig = {
  host: process.env.DB_HOST || 'miata.cityhost.com.ua',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'ch4bdb4547_boostieCode',
  password: process.env.DB_PASSWORD || 'NO8LTRj993',
  database: process.env.DB_NAME || 'ch4bdb4547_boostieCode',
};
