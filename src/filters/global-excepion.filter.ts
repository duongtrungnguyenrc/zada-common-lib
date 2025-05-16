import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";
import { I18nContext } from "nestjs-i18n";

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const i18n = I18nContext.current(host);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = await i18n.t("db.internal_server_error");
    let errorName = "InternalServerError";

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = await i18n.t(res);
      } else if (typeof res === "object") {
        const r = res as Record<string, any>;
        const msg = r.message ?? exception.message;
        message = await i18n.t(msg);
        errorName = r.error ?? exception.name;
      }
    } else if (exception instanceof RpcException) {
      const error = exception.getError();
      if (typeof error === "object" && error !== null) {
        const e = error as any;
        const msg = e.message ?? JSON.stringify(e);
        const code = e.code ?? GrpcStatus.UNKNOWN;
        message = await i18n.t(msg);
        statusCode = this.mapGrpcCodeToHttp(code);
        errorName = e.name ?? "RpcException";
      } else {
        const msg = typeof error === "string" ? error : JSON.stringify(error);
        message = await i18n.t(msg);
        statusCode = HttpStatus.BAD_REQUEST;
        errorName = "RpcException";
      }
    } else if (exception instanceof QueryFailedError) {
      const handled = await this.mapPostgresError(exception.driverError ?? exception, i18n);
      if (handled) {
        statusCode = handled.status;
        message = handled.message;
        errorName = handled.name;
      } else {
        const msg = exception.message;
        message = await i18n.t(msg);
        errorName = "QueryFailedError";
        statusCode = HttpStatus.BAD_REQUEST;
      }
    } else if (exception instanceof Error) {
      const pgHandled = await this.mapPostgresError(exception, i18n);
      if (pgHandled) {
        statusCode = pgHandled.status;
        message = pgHandled.message;
        errorName = pgHandled.name;
      } else {
        const msg = exception.message;
        message = await i18n.t(msg);
        errorName = exception.name;
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    } else {
      const msg = JSON.stringify(exception);
      message = await i18n.t(msg);
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

  private async mapPostgresError(error: any, i18n: I18nContext): Promise<{ status: number; name: string; message: string } | null> {
    const code = error?.code;
    const rawMessage = error?.message || "";

    switch (code) {
      case "23505":
        return {
          status: HttpStatus.CONFLICT,
          name: "UniqueViolation",
          message: await i18n.t("db.unique_constraint"),
        };
      case "23503":
        return {
          status: HttpStatus.CONFLICT,
          name: "ForeignKeyViolation",
          message: await i18n.t("db.foreign_key_constraint"),
        };
      case "23502":
        return {
          status: HttpStatus.BAD_REQUEST,
          name: "NotNullViolation",
          message: await i18n.t("db.not_null_constraint"),
        };
      case "22P02":
        return {
          status: HttpStatus.BAD_REQUEST,
          name: "InvalidTextRepresentation",
          message: await i18n.t("db.invalid_text"),
        };
      case "42703":
        return {
          status: HttpStatus.BAD_REQUEST,
          name: "UndefinedColumn",
          message: await i18n.t("db.column_not_exist"),
        };
    }

    if (typeof rawMessage === "string") {
      if (rawMessage.includes("duplicate key value violates unique constraint")) {
        return {
          status: HttpStatus.CONFLICT,
          name: "UniqueViolation",
          message: await i18n.t("db.unique_constraint"),
        };
      }
      if (rawMessage.includes("violates foreign key constraint")) {
        return {
          status: HttpStatus.CONFLICT,
          name: "ForeignKeyViolation",
          message: await i18n.t("db.foreign_key_constraint"),
        };
      }
      if (rawMessage.includes("null value in column") && rawMessage.includes("violates not-null constraint")) {
        return {
          status: HttpStatus.BAD_REQUEST,
          name: "NotNullViolation",
          message: await i18n.t("db.not_null_constraint"),
        };
      }
    }

    return null;
  }
}
