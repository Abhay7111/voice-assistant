import React, { StrictMode } from 'react'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import Home from './Pages/Home';
import Assistant from './Components/Forms/Voiceassistant';

const routers = createBrowserRouter([
{  path: '/',  element: <Home/>},
{  path: '/train',  element: <Assistant/>},
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={routers} />
  </React.StrictMode>,
)
