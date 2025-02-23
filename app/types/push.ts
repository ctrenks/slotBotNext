export interface PushSubscriptionKeys {
  auth: string;
  p256dh: string;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushSubscriptionData {
  userEmail: string;
  subscription: WebPushSubscription;
}
