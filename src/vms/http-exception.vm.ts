import { ApiProperty } from "@nestjs/swagger";

export class HttpExceptionVM {
  @ApiProperty({ type: String, example: "Error message" })
  message: string;

  @ApiProperty({ type: String, example: "/example" })
  path: string;

  @ApiProperty({ type: Date, example: new Date() })
  timestamp: Date;

  @ApiProperty({ type: Number, examples: [400, 401, 403, 404, 500] })
  statusCode: number;
}
