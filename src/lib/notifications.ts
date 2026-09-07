import { prisma } from "./db";

export async function notify(
  workspaceId: string,
  title: string,
  body?: string,
  userId?: string,
): Promise<void> {
  await prisma.notification.create({ data: { workspaceId, title, body, userId } });
}
