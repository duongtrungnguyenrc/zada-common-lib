import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { status as GrpcStatus } from "@grpc/grpc-js";
import { QueryFailedError } from "typeorm";

@Catch()
export class GrpcExceptionsFilter implements ExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost) {
    let code = GrpcStatus.UNKNOWN;
    let message: string = "rpc.internal_server_error";

    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (typeof res === "string") {
        message = res;
      } else {
        const objRes = res as Record<string, any>;
        if (Array.isArray(objRes.message)) {
          message = objRes.message.join(" ");
        } else {
          message = objRes.message;
        }
      }

      code = this.mapHttpToGrpcCode(exception.getStatus());
    } else if (exception instanceof QueryFailedError) {
      const handled = await this.mapPostgresError(exception.driverError ?? exception);
      if (handled) {
        code = handled.code;
        message = handled.message;
      } else {
        code = GrpcStatus.INVALID_ARGUMENT;
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      const pgHandled = await this.mapPostgresError(exception);
      if (pgHandled) {
        code = pgHandled.code;
        message = pgHandled.message;
      } else {
        code = GrpcStatus.INTERNAL;
        message = exception.message;
      }
    } else {
      code = GrpcStatus.INTERNAL;
      message = JSON.stringify(exception);
    }

    throw new RpcException({ code, message });
  }

  private mapHttpToGrpcCode(status: number): number {
    const codeMap = {
      [HttpStatus.OK]: GrpcStatus.OK,
      [HttpStatus.BAD_REQUEST]: GrpcStatus.INVALID_ARGUMENT,
      [HttpStatus.UNAUTHORIZED]: GrpcStatus.UNAUTHENTICATED,
      [HttpStatus.FORBIDDEN]: GrpcStatus.PERMISSION_DENIED,
      [HttpStatus.NOT_FOUND]: GrpcStatus.NOT_FOUND,
      [HttpStatus.CONFLICT]: GrpcStatus.ALREADY_EXISTS,
      [HttpStatus.PRECONDITION_FAILED]: GrpcStatus.FAILED_PRECONDITION,
      [HttpStatus.TOO_MANY_REQUESTS]: GrpcStatus.RESOURCE_EXHAUSTED,
      [HttpStatus.INTERNAL_SERVER_ERROR]: GrpcStatus.INTERNAL,
      [HttpStatus.NOT_IMPLEMENTED]: GrpcStatus.UNIMPLEMENTED,
      [HttpStatus.SERVICE_UNAVAILABLE]: GrpcStatus.UNAVAILABLE,
      [HttpStatus.GATEWAY_TIMEOUT]: GrpcStatus.DEADLINE_EXCEEDED,
    };

    return codeMap[status] ?? GrpcStatus.UNKNOWN;
  }

  private async mapPostgresError(error: any): Promise<{ code: number; message: string } | null> {
    const code = error?.code;
    const rawMessage = error?.message || "";

    const pgErrorMap = {
      "23505": { code: GrpcStatus.ALREADY_EXISTS, key: "db.unique_constraint" },
      "23503": { code: GrpcStatus.FAILED_PRECONDITION, key: "db.foreign_key_constraint" },
      "23502": { code: GrpcStatus.INVALID_ARGUMENT, key: "db.not_null_constraint" },
      "22P02": { code: GrpcStatus.INVALID_ARGUMENT, key: "db.invalid_text" },
      "42703": { code: GrpcStatus.INVALID_ARGUMENT, key: "db.column_not_exist" },
    };

    if (code && pgErrorMap[code]) {
      return {
        code: pgErrorMap[code].code,
        message: pgErrorMap[code].key,
      };
    }

    if (typeof rawMessage === "string") {
      if (rawMessage.includes("duplicate key value violates unique constraint")) {
        return {
          code: GrpcStatus.ALREADY_EXISTS,
          message: "db.unique_constraint",
        };
      }
      if (rawMessage.includes("violates foreign key constraint")) {
        return {
          code: GrpcStatus.FAILED_PRECONDITION,
          message: "db.foreign_key_constraint",
        };
      }
      if (rawMessage.includes("null value in column") && rawMessage.includes("violates not-null constraint")) {
        return {
          code: GrpcStatus.INVALID_ARGUMENT,
          message: "db.not_null_constraint",
        };
      }
    }

    return null;
  }
}
