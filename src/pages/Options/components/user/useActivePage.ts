import { useState } from 'react';

export type NavGroup = {
  title: string;
  action: string;
}[];

export const navigation: NavGroup = [
  { title: 'Collection', action: 'collection' },
  { title: 'Manages Sources', action: 'manages-sources' },
];

const useActivePage = () => {
  const [activePage, setActivePage] = useState(navigation[0].action);

  return { activePage, setActivePage };
};

export default useActivePage;
