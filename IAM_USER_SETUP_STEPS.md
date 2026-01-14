# IAM User Setup - Quick Steps

## Step 1: Navigate to IAM

1. In AWS Console, click the **search bar** at the top
2. Type: **"IAM"**
3. Click on **"IAM"** service

---

## Step 2: Create New User

1. In the left sidebar, click **"Users"**
2. Click the **"Create user"** button (top right)

---

## Step 3: User Details

1. **User name:** Enter: `payment-link-platform-s3` (or any name you prefer)
2. **AWS credential type:** 
   - ✅ Check **"Access key - Programmatic access"**
   - (This gives you the Access Key ID and Secret Access Key)
3. Click **"Next"** button

---

## Step 4: Set Permissions

1. Select **"Attach policies directly"** tab
2. In the search box, type: **"S3"**
3. Find and check: **"AmazonS3FullAccess"**
   - (This gives full S3 access - fine for now, can restrict later)
4. Click **"Next"** button

---

## Step 5: Review and Create

1. Review the settings:
   - User name: `payment-link-platform-s3`
   - Access type: Programmatic access
   - Permissions: AmazonS3FullAccess
2. Click **"Create user"** button

---

## Step 6: Save Your Credentials ⚠️ CRITICAL

You'll see a screen with:

**Access key ID:** `AKIA...` (starts with AKIA)
**Secret access key:** `wJalr...` (long random string)

### ⚠️ IMPORTANT - DO THIS NOW:

1. **Click "Download .csv file"** button (saves both keys)
   - OR
2. **Copy both values** and save them securely:
   - Password manager
   - Secure notes app
   - Text file (keep it safe!)

### ⚠️ WARNING:
- You can **ONLY see the Secret Access Key ONCE**
- If you lose it, you'll need to create a new access key
- **Save it immediately!**

3. Click **"Done"** button

---

## Step 7: What You Should Have Now

✅ **Access Key ID** (looks like: `AKIAIOSFODNN7EXAMPLE`)
✅ **Secret Access Key** (looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
✅ **Bucket Name** (from earlier)
✅ **Region** (from earlier, e.g., `us-east-1`)

---

## Step 8: Add to Your .env File

Open `backend/.env` file and add:

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_REGION=us-east-1
```

**Replace with your actual values!**

---

## ✅ Done!

Once you've added the credentials to `.env`, let me know and we'll:
1. Test the S3 connection
2. Complete the product image upload implementation
3. Update receipts to use S3

---

## 🆘 Troubleshooting

**If you lost the Secret Access Key:**
1. Go to IAM → Users → Your user
2. Click "Security credentials" tab
3. Under "Access keys", click "Create access key"
4. Save the new credentials

**If you see "Access Denied" errors:**
- Double-check the credentials in `.env`
- Make sure there are no extra spaces
- Verify the IAM user has S3 permissions


