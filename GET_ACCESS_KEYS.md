# How to Get Your Access Keys

## ⚠️ Important
The console username/password you have is for **logging into AWS Console**.
We need **Access Keys** for **programmatic access** (for your application to use S3).

---

## Steps to Get Access Keys

### 1. Sign in to AWS Console
- Use the console URL and credentials you have
- Or go to: https://console.aws.amazon.com

### 2. Go to IAM → Users
1. Search for **"IAM"** in the top search bar
2. Click **"IAM"** service
3. In left sidebar, click **"Users"**
4. Find and click on your user: **"payment-link-platform-s3"**

### 3. Go to Security Credentials Tab
1. Click the **"Security credentials"** tab
2. Scroll down to **"Access keys"** section

### 4. Create Access Key
1. Click **"Create access key"** button
2. Select use case: **"Application running outside AWS"** (or "Other")
3. Click **"Next"**
4. (Optional) Add description: "Payment Link Platform S3 Access"
5. Click **"Create access key"**

### 5. Save Your Keys ⚠️ CRITICAL
You'll see:
- **Access key ID:** `AKIA...` (starts with AKIA)
- **Secret access key:** `wJalr...` (long random string)

**DO THIS NOW:**
1. **Click "Download .csv file"** - saves both keys
   - OR
2. **Copy both values** and save securely

⚠️ **WARNING:** You can only see the Secret Access Key ONCE!
- If you lose it, you'll need to create a new one
- Save it immediately!

6. Click **"Done"**

---

## What You Should Have

✅ **Access Key ID:** `AKIA...` (for programmatic access)
✅ **Secret Access Key:** `wJalr...` (for programmatic access)
✅ **Bucket Name:** `payment-link-platform-uploads-2024`
✅ **Region:** `us-east-2`

---

## Add to .env File

Once you have the Access Keys, add to `backend/.env`:

```env
AWS_ACCESS_KEY_ID=AKIA...your-actual-access-key-id
AWS_SECRET_ACCESS_KEY=wJalr...your-actual-secret-access-key
AWS_S3_BUCKET_NAME=payment-link-platform-uploads-2024
AWS_S3_REGION=us-east-2
```

**Note:** Region is `us-east-2` (not `us-east-1`)

---

## Visual Guide

**Path:** IAM → Users → payment-link-platform-s3 → Security credentials → Access keys → Create access key

---

## ✅ After You Have the Keys

1. Add them to `backend/.env`
2. Let me know
3. We'll test the connection and continue implementation!


