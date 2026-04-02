import { z } from "zod";

const imageAssetSchema = z
  .string()
  .trim()
  .max(8_000_000)
  .refine((value) => !value || value.startsWith("/uploads/") || /^https?:\/\//i.test(value) || /^data:image\/[a-z0-9.+-]+;base64,/i.test(value), {
    message: "Use a valid image URL or upload an image file.",
  })
  .optional()
  .or(z.literal(""));

export const schoolSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(24).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only.").optional(),
  country: z.string().trim().max(120).optional().or(z.literal("")),
  logoUrl: imageAssetSchema,
  principalSignatureUrl: imageAssetSchema,
  addressLine1: z.string().trim().max(180).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(180).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  website: z.string().trim().url().max(255).optional().or(z.literal("")),
  resultTemplate: z.enum(["classic_report", "summary"]).optional().default("classic_report"),
  showOverallPosition: z.boolean().optional().default(true),
  defaultPrincipalComment: z.string().trim().max(1000).optional().or(z.literal("")),
  processingFeePercent: z.coerce.number().int().min(0).max(20).optional(),
  currency: z.string().trim().min(3).max(8).optional(),
  settlementBankName: z.string().trim().max(120).optional().or(z.literal("")),
  settlementAccountName: z.string().trim().max(120).optional().or(z.literal("")),
  settlementAccountNumber: z.string().trim().max(30).optional().or(z.literal("")),
});

export const teacherSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
});

export const classSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const studentSchema = z.object({
  studentCode: z.string().trim().min(1).max(64),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  className: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  guardianName: z.string().trim().max(120).optional().or(z.literal("")),
  guardianPhone: z.string().trim().max(30).optional().or(z.literal("")),
  guardianEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "graduated", "suspended", "withdrawn"]).optional().default("active"),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
  photoUrl: imageAssetSchema,
});

export const studentBulkSchema = z.object({
  studentRows: z.string().trim().optional().or(z.literal("")),
  enrollmentYear: z.coerce.number().int().min(2000).max(2100),
  className: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "graduated", "suspended", "withdrawn"]).optional().default("active"),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
});

export const studentUpdateSchema = z.object({
  studentId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  className: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  guardianName: z.string().trim().max(120).optional().or(z.literal("")),
  guardianPhone: z.string().trim().max(30).optional().or(z.literal("")),
  guardianEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "graduated", "suspended", "withdrawn"]).optional().default("active"),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
  photoUrl: imageAssetSchema,
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const subjectUpdateSchema = z.object({
  subjectId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});

export const classSubjectBatchSchema = z.object({
  classId: z.string().uuid(),
  subjectList: z.string().trim().min(1, "Enter at least one subject."),
});

export const studentSubjectExemptionSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
});

export const termSchema = z.object({
  sessionLabel: z.string().trim().min(1).max(50),
  termLabel: z.string().trim().min(1).max(50),
  isActive: z.boolean().optional().default(false),
});

export const sessionBundleSchema = z.object({
  sessionLabel: z.string().trim().min(1).max(50),
  structure: z.enum(["three_terms", "two_semesters", "custom"]),
  customLabels: z.string().trim().max(500).optional().or(z.literal("")),
  setFirstActive: z.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  if (value.structure !== "custom") {
    return;
  }

  const labels = value.customLabels
    ?.split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  if (labels.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customLabels"],
      message: "Enter at least one custom sub-session label.",
    });
    return;
  }

  if (labels.length > 12) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customLabels"],
      message: "Use at most 12 custom sub-session labels.",
    });
  }

  const normalized = labels.map((label) => label.toLowerCase());
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customLabels"],
      message: "Custom sub-session labels must be unique.",
    });
  }

  const tooLong = labels.find((label) => label.length > 50);
  if (tooLong) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customLabels"],
      message: "Each custom sub-session label must be 50 characters or fewer.",
    });
  }
});

export const teacherAssignmentSchema = z.object({
  teacherProfileId: z.string().uuid(),
  classId: z.string().uuid(),
});

export const classSubjectAssignmentSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
});

export const enrollmentSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  termId: z.string().uuid(),
});

export const enrollmentBulkSchema = z.object({
  classId: z.string().uuid(),
  termId: z.string().uuid(),
});

export const gradingSettingsSchema = z
  .object({
    ca1Weight: z.coerce.number().int().min(0).max(100),
    ca2Weight: z.coerce.number().int().min(0).max(100),
    examWeight: z.coerce.number().int().min(0).max(100),
  })
  .superRefine((value, ctx) => {
    const sum = value.ca1Weight + value.ca2Weight + value.examWeight;
    if (sum !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["examWeight"],
        message: "CA1 + CA2 + Exam must equal 100.",
      });
    }
  });

export const assessmentTypeSchema = z.object({
  id: z.string().uuid().optional(),
  templateId: z.string().uuid(),
  name: z.string().trim().min(1).max(50),
  weight: z.coerce.number().int().min(0).max(100),
  orderIndex: z.coerce.number().int().min(1).max(99),
  isActive: z.boolean().optional().default(true),
});

