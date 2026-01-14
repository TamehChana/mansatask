# Code Quality Guide - Payment Link Platform

## Overview
Comprehensive code quality standards for building a production-grade Payment Link Platform. These standards ensure maintainability, readability, and consistency throughout the codebase.

---

## 📁 Clean Folder Structure

### Backend Structure (NestJS)
```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       ├── forgot-password.dto.ts
│   │       └── reset-password.dto.ts
│   │
│   ├── users/                     # User management module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   ├── products/                  # Product management module
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── payment-links/             # Payment link module
│   │   ├── payment-links.module.ts
│   │   ├── payment-links.controller.ts
│   │   ├── payment-links.service.ts
│   │   ├── qr-code.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── payments/                  # Payment processing module
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── idempotency.service.ts
│   │   ├── providers/
│   │   │   └── mansa-transfers.service.ts
│   │   ├── webhooks/
│   │   │   ├── webhook.controller.ts
│   │   │   └── webhook.service.ts
│   │   └── dto/
│   │
│   ├── transactions/              # Transaction management module
│   │   ├── transactions.module.ts
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── receipts/                  # Receipt generation module
│   │   ├── receipts.module.ts
│   │   ├── receipts.controller.ts
│   │   ├── receipts.service.ts
│   │   └── entities/
│   │
│   ├── notifications/             # Notification module
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── email/
│   │   │   ├── email.service.ts
│   │   │   └── email-templates/
│   │   └── queues/
│   │       └── notification.processor.ts
│   │
│   ├── common/                    # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── config/                    # Configuration
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   ├── email.config.ts
│   │   ├── aws.config.ts
│   │   └── env.validation.ts
│   │
│   ├── database/                  # Database setup
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── migrations/
│   │
│   └── health/                    # Health checks
│       └── health.controller.ts
│
├── prisma/
│   └── schema.prisma              # Prisma schema
│
├── templates/                     # Email templates
│   └── email/
│       ├── payment-success.hbs
│       ├── payment-failed.hbs
│       ├── receipt.hbs
│       └── password-reset.hbs
│
├── test/                          # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Frontend Structure (Next.js)
```
frontend/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   │
│   ├── (auth)/                    # Auth routes group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/               # Protected routes group
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx           # Product list
│   │   │   ├── new/
│   │   │   │   └── page.tsx       # Create product
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Edit product
│   │   ├── payment-links/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   │
│   ├── pay/                       # Public payment pages
│   │   └── [slug]/
│   │       └── page.tsx
│   │
│   ├── payment-status/            # Payment status pages
│   │   └── [transactionId]/
│   │       └── page.tsx
│   │
│   └── api/                       # API routes (if needed)
│
├── components/                    # React components
│   ├── ui/                        # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── Toast/
│   │
│   ├── forms/                     # Form components
│   │   ├── ProductForm/
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductForm.module.css
│   │   └── PaymentLinkForm/
│   │
│   ├── products/                  # Product-related components
│   │   ├── ProductCard/
│   │   ├── ProductList/
│   │   └── ProductForm/
│   │
│   ├── payment-links/             # Payment link components
│   │   ├── PaymentLinkCard/
│   │   ├── PaymentLinkList/
│   │   ├── PaymentLinkForm/
│   │   └── QRCodeDisplay/
│   │
│   ├── payments/                  # Payment components
│   │   ├── PaymentForm/
│   │   ├── PaymentStatus/
│   │   │   ├── PaymentStatus.tsx
│   │   │   ├── PendingStatus.tsx
│   │   │   ├── ProcessingStatus.tsx
│   │   │   ├── SuccessStatus.tsx
│   │   │   └── FailedStatus.tsx
│   │   └── PaymentMethodSelector/
│   │
│   ├── transactions/              # Transaction components
│   │   ├── TransactionList/
│   │   ├── TransactionCard/
│   │   └── TransactionFilters/
│   │
│   ├── receipts/                  # Receipt components
│   │   └── ReceiptDownload/
│   │
│   ├── dashboard/                 # Dashboard components
│   │   ├── StatsCard/
│   │   └── RecentTransactions/
│   │
│   ├── layout/                    # Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Navbar/
│   │   └── Footer/
│   │
│   └── shared/                    # Shared components
│       ├── ErrorBoundary/
│       ├── LoadingSpinner/
│       └── ErrorMessage/
│
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── usePaymentLinks.ts
│   ├── useTransactions.ts
│   ├── usePayments.ts
│   ├── useReceipts.ts
│   └── useDashboard.ts
│
├── services/                      # API services
│   ├── api/
│   │   ├── auth.api.ts
│   │   ├── products.api.ts
│   │   ├── payment-links.api.ts
│   │   ├── transactions.api.ts
│   │   ├── payments.api.ts
│   │   └── receipts.api.ts
│   └── api-client.ts              # Axios instance
│
├── stores/                        # Zustand stores
│   ├── auth.store.ts
│   ├── ui.store.ts
│   └── toast.store.ts
│
├── lib/                           # Library configurations
│   ├── react-query.tsx            # React Query setup
│   └── api-client.ts              # API client setup
│
├── types/                         # TypeScript types
│   ├── auth.types.ts
│   ├── product.types.ts
│   ├── payment-link.types.ts
│   ├── transaction.types.ts
│   └── api.types.ts
│
├── utils/                         # Utility functions
│   ├── validation.ts
│   ├── formatting.ts
│   ├── errors.ts
│   └── constants.ts
│
├── styles/                        # Global styles
│   ├── globals.css
│   └── variables.css
│
├── public/                        # Static assets
│   ├── images/
│   └── icons/
│
├── test/                          # Tests
│   ├── components/
│   ├── hooks/
│   └── e2e/
│
├── next.config.js
├── tailwind.config.js             # If using Tailwind
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🏷️ Meaningful Naming Conventions

