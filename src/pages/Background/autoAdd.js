/* eslint-disable no-undef */
import dayjs from 'dayjs';

const startAutoAdd = async () => {
    const history = await getHistory();
    const bookmarks = await getBookmarks();
    const readinglist = await getReadingList();
    const data = [];

    history?.forEach((item) => {
        data.push({
            title: item.title,
            url: item.url,
            type: 'history',
            user_create_time: dayjs(item.lastVisitTime).format('YYYY-MM-DD HH:mm:ss'),
            user_used_time: dayjs(item.lastVisitTime).format('YYYY-MM-DD HH:mm:ss'),
            node_id: item.id,
            node_index: '',
            parentId: '',
            origin_info: item,
        });
    });
    readinglist?.forEach((item) => {
        data.push({
            title: item.title,
            url: item.url,
            type: 'readinglist',
            user_create_time: dayjs(item.creationTime).format('YYYY-MM-DD HH:mm:ss'),
            user_used_time: dayjs(item.lastUpdateTime).format('YYYY-MM-DD HH:mm:ss'),
            node_id: '',
            node_index: '',
            parentId: '',
            origin_info: item,
        });
    });
    const result = concatBookmarks(bookmarks);

    uploadUserUrl([...data, ...result])
}

const getHistory = () => {
    // 获取最近4小时的记录
    let microsecondsPerWeek = 1000 * 60 * 60 * 4;
    let oneWeekAgo = new Date().getTime() - microsecondsPerWeek;
    chrome.history.search(
        { text: '', startTime: oneWeekAgo },
        (res) => {
            console.log('history res:', res);
            return res || [];
        }
    )
}

const getBookmarks = () => {
    chrome.bookmarks.getTree((tree) => {
        console.log('bookmarks res:', tree[0]);

        return tree[0] || {}
    });
}

const getReadingList = async () => {
    const res = await chrome.readingList.query({})
    console.log('readingList res:', res);
    return res || [];
}

const concatBookmarks = (bookmarkItem, result = []) => {
    for (const item of bookmarkItem?.children || []) {
        // If the node is a bookmark, create a list item and append it to the parent node
        if (item.url) {
            result.push({
                title: item.title,
                url: item.url,
                type: 'bookmark',
                user_create_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
                user_used_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
                node_id: item.id,
                node_index: item.index?.toString() || '',
                parentId: item.parentId || '',
                origin_info: item,
            });
        }

        // If the node has children, recursively display them
        if (item.children) {
            concatBookmarks(item, result);
        }
    }

    return result;
}

const uploadUserUrl = (data) => {
    chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_url', body: data }, (res) => {
        console.log('auto add res:', res);
    });
}

setInterval(() => {
    startAutoAdd();
}, 6 * 60 * 60 * 1000)
