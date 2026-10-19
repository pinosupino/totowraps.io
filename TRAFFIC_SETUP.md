# TotoWrap traffic dashboard setup

The Admin > Stats tab is installed. It reads daily aggregate counters from Firestore `trafficDaily/YYYY-MM-DD`.
The public site writes one visit per browser tab session per Rome calendar day, and approximately one unique browser per day using localStorage. Admin traffic is excluded. No IP or names are stored.

## REQUIRED: Firestore security rules

**Tracking will not work until you update and publish Firestore security rules.** Do not replace your existing rules; add a match for `trafficDaily/{day}` within your existing `match /databases/{database}/documents` block.

```javascript
match /trafficDaily/{day} {
  // Only signed-in users can view aggregated traffic.
  allow read: if request.auth != null;
  // Public site can create aggregate counters, no arbitrary fields.
  allow create: if day.matches('\\d{4}-\\d{2}-\\d{2}')
    && request.resource.data.keys().hasOnly(['visits', 'visitors', 'updatedAt'])
    && request.resource.data.visits == 1
    && request.resource.data.visitors in [0, 1]
    && request.resource.data.updatedAt is string;
  allow update: if day.matches('\\d{4}-\\d{2}-\\d{2}')
    && request.resource.data.keys().hasOnly(['visits', 'visitors', 'updatedAt'])
    && request.resource.data.visits == resource.data.visits + 1
    && request.resource.data.visitors >= resource.data.visitors
    && request.resource.data.visitors <= resource.data.visitors + 1
    && request.resource.data.updatedAt is string;
  allow delete: if false;
}
```

Note: this client-side, anonymous counter is **not tamper-proof**. A malicious visitor can inflate numbers. For fraud-resistant counts use a server-side rate-limited collector (Cloudflare Worker or Firebase Cloud Functions). Firestore write quotas and billing may apply. The first 30 days are shown and data is only collected after publishing this feature and rules.
