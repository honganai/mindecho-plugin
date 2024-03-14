export interface Goal {
  id: number;
  status: number;
  goal_id: number;
  article_id: number;
  user_id: number;
  goal_content: string;
  summary: string;
  highLight?: {
    search_text?: string; // 回答中的高亮文本
    similar_text?: string; // 原文中的高亮文本
  }[];
}

export interface UserInfo {
  active: boolean;
  changed_by_fk: any;
  changed_on: string;
  created_by_fk: any;
  created_on: string;
  email: string;
  fail_login_count: number;
  first_name: string;
  id: number;
  last_login: string;
  last_name: string;
  login_count: number;
  password: string;
  username: string;
  subscription: any;
}

export interface Article {
  id: number;
  host: string;
  content: string;
  url: string;
  ua: string;
  title: string;
  types: string;
  conversation_id: string;
  user_id: number;
  created_on: string;
  changed_on: string;
}

export interface Highlight {
  article_id: number;
  keypoint: string;
  summary: string;
  user_id: string;
  article: Article;
}

export interface UnsortGroup {
  changed_on: string;
  content: string;
  conversation_id: string;
  created_on: string;
  distill_content: string;
  host: string;
  id: number;
  summary_content: string;
  title: string;
  types: string;
  ua: string;
  url: string;
  user_id: number;
}

export interface GoalOfThinking {
  article_ids: number[];
  count: number;
  goal: string;
  goal_id: number;
  goal_articles: GoalArticle[];
  loading: boolean;
}

export interface ArticleDistill {
  article_id: number;
  changed_on: string;
  created_on: string;
  distill_content: any;
  id: number;
  keypoint_content: string;
  question_content: string;
  summary_content: string;
  user_id: number;
}

export interface GoalArticle {
  article: Article;
  article_distill: ArticleDistill;
  user_question: [];
  summary_by_goal: string;
}

export interface DistillItem {
  key: string;
  list: any[];
  highlight: any;
}

/** 复制体格式 */
export interface ThinkingCopyObject {
  goal?: string;
  changed_on: string;
  title: string;
  url: string;
  summary_content: string;
}
