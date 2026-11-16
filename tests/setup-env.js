// apps/api/test/setup-env.js
process.env.VNPAY_TMN_CODE = 'MOCK_TMN_CODE';
process.env.VNPAY_HASH_SECRET = 'MOCK_HASH_SECRET';
process.env.VNPAY_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNPAY_RETURN_URL = 'http://localhost:3000/payments/vnpay/return';
process.env.JWT_SECRET = 'MOCK_JWT_SECRET_FOR_E2E_TEST';