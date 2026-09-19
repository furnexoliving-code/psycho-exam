import { isValidPhone, normalisePhone } from "./phone";

export interface ParsedStudent {
  fullName: string;
  phone: string;
  password: string;
}

/**
 * Reads a student list pasted from Excel or saved as CSV.
 *
 * One student per line: name, mobile, password. Commas or tabs
 * both work, because pasting a block straight out of Excel gives tabs while a
 * saved file gives commas, and an admin should not have to know the
 * difference.
 *
 * A header row is skipped when the first line looks like one.
 *
 * Every line is checked before any account is made: a list that fails halfway
 * would leave an admin guessing which students exist and which do not.
 */
export function parseStudentLines(text: string): ParsedStudent[] {
  const out: ParsedStudent[] = [];
  const seen = new Map<string, number>();
  let first = true;

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const parts = line.split(/\t|,/).map((p) => p.trim().replace(/^"|"$/g, ""));

    // A header row names its columns instead of holding a mobile number. It
    // is the first line WITH anything on it — a paste from a spreadsheet
    // often starts with a blank one.
    const isFirst = first;
    first = false;
    if (isFirst && /name/i.test(parts[0] ?? "") && !isValidPhone(parts[1] ?? "") && !isValidPhone(parts[2] ?? "")) {
      return;
    }

    // Exactly three — or the older four-column layout with a roll number in
    // second place, which is simply skipped. Anything else means a comma
    // inside a name or a password, and the account would be made with the
    // wrong half of it.
    if (parts.length !== 3 && parts.length !== 4) {
      throw new Error(
        `Line ${i + 1}: expected "name, mobile, password" — found ${parts.length} field${
          parts.length === 1 ? "" : "s"
        }${parts.length > 4 ? ". A comma inside a name or password is not allowed." : ""}`,
      );
    }

    const [fullName, phoneRaw, password] =
      parts.length === 4 ? [parts[0], parts[2], parts[3]] : parts;

    if (!fullName) throw new Error(`Line ${i + 1}: the name is empty`);
    if (!isValidPhone(phoneRaw)) {
      throw new Error(`Line ${i + 1}: "${phoneRaw}" is not a 10-digit Indian mobile number`);
    }
    if (password.length < 6) {
      throw new Error(`Line ${i + 1}: the password must be at least 6 characters`);
    }

    const phone = normalisePhone(phoneRaw);
    const earlier = seen.get(phone);
    if (earlier !== undefined) {
      throw new Error(
        `Line ${i + 1}: ${phone} is already on line ${earlier}. One number, one account.`,
      );
    }
    seen.set(phone, i + 1);

    out.push({ fullName, phone, password });
  });

  if (out.length === 0) throw new Error("No students found in that list");
  return out;
}
