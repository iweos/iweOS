export function platformAdminEmailAllowed(email: string) {
  const allowed = ["iyanflex@gmail.com", ...(process.env.PLATFORM_ADMIN_EMAILS ?? "").split(",")];
  return allowed.map(value => value.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());
}
