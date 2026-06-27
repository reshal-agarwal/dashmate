import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new ValidationError('Validation failed', details);
      }
      next(err);
    }
  };

export const validateBody = (schema: AnyZodObject) =>
  validate(schema.pick({ body: true }));

export const validateQuery = (schema: AnyZodObject) =>
  validate(schema.pick({ query: true }));

export const validateParams = (schema: AnyZodObject) =>
  validate(schema.pick({ params: true }));