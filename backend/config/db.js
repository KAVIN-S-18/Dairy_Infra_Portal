const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config(); // 🔑 REQUIRED HERE

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // similar to spring.jpa.show-sql=false
  }
);

module.exports = sequelize;
