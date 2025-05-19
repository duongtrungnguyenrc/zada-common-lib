import { ApiProperty } from "@nestjs/swagger";

export class BadRequestExceptionVM {
  @ApiProperty({ type: String, example: "error message" })
  message: string;

  @ApiProperty({ type: String, example: "Bad Request" })
  error: string;

  @ApiProperty({ type: Number, example: 400 })
  statusCode: number;
}
