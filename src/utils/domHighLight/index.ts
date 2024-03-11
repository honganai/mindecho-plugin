import $ from 'jquery';
import highlight from './highlightV4';

let alternativeUrlIndexOffset = 0; // Number of elements stored in the alternativeUrl Key. Used to map highlight indices to correct key

export function domHighLight(
  color: {
    color: string;
    textColor?: string;
  },
  selection: Selection | null,
) {
  if (!selection) {
    return [];
  }
  if (selection.type === 'None') {
    return [];
  }
  let container = selection.getRangeAt(0).commonAncestorContainer;
  // 排除插件内的元素
  if (document.getElementById('pointread-plugin-content')?.contains(container)) {
    return [];
  }

  // Sometimes the element will only be text. Get the parent in that case
  while (!container.innerHTML) {
    container = container.parentNode;
  }

  const selectionString = selection.toString();
  console.log('🚀 ~ container:', container, selectionString, selection);

  const highlightNodes = highlight(
    selectionString,
    container,
    selection,
    color.color,
    color.textColor,
    alternativeUrlIndexOffset,
  );

  alternativeUrlIndexOffset++;

  return highlightNodes;
}
