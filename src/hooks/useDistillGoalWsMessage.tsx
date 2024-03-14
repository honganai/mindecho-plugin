import React, { useContext, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';

interface Answers {
  Note: string;
  goal_id: number;
}

export default () => {
  const [answers, setAnswers] = useState([] as Answers[]);
  let jsonString = '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onChromeMessage = (request: any, sender: any, sendResponse: any) => {
    if (request.type === 'ws_distill_goal_request' && _.has(request, 'data') && !_.isEmpty(request.data)) {
      const { answer, event } = request.data;
      switch (event) {
        case 'message':
          jsonString += answer;
          break;
        case 'message_end':
          console.log('jsonString', jsonString);
          formatJsonString();
          break;
      }
    }
    sendResponse('ok');
  };

  const formatJsonString = () => {
    try {
      const answerArray = JSON.parse(jsonString);
      // 接口返回的 answer 可能是数组也可能是对象，这里统一处理成数组
      if (_.isArray(answerArray) && answerArray.length > 0) setAnswers(answerArray);
      else if (answerArray?.Note) setAnswers([answerArray]);
      console.log('answerArray', answerArray);
    } catch (e) {
      console.log('jsonString is not a josn string');
    }
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onChromeMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onChromeMessage);
    };
  }, []);

  return {
    answers,
  };
};
