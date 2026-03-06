const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");
const { getSequelize } = require("../config/db");

const USER_ROLES = ["admin", "doctor", "patient"];

class User extends Model {
  comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  toSafeObject() {
    return {
      id: String(this.id),
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      phone: this.phone || "",
      avatarUrl: this.avatarUrl || "",
      isActive: Boolean(this.isActive),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue("email", String(value || "").trim().toLowerCase());
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLES),
      allowNull: false,
      defaultValue: "patient",
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "",
    },
    avatarUrl: {
      type: DataTypes.STRING(1200),
      allowNull: false,
      defaultValue: "",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: getSequelize(),
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [
      { fields: ["role"] },
      { fields: ["isActive"] },
    ],
  }
);

module.exports = User;
module.exports.USER_ROLES = USER_ROLES;
