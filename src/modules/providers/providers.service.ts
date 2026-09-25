import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { EncryptionUtil } from '../../common/utils/encryption.util';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProviderDto) {
    if (dto.isDefault) {
      await this.prisma.aiProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const encryptedKey = EncryptionUtil.encrypt(dto.apiKey);

    const provider = await this.prisma.aiProvider.create({
      data: {
        name: dto.name,
        provider: dto.provider,
        apiKeyEnc: encryptedKey,
        modelName: dto.modelName,
        baseUrl: dto.baseUrl,
        isDefault: dto.isDefault ?? false,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        modelName: true,
        baseUrl: true,
        isDefault: true,
        isEnabled: true,
        createdAt: true,
      },
    });

    return {
      message: 'AI Provider added successfully (API key securely encrypted)',
      provider,
    };
  }

  async findAll() {
    return this.prisma.aiProvider.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        modelName: true,
        baseUrl: true,
        isDefault: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        provider: true,
        modelName: true,
        baseUrl: true,
        isDefault: true,
        isEnabled: true,
        createdAt: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('AI Provider not found');
    }

    return provider;
  }

  async update(id: string, dto: UpdateProviderDto) {
    await this.findOne(id);

    if (dto.isDefault) {
      await this.prisma.aiProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const dataToUpdate: any = { ...dto };
    if (dto.apiKey) {
      dataToUpdate.apiKeyEnc = EncryptionUtil.encrypt(dto.apiKey);
      delete dataToUpdate.apiKey;
    }

    return this.prisma.aiProvider.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        provider: true,
        modelName: true,
        isDefault: true,
        isEnabled: true,
        updatedAt: true,
      },
    });
  }

  async toggleStatus(id: string) {
    const provider = await this.findOne(id);
    return this.prisma.aiProvider.update({
      where: { id },
      data: { isEnabled: !provider.isEnabled },
      select: {
        id: true,
        name: true,
        isEnabled: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.aiProvider.delete({ where: { id } });
    return { message: 'AI Provider removed successfully' };
  }

  async healthCheck(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('AI Provider not found');

    try {
      const decryptedKey = EncryptionUtil.decrypt(provider.apiKeyEnc);
      const isKeyHealthy = decryptedKey && decryptedKey.length > 5;

      return {
        providerId: provider.id,
        name: provider.name,
        provider: provider.provider,
        status: isKeyHealthy && provider.isEnabled ? 'HEALTHY' : 'DEGRADED',
        isEnabled: provider.isEnabled,
        keyConfigured: Boolean(isKeyHealthy),
        checkedAt: new Date(),
      };
    } catch (error) {
      return {
        providerId: provider.id,
        status: 'UNHEALTHY',
        error: 'Failed to decrypt API key or provider misconfigured',
        checkedAt: new Date(),
      };
    }
  }

  // Used internally by ChatModule
  async getDefaultOrSelected(providerId?: string) {
    if (providerId) {
      const provider = await this.prisma.aiProvider.findUnique({ where: { id: providerId } });
      if (!provider || !provider.isEnabled) {
        throw new BadRequestException('Selected AI Provider is inactive or not found');
      }
      return {
        ...provider,
        apiKey: EncryptionUtil.decrypt(provider.apiKeyEnc),
      };
    }

    const defaultProvider = await this.prisma.aiProvider.findFirst({
      where: { isDefault: true, isEnabled: true },
    }) || await this.prisma.aiProvider.findFirst({
      where: { isEnabled: true },
    });

    if (!defaultProvider) {
      throw new BadRequestException('No active AI Provider configured in system');
    }

    return {
      ...defaultProvider,
      apiKey: EncryptionUtil.decrypt(defaultProvider.apiKeyEnc),
    };
  }
}