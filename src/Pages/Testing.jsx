import React, { useEffect, useState } from 'react';

function Testing() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('https://server-01-v2cx.onrender.com/getassistant');
        if (!res.ok) throw new Error('Failed to fetch');
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err.message || 'An error occurred');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-zinc-100">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="text-zinc-100">
      <h2>Assistant Data - Testing</h2>
      <ul>
        {data.length === 0 && <li>No data found.</li>}
        {data.map((item, idx) => (
          <li key={item.id ?? idx}>
            {item.question ?? JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Testing