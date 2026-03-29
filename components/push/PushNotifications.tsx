"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

export function PushNotifications({ onToast }: { onToast: (msg: string, type?: "success" | "error") => void }) {
  const { data: session, status } = useSession();
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
  }, []);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/push/vapid");
    const j = (await r.json()) as { configured?: boolean; publicKey?: string | null };
    setConfigured(Boolean(j.configured && j.publicKey));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!supported || !session || !configured) return;
    let cancelled = false;
    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setSubscribed(!!sub);
      } catch {
        if (!cancelled) setSubscribed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported, session, configured]);

  const subscribe = async () => {
    if (status !== "authenticated" || !session) {
      onToast("Sign in to enable push notifications.", "error");
      return;
    }
    const vapid = await fetch("/api/push/vapid").then((r) => r.json() as Promise<{ publicKey?: string | null }>);
    if (!vapid.publicKey) {
      onToast("Push is not configured (VAPID keys missing on server).", "error");
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        onToast("Notification permission denied.", "error");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        onToast("Invalid subscription.", "error");
        return;
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || res.statusText);
      }
      setSubscribed(true);
      onToast("Push notifications enabled.");
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      if (sub) await sub.unsubscribe();
      if (endpoint) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, { method: "DELETE" });
      } else {
        await fetch("/api/push/subscribe", { method: "DELETE" });
      }
      setSubscribed(false);
      onToast("Push notifications disabled.");
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const testSelf = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push/notify-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test notification", body: "If you see this, web push is working." }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || res.statusText);
      }
      onToast("Test notification sent to your subscribed devices.");
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <p className="text-[12px]" style={{ color: "var(--text3)" }}>
        Sign in to enable browser push notifications.
      </p>
    );
  }

  if (!supported) {
    return (
      <p className="text-[12px]" style={{ color: "var(--text3)" }}>
        Push notifications are not supported in this browser.
      </p>
    );
  }

  if (!configured) {
    return (
      <p className="text-[12px]" style={{ color: "var(--text3)" }}>
        Server push keys (VAPID) are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {subscribed ? (
          <button
            type="button"
            onClick={() => void unsubscribe()}
            disabled={loading}
            className="ui-btn-secondary gap-2 text-[12px]"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <BellOff size={14} />}
            Disable push
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void subscribe()}
            disabled={loading}
            className="ui-btn-secondary gap-2 text-[12px]"
            style={{ borderColor: "rgba(16,185,129,0.35)", color: "var(--green)" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
            Enable push
          </button>
        )}
        {subscribed && (
          <button type="button" onClick={() => void testSelf()} disabled={loading} className="ui-btn-secondary text-[12px]">
            Send test
          </button>
        )}
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text3)" }}>
        Delivers when the tab is open or closed (service worker). Use HTTPS in production.
      </p>
    </div>
  );
}
