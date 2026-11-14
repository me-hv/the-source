import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name must be under 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be under 500 characters")
    .optional()
    .nullable(),
  isPersonal: z.boolean().default(true),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
