const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  city_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cities',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  floors_from: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    validate: {
      min: -20,
      max: 200
    }
  },
  floors_to: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    validate: {
      min: -20,
      max: 200
    }
  },
  show_monthly_reports_to_tenants: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'show_monthly_reports_to_tenants',
    comment: 'Controls whether tenants of this property can view monthly reports'
  },
  property_manager_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'DEPRECATED: Use property_managers junction table instead'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'properties',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Property;
