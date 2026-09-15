import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,HashRouter} from 'react-router-dom';
import {isPages} from './runtime';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import App from './App';
import './styles.css';
async function mount(){
 if(isPages)await (await import('./pagesStore')).initializePages();
 const Router=isPages?HashRouter:BrowserRouter;
 createRoot(document.getElementById('root')!).render(<React.StrictMode><Router><App/></Router></React.StrictMode>);
}
void mount().catch(()=>{createRoot(document.getElementById('root')!).render(<main><h1>Не удалось открыть хранилище</h1><p>Разрешите сайту хранить данные в браузере и обновите страницу.</p></main>);});
