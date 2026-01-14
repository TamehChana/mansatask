# UI/UX Design Brief: Payment Link Platform

## Project Overview

I need you to design the complete user interface for a **Payment Link Platform** - a web application that allows businesses to create products, generate payment links, and accept payments via mobile money. This is a technical assessment project that requires professional, production-ready designs.

## Context

This platform enables merchants to:
- Register and manage their accounts
- Create products and generate shareable payment links
- Accept payments from customers via mobile money (MTN, Vodafone, AirtelTigo)
- View transaction history and generate receipts
- Manage their payment links and products

**Target Users:**
- **Merchants/Business Owners** (Primary users - authenticated dashboard users)
- **Customers** (Secondary users - public payment page users)

**Platform:** Web Application (React/Next.js framework)

**API Base URL:** https://api-stage.mansatransfers.com

---

## Design Requirements

### 1. Design System & Branding

- **Color Palette:** 
  - Use professional, trust-building colors appropriate for a financial/payment platform
  - Consider security indicators (green for success, red for errors)
  - Maintain consistency across all screens

- **Typography:**
  - Clear, readable, modern font family
  - Proper hierarchy (Headings, Body, Labels, Captions)
  - Ensure good readability on all devices

- **Components:**
  - Design a consistent component library (Buttons, Forms, Cards, Tables, Modals, etc.)
  - Maintain design consistency throughout the application
  - Follow modern UI/UX best practices

### 2. Responsive Design

- **Primary:** Desktop/Web (1024px and above)
- **Secondary:** Tablet (768px - 1023px)
- **Tertiary:** Mobile (320px - 767px)
- All screens must be fully responsive and mobile-friendly
- Mobile-first approach recommended

### 3. User Experience Guidelines

- **Navigation:** Intuitive navigation structure with clear hierarchy
- **Information Architecture:** Logical flow between screens
- **Feedback:** Clear loading states, success messages, error messages
- **Accessibility:** Follow WCAG 2.1 guidelines (AA level minimum)
- **Performance:** Consider loading states and skeleton screens
- **Security:** Include security indicators and trust signals on payment-related screens

### 4. Specific Requirements

- **Payment Security:** Emphasize security and trust on all payment-related screens
- **Data Display:** Clear presentation of transaction data, amounts, dates, statuses
- **Forms:** User-friendly form design with proper validation states
- **Empty States:** Design appropriate empty states for lists (no products, no transactions, etc.)
- **Error States:** Clear error messages and recovery paths
- **Success States:** Celebratory but professional success indicators

---

## Complete Screen List

Please design all of the following screens. I've organized them by functional area:

### **AUTHENTICATION & USER MANAGEMENT** (5 screens)

1. **Login Screen**
   - Email/username and password fields
   - Login button
   - "Forgot password?" link
   - "Don't have an account? Sign up" link
   - Remember me checkbox (optional)

2. **Registration/Signup Screen**
   - Registration form (Name, Email, Password, Confirm Password)
   - Terms and conditions checkbox
   - Sign up button
   - "Already have an account? Login" link

3. **Forgot Password Screen**
   - Email input field
   - "Send Reset Link" button
   - Back to login link
   - Instructions text

4. **Reset Password Screen**
   - New password field
   - Confirm password field
   - Reset password button
   - Password strength indicator

5. **User Profile/Account Settings Screen**
   - Profile information display and edit
   - Account settings section
   - Password change section
   - Save/Cancel buttons

---

### **PRODUCT & PAYMENT LINK CREATION** (8 screens)

6. **Dashboard (Main Landing Page)**
   - Overview statistics (Total Products, Total Links, Total Revenue, Total Transactions)
   - Quick action buttons (Create Product, Create Payment Link)
   - Recent activity/widgets
   - Navigation sidebar/menu
   - Charts/graphs for analytics (optional but recommended)

7. **Product List/Management Screen**
   - List of all products (grid or table view)
   - Product cards showing: Name, Description, Price, Image
   - Search and filter functionality
   - "Create New Product" button
   - Edit/Delete actions for each product
   - Pagination or infinite scroll

8. **Create Product Screen**
   - Product creation form:
     - Product name field
     - Product description (textarea)
     - Product price/amount field
     - Product image upload
   - Save/Create button
   - Cancel button
   - Form validation states

9. **Edit Product Screen**
   - Pre-filled product editing form (same as create)
   - Update button
   - Delete button
   - Cancel button

