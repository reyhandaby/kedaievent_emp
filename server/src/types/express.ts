import { Request, Response } from 'express';

export interface TypedRequest<T = any> extends Request {
  body: T;
}

export type TypedResponse<T = any> = Response;