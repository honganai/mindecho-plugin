import React, { useState, useContext, useEffect } from 'react';
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
    const { state: { showAskModal, showAnswerModal, progress }, dispatch: globalDispatch } = useContext(GlobalContext);
    const [progressData, setProgressData] = useState<Array<IProgressData>>([]);
    const [timer, setTimer] = useState<NodeJS.Timeout>();

    useEffect(() => {
        getProgress();
    }, []);

    useEffect(() => {
        if (showAskModal || showAnswerModal) {
            setTimeout(() => {
                getDocument().getElementById('mindecho-ask-input')?.focus();
            }, 500);
            const intervalId = setInterval(() => {
                getProgress();
            }, 5000);
            setTimer(intervalId);
        } else {
            clearInterval(timer);
        }
    }, [showAskModal, showAnswerModal]);

    const getProgress = () => {
        chrome.runtime.sendMessage({ type: 'request', api: 'user_url_status' }, (res) => {
            globalDispatch({
                type: GlobalActionType.SetProgress,
                payload: {
                    data: res || null,
                    getIng: false,
                },
            })
        });
    }

    useEffect(() => {
        if (_.isArray(progress?.data)) {
            let resData = [
                { title: 'Bookmarks', count: 0, pended: 0 },
                { title: 'Reading List', count: 0, pended: 0 },
                { title: 'history', count: 0, pended: 0 },
            ]
            progress?.data?.forEach((item: any) => {
                if (item.status > 0) {
                    switch (item.type) {
                        case 'bookmark':
                            resData[0].count += item.count;
                            if (item.status >= 3) {
                                resData[0].pended += item.count;
                            }
                            break;
                        case 'readinglist':
                            resData[1].count += item.count;
                            if (item.status >= 3) {
                                resData[1].pended += item.count;
                            }
                            break;
                        case 'history':
                            resData[2].count += item.count;
                            if (item.status >= 3) {
                                resData[2].pended += item.count;
                            }
                            break;
                    }
                }
            })
            setProgressData(resData)
        }
    }, [progress])

    const renderProgress = () => {
        return progressData.map((item, index) => {
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
            {renderProgress()}
        </div>
    );
};

export default MyProgress;
