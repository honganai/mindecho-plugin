import React from 'react';
import { createRoot } from 'react-dom/client';

import Page from './Content';
import './index.css';

const container = document.getElementById('pointread-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<Page />);
