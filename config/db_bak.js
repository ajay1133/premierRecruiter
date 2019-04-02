module.exports = {
  development: {
    username: 'ajay4692',
    password: 'ajay07co01',
    database: 'premierRecruiter',
    host: 'mongodb+srv://ajay4692:ajay07co01@premierrecruiter-zvjtk.mongodb.net/test?retryWrites=true',
    dialect: 'mongodb'
  },
  test: {
    username: 'ajay4692',
    password: 'ajay07co01',
    database: 'premierRecruiter_test',
    host: 'mongodb+srv://ajay4692:ajay07co01@premierrecruiter-zvjtk.mongodb.net/test?retryWrites=true',
    dialect: 'mongodb'
  },
  production: {
    host: process.env.DB_HOST,
    database: process.env.DB,
    username: process.env.DB_USER,
    password: process.env.DB_PWD,
    dialect: 'mongodb'
  },
  staging: {
    host: process.env.DB_HOST,
    database: process.env.DB,
    username: process.env.DB_USER,
    password: process.env.DB_PWD,
    dialect: 'mongodb'
  },
  aws: {
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_POST || '6379'
  },
};
