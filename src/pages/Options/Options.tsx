import React, { useEffect, useReducer, useRef, useState } from 'react';
import './Options.css';
import Login from './components/login/Login';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  const toLogin = () => {
    chrome.runtime.sendMessage({ type: 'login', data: {} }, (res) => {
      console.log('login res:', res);
      //发送用户身份信息
      const event_name="plugin_click_login"
      console.log('posthog event_name', event_name);
      //posthog.capture(event_name )
      if (!res || res.error) {
        console.log('登陆错误');
      }
    });
  };

  return (
    <>
      <Login onLogin={toLogin} />
    </>
  )
};

export default Options;
