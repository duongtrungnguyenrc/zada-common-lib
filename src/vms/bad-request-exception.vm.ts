import { ApiProperty } from "@nestjs/swagger";

export class BadRequestExceptionVM {
  @ApiProperty({ type: String, example: "Error message" })
  message: string;

  @ApiProperty({ type: String, example: "/example" })
  path: string;

  @ApiProperty({ type: Date, example: new Date() })
  timestamp: Date;

  @ApiProperty({ type: Number, example: 400 })
  statusCode: number;
}
