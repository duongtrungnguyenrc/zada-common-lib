import { Observable, catchError, throwError } from "rxjs";
import { QueryFailedError } from "typeorm";
import { I18nService } from "nestjs-i18n";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";

@Injectable()
export class TypeOrmExceptionInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof QueryFailedError) {
          const driverError: any = error.driverError;

          switch (driverError.code) {
            case "23505": {
              // unique_violation
              const detail = driverError.detail as string;
              const match = detail.match(/\((.+?)\)=\((.+?)\)/);
              const message = this.i18n.t("db.already-exists");

              if (match) {
                const field = match[1];
                const value = match[2];
                const friendlyMessage = `${this.formatField(
                  field
                )} '${value}' ${message}.`;
                return throwError(() => new ConflictException(friendlyMessage));
              }

              return throwError(() => new ConflictException(message));
            }

            case "23503": // foreign_key_violation
              return throwError(
                () =>
                  new BadRequestException(
                    this.i18n.t("db.foreign-key-violation")
                  )
              );

            case "23502": // not_null_violation
              return throwError(
                () => new BadRequestException(this.i18n.t("db.not-null"))
              );

            case "23514": // check_violation
              return throwError(
                () => new BadRequestException(this.i18n.t("db.check-violation"))
              );

            case "22001": // string_data_right_truncation
              return throwError(
                () =>
                  new BadRequestException(this.i18n.t("db.content-too-long"))
              );

            case "22003": // numeric_value_out_of_range
              return throwError(
                () =>
                  new BadRequestException(this.i18n.t("db.number-out-of-range"))
              );

            case "22007": // invalid_datetime_format
              return throwError(
                () =>
                  new BadRequestException(this.i18n.t("db.invalid-date-format"))
              );

            case "42P01": // undefined_table
            case "42703": // undefined_column
              return throwError(
                () =>
                  new InternalServerErrorException(
                    this.i18n.t("db.schema-error")
                  )
              );

            default:
              return throwError(
                () =>
                  new InternalServerErrorException(this.i18n.t("db.unknown"))
              );
          }
        }

        return throwError(() => error);
      })
    );
  }

  private formatField(field: string): string {
    return field.charAt(0).toUpperCase() + field.slice(1);
  }
}
