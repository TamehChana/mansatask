# AWS S3 Setup Guide

Complete guide to set up AWS S3 for storing product images and receipts.

---

## 📋 Prerequisites

- An AWS account (create one at [aws.amazon.com](https://aws.amazon.com) if you don't have one)
- Basic understanding of AWS services

---

## 🎯 Step-by-Step Setup

### Step 1: Create an AWS Account (if you don't have one)

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"**
3. Follow the registration process
4. You'll need:
   - Email address
   - Credit card (for verification - AWS Free Tier includes 5GB S3 storage free for 12 months)
   - Phone number for verification

---

### Step 2: Create an S3 Bucket

1. **Sign in to AWS Console**
   - Go to [console.aws.amazon.com](https://console.aws.amazon.com)
   - Sign in with your AWS account

2. **Navigate to S3**
   - In the search bar at the top, type "S3"
   - Click on **"S3"** service

3. **Create a New Bucket**
   - Click the **"Create bucket"** button
   - Fill in the bucket details:

   **Bucket name:**
   - Must be globally unique (e.g., `payment-link-platform-uploads-2024` or `your-company-payment-links`)
   - Use lowercase letters, numbers, and hyphens only
   - No spaces or special characters

   **AWS Region:**
   - Choose a region close to your users (e.g., `us-east-1` for US East, `eu-west-1` for Europe)
   - **Note:** Remember this region - you'll need it for `AWS_S3_REGION` in your `.env` file

   **Object Ownership:**
   - Select **"ACLs disabled (recommended)"** or **"Bucket owner preferred"**

   **Block Public Access settings:**
   - **For receipts:** Keep public access **BLOCKED** (receipts should be private)
   - **For product images:** You can allow public read access if you want images to be publicly accessible
   - **Recommended:** Keep blocked, we'll use signed URLs or serve through your backend

   **Bucket Versioning:**
   - **Disable** (unless you need version history)

   **Default encryption:**
   - **Enable** (recommended for security)
   - Choose **"Amazon S3 managed keys (SSE-S3)"**

   **Advanced settings:**
   - Leave defaults for now

4. **Create the Bucket**
   - Click **"Create bucket"** at the bottom
   - Wait for confirmation

---

### Step 3: Create IAM User for S3 Access

**Why create a separate IAM user?**
- Security best practice: Don't use your root AWS account credentials
- Can limit permissions to only what's needed (S3 access)
- Can revoke access without affecting your main account

1. **Navigate to IAM**
   - In AWS Console search bar, type "IAM"
   - Click on **"IAM"** service

2. **Create a New User**
   - Click **"Users"** in the left sidebar
   - Click **"Create user"** button

3. **User Details**
   - **User name:** `payment-link-platform-s3` (or any name you prefer)
   - **AWS credential type:** Select **"Access key - Programmatic access"**
   - Click **"Next"**

4. **Set Permissions**
   - Select **"Attach policies directly"**
   - Search for and select: **"AmazonS3FullAccess"** (or create a custom policy with limited permissions - see below)
   - Click **"Next"**

   **Optional - Custom Policy (More Secure):**
   If you want to limit permissions to only your specific bucket:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::YOUR-BUCKET-NAME",
           "arn:aws:s3:::YOUR-BUCKET-NAME/*"
         ]
       }
     ]
   }
   ```
   Replace `YOUR-BUCKET-NAME` with your actual bucket name.

5. **Review and Create**
   - Review the settings
   - Click **"Create user"**

6. **Save Your Credentials** ⚠️ **IMPORTANT**
   - You'll see **"Access key ID"** and **"Secret access key"**
   - **Download the CSV file** or **copy both values immediately**
   - ⚠️ **You can only see the secret key ONCE** - if you lose it, you'll need to create a new access key
   - Store these securely (password manager, secure notes, etc.)

---

### Step 4: Get Your Credentials

You should now have:

1. **Access Key ID** (looks like: `AKIAIOSFODNN7EXAMPLE`)
2. **Secret Access Key** (looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
3. **Bucket Name** (e.g., `payment-link-platform-uploads-2024`)
4. **Region** (e.g., `us-east-1`)

---

### Step 5: Configure Your Application

Add these to your `backend/.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=payment-link-platform-uploads-2024
AWS_S3_REGION=us-east-1
```

**Replace with your actual values!**

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
   - Keep `.env` in `.gitignore` ✅ (already done)
   - Use `.env.example` for documentation (without real values)

2. **Use IAM roles in production**
   - For production (AWS EC2, ECS, Lambda), use IAM roles instead of access keys
   - More secure and easier to manage

3. **Rotate credentials regularly**
   - Change access keys every 90 days
   - Create new keys, update application, then delete old keys

4. **Limit permissions**
   - Use custom IAM policy with only needed permissions
   - Don't use `AmazonS3FullAccess` in production

---

## 🧪 Testing Your Setup

After adding credentials to `.env`, test the connection:

```bash
cd backend
npm run start:dev
```

Check the logs - you should see:
```
✅ S3 storage enabled (bucket: your-bucket-name, region: us-east-1)
```

If you see:
```
⚠️  S3 credentials not provided - using local storage
```

Then check:
- Are credentials in `.env` file?
- Are there any typos in the variable names?
- Did you restart the backend after adding credentials?

---

## 💰 AWS S3 Pricing (Free Tier)

**AWS Free Tier includes:**
- 5 GB of standard storage
- 20,000 GET requests
- 2,000 PUT requests
- **Free for 12 months** (then pay-as-you-go)

**After Free Tier:**
- Storage: ~$0.023 per GB/month
- Requests: Very cheap (pennies per 1000 requests)

**For a payment link platform:**
- Product images: Small files, minimal cost
- Receipts: PDFs, typically 50-200KB each
- **Estimated cost:** $1-5/month for small to medium usage

---

## 🆘 Troubleshooting

### "Access Denied" Error

**Possible causes:**
1. Wrong access key or secret key
2. IAM user doesn't have S3 permissions
3. Bucket policy blocking access
4. Wrong region specified

**Solutions:**
- Double-check credentials in `.env`
- Verify IAM user has S3 permissions
- Check bucket region matches `AWS_S3_REGION`

### "Bucket Not Found" Error

**Possible causes:**
1. Wrong bucket name
2. Bucket in different region
3. Bucket doesn't exist

**Solutions:**
- Verify bucket name in S3 console
- Check region matches
- Ensure bucket was created successfully

### "Invalid Access Key" Error

**Possible causes:**
1. Access key ID is incorrect
2. Secret access key is incorrect
3. Credentials were deleted/rotated

**Solutions:**
- Re-check credentials
- Create new access key if needed
- Ensure no extra spaces in `.env` file

---

## 📚 Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [S3 Pricing Calculator](https://calculator.aws/)

---

## ✅ Quick Checklist

- [ ] AWS account created
- [ ] S3 bucket created
- [ ] IAM user created with S3 permissions
- [ ] Access Key ID saved securely
- [ ] Secret Access Key saved securely
- [ ] Bucket name noted
- [ ] Region noted
- [ ] Credentials added to `backend/.env`
- [ ] Backend restarted
- [ ] S3 connection verified in logs

---

**Once you have your credentials, add them to `backend/.env` and we'll continue with the implementation!**


