import { ApiProperty } from "@nestjs/swagger";

export class InternalServerErrorExceptionVM {
  @ApiProperty({ type: String, example: "error message" })
  message: string;

  @ApiProperty({ type: String, example: "Internal Server Error" })
  error: string;

  @ApiProperty({ type: Number, example: 500 })
  statusCode: number;
}
