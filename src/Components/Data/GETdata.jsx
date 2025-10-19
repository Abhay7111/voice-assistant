import { useState, useEffect } from "react";
import axios from "axios";

const GetData = () => {
  const Api = "https://server-01-v2cx.onrender.com/getassistant";
  const [Data, setData] = useState([]);
  const [Loading, setLoading] = useState(true);
  const [Error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(Api, {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        if (Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data);
        } else {
          setData([]);
        }
      } catch (err) {
        setData([]);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { Data, Loading, Error };
};

export { GetData };