interface DistillConfigTypes {
  [key: string]: {
    titleContainerQuery: string[];
    contentContainerQuery: string[];
    timestripContainerQuery: string[];
    name: string;
    siteName: string;
    siteValue: string;
    regex: string;
  };
}

const DistillConfig: DistillConfigTypes = {
  //mp.weixin.qq.com
  wechat:{
    titleContainerQuery: ['#activity-name'],
    contentContainerQuery: ['#js_content'],
    timestripContainerQuery: ['#publish_time'],
    name: 'Wechat',
    siteName: 'Wechat',
    siteValue: 'Wechat',
    regex: 'https?:\\/\\/(mp\\.)?(weixin\\.)?qq\\.com',
  },
  yahoo: {
    titleContainerQuery: ['.caas-title-wrapper'],
    contentContainerQuery: ['.caas-body'],
    timestripContainerQuery: ['.caas-attr-meta'],
    name: 'Yahoo',
    siteName: 'Yahoo',
    siteValue: 'Yahoo',
    regex: 'https?:\\/\\/(news\\.)?yahoo\\.com',
  },
  nytimes: {
    titleContainerQuery: ['#header-onsite-newsletter-headline'],
    contentContainerQuery: ['.meteredContent'],//live-feed-items .meteredContent
    timestripContainerQuery: ['.caas-attr-meta'],
    name: 'nytimes',
    siteName: 'nytimes',
    siteValue: 'nytimes',
    regex: 'https?:\\/\\/(www\\.)?nytimes\\.com',
  },
  cnn: {
    titleContainerQuery: ['.headline__wrapper'],
    contentContainerQuery: ['.article__content-container'],
    timestripContainerQuery: ['.timestamp'],
    name: 'cnn',
    siteName: 'cnn',
    siteValue: 'cnn',
    regex: 'https?:\\/\\/(www\\.)?cnn\\.com',
  },
  msn: {
    titleContainerQuery: ['.viewsTitle'],
    contentContainerQuery: ['.article-body'],
    timestripContainerQuery: ['.caas-attr-meta'],
    name: 'msn',
    siteName: 'msn',
    siteValue: 'msn',
    regex: 'https?:\\/\\/(www\\.)?msn\\.com',
  },
  news163: {
    titleContainerQuery: ['.post_title'],
    contentContainerQuery: ['.post_body'],
    timestripContainerQuery: ['.post_info'],
    name: 'News163',
    siteName: 'News163',
    siteValue: 'News163',
    regex: 'https?:\\/\\/www\\.163\\.com',
  },
  foxnews: {
    titleContainerQuery: ['.article-meta-upper'],
    contentContainerQuery: ['.article-body'],
    timestripContainerQuery: ['.article-date'],
    name: 'foxnews',
    siteName: 'foxnews',
    siteValue: 'foxnews',
    regex: 'https?:\\/\\/(www\\.)?foxnews\\.com',
  },

};

function getCleanArticle() {
  const articleContent = document.querySelector('body')?.innerText;

  for (const key in DistillConfig) {
    const config = DistillConfig[key];

    const regex = new RegExp(config.regex);
    // console.log('regex', regex,'key', key,'window.location.href', window.location.href);
    if (regex.test(window.location.href)) {
      const titleElement = document.querySelector(config.titleContainerQuery.join(','));
      const contentElement = document.querySelector(config.contentContainerQuery.join(','));
      const timestripElement = document.querySelector(config.timestripContainerQuery.join(','));

      const title = titleElement?.innerText || document.title;
      const content = contentElement?.innerText || articleContent;
      const timestrip = timestripElement?.getAttribute('data-publishtime') || new Date().toISOString();
      console.log('regex',regex.test(window.location.href),'title', title,'content', content,'timestrip', timestrip);
      return {
        title,
        content,
        timestrip,
      };
    }
  }

  return {
    title: document.title,
    content: articleContent,
    timestrip: new Date().toISOString(),
  };
}

export default getCleanArticle;
