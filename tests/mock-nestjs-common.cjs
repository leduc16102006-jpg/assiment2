
// Decorator rỗng an toàn
const dummyDecorator = () => (target, propertyKey, descriptor) =>
  descriptor || target;

// HttpStatus của NestJS
const HttpStatus = {
  CONTINUE: 100,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

class HttpException extends Error {
  constructor(response, status = 500) {
    super(
      typeof response === 'string'
        ? response
        : response?.message || 'Http Exception',
    );
    this.response = response;
    this.status = status;
  }
}

class BadRequestException extends HttpException {
  constructor(message = 'Bad Request') {
    super(message, 400);
    this.name = 'BadRequestException';
  }
}

class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(message, 404);
    this.name = 'NotFoundException';
  }
}

class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedException';
  }
}

class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenException';
  }
}

class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(message, 409);
    this.name = 'ConflictException';
  }
}

class ServiceUnavailableException extends HttpException {
  constructor(message = 'Service Unavailable') {
    super(message, 503);
    this.name = 'ServiceUnavailableException';
  }
}

class ParseIntPipe {
  transform(value) {
    return parseInt(value, 10);
  }
}

class Logger {
  log() {}
  error() {}
  warn() {}
  debug() {}
  verbose() {}
}

class ConsoleLogger extends Logger {}

module.exports = {
  __esModule: true,

  HttpStatus,
  HttpException,

  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  ServiceUnavailableException,

  ParseIntPipe,
  Logger,
  ConsoleLogger,

  Injectable: dummyDecorator,
  Controller: dummyDecorator,
  Get: dummyDecorator,
  Post: dummyDecorator,
  Patch: dummyDecorator,
  Put: dummyDecorator,
  Delete: dummyDecorator,
  HttpCode: dummyDecorator,

  Body: dummyDecorator,
  Param: dummyDecorator,
  Req: dummyDecorator,
  Res: dummyDecorator,
  Headers: dummyDecorator,
  UseGuards: dummyDecorator,

  Inject: dummyDecorator,
  Optional: dummyDecorator,
  Module: dummyDecorator,

  default: {},
};
