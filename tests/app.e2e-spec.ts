// DÒNG ĐẦU TIÊN trong file test
process.env.NODE_ENV = 'test';
// ==========================================
// ✅ Bây giờ mới import các module
// ==========================================
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../apps/api/src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let orderId: number;
  let productIdToOrder: number;

  beforeAll(async () => {
    // Các biến môi trường khác
    process.env.VNPAY_TMN_CODE = 'MOCK_TMN_CODE';
    process.env.VNPAY_HASH_SECRET = 'MOCK_HASH_SECRET';
    process.env.VNPAY_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    process.env.VNPAY_RETURN_URL = 'http://localhost:3000/payments/vnpay/return';
    process.env.JWT_SECRET = 'MOCK_JWT_SECRET_FOR_E2E_TEST';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) - Kiểm tra trạng thái API', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        service: 'BrewLite API',
        status: 'running',
      });
  });

  describe('Luồng E2E: Từ Menu đến Thanh toán', () => {
    it('1. GET /products - Lấy danh sách sản phẩm từ menu', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      productIdToOrder = response.body[0].id;
    });

    it('2. POST /auth/login - Đăng nhập tài khoản test lấy JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'Password123' })
        .expect(200);
      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
    });

    it('3. POST /orders - Tạo đơn hàng mới', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ items: [{ productId: productIdToOrder, qty: 1, size: 'M' }] })
        .expect(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      orderId = response.body.id;
    });

    it('4. POST /payments - Thanh toán đơn hàng bằng WALLET', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('idempotency-key', `TEST-E2E-PAY-${Date.now()}`)
        .send({ orderId: orderId, method: 'WALLET', amount: 50000 })
        .expect(201);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('PAID');
    });

    it('5. GET /orders/:id - Kiểm tra lại trạng thái đơn hàng', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(response.body.id).toBe(orderId);
      expect(response.body.status).toBe('PAID');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
