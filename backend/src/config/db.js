const { Sequelize } = require("sequelize");

let sequelizeInstance = null;

const createSequelizeFromEnv = () => {
  const databaseUrl = String(process.env.MYSQL_URL || "").trim();
  if (databaseUrl) {
    return new Sequelize(databaseUrl, {
      dialect: "mysql",
      logging: false,
    });
  }

  const host = String(process.env.MYSQL_HOST || "").trim();
  const port = Number(process.env.MYSQL_PORT || 3306);
  const database = String(process.env.MYSQL_DATABASE || "").trim();
  const username = String(process.env.MYSQL_USER || "").trim();
  const password = String(process.env.MYSQL_PASSWORD || "");

  if (!host || !database || !username) {
    throw new Error(
      "MySQL configuration is missing. Set MYSQL_URL or MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD."
    );
  }

  return new Sequelize(database, username, password, {
    host,
    port,
    dialect: "mysql",
    logging: false,
  });
};

const getSequelize = () => {
  if (!sequelizeInstance) {
    sequelizeInstance = createSequelizeFromEnv();
  }
  return sequelizeInstance;
};

const connectDb = async () => {
  const sequelize = getSequelize();
  await sequelize.authenticate();
  return sequelize;
};

module.exports = connectDb;
module.exports.getSequelize = getSequelize;
