export interface Receipt {
  id: string;
  transactionId: string;
  receiptNumber: string;
  pdfUrl: string;
  pdfPath?: string;
  createdAt: string;
  transaction?: {
    id: string;
    externalReference: string;
    amount: string;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    provider: string;
    providerTransactionId?: string;
    createdAt: string;
  };
}

export interface ReceiptResponse {
  success: boolean;
  data: Receipt;
  message?: string;
}

