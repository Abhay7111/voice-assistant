import React from 'react';
import '../Components/Css/tag.css/Tag.css.css';
import { useTheme } from '../Components/Theam/Theam';
import '../Components/Css/grain.css/grain.css'

function Tags() {
    const {isDark, toggleTheme} = useTheme();
  return (
    <div className={`main ${isDark? 'bg-[#111111]' : 'bg-[#fefae0]'}`}>
        <div className='grain'></div>
        <div className='header'>
            <div className='logo'>Tag</div>
            <button onClick={() => toggleTheme(false)}>Theme</button>
        </div>
        <div className='options'>
          <div>Most used</div>
          <div>UI/UX</div>
        </div>
    </div>
  )
}

export default Tags
