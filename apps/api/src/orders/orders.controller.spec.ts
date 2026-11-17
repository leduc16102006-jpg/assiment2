
import 'reflect-metadata';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;

  const mockOrdersService = {
    create: jest.fn(),
    createFromCart: jest.fn(),
    findMyOrders: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 1,
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new OrdersController(
      mockOrdersService as unknown as OrdersService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order for the authenticated user', async () => {
      const dto = {
        items: [
          {
            productId: 1,
            qty: 2,
            size: 'M',
            toppings: ['Trân châu'],
          },
        ],
      };

      const expected = {
        id: 10,
        status: 'PENDING',
      };

      mockOrdersService.create.mockResolvedValue(expected);

      await expect(
        controller.create(mockRequest, dto),
      ).resolves.toEqual(expected);

      expect(mockOrdersService.create).toHaveBeenCalledWith(
        1,
        dto,
      );
    });
  });

  describe('createFromCart', () => {
    it('should create an order from the authenticated user cart', async () => {
      const dto = {
        promotionCode: 'WELCOME10',
      };

      const expected = {
        id: 11,
        status: 'PENDING',
      };

      mockOrdersService.createFromCart.mockResolvedValue(expected);

      await expect(
        controller.createFromCart(mockRequest, dto),
      ).resolves.toEqual(expected);

      expect(mockOrdersService.createFromCart).toHaveBeenCalledWith(
        1,
        dto,
      );
    });

    it('should allow checkout without promotion code', async () => {
      const dto = {};

      const expected = {
        id: 12,
        status: 'PENDING',
      };

      mockOrdersService.createFromCart.mockResolvedValue(expected);

      await expect(
        controller.createFromCart(mockRequest, dto),
      ).resolves.toEqual(expected);

      expect(mockOrdersService.createFromCart).toHaveBeenCalledWith(
        1,
        dto,
      );
    });
  });

  describe('findMyOrders', () => {
    it('should return orders belonging to the authenticated user', async () => {
      const expected = [
        { id: 1 },
        { id: 2 },
      ];

      mockOrdersService.findMyOrders.mockResolvedValue(expected);

      await expect(
        controller.findMyOrders(mockRequest),
      ).resolves.toEqual(expected);

      expect(mockOrdersService.findMyOrders).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return the requested order for the authenticated user', async () => {
      const expected = {
        id: 10,
      };

      mockOrdersService.findOne.mockResolvedValue(expected);

      await expect(
        controller.findOne(mockRequest, 10),
      ).resolves.toEqual(expected);

      expect(mockOrdersService.findOne).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('updateStatus', () => {
    it('should call the service to update order status', async () => {
      const dto = {
        status: 'PAID' as any,
      };

      const expected = {
        id: 10,
        status: 'PAID',
      };

      mockOrdersService.updateStatus.mockResolvedValue(expected);

      await expect(
        controller.updateStatus(10, dto),
      ).resolves.toEqual(expected);

      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(
        10,
        'PAID',
      );
    });
  });
});
