const express = require("express");
const { Appointment, Department, Doctor, MedicalReport, User, Op } = require("../models");
const { authRequired, requireRoles } = require("../middleware/auth");
const { mapAppointment, mapReport } = require("../utils/serializers");
const { toDateOnly, todayDateOnly } = require("../utils/date");

const router = express.Router();

router.use(authRequired, requireRoles("doctor"));

const getDoctorByUserId = async (userId) => {
  return Doctor.findOne({ where: { userId } });
};

router.get("/dashboard", async (req, res) => {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
      include: [
        {
          model: User,
          as: "patient",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
      order: [["appointmentDate", "ASC"]],
    });

    const stats = {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === "pending").length,
      accepted: appointments.filter((item) => item.status === "accepted").length,
      rejected: appointments.filter((item) => item.status === "rejected").length,
    };

    const today = todayDateOnly();
    const upcoming = appointments
      .filter((item) => item.appointmentDate >= today && !["rejected", "cancelled"].includes(item.status))
      .slice(0, 5)
      .map(mapAppointment);

    return res.json({
      doctorId: String(doctor.id),
      stats,
      upcoming,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctor dashboard", error: error.message });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const filter = { doctorId: doctor.id };
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
          model: User,
          as: "patient",
          attributes: ["id", "fullName", "email", "phone"],
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
    return res.status(500).json({ message: "Failed to fetch doctor appointments", error: error.message });
  }
});

router.patch("/appointments/:appointmentId/status", async (req, res) => {
  try {
    const status = String(req.body.status || "");
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status" });
    }

    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointmentId = Number(req.params.appointmentId);
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (status === "accepted") {
      const conflict = await Appointment.findOne({
        where: {
          id: { [Op.ne]: appointment.id },
          doctorId: doctor.id,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot,
          status: { [Op.in]: ["pending", "accepted"] },
        },
      });

      if (conflict) {
        return res.status(409).json({ message: "This slot is already booked" });
      }
    }

    appointment.status = status;
    await appointment.save();

    const populated = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "fullName", "specialty"],
        },
        {
          model: User,
          as: "patient",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
    });

    return res.json({
      appointment: mapAppointment(populated),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update appointment status", error: error.message });
  }
});

router.get("/availability", async (req, res) => {
  try {
    const date = toDateOnly(req.query.date);
    if (!date) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const bookings = await Appointment.findAll({
      where: {
        doctorId: doctor.id,
        appointmentDate: date,
        status: { [Op.in]: ["pending", "accepted"] },
      },
      attributes: ["timeSlot"],
    });

    return res.json({
      bookedSlots: bookings.map((item) => item.timeSlot),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch availability", error: error.message });
  }
});

router.get("/appointments/:appointmentId/reports", async (req, res) => {
  try {
    const doctor = await getDoctorByUserId(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointmentId = Number(req.params.appointmentId);
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });
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

module.exports = router;
