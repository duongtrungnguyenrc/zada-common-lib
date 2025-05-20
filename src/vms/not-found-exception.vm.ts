import { ApiProperty } from "@nestjs/swagger";

export class NotFoundExceptionVM {
  @ApiProperty({ type: String, example: "Error message" })
  message: string;

  @ApiProperty({ type: String, example: "/example" })
  path: string;

  @ApiProperty({ type: Date, example: new Date() })
  timestamp: Date;

  @ApiProperty({ type: Number, example: 404 })
  statusCode: number;
}
