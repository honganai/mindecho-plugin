export interface Props {
  title?: string;
  userinfo: any;
  thinkingKey?: string;
}

/** 问题列表 */
export interface MergeGroup {
  [key: string]: {
    article_ids: number[];
    count: number;
  };
}

/** 文章详情 */
export interface ArticleList {
  article_ids: number[];
  result: any;
}

// 文章名集合
export interface ArticleName {
  title: string;
  article_ids: number[];
  key: number;
}
