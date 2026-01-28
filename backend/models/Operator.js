const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Operator = sequelize.define(
  'Operator',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    opId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique Operator ID: A1-DM1-OP1, A1-DM1-OP2, etc.'
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to parent District Manager'
    },
    adminNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dmNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'operators',
    timestamps: true,
  }
);

module.exports = Operator;
