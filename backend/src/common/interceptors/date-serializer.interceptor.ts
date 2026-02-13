import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.serializeDates(data)),
    );
  }

  private serializeDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.serializeDates(item));
    }

    // Handle objects
    if (typeof obj === 'object') {
      const serialized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          // Check if value is a Date object
          if (value instanceof Date) {
            serialized[key] = value.toISOString();
          } else if (typeof value === 'object' && value !== null) {
            // Recursively serialize nested objects
            serialized[key] = this.serializeDates(value);
          } else {
            serialized[key] = value;
          }
        }
      }
      return serialized;
    }

    return obj;
  }
}
