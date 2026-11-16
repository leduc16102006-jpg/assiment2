import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/../../tests'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  testRegex: '.*\\.(spec|integration)\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../../tests/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
    '^@nestjs/common$': '<rootDir>/../../tests/mock-nestjs-common.js',
    '^@nestjs/swagger$': '<rootDir>/../../tests/mock-nestjs-swagger.js',
    '^@nestjs/passport$': '<rootDir>/../../tests/mock-nestjs-passport.js',
    '^@nestjs/jwt$': '<rootDir>/../../tests/mock-nestjs-jwt.js',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;