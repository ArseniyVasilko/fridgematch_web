import { sendNotification, setVapidDetails } from "web-push";
import { prisma } from "@/lib/db";
import { isExpiringSoon } from "@/lib/expiry";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return new Response("Push keys are missing", { status: 500 });
  }

  setVapidDetails(subject, publicKey, privateKey);

  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { OR: [{ lastSentDay: null }, { lastSentDay: { not: day } }] },
  });

  const items = await prisma.pantryItem.findMany({
    where: {
      userId: { in: [...new Set(subscriptions.map(({ userId }) => userId))] },
      expiryDate: { not: null },
    },
    select: { userId: true, expiryDate: true },
  });

  const counts = new Map<number, number>();
  for (const item of items) {
    if (isExpiringSoon(item.expiryDate, now)) {
      counts.set(item.userId, (counts.get(item.userId) ?? 0) + 1);
    }
  }

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const { userId, endpoint, p256dh, auth, lastSentDay } = subscription;
    const count = counts.get(userId) ?? 0;
    if (!count) continue;

    const claimed = await prisma.pushSubscription.updateMany({
      where: { endpoint, userId, lastSentDay },
      data: { lastSentDay: day },
    });
    if (!claimed.count) continue;

    const message = count === 1
      ? "1 pantry item expires soon."
      : `${count} pantry items expire soon.`;

    try {
      await sendNotification(
        { endpoint, keys: { p256dh, auth } },
        message,
        { TTL: 3600, timeout: 5000 },
      );
      sent++;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      const where = { endpoint, userId, lastSentDay: day };

      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.deleteMany({ where });
      } else {
        await prisma.pushSubscription.updateMany({
          where,
          data: { lastSentDay },
        });
        failed++;
      }
    }
  }

  return Response.json({ sent, failed });
}