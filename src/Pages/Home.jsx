import React from 'react';
import { GetData } from '../Components/Data/GETdata';

function Home() {
  const { Data, Loading, Error } = GetData();

  return (
    <div className='w-full h-[100dvh] flex items-center justify-center'>
      {Loading ? (
        <div className='text-zinc-100'>Loading...</div>
      ) : Error ? (
        <div className='text-red-500'>Error loading data</div>
      ) : (!Data || Data.length === 0) ? (
        <div className='text-zinc-100'>data not found</div>
      ) : (
        <div className='text-zinc-100'>Data loaded {Data.length}</div>
      )}
    </div>
  );
}

export default Home;