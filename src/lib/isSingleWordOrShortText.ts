export default function isSingleWordOrShortText(text: string): boolean {
  // 检查是否为单个单词
  const isSingleWord = !/\s/.test(text.trim());

  // 检查长度
  const isShortText = text.length < 10 || (/[^\x00-\xff]/.test(text) && text.length < 5);

  return isSingleWord || isShortText;
}
