const { toDateOnlyString } = require("./date");

const getId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object") {
    if (value.id !== undefined && value.id !== null) {
      return String(value.id);
    }
    if (value._id !== undefined && value._id !== null) {
      return String(value._id);
    }
  }
  return String(value);
};

const mapDepartment = (department) => {
  if (!department) {
    return null;
  }
  return {
    id: getId(department.id),
    name: department.name,
    description: department.description || "",
    icon: department.icon || "Stethoscope",
    isActive: Boolean(department.isActive),
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
};

const mapDoctor = (doctor) => {
  if (!doctor) {
    return null;
  }

  const userRef = doctor.user || doctor.userId;
  const departmentRef = doctor.department || doctor.departmentId;

  return {
    id: getId(doctor.id),
    userId: getId(userRef),
    fullName: doctor.fullName,
    specialty: doctor.specialty,
    qualification: doctor.qualification || "",
    experienceYears: doctor.experienceYears || 0,
    bio: doctor.bio || "",
    avatarUrl: doctor.avatarUrl || "",
    isActive: Boolean(doctor.isActive),
    departmentId: getId(departmentRef),
    department: departmentRef && typeof departmentRef === "object"
      ? {
          id: getId(departmentRef.id),
          name: departmentRef.name,
        }
      : null,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
};

const mapAppointment = (appointment) => {
  if (!appointment) {
    return null;
  }

  const doctorRef = appointment.doctor || appointment.doctorId;
  const patientRef = appointment.patient || appointment.patientId;
  const departmentRef = appointment.department || appointment.departmentId;

  return {
    id: getId(appointment.id),
    appointmentDate: toDateOnlyString(appointment.appointmentDate),
    timeSlot: appointment.timeSlot,
    status: appointment.status,
    notes: appointment.notes || "",
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    doctorId: getId(doctorRef),
    patientId: getId(patientRef),
    departmentId: getId(departmentRef),
    doctor: doctorRef && typeof doctorRef === "object"
      ? {
          id: getId(doctorRef.id),
          fullName: doctorRef.fullName,
          specialty: doctorRef.specialty,
        }
      : null,
    patient: patientRef && typeof patientRef === "object"
      ? {
          id: getId(patientRef.id),
          fullName: patientRef.fullName,
          email: patientRef.email,
          phone: patientRef.phone || "",
        }
      : null,
    department: departmentRef && typeof departmentRef === "object"
      ? {
          id: getId(departmentRef.id),
          name: departmentRef.name,
        }
      : null,
  };
};

const mapReport = (report) => {
  if (!report) {
    return null;
  }

  return {
    id: getId(report.id),
    appointmentId: getId(report.appointment || report.appointmentId),
    patientId: getId(report.patient || report.patientId),
    fileName: report.fileName,
    filePath: report.filePath,
    fileType: report.fileType,
    fileSize: report.fileSize,
    createdAt: report.createdAt,
  };
};

const mapGalleryItem = (galleryItem) => {
  if (!galleryItem) {
    return null;
  }

  const uploaderRef = galleryItem.uploadedBy || galleryItem.uploadedById;

  return {
    id: getId(galleryItem.id),
    title: galleryItem.title,
    description: galleryItem.description || "",
    fileName: galleryItem.fileName,
    fileType: galleryItem.fileType,
    fileSize: galleryItem.fileSize,
    isActive: Boolean(galleryItem.isActive),
    uploadedBy: uploaderRef && typeof uploaderRef === "object"
      ? {
          id: getId(uploaderRef.id),
          fullName: uploaderRef.fullName,
          email: uploaderRef.email,
        }
      : uploaderRef
        ? { id: getId(uploaderRef) }
        : null,
    createdAt: galleryItem.createdAt,
    updatedAt: galleryItem.updatedAt,
  };
};

module.exports = {
  mapDepartment,
  mapDoctor,
  mapAppointment,
  mapReport,
  mapGalleryItem,
};
