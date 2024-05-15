export default (afterResponse) => {
  const allData = [];

  XMLHttpRequest.prototype.wrappedSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    this.wrappedSetRequestHeader(header, value);

    if (!this.headers) {
      this.headers = {};
    }

    if (!this.headers[header]) {
      this.headers[header] = [];
    }

    // Add the value to the header
    this.headers[header].push(value);
    if (this.url) {
      this.headers[header] = value;
    }
  };

  // 重写 XMLHttpRequest.prototype.open 方法
  let originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (url.includes(`/Bookmarks?variables=`)) {
      const xhr = this;
      xhr.url = url;

      chrome.storage.local.set({
        XXhrInfo: JSON.stringify({
          method,
          url,
          headers: xhr.headers,
        }),
      });

      xhr.onload = function () {
        const result = JSON.parse(xhr.responseText);
        const entries = result.data.bookmark_timeline_v2.timeline.instructions[0].entries;
        // 将entries中的数据添加到allData中，并去重
        entries.forEach((entry) => {
          TWEET_TYPES.includes(entry.content.entryType) &&
            !allData.find((item) => item.entryId === entry.entryId) &&
            allData.push(entry);
          let loadingButton = document.querySelector('.loading-button');
          loadingButton && (loadingButton.innerHTML = `Got ${allData.length} bookmarks, please wait...`);
        });

        if (entries.length > 2) {
          const cursor = entries[entries.length - 1].content.value;
          // 解析url请求参数
          const params = new URLSearchParams(url.split('?')[1]);
          params.set('variables', JSON.stringify(Object.assign(JSON.parse(params.get('variables')), { cursor })));

          // 创建一个新的请求
          const newXhr = new XMLHttpRequest();
          newXhr.open(method, `${url.split('?')[0]}?${params.toString()}`);
          // 设置请求头信息
          Object.keys(this.headers).forEach((header) => {
            newXhr.setRequestHeader(header, this.headers[header]);
          });
          newXhr.send(params.toString());
        } else {
          console.log(allData);
        }
      };
    }

    // 调用原始 open 方法
    originalOpen.apply(this, arguments);
  };
};
