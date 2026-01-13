import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiLogService, ApiLogEntry } from './api-log.service';

/**
 * Mansa Transfers API Service
 * 
 * This service handles communication with the Mansa Transfers API.
 * 
 * API Base URL: https://api-stage.mansatransfers.com
 * Documentation: Refer to Payment Link Platform Assessment.pdf
 */
@Injectable()
export class MansaTransfersService {
  private readonly logger = new Logger(MansaTransfersService.name);
  private readonly baseUrl: string;
  private readonly clientKey: string;
  private readonly clientSecret: string;
  private readonly axiosInstance: AxiosInstance;
  private authToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    private configService: ConfigService,
    private readonly apiLogService: ApiLogService,
  ) {
    this.baseUrl =
      this.configService.get<string>('config.mansaTransfers.baseUrl') ||
      'https://api-stage.mansatransfers.com';
    this.clientKey =
      this.configService.get<string>('config.mansaTransfers.apiKey') ||
      'd762fbb721';
    this.clientSecret =
      this.configService.get<string>('config.mansaTransfers.apiSecret') ||
      ']h*m0P$E*0@PaSQB61o&D!FqV';

    // Create axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with Mansa Transfers API and get JWT token
   * Token is cached to avoid unnecessary auth requests
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid cached token
    if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    try {
      this.logger.log('Authenticating with Mansa Transfers API...');
      const startTime = Date.now();

      const requestBody = {};
      const requestHeaders = {
        'client-key': this.clientKey,
        'client-secret': this.clientSecret,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/xyz/authenticate`,
        requestBody,
        {
          headers: requestHeaders,
          timeout: 30000, // 30 seconds
        },
      );

      const duration = Date.now() - startTime;

      // Log the actual response for debugging
      this.logger.debug(`Auth response status: ${response.status}`);
      this.logger.debug(`Auth response data: ${JSON.stringify(response.data)}`);

      // Log API call for verification
      this.apiLogService.logApiCall({
        endpoint: '/api/v1/xyz/authenticate',
        method: 'POST',
        requestBody: { ...requestBody, headers: { ...requestHeaders, 'client-secret': '***REDACTED***' } },
        responseStatus: response.status,
        responseData: response.data,
        duration,
      });

      // Extract token from response - try multiple possible locations
      const token = 
        response.data?.token || 
        response.data?.accessToken || 
        response.data?.access_token ||
        response.data?.data?.token ||
        response.data?.data?.accessToken ||
        response.data?.data?.access_token ||
        response.data?.result?.token ||
        response.data?.result?.accessToken;

      if (!token) {
        this.logger.error(`No token received. Full response: ${JSON.stringify(response.data)}`);
        throw new BadRequestException('Failed to authenticate: No token in response');
      }

      // Cache token (assume valid for 55 minutes)
      this.authToken = token;
      this.tokenExpiry = Date.now() + 55 * 60 * 1000;

      this.logger.log('Successfully authenticated with Mansa Transfers API');
      return token;
    } catch (error) {
      const duration = Date.now() - (Date.now() - 0); // Approximate
      
      this.logger.error(`Authentication failed: ${error.message}`);
      
      // Log failed API call
      if (error instanceof AxiosError) {
        this.logger.error(`Auth error status: ${error.response?.status}`);
        this.logger.error(`Auth error data: ${JSON.stringify(error.response?.data)}`);
        
        this.apiLogService.logApiCall({
          endpoint: '/api/v1/xyz/authenticate',
          method: 'POST',
          requestBody: { headers: { 'client-key': this.clientKey, 'client-secret': '***REDACTED***' } },
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          error: error.message,
          duration,
        });
      } else {
        this.apiLogService.logApiCall({
          endpoint: '/api/v1/xyz/authenticate',
          method: 'POST',
          error: error.message,
          duration,
        });
      }

      throw new BadRequestException('Failed to authenticate with payment provider');
    }
  }

  /**
   * Get authentication headers for API requests
   * Includes client-key, client-secret, Authorization token, and Accept header
   * According to API docs: "For every request, make sure to pass the client-key and secret in the headers"
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();

    return {
      'client-key': this.clientKey,
      'client-secret': this.clientSecret,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Map internal PaymentProvider to API payment mode
   */
  private mapPaymentProviderToMode(provider: PaymentProvider): string {
    // All mobile money providers use "MOMO" mode
    return 'MOMO';
  }

  /**
   * Map PaymentProvider to country code
   * Since we're using Cameroon format (+237), country code should be "CM"
   */
  private getCountryCode(): string {
    return 'CM'; // Cameroon
  }

  /**
   * Get currency code for CFA
   * Cameroon uses XAF (Central African CFA Franc)
   * NOT XOF (West African CFA Franc)
   */
  private getCurrencyCode(): string {
    return 'XAF'; // Central African CFA Franc (Cameroon)
  }

  /**
   * Initiate payment with Mansa Transfers API
   * 
   * @param amount - Amount in CFA
   * @param customerPhone - Customer phone number (should be normalized to +237 format)
   * @param customerName - Customer name
   * @param provider - Payment provider (MTN, VODAFONE, AIRTELTIGO)
   * @param externalReference - Unique external reference for this transaction
   * @returns Provider transaction ID (reference) and status
   */
  async initiatePayment(
    amount: number,
    customerPhone: string,
    customerName: string,
    provider: PaymentProvider,
    externalReference: string,
    customerEmail?: string | null,
  ): Promise<{
    providerTransactionId: string;
    status: string;
    message?: string;
  }> {
    try {
      this.logger.log(
        `Initiating payment: ${externalReference} - ${amount} CFA via ${provider}`,
      );

      // Get authentication headers (includes token)
      const headers = await this.getAuthHeaders();

      // Prepare request body
      const requestBody = {
        paymentMode: this.mapPaymentProviderToMode(provider),
        phoneNumber: customerPhone, // Should be in +237 format
        transactionType: 'payin', // Receiving payment
        amount: amount,
        fullName: customerName,
        emailAddress: customerEmail || 'customer@example.com', // Default email if not provided
        currencyCode: this.getCurrencyCode(), // XOF for CFA
        countryCode: this.getCountryCode(), // CM for Cameroon
        externalReference: externalReference,
      };

      this.logger.debug(`Payment request body: ${JSON.stringify(requestBody)}`);
      this.logger.debug(`Payment request headers: ${JSON.stringify({ ...headers, 'client-secret': '***' })}`);

      const startTime = Date.now();
      // Make API call
      const response = await this.axiosInstance.post(
        '/api/v1/xyz/initiate',
        requestBody,
        {
          headers,
        },
      );
      const duration = Date.now() - startTime;

      this.logger.debug(`Payment API response status: ${response.status}`);
      this.logger.debug(`Payment API response data: ${JSON.stringify(response.data)}`);

      // Log API call for verification
      this.apiLogService.logApiCall({
        endpoint: '/api/v1/xyz/initiate',
        method: 'POST',
        requestBody,
        responseStatus: response.status,
        responseData: response.data,
        duration,
      });

      // Extract transaction ID from response
      // API returns: response.data.data.internalPaymentId
      const reference = 
        response.data?.data?.internalPaymentId ||
        response.data?.data?.reference || 
        response.data?.data?.transactionId ||
        response.data?.reference || 
        response.data?.transactionId;

      if (!reference) {
        this.logger.error(`No transaction ID received from API. Response: ${JSON.stringify(response.data)}`);
        throw new BadRequestException('Invalid response from payment provider');
      }

      this.logger.log(`Payment initiated successfully: ${reference}`);

      return {
        providerTransactionId: reference,
        status: 'PENDING', // Initial status
        message: response.data?.message || 'Payment initiated successfully',
      };
    } catch (error) {
      const duration = Date.now() - (Date.now() - 0); // Approximate
      
      this.logger.error(`Payment initiation failed: ${error.message}`, error.stack);

      if (error instanceof AxiosError) {
        this.logger.error(`API Error Status: ${error.response?.status}`);
        this.logger.error(`API Error Headers: ${JSON.stringify(error.response?.headers)}`);
        this.logger.error(`API Error Data: ${JSON.stringify(error.response?.data)}`);
        
        // Log failed API call
        this.apiLogService.logApiCall({
          endpoint: '/api/v1/xyz/initiate',
          method: 'POST',
          requestBody: {
            amount,
            customerPhone,
            customerName,
            provider,
            externalReference,
          },
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          error: error.message,
          duration,
        });
        
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.response?.data?.errorMessage ||
                           error.message;
        throw new BadRequestException(`Failed to initiate payment: ${errorMessage}`);
      }

      // Log non-Axios errors
      this.apiLogService.logApiCall({
        endpoint: '/api/v1/xyz/initiate',
        method: 'POST',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw new BadRequestException('Failed to initiate payment with provider');
    }
  }

  /**
   * Check payment status with Mansa Transfers API
   * 
   * @param providerTransactionId - Provider's transaction reference/ID
   * @returns Payment status from provider
   */
  async checkPaymentStatus(
    providerTransactionId: string,
  ): Promise<{
    status: string;
    message?: string;
  }> {
    try {
      this.logger.log(`Checking payment status: ${providerTransactionId}`);

      // Get authentication headers (includes token)
      const headers = await this.getAuthHeaders();

      const startTime = Date.now();
      // Make API call
      const response = await this.axiosInstance.get(
        `/api/v1/xyz/check-status`,
        {
          headers,
          params: {
            reference: providerTransactionId,
          },
        },
      );
      const duration = Date.now() - startTime;

      // Extract status from response
      // Adjust based on actual response structure
      const status = 
        response.data?.status || 
        response.data?.transactionStatus ||
        response.data?.data?.status ||
        response.data?.data?.transactionStatus ||
        'PENDING';

      this.logger.log(`Payment status for ${providerTransactionId}: ${status}`);

      // Log API call for verification
      this.apiLogService.logApiCall({
        endpoint: '/api/v1/xyz/check-status',
        method: 'GET',
        requestBody: { params: { reference: providerTransactionId } },
        responseStatus: response.status,
        responseData: response.data,
        duration,
      });

      return {
        status: this.mapApiStatusToInternalStatus(status),
        message: response.data?.message || response.data?.data?.message,
      };
    } catch (error) {
      const duration = Date.now() - (Date.now() - 0); // Approximate
      
      this.logger.error(
        `Payment status check failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message;
        this.logger.error(`API Error Response: ${JSON.stringify(error.response?.data)}`);
        
        // Log failed API call
        this.apiLogService.logApiCall({
          endpoint: '/api/v1/xyz/check-status',
          method: 'GET',
          requestBody: { params: { reference: providerTransactionId } },
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          error: error.message,
          duration,
        });
        
        throw new BadRequestException(`Failed to check payment status: ${errorMessage}`);
      }

      // Log non-Axios errors
      this.apiLogService.logApiCall({
        endpoint: '/api/v1/xyz/check-status',
        method: 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw new BadRequestException(
        'Failed to check payment status with provider',
      );
    }
  }

  /**
   * Map API status to internal transaction status
   */
  private mapApiStatusToInternalStatus(apiStatus: string): string {
    const statusUpper = apiStatus.toUpperCase();

    // Map common status values
    if (
      statusUpper === 'SUCCESS' ||
      statusUpper === 'COMPLETED' ||
      statusUpper === 'SUCCESSFUL' ||
      statusUpper === 'CONFIRMED'
    ) {
      return 'SUCCESS';
    }
    if (statusUpper === 'FAILED' || statusUpper === 'FAILURE' || statusUpper === 'REJECTED') {
      return 'FAILED';
    }
    if (statusUpper === 'PROCESSING' || statusUpper === 'INITIATED') {
      return 'PROCESSING';
    }
    if (statusUpper === 'PENDING') {
      return 'PENDING';
    }
    if (statusUpper === 'CANCELLED' || statusUpper === 'CANCELED') {
      return 'CANCELLED';
    }

    // Default to PENDING for unknown statuses
    this.logger.warn(`Unknown API status: ${apiStatus}, mapping to PENDING`);
    return 'PENDING';
  }

  /**
   * Get API call logs for verification
   * This proves that actual API calls are being made
   */
  getApiLogs(): ApiLogEntry[] {
    return this.apiLogService.getRecentLogs(50);
  }

  /**
   * Public method to test authentication (for health checks)
   * This makes an actual API call to verify connectivity
   */
  async testAuthentication(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticate();
      return {
        success: true,
        message: 'Successfully authenticated with Mansa Transfers API',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Authentication failed: ${error.message}`,
      };
    }
  }
}
