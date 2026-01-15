# Main St AI

Production checklist (auth, roles, notifications, rules):
- Set env vars in `.env.local` or your deployment provider:
  - `ENFORCE_FIREBASE_AUTH=true`
  - `ALLOW_DEV_TOKENS=false`
  - `FIREBASE_PROJECT_ID=...`
  - `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`
  - `SENDGRID_API_KEY=...`
  - `SENDGRID_FROM_EMAIL=...`
  - `TWILIO_ACCOUNT_SID=...`
  - `TWILIO_AUTH_TOKEN=...`
  - `TWILIO_FROM_NUMBER=...`
- Deploy Firestore rules: `firestore.rules`
- Deploy Firestore indexes: `firestore.indexes.json`
