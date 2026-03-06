const { DataTypes, Model } = require("sequelize");
const { getSequelize } = require("../config/db");

class Department extends Model {}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: "Stethoscope",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: getSequelize(),
    modelName: "Department",
    tableName: "departments",
    timestamps: true,
    indexes: [{ fields: ["isActive"] }],
  }
);

module.exports = Department;
