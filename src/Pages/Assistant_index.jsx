import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Assistant_index() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:2000/assistant/68a45be5d85ea7cdcaa29d77');
        // Accept both array and object responses
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else if (response.data && typeof response.data === 'object') {
          setData([response.data]);
        } else {
          setData([]);
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "An error occurred"
        );
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
//   if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className='text-zinc-100'>
      <h2>Assistant Data</h2>
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

export default Assistant_index;