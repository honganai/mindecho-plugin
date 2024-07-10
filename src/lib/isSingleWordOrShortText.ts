export default function isSingleWordOrShortText(text: string): boolean {
  if (/[^\x00-\xff]/.test(text)) {
    return text.length < 5;
  } else {
    return text.length < 10 || !/\s/.test(text.trim());
  }
}
