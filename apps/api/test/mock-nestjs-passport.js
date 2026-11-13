const AuthGuard = () => class {
  canActivate() {
    return true;
  }
};
const PassportStrategy = (_Strategy, _name) => class {};
module.exports = {
  __esModule: true,
  AuthGuard,
  PassportStrategy,
  default: {},
};