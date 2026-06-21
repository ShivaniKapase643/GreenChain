/**
 * In-process notification bus.
 *
 * The frontend uses an in-app Toast UI for user-facing alerts (see
 * src/components/Toast.tsx) instead of the browser's intrusive
 * Notification API. This service keeps the same public surface the hooks
 * already depend on — listeners receive payloads when alerts fire — but
 * does not trigger system-level browser notifications anymore.
 */

export interface AlertNotificationPayload {
  id: string;
  shipment_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

type NotificationShape = {
  request: {
    content: {
      data: Record<string, unknown>;
    };
  };
};

type Listener = (notification: NotificationShape) => void;

const wrap = (data: Record<string, unknown>): NotificationShape => ({
  request: { content: { data } },
});

class NotificationService {
  private listeners = new Set<Listener>();

  async requestPermissions(): Promise<boolean> {
    // No-op: we use in-app toasts. Returning true keeps the existing
    // contract used by hooks.
    return true;
  }

  private emit(data: Record<string, unknown>) {
    const payload = wrap(data);
    this.listeners.forEach(listener => {
      try {
        listener(payload);
      } catch {
        // best-effort
      }
    });
  }

  async sendAlertNotification(alert: AlertNotificationPayload): Promise<string> {
    const data = {
      type: 'alert',
      alert_id: alert.id,
      shipment_id: alert.shipment_id,
      severity: alert.severity,
      alert_type: alert.alert_type,
      message: alert.message,
    };
    this.emit(data);
    return `local-${alert.id}`;
  }

  async sendImmediateNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<string> {
    const data = { ...notification.data, title: notification.title, body: notification.body };
    this.emit(data);
    return `local-${Date.now()}`;
  }

  async cancelNotification(): Promise<void> {
    return;
  }

  async cancelAllNotifications(): Promise<void> {
    return;
  }

  addNotificationReceivedListener(listener: Listener) {
    this.listeners.add(listener);
    return {
      remove: () => {
        this.listeners.delete(listener);
      },
    };
  }

  addNotificationResponseReceivedListener(listener: Listener) {
    return this.addNotificationReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();
