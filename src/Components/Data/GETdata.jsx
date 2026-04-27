import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://server-01-v2cx.onrender.com/getassistant";

export const GetData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        
        // Ensure data is always an array
        setData(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err.message || "Something went wrong");
          setData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort(); // Cleanup on unmount
  }, []);

  return { data, loading, error };
};