import React, { useState } from 'react';
import { useTheme } from '../Theam/Theam';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Markdown_tool() {
  const { isDark, toggleTheme } = useTheme();
  const [markdown, setMarkdown] = useState('');
  return (
    <div className='w-full h-full rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-4 '>
      <div className={`w-full h-full rounded-2xl`}>  
        <textarea 
        name="markdown_code" 
        id="markdown_code" 
        placeholder='## Write your markdown here'
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        className={`w-full h-full ${isDark? "text-zinc-100 bg-zinc-800/80 border-zinc-700 border" : "text-zinc-700 bg-zinc-50/70 border border-zinc-300"} p-2 ring-0 rounded-2xl resize-none outline-none placeholder:text-zinc-500/50`}></textarea>
      </div>
      <div className={`w-full h-full rounded-2xl overflow-auto ${isDark? "text-zinc-100 bg-zinc-800/80 border-zinc-700 border" : "text-zinc-700 bg-zinc-50/70 border border-zinc-300"}`}>
        <div className='markdown p-2'>
          <Markdown remarkPlugins={[remarkGfm]}>
            {markdown}
          </Markdown>
        </div>
      </div>
    </div>
  )
}

export default Markdown_tool
