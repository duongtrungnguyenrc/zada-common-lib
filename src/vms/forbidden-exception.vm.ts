import { ApiProperty } from "@nestjs/swagger";

export class ForbiddenExceptionVM {
  @ApiProperty({ type: String, example: "error message" })
  message: string;

  @ApiProperty({ type: String, example: "Forbidden" })
  error: string;

  @ApiProperty({ type: Number, example: 403 })
  statusCode: number;
}
