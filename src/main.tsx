/**
 * @fileoverview React 19 application entry point
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Application entry point
 * Uses React 19 createRoot API for concurrent features
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has a div with id="root"');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
