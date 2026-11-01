import { Voter } from '../types';

export interface ParsedVoterItem {
  nisn: string;
  fullName: string;
  className: string;
  gender: 'L' | 'P';
  passcode: string;
  isValid: boolean;
  error?: string;
  originalLine: string;
}

export type DelimiterType = 'auto' | 'tab' | 'semicolon' | 'comma' | 'pipe';

/**
 * Detects delimiter used in a text line.
 * Tab is given highest priority because copying from Excel / Google Sheets always produces tabs.
 */
export function detectDelimiter(line: string): 'tab' | 'semicolon' | 'pipe' | 'comma' {
  if (line.includes('\t')) return 'tab';
  if (line.includes(';')) return 'semicolon';
  if (line.includes('|')) return 'pipe';
  return 'comma';
}

/**
 * Splits a CSV line while respecting quoted strings ("..." or '...')
 * so commas or dots inside quotes are not split.
 */
export function splitCsvWithQuotes(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuote = !inQuote;
    } else if (char === delimiter && !inQuote) {
      result.push(cur.trim().replace(/^["']|["']$/g, ''));
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim().replace(/^["']|["']$/g, ''));
  return result;
}

/**
 * Smart Voter Row Parser:
 * Treats each cell in a table row as one single field.
 * Dots (.) and commas (,) within academic titles/degrees (e.g. Drs., S.Pd., M.Pd., M.Si.)
 * are preserved inside fullName and NEVER cause column misalignment.
 */
export function parseVoterLine(
  line: string,
  preferredDelimiter: DelimiterType = 'auto',
  defaultClass: string = 'X A 1'
): ParsedVoterItem | null {
  const cleanLine = line.trim();
  if (!cleanLine) return null;

  // Skip header lines (e.g. "NISN, Nama Lengkap, Kelas...")
  const lower = cleanLine.toLowerCase();
  if (
    (lower.includes('nisn') || lower.includes('nomor induk') || lower.includes('no.')) &&
    (lower.includes('nama') || lower.includes('name') || lower.includes('siswa'))
  ) {
    return null;
  }

  // Determine delimiter
  let delimChar = '\t';
  if (preferredDelimiter === 'tab') {
    delimChar = '\t';
  } else if (preferredDelimiter === 'semicolon') {
    delimChar = ';';
  } else if (preferredDelimiter === 'pipe') {
    delimChar = '|';
  } else if (preferredDelimiter === 'comma') {
    delimChar = ',';
  } else {
    // Auto-detect based on presence of tab, semicolon, pipe, or comma
    const detected = detectDelimiter(cleanLine);
    delimChar = detected === 'tab' ? '\t' : detected === 'semicolon' ? ';' : detected === 'pipe' ? '|' : ',';
  }

  let parts = splitCsvWithQuotes(cleanLine, delimChar).map((p) => p.trim());
  while (parts.length > 0 && parts[parts.length - 1] === '') {
    parts.pop();
  }

  if (parts.length === 0) return null;

  // If the first column is a sequence number (1, 2, 3...) and the second column is NISN (digits),
  // shift out the sequence number.
  if (parts.length >= 3 && /^\d{1,4}$/.test(parts[0]) && /^\d{5,}$/.test(parts[1])) {
    parts.shift();
  }

  let nisn = '';
  let fullName = '';
  let className = defaultClass;
  let gender: 'L' | 'P' = 'L';
  let passcode = '';

  if (delimChar !== ',') {
    // For Tab (Excel / Google Sheets), Semicolon (;), and Pipe (|):
    // Each column is guaranteed to be one single field.
    // Commas and dots in the title/gelar (e.g. Drs. H. Ahmad, M.Pd.) remain 100% intact!
    nisn = parts[0] || '';
    fullName = parts[1] || '';
    if (parts.length >= 3) className = parts[2] || defaultClass;
    if (parts.length >= 4) {
      const g = (parts[3] || '').toUpperCase();
      gender = g.startsWith('P') || g === 'WANITA' || g === 'PEREMPUAN' || g === 'F' ? 'P' : 'L';
    }
    if (parts.length >= 5) {
      passcode = parts[4] || '';
    }
  } else {
    // Comma-delimited:
    // When titles with commas (e.g. "Drs. H. Ahmad Santoso, M.Pd., M.Si.") are not quoted,
    // parts will have more elements than expected.
    if (parts.length <= 5) {
      nisn = parts[0] || '';
      fullName = parts[1] || '';
      if (parts.length >= 3) className = parts[2] || defaultClass;
      if (parts.length >= 4) {
        const g = (parts[3] || '').toUpperCase();
        gender = g.startsWith('P') || g === 'WANITA' || g === 'PEREMPUAN' || g === 'F' ? 'P' : 'L';
      }
      if (parts.length >= 5) passcode = parts[4] || '';
    } else {
      // More than 5 parts! Reconstruct full name from middle items so gelar commas are preserved.
      nisn = parts[0] || '';

      let tailIndex = parts.length - 1;
      let detectedPasscode = '';
      let detectedGender: 'L' | 'P' = 'L';
      let detectedClass = '';

      const last = parts[tailIndex] || '';
      const isLastGender = /^(L|P|Laki-laki|Perempuan|M|F)$/i.test(last);
      const isLastClass = /^(X|XI|XII|Kelas|7|8|9|10|11|12)/i.test(last);

      if (!isLastGender && !isLastClass && last.length <= 12) {
        detectedPasscode = last;
        tailIndex--;
      }

      if (tailIndex >= 2 && /^(L|P|Laki-laki|Perempuan|M|F)$/i.test(parts[tailIndex])) {
        const g = parts[tailIndex].toUpperCase();
        detectedGender = g.startsWith('P') || g === 'WANITA' || g === 'PEREMPUAN' || g === 'F' ? 'P' : 'L';
        tailIndex--;
      }

      if (tailIndex >= 2) {
        detectedClass = parts[tailIndex];
        tailIndex--;
      }

      const nameParts = parts.slice(1, tailIndex + 1);
      fullName = nameParts.join(', ');
      className = detectedClass || defaultClass;
      gender = detectedGender;
      passcode = detectedPasscode;
    }
  }

  // Clean NISN of spaces and quotes
  nisn = nisn.replace(/[\s"']/g, '');
  fullName = fullName.replace(/^["']|["']$/g, '').trim();

  // If passcode is empty, auto-generate 6-digit random PIN
  if (!passcode) {
    passcode = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const isValid = nisn.length >= 3 && fullName.length >= 2;

  return {
    nisn,
    fullName,
    className: className.trim() || defaultClass,
    gender,
    passcode: passcode.trim(),
    isValid,
    error: !isValid ? 'Data tidak valid (NISN atau Nama kosong)' : undefined,
    originalLine: cleanLine,
  };
}

/**
 * Parses multiple lines from raw import text.
 */
export function parseAllVoterLines(
  rawText: string,
  preferredDelimiter: DelimiterType = 'auto',
  defaultClass: string = 'X A 1'
): ParsedVoterItem[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const items: ParsedVoterItem[] = [];

  for (const line of lines) {
    const parsed = parseVoterLine(line, preferredDelimiter, defaultClass);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}
