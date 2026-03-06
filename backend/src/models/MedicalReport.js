const { DataTypes, Model } = require("sequelize");
const { getSequelize } = require("../config/db");

class MedicalReport extends Model {}

MedicalReport.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    patientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING(1200),
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize: getSequelize(),
    modelName: "MedicalReport",
    tableName: "medical_reports",
    timestamps: true,
    indexes: [
      { fields: ["appointmentId"] },
      { fields: ["patientId"] },
    ],
  }
);

module.exports = MedicalReport;