export const assessmentTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  setActive: z.boolean().optional().default(false),
});

export const assessmentTemplateActivateSchema = z.object({
  templateId: z.string().uuid(),
});

export const termAssessmentTemplateSchema = z.object({
  termId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export const promotionActionSchema = z.object({
  sourceSessionLabel: z.string().trim().min(1).max(50),
  sourceClassId: z.string().uuid(),
  targetSessionLabel: z.string().trim().min(1).max(50),
  targetClassId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1, "Select at least one student to promote."),
});

export const promotionPolicySchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal("")),
    name: z.string().trim().min(2).max(80),
    minimumPassedSubjects: z.coerce.number().int().min(1).max(50),
    minimumAverage: z.coerce.number().min(0).max(100),
    passGradeId: z.string().uuid().optional().or(z.literal("")),
    requiredCompulsorySubjectsAtGrade: z.coerce.number().int().min(0).max(20),
    requiredCompulsoryGradeId: z.string().uuid().optional().or(z.literal("")),
    allowManualOverride: z.boolean().optional().default(true),
    setActive: z.boolean().optional().default(false),
    compulsorySubjectIds: z.array(z.string().uuid()).optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (value.requiredCompulsorySubjectsAtGrade > value.compulsorySubjectIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredCompulsorySubjectsAtGrade"],
        message: "The required compulsory-subject count cannot exceed the selected compulsory subjects.",
      });
    }

    if (value.requiredCompulsorySubjectsAtGrade > 0 && !value.requiredCompulsoryGradeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredCompulsoryGradeId"],
        message: "Choose the grade that compulsory subjects must meet.",
      });
    }
  });

export const promotionPolicySelectionSchema = z.object({
  policyId: z.string().uuid(),
});

export const resultPublicationSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, "Select at least one student result."),
  termId: z.string().uuid(),
  classId: z.string().uuid(),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]),
});

export const studentAttendanceSchema = z
  .object({
    studentId: z.string().uuid(),
    termId: z.string().uuid(),
    classId: z.string().uuid(),
    timesSchoolOpened: z.coerce.number().int().min(0).max(366),
    timesPresent: z.coerce.number().int().min(0).max(366),
    timesAbsent: z.coerce.number().int().min(0).max(366),
  })
  .superRefine((value, ctx) => {
    if (value.timesPresent > value.timesSchoolOpened) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timesPresent"],
        message: "Times present cannot be greater than times school opened.",
      });
    }

    if (value.timesAbsent > value.timesSchoolOpened) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timesAbsent"],
        message: "Times absent cannot be greater than times school opened.",
      });
    }

    if (value.timesPresent + value.timesAbsent !== value.timesSchoolOpened) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timesAbsent"],
        message: "Times school opened must equal times present plus times absent.",
      });
    }
  });

export const studentCommentSchema = z.object({
  studentId: z.string().uuid(),
  termId: z.string().uuid(),
  classId: z.string().uuid(),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const gradeScaleSchema = z.object({
  id: z.string().uuid().optional(),
  gradeLetter: z.string().trim().min(1).max(2),
  minScore: z.coerce.number().int().min(0).max(100),
  maxScore: z.coerce.number().int().min(0).max(100),
  orderIndex: z.coerce.number().int().min(1).max(99),
});

export const conductSectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  orderIndex: z.coerce.number().int().min(1).max(99),
  isActive: z.boolean().optional().default(true),
});

export const conductCategorySchema = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  maxScore: z.coerce.number().min(1).max(100),
  orderIndex: z.coerce.number().int().min(1).max(99),
  isActive: z.boolean().optional().default(true),
});

export const scoreValueSchema = z.coerce.number().min(0).max(100);

export const conductValueSchema = z.coerce.number().min(0).max(100);

export const paymentSettingsSchema = z.object({
  processingFeePercent: z.coerce.number().int().min(0).max(20),
  currency: z.string().trim().min(3).max(8),
  settlementBankName: z.string().trim().max(120).optional().or(z.literal("")),
  settlementAccountName: z.string().trim().max(120).optional().or(z.literal("")),
  settlementAccountNumber: z.string().trim().max(30).optional().or(z.literal("")),
});

export const feeCatalogSchema = z.object({
  type: z.enum(["COMPULSORY", "OTHER"]),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  amount: z.coerce.number().min(0),
  allowQuantity: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  priority: z.coerce.number().int().min(1).max(999).optional().default(100),
});

export const feeScheduleSchema = z.object({
  className: z.string().trim().min(1).max(80),
  sessionLabel: z.string().trim().min(1).max(50),
  termLabel: z.string().trim().min(1).max(50),
  feeItemCatalogId: z.string().uuid(),
  amount: z.coerce.number().min(0),
});

export const parentLookupSchema = z.object({
  paymentIds: z
    .string()
    .trim()
    .min(3)
    .transform((value) =>
      value
        .split(/[,\n]/g)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
});

export const parentInvoiceCreateSchema = z.object({
  schoolId: z.string().uuid(),
  payerEmail: z.string().trim().email(),
  paymentIds: z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  amountToPay: z.coerce.number().min(1),
});
