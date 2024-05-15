function listenOnSendHeaders(details: any) {
  // console.log(details.url);

  if (!/\/graphql\/.+\/Bookmarks/.test(details.url)) {
    return;
  }
  console.log(details);

  try {
    chrome.storage.local
      .set({
        XBookmarkHeaders: {
          headers: details.requestHeaders,
          url: details.url,
          method: details.method,
        },
      })
      .then(() => {
        console.log('set XRequestHeaders is ok');
      });

    console.log(`Bookmarks: ${details.response.length} items received`);
  } catch (err) {
    console.error(details.method, details.url, details.status, details.responseText);
    console.error('Bookmarks: Failed to parse API response', err as Error);
  }
  chrome.webRequest.onSendHeaders.removeListener(listenOnSendHeaders);
}

console.log(`listenOnHeadersReceived-1`);

chrome.webRequest.onSendHeaders.addListener(listenOnSendHeaders, { urls: ['<all_urls>'] }, ['requestHeaders']);
