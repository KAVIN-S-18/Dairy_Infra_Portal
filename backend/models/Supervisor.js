const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Supervisor = sequelize.define(
  'Supervisor',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique Supervisor ID: A1-DM1-SUP1, A1-DM1-SUP2, etc.'
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
    tableName: 'supervisors',
    timestamps: true,
  }
);

module.exports = Supervisor;
