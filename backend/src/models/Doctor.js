const { DataTypes, Model } = require("sequelize");
const { getSequelize } = require("../config/db");

class Doctor extends Model {}

Doctor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    departmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    specialty: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    qualification: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
    },
    experienceYears: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    bio: {
      type: DataTypes.TEXT("long"),
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
    modelName: "Doctor",
    tableName: "doctors",
    timestamps: true,
    indexes: [
      { fields: ["departmentId"] },
      { fields: ["isActive"] },
    ],
  }
);

module.exports = Doctor;
