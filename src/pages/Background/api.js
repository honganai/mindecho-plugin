/* eslint-disable no-undef */

import http from './http';
// restful api example
// /api/v1/usertag/<pk> ['DELETE']
// /api/v1/usertag/<int:pk> ['GET']
// /api/v1/usertag/ ['GET']
// /api/v1/usertag/_info ['GET']
// /api/v1/usertag/ ['POST']
// /api/v1/usertag/<pk> ['PUT']

const createRestApi = (resource) => {
  let url = `/api/v1/${resource}`;

  return {
    [`${resource}-[list]`]: ({ params, headers }) => {
      console.log(params, headers);
      return http.get(`${url}`, params, headers);
    },
    [`${resource}-[create]`]: ({ body, params, headers }) => http.post(`${url}/`, body, params, headers),
    [`${resource}-[create-with-slash]`]: ({ body, params, headers }) => http.post(`${url}/`, body, params, headers),
    [`${resource}-[retrieve]`]: ({ id, params, headers }) => http.get(`${url}/${id}`, params, headers),
    [`${resource}-[update]`]: ({ id, body, params, headers }) => http.put(`${url}/${id}`, body, params, headers),
    [`${resource}-[delete]`]: ({ id, params, headers }) => http.delete(`${url}/${id}`, params, headers),
    [`${resource}-[info]`]: ({ params, headers }) => http.get(`${url}/_info`, params, headers),
  };
};

const Api = {
  userinfo: () =>
    http.get(`/api/v1/user/info`).then((res) => {
      // 额外保存用户信息
      res.json().then(res => {
        chrome.storage.local
        .set({
          userInfo: res.result || null,
        })
        .then((result) => {
          console.log('set userInfo is ' + result);
        });
      })
      return res;
    }),
  //上传用户资源
  upload_user_url: ({ body, headers = {} }) => http.post('/api/v1/user_url', body, headers),
  //获取用户资源
  get_user_url: ({ body, headers = {} }) => http.get(`/api/v1/user_url`, body, headers),
  //更新用户资源
  update_user_url: ({ body, headers = {} }) => http.put('/api/v1/user_url', body, headers),
  //获取用户上传进度
  user_url_status: ({ headers = {} }) => http.get(`/api/v1/user_url_status`, headers),
  test: () => http.get(`/api/v1/status/`),
  ...createRestApi('product'),
  ...createRestApi('usertag'),
  ...createRestApi('article-distill'),
  ...createRestApi('article-note'),
  // ...createRestApi('llm/guess_goal'),
  ...createRestApi('user-goal-rel-article'),
  ...createRestApi('llm/goal_article'),
  ...createRestApi('user-question'),

  getMergeRelArticle: ({ headers = {}, params = {} }) =>
    http.get('/api/v1/user-goal-rel-article/merge', params, headers),

  /** 获取 Thinking 文章列表 ID */
  getThinkingArticleId: ({ headers = {}, params = { page: 1, pageSize: 10 } }) =>
    http.get(
      `/api/v1/user-goal-rel-article/merge-group?page=${params.page}&pageSize=${params.pageSize}`,
      params,
      headers,
    ),
  /** 获取 Thinking 文章列表 ID */
  goalArticleList: ({ body, headers = {} }) =>
    http.post('/api/v1/user-goal-rel-article/articles', body, headers),
  createGussGoal: ({ body, headers = {} }) => http.post('/api/v1/llm/guess_goal', body, headers),
  postAnswerGoal: ({ body, headers = {} }) => http.post('/api/v1/llm/answer_mutil_goal', body, headers),
  postUserGoalRelArticle: ({ body, headers = {} }) => http.post('/api/v1/user-goal-rel-article/saveorupdate_article_user_goal', body, headers),
  // 阻塞一次性请求distill结果 实时使用 ws_distill_request
  distillBlocking: ({ body, headers = {} }) => http.post('/api/v1/llm/distill', body, headers),
  // 获取高亮度相似文本
  distillHighlight: ({ body, headers = {} }) => http.post('/api/v1/llm/highlight', body, headers),

  // 对话历史记录
  chatHistory: ({ body, headers = {} }) => http.post('/api/v1/conversation/history', body, headers),

  //点击时保存question
  quesiton_merge_by_content: ({ body, headers = {} }) =>
    http.post('/api/v1/user-question/merge_by_content/', body, headers),
  getUnsortGroup: ({ headers = {}, params = {} }) => http.get('/api/v1/user-goal-rel-article/unsort-group', params, headers),
  /** 更新用户默认语言 */
  updateUserLanguage: ({ body, headers = {} }) => http.post('/api/v1/user_lang_info', body, headers),

  // 原文高亮文本
  highlightText: ({ body, headers = {} }) => http.post('/api/v1/highlight_text', body, headers),

  /** 记录用户页面停留时间 */
  recordReadingTime: ({ body, headers = {} }) => http.post('/api/v1/user_read_article', body, headers),

  // thinking 列表
  getArticleGroup: ({ body, headers = {} }) => http.post('/api/v1/analyst/article_group', body, headers),

  // 获取分享链接
  getShareUrl: ({ body, headers = {} }) => http.post('/api/v1/generate_link', body, headers),

  // 获取订阅计划列表
  getProduct: ({ headers = {}, params = {} }) => http.get('/api/v1/product/', params, headers),

  // 原文高亮文本
  putHighlightText: ({ body, headers = {} }) => http.put('/api/v1/highlight_text', body, headers),
};

export default Api;
