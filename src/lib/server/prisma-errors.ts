import { Prisma } from "@prisma/client";

const SCHEMA_MISMATCH_CODES = new Set(["P2021", "P2022"]);
const LEGACY_STUDENT_ARGUMENT_PATTERN = /Unknown argument `(firstName|lastName|address|guardianName|guardianPhone|guardianEmail|gender)`/;
const SCHEMA_MISMATCH_MESSAGE_PATTERN =
  /(column .* does not exist|table .* does not exist|The table `.*` does not exist|schema is out of sync|run npm run prisma:generate)/i;

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "";
}

export function isPrismaSchemaMismatchError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && SCHEMA_MISMATCH_CODES.has(error.code)) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientValidationError && LEGACY_STUDENT_ARGUMENT_PATTERN.test(error.message)) {
    return true;
  }

  return SCHEMA_MISMATCH_MESSAGE_PATTERN.test(extractErrorMessage(error));
}

export function schemaSyncMessage(area: string) {
  return `${area} schema is out of sync. Run npm run prisma:generate && npm run prisma:migrate, then redeploy/restart the app.`;
}
