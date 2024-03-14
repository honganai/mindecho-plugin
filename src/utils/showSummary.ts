import { chromeDetectLanguage } from '@/utils/common.util';
import { version } from '../../package.json';

export default function reqShowSummary(content: string) {
  chromeDetectLanguage(content).then((result) => {
    chrome.runtime.sendMessage(
      { type: 'showSummary', data: { data: content, detected_lang: result, api_version: version } },
      (res) => {
        console.log('show-showSummary res:', res);
      },
    );
  });
}
