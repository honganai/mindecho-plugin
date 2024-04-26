/* eslint-disable no-undef */
import dayjs from 'dayjs';
import Api from './api';
import { MAX_SIZE } from '@/utils/common.util';
import { getUserInfo, getLastUpateDataTime, setLastUpateDataTime, getLastUpateDataTime_pocket, setLastUpateDataTime_pocket } from '@/constants';

const startAutoAdd = async () => {
    //如果没有登录，不执行
    const userInfo = await getUserInfo();
    if (!userInfo) return false;
    const promise1 = getLastUpateDataTime();
    const promise2 = getLastUpateDataTime_pocket();
    const lastUpateDataTime = await promise1;
    const lastUpateDataTime_pocket = await promise2;
    //@koman 暂时隐藏掉history
    //const history = await getHistory(lastUpateDataTime);
    const bookmarks = await getBookmarks();
    const readinglist = await getReadingList();
    const pocket = await getPocket();

    const data = [];
    //@koman 暂时隐藏掉history
    // history?.forEach((item) => {
    //     if (item.lastVisitTime > lastUpateDataTime) {
    //         data.push({
    //             title: item.title,
    //             url: item.url,
    //             type: 'history',
    //             user_create_time: dayjs(item.lastVisitTime).format('YYYY-MM-DD HH:mm:ss'),
    //             user_used_time: dayjs(item.lastVisitTime).format('YYYY-MM-DD HH:mm:ss'),
    //             node_id: item.id,
    //             node_index: '',
    //             parentId: '',
    //             origin_info: item,
    //             status: 1,
    //         });
    //     }
    // });
    readinglist?.forEach((item) => {
        if (item.creationTime > lastUpateDataTime) {
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
                status: 1,
            });
        }
    });

    bookmarks?.forEach((item) => {
        if (item.dateAdded > lastUpateDataTime) {
            data.push({
                title: item.title,
                url: item.url,
                type: 'bookmark',
                user_create_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
                user_used_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
                node_id: item.id,
                node_index: item.index?.toString() || '',
                parentId: item.parentId || '',
                origin_info: item,
                status: 1,
            });
        }
    });

    pocket?.forEach((item) => {
        if (item.user_create_time > lastUpateDataTime_pocket) {
            data.push({
                title: item.title,
                url: item.url,
                type: 'readinglist',
                user_create_time: dayjs(item.user_create_time).format('YYYY-MM-DD HH:mm:ss'),
                user_used_time: dayjs(item.user_used_time).format('YYYY-MM-DD HH:mm:ss'),
                node_id: '',
                node_index: '',
                parentId: '',
                origin_info: item,
                status: 1,
            });
        }
    });
    setLastUpateDataTime(new Date().getTime());
    setLastUpateDataTime_pocket(new Date().getTime());

    (data.length > 0 || pocket.length > 0) && uploadUserUrl([...data, ...pocket]);
}

const getHistory = (startTime) => {
    // 获取最近4小时的记录
    // let microsecondsPerWeek = 1000 * 60 * 60 * 4;
    // let oneWeekAgo = new Date().getTime() - microsecondsPerWeek;
    return chrome.history.search(
        { text: '', startTime }
    ).then(res => {
        console.log('history res:', res);
        return res || [];
    })
}

const getBookmarks = () => {
    return chrome.bookmarks.getRecent(100).then(tree => {
        console.log('bookmarks res:', tree);
        return tree || {}
    });
}

const getReadingList = async () => {
    return chrome.readingList.query({}).then(res => {
        console.log('readingList res:', res);
        return res || [];
    });
}

const getPocket = () => {
    return Api['get_user_url']({ body: { page: 1, page_size: MAX_SIZE, title: '', type: 'pocket' } })
        .then((res) => {
            return res.json()?.result || [];
        })
  }

// const concatBookmarks = (bookmarkItem, result = []) => {
//     for (const item of bookmarkItem?.children || []) {
//         // If the node is a bookmark, create a list item and append it to the parent node
//         if (item.url) {
//             result.push({
//                 title: item.title,
//                 url: item.url,
//                 type: 'bookmark',
//                 user_create_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
//                 user_used_time: dayjs(item.dateAdded).format('YYYY-MM-DD HH:mm:ss'),
//                 node_id: item.id,
//                 node_index: item.index?.toString() || '',
//                 parentId: item.parentId || '',
//                 origin_info: item,
//                 status: 1,
//             });
//         }

//         // If the node has children, recursively display them
//         if (item.children) {
//             concatBookmarks(item, result);
//         }
//     }

//     return result;
// }

const uploadUserUrl = (data) => {
    // 在js中无法直接发起runtime消息
    // chrome.runtime.sendMessage({ type: 'request', api: 'upload_user_url', body: data }, (res) => {
    //     console.log('auto add res:', res);
    // });
    Api['upload_user_url']({ body: data })
        .then((res) => {
            console.log('auto add res:', res);
        })
}

setInterval(() => {
    startAutoAdd();
}, 6 * 60 * 60 * 1000);
