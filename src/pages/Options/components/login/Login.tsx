import React from 'react';
import { Button } from 'antd';
import Logo from '../../../../assets/icons/logo.png';
import LogoText from '../../../../assets/icons/logo-font.png';
import './index.module.css';

interface Props {
  title?: string;
  onLogin: Function;
}
const Login: React.FC<Props> = ({ title, onLogin }: Props) => {
  const signUpWithGoogle = chrome.i18n.getMessage('signUpWithGoogle');
  return (
    <div className='container'>
      <div>
        <img className="google-icon" src={Logo} />
        <img className="google-icon" src={LogoText} />
      </div>
      <Button className='btn-login' size="large" type="primary" block onClick={() => onLogin()}>
        <span>{signUpWithGoogle}</span>
      </Button>
    </div>
  );
};

export default Login;
