/**
 * Mock factories for testing
 */

/**
 * Mock Mansa Transfers Service
 */
export const createMockMansaTransfersService = () => ({
  initiatePayment: jest.fn().mockResolvedValue({
    providerTransactionId: 'MOCK-TXN-123',
    status: 'PENDING',
    message: 'Payment initiated successfully',
  }),
  checkPaymentStatus: jest.fn().mockResolvedValue({
    status: 'SUCCESS',
    message: 'Payment completed',
  }),
  testAuthentication: jest.fn().mockResolvedValue({
    success: true,
    message: 'Successfully authenticated',
  }),
  getApiLogs: jest.fn().mockResolvedValue([]),
});

/**
 * Mock Email Service
 */
export const createMockEmailService = () => ({
  sendPaymentSuccessEmail: jest.fn().mockResolvedValue(undefined),
  sendPaymentFailedEmail: jest.fn().mockResolvedValue(undefined),
  verifyConnection: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock Receipts Service
 */
export const createMockReceiptsService = () => ({
  generateReceipt: jest.fn().mockResolvedValue({
    id: 'receipt-123',
    transactionId: 'txn-123',
    receiptNumber: 'RCP-001',
    pdfPath: '/path/to/receipt.pdf',
  }),
  getReceiptByTransactionId: jest.fn(),
  downloadReceipt: jest.fn(),
});

/**
 * Mock Idempotency Service
 */
export const createMockIdempotencyService = () => ({
  getStoredResponse: jest.fn().mockResolvedValue(null),
  storeResponse: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock Redis Client
 */
export const createMockRedisClient = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
});

/**
 * Mock Config Service
 */
export const createMockConfigService = (overrides?: Record<string, any>) => ({
  get: jest.fn((key: string) => {
    const defaults: Record<string, any> = {
      'config.jwt.secret': 'test-secret',
      'config.jwt.expiration': '15m',
      'config.jwt.refreshSecret': 'test-refresh-secret',
      'config.jwt.refreshExpiration': '7d',
      'config.mansaTransfers.baseUrl': 'https://api-stage.mansatransfers.com',
      'config.mansaTransfers.apiKey': 'test-api-key',
      'config.mansaTransfers.apiSecret': 'test-api-secret',
      'config.email.host': 'smtp.gmail.com',
      'config.email.port': 587,
      'config.email.user': 'test@example.com',
      'config.email.pass': 'test-password',
      'config.email.from': 'test@example.com',
      'config.frontendUrl': 'http://localhost:3001',
      ...overrides,
    };
    return defaults[key];
  }),
});


