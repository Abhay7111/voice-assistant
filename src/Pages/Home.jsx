import React from 'react'
import VoiceAssistant from '../Components/Voiceassistant'

function Home() {
  return (
    <div className='w-full h-[100dvh] flex items-center justify-center'>
      <div className='w-full max-w-[700px] h-full'>
        <VoiceAssistant/>
      </div>
    </div>
  )
}

export default Home