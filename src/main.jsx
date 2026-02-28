import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './Pages/Home';
import Assistant from './Components/Forms/Voiceassistant';
import Testing from './Pages/Testing';
import VoiceAssistant from './Components/Voiceassistant';

const router = createBrowserRouter([
  { path: '/', children: [
    // { path: '', element: <Home /> },
    { path: '', element: <VoiceAssistant /> },
    { path: '/train', element: <Assistant /> },
    {path:'/testing', element:<Testing/>}
  ] },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);