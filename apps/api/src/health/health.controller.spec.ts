import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  let controller: HealthController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new HealthController(
      prismaMock as unknown as PrismaService,
    );
  });

  it('GET /health returns 200-compatible payload when DB responds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ result: 1 }]);

    const response = await controller.check();

    expect(response.status).toBe('ok');
    expect(response.database).toBe('connected');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('GET /health returns 503 if PostgreSQL is unavailable', async () => {
    prismaMock.$queryRaw.mockRejectedValue(
      new Error('INTERNAL_DB_CREDENTIAL_SENTINEL'),
    );

    let failure: unknown;
    try {
      await controller.check();
    } catch (error: unknown) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(ServiceUnavailableException);
    expect(failure).toMatchObject({
      status: 503,
      message: 'Database unavailable',
    });
    expect(JSON.stringify(failure)).not.toContain('INTERNAL_DB_CREDENTIAL_SENTINEL');
  });
});
