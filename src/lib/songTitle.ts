export const getDisplayTitle = (title: string): string => {
  let cleaned = title.normalize('NFKC');
  cleaned = cleaned.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '');
  cleaned = cleaned.replace(/^[\s\u00A0\x00-\x1F]+/, '');
  cleaned = cleaned.replace(/(?:\s|\u00A0)+$/g, '');
  cleaned = cleaned.replace(
    /^(?:\d+\s*[-.:]\s*)?(?:hinos?|louvores?)\b[\s\u00A0]*[-:]?\s*/i,
    ''
  );
  const tokenMatch = cleaned.match(/^(\S+)\s*(.*)$/);
  if (tokenMatch) {
    const token = tokenMatch[1]
      .normalize('NFKD')
      .replace(/[^a-z]/gi, '')
      .toLowerCase();
    if (token === 'louvor' || token === 'louvores' || token === 'hino' || token === 'hinos') {
      cleaned = tokenMatch[2].replace(/^[-:]\s*/, '').trim();
    }
  }
  cleaned = cleaned.trim();
  const bracketMatch = cleaned.match(/^\[(.+)\]$/);
  if (bracketMatch) {
    cleaned = bracketMatch[1].trim();
  }
  return cleaned;
};