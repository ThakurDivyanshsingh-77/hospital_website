const { Op, fn, col, literal } = require("sequelize");
const { getSequelize } = require("../config/db");
const User = require("./User");
const Department = require("./Department");
const Doctor = require("./Doctor");
const Appointment = require("./Appointment");
const MedicalReport = require("./MedicalReport");
const GalleryItem = require("./GalleryItem");

const sequelize = getSequelize();

Doctor.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(Doctor, { foreignKey: "userId", as: "doctorProfile" });

Doctor.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
Department.hasMany(Doctor, { foreignKey: "departmentId", as: "doctors" });

Appointment.belongsTo(User, { foreignKey: "patientId", as: "patient" });
User.hasMany(Appointment, { foreignKey: "patientId", as: "patientAppointments" });

Appointment.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });
Doctor.hasMany(Appointment, { foreignKey: "doctorId", as: "appointments" });

Appointment.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
Department.hasMany(Appointment, { foreignKey: "departmentId", as: "appointments" });

MedicalReport.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });
Appointment.hasMany(MedicalReport, { foreignKey: "appointmentId", as: "reports" });

MedicalReport.belongsTo(User, { foreignKey: "patientId", as: "patient" });
User.hasMany(MedicalReport, { foreignKey: "patientId", as: "reports" });

GalleryItem.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });
User.hasMany(GalleryItem, { foreignKey: "uploadedById", as: "galleryItems" });

module.exports = {
  sequelize,
  Op,
  fn,
  col,
  literal,
  User,
  Department,
  Doctor,
  Appointment,
  MedicalReport,
  GalleryItem,
};