### File Naming
```
✅ GOOD:
- user.service.ts
- payment-link.controller.ts
- ProductForm.tsx
- useAuth.ts
- auth.store.ts

❌ BAD:
- service.ts
- controller.ts
- form.tsx
- hook.ts
- store.ts
```

### Variable Naming
```typescript
✅ GOOD:
- const paymentLink = await getPaymentLink(id);
- const currentUser = await getUser();
- const isAuthenticated = checkAuth();
- const hasExpired = paymentLink.isExpired();
- const MAX_RETRY_ATTEMPTS = 3;
- const API_BASE_URL = process.env.API_URL;

❌ BAD:
- const pl = await getPaymentLink(id);
- const user = await getUser();
- const auth = checkAuth();
- const expired = paymentLink.isExpired();
- const max = 3;
- const url = process.env.API_URL;
```

### Function Naming
```typescript
✅ GOOD:
- async function generatePaymentLink(userId: string)
- function validatePaymentAmount(amount: number)
- function calculateTransactionFee(amount: number)
- function isPaymentLinkExpired(paymentLink: PaymentLink)
- function formatCurrency(amount: number)

❌ BAD:
- async function gen(userId: string)
- function validate(amount: number)
- function calc(amount: number)
- function check(paymentLink: PaymentLink)
- function format(amount: number)
```

### Component Naming
```typescript
✅ GOOD:
- ProductForm
- PaymentLinkCard
- TransactionStatusBadge
- PaymentMethodSelector
- ReceiptDownloadButton

❌ BAD:
- Form
- Card
- Badge
- Selector
- Button
```

### Type/Interface Naming
```typescript
✅ GOOD:
- interface PaymentLink { ... }
- type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED'
- interface CreateProductDto { ... }
- type PaymentProvider = 'MTN' | 'VODAFONE' | 'AIRTELTIGO'

❌ BAD:
- interface Link { ... }
- type Status = 'PENDING' | 'SUCCESS' | 'FAILED'
- interface Dto { ... }
- type Provider = 'MTN' | 'VODAFONE' | 'AIRTELTIGO'
```

---

## 🔄 Reusable Components and Services

### Component Reusability Principles

#### 1. Single Responsibility
```typescript
✅ GOOD: Each component has one clear purpose
// ProductCard.tsx - Displays a single product
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <span>{formatCurrency(product.price)}</span>
    </div>
  );
}

❌ BAD: Component does too much
// ProductCard.tsx - Displays product AND handles form AND manages state
export function ProductCard({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(product);
  // ... lots of logic
}
```

#### 2. Composition Over Inheritance
```typescript
✅ GOOD: Compose smaller components
export function PaymentLinkCard({ paymentLink }: Props) {
  return (
    <Card>
      <CardHeader>
        <PaymentLinkTitle title={paymentLink.title} />
        <PaymentLinkStatus status={paymentLink.status} />
      </CardHeader>
      <CardBody>
        <PaymentLinkDetails paymentLink={paymentLink} />
        <QRCodeDisplay slug={paymentLink.slug} />
      </CardBody>
      <CardFooter>
        <PaymentLinkActions paymentLink={paymentLink} />
      </CardFooter>
    </Card>
  );
}
```

#### 3. Props Interface
```typescript
✅ GOOD: Clear, typed props
interface PaymentLinkCardProps {
  paymentLink: PaymentLink;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showQRCode?: boolean;
}

export function PaymentLinkCard({
  paymentLink,
  onEdit,
  onDelete,
  showQRCode = true,
}: PaymentLinkCardProps) {
  // ...
}

❌ BAD: Any types, unclear props
export function PaymentLinkCard(props: any) {
  // ...
}
```

### Service Reusability Principles

