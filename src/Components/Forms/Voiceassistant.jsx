import React, { useState } from 'react';

function Assistant() {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    open: false,
    link: '',
    image: '',
    file: '',
    category: ''
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch('https://server-01-v2cx.onrender.com/postassistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setStatus('success');
        setFormData({
          question: '',
          answer: '',
          open: false,
          link: '',
          image: '',
          file: '',
          category: ''
        });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className='w-full h-full overflow-scroll'>
     <div className="w-full max-w-[700px] p-3 mx-auto bg-gradient-to-br from-blue-950 via-zinc-900 to-zinc-800 rounded-xl shadow-2xl mt-0 border border-blue-900/40 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-700/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" />
      </div>
      <div className="relative z-10">
        <h2 className="text-3xl font-black mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 tracking-tight drop-shadow-lg">
          <i className="ri-robot-3-line mr-2 text-4xl align-middle font-light" />
          Assistant Data Entry
        </h2>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-zinc-200 tracking-wide" htmlFor="question">
                <i className="ri-question-line mr-1 text-blue-400" />
                Question<span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-blue-800 bg-zinc-900/80 text-zinc-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-zinc-400 shadow-inner"
                type="text"
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Type the question here"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-zinc-200 tracking-wide" htmlFor="category">
                <i className="ri-price-tag-3-line mr-1 text-cyan-400" />
                Category
              </label>
              <input
                className="w-full border border-blue-800 bg-zinc-900/80 text-zinc-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition placeholder:text-zinc-400 shadow-inner"
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. General, Help, etc."
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 font-semibold text-zinc-200 tracking-wide" htmlFor="answer">
              <i className="ri-chat-1-line mr-1 text-blue-400" />
              Answer<span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-blue-800 bg-zinc-900/80 text-zinc-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition min-h-[150px] max-h-[500px] resize-y placeholder:text-zinc-400 shadow-inner"
              id="answer"
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              required
              placeholder="Type the answer here"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-zinc-200 tracking-wide" htmlFor="link">
                <i className="ri-link mr-1 text-cyan-400" />
                Link
              </label>
              <input
                className="w-full border border-blue-800 bg-zinc-900/80 text-zinc-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition placeholder:text-zinc-400 shadow-inner"
                type="text"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://example.com"
                autoComplete="off"
              />
            </div>
            <div className="flex items-center space-x-3 mt-7 md:mt-0">
              <input
                className="accent-blue-600 w-5 h-5 rounded focus:ring-2 focus:ring-blue-400"
                type="checkbox"
                id="open"
                name="open"
                checked={formData.open}
                onChange={handleChange}
              />
              <label htmlFor="open" className="font-medium text-zinc-200 select-none">
                <i className="ri-external-link-line mr-1 text-blue-400" />
                Open Link in New Tab
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-zinc-200 tracking-wide" htmlFor="image">
                <i className="ri-image-line mr-1 text-cyan-400" />
                Image URL
              </label>
              <input
                className="w-full border border-blue-800 bg-zinc-900/80 text-zinc-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition placeholder:text-zinc-400 shadow-inner"
                type="text"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                autoComplete="off"
              />
              {formData.image && (
                <div className="mt-2 flex flex-col items-start gap-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="size-15 object-cover rounded-lg border border-blue-800 shadow"
                    onError={e => (e.target.style.display = 'none')}
                  />
                  <span className="text-xs text-zinc-400">Preview</span>
                </div>
              )}
            </div>
            <div>
              <label className="block mb-2 font-semibold text-zinc-200 tracking-wide" htmlFor="file">
                <i className="ri-attachment-2 mr-1 text-cyan-400" />
                File URL
              </label>
              <input
                className="w-full border border-blue-800 bg-zinc-900/80 text-zinc-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition placeholder:text-zinc-400 shadow-inner"
                type="text"
                id="file"
                name="file"
                value={formData.file}
                onChange={handleChange}
                placeholder="https://example.com/file.pdf"
                autoComplete="off"
              />
              {formData.file && (
                <div className="mt-2">
                  <a
                    href={formData.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 underline text-xs hover:text-cyan-200 transition"
                  >
                    <i className="ri-download-2-line" /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className={`w-full py-2 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg
              ${status === 'loading'
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600'
              }`}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <i className="ri-send-plane-2-fill text-xl" />
                Submit
              </>
            )}
          </button>
          {status === 'success' && (
            <div className="text-green-400 mt-4 text-center font-semibold animate-fade-in flex items-center justify-center gap-2">
              <i className="ri-checkbox-circle-fill text-2xl" />
              <span>Form submitted successfully!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="text-red-400 mt-4 text-center font-semibold animate-fade-in flex items-center justify-center gap-2">
              <i className="ri-close-circle-fill text-2xl" />
              <span>There was an error submitting the form.</span>
            </div>
          )}
        </form>
      </div>
    </div>
    </div>
  );
}

export default Assistant;