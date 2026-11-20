const decorator = () => (target, propertyKey, descriptor) =>
  descriptor || target;

module.exports = {
  __esModule: true,

  ApiTags: decorator,
  ApiOperation: decorator,
  ApiBearerAuth: decorator,
  ApiHeader: decorator,
  ApiParam: decorator,
  ApiResponse: decorator,
  ApiBody: decorator,
  ApiQuery: decorator,

  ApiProperty: decorator,
  ApiPropertyOptional: decorator,

  default: {},
};
