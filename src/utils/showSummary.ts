import { chromeDetectLanguage } from '@/utils/common.util';

export default function reqShowSummary(content: string) {
  chromeDetectLanguage(content).then((result) => {
    chrome.runtime.sendMessage({ type: 'showSummary', data: { data: content, detected_lang: result } }, (res) => {
      console.log('show-showSummary res:', res);
    });
  });
}
