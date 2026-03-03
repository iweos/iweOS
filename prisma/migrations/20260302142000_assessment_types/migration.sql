CREATE TABLE "assessment_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "weight" INTEGER NOT NULL,
  "order_index" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "assessment_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessment_types_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "assessment_types_school_id_name_key" ON "assessment_types"("school_id", "name");
CREATE INDEX "assessment_types_school_id_idx" ON "assessment_types"("school_id");
CREATE INDEX "assessment_types_school_id_order_index_idx" ON "assessment_types"("school_id", "order_index");

CREATE TABLE "score_assessment_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "school_id" UUID NOT NULL,
  "score_id" UUID NOT NULL,
  "assessment_type_id" UUID NOT NULL,
  "value" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "score_assessment_values_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "score_assessment_values_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "score_assessment_values_score_id_fkey" FOREIGN KEY ("score_id") REFERENCES "scores"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "score_assessment_values_assessment_type_id_fkey" FOREIGN KEY ("assessment_type_id") REFERENCES "assessment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "score_assessment_values_score_id_assessment_type_id_key" ON "score_assessment_values"("score_id", "assessment_type_id");
CREATE INDEX "score_assessment_values_school_id_idx" ON "score_assessment_values"("school_id");
CREATE INDEX "score_assessment_values_assessment_type_id_idx" ON "score_assessment_values"("assessment_type_id");

CREATE OR REPLACE FUNCTION set_score_assessment_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_score_assessment_values_updated_at
BEFORE UPDATE ON "score_assessment_values"
FOR EACH ROW
EXECUTE FUNCTION set_score_assessment_values_updated_at();

INSERT INTO "assessment_types" ("id", "school_id", "name", "weight", "order_index", "is_active", "created_at")
SELECT gen_random_uuid(), s.id, 'CA1', 20, 1, true, now()
FROM "schools" s
WHERE NOT EXISTS (
  SELECT 1 FROM "assessment_types" at WHERE at."school_id" = s.id AND LOWER(at."name") = 'ca1'
);

INSERT INTO "assessment_types" ("id", "school_id", "name", "weight", "order_index", "is_active", "created_at")
SELECT gen_random_uuid(), s.id, 'CA2', 20, 2, true, now()
FROM "schools" s
WHERE NOT EXISTS (
  SELECT 1 FROM "assessment_types" at WHERE at."school_id" = s.id AND LOWER(at."name") = 'ca2'
);

INSERT INTO "assessment_types" ("id", "school_id", "name", "weight", "order_index", "is_active", "created_at")
SELECT gen_random_uuid(), s.id, 'EXAM', 60, 3, true, now()
FROM "schools" s
WHERE NOT EXISTS (
  SELECT 1 FROM "assessment_types" at WHERE at."school_id" = s.id AND LOWER(at."name") = 'exam'
);
