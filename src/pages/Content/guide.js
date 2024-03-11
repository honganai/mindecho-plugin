/* eslint-disable no-undef */
import { HOME_QUERY } from '@/constants'
const formatSearch = (text) => {
  const queryObject = {}
  if (text === '') return queryObject;
  const keyvalue = text.substr(1).split('&');
  keyvalue.forEach(kv => {
    if (kv.indexOf('=')) {
      const [key, value] = kv.split('=');
      queryObject[key] = value;
    }
  });
  return queryObject;
}
const query = formatSearch(window.location.search);
if (query[HOME_QUERY.LINNK_EXTENSION] === '1') {
  chrome.runtime.sendMessage({ type: 'showContent', data: {} }, (res) => {
   console.log('First installed and open the login page:', res);
  });
}