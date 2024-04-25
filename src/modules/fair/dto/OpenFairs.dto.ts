import { IsBoolean, IsOptional } from "class-validator";
import { Transform } from 'class-transformer';

export class OpenFairsQueryDto {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value} ) => value === 'true')
    full: boolean;
}