10. **Payment Link List/Management Screen**
    - List of all payment links (table or card view)
    - Link information: Name, Amount, Status, Created Date, Expiry Date
    - Status indicators (Active, Expired, Paused)
    - Search and filter functionality
    - "Create New Payment Link" button
    - Actions: Edit, Copy Link, Delete, View Details
    - Share options

11. **Create Payment Link Screen**
    - Payment link creation form:
      - Select existing product OR enter custom details
      - Link name/title
      - Amount field
      - Description field
      - Expiry date (optional date picker)
    - Generate/Create link button
    - Cancel button

12. **Edit Payment Link Screen**
    - Pre-filled payment link editing form
    - Update button
    - Delete button
    - Cancel button

13. **Payment Link Details/Preview Screen**
    - Payment link details display
    - Link preview/URL display
    - Copy link button/functionality
    - QR code display (for easy sharing)
    - Share options (Email, SMS, Social media)
    - Statistics/analytics view (views, clicks, payments)
    - Link status toggle (Active/Pause)

---

### **PUBLIC PAYMENT PAGE (CLIENT SIDE)** (2 screens)

14. **Public Payment Page**
    - **This is a public-facing page (no authentication required)**
    - Merchant/business branding area
    - Product/service information display
    - Amount to pay (large, prominent)
    - Payment form:
      - Customer name field
      - Customer email field
      - Customer phone number field
      - Optional: Additional notes field
    - Payment method selection/indicator (Mobile Money)
    - "Pay Now" button (prominent, CTA)
    - Security badges/trust indicators
    - Terms of service link
    - Responsive and mobile-optimized

15. **Payment Processing/Loading Screen**
    - Loading indicator/animation
    - Status message ("Processing your payment...")
    - Instructions for user (e.g., "Check your phone for payment prompt")
    - Do not refresh warning

---

### **PAYMENT FLOW (MOBILE MONEY)** (5 screens)

16. **Payment Authentication Screen**
    - Mobile money authentication
    - Phone number input
    - Network/carrier selection (MTN, Vodafone, AirtelTigo)
    - Continue/Authenticate button
    - Instructions text

17. **Payment Confirmation Screen**
    - Payment details review:
      - Amount to pay
      - Customer information
      - Merchant name
    - "Confirm Payment" button
    - "Cancel/Edit" button
    - Terms acceptance checkbox

18. **Payment Processing Screen**
    - Payment in progress indicator
    - Mobile money prompt instructions
    - Loading animation
    - "Please wait..." message
    - Instructions: "Enter your mobile money PIN on your phone"

19. **Transaction Status Screen**
    - Transaction status display (Success/Failed/Pending)
    - Status icon and message
    - Transaction ID/Reference number
    - Transaction details (Amount, Date, Customer info, Merchant info)
    - Success: "Download Receipt" button, "Return to Home" link
    - Failed: "Retry Payment" button, Error message, "Contact Support" link
    - Pending: Status explanation, "Check Status" button

20. **Transaction History Screen**
    - List of all transactions (table view)
    - Transaction information: Date, Amount, Status, Customer, Reference
    - Filter options (Date range, Status, Amount)
    - Search functionality
    - Pagination
    - Actions: View Details, Download Receipt
    - Export functionality (CSV/PDF) - optional

---

### **RECEIPT GENERATION & DOWNLOAD** (2 screens)

21. **Receipt View Screen**
    - Receipt display (PDF-like layout)
    - Receipt details:
      - Receipt/Transaction ID
      - Date and time
      - Amount paid
      - Customer information
      - Merchant/Business information
      - Payment method
      - Status
    - Company/merchant logo and branding
    - "Download PDF" button
    - "Print" button
    - "Share Receipt" option (Email, SMS)
    - Professional receipt design

22. **Receipt Download Success Screen**
    - Confirmation message
    - Download link/button (if not auto-downloaded)
    - Print option
    - "View Transaction" link
    - "Back to Dashboard" link

---

### **ADDITIONAL/SUPPORTING SCREENS** (4+ screens)

23. **Settings Screen**
    - Application settings
    - Notification preferences
    - Account preferences
    - API keys/settings (if applicable)
    - Save/Cancel buttons
    - Organized in sections/tabs

24. **Notifications Screen**
    - Notification center/Inbox
    - List of notifications (payment received, link created, etc.)
    - Notification types with icons
    - Mark as read functionality
    - Filter by type
    - Clear all option

25. **Error Pages**
    - **404 Not Found Page:** Friendly error message, "Go Home" button
    - **500 Server Error Page:** Error message, "Try Again" button, "Contact Support" link
    - **Payment Failed Page:** Detailed error message, "Retry" button, "Contact Support" link
    - **Access Denied/Unauthorized Page:** Message, "Login" button

