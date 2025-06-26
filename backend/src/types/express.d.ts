import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      session: {
        userId?: string;
        destroy: (callback: (err?: any) => void) => void;
        save: (callback: (err?: any) => void) => void;
        regenerate: (callback: (err?: any) => void) => void;
        reload: (callback: (err?: any) => void) => void;
        touch: () => void;
        cookie: {
          maxAge?: number;
          signed?: boolean;
          expires?: Date;
          httpOnly?: boolean;
          path?: string;
          domain?: string;
          secure?: boolean;
          sameSite?: boolean | 'lax' | 'strict' | 'none';
        };
      };
      user?: User;
    }
  }
}

export {};