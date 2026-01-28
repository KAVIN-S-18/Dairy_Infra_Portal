const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MPCSofficer = sequelize.define(
  'MPCSofficer',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    mpcsId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique MPCS Officer ID: A1-DM1-MPCS1, A1-DM1-MPCS2, etc.'
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
    tableName: 'mpcs_officers',
    timestamps: true,
  }
);

module.exports = MPCSofficer;
