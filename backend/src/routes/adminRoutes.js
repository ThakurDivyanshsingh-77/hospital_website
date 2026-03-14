const fs = require("fs");
const path = require("path");
const express = require("express");
const {
  Appointment,
  Department,
  Doctor,
  GalleryItem,
  User,
  sequelize,
  Op,
  fn,
  col,
} = require("../models");
const { authRequired, requireRoles } = require("../middleware/auth");
const { uploadGallery } = require("../middleware/upload");
const { mapAppointment, mapDepartment, mapDoctor, mapGalleryItem } = require("../utils/serializers");

const router = express.Router();
const BACKEND_ROOT = path.resolve(__dirname, "../..");
const toGalleryImageUrl = (itemId) => `/api/public/gallery/${itemId}/image`;

const isUniqueConstraintError = (error) => {
  return error?.name === "SequelizeUniqueConstraintError";
};

router.use(authRequired, requireRoles("admin"));

router.get("/gallery", async (_req, res) => {
  try {
    const items = await GalleryItem.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "uploadedBy",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    return res.json({
      items: items.map((item) => ({
        ...mapGalleryItem(item),
        imageUrl: toGalleryImageUrl(item.id),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch gallery items", error: error.message });
  }
});

router.post("/gallery", (req, res) => {
  uploadGallery.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Invalid upload request" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      const rawTitle = String(req.body.title || "").trim();
      const title = rawTitle || req.file.originalname.replace(/\.[^/.]+$/, "");
      const description = String(req.body.description || "").trim();
      const filePath = path.relative(BACKEND_ROOT, req.file.path).split(path.sep).join("/");

      const item = await GalleryItem.create({
        title,
        description,
        fileName: req.file.originalname,
        filePath,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedById: req.user.id,
      });

      const populatedItem = await GalleryItem.findByPk(item.id, {
        include: [
          {
            model: User,
            as: "uploadedBy",
            attributes: ["id", "fullName", "email"],
          },
        ],
      });

      return res.status(201).json({
        item: {
          ...mapGalleryItem(populatedItem),
          imageUrl: toGalleryImageUrl(populatedItem.id),
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to upload gallery image", error: error.message });
    }
  });
});

router.patch("/gallery/:galleryId/active", async (req, res) => {
  try {
    const galleryId = Number(req.params.galleryId);
    const item = await GalleryItem.findByPk(galleryId);

    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    item.isActive = Boolean(req.body.isActive);
    await item.save();

    const populated = await GalleryItem.findByPk(item.id, {
      include: [
        {
          model: User,
          as: "uploadedBy",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    return res.json({
      item: {
        ...mapGalleryItem(populated),
        imageUrl: toGalleryImageUrl(populated.id),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update gallery item", error: error.message });
  }
});

router.delete("/gallery/:galleryId", async (req, res) => {
  try {
    const galleryId = Number(req.params.galleryId);
    const item = await GalleryItem.findByPk(galleryId);
    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    const absolutePath = path.join(BACKEND_ROOT, item.filePath);
    await item.destroy();

    fs.promises.unlink(absolutePath).catch(() => {});
    return res.json({ message: "Gallery item deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete gallery item", error: error.message });
  }
});

router.get("/dashboard", async (_req, res) => {
  try {
    const monthExpr = fn("DATE_FORMAT", col("appointmentDate"), "%Y-%m");

    const [
      totalDoctors,
      totalAppointments,
      totalDepartments,
      pendingAppointments,
      recentAppointments,
      statusCounts,
      monthlyAppointments,
      doctorWiseResult,
    ] = await Promise.all([
      Doctor.count(),
      Appointment.count(),
      Department.count(),
      Appointment.count({ where: { status: "pending" } }),
      Appointment.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
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
      }),
      Appointment.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        raw: true,
      }),
      Appointment.findAll({
        attributes: [[monthExpr, "month"], [fn("COUNT", col("id")), "count"]],
        group: [monthExpr],
        order: [[monthExpr, "ASC"]],
        raw: true,
      }),
      sequelize.query(
        "SELECT d.id AS doctorId, d.fullName AS doctorName, COUNT(a.id) AS count FROM appointments a INNER JOIN doctors d ON d.id = a.doctorId GROUP BY d.id, d.fullName ORDER BY count DESC"
      ),
    ]);

    const doctorWiseRows = Array.isArray(doctorWiseResult) ? doctorWiseResult[0] : [];

    return res.json({
      stats: {
        totalDoctors,
        totalAppointments,
        totalDepartments,
        pendingAppointments,
        statusBreakdown: statusCounts.map((item) => ({ status: item.status, count: Number(item.count) })),
        monthlyAppointments: monthlyAppointments.map((item) => ({ month: item.month, count: Number(item.count) })),
        doctorWiseAppointments: doctorWiseRows.map((item) => ({
          doctorId: String(item.doctorId),
          doctorName: item.doctorName,
          count: Number(item.count),
        })),
      },
      recentAppointments: recentAppointments.map(mapAppointment),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admin dashboard", error: error.message });
  }
});

router.get("/departments", async (_req, res) => {
  try {
    const departments = await Department.findAll({
      order: [["name", "ASC"]],
    });

    return res.json({
      departments: departments.map(mapDepartment),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
});

router.post("/departments", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const department = await Department.create({ name, description });
    return res.status(201).json({
      department: mapDepartment(department),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ message: "Department already exists" });
    }
    return res.status(500).json({ message: "Failed to create department", error: error.message });
  }
});

router.put("/departments/:departmentId", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const departmentId = Number(req.params.departmentId);
    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    department.name = name;
    department.description = description;
    await department.save();

    return res.json({
      department: mapDepartment(department),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ message: "Department already exists" });
    }
    return res.status(500).json({ message: "Failed to update department", error: error.message });
  }
});

router.patch("/departments/:departmentId/active", async (req, res) => {
  try {
    const departmentId = Number(req.params.departmentId);
    const department = await Department.findByPk(departmentId);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    department.isActive = Boolean(req.body.isActive);
    await department.save();

    return res.json({
      department: mapDepartment(department),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update department status", error: error.message });
  }
});

router.delete("/departments/:departmentId", async (req, res) => {
  try {
    const departmentId = Number(req.params.departmentId);
    const doctorCount = await Doctor.count({ where: { departmentId } });
    if (doctorCount > 0) {
      return res.status(409).json({ message: "Cannot delete a department linked to doctors" });
    }

    const deleted = await Department.findByPk(departmentId);
    if (!deleted) {
      return res.status(404).json({ message: "Department not found" });
    }

    await deleted.destroy();
    return res.json({ message: "Department deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete department", error: error.message });
  }
});

router.get("/doctors", async (_req, res) => {
  try {
    const doctors = await Doctor.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
        },
      ],
    });

    return res.json({
      doctors: doctors.map((doctor) => ({
        ...mapDoctor(doctor),
        email: doctor.user?.email || "",
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
  }
});

router.post("/doctors", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const fullName = String(req.body.fullName || "").trim();
    const specialty = String(req.body.specialty || "").trim();
    const qualification = String(req.body.qualification || "").trim();
    const experienceYears = Number(req.body.experienceYears || 0);
    const departmentId = req.body.departmentId ? Number(req.body.departmentId) : null;
    const bio = String(req.body.bio || "").trim();

    if (!email || password.length < 6 || !fullName || !specialty) {
      return res.status(400).json({ message: "Invalid doctor data" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const { doctor, doctorUser } = await sequelize.transaction(async (transaction) => {
      const passwordHash = await User.hashPassword(password);
      const doctorUser = await User.create(
        {
          fullName,
          email,
          passwordHash,
          role: "doctor",
        },
        { transaction }
      );

      const doctor = await Doctor.create(
        {
          userId: doctorUser.id,
          departmentId: departmentId || null,
          fullName,
          specialty,
          qualification,
          experienceYears,
          bio,
        },
        { transaction }
      );

      const populatedDoctor = await Doctor.findByPk(doctor.id, {
        include: [
          {
            model: Department,
            as: "department",
            attributes: ["id", "name"],
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "email"],
          },
        ],
        transaction,
      });

      return { doctor: populatedDoctor, doctorUser };
    });

    return res.status(201).json({
      doctor: {
        ...mapDoctor(doctor),
        email: doctorUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create doctor", error: error.message });
  }
});

router.put("/doctors/:doctorId", async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const doctor = await Doctor.findByPk(doctorId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "fullName"],
        },
      ],
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const fullName = String(req.body.fullName || doctor.fullName).trim();
    const specialty = String(req.body.specialty || doctor.specialty).trim();
    const qualification = String(req.body.qualification || "").trim();
    const experienceYears = Number(
      req.body.experienceYears !== undefined ? req.body.experienceYears : doctor.experienceYears
    );
    const departmentId = req.body.departmentId ? Number(req.body.departmentId) : null;
    const bio = String(req.body.bio ?? doctor.bio ?? "").trim();

    doctor.fullName = fullName;
    doctor.specialty = specialty;
    doctor.qualification = qualification;
    doctor.experienceYears = Number.isNaN(experienceYears) ? 0 : experienceYears;
    doctor.departmentId = departmentId;
    doctor.bio = bio;
    await doctor.save();

    if (doctor.user) {
      doctor.user.fullName = fullName;
      await doctor.user.save();
    }

    await doctor.reload({
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
        },
      ],
    });

    return res.json({
      doctor: {
        ...mapDoctor(doctor),
        email: doctor.user?.email || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update doctor", error: error.message });
  }
});

router.patch("/doctors/:doctorId/active", async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const doctor = await Doctor.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = Boolean(req.body.isActive);
    await doctor.save();

    await doctor.reload({
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
        },
      ],
    });

    return res.json({
      doctor: {
        ...mapDoctor(doctor),
        email: doctor.user?.email || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update doctor status", error: error.message });
  }
});

router.delete("/doctors/:doctorId", async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const activeAppointments = await Appointment.count({
      where: {
        doctorId: doctor.id,
        status: { [Op.in]: ["pending", "accepted"] },
      },
    });

    if (activeAppointments > 0) {
      return res.status(409).json({ message: "Doctor has active appointments and cannot be deleted" });
    }

    await Appointment.destroy({
      where: {
        doctorId: doctor.id,
        status: { [Op.in]: ["rejected", "cancelled"] },
      },
    });

    const userId = doctor.userId;
    await doctor.destroy();
    await User.destroy({ where: { id: userId } });

    return res.json({ message: "Doctor deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete doctor", error: error.message });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") {
      filter.status = String(req.query.status);
    }

    const appointments = await Appointment.findAll({
      where: filter,
      order: [["createdAt", "DESC"]],
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
      appointments: appointments.map(mapAppointment),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
});

module.exports = router;
