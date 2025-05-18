import { ApiResponseProperty } from "@nestjs/swagger";

export class ResponseEntity<T> {
  @ApiResponseProperty()
  message: string;

  @ApiResponseProperty()
  data: T;
}
