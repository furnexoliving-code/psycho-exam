import { isValidPhone, normalisePhone } from "./phone";

export interface ParsedStudent {
  fullName: string;
  rollNo: string;
  phone: string;
  password: string;
}

/**
 * Reads a student list pasted from Excel or saved as CSV.
 *
 * One student per line: name, roll number, mobile, password. Commas or tabs
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

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const parts = line.split(/\t|,/).map((p) => p.trim().replace(/^"|"$/g, ""));

    // A header row names its columns instead of holding a mobile number.
    if (i === 0 && /name/i.test(parts[0] ?? "") && !isValidPhone(parts[2] ?? "")) {
      return;
    }

    if (parts.length < 4) {
      throw new Error(
        `Line ${i + 1}: expected "name, roll no, mobile, password" — found ${parts.length} field${
          parts.length === 1 ? "" : "s"
        }`,
      );
    }

    const [fullName, rollNo, phoneRaw, password] = parts;

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

    out.push({ fullName, rollNo, phone, password });
  });

  if (out.length === 0) throw new Error("No students found in that list");
  return out;
}
