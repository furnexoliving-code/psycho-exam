/**
 * The auth server's refusal, in the admin's terms. A wrong code, a rate
 * limit, a switched-off feature and a vanished factor are four different
 * situations with four different remedies; one message for all of them
 * left the owner retyping codes at a rate limit.
 */
export function describeMfaError(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "mfa_verification_failed":
      return "That code did not match. Codes change every 30 seconds — enter the one showing now.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then enter the code showing then.";
    case "mfa_totp_verify_not_enabled":
    case "mfa_totp_enroll_not_enabled":
      return (
        "Two-factor sign-in is switched off for the project. In the Supabase dashboard open " +
        "Authentication → Multi-Factor and enable TOTP, then reload this page."
      );
    case "mfa_factor_not_found":
      return "This set-up is no longer valid. Reload the page and start again.";
    case "mfa_factor_name_conflict":
      return "An earlier set-up is still on the account. Reload the page and try again.";
    default:
      return error.message;
  }
}
