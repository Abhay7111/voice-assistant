import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// Use react-markdown for rendering user-entered markdown
function MarkdownView({ markdown }) {
  // Optional: strip script tags if you expect malicious input (react-markdown escapes by default)
  function sanitize(text) {
    return text.replace(/<script.*?>.*?<\/script>/gi, '');
  }
  return (
    <div className=" markdown prose prose-invert max-w-full py-2 px-2 bg-zinc-900 rounded-xl border border-zinc-700 shadow-md text-base leading-relaxed">
      <ReactMarkdown >{sanitize(markdown)}</ReactMarkdown>
    </div>
  );
}

function Assistant() {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    open: false,
    link: '',
    image: '',
    file: '', 
    category: 'general',
    tag: []
  });
  const [status, setStatus] = useState(null);
  const [categories, setCategories] = useState(['General']);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const skipCategoryReload = useRef(false);

  // Markdown preview popup state
  const [showMarkdown, setShowMarkdown] = useState(false);

  useEffect(() => {
    if (skipCategoryReload.current) {
      skipCategoryReload.current = false;
      return;
    }
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch('https://server-01-v2cx.onrender.com/getassistant');
        if (res.ok) {
          const data = await res.json();
          let cats = Array.from(
            new Set(
              (Array.isArray(data) ? data : [])
                .map(item => (item.category && typeof item.category === 'string' && item.category.trim() ? item.category.trim() : null))
                .filter(Boolean)
            )
          );
          if (cats.length === 0) cats = ['General'];
          setCategories(cats);
          setFormData(prev => ({
            ...prev,
            category: cats.includes(prev.category) ? prev.category : cats[0]
          }));
        } else {
          setCategories(['General']);
          setFormData(prev => ({ ...prev, category: 'General' }));
        }
      } catch (err) {
        setCategories(['General']);
        setFormData(prev => ({ ...prev, category: 'General' }));
      }
      setLoadingCategories(false);
    };
    fetchCategories();
  }, []);

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
    let submitData = { ...formData };

    try {
      const response = await fetch('https://server-01-v2cx.onrender.com/postassistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
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
          category: categories[0] || 'General',
          tag: []
        });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleSelectCategory = (e) => {
    if (e.target.value === '__add_new__') {
      setTimeout(() => {
        const input = document.getElementById('new-category-input');
        if (input) input.focus();
      }, 100);
      setNewCategory('');
      setFormData(prev => ({
        ...prev,
        category: '__add_new__'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category: e.target.value
      }));
    }
  };

  const handleNewCategoryInput = (e) => {
    setNewCategory(e.target.value);
  };

  const handleNewCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewCategory();
    }
    if (e.key === 'Escape') {
      setFormData(prev => ({
        ...prev,
        category: categories[0] || 'General'
      }));
      setNewCategory('');
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const normalized = t.toLowerCase();
    if (formData.tag.some(existing => existing.toLowerCase() === normalized)) return;
    setFormData(prev => ({ ...prev, tag: [...prev.tag, t] }));
    setTagInput('');
  };

  const removeTag = (index) => {
    setFormData(prev => ({ ...prev, tag: prev.tag.filter((_, i) => i !== index) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategory.trim();
    if (
      trimmed &&
      !categories.some(cat => cat.toLowerCase() === trimmed.toLowerCase())
    ) {
      setCategories(prev => [...prev, trimmed]);
      setFormData(prev => ({
        ...prev,
        category: trimmed
      }));
      setNewCategory('');
      skipCategoryReload.current = true;
      setTimeout(() => {
        const select = document.getElementById('category');
        if (select) select.focus();
      }, 100);
    }
  };

  // B&W Styling
  const bwInput =
    'w-full border border-zinc-700 bg-zinc-900 text-neutral-100 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500 transition placeholder:text-neutral-400 shadow-inner';

  const bwInputSm =
    'w-full border border-zinc-500 bg-zinc-900 text-neutral-100 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 placeholder:text-neutral-400 shadow-inner';

  const bwBtn =
    'px-3 py-1.5 rounded-lg bg-neutral-800 text-white font-bold hover:bg-neutral-600 transition';

  const bwBtnCancel =
    'px-2 py-1 rounded-lg bg-zinc-700/80 text-zinc-200 hover:bg-zinc-600 transition';

  const bwBtnAdd =
    'ml-1 px-2 py-1 rounded-lg bg-zinc-600 text-neutral-100 text-xs font-semibold hover:bg-zinc-700 transition flex items-center gap-1';

  const bwFormBg =
    'w-full max-w-[700px] p-3 mx-auto bg-zinc-900 rounded-xl shadow-2xl mt-0 border border-zinc-800/60 relative overflow-hidden';

  const bwTitle =
    'text-3xl font-black mb-8 text-center text-zinc-100 tracking-tight drop-shadow-lg';

  // Center the form absolutely in viewport using flex
  return (
    <div className="w-full h-full min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className={bwFormBg + " flex flex-col items-center justify-center"}>
        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
          <h2 className={bwTitle}>
            <i className="ri-robot-3-line mr-2 text-4xl align-middle font-light text-neutral-400" />
            Assistant Data Entry
          </h2>
          <form onSubmit={handleSubmit} className="space-y-7 w-full max-w-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-neutral-200 tracking-wide" htmlFor="question">
                  <i className="ri-question-line mr-1 text-neutral-400" />
                  Question<span className="text-red-500">*</span>
                </label>
                <input
                  className={bwInput + " lowercase"}
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
                <label className="block mb-2 font-semibold text-neutral-200 tracking-wide" htmlFor="category">
                  <i className="ri-price-tag-3-line mr-1 text-neutral-400" />
                  Category
                </label>
                {loadingCategories ? (
                  <div className="text-neutral-400 text-sm py-2">Loading categories...</div>
                ) : (
                  <div>
                    <div className="flex gap-2 items-center">
                      {formData.category !== '__add_new__' ? (
                        <select
                          className={bwInput}
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleSelectCategory}
                          required
                        >
                          {categories.map((cat, idx) => (
                            <option key={cat + idx} value={cat}>{cat}</option>
                          ))}
                          <option value="__add_new__">+ Add new category</option>
                        </select>
                      ) : (
                        <input
                          id="new-category-input"
                          type="text"
                          className={bwInputSm}
                          placeholder="Enter new category"
                          value={newCategory}
                          onChange={handleNewCategoryInput}
                          onKeyDown={handleNewCategoryKeyDown}
                          maxLength={32}
                          autoFocus
                        />
                      )}
                      {formData.category === '__add_new__' ? (
                        <>
                          <button
                            type="button"
                            className={bwBtn}
                            onClick={handleAddNewCategory}
                            disabled={!newCategory.trim()}
                          >
                            <i className="ri-check-line" />
                          </button>
                          <button
                            type="button"
                            className={bwBtnCancel}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                category: categories[0] || 'General'
                              }));
                              setNewCategory('');
                            }}
                            aria-label="Cancel new category"
                          >
                            <i className="ri-close-line" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={bwBtnAdd}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              category: '__add_new__'
                            }));
                            setNewCategory('');
                            setTimeout(() => {
                              const input = document.getElementById('new-category-input');
                              if (input) input.focus();
                            }, 100);
                          }}
                          aria-label="Add new category"
                          tabIndex={-1}
                        >
                          <i className="ri-add-line text-lg" />
                          New
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-neutral-200 tracking-wide" htmlFor="tag-input">
                <i className="ri-hashtag mr-1 text-neutral-400" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  className={bwInputSm + " flex-1 min-w-[140px]"}
                  type="text"
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag (Enter to add)"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className={bwBtnAdd}
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  aria-label="Add tag"
                >
                  <i className="ri-add-line" /> Add
                </button>
              </div>
              {formData.tag.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-2 list-none">
                  {formData.tag.map((t, index) => (
                    <li
                      key={`${t}-${index}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-700 text-neutral-200 text-sm border border-zinc-600"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-neutral-400 hover:text-white transition p-0.5 rounded"
                        aria-label={`Remove tag ${t}`}
                      >
                        <i className="ri-close-line text-base" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative">
              <label className="block mb-2 font-semibold text-neutral-200 tracking-wide" htmlFor="answer">
                <i className="ri-chat-1-line mr-1 text-neutral-400" />
                Answer<span className="text-red-500">*</span>
              </label>
              <textarea
                className={bwInput + " min-h-[150px] max-h-[500px] resize-y"}
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleChange}
                required
                placeholder="Type the answer here"
              />
              {/* Button to show markdown preview */}
              <button
                type="button"
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-zinc-700 text-white rounded hover:bg-zinc-600 transition z-20 flex items-center gap-1 shadow"
                style={{ marginTop: -8, marginRight: -5 }}
                onClick={() => setShowMarkdown(true)}
                tabIndex={0}
                aria-label="View Markdown Preview"
              >
                <i className="ri-eye-line text-sm" />
                Markdown View
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-neutral-200 tracking-wide" htmlFor="link">
                  <i className="ri-link mr-1 text-neutral-400" />
                  Link
                </label>
                <input
                  className={bwInput}
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  autoComplete="off"
                />
              </div>
              {formData.link && formData.link.trim() !== '' ? (
                <div className="flex items-center space-x-3 mt-7 md:mt-0">
                  <input
                    className="accent-black w-5 h-5 rounded focus:ring-2 focus:ring-neutral-500"
                    type="checkbox"
                    id="open"
                    name="open"
                    checked={formData.open}
                    onChange={handleChange}
                  />
                  <label htmlFor="open" className="font-medium text-neutral-200 select-none">
                    <i className="ri-external-link-line mr-1 text-neutral-400" />
                    Open Link in New Tab
                  </label>
                </div>
              ) : (
                <div />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-neutral-200 tracking-wide" htmlFor="image">
                  <i className="ri-image-line mr-1 text-neutral-400" />
                  Image URL
                </label>
                <input
                  className={bwInput}
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
                      className="size-15 object-cover rounded-lg border border-zinc-600 shadow"
                      onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      style={{ filter: 'grayscale(100%)' }}
                    />
                    <span className="text-xs text-neutral-400">Preview</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block mb-2 font-semibold text-neutral-200 tracking-wide" htmlFor="file">
                  <i className="ri-attachment-2 mr-1 text-neutral-400" />
                  File URL
                </label>
                <input
                  className={bwInput}
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
                      className="inline-flex items-center gap-1 text-neutral-200 underline text-xs hover:text-neutral-400 transition"
                    >
                      <i className="ri-download-2-line" /> Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              className={
                "w-full py-2 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg " +
                (status === 'loading'
                  ? 'bg-zinc-500/70 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-zinc-800 to-zinc-700 text-white hover:from-zinc-900 hover:to-zinc-800'
                )
              }
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Learning...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-2-fill text-xl text-neutral-100" />
                  Teach
                </>
              )}
            </button>
            {status === 'success' && (
              <div className="text-green-400 mt-4 text-center font-semibold animate-fade-in flex items-center justify-center gap-2">
                <i className="ri-checkbox-circle-fill text-2xl" />
                <span>Learned successfully!</span>
              </div>
            )}
            {status === 'error' && (
              <div className="text-red-400 mt-4 text-center font-semibold animate-fade-in flex items-center justify-center gap-2">
                <i className="ri-close-circle-fill text-2xl" />
                <span>There was an error. sorry I can't learne...</span>
              </div>
            )}
          </form>
        </div>
        {/* Markdown Popup */}
        {showMarkdown && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setShowMarkdown(false)}
          >
            <div
              className="bg-zinc-900 rounded-xl shadow-2xl p-6 border border-zinc-700 max-w-lg w-full relative"
              style={{ minWidth: 340, minHeight: 120, maxHeight: '70vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-zinc-400 hover:text-white text-lg px-3 py-1"
                onClick={() => setShowMarkdown(false)}
                aria-label="Close Markdown Preview"
                tabIndex={1}
              >
                <i className="ri-close-line" />
              </button>
              <div className="text-neutral-200 mb-4 font-semibold text-center text-lg flex items-center justify-center gap-2">
                <i className="ri-eye-line" />
                Markdown Preview
              </div>
              <MarkdownView markdown={formData.answer} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Assistant;