import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';
import { LinkOutlined, CopyFilled } from '@ant-design/icons';
import { Button, List, message, Skeleton, Typography } from 'antd';
import _ from 'lodash';
import { GoalArticle, GoalOfThinking } from '@/types';
import { formatDateMMDD, copyToClipboard } from '@/utils/common.util';

const GoalView: React.FC = () => {
  const loadMoreText = chrome.i18n.getMessage('loadMore');
  const [initLoading, setInitLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [goalList, setGoalList] = useState([] as GoalOfThinking[]);
  const [goalTotal, setGoalTotal] = useState(0);
  const [activeIdList, setActiveIdList] = useState([] as number[]);
  const [hasMore, setHasMore] = useState(true);
  const [activeGoalIds, setActiveGoalIds] = useState([] as number[]);
  const pageSize = 10;

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    appendDataWithThrottle();
  }, []);
  const appendData = () => {
    console.log('getGoalList page', page);
    if (page > 1) {
      setLoading(true);
    }
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'getThinkingArticleId',
        params: { page, pageSize },
        headers: {},
      },
      ({ result, total }) => {
        if (result?.length > 0) {
          setGoalList([...goalList, ...result]);
          setGoalTotal(total);
        } else {
          setHasMore(false);
        }
        if (page === 1) {
          setInitLoading(false);
        } else {
          setLoading(false);
        }
        setPage(page + 1);
        window.dispatchEvent(new Event('resize'));
      },
    );
  };

  const updateGoalArticleList = (goal: GoalOfThinking) => {
    // if goal has goal_articles, return
    if (goal.goal_articles?.length > 0) {
      return;
    }
    setActiveIdList((tmp) => [...tmp, goal.goal_id]);
    chrome.runtime.sendMessage(
      {
        type: 'request',
        api: 'goalArticleList',
        body: { article_ids: goal.article_ids, goal_id: goal.goal_id },
        headers: {},
      },
      ({ result, article_ids }) => {
        if (!result) {
          return;
        }
        console.log('updateGoalArticleList result', result);
        try {
          setGoalList((tmp) => {
            // update goalList by article_ids
            return tmp.map((goalOfThinking: GoalOfThinking) => {
              if (
                _.isEqual(goalOfThinking.article_ids, article_ids) &&
                _.isEqual(goalOfThinking.goal_id, goal.goal_id)
              ) {
                return {
                  ...goalOfThinking,
                  goal_articles: result,
                };
              }
              return goalOfThinking;
            });
          });
        } catch (err) {
          console.log(err);
        } finally {
          setActiveIdList((tmp) => tmp.filter((num) => num !== goal.goal_id));
        }
      },
    );
  };
  const appendDataWithThrottle = _.throttle(appendData, 1000);

  const openUrlInNewTab = (url: string) => {
    window.open(url);
  };

  const onSelectedGoalChange = (goal: GoalOfThinking) => {
    // if goal id in activeGoalIds, remove it
    // else add it
    const index = activeGoalIds.indexOf(goal.goal_id);
    if (index > -1) {
      // remove it
      setActiveGoalIds((tmp) => {
        const newActiveGoalIds = [...tmp];
        newActiveGoalIds.splice(index, 1);
        return newActiveGoalIds;
      });
    } else {
      // add it

      setActiveGoalIds((tmp) => [...tmp, goal.goal_id]);
      updateGoalArticleList(goal);
    }
  };

  const formatCopy = (goalOfThinking: GoalOfThinking) => {
    const { goal } = goalOfThinking;
    const textArray = goalOfThinking.goal_articles.map((ga) => {
      const { summary_by_goal } = ga;
      const { changed_on, url, title } = ga.article;
      const changedOn = formatDateMMDD(changed_on);
      return `${summary_by_goal}\r\n${title}\r\n${url}\r\n${changedOn}\r\n`;
    });
    let resultText = `${goal}\r\n`;
    for (const currentText of textArray) {
      resultText += currentText;
    }
    copyToClipboard(resultText);
  };

  const loadMore =
    !initLoading && !loading && hasMore && goalList?.length < goalTotal ? (
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          height: 32,
          lineHeight: '32px',
        }}>
        <Button onClick={appendData}>{loadMoreText}</Button>
      </div>
    ) : null;

  return (
    <div className={styles.container}>
      <List
        loading={initLoading}
        dataSource={goalList}
        itemLayout="horizontal"
        loadMore={loadMore}
        renderItem={(goalOfThinking: GoalOfThinking) => (
          <div key={goalOfThinking.goal_id + ''} className="pointread-content-wrapper">
            <div
              className={
                activeGoalIds.indexOf(goalOfThinking.goal_id) > -1
                  ? 'pointread-goal-title-wrapper-active'
                  : 'pointread-goal-title-wrapper'
              }
              onClick={() => {
                onSelectedGoalChange(goalOfThinking);
              }}>
              <div className="pointread-goal-title">{goalOfThinking.goal}</div>
              {/* <Typography.Text className="pointread-goal-title" ellipsis={false}>
                {goalOfThinking.goal}
              </Typography.Text> */}
              <CopyFilled
                className="pointread-goal-copy-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  formatCopy(goalOfThinking);
                }}
              />
            </div>
            {activeGoalIds.indexOf(goalOfThinking.goal_id) > -1 && (
              <Skeleton
                className="pointread-goal-loading-skeleton"
                loading={activeIdList.some((ail) => ail === goalOfThinking.goal_id)}
                title={false}
                active>
                <List
                  dataSource={goalOfThinking.goal_articles}
                  renderItem={(goalArticle: GoalArticle) => (
                    <div key={goalArticle.article.id} className="pointread-goal-article-item">
                      {contextHolder}
                      <div className="pointread-goal-article-item-summary">{goalArticle.summary_by_goal}</div>
                      <div
                        className="pointread-goal-article-item-title-wrapper"
                        onClick={() => {
                          openUrlInNewTab(goalArticle.article.url);
                        }}>
                        <div className="pointread-goal-article-item-wrapper">
                          <LinkOutlined
                            className="pointread-goal-article-item-title-prefix-icon"
                            onClick={() => {
                              openUrlInNewTab(goalArticle.article.url);
                            }}
                          />
                          <Typography.Text
                            className="pointread-goal-article-item-title-text"
                            ellipsis={{
                              tooltip: {
                                title: goalArticle.article.title,
                                zIndex: 21474836471,
                              },
                            }}>
                            {goalArticle.article.title}
                          </Typography.Text>
                        </div>
                        <div className="pointread-goal-article-item-wrapper">
                          <div className="pointread-goal-article-item-date">
                            {formatDateMMDD(goalArticle.article_distill?.changed_on)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </Skeleton>
            )}
          </div>
        )}
      />
    </div>
  );
};
export default GoalView;
