import { z } from "zod";

export const mediaInputSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  altText: z.string().optional().nullable()
});

export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
