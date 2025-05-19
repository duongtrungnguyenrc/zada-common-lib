import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { I18nContext } from "nestjs-i18n";

@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const i18n = I18nContext.current(host)!;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = i18n.t("db.internal_server_error");

    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (typeof res === "string") {
        message = res;
      } else {
        const objRes = res as Record<string, any>;
        if (Array.isArray(objRes.message)) {
          message = objRes.message.map((msg) => i18n.t(msg)).join(" ");
        } else {
          message = objRes.message;
        }
        statusCode = objRes.statusCode;
      }
    } else if (exception instanceof RpcException) {
      const error = exception.getError();
      const isErrorObject = typeof error === "object" && error !== null;

      if (isErrorObject) {
        const e = error as any;
        statusCode = this.mapGrpcCodeToHttp(e.code ?? GrpcStatus.UNKNOWN);
        message = e.message ?? JSON.stringify(e);
      } else {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = typeof error === "string" ? error : JSON.stringify(error);
      }
    } else if (exception instanceof QueryFailedError) {
      const handled = await this.mapPostgresError(exception.driverError ?? exception, i18n);
      if (handled) {
        statusCode = handled.status;
        message = handled.message;
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      const pgHandled = await this.mapPostgresError(exception, i18n);
      if (pgHandled) {
        statusCode = pgHandled.status;
        message = pgHandled.message;
      } else {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = JSON.stringify(exception);
    }

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapGrpcCodeToHttp(code: number): number {
    const codeMap = {
      [GrpcStatus.OK]: HttpStatus.OK,
      [GrpcStatus.CANCELLED]: HttpStatus.REQUEST_TIMEOUT,
      [GrpcStatus.UNKNOWN]: HttpStatus.INTERNAL_SERVER_ERROR,
      [GrpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
      [GrpcStatus.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
      [GrpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND,
      [GrpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT,
      [GrpcStatus.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
      [GrpcStatus.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
      [GrpcStatus.RESOURCE_EXHAUSTED]: HttpStatus.TOO_MANY_REQUESTS,
      [GrpcStatus.FAILED_PRECONDITION]: HttpStatus.PRECONDITION_FAILED,
      [GrpcStatus.ABORTED]: HttpStatus.CONFLICT,
      [GrpcStatus.OUT_OF_RANGE]: HttpStatus.BAD_REQUEST,
      [GrpcStatus.UNIMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
      [GrpcStatus.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR,
      [GrpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
      [GrpcStatus.DATA_LOSS]: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    return codeMap[code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private async mapPostgresError(error: any, i18n: I18nContext): Promise<{ status: number; message: string } | null> {
    const code = error?.code;
    const rawMessage = error?.message || "";

    const pgErrorMap = {
      "23505": { status: HttpStatus.CONFLICT, key: "db.unique_constraint" },
      "23503": { status: HttpStatus.CONFLICT, key: "db.foreign_key_constraint" },
      "23502": { status: HttpStatus.BAD_REQUEST, key: "db.not_null_constraint" },
      "22P02": { status: HttpStatus.BAD_REQUEST, key: "db.invalid_text" },
      "42703": { status: HttpStatus.BAD_REQUEST, key: "db.column_not_exist" },
    };

    if (code && pgErrorMap[code]) {
      return {
        status: pgErrorMap[code].status,
        message: i18n.t(pgErrorMap[code].key),
      };
    }

    if (typeof rawMessage === "string") {
      if (rawMessage.includes("duplicate key value violates unique constraint")) {
        return {
          status: HttpStatus.CONFLICT,
          message: i18n.t("db.unique_constraint"),
        };
      }
      if (rawMessage.includes("violates foreign key constraint")) {
        return {
          status: HttpStatus.CONFLICT,
          message: i18n.t("db.foreign_key_constraint"),
        };
      }
      if (rawMessage.includes("null value in column") && rawMessage.includes("violates not-null constraint")) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: i18n.t("db.not_null_constraint"),
        };
      }
    }

    return null;
  }
}
