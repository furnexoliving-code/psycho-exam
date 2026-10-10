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
  /** A mock marked free is advertised on the packages page and the blog: every account's first step. */
  freeMock: true,
  /** The two-minute sample test at /demo, open without a login. */
  sampleTest: false,
} as const;
