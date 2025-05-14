import { IsNumber, IsOptional, IsString } from "class-validator";

export class ResponseEntity<T> {
  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  code?: number;

  data: T;
}
