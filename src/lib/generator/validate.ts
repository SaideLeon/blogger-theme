import { XMLValidator } from "fast-xml-parser";

/** Devolve null se o XML está bem formado, ou a mensagem de erro. */
export function validateXml(xml: string): string | null {
  const r = XMLValidator.validate(xml, { allowBooleanAttributes: true });
  if (r === true) return null;
  return `${r.err.msg} (linha ${r.err.line}, coluna ${r.err.col})`;
}
