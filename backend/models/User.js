const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM(
        'SUPER_ADMIN',
        'ADMIN',
        'COOPERATIVE_ADMIN',
        'PRIVATE_ADMIN',
        'DISTRICT_MANAGER',
        'TRANSPORT_MANAGER',
        'DRIVER',
        'SUPERVISOR',
        'OPERATOR',
        'MPCS_OFFICER',
        'FARMER'
      ),
      allowNull: false,
    },

    organizationName: {
      type: DataTypes.STRING,
    },

    organizationType: {
      type: DataTypes.ENUM('COOPERATIVE', 'PRIVATE'),
    },

    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },

    approvedAt: {
      type: DataTypes.DATE,
    },

    mpcsId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Hierarchical ID fields
    hierarchyCode: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unique ID based on hierarchy: DIST-1, DIST-1-SUP-1, DIST-1-MPCS-1, etc.'
    },

    // Reference fields for hierarchy
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Admin who created this user (for district managers)'
    },

    districtManagerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'District manager under whom this user operates'
    },

    districtCode: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'District code (e.g., DIST-1) for reference'
    },
  },
  {
    tableName: 'users',
    timestamps: true,
  }
);

module.exports = User;
