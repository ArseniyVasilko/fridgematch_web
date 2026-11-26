"use client";

import { useEffect, useState } from "react";
import {
  hasPushSubscription,
  removePushSubscription,
  savePushSubscription,
} from "@/app/actions/push";
import { btn } from "@/components/ui";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function decodePublicKey(key: string) {
  const base64 = key.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(
    atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    (character) => character.charCodeAt(0),
  );
}

export function ExpiryPushSettings() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (
      !publicKey ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) return;

    let cancelled = false;
    setAvailable(true);

    async function load() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const saved = subscription
          ? await hasPushSubscription(subscription.endpoint)
          : false;

        if (!cancelled) setEnabled(saved);
      } catch {
        if (!cancelled) setMessage("Could not check your notification settings.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  async function toggle() {
    if (!publicKey) return;
    setBusy(true);
    setMessage("");

    try {
      if (!enabled && await Notification.requestPermission() !== "granted") {
        setMessage("Allow notifications for FridgeMatch in your device settings.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();

      if (enabled) {
        if (current) {
          await removePushSubscription(current.endpoint);
          await current.unsubscribe();
        }

        setEnabled(false);
        setMessage("Expiry notifications are off for this device.");
        return;
      }

      const subscription = current ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodePublicKey(publicKey),
      });

      await savePushSubscription(subscription.toJSON());
      setEnabled(true);
      setMessage("Expiry notifications are on for this device.");
    } catch {
      setMessage("Could not update notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!available) return null;

  return (
    <section aria-labelledby="expiry-notifications" className="mt-6 rounded-2xl border border-line bg-card p-4">
      <h2 id="expiry-notifications" className="font-sans text-lg font-extrabold">
        Expiry notifications
      </h2>
      <p className="mt-1 text-sm text-muted">
        Get a daily reminder on this device when pantry items are expiring soon.
      </p>
      <button type="button" className={`${btn.outline} mt-3`} disabled={busy} onClick={toggle}>
        {busy ? "Checking notifications…" : enabled ? "Turn off notifications" : "Enable expiry notifications"}
      </button>
      {message && <p role="status" className="mt-2 text-sm text-ink">{message}</p>}
    </section>
  );
}