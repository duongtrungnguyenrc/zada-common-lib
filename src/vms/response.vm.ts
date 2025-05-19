import { ApiProperty } from "@nestjs/swagger";

export class BaseResponseVM<T = any> {
  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: Object, required: false })
  data?: T;
}
