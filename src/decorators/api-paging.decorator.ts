import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export const ApiPaging = () => {
  return applyDecorators(
    ApiQuery({ type: Number, name: "page", description: "Current index", required: true }),
    ApiQuery({ type: Number, name: "size", description: "Page items size", required: false }),
  );
};
