import packageInfo from '../../package.json';
const version = packageInfo.version;
/** 高亮显示下一段文本字符数量 */
export const HIGHLIGHT_NEXT_LENGTH = 300;
/** 禁用的url，示例：['https://www.mindecho.ai/'] */
export const DISABLE_PAGES_KEY = 'mindecho-disabled-pages';
/** 禁用的域名，示例：['www.mindecho.ai'] */
export const DISABLE_SITES_KEY = 'mindecho-disabled-sites';
/** 禁用所有页面，示例：true */
export const DISABLE_ALL_KEY = 'mindecho-disabled-all';
/** 拖拽位置 */
export const DRAG_POSITION_KEY = 'mindecho-drag-position';
/** 是否完成了新版本指引 */
export const GUIDE_COMPLETE_KEY = `mindecho-complete-guide-${version}`;
/** 是否更新了插件 */
export const EXTENSION_UPDATED = 'mindecho-extension-updated';
/** 是否勾选了自动更新 */
export const AUTO_ADD = 'mindecho-auto-add';
/** 储存userInfo */
export const USERINFO = 'userInfo';
/** 记录bookmark、readinglist、history上一次更新数据日期 */
export const LAST_UPATE_DATA_TIME = 'last_upate_data_time';
/** 记录pocket上一次更新数据日期 */
export const LAST_UPATE_DATA_TIME_POCKET = 'last_upate_data_time_pocket';
/** 记录登陆状态 */
export const ISLOGIN = 'isLogin';

export const getIsLogin = () => {
  return chrome.storage.local.get(ISLOGIN).then((res) => {
    return res[ISLOGIN];
  });
}

export const getUserInfo = () => {
  return chrome.storage.local.get(USERINFO).then((res) => {
    return res[USERINFO];
  });
}

export const setLastUpateDataTime = (time: number) => {
  chrome.storage.local.set({ [LAST_UPATE_DATA_TIME]: time });
};

export const getLastUpateDataTime = () => {
  return chrome.storage.local.get(LAST_UPATE_DATA_TIME).then((res) => {
    return res[LAST_UPATE_DATA_TIME];
  });
};

export const setLastUpateDataTime_pocket = (time: number) => {
  chrome.storage.local.set({ [LAST_UPATE_DATA_TIME_POCKET]: time });
};

export const getLastUpateDataTime_pocket = () => {
  return chrome.storage.local.get(LAST_UPATE_DATA_TIME_POCKET).then((res) => {
    return res[LAST_UPATE_DATA_TIME];
  });
};

export const getExtensionUpdated = () => {
  return chrome.storage.local.get(EXTENSION_UPDATED).then((res) => {
    return res[EXTENSION_UPDATED];
  });
};

export const setExtensionUpdated = () => {
  chrome.storage.local.set({ [EXTENSION_UPDATED]: true });
};

export const setAutoAdd = (status: boolean = true) => {
  chrome.storage.local.set({ [AUTO_ADD]: status });
};

export const getAutoAdd = () => {
  return chrome.storage.local.get(AUTO_ADD).then((res) => {
    return res[AUTO_ADD];
  });
};

export const removeExtensionUpdated = () => {
  chrome.storage.local.remove(EXTENSION_UPDATED);
};

export const getGuideComplete = () => {
  return chrome.storage.local.get(GUIDE_COMPLETE_KEY).then((res) => {
    return res[GUIDE_COMPLETE_KEY];
  });
};

export const setGuideComplete = () => {
  chrome.storage.local.set({ [GUIDE_COMPLETE_KEY]: true });
};

/** 获取拖拽位置 */
export const getDragPosition = () => {
  return chrome.storage.local.get(DRAG_POSITION_KEY).then((res) => {
    return res[DRAG_POSITION_KEY];
  });
};

/** 设置拖拽位置 */
export const setDragPosition = (pos: { x: number; y: number }) => {
  chrome.storage.local.set({ [DRAG_POSITION_KEY]: pos });
};

/** 禁用某个url */
export const setDisablePage = (url: string) => {
  chrome.storage.local.get(DISABLE_PAGES_KEY).then((res) => {
    console.log('🚀 ~ file: index.ts:11 ~ chrome.storage.local.get ~ res:', res);
    const urls = res[DISABLE_PAGES_KEY]?.urls || [];
    if (urls.indexOf(url) < 0) {
      urls.push(url);
      chrome.storage.local.set({ [DISABLE_PAGES_KEY]: { urls } });
    }
  });
};

