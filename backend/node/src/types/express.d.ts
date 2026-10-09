declare global {
  namespace Express {
    interface Locals {
      validated?: unknown;
    }
  }
}

export {};
