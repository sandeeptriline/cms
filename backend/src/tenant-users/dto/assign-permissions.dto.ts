import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    example: ['permission-id-1', 'permission-id-2'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty({ message: 'Permission IDs array is required' })
  @IsUUID(undefined, { each: true, message: 'Each permission ID must be a valid UUID' })
  permissionIds: string[];
}
