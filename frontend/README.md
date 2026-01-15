# Payment Link Platform - Frontend

A production-grade Next.js frontend application for processing mobile money payments through payment links. Built with modern React patterns, TypeScript, and a focus on user experience, accessibility, and performance.

## Overview

This frontend provides a comprehensive web interface for merchants to create and manage payment links, process mobile money transactions, manage products, and view transaction history. The application is built with Next.js 16 using the App Router, React 19, and follows modern development practices with a focus on security, accessibility, and maintainability.

## Features

- **Authentication & Authorization**
  - User registration and login
  - JWT-based authentication with automatic token refresh
  - Password reset via email
  - Protected routes with route guards
  - Persistent authentication state

- **Dashboard**
  - Real-time statistics and analytics
  - Revenue tracking
  - Transaction counts
  - Payment link metrics
  - Quick access to key features

- **Product Management**
  - Create, read, update, and delete products
  - Image upload and management
  - Product listing with search and filtering
  - Responsive product cards

- **Payment Link Management**
  - Create and manage payment links
  - Link editing and deletion
  - QR code generation for easy sharing
  - Public payment link sharing
  - Link analytics and statistics

- **Payment Processing**
  - Public payment pages for customers
  - Secure payment forms with validation
  - Payment status tracking
  - Real-time payment updates
  - Receipt download

- **Transaction Management**
  - Comprehensive transaction history
  - Transaction filtering and search
  - Detailed transaction views
  - Receipt download
  - Transaction status tracking

- **User Profile**
  - Profile viewing and editing
  - Account management

- **User Experience**
  - Responsive design (mobile, tablet, desktop)
  - Loading states and skeleton loaders
  - Empty states with helpful messages
  - Error handling with retry mechanisms
  - Toast notifications
  - Accessible UI with ARIA labels
  - Keyboard navigation support

## Tech Stack

- **Framework**: Next.js 16.x (App Router)
- **UI Library**: React 19.x
- **Language**: TypeScript 5.x
- **State Management**:
  - React Query (TanStack Query) - Server state management
  - Zustand - Client state management with persistence
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors
- **QR Codes**: qrcode.react
- **Styling**: Tailwind CSS 4.x
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, TypeScript

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend API running (see backend README for setup)

## Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/TamehChana/mansatask.git
cd mansatask/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For production, use your deployed backend URL:

```env
NEXT_PUBLIC_API_URL=https://payment-link-backend.onrender.com/api
```

### Step 4: Start the Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3001`

