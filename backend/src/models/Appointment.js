const { DataTypes, Model } = require("sequelize");
const { getSequelize } = require("../config/db");

const APPOINTMENT_STATUSES = ["pending", "accepted", "rejected", "cancelled"];

class Appointment extends Model {}

Appointment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    doctorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeSlot: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...APPOINTMENT_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
  },
  {
    sequelize: getSequelize(),
    modelName: "Appointment",
    tableName: "appointments",
    timestamps: true,
    indexes: [
      { fields: ["patientId"] },
      { fields: ["doctorId"] },
      { fields: ["departmentId"] },
      { fields: ["appointmentDate"] },
      { fields: ["status"] },
      { fields: ["doctorId", "appointmentDate", "timeSlot"] },
    ],
  }
);

module.exports = Appointment;
module.exports.APPOINTMENT_STATUSES = APPOINTMENT_STATUSES;
