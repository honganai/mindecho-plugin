import React, { useEffect, useRef, useState } from 'react';
import { useSize } from 'ahooks';
import Draggable from 'react-draggable';

import styles from './content-flat.module.scss';
import { CheckCircleFilled, CloseCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { getDocument } from '@/utils/common.util';
import { setDisablePage, setDisableSite, setDisableAll, setDragPosition, getDragPosition } from '@/constants';

import cs from 'classnames';
import { Dropdown, Tooltip } from 'antd';

interface IProps {
  showAnimate: false;
}
const Options: React.FC<IProps> = ({ showAnimate }) => {
  const img = chrome.runtime.getURL('icon128.png');
  const settingImg = chrome.runtime.getURL('setting.png');
  const arrowImg = chrome.runtime.getURL('arrow.png');
  const distillIconName = chrome.i18n.getMessage('distillIconName');
  const containerRef = useRef(null);
  const guideRef = useRef<HTMLImageElement>(null);
  const [openSetting, setOpenSetting] = useState(false);
  const mouseInRef = useRef(false);
  const [mouseIn, setMouseIn] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [arrowHeight, setArrowHeight] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const startYRef = useRef(0);
  const endYRef = useRef(0);
  const [closeTipsShow, setCloseTipsShow] = useState(false);
  const [closeTips, setCloseTips] = useState('');
  const closeTipRef = useRef<any>(null);

  const guideSize = useSize(guideRef);

  useEffect(() => {
    if ((showArrow && guideSize?.width) || 0 > 0) {
      setTimeout(() => {
        setArrowHeight(guideRef.current?.getBoundingClientRect().top || 0);
      }, 50);
    }
  }, [guideSize?.width, showArrow]);

  const onClose = () => {
    console.log('close');
    const linnk = getDocument().getElementById('linnk-sidebar-flat') as HTMLElement;
    if (linnk?.parentNode) linnk.parentNode.removeChild(linnk);
  };

  const onShowContent = () => {
    // 有拖动不触发点击
    if (startYRef.current !== endYRef.current) {
      return;
    }
    console.log('showContent');
    chrome.runtime.sendMessage({ type: 'showContent', data: {} }, (res) => {
      console.log('show-content res:', res);
    });
  };

  const showCloseTips = (text: string) => {
    setCloseTips(text);
    setCloseTipsShow(true);
    setTimeout(() => {
      onClose();
    }, 100); // 需要延时不然显示不出来

    setTimeout(() => {
      closeTipRef.current?.portalContainer.remove();
    }, 5000);
  };

  useEffect(() => {
    getDragPosition().then((res) => {
      setPosition(res || { x: 0, y: 0 });
    });
  }, []);

  return (
    <>
      {position && (
        <>
          <div
            className={styles.wrapper}
            style={{
              transform: `translateY(${position.y}px)`,
            }}>
            <Draggable
              handle={`.${styles.summarize}`}
              axis="y"
              onStart={(e, data) => {
                console.log('🚀 ~ file: ContentFlat.tsx:onStart ~ e:', data);
                startYRef.current = data.y;
              }}
              onStop={(e, data) => {
                console.log('🚀 ~ file: ContentFlat.tsx:onStop ~ e:', data);
                endYRef.current = data.y;
                setDragPosition({
                  x: position.x + data.x,
                  y: position.y + data.y,
                });
              }}>
              <div
                className={cs(styles.container, mouseIn && styles.hover)}
                onMouseOver={() => {
                  mouseInRef.current = true;
                  setMouseIn(true);
                }}
                onMouseLeave={() => {
                  mouseInRef.current = false;
                  // 增加一个延时防止不小心鼠标移出导致隐藏
                  setTimeout(() => {
                    if (!mouseInRef.current) {
                      setMouseIn(false);
                      setOpenSetting(false);
                    }
                  }, 300);
                }}
                ref={containerRef}>
                <div
                  className={cs(styles.summarize, showAnimate && styles['highlight-animate'])}
                  onClick={onShowContent}>
                  <img draggable={false} className={styles['img-logo']} src={img} />
                  <span className={styles['span']}>{distillIconName}</span>
                </div>
                <div className={cs(styles.icon, styles['close-icon'])}>
                  <CloseCircleOutlined onClick={onClose} />
                </div>
                <div className={cs(styles.icon, styles['setting-icon'])}>
                  <Dropdown
                    open={openSetting}
                    onOpenChange={(open) => {
                      setOpenSetting(open);
                    }}
                    menu={{
                      items: [
                        {
                          key: '1',
                          label: (
                            <div dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('disableThisPage') }}></div>
                          ),
                          onClick: () => {
                            setDisablePage(window.location.href);
                            showCloseTips(chrome.i18n.getMessage('disableThisPageTips'));
                          },
                        },
                        {
                          key: '2',
                          label: (
                            <div dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('disableThisSite') }}></div>
                          ),
                          onClick: () => {
                            setDisableSite(window.location.host);
                            showCloseTips(chrome.i18n.getMessage('disableThisSiteTips', [window.location.host]));
                          },
                        },
                        {
                          key: '3',
                          label: (
                            <div dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('disableAllPages') }}></div>
                          ),
                          onClick: () => {
                            setDisableAll();
                            showCloseTips(chrome.i18n.getMessage('disableAllPagesTips'));
                          },
                        },
                        {
                          type: 'divider',
                        },
                      ],
                    }}
                    dropdownRender={(menu) => (
                      <div className={styles['dropdown-content']}>
                        {menu}
                        <Tooltip
                          title={
                            <div>
                              <img className={styles['setting-image']} ref={guideRef} src={settingImg} />
                            </div>
                          }
                          onOpenChange={(visible) => setShowArrow(visible)}
                          showArrow={false}
                          getPopupContainer={() => containerRef.current || document.body}
                          autoAdjustOverflow={false}
                          placement="bottomRight"
                          mouseEnterDelay={0}
                          mouseLeaveDelay={0.3}
                          overlayInnerStyle={{
                            padding: 0,
                            background: 'transparent',
                            boxShadow: 'none',
                          }}>
                          <div className={styles['hover-link']}>{chrome.i18n.getMessage('howToLaunch')}</div>
                        </Tooltip>
                      </div>
                    )}
                    overlayClassName={styles['header-userinfo']}
                    placement="bottomRight"
                    autoAdjustOverflow={false}
                    getPopupContainer={() => containerRef.current || document.body}
                    trigger={['click']}>
                    <span className={styles['header-user-icon']}>
                      <SettingOutlined />
                    </span>
                  </Dropdown>
                </div>
              </div>
            </Draggable>
          </div>
          <img style={{ height: arrowHeight, opacity: showArrow ? 1 : 0 }} className={styles.arrow} src={arrowImg} />
        </>
      )}
      <Tooltip
        ref={closeTipRef}
        title={
          <div className={styles['close-tips-content']}>
            <CheckCircleFilled />
            <div>
              <div dangerouslySetInnerHTML={{ __html: closeTips }}></div>
              <div>{chrome.i18n.getMessage('disableThisPageTipsDesc')}</div>
            </div>
          </div>
        }
        getPopupContainer={() => getDocument().getElementById('linnk-sidebar-document') || document.body}
        overlayClassName={styles['close-tips-tooltip']}
        open={closeTipsShow}
        arrowPointAtCenter={true}
        placement="bottomRight">
        <div className={styles['close-tips']}></div>
      </Tooltip>
    </>
  );
};

export default Options;
