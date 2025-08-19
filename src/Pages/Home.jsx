import React from 'react'
import VoiceAssistant from '../Components/Voiceassistant'
import { ThemeToggle } from '../Components/Theam/Theam'

function Home() {
  return (
    <div className='w-full h-[100dvh] flex items-center justify-center'>
      <ThemeToggle />
      <div className='w-full max-w-[700px] h-full'>
        <VoiceAssistant/>
      </div>
    </div>
  )
}

export default Home