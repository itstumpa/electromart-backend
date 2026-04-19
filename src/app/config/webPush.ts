// src/config/webPush.ts
import webPush from "web-push";

webPush.setVapidDetails(
  process.env.VAPID_EMAIL as string,
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export default webPush;