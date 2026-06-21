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

const createNotificationPayload = (data: Record<string, unknown>): NotificationShape => ({
  request: {
    content: {
      data,
    },
  },
});

class NotificationService {
  private listeners = new Set<Listener>();

  async requestPermissions(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  private emit(data: Record<string, unknown>) {
    const payload = createNotificationPayload(data);
    this.listeners.forEach(listener => {
      try {
        listener(payload);
      } catch {
        // Keep notifications best-effort on the web.
      }
    });
  }

  private async showBrowserNotification(title: string, body: string, data: Record<string, unknown>) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, { body });
    notification.onclick = () => {
      this.emit(data);
      window.focus();
    };
  }

  async sendAlertNotification(alert: AlertNotificationPayload): Promise<string> {
    const title = `${alert.severity.toUpperCase()} · ${alert.shipment_id}`;
    const body = `[${alert.alert_type.replace(/_/g, ' ')}] ${alert.message}`;
    const data = { type: 'alert', alert_id: alert.id, shipment_id: alert.shipment_id };

    await this.showBrowserNotification(title, body, data);
    this.emit(data);
    return `browser-${alert.id}`;
  }

  async sendImmediateNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<string> {
    const data = notification.data ?? {};
    await this.showBrowserNotification(notification.title, notification.body, data);
    this.emit(data);
    return `browser-${Date.now()}`;
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