26. **Help/Support Screen**
    - Help documentation
    - FAQ section (expandable/collapsible)
    - Contact support form
    - User guide/tutorials
    - Search help functionality

---

## Deliverables Expected

Please provide the following for each screen:

1. **High-Fidelity Mockups**
   - Desktop version (1440px width recommended)
   - Tablet version (768px width)
   - Mobile version (375px width for iPhone, 360px for Android)

2. **Design Specifications**
   - Color codes (HEX/RGB)
   - Typography (Font family, sizes, weights, line heights)
   - Spacing/padding values
   - Component dimensions
   - Border radius values
   - Shadow effects

3. **Interactive States** (where applicable)
   - Default state
   - Hover state
   - Active/Pressed state
   - Disabled state
   - Error state
   - Success state
   - Loading state

4. **Component Library**
   - Buttons (Primary, Secondary, Tertiary, Danger)
   - Form inputs (Text, Email, Password, Number, Textarea, Select, Checkbox, Radio)
   - Cards
   - Tables
   - Modals/Dialogs
   - Alerts/Notifications
   - Navigation components
   - Icons (or icon style guide)

5. **User Flow Diagrams**
   - Authentication flow
   - Payment flow
   - Product creation flow
   - Payment link creation flow

6. **Design File Format**
   - Figma file (preferred) OR
   - Adobe XD file OR
   - Sketch file
   - Export as PNG/JPG for quick preview
   - Include all artboards organized by category

---

## Additional Design Considerations

### Payment Security & Trust
- Use SSL/padlock icons on payment screens
- Include "Secure Payment" badges
- Show trusted payment provider logos
- Clear privacy policy and terms links
- Professional, trustworthy aesthetic

### Mobile Money Integration
- Display supported networks (MTN, Vodafone, AirtelTigo)
- Clear instructions for mobile money payment
- Phone number format validation hints
- Network/carrier selection UI

### Data Visualization
- Charts for dashboard analytics (line charts, bar charts, pie charts)
- Transaction history visualization
- Revenue trends
- Payment status distribution

### Accessibility
- Sufficient color contrast (WCAG AA minimum)
- Clear focus states for keyboard navigation
- Screen reader friendly labels
- Alt text for images
- Proper heading hierarchy

### Micro-interactions
- Smooth transitions between screens
- Loading animations
- Success animations (confetti, checkmark, etc.)
- Error animations (shake, pulse, etc.)
- Hover effects on interactive elements

---

## Technical Constraints

- **Framework:** React/Next.js
- **Styling:** CSS-in-JS or CSS Modules (design system should be framework-agnostic)
- **Icons:** Font icons or SVG icons (specify which icon library if used)
- **Images:** Support for image uploads (product images, logos)
- **Tables:** Responsive table design (consider card view for mobile)
- **Forms:** Client-side validation states needed

---

## Design Inspiration & References

Consider modern payment platforms like:
- Stripe
- PayPal
- Square
- Paystack
- Flutterwave

While maintaining originality and adapting to the mobile money context.

---

## Priority Order

If time is limited, prioritize in this order:

1. **High Priority (Core Functionality):**
   - Authentication screens (Login, Register)
   - Dashboard
   - Create Product
   - Create Payment Link
   - Public Payment Page
   - Payment Flow screens
   - Transaction Status
   - Receipt View

2. **Medium Priority:**
   - Product List
   - Payment Link List
   - Edit screens
   - Transaction History
   - Settings

3. **Lower Priority (Nice to Have):**
   - Help/Support
   - Notifications
   - Enhanced dashboard widgets

---

## Questions to Consider

While designing, please consider:

1. How can we make the payment process as frictionless as possible?
2. How do we build trust for first-time customers on the public payment page?
3. How can merchants quickly understand their payment link performance?
4. What information is most important on the dashboard?
5. How do we handle errors gracefully without frustrating users?
6. How can we make the mobile money payment process clear and intuitive?

---

## Final Notes

- This is a production-ready design requirement - treat it as a real client project
- The design should be modern, professional, and suitable for a fintech/payment platform
- Pay special attention to the payment flow - this is the critical user journey
- Ensure the public payment page is optimized for conversion
- The merchant dashboard should provide value through clear data presentation
- All designs should be exportable and ready for handoff to developers

**I'm looking for clean, professional, and user-friendly designs that balance aesthetics with functionality.**

Thank you for your expertise! Let me know if you need any clarification or additional information.


