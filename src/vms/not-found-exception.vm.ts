import { ApiProperty } from "@nestjs/swagger";

export class NotFoundExceptionVM {
  @ApiProperty({ type: String, example: "error message" })
  message: string;

  @ApiProperty({ type: String, example: "Not Found" })
  error: string;

  @ApiProperty({ type: Number, example: 404 })
  statusCode: number;
}
