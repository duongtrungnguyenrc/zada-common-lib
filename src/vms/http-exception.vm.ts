import { ApiProperty } from "@nestjs/swagger";

export class HttpExceptionVM {
  @ApiProperty({ type: String, example: "error message" })
  message: string;

  @ApiProperty({ type: String, example: "error name" })
  error: string;

  @ApiProperty({ type: Number, examples: [400, 401, 403, 404, 500] })
  statusCode: number;
}
