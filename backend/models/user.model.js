const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  surname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[0-9+\-\s()]*$/i
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'property_manager', 'tenant'),
    allowNull: false,
    defaultValue: 'tenant'
  },
  property_ids: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  floor_assigned: {
    type: DataTypes.SMALLINT,
    allowNull: true,
    field: 'floor_assigned',
    validate: {
      min: -20,
      max: 200
    }
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'expiry_date'
  },
  monthly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'monthly_rate',
    validate: {
      min: 0
    }
  },
  apartment_label: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'apartment_label'
  },
  notice_day: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    field: 'notice_day',
    validate: {
      min: 1,
      max: 31
    }
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
