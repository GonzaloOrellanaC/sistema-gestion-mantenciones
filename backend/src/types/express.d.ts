import type { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado (parcial): usa el tipo `IUser` del modelo */
      user?: Partial<IUser> & { id?: string };
      /** Archivo subido (multer) - queda `any` para evitar dependencia adicional */
      file?: any;
    }
  }
}

export {};
