import { AppController } from '../src/app.controller';

describe('AppController (Base Scaffold)', () => {
  it('should return running status for BrewLite API', () => {
    const controller = new AppController();
    expect(controller.getRoot()).toEqual({
      service: 'BrewLite API',
      status: 'running',
    });
  });
});