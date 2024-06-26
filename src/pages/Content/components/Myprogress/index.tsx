import React, { useState, useContext, useEffect, useMemo } from 'react';
import { getDocument } from '@/utils/common.util';
import { Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import GlobalContext, { ActionType as GlobalActionType } from '@/reducer/global';
import _, { set } from 'lodash';
import styles from './index.module.scss';

interface IProgressData {
    title: string;
    count: number;
    pended: number;
}

const MyProgress: React.FC = () => {
    const { state: { showAskModal, showAnswerModal, progress, titleMap: keyList }, dispatch: globalDispatch } = useContext(GlobalContext);
    //使用该组件时引用
    // const [timer, setTimer] = useState<NodeJS.Timeout>();

    useEffect(() => {
        //使用该组件时引用
        //getProgress();
    }, []);

    //使用该组件时引用
    // useEffect(() => {
    //     if (showAskModal) {
    //         const intervalId = setInterval(() => {
    //             getProgress();
    //         }, 5000);
    //         setAskTimer(intervalId);
    //     } else {
    //         clearInterval(askTimer);
    //     }
    // }, [showAskModal]);

    // const getProgress = () => {
    //     chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
    //         globalDispatch({
    //             type: GlobalActionType.SetProgress,
    //             payload: {
    //                 data: res || null,
    //                 getIng: false,
    //             },
    //         })
    //     });
    // }

    const initialData = (type: string, data: any, mapData: any) => {
        if (!_.some(data, ['title', keyList[type]])) {
            const index = data.push({ title: keyList[type], count: 0, pended: 0 });
            mapData[type] = data[index - 1];
        }
    }

    const progressData = useMemo(() => {
        if (_.isArray(progress)) {
            let reusltData: Array<IProgressData> = []
            let reusltDataMap = {} as any;

            progress?.forEach((item: any) => {
                if (item.status > 0 && item.type !== 'history') {
                    initialData(item.type, reusltData, reusltDataMap);

                    reusltDataMap[item.type].count += item.count;
                    if (item.status >= 3) {
                        reusltDataMap[item.type].pended += item.count;
                    }
                }
            })
            return reusltData;
        }
        return [];
    }, [progress, initialData]);

    const renderProgress = (data: Array<IProgressData>) => {
        return data.map((item, index) => {
            return (
                <div className={styles.items} key={item.title}>
                    <span className={styles['source-title']}>{item.title}</span>
                    {
                        item.pended !== item.count ? (
                            <>
                                <Spin size="small" style={{ margin: '0 5px' }} />
                                <p className={styles['source-stauts']}><span className={styles['success']}>{item.pended}</span>/{item.count}</p>
                            </>

                        ) : (
                            <>
                                <CheckCircleOutlined className={styles['success-icon']} />
                                <p className={styles['source-stauts']}><span className={styles['success']}>{item.pended}</span></p>
                            </>
                        )
                    }
                </div>
            )
        })
    }

    return (
        <div className={styles.content}>
            {renderProgress(progressData)}
        </div>
    );
};

export default MyProgress;
