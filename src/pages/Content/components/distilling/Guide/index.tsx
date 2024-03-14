import React, { useEffect, useState, useContext } from 'react';
import { getGuideComplete, removeExtensionUpdated, setGuideComplete } from '@/constants';
import GlobalContext, { ActionType } from '@/reducer/global';
import guideData from '@/constants/guideData';
import Step from './Step';
import { useScroll } from 'ahooks';

import styles from './index.module.scss';

interface IProps {
  contentRef: React.RefObject<HTMLElement>;
}
const Guide: React.FC<IProps> = ({ contentRef }) => {
  const [completed, setCompleted] = useState(true);
  const scroll = useScroll(contentRef);
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const [step, setStep] = useState(0);
  const { guideRefs } = globalState;
  const guideShow = guideData
    .filter((item) => {
      return guideRefs.current[item.key];
    })
    .map((item) => {
      return {
        ...item,
        rect: guideRefs.current?.[item.key]?.getBoundingClientRect(),
      };
    });

  useEffect(() => {
    getGuideComplete().then((res: any) => {
      setCompleted(!!res);
    });
  }, []);

  return (
    guideShow.length > 0 &&
    !completed && (
      <div
        className={styles.container}
        onClick={() => {
          // 点击任何区域都执行下一步
          if (step < guideShow.length - 1) {
            // 下一步
            setStep(step + 1);
            contentRef.current?.scrollTo({
              top: guideShow[step + 1].rect.top + (scroll?.top || 0) - 100,
              behavior: 'smooth',
            });
          } else {
            // 完成
            contentRef.current?.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
            globalDispatch({
              type: ActionType.SetShowGuide,
              payload: false,
            });
            setGuideComplete();
            removeExtensionUpdated();
          }
        }}>
        {guideShow.map(
          (guide, index) =>
            index === step && (
              <div key={guide.key} className={styles.step}>
                <Step
                  scroll={scroll}
                  contentRef={contentRef}
                  onNext={() => {
                    // if (step < guideShow.length - 1) {
                    //   // 下一步
                    //   setStep(step + 1);
                    //   contentRef.current?.scrollTo({
                    //     top: guideShow[step + 1].rect.top + (scroll?.top || 0) - 100,
                    //     behavior: 'smooth',
                    //   });
                    // } else {
                    //   // 完成
                    //   contentRef.current?.scrollTo({
                    //     top: 0,
                    //     behavior: 'smooth',
                    //   });
                    //   globalDispatch({
                    //     type: ActionType.SetShowGuide,
                    //     payload: false,
                    //   });
                    //   setGuideComplete();
                    // }
                  }}
                  dom={guideRefs.current?.[guide.key]}
                  text={guide.text}
                  desc={guide.desc}
                  rect={guide.rect}
                  position={guide.position}
                  isLast={step === guideShow.length - 1}></Step>
              </div>
            ),
        )}
      </div>
    )
  );
};

export default Guide;
