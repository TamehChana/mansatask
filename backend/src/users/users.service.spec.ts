import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('should instantiate service with PrismaService dependency', () => {
    const newService = new UsersService(mockPrismaService);
    expect(newService).toBeInstanceOf(UsersService);
  });

  describe('getProfile', () => {
    const userId = 'user-123';

    it('should return user profile', async () => {
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProfile(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateProfile', () => {
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      name: 'Original Name',
      email: 'original@example.com',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully update user name', async () => {
      const updateDto: UpdateProfileDto = {
        name: 'Updated Name',
      };
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null); // No email conflict
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          name: 'Updated Name',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should successfully update user email', async () => {
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };
      const updatedUser = {
        ...mockUser,
        email: 'newemail@example.com',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null); // No email conflict
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: 'newemail@example.com',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should lowercase email when updating', async () => {
      const updateDto: UpdateProfileDto = {
        email: 'UPPERCASE@EXAMPLE.COM',
      };
      const updatedUser = {
        ...mockUser,
        email: 'uppercase@example.com',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: 'uppercase@example.com',
        },
        select: expect.any(Object),
      });
    });

    it('should update both name and email', async () => {
      const updateDto: UpdateProfileDto = {
        name: 'New Name',
        email: 'newemail@example.com',
      };
      const updatedUser = {
        ...mockUser,
        name: 'New Name',
        email: 'newemail@example.com',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          name: 'New Name',
          email: 'newemail@example.com',
        },
        select: expect.any(Object),
      });
    });

    it('should throw ConflictException when email is already taken', async () => {
      const updateDto: UpdateProfileDto = {
        email: 'taken@example.com',
      };
      const existingUser = {
        id: 'other-user',
        email: 'taken@example.com',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);

      await expect(
        service.updateProfile(userId, updateDto),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateProfile(userId, updateDto),
      ).rejects.toThrow('Email is already taken');
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should not throw ConflictException when email belongs to current user', async () => {
      const updateDto: UpdateProfileDto = {
        email: 'original@example.com', // Same as current user's email
      };
      const updatedUser = {
        ...mockUser,
        email: 'original@example.com',
      };

      // findFirst returns null because we exclude current user (id: { not: userId })
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should handle update with only name (no email)', async () => {
      const updateDto: UpdateProfileDto = {
        name: 'Updated Name',
      };
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findFirst).not.toHaveBeenCalled(); // Email check skipped
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          name: 'Updated Name',
        },
        select: expect.any(Object),
      });
    });

    it('should handle empty update DTO', async () => {
      const updateDto: UpdateProfileDto = {};
      const updatedUser = {
        ...mockUser,
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {},
        select: expect.any(Object),
      });
    });
  });
});


