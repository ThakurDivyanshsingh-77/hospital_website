const fs = require("fs");
const path = require("path");
const express = require("express");
const { Appointment, Department, Doctor, MedicalReport, User, Op } = require("../models");
const { authRequired, requireRoles } = require("../middleware/auth");
const { uploadReport } = require("../middleware/upload");
const { mapAppointment, mapDepartment, mapDoctor, mapReport } = require("../utils/serializers");
const { toDateOnly, todayDateOnly } = require("../utils/date");

const router = express.Router();
const BACKEND_ROOT = path.resolve(__dirname, "../..");

router.use(authRequired, requireRoles("patient"));

const getOwnedAppointment = async (patientId, appointmentId) => {
  const id = Number(appointmentId);
  if (!id) {
    return null;
  }
  return Appointment.findOne({
    where: {
      id,
      patientId,
    },
  });
};

router.get("/dashboard", async (req, res) => {
  try {
    const [appointments, upcomingAppointments] = await Promise.all([
      Appointment.findAll({
        where: { patientId: req.user.id },
        include: [
          {
            model: Doctor,
            as: "doctor",
            attributes: ["id", "fullName", "specialty"],
          },
          {
            model: Department,
            as: "department",
            attributes: ["id", "name"],
          },
        ],
      }),
      Appointment.findAll({
        where: {
          patientId: req.user.id,
          appointmentDate: { [Op.gte]: todayDateOnly() },
          status: { [Op.in]: ["pending", "accepted"] },
        },
        order: [["appointmentDate", "ASC"]],
        limit: 5,
        include: [
          {
            model: Doctor,
            as: "doctor",
            attributes: ["id", "fullName", "specialty"],
          },
          {
            model: Department,
            as: "department",
            attributes: ["id", "name"],
          },
        ],
      }),
    ]);

    const stats = {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === "pending").length,
      accepted: appointments.filter((item) => item.status === "accepted").length,
      rejected: appointments.filter((item) => item.status === "rejected").length,
    };

    return res.json({
      stats,
      upcoming: upcomingAppointments.map(mapAppointment),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient dashboard", error: error.message });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const filter = { patientId: req.user.id };
    if (req.query.status && req.query.status !== "all") {
      filter.status = String(req.query.status);
    }

    const appointments = await Appointment.findAll({
      where: filter,
      order: [
        ["appointmentDate", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "fullName", "specialty"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
    });

    return res.json({
      appointments: appointments.map(mapAppointment),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient appointments", error: error.message });
  }
});

router.get("/book-meta", async (_req, res) => {
  try {
    const [departments, doctors] = await Promise.all([
      Department.findAll({
        where: { isActive: true },
        order: [["name", "ASC"]],
      }),
      Doctor.findAll({
        where: { isActive: true },
        order: [["fullName", "ASC"]],
        include: [
          {
            model: Department,
            as: "department",
            attributes: ["id", "name"],
          },
          {
            model: User,
            as: "user",
            attributes: ["id"],
          },
        ],
      }),
    ]);

    return res.json({
      departments: departments.map(mapDepartment),
      doctors: doctors.map(mapDoctor),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch booking metadata", error: error.message });
  }
});

router.get("/booked-slots", async (req, res) => {
  try {
    const doctorId = Number(req.query.doctorId);
    const date = toDateOnly(req.query.date);
    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    const booked = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: date,
        status: { [Op.in]: ["pending", "accepted"] },
      },
      attributes: ["timeSlot"],
    });

    return res.json({
      bookedSlots: booked.map((item) => item.timeSlot),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch booked slots", error: error.message });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const doctorId = Number(req.body.doctorId);
    const departmentId = req.body.departmentId ? Number(req.body.departmentId) : null;
    const appointmentDate = toDateOnly(req.body.appointmentDate);
    const timeSlot = String(req.body.timeSlot || "").trim();
    const notes = String(req.body.notes || "").trim();

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: "Invalid appointment data" });
    }

    const doctor = await Doctor.findOne({ where: { id: doctorId, isActive: true } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found or inactive" });
    }

    const conflict = await Appointment.findOne({
      where: {
        doctorId: doctor.id,
        appointmentDate,
        timeSlot,
        status: { [Op.in]: ["pending", "accepted"] },
      },
    });

    if (conflict) {
      return res.status(409).json({ message: "This slot is already booked" });
    }

    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId: doctor.id,
      departmentId: departmentId || doctor.departmentId || null,
      appointmentDate,
      timeSlot,
      notes,
    });

    const populated = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "fullName", "specialty"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
    });

    return res.status(201).json({
      appointment: mapAppointment(populated),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment", error: error.message });
  }
});

router.get("/appointments/:appointmentId/reports", async (req, res) => {
  try {
    const appointment = await getOwnedAppointment(req.user.id, req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const reports = await MedicalReport.findAll({
      where: { appointmentId: appointment.id },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      reports: reports.map(mapReport),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reports", error: error.message });
  }
});

router.post("/appointments/:appointmentId/reports", (req, res, next) => {
  uploadReport.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    return next();
  });
});

router.post("/appointments/:appointmentId/reports", async (req, res) => {
  try {
    const appointment = await getOwnedAppointment(req.user.id, req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.status !== "accepted") {
      return res.status(400).json({ message: "Reports can be uploaded only for accepted appointments" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const relativePath = path.relative(BACKEND_ROOT, req.file.path).replace(/\\/g, "/");
    const report = await MedicalReport.create({
      appointmentId: appointment.id,
      patientId: req.user.id,
      fileName: req.file.originalname,
      filePath: relativePath,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    return res.status(201).json({
      report: mapReport(report),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload report", error: error.message });
  }
});

router.delete("/reports/:reportId", async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    const report = await MedicalReport.findOne({
      where: {
        id: reportId,
        patientId: req.user.id,
      },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    await report.destroy();

    const absoluteFilePath = path.join(BACKEND_ROOT, report.filePath);
    fs.promises.unlink(absoluteFilePath).catch(() => {});

    return res.json({ message: "Report deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete report", error: error.message });
  }
});

module.exports = router;