Open [http://localhost:3001](http://localhost:3001) in your browser to see the application.

### Step 5: Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── forgot-password/    # Forgot password page
│   │   ├── reset-password/     # Reset password page
│   │   ├── profile/            # User profile page
│   │   ├── products/           # Product management pages
│   │   │   ├── create/         # Create product page
│   │   │   ├── [id]/           # Product detail page
│   │   │   │   └── edit/       # Edit product page
│   │   │   └── page.tsx        # Products listing page
│   │   ├── payment-links/      # Payment link management pages
│   │   │   ├── create/         # Create payment link page
│   │   │   ├── [id]/           # Payment link detail page
│   │   │   │   └── edit/       # Edit payment link page
│   │   │   └── page.tsx        # Payment links listing page
│   │   ├── payment/            # Public payment pages
│   │   │   ├── [slug]/         # Public payment page
│   │   │   └── status/         # Payment status page
│   │   │       └── [externalReference]/
│   │   └── transactions/       # Transaction pages
│   │       ├── [id]/           # Transaction detail page
│   │       └── page.tsx        # Transactions listing page
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   │   ├── AuthLayout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── Navigation.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── payment/            # Payment components
│   │   │   └── PaymentForm.tsx
│   │   ├── payment-links/      # Payment link components
│   │   │   ├── PaymentLinkCard.tsx
│   │   │   ├── PaymentLinkForm.tsx
│   │   │   └── QRCodeDisplay.tsx
│   │   ├── products/           # Product components
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductForm.tsx
│   │   ├── users/              # User components
│   │   │   └── ProfileForm.tsx
│   │   ├── ui/                 # UI components
│   │   │   ├── BackButton.tsx
│   │   │   └── ToastProvider.tsx
│   │   └── ErrorBoundary.tsx   # Error boundary component
│   ├── hooks/                  # Custom React hooks
│   │   ├── auth/               # Authentication hooks
│   │   │   └── useAuth.ts
│   │   ├── dashboard/          # Dashboard hooks
│   │   │   └── useDashboard.ts
│   │   ├── payment-links/      # Payment link hooks
│   │   │   └── usePaymentLinks.ts
│   │   ├── payments/           # Payment hooks
│   │   │   └── usePayments.ts
│   │   ├── products/           # Product hooks
│   │   │   ├── useProducts.ts
│   │   │   └── useImageUpload.ts
│   │   ├── receipts/           # Receipt hooks
│   │   │   └── useReceipts.ts
│   │   ├── transactions/       # Transaction hooks
│   │   │   └── useTransactions.ts
│   │   └── users/              # User hooks
│   │       └── useUsers.ts
│   ├── lib/                    # Utility libraries
│   │   ├── api-client.ts       # Axios API client with interceptors
│   │   └── react-query.tsx     # React Query provider
│   ├── services/               # API service functions
│   │   ├── auth/               # Authentication services
│   │   │   └── auth.service.ts
│   │   ├── dashboard/          # Dashboard services
│   │   │   └── dashboard.service.ts
│   │   ├── payment-links/      # Payment link services
│   │   │   └── payment-links.service.ts
│   │   ├── payments/           # Payment services
│   │   │   └── payments.service.ts
│   │   ├── products/           # Product services
│   │   │   └── products.service.ts
│   │   ├── receipts/           # Receipt services
│   │   │   └── receipts.service.ts
│   │   ├── transactions/       # Transaction services
│   │   │   └── transactions.service.ts
│   │   └── users/              # User services
│   │       └── users.service.ts
│   ├── stores/                 # Zustand state stores
│   │   └── auth-store.ts       # Authentication store
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.ts              # API response types
│   │   ├── auth.ts             # Authentication types
│   │   ├── payment-link.ts     # Payment link types
│   │   ├── payment.ts          # Payment types
│   │   ├── product.ts          # Product types
│   │   ├── receipt.ts          # Receipt types
│   │   ├── transaction.ts      # Transaction types
│   │   └── user.ts             # User types
│   ├── utils/                  # Utility functions
│   │   ├── error-messages.ts   # Error message utilities
│   │   └── image-url.ts        # Image URL utilities
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest configuration
└── package.json
```

## Key Features Explained

### State Management

The application uses a hybrid state management approach:

- **React Query (TanStack Query)**: Manages server state (API data). Provides caching, refetching, and synchronization with the backend.
- **Zustand**: Manages client state (authentication, UI state). Provides lightweight state management with persistence.

### API Integration

The application uses Axios with custom interceptors for:

- Automatic authentication token injection
- Token refresh on expiration
- Error handling and retry logic
- Request/response logging

### Form Validation

All forms use React Hook Form with Zod schemas for:

- Client-side validation
- Type-safe form data
- Error handling and display
- Optimistic updates

### Image Handling

Product images are handled through:

- Backend API proxy endpoint for secure delivery
- Support for AWS S3 and local storage
- Automatic URL construction and encoding
- Fallback handling for missing images

### Accessibility

The application follows accessibility best practices:

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML

### Error Handling

Comprehensive error handling includes:

- Error boundaries for React errors
- API error handling with user-friendly messages
- Retry mechanisms for failed requests
- Toast notifications for user feedback

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Testing

The application uses Jest and React Testing Library for testing.

### Run Tests

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Environment Variables

### Required Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `http://localhost:3000/api`)

### Optional Variables

- `NEXT_PUBLIC_AUTH_USE_COOKIES` - Enable cookie-based authentication for enhanced security (set to `'true'` to enable)
  - When enabled, uses HttpOnly cookies instead of localStorage for token storage
  - Provides better XSS protection
  - Default: disabled (uses localStorage for backwards compatibility)

### Environment-Specific Configuration

- **Development**: `http://localhost:3000/api`
- **Production**: `https://payment-link-backend.onrender.com/api`

**Example `.env.local` for enhanced security:**
```env
NEXT_PUBLIC_API_URL=https://payment-link-backend.onrender.com/api
NEXT_PUBLIC_AUTH_USE_COOKIES=true
```

Note: Next.js requires the `NEXT_PUBLIC_` prefix for environment variables that should be exposed to the browser. These variables are embedded at build time.

## Styling

The application uses Tailwind CSS 4.x for styling:

- Utility-first CSS framework
- Responsive design utilities
- Custom color scheme
- Consistent spacing and typography
- Dark mode ready (not currently implemented)

## Performance Optimization

The application implements several performance optimizations:

- Next.js App Router for optimized routing
- Server-side rendering where appropriate
- Client-side caching with React Query
- Image optimization with Next.js Image component (if implemented)
- Code splitting and lazy loading
- Optimized bundle size

## Security Considerations

- **Authentication Options**:
  - **Default Mode**: JWT tokens stored in Zustand with localStorage persistence (backwards compatible)
  - **Enhanced Security Mode**: Optional cookie-based authentication using HttpOnly cookies (XSS protection)
    - Enable by setting `NEXT_PUBLIC_AUTH_USE_COOKIES=true` in environment variables
    - When enabled, tokens are never stored in localStorage and are managed via secure cookies
    - Backend automatically sets HttpOnly cookies on login/register/refresh
- Automatic token refresh on expiration
- Protected routes with authentication guards
- Input validation on all forms
- XSS protection through React's built-in escaping
- HTTPS in production
- CORS configuration on backend

## Accessibility (A11y)

The application follows WCAG 2.1 guidelines:

- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Semantic HTML structure
- Color contrast compliance

## Browser Support

The application supports modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

The frontend is deployed on **Vercel**. The deployment configuration is handled automatically through Vercel's integration with GitHub.

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
```

The build output will be in the `.next` directory, ready for deployment.

## Troubleshooting

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Ensure backend is running and accessible
- Check CORS configuration on backend

### Authentication Issues

- **Token-based auth (default)**:
  - Clear browser localStorage and refresh
  - Verify JWT tokens are being stored correctly in Zustand/localStorage
- **Cookie-based auth (if enabled)**:
  - Clear browser cookies and refresh
  - Verify `NEXT_PUBLIC_AUTH_USE_COOKIES=true` is set
  - Ensure backend is setting cookies correctly
- Check backend authentication endpoints

### Image Display Issues

- Verify backend image proxy endpoint is working
- Check AWS S3 credentials (if using S3)
- Ensure image URLs are properly encoded

### Build Errors

- Clear `.next` directory and rebuild
- Verify all environment variables are set
- Check for TypeScript errors with `npm run lint`

## Code Quality

The project follows these code quality standards:

- TypeScript for type safety
- ESLint for code linting
- Consistent code formatting
- Component-based architecture
- Separation of concerns (UI, state, services)
- Reusable components
- Custom hooks for business logic

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

## License

This project is proprietary and confidential. All rights reserved.

## Contact

For questions or support, please contact the development team or refer to the main project README.
