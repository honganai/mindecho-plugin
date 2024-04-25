import {
  TimelineInstructions,
  Tweet,
  ItemContentUnion,
  Media,
  TimelineAddEntriesInstruction,
  TimelineEntry,
  TimelineTimelineItem,
  TimelineTimelineModule,
  TimelineTweet,
  TimelineTwitterList,
  TimelineUser,
  TweetUnion,
  User,
} from './types';

interface BookmarksResponse {
  data: {
    bookmark_timeline_v2: {
      timeline: {
        instructions: TimelineInstructions;
        responseObjects: unknown;
      };
    };
  };
}

export default async function onTwitterAction() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    // 在回调函数中处理返回的标签页信息
    var activeTab = tabs[0];
    console.log('activeTab', activeTab);

    chrome.tabs.create({
      url: 'https://twitter.com/i/bookmarks'
    }, () => {
      function listenOnHeadersReceived(details: any) {
        if (!/\/graphql\/.+\/Bookmarks/.test(details.url)) {
          return;
        }
        console.log(111111, details, details.url)
      
        try {
          const newData = extractDataFromResponse<BookmarksResponse, Tweet>(
            details.response,
            (json) => json.data.bookmark_timeline_v2.timeline.instructions,
            (entry) => extractTimelineTweet(entry.content.itemContent),
          );
      
          console.log(`Bookmarks: ${newData.length} items received`);
        } catch (err) {
          console.error(details.method, details.url, details.status, details.responseText);
          console.error('Bookmarks: Failed to parse API response', err as Error);
        }
        chrome.webRequest.onHeadersReceived.removeListener(listenOnHeadersReceived);

      }
      chrome.webRequest.onHeadersReceived.addListener(listenOnHeadersReceived, { urls: ['<all_urls>'] }, [
        'responseHeaders',
      ]);
    });
  });
}

export function extractDataFromResponse<
  R,
  T extends User | Tweet,
  P extends TimelineUser | TimelineTweet = T extends User ? TimelineUser : TimelineTweet,
>(
  response: XMLHttpRequest,
  extractInstructionsFromJson: (json: R) => TimelineInstructions,
  extractDataFromTimelineEntry: (entry: TimelineEntry<P, TimelineTimelineItem<P>>) => T | null,
): T[] {
  const json: R = JSON.parse(response.responseText);
  const instructions = extractInstructionsFromJson(json);

  const timelineAddEntriesInstruction = instructions.find(
    (i) => i.type === 'TimelineAddEntries',
  ) as TimelineAddEntriesInstruction<P>;

  const newData: T[] = [];

  for (const entry of timelineAddEntriesInstruction.entries) {
    if (isTimelineEntryItem<P>(entry)) {
      const data = extractDataFromTimelineEntry(entry);
      if (data) {
        newData.push(data);
      }
    }
  }

  return newData;
}

export function extractTimelineTweet(itemContent: TimelineTweet): Tweet | null {
  const tweetUnion = itemContent.tweet_results.result;

  if (!tweetUnion) {
    console.error(
      "TimelineTweet is empty. This could happen when the tweet's visibility is limited by Twitter.",
      itemContent,
    );
    return null;
  }

  return extractTweetUnion(tweetUnion);
}

export function isTimelineEntryItem<T extends ItemContentUnion>(
  entry: TimelineEntry,
): entry is TimelineEntry<T, TimelineTimelineItem<T>> {
  return entry.content.entryType === 'TimelineTimelineItem';
}

export function extractTweetUnion(tweet: TweetUnion): Tweet | null {
  try {
    if (tweet.__typename === 'Tweet') {
      return tweet;
    }

    if (tweet.__typename === 'TweetWithVisibilityResults') {
      return tweet.tweet;
    }

    if (tweet.__typename === 'TweetTombstone') {
      console.error(`TweetTombstone received (Reason: ${tweet.tombstone?.text?.text})`, tweet);
      return null;
    }

    if (tweet.__typename === 'TweetUnavailable') {
      console.error('TweetUnavailable received (Reason: unknown)', tweet);
      return null;
    }

    console.error(tweet);
    console.error('Unknown tweet type received');
  } catch (err) {
    console.error(tweet);
    console.error('Failed to extract tweet', err as Error);
  }

  return null;
}