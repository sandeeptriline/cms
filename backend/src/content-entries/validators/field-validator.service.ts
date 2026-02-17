import { Injectable, BadRequestException, Logger } from '@nestjs/common';

export interface FieldDefinition {
  id: string;
  field: string;
  type: string;
  interface: string | null;
  options: any;
  validation: any;
  required: boolean;
  hidden: boolean;
  readonly: boolean;
}

export interface ContentType {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

@Injectable()
export class FieldValidatorService {
  private readonly logger = new Logger(FieldValidatorService.name);

  /**
   * Validate a single field value against its definition
   */
  validateField(field: FieldDefinition, value: any): void {
    const { field: fieldName, validation, required, type } = field;

    // Check required
    if (required && (value === null || value === undefined || value === '')) {
      throw new BadRequestException(`Field "${fieldName}" is required`);
    }

    // Skip validation if value is empty and not required
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Type-specific validation
    switch (type) {
      case 'text':
      case 'textarea':
      case 'richtext':
      case 'email':
      case 'password':
      case 'uid':
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field "${fieldName}" must be a string`);
        }
        this.validateStringConstraints(fieldName, value, validation);
        break;

      case 'number':
      case 'integer':
      case 'float':
      case 'decimal':
        if (typeof value !== 'number' && !this.isNumericString(value)) {
          throw new BadRequestException(`Field "${fieldName}" must be a number`);
        }
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        this.validateNumberConstraints(fieldName, numValue, validation);
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Field "${fieldName}" must be a boolean`);
        }
        break;

      case 'date':
      case 'datetime':
      case 'time':
        if (!this.isValidDate(value)) {
          throw new BadRequestException(`Field "${fieldName}" must be a valid date`);
        }
        break;

      case 'json':
        if (!this.isValidJSON(value)) {
          throw new BadRequestException(`Field "${fieldName}" must be valid JSON`);
        }
        break;

      case 'enumeration':
        if (validation?.enum && !validation.enum.includes(value)) {
          throw new BadRequestException(
            `Field "${fieldName}" must be one of: ${validation.enum.join(', ')}`
          );
        }
        break;

      case 'relation':
      case 'media':
      case 'file':
        // These types can be strings (IDs) or arrays of strings
        if (typeof value !== 'string' && !Array.isArray(value)) {
          throw new BadRequestException(
            `Field "${fieldName}" must be a string (ID) or array of strings (IDs)`
          );
        }
        break;

      case 'component':
      case 'dynamic_zone':
        // These are complex nested structures
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new BadRequestException(
            `Field "${fieldName}" must be an object or array of objects`
          );
        }
        break;
    }
  }

  /**
   * Validate all fields in entry data against content type definition
   */
  validateEntry(data: Record<string, any>, contentType: ContentType): void {
    const fieldMap = new Map(contentType.fields.map(f => [f.field, f]));

    // Check all required fields are present
    for (const field of contentType.fields) {
      if (field.required && !field.hidden) {
        if (!(field.field in data) || data[field.field] === null || data[field.field] === undefined || data[field.field] === '') {
          throw new BadRequestException(`Required field "${field.field}" is missing`);
        }
      }
    }

    // Validate each field value
    for (const [fieldName, value] of Object.entries(data)) {
      const field = fieldMap.get(fieldName);
      if (field) {
        try {
          this.validateField(field, value);
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new BadRequestException(`Validation failed for field "${fieldName}": ${error.message}`);
        }
      } else {
        // Allow extra fields (for flexibility), but log a warning
        this.logger.warn(`Unknown field "${fieldName}" in entry data for content type "${contentType.name}"`);
      }
    }
  }

  /**
   * Apply default values for missing optional fields
   */
  applyDefaults(data: Record<string, any>, contentType: ContentType): Record<string, any> {
    const result = { ...data };

    for (const field of contentType.fields) {
      if (!field.required && !(field.field in result) && field.options?.defaultValue !== undefined) {
        result[field.field] = field.options.defaultValue;
      }
    }

    return result;
  }

  /**
   * Transform value based on field type
   */
  transformValue(field: FieldDefinition, value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (field.type) {
      case 'number':
      case 'integer':
        return typeof value === 'number' ? Math.floor(value) : parseInt(value, 10);
      case 'float':
      case 'decimal':
        return typeof value === 'number' ? value : parseFloat(value);
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
      case 'date':
      case 'datetime':
        if (typeof value === 'string') {
          return new Date(value);
        }
        return value;
      default:
        return value;
    }
  }

  /**
   * Check if all required fields are present
   */
  checkRequired(data: Record<string, any>, contentType: ContentType): string[] {
    const missing: string[] = [];

    for (const field of contentType.fields) {
      if (field.required && !field.hidden) {
        if (!(field.field in data) || data[field.field] === null || data[field.field] === undefined || data[field.field] === '') {
          missing.push(field.field);
        }
      }
    }

    return missing;
  }

  // Private helper methods

  private validateStringConstraints(fieldName: string, value: string, validation: any): void {
    if (validation?.minLength && value.length < validation.minLength) {
      throw new BadRequestException(
        `Field "${fieldName}" must be at least ${validation.minLength} characters`
      );
    }

    if (validation?.maxLength && value.length > validation.maxLength) {
      throw new BadRequestException(
        `Field "${fieldName}" must be at most ${validation.maxLength} characters`
      );
    }

    if (validation?.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new BadRequestException(
          `Field "${fieldName}" does not match required pattern`
        );
      }
    }
  }

  private validateNumberConstraints(fieldName: string, value: number, validation: any): void {
    if (validation?.min !== undefined && value < validation.min) {
      throw new BadRequestException(
        `Field "${fieldName}" must be at least ${validation.min}`
      );
    }

    if (validation?.max !== undefined && validation.max !== null && value > validation.max) {
      throw new BadRequestException(
        `Field "${fieldName}" must be at most ${validation.max}`
      );
    }
  }

  private isNumericString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }

  private isValidDate(value: any): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }

  private isValidJSON(value: any): boolean {
    if (typeof value === 'object' && value !== null) {
      return true;
    }
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
