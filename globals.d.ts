declare module '*.scss';
declare module '*.png';
declare module '*.svg' {
  const content: string;
  export default content;
}
interface Window {
  find: any;
}
