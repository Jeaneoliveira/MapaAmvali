const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("postgres://user:pass@localhost:5432/dbname");

const Local = sequelize.define("Local", {
  nome: DataTypes.STRING,
  endereco: DataTypes.STRING,
  latitude: DataTypes.FLOAT,
  longitude: DataTypes.FLOAT,
  tipo_local: DataTypes.STRING,
  trafego: DataTypes.INTEGER,
});

module.exports = Local;
