import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import { RedisService } from '../../redis/redis.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let redisService: RedisService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    exists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    redisService = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(redisService).toBeDefined();
  });

  it('should instantiate service with RedisService dependency', () => {
    const newService = new IdempotencyService(mockRedisService);
    expect(newService).toBeInstanceOf(IdempotencyService);
  });

  describe('getStoredResponse', () => {
    it('should return null when key does not exist', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getStoredResponse('test-key');

      expect(result).toBeNull();
      expect(mockRedisService.get).toHaveBeenCalledWith('idempotency:test-key');
    });

    it('should return parsed JSON when key exists', async () => {
      const storedResponse = { externalReference: 'TXN-123', status: 'PENDING' };
      mockRedisService.get.mockResolvedValue(JSON.stringify(storedResponse));

      const result = await service.getStoredResponse('test-key');

      expect(result).toEqual(storedResponse);
      expect(mockRedisService.get).toHaveBeenCalledWith('idempotency:test-key');
    });

    it('should return null when stored value is invalid JSON', async () => {
      mockRedisService.get.mockResolvedValue('invalid-json');

      const result = await service.getStoredResponse('test-key');

      expect(result).toBeNull();
    });
  });

  describe('storeResponse', () => {
    it('should store response successfully when key does not exist', async () => {
      const response = { externalReference: 'TXN-123', status: 'PENDING' };
      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.storeResponse('test-key', response);

      expect(result).toBe(true);
      expect(mockRedisService.exists).toHaveBeenCalledWith('idempotency:test-key');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'idempotency:test-key',
        JSON.stringify(response),
        86400, // 24 hours default TTL
      );
    });

    it('should return false when key already exists', async () => {
      const response = { externalReference: 'TXN-123', status: 'PENDING' };
      mockRedisService.exists.mockResolvedValue(true);

      const result = await service.storeResponse('test-key', response);

      expect(result).toBe(false);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should use custom TTL when provided', async () => {
      const response = { externalReference: 'TXN-123', status: 'PENDING' };
      const customTTL = 3600; // 1 hour
      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.set.mockResolvedValue(undefined);

      await service.storeResponse('test-key', response, customTTL);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'idempotency:test-key',
        JSON.stringify(response),
        customTTL,
      );
    });
  });

  describe('processRequest', () => {
    it('should return stored response when key exists', async () => {
      const storedResponse = { externalReference: 'TXN-123', status: 'PENDING' };
      mockRedisService.get.mockResolvedValue(JSON.stringify(storedResponse));

      const requestHandler = jest.fn();

      const result = await service.processRequest('test-key', requestHandler);

      expect(result).toEqual(storedResponse);
      expect(requestHandler).not.toHaveBeenCalled();
    });

    it('should execute handler and store response when key does not exist', async () => {
      const newResponse = { externalReference: 'TXN-456', status: 'SUCCESS' };
      const requestHandler = jest.fn().mockResolvedValue(newResponse);

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.processRequest('test-key', requestHandler);

      expect(result).toEqual(newResponse);
      expect(requestHandler).toHaveBeenCalledTimes(1);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'idempotency:test-key',
        JSON.stringify(newResponse),
        86400,
      );
    });

    it('should use custom TTL when provided', async () => {
      const newResponse = { externalReference: 'TXN-456', status: 'SUCCESS' };
      const requestHandler = jest.fn().mockResolvedValue(newResponse);
      const customTTL = 3600;

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.set.mockResolvedValue(undefined);

      await service.processRequest('test-key', requestHandler, customTTL);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'idempotency:test-key',
        JSON.stringify(newResponse),
        customTTL,
      );
    });
  });

  describe('validateOrThrow', () => {
    it('should return stored response when key exists', async () => {
      const storedResponse = { externalReference: 'TXN-123', status: 'PENDING' };
      mockRedisService.get.mockResolvedValue(JSON.stringify(storedResponse));

      const result = await service.validateOrThrow('test-key');

      expect(result).toEqual(storedResponse);
    });

    it('should return null when key does not exist', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.validateOrThrow('test-key');

      expect(result).toBeNull();
    });
  });
});

