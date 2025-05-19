import { ApiProperty } from "@nestjs/swagger";

export class UnauthorizedExceptionVM {
  @ApiProperty({ type: String, example: "error message" })
  message: string;

  @ApiProperty({ type: String, example: "Unauthorized" })
  error: string;

  @ApiProperty({ type: Number, example: 401 })
  statusCode: number;
}
