import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = (err as AppError).statusCode || 500;
    let message = err.message || 'Internal Server Error';

    console.log('[errorMiddleware] Error:', err.name, err.message);
    console.log('[errorMiddleware] Request:', req.method, req.path, '->', statusCode, message);

    if (statusCode === 500) {
        message = 'Internal Server Error';
        console.log('[errorMiddleware] Stack:', (err as Error).stack);
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
}