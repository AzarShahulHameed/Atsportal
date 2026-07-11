import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

// Without this, a file over the Multer limit throws a raw MulterError that
// Nest doesn't know how to format — the client gets an ugly, undocumented
// error instead of a clean JSON response it can actually show the user.
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? 'File must be under 5MB'
        : `Upload error: ${exception.message}`;

    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message,
    });
  }
}