#### 1. Single Responsibility Services
```typescript
✅ GOOD: Each service has one clear purpose
// payment-links.service.ts
@Injectable()
export class PaymentLinksService {
  async create(dto: CreatePaymentLinkDto): Promise<PaymentLink> { }
  async findAll(userId: string): Promise<PaymentLink[]> { }
  async findOne(id: string): Promise<PaymentLink> { }
  async update(id: string, dto: UpdatePaymentLinkDto): Promise<PaymentLink> { }
  async remove(id: string): Promise<void> { }
}

❌ BAD: Service does everything
@Injectable()
export class PaymentService {
  // Payment links, payments, transactions, receipts all in one service
}
```

#### 2. Utility Services
```typescript
✅ GOOD: Reusable utility services
// qr-code.service.ts
@Injectable()
export class QRCodeService {
  async generatePaymentLinkQRCode(slug: string): Promise<string> { }
  async generateReceiptQRCode(transactionId: string): Promise<string> { }
}

// Can be used by multiple modules
```

#### 3. Service Composition
```typescript
✅ GOOD: Services can use other services
@Injectable()
export class PaymentsService {
  constructor(
    private paymentLinksService: PaymentLinksService,
    private idempotencyService: IdempotencyService,
    private mansaTransfersService: MansaTransfersService,
  ) {}
  
  async initiatePayment(dto: InitiatePaymentDto) {
    // Use other services
    const paymentLink = await this.paymentLinksService.findOne(dto.paymentLinkId);
    // ...
  }
}
```

---

## ⚠️ Proper Error Handling

### Backend Error Handling

#### 1. Global Exception Filter
```typescript
// common/filters/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors || [];
      } else {
        message = exceptionResponse as string;
      }
    }

    // Log error (don't expose to client)
    console.error('Error:', {
      status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });

    response.status(status).json({
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

#### 2. Custom Exceptions
```typescript
// common/exceptions/payment-link-not-found.exception.ts
export class PaymentLinkNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Payment link with ID ${id} not found`);
  }
}

// Usage
throw new PaymentLinkNotFoundException(id);
```

#### 3. Service Error Handling
```typescript
✅ GOOD: Proper error handling in services
async findOne(id: string, userId: string): Promise<PaymentLink> {
  const paymentLink = await this.prisma.paymentLink.findFirst({
    where: { id, userId },
  });

  if (!paymentLink) {
    throw new PaymentLinkNotFoundException(id);
  }

  if (!paymentLink.isActive) {
    throw new BadRequestException('Payment link is inactive');
  }

  if (paymentLink.isExpired()) {
    throw new BadRequestException('Payment link has expired');
  }

  return paymentLink;
}

❌ BAD: No error handling
async findOne(id: string): Promise<PaymentLink> {
  return await this.prisma.paymentLink.findUnique({ where: { id } });
  // What if not found? What if expired?
}
```

### Frontend Error Handling

#### 1. Error Boundary
```typescript
// components/shared/ErrorBoundary/ErrorBoundary.tsx
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>Please refresh the page or contact support.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

#### 2. API Error Handling
```typescript
// services/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden
        throw new Error('You do not have permission to perform this action');
      } else if (status === 404) {
        throw new Error(data.message || 'Resource not found');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later');
      } else {
        throw new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your connection');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
);
```

#### 3. React Query Error Handling
```typescript
// hooks/useProducts.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
    onError: (error: Error) => {
      // Show toast notification
      toast.error(error.message || 'Failed to load products');
    },
  });
}

// Usage in component
function ProductList() {
  const { data, isLoading, error } = useProducts();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return (
    <div>
      {data?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 📝 Code Quality Checklist

### For Each Feature:
- [ ] **Folder Structure**: Follows established structure
- [ ] **Naming**: Meaningful, descriptive names
- [ ] **Components**: Reusable, single responsibility
- [ ] **Services**: Reusable, single responsibility
- [ ] **Error Handling**: Proper error handling implemented
- [ ] **Types**: TypeScript types defined
- [ ] **Validation**: Input validation on frontend and backend
- [ ] **Comments**: Complex logic has comments
- [ ] **Testing**: Basic tests written (if time permits)

---

## 🎯 Quick Reference

### Naming Conventions Quick Guide:
- **Files**: `kebab-case.ts` or `PascalCase.tsx` (components)
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Functions**: `camelCase`
- **Components**: `PascalCase`
- **Types/Interfaces**: `PascalCase`
- **Services**: `PascalCase` + `.service.ts`
- **Controllers**: `PascalCase` + `.controller.ts`
- **DTOs**: `PascalCase` + `.dto.ts`
- **Entities**: `PascalCase` + `.entity.ts`

### Folder Organization Quick Guide:
- **Group by feature** (products, payments, etc.)
- **Group related files** (controller, service, DTOs together)
- **Separate concerns** (components, services, types)
- **Keep it shallow** (avoid deep nesting)
- **Use index files** (for cleaner imports)

---

**Remember**: Code quality is not about perfection, it's about maintainability and clarity. Focus on making code that you (and others) can understand and modify easily.