/** 禁用某个域名 */
export const setDisableSite = (site: string) => {
  chrome.storage.local.get(DISABLE_SITES_KEY).then((res) => {
    console.log('🚀 ~ file: index.ts:11 ~ chrome.storage.local.get ~ res:', res);
    const sites = res[DISABLE_SITES_KEY]?.sites || [];
    if (sites.indexOf(site) < 0) {
      sites.push(site);
      chrome.storage.local.set({ [DISABLE_SITES_KEY]: { sites } });
    }
  });
};

/** 禁用所有 */
export const setDisableAll = () => {
  chrome.storage.local.set({ [DISABLE_ALL_KEY]: { disable: true } });
};

/** 判断当前页面是否禁用 */
export const isDisable = async () => {
  // 这里用Promise.reject会弹出报错，用return false，然后再.then里判断true/false
  const disableAll = await chrome.storage.local.get(DISABLE_ALL_KEY);
  console.log('🚀 ~ file: index.ts:40 ~ isDisable ~ disableAll:', disableAll);
  if (disableAll[DISABLE_ALL_KEY]?.disable === true) {
    return false;
  }
  const disableSites = await chrome.storage.local.get(DISABLE_SITES_KEY);
  console.log('🚀 ~ file: index.ts:45 ~ isDisable ~ disableSites:', disableSites);
  if ((disableSites[DISABLE_SITES_KEY]?.sites || []).includes(window.location.host)) {
    return false;
  }
  const disableUrls = await chrome.storage.local.get(DISABLE_PAGES_KEY);
  console.log('🚀 ~ file: index.ts:50 ~ isDisable ~ disableUrls:', disableUrls);
  if ((disableUrls[DISABLE_PAGES_KEY]?.urls || []).includes(window.location.href)) {
    return false;
  }
  return true;
};

/** 文本占位符 */
export const PLACEHOLDER = '[PLACEHOLDER]';

/** base url */
export const HOME_URL = 'https://www.mindecho.ai';

export const CONTACT_URL = 'mailto:mindecho@mindecho.ai';

export const PAY_URL = `${process.env.API_URL}/payment`;
export const POSTHOG_KEY = `${process.env.POSTHOG_KEY}`;

export const SUBSCRIBE_URL = 'https://billing.stripe.com/p/login/00g18a5851lU7WE288';

/** Thinking url */
export const THINKING_URL = 'https://www.mindecho.ai/thinking';

