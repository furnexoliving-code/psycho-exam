/**
 * What the portal offers the public right now. Everything here is built;
 * these flip it on. Until the payment gateway is registered, accounts and
 * packages come only through the Kautilya Classes team on WhatsApp.
 */
export const LAUNCH = {
  /** Students may make their own account at /signup. */
  signup: false,
  /** Packages are bought online on the packages page. */
  onlineBuy: false,
  /** A mock marked free is advertised as the no-login first step. */
  freeMock: false,
} as const;
