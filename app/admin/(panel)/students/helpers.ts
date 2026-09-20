/**
 * The two kinds of helper the admin may issue, and what each is called.
 * Kept apart from the actions file, which may export only actions.
 */
export const HELPER_ROLES = {
  staff: { label: "Staff — resets students' passwords", home: "/admin/passwords" },
  editor: { label: "Test setter — writes and publishes papers", home: "/admin/watch-table" },
} as const;

export type HelperRole = keyof typeof HELPER_ROLES;

export function isHelperRole(role: string): role is HelperRole {
  return role in HELPER_ROLES;
}
