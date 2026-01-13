'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsService } from '@/services/receipts/receipts.service';

/**
 * Hook to get receipt by transaction ID
 */
export function useReceipt(transactionId: string) {
  return useQuery({
    queryKey: ['receipt', transactionId],
    queryFn: async () => {
      const response = await receiptsService.getReceipt(transactionId);
      return response.data;
    },
    enabled: !!transactionId,
    retry: 1,
  });
}

/**
 * Hook to generate receipt for a transaction
 */
export function useGenerateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await receiptsService.generateReceipt(transactionId);
      return response.data;
    },
    onSuccess: (data, transactionId) => {
      queryClient.invalidateQueries({ queryKey: ['receipt', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error) => {
      // Error is handled by the component using this hook
    },
  });
}

/**
 * Hook to download receipt PDF (authenticated)
 */
export function useDownloadReceipt() {
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const blob = await receiptsService.downloadReceipt(transactionId);
      
      // Get receipt info to determine filename
      const receiptResponse = await receiptsService.getReceipt(transactionId);
      const receipt = receiptResponse.data;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receipt.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return receipt;
    },
    onSuccess: () => {
      // Receipt downloaded successfully
    },
    onError: (error: Error) => {
      // Error is handled by the component using this hook
    },
  });
}

/**
 * Hook to download receipt PDF by external reference (public)
 */
export function useDownloadReceiptByExternalReference() {
  return useMutation({
    mutationFn: async (externalReference: string) => {
      const blob = await receiptsService.downloadReceiptByExternalReference(
        externalReference,
      );
      
      // Extract filename from Content-Disposition header or use default
      const filename = `receipt-${externalReference}.pdf`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      // Receipt downloaded successfully
    },
    onError: (error: Error) => {
      // Error is handled by the component using this hook
    },
  });
}
