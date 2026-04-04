import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignOrderDto {
  /** ID của user được gán. Truyền chuỗi rỗng hoặc bỏ qua để bỏ phân công. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignedTo?: string;
}
