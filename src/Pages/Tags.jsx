import React, { useEffect, useState } from 'react';
import '../Components/Css/tag.css/Tag.css.css';
import '../Components/Css/grain.css/grain.css';
import { useTheme } from '../Components/Theam/Theam';
import Markdown from 'react-markdown';

function Tags() {
  const url = "https://server-01-v2cx.onrender.com/getassistant";
  
  const [data, setData] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // Helper to highlight matching text in tags
  const highlightMatch = (text, query, isSelected) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className={isSelected ? "underline decoration-2" : "text-blue-500 font-bold"}>{part}</span> 
        : part
    );
  };

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [showImages, setShowImages] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  // Fetch data
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(json => setData(Array.isArray(json) ? json : []))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  // Filter data by selected category first to get relevant tags
  const categoryFilteredData = selectedCategory === 'all'
    ? data
    : data.filter(item => item.category === selectedCategory);

  // Extract and filter tags
  const allAvailableTags = Array.from(new Set(categoryFilteredData.flatMap(item => {
    if (!item.tag) return [];
    return Array.isArray(item.tag) ? item.tag.filter(Boolean) : [String(item.tag)];
  }).filter(tag => tag && tag.trim() !== '')));

  const searchedTags = allAvailableTags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const tags = tagSearch 
    ? searchedTags.slice(0, 10) 
    : (selectedCategory === 'all' ? searchedTags.slice(0, 12) : searchedTags);

  const categories = Array.from(new Set(data.map(item => item.category).filter(Boolean)));

  // Related tags when a tag is selected
  const relatedTags = selectedTag 
    ? Array.from(new Set(categoryFilteredData
        .filter(item => (Array.isArray(item.tag) ? item.tag.includes(selectedTag) : item.tag === selectedTag))
        .flatMap(item => Array.isArray(item.tag) ? item.tag : [item.tag])
        .filter(t => t !== selectedTag && t)
      )).slice(0, 6)
    : [];

  // Filter items based on selected tag and category
  const filteredItems = data.filter(item => {
    const matchesTag = !selectedTag || (
      Array.isArray(item.tag) 
        ? item.tag.includes(selectedTag) 
        : item.tag === selectedTag
    );
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesTag && matchesCategory;
  });

  // Function to process image URL (converts gif to png)
  const getProcessedImageUrl = (img) => {
    if (!img) return "";
    const src = Array.isArray(img) ? img[0] : img;
    return typeof src === 'string' 
      ? src.replace(/\.gif$/i, '.png') 
      : src;
  };

  return (
    <div className={`main min-h-screen relative flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className='grain'></div>
      
      <div className='header flex items-center justify-between p-6 backdrop-blur-md sticky z-[999999] top-0 border-b border-white/5'>
        <div className='logo text-xl font-bold tracking-tighter'>Tags<span className='text-blue-500'>Explorer</span></div>
        <div className='flex gap-2'>
            <button 
                onClick={() => setShowImages(!showImages)}
                className={`px-4 py-2 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-zinc-100'} ${showImages ? 'text-blue-500 border-blue-500/30' : 'text-zinc-500'}`}
                title={showImages ? "Hide Images" : "Show Images"}
            >
                {showImages ? <i className="ri-image-fill"></i> : <i className="ri-image-line"></i>}
            </button>
            <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className={`px-4 py-2 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-zinc-100'}`}
            >
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory} <i className="ri-arrow-down-s-line ml-1"></i>
            </button>
            <button onClick={toggleTheme} className={`size-10 p-2 flex items-center justify-center rounded-full border transition-all ${isDark ? 'border-zinc-800 bg-zinc-900 hover:text-yellow-400' : 'border-zinc-200 bg-white hover:text-blue-600'}`}>
                {isDark ? <i className="ri-sun-line"></i> : <i className="ri-moon-line"></i>}
            </button>
        </div>
      </div>

      {/* Tag Navigation */}
      <div className='p-6 z-10'>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className='relative w-full md:w-64'>
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
            <input 
              type="text" 
              placeholder="Search tags..." 
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'}`}
            />
          </div>
          
          {selectedTag && relatedTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 whitespace-nowrap">Related:</span>
              {relatedTags.map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border ${isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}
                >
                  #{highlightMatch(tag, tagSearch, false)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='options flex items-center gap-2 overflow-x-auto no-scrollbar'>
          <button 
            onClick={() => setSelectedTag(null)} 
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${!selectedTag ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}
          >
            All Tags
          </button>
          {tags.map(tag => (
            <button 
              key={tag} 
              onClick={() => setSelectedTag(tag)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${selectedTag === tag ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
            >
              {highlightMatch(tag, tagSearch, selectedTag === tag)}
            </button>
          ))}
          {tagSearch ? (
            searchedTags.length > 10 && <span className="text-xs text-zinc-500 px-2 italic">+{searchedTags.length - 10} more...</span>
          ) : (
            selectedCategory === 'all' && searchedTags.length > 12 && <span className="text-xs text-zinc-500 px-2 italic">+{searchedTags.length - 12} more...</span>
          )}
        </div>
      </div>

      {/* Results Display */}
      <div className='results grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 z-10'>
        {filteredItems.map((item, index) => (
          <div 
            key={index} 
            onClick={() => setSelectedItem(item)}
            className={`card group cursor-pointer flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 hover:translate-y-[-4px] ${isDark ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/50' : 'bg-white border-zinc-200 hover:shadow-xl hover:shadow-zinc-200/50'}`}
          >
            <div className='flex justify-between items-start'>
                <span className='px-2 py-1 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-500'>{item.category || 'General'}</span>
            </div>
            {item.image && (selectedCategory !== 'all' || showImages) && (
                <div className="overflow-hidden rounded-xl h-48 mb-2">
                  {<img 
                    src={getProcessedImageUrl(item.image)} 
                    alt={item.question} 
                    className='w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110' 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(getProcessedImageUrl(item.image));
                    }}
                  />}
                </div>
            )}
            <h3 className='font-bold text-lg leading-tight line-clamp-2 group-hover:text-blue-500 transition-colors'>{item.question || item.name}</h3>
            <div className='flex flex-wrap gap-1.5'>
              {(Array.isArray(item.tag) ? item.tag : [item.tag]).filter(Boolean).slice(0, 4).map((tag, j) => (
                <span key={j} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                  #{tag}
                </span>
              ))}
            </div>
            <div className={`text-sm line-clamp-4 overflow-hidden mb-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <Markdown>{item.answer}</Markdown>
            </div>
          </div>
        ))}
      </div>

      {/* Category Selection Popup */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/30" onClick={() => setIsCategoryModalOpen(false)}>
            <div className={`p-2 rounded-3xl shadow-2xl border w-full max-w-xs overflow-hidden ${isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={e => e.stopPropagation()}>
                <div className='font-bold p-4 text-center border-b border-zinc-800/50 mb-2'>Select Category</div>
                <div className='flex flex-col p-2 max-h-80 overflow-y-auto'>
                    <button onClick={() => { setSelectedCategory('all'); setIsCategoryModalOpen(false); }} className={`text-left px-4 py-3 rounded-2xl text-sm font-medium mb-1 transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}>All Categories</button>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => { setSelectedCategory(cat); setIsCategoryModalOpen(false); }} className={`text-left px-4 py-3 rounded-2xl text-sm font-medium mb-1 transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}>{cat}</button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Detail Popup Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md bg-black/50" onClick={() => setSelectedItem(null)}>
          <div 
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedItem(null)}
              className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}
            >
              <i className="ri-close-line text-xl"></i>
            </button>

            {selectedItem.image && (
              <div className="w-full h-64 md:h-80 overflow-hidden">
                <img 
                  src={getProcessedImageUrl(selectedItem.image)} 
                  alt={selectedItem.question} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/10 text-blue-500">
                  {selectedItem.category || 'General'}
                </span>
                {(Array.isArray(selectedItem.tag) ? selectedItem.tag : [selectedItem.tag]).filter(Boolean).map(tag => (
                  <span key={tag} className={`px-3 py-1 rounded-full text-xs font-medium border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                    #{tag}
                  </span>
                ))}
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-6 leading-tight">
                {selectedItem.question || selectedItem.name}
              </h2>

              <div className={`prose max-w-none mb-8 leading-relaxed ${isDark ? 'prose-invert text-zinc-300' : 'text-zinc-700'}`}>
                <Markdown>{selectedItem.answer}</Markdown>
              </div>

              {selectedItem.link && (
                <a 
                  href={selectedItem.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/30"
                >
                  View Resource <i className="ri-external-link-line"></i>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
            <button className='absolute top-6 right-6 text-white text-4xl'><i className="ri-close-line"></i></button>
            <img src={previewImage} alt="Full view" className='max-w-full max-h-full object-contain rounded-lg' />
        </div>
      )}
    </div>
  );
}

export default Tags;