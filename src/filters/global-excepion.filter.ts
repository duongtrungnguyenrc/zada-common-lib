import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { Request, Response } from "express";

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = "Internal server error";
    let errorName = "InternalServerError";

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object") {
        const r = res as Record<string, any>;
        message = r.message ?? exception.message;
        errorName = r.error ?? exception.name;
      }
    } else if (exception instanceof RpcException) {
      const error = exception.getError();

      if (typeof error === "object" && error !== null) {
        const e = error as any;
        message = e.message ?? JSON.stringify(e);
        const code = e.code ?? GrpcStatus.UNKNOWN;
        statusCode = this.mapGrpcCodeToHttp(code);
        errorName = e.name ?? "RpcException";
      } else {
        message = typeof error === "string" ? error : JSON.stringify(error);
        statusCode = HttpStatus.BAD_REQUEST;
        errorName = "RpcException";
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name;
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    } else {
      message = JSON.stringify(exception);
      errorName = "UnknownError";
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapGrpcCodeToHttp(code: number): number {
    switch (code) {
      case GrpcStatus.OK:
        return HttpStatus.OK;
      case GrpcStatus.CANCELLED:
        return HttpStatus.REQUEST_TIMEOUT;
      case GrpcStatus.UNKNOWN:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case GrpcStatus.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST;
      case GrpcStatus.DEADLINE_EXCEEDED:
        return HttpStatus.GATEWAY_TIMEOUT;
      case GrpcStatus.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case GrpcStatus.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case GrpcStatus.PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN;
      case GrpcStatus.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED;
      case GrpcStatus.RESOURCE_EXHAUSTED:
        return HttpStatus.TOO_MANY_REQUESTS;
      case GrpcStatus.FAILED_PRECONDITION:
        return HttpStatus.PRECONDITION_FAILED;
      case GrpcStatus.ABORTED:
        return HttpStatus.CONFLICT;
      case GrpcStatus.OUT_OF_RANGE:
        return HttpStatus.BAD_REQUEST;
      case GrpcStatus.UNIMPLEMENTED:
        return HttpStatus.NOT_IMPLEMENTED;
      case GrpcStatus.INTERNAL:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case GrpcStatus.UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case GrpcStatus.DATA_LOSS:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
