import {
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();

    jwtMock.sign.mockReturnValue('mock-access-token');

    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtMock as unknown as JwtService,
    );
  });

  it('TC01: đăng ký trùng email trả về 409 Conflict', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
    });

    await expect(
      service.register({
        fullName: 'Test User',
        email: 'user@example.com',
        password: 'Password123',
      }),
    ).rejects.toMatchObject({
      status: 409,
    });

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('TC02: đăng nhập sai mật khẩu trả về 401 Unauthorized', async () => {
    const passwordHash = await bcrypt.hash('Password123', 4);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'user@example.com',
      passwordHash,
      createdAt: new Date(),
    });

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'WrongPassword',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('TC03: đăng nhập đúng trả về accessToken', async () => {
    const passwordHash = await bcrypt.hash('Password123', 4);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'Test User',
      email: 'user@example.com',
      passwordHash,
      createdAt: new Date(),
    });

    const result = await service.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.tokenType).toBe('Bearer');
    expect(result.user.email).toBe('user@example.com');
    expect(result.user).not.toHaveProperty('passwordHash');

    expect(jwtMock.sign).toHaveBeenCalledWith({
      sub: 1,
      email: 'user@example.com',
    });
  });

  it('TC04: đăng ký hợp lệ tạo User và trả accessToken', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.user.create.mockResolvedValue({
      id: 2,
      fullName: 'New User',
      email: 'new@example.com',
      createdAt: new Date(),
    });

    const result = await service.register({
      fullName: 'New User',
      email: 'new@example.com',
      password: 'Password123',
    });

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.user.email).toBe('new@example.com');

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        fullName: 'New User',
        email: 'new@example.com',
        passwordHash: expect.any(String) as string,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });
  });
});