/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
    accessToken?: string;
  }
}
