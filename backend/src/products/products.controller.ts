import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';
import type { User } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * POST /products
   * Create a new product
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: User,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(user.id, createProductDto);
  }

  /**
   * GET /products
   * Get all products for the authenticated user
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findAll(@CurrentUser() user: User) {
    return this.productsService.findAll(user.id);
  }

  /**
   * GET /products/image/*
   * Proxy endpoint to serve product images from S3 or local storage
   * This ensures images are accessible even if S3 bucket is private
   * IMPORTANT: This route must be before /products/:id to avoid route conflicts
   * Public endpoint - no authentication required (for public payment pages)
   */
  @Get('image/*')
  async getImage(@Req() req: Request, @Res() res: Response) {
    try {
      // Extract the key from the request path
      // Path will be like: /api/products/image/products/userId/timestamp-random.ext
      const fullPath = req.path;
      const imagePathPrefix = '/api/products/image/';
      let key = fullPath.replace(imagePathPrefix, '');
      
      if (!key) {
        throw new BadRequestException('Image key is required');
      }

      // Decode URL-encoded key (in case it's double-encoded or from query params)
      try {
        key = decodeURIComponent(key);
      } catch (e) {
        // If decoding fails, use original key
        // The key might already be decoded by Express
      }

      const imageBuffer = await this.storageService.getFile(key);
      
      // Determine content type from key
      const extension = key.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const contentType = contentTypes[extension || ''] || 'image/jpeg';

      // Set headers and send image
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(imageBuffer);
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve image: ${error.message}`);
    }
  }

  /**
   * GET /products/:id
   * Get a single product by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.findOne(id, user.id);
  }

  /**
   * PUT /products/:id
   * Update a product
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, user.id, updateProductDto);
  }

  /**
   * DELETE /products/:id
   * Delete a product (soft delete)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.remove(id, user.id);
  }

  /**
   * POST /products/upload-image
   * Upload a product image to S3 or local storage
   */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Image file size must be less than 5MB');
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const extension = file.originalname.split('.').pop() || 'jpg';
      const filename = `products/${user.id}/${timestamp}-${randomString}.${extension}`;

      // Upload to S3 or local storage
      const result = await this.storageService.uploadFile(
        file.buffer,
        filename,
        file.mimetype,
      );

      return {
        imageUrl: result.url,
        key: result.key,
        storageType: result.storageType,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }
}

