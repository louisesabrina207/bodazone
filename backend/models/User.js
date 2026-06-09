const { sequelize, Sequelize } = require('../config/database');
const bcryptjs = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false,
    trim: true
  },
  email: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: false,
    lowercase: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: Sequelize.STRING(20),
    allowNull: false,
    unique: false,
  },
  password: {
    type: Sequelize.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: Sequelize.ENUM('rider', 'seller', 'admin'),
    defaultValue: 'rider',
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending_approval'),
    defaultValue: 'active',
    allowNull: false
  },
  emailVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  phoneVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  twoFactorEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  emailVerificationCodeHash: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  emailVerificationExpiresAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  twoFactorCodeHash: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  twoFactorCodeExpiresAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  lastLogin: {
    type: Sequelize.DATE,
    allowNull: true
  },
  profileImage: {
    type: Sequelize.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = User;
