const fs = require("fs");
const path = require("path");
const express = require("express");
const { Department, Doctor, GalleryItem, User, Appointment, Op } = require("../models");
const { sendFeedbackEmail } = require("../utils/mailer");
const { mapDepartment, mapDoctor, mapGalleryItem, mapAppointment } = require("../utils/serializers");
const { toDateOnly } = require("../utils/date");
const crypto = require("crypto");

const router = express.Router();
const BACKEND_ROOT = path.resolve(__dirname, "../..");
const toGalleryImageUrl = (itemId) => `/api/public/gallery/${itemId}/image`;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;
const FEEDBACK_MAX_PER_WINDOW = 5;
const FEEDBACK_MIN_INTERVAL_MS = 30 * 1000;
const feedbackRateLimitState = new Map();

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0] || "").trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const checkFeedbackRateLimit = (ip) => {
  const key = ip || "unknown";
  const now = Date.now();
  const state = feedbackRateLimitState.get(key) || { timestamps: [], lastAt: 0 };
  const timestamps = state.timestamps.filter((time) => now - time <= FEEDBACK_WINDOW_MS);

  if (state.lastAt && now - state.lastAt < FEEDBACK_MIN_INTERVAL_MS) {
    const retryAfterMs = FEEDBACK_MIN_INTERVAL_MS - (now - state.lastAt);
    return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }
  if (timestamps.length >= FEEDBACK_MAX_PER_WINDOW) {
    const retryAfterMs = FEEDBACK_WINDOW_MS - (now - timestamps[0]);
    return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  timestamps.push(now);
  feedbackRateLimitState.set(key, { timestamps, lastAt: now });
  return { allowed: true, retryAfterSeconds: 0 };
};

router.get("/departments", async (_req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });

    return res.json({
      departments: departments.map(mapDepartment),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
});

router.get("/book-meta", async (_req, res) => {
  try {
    const [departments, doctors] = await Promise.all([
      Department.findAll({ where: { isActive: true }, order: [["name", "ASC"]] }),
      Doctor.findAll({
        where: { isActive: true },
        order: [["fullName", "ASC"]],
        include: [
          { model: Department, as: "department", attributes: ["id", "name"] },
          { model: User, as: "user", attributes: ["id"] },
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
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const doctorId = Number(req.body.doctorId);
    const departmentId = req.body.departmentId ? Number(req.body.departmentId) : null;
    const appointmentDate = toDateOnly(req.body.appointmentDate);
    const timeSlot = String(req.body.timeSlot || "").trim();
    const notes = String(req.body.notes || "").trim();

    if (fullName.length < 2 || fullName.length > 120) {
      return res.status(400).json({ message: "Please enter a valid full name" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: "Doctor, date, and time slot are required" });
    }
    if (phone.length > 30) {
      return res.status(400).json({ message: "Phone number is too long" });
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

    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        fullName,
        email,
        phone,
        role: "patient",
        isActive: true,
        passwordHash: await User.hashPassword(crypto.randomBytes(12).toString("hex")),
      },
    });

    const appointment = await Appointment.create({
      patientId: user.id,
      doctorId: doctor.id,
      departmentId: departmentId || doctor.departmentId || null,
      appointmentDate,
      timeSlot,
      notes,
    });

    const populated = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Doctor, as: "doctor", attributes: ["id", "fullName", "specialty"] },
        { model: Department, as: "department", attributes: ["id", "name"] },
      ],
    });

    return res.status(201).json({ appointment: mapAppointment(populated) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment", error: error.message });
  }
});

router.get("/doctors", async (req, res) => {
  try {
    const filter = { isActive: true };
    const departmentId = Number(req.query.departmentId);
    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const doctors = await Doctor.findAll({
      where: filter,
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
    });

    return res.json({
      doctors: doctors.map(mapDoctor),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
  }
});

router.get("/gallery", async (_req, res) => {
  try {
    const items = await GalleryItem.findAll({
      where: { isActive: true },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      items: items.map((item) => ({
        ...mapGalleryItem(item),
        imageUrl: toGalleryImageUrl(item.id),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch gallery", error: error.message });
  }
});

router.get("/gallery/:galleryId/image", async (req, res) => {
  try {
    const item = await GalleryItem.findByPk(Number(req.params.galleryId), {
      attributes: ["id", "filePath", "fileType"],
    });
    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    const absolutePath = path.join(BACKEND_ROOT, item.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Image file not found" });
    }

    if (item.fileType) {
      res.type(item.fileType);
    }
    return res.sendFile(absolutePath);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load image", error: error.message });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const message = String(req.body.message || "").trim();

    if (fullName.length < 2 || fullName.length > 120) {
      return res.status(400).json({ message: "Please enter a valid full name" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (phone.length > 30) {
      return res.status(400).json({ message: "Phone number is too long" });
    }
    if (message.length < 10 || message.length > 3000) {
      return res.status(400).json({ message: "Feedback message should be between 10 and 3000 characters" });
    }

    const clientIp = getRequestIp(req);
    const rateCheck = checkFeedbackRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        message: "Too many feedback submissions. Please try again later.",
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    let mailResult;
    try {
      mailResult = await sendFeedbackEmail({
        fullName,
        email,
        phone,
        message,
        submittedAt: new Date(),
        clientIp,
        userAgent: String(req.headers["user-agent"] || ""),
      });
    } catch (mailError) {
      if (mailError?.code === "EAUTH") {
        return res.status(502).json({
          message: "SMTP authentication failed. Check SMTP_USER and SMTP_PASS (use App Password for Gmail).",
        });
      }
      if (mailError?.code === "ESOCKET" || mailError?.code === "ECONNECTION") {
        return res.status(502).json({
          message: "Could not connect to SMTP server. Check SMTP_HOST, SMTP_PORT, and network access.",
        });
      }

      return res.status(500).json({
        message: "Failed to send feedback email",
        error: mailError?.message || "Unknown mail error",
      });
    }

    if (!mailResult.ok) {
      return res.status(503).json({
        message: "Feedback service is not configured. Please contact the administrator.",
      });
    }

    return res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit feedback", error: error.message });
  }
});

module.exports = router;
