/* =========================
   Helper
========================= */

export async function getResponseText(resp: any): Promise<string> {
  try {
    if (typeof resp?.text === 'function') {
      const v = resp.text();
      return typeof v === 'string' ? v : await v;
    }
    const parts = resp?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      return parts.map((p: any) => p?.text ?? '').join('');
    }
  } catch {}
  return '';
}
