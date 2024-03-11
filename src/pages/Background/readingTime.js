import API from './api';
import _ from 'lodash';
import UAParser from 'ua-parser-js';

class ReadingTime {
  static #_instance;
  chrome;
  collections;
  ua;

  static getInstance(options) {
    if (!ReadingTime.#_instance) {
      ReadingTime.#_instance = new ReadingTime(options);
    } else {
      ReadingTime.#_instance.addArticleObject(options);
    }
    return ReadingTime.#_instance;
  }

  static getDiretcInstance() {
    if (!ReadingTime.#_instance) {
      // eslint-disable-next-line no-undef
      console.warn('未初始化');
      return false;
    }
    return ReadingTime.#_instance;
  }

  constructor(options) {
    if (!ReadingTime.#_instance) {
      // eslint-disable-next-line no-undef
      console.log('ReadingTime 初始化');
      this.collections = {};
      this.chrome = options.chrome;
      this.addArticleObject(options);
      this.#_initUA(options);
      this.#_initActivatedEvent();
      this.#_initRemovedEvent();
      this.#_initUpdatedEvent();
    } else {
      return ReadingTime.#_instance;
    }
  }

  /** 初始化标签切换事件 */
  #_initActivatedEvent() {
    this.chrome.tabs.onActivated.addListener(({ tabId }) => {
      // eslint-disable-next-line no-undef
      console.log('观察对象：', this.collections);
      // eslint-disable-next-line no-undef
      console.log('当前标签ID：', tabId);
      // eslint-disable-next-line no-undef
      console.log('ua', this.ua);

      // 标签切换时，如果存在 active 为 true 的页面，将激活界面转为未激活，并提交阅读记录
      const hitTab = Object.entries(this.collections).find(([, value]) => value.active);
      if (hitTab) {
        const [hitKey] = hitTab;
        // 结束阅读并提交
        this.stopReadingSubmit(hitKey);
      }

      // 当前页面不存在于观察对象中，直接返回
      if (!_.has(this.collections, tabId)) {
        // eslint-disable-next-line no-undef
        console.log('当前页面不存在于观察对象中');
        return false;
      }

      // 当前页面存在于观察对象中，将 active 设置为 true，并重置 entryTime
      this.collections[tabId].active = true;
      this.collections[tabId].entryTime = this.getCurrentSecond();
      this.collections[tabId].endTime = 0;
    });
  }

  /** 初始化标签关闭事件 */
  #_initRemovedEvent() {
    this.chrome.tabs.onRemoved.addListener((removedTabId, removedInfo) => {
      // 关闭标签时，如果该标签在观察对象中，并且 active 为 true, 则提交阅读记录
      this.removeArticleObject(removedTabId);
      // eslint-disable-next-line no-undef
      console.log('removedTabId', removedTabId);
      // eslint-disable-next-line no-undef
      console.log('removedInfo', removedInfo);
    });
  }

  /** 初始化标签更新事件 */
  #_initUpdatedEvent() {
    this.chrome.tabs.onUpdated.addListener((updaedTabId, updatedInfo, tabInfo) => {
      // 标签页刷新有两种情况
      // 1、点击链接，在原标签进行跳转，会触发 onUpdated 事件
      // 2、点击链接，弹出新标签页，会触发 onActivated 和 onUpdated 事件

      // 标签页刷新时会有 loading 和 complete 等多个状态，并且 loading 可能会有多次，只在 complete 状态下执行
      if (_.has(updatedInfo, 'status') && updatedInfo.status === 'complete') {
        // 标签更新时，如果该标签在观察对象中，并且 active 为 true，则提交阅读记录，并且删除该观察对象
        this.removeArticleObject(updaedTabId);
      }
      // eslint-disable-next-line no-undef
      console.log('updaedTabId', updaedTabId);
      // eslint-disable-next-line no-undef
      console.log('updatedInfo', updatedInfo);
      // eslint-disable-next-line no-undef
      console.log('tabInfo', tabInfo);
    });
  }

  /** 初始化 UA 信息 */
  #_initUA({ ua }) {
    this.ua = new UAParser(ua).getResult();
  }

  /** 新增或重置一个观察对象 */
  addArticleObject(options) {
    // 毫秒转为秒
    const entryTime = this.getCurrentSecond();
    // eslint-disable-next-line no-undef
    console.log(`新增观察对象: ${options.tabId}, articleId: ${options.articleId}, entryTime: ${entryTime}`);
    this.collections[options.tabId] = {
      articleId: options.articleId,
      entryTime,
      endTime: 0,
      active: true,
    };
  }

  /** 删除一个观察对象 */
  async removeArticleObject(tabId) {
    // 检查是否是观察对象，否则直接返回
    if (!_.has(this.collections, tabId)) return false;

    // 删除观察对象前，检查该观察对象是否处于 active 为 true 的状态，为 true 时执行提交记录后执行删除
    if (this.collections[tabId].active) {
      // 结束阅读并提交
      const response = await this.stopReadingSubmit(tabId);
      if (response?.ok) {
        // eslint-disable-next-line no-undef
        console.log('提交完成，删除观察对象');
        delete this.collections[tabId];
        // eslint-disable-next-line no-undef
      } else console.log('提交失败，请检查接口');
    } else delete this.collections[tabId];
  }

  /** 获取当前秒数 */
  getCurrentSecond() {
    return parseInt(new Date().getTime() / 1000);
  }

  /** 结束阅读并提交记录 */
  stopReadingSubmit(tabId) {
    this.collections[tabId].active = false;
    this.collections[tabId].endTime = this.getCurrentSecond();
    return this.uploadReadingTime(tabId);
  }

  /**
   * @description: 上传用户阅读时间
   * @param {*} tabId 要上传的tab页ID
   * @return {*}
   */
  async uploadReadingTime(tabId) {
    const { articleId, entryTime, endTime } = this.collections[tabId];
    const {
      browser: { name: browserName },
      os: { name: osName },
    } = this.ua;
    const params = {
      article_id: articleId,
      read_start_time: entryTime,
      read_end_time: endTime,
      read_duration: endTime - entryTime,
      device_type: osName,
      browser_info: browserName,
    };
    const response = await API.recordReadingTime({ body: params });
    // eslint-disable-next-line no-undef
    console.log('uploadReadingTime response:', response);
    return response;
  }
}

export default ReadingTime;
