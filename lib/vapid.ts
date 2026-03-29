import webpush from "web-push";

let configured = false;

export function configureWebPush() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@localhost";
  if (!pub || !priv) return;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export function isWebPushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export { webpush };
