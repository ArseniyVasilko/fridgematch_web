"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const subscriptionSchema = z.object({
  endpoint: z.string().max(2048).url().refine((value) => {
    const url = new URL(value);
    const host = url.hostname;

    return url.protocol === "https:" &&
      !url.username && !url.password && !url.port &&
      (
        host === "fcm.googleapis.com" ||
        host === "updates.push.services.mozilla.com" ||
        host === "web.push.apple.com" ||
        host.endsWith(".web.push.apple.com") ||
        host.endsWith(".notify.windows.com")
      );
  }, "Unsupported push service."),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
  }),
});

export async function savePushSubscription(input: unknown) {
  const userId = await requireUserId("/pantry");
  const { endpoint, keys } = subscriptionSchema.parse(input);

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, userId, ...keys },
    update: { userId, ...keys, lastSentDay: null },
  });
}

export async function removePushSubscription(endpoint: string) {
  const userId = await requireUserId("/pantry");
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

export async function hasPushSubscription(endpoint: string) {
  const userId = await requireUserId("/pantry");
  return (await prisma.pushSubscription.count({
    where: { endpoint, userId },
  })) > 0;
}