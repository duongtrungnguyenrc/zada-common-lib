import { ResponseVM } from "../vms";

export class HttpResponse {
  static ok<T>(message: string, data?: T): ResponseVM<T> {
    return {
      message,
      data,
      statusCode: 200,
      timestamp: new Date(),
    };
  }

  static created<T>(message: string, data?: T): ResponseVM<T> {
    return {
      message,
      data,
      statusCode: 201,
      timestamp: new Date(),
    };
  }
}
