/**
 * 接口状态码
 */
export enum ApiStatus {
  success = 200, // 请求成功
  created = 201, // 创建成功
  noContent = 204, // 无内容（删除/登出等）
  error = 400, // 请求错误
  unauthorized = 401, // 未授权
  forbidden = 403, // 禁止访问
  notFound = 404, // 未找到
  methodNotAllowed = 405, // 方法不允许
  requestTimeout = 408, // 请求超时
  unprocessableEntity = 422, // 表单验证失败
  internalServerError = 500, // 服务器错误
  notImplemented = 501, // 未实现
  badGateway = 502, // 网关错误
  serviceUnavailable = 503, // 服务不可用
  gatewayTimeout = 504, // 网关超时
  httpVersionNotSupported = 505 // HTTP版本不支持
}
