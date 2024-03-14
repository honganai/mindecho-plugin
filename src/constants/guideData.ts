/**
 * 可选key值：
 * 'goal'
 * 'content'
 *      'content_type', 'key_logics', 'data_sheet', 'quotes'
 * 'questions'
 */
const keylogicGuideTitle = chrome.i18n.getMessage('keylogicGuideTitle');
const keylogicGuideDesc = chrome.i18n.getMessage('keylogicGuideDesc');
const noteGuideTitle = chrome.i18n.getMessage('noteGuideTitle');
const noteGuideDesc = chrome.i18n.getMessage('noteGuideDesc');
const questionGuideTitle = chrome.i18n.getMessage('questionGuideTitle');
const questionGuideDesc = chrome.i18n.getMessage('questionGuideDesc');

const guideData = [];
// const guideData = [
//   {
//     key: 'goal',
//     text: noteGuideTitle,
//     desc: noteGuideDesc,
//     position: {
//       top: -10,
//       right: 10,
//       // left: 20,
//       // bottom: 20
//     },
//   },
//   // {
//   //   key: 'content',
//   //   text: '2222222',
//   //   desc: 'bbbbbbbbbbbbb',
//   // },
//   {
//     key: 'key_logics',
//     text: keylogicGuideTitle,
//     desc: keylogicGuideDesc,
//     position: {
//       top: -10,
//       right: 10,
//       // left: 20,
//       // bottom: 20
//     },
//   },
//   {
//     key: 'questions',
//     text: questionGuideTitle,
//     desc: questionGuideDesc,
//     position: {
//       top: -10,
//       right: 10,
//       // left: 20,
//       // bottom: 20
//     },
//   },
// ];

export default guideData;
