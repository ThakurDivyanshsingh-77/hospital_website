const path = require("path");
const express = require("express");
const { Appointment, Doctor, MedicalReport } = require("../models");
const { authRequired } = require("../middleware/auth");

const router = express.Router();
const BACKEND_ROOT = path.resolve(__dirname, "../..");

router.use(authRequired);

router.get("/:reportId/download", async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    const report = await MedicalReport.findByPk(reportId, {
      include: [
        {
          model: Appointment,
          as: "appointment",
          include: [
            {
              model: Doctor,
              as: "doctor",
              attributes: ["id", "userId"],
            },
          ],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const canAccess =
      req.user.role === "admin" ||
      (req.user.role === "patient" && report.patientId === req.user.id) ||
      (req.user.role === "doctor" &&
        report.appointment &&
        report.appointment.doctor &&
        report.appointment.doctor.userId === req.user.id);

    if (!canAccess) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const absolutePath = path.join(BACKEND_ROOT, report.filePath);
    return res.download(absolutePath, report.fileName);
  } catch (error) {
    return res.status(500).json({ message: "Failed to download report", error: error.message });
  }
});

module.exports = router;
