import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "~/../generated/prisma/client";

export const prisma = new PrismaClient().$extends(withAccelerate());