/** 语言集合 */
export const LANGUAGE_COLLECTIONS = [
  { localeCode: 'auto', regionLang: 'Auto', showLang: chrome.i18n.getMessage('languageAuto') },
  { localeCode: 'am', regionLang: 'Amharic', showLang: 'አማርኛ' },
  { localeCode: 'bg', regionLang: 'Bulgarian', showLang: 'български' },
  { localeCode: 'bn', regionLang: 'Bengali', showLang: 'বাংলা' },
  { localeCode: 'ca', regionLang: 'Catalan', showLang: 'català' },
  { localeCode: 'cs', regionLang: 'Czech', showLang: 'čeština' },
  { localeCode: 'da', regionLang: 'Danish', showLang: 'dansk' },
  { localeCode: 'de', regionLang: 'German', showLang: 'Deutsch' },
  { localeCode: 'el', regionLang: 'Greek', showLang: 'Ελληνικά' },
  { localeCode: 'en', regionLang: 'English', showLang: 'English' },
  { localeCode: 'en_AU', regionLang: 'English(Australia)', showLang: 'English(Australia)' },
  { localeCode: 'en_GB', regionLang: 'English(Great Britain)', showLang: 'English(UK)' },
  { localeCode: 'en_US', regionLang: 'English(USA)', showLang: 'English(US)' },
  { localeCode: 'es', regionLang: 'Spanish', showLang: 'español' },
  { localeCode: 'es_419', regionLang: 'Spanish(Latin America and Caribbean)', showLang: 'español(Latinoamérica)' },
  { localeCode: 'et', regionLang: 'Estonian', showLang: 'eesti' },
  { localeCode: 'fa', regionLang: 'Persian', showLang: 'فارسی' },
  { localeCode: 'fi', regionLang: 'Finnish', showLang: 'suomi' },
  { localeCode: 'fil', regionLang: 'Filipino', showLang: 'Filipino' },
  { localeCode: 'fr', regionLang: 'French', showLang: 'français' },
  { localeCode: 'gu', regionLang: 'Gujarati', showLang: 'ગુજરાતી' },
  { localeCode: 'he', regionLang: 'Hebrew', showLang: 'עברית' },
  { localeCode: 'hi', regionLang: 'Hindi', showLang: 'हिन्दी' },
  { localeCode: 'hr', regionLang: 'Croatian', showLang: 'hrvatski' },
  { localeCode: 'hu', regionLang: 'Hungarian', showLang: 'magyar' },
  { localeCode: 'id', regionLang: 'Indonesian', showLang: 'Indonesia' },
  { localeCode: 'it', regionLang: 'Italian', showLang: 'italiano' },
  { localeCode: 'ja', regionLang: 'Japanese', showLang: '日本語' },
  { localeCode: 'kn', regionLang: 'Kannada', showLang: 'ಕನ್ನಡ' },
  { localeCode: 'ko', regionLang: 'Korean', showLang: '한국어' },
  { localeCode: 'lt', regionLang: 'Lithuanian', showLang: 'lietuvių' },
  { localeCode: 'lv', regionLang: 'Latvian', showLang: 'latviešu' },
  { localeCode: 'ml', regionLang: 'Malayalam', showLang: 'മലയാളം' },
  { localeCode: 'mr', regionLang: 'Marathi', showLang: 'मराठी' },
  { localeCode: 'ms', regionLang: 'Malay', showLang: 'Melayu' },
  { localeCode: 'nl', regionLang: 'Dutch', showLang: 'Nederlands' },
  { localeCode: 'no', regionLang: 'Norwegian', showLang: 'norsk' },
  { localeCode: 'pl', regionLang: 'Polish', showLang: 'polski' },
  { localeCode: 'pt_BR', regionLang: 'Portuguese(Brazil)', showLang: 'português(Brasil)' },
  { localeCode: 'pt_PT', regionLang: 'Portuguese(Portugal)', showLang: 'português(Portugal)' },
  { localeCode: 'ro', regionLang: 'Romanian', showLang: 'română' },
  { localeCode: 'ru', regionLang: 'Russian', showLang: 'русский' },
  { localeCode: 'sk', regionLang: 'Slovak', showLang: 'slovenčina' },
  { localeCode: 'sl', regionLang: 'Slovenian', showLang: 'slovenščina' },
  { localeCode: 'sr', regionLang: 'Serbian', showLang: 'српски' },
  { localeCode: 'sv', regionLang: 'Swedish', showLang: 'svenska' },
  { localeCode: 'sw', regionLang: 'Swahili', showLang: 'Kiswahili' },
  { localeCode: 'ta', regionLang: 'Tamil', showLang: 'தமிழ்' },
  { localeCode: 'te', regionLang: 'Telugu', showLang: 'తెలుగు' },
  { localeCode: 'th', regionLang: 'Thai', showLang: 'ไทย' },
  { localeCode: 'tr', regionLang: 'Turkish', showLang: 'Türkçe' },
  { localeCode: 'uk', regionLang: 'Ukrainian', showLang: 'українська' },
  { localeCode: 'vi', regionLang: 'Vietnamese', showLang: 'Tiếng Việt' },
  { localeCode: 'zh_CN', regionLang: 'Simplified Chinese', showLang: '简体中文' },
  { localeCode: 'zh_TW', regionLang: 'Traditional Chinese', showLang: '正體中文' },
];

/** 需要排除的网址 */
export const EXCLUDE_URLS = ['www.baidu.com'];

/** 用于标识段落的高亮颜色 */
export const HEIGHTLIGHT_COLORS = [
  {
    head: {
      text: '#80623D',
      back: '#E1D5BC',
    },
    body: {
      text: '#101010',
      back: '#FCF3DC',
    },
  },
  {
    head: {
      text: '#588568',
      back: '#CCDACE',
    },
    body: {
      text: '#101010',
      back: '#EFF6EE',
    },
  },
  {
    head: {
      text: '#70508F',
      back: '#D5CCE5',
    },
    body: {
      text: '#101010',
      back: '#F3EFF6',
    },
  },
];

/** 官网url参数中可能的值 */
export const HOME_QUERY = {
  LINNK_EXTENSION: 'linnk_extension',
};

/** 分享地址的域名 */
export const SHARE_ORIGIN =
  process.env.NODE_ENV === 'production' ? 'https://mindecho.app' : 'https://pr-share.hongan.live';
