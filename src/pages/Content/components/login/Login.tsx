import React from 'react';
import styles from './index.module.scss';
import { Button } from 'antd';
import google from '../../../../assets/icons/google.svg';

interface Props {
  title?: string;
  onLogin: Function;
}
const Login: React.FC<Props> = ({ title, onLogin }: Props) => {
  const signUpWithGoogle = chrome.i18n.getMessage('signUpWithGoogle');
  return (
    <div className={styles.container}>
      <Button className={styles['btn-login']} size="large" type="primary" block onClick={() => onLogin()}>
        {/* <img className="google-icon" src={google} /> */}
        <span>{signUpWithGoogle}</span>
      </Button>
    </div>
  );
};

export default Login;
