import { ApiProperty } from "@nestjs/swagger";

export class ResponseVM<T = any> {
  @ApiProperty({ type: String, example: "operation success" })
  message: string;

  @ApiProperty({ type: Object, required: false })
  data?: T;

  @ApiProperty({ type: Date, example: new Date() })
  timestamp: Date;

  @ApiProperty({ type: Number })
  statusCode: number;
}
