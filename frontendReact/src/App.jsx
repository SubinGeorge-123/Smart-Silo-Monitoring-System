/* eslint-disable react-hooks/static-components */
import { useEffect, useState, useRef, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

function App() {
  const [data, setData] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(
        "wss://q7662enf50.execute-api.us-east-1.amazonaws.com/production/"
      );

      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          setData((prev) => {
            let updated;

            // 🔥 If Lambda sends full array
            if (Array.isArray(message)) {
              updated = message;
            } 
            // 🔥 If Lambda sends single item
            else {
              updated = [...prev, message];
            }

            // Sort by timestamp to ensure latest is at the end
            const sorted = [...updated].sort((a, b) => {
              const timeA = Number(a.timestamp) || 0;
              const timeB = Number(b.timestamp) || 0;
              return timeA - timeB;
            });

            // keep last 30 points
            return sorted.slice(-30);
          });

        } catch (err) {
          console.error("Parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("❌ WebSocket disconnected. Reconnecting...");
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // 🔥 FIX: Get the latest item based on timestamp, not array position
  const latest = useMemo(() => {
    if (data.length === 0) return {};
    
    // Find the item with the maximum timestamp
    return data.reduce((max, item) => {
      const currentTime = Number(item.timestamp) || 0;
      const maxTime = Number(max.timestamp) || 0;
      return currentTime > maxTime ? item : max;
    }, data[0]);
  }, [data]);

  // Also keep the last item in array for backward compatibility
  const lastInArray = data[data.length - 1] || {};

  // Debug: Compare both methods
  useEffect(() => {
    console.log("📊 Last in array:", lastInArray);
    console.log("📊 Latest by timestamp:", latest);
    if (lastInArray.timestamp !== latest.timestamp) {
      console.warn("⚠️ Mismatch! Array not sorted by timestamp");
    }
  }, [latest, lastInArray]);

  // 🔥 Threshold logic
  const isTempAlert = latest.temperature > 30;
  const isHumAlert = latest.humidity > 60;
  const isCO2Alert = latest.co2 > 1000;
  const isVibAlert = latest.vibration > 0.5;
  const isGrainAlert = latest.grain_level < 70;

  const Card = ({ title, value, alert, timestamp }) => (
    <div style={{
      flex: "1 1 180px",
      padding: "15px",
      margin: "10px",
      borderRadius: "12px",
      background: alert ? "#ff4d4f" : "#f5f5f5",
      color: "#000000", // Black text
      textAlign: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      transition: "0.3s"
    }}>
      <h4 style={{ color: "#000000", margin: "0 0 10px 0" }}>{title}</h4>
      <h2 style={{ color: "#000000", margin: "0 0 5px 0" }}>
        {value !== undefined ? (typeof value === 'number' ? value.toFixed(2) : value) : "--"}
      </h2>
      {alert && <small style={{ display: 'block', marginTop: '5px', color: "#000000" }}>⚠️ Alert!</small>}
      {timestamp && (
        <small style={{ 
          display: 'block', 
          marginTop: '5px', 
          fontSize: '10px',
          opacity: 0.7,
          color: "#000000"
        }}>
          {new Date(Number(timestamp)).toLocaleTimeString()}
        </small>
      )}
    </div>
  );

  const ChartBlock = ({ dataKey, title }) => (
    <div style={{ 
      width: "calc(33.333% - 20px)", 
      minWidth: "370px",
      height: 250, 
      margin: "10px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      padding: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ color: "#000000", margin: "0 0 10px 0" }}>{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={(t) =>
              new Date(Number(t)).toLocaleTimeString()
            }
            stroke="#000000"
            tick={{ fill: '#000000' }}
          />
          <YAxis 
            stroke="#000000"
            tick={{ fill: '#000000' }}
          />
          <Tooltip
            labelFormatter={(t) =>
              new Date(Number(t)).toLocaleString()
            }
            contentStyle={{ color: '#000000' }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#1890ff"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Chart configurations for the grid
  const charts = [
    { dataKey: "temperature", title: "Temperature Trend" },
    { dataKey: "humidity", title: "Humidity Trend" },
    { dataKey: "co2", title: "CO2 Trend" },
    { dataKey: "vibration", title: "Vibration Trend" },
    { dataKey: "grain_level", title: "Grain Level Trend" }
  ];

  return (
    <div style={{
      padding: "20px",
      background: "#ffffff",
      minHeight: "100vh",
      fontFamily: "Arial",
      color: "#000000"
    }}>
      <h1 style={{ color: "#000000" }}>🌾 Silo Monitoring Dashboard</h1>
      
      {/* Debug info - remove in production */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '5px',
        fontSize: '12px',
        color: '#000000'
      }}>
        <strong style={{ color: '#000000' }}>Debug:</strong> Data points: {data.length} | 
        Latest timestamp: {latest.timestamp ? new Date(Number(latest.timestamp)).toLocaleString() : '--'}
      </div>

      {/* 🔥 Status Cards */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: "30px"
      }}>
        <Card 
          title="Temperature (°C)" 
          value={latest.temperature} 
          alert={isTempAlert}
          timestamp={latest.timestamp}
        />
        <Card 
          title="Humidity (%)" 
          value={latest.humidity} 
          alert={isHumAlert}
          timestamp={latest.timestamp}
        />
        <Card 
          title="CO2 (ppm)" 
          value={latest.co2} 
          alert={isCO2Alert}
          timestamp={latest.timestamp}
        />
        <Card 
          title="Vibration (g)" 
          value={latest.vibration} 
          alert={isVibAlert}
          timestamp={latest.timestamp}
        />
        <Card 
          title="Grain Level (%)" 
          value={latest.grain_level} 
          alert={isGrainAlert}
          timestamp={latest.timestamp}
        />
      </div>

      {/* 📊 Charts Grid - 3 in first row, 2 in second row */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap",
        justifyContent: "flex-start",
        marginTop: "20px",
        width: "max-content"
      }}>
        {charts.map((chart, index) => (
          <ChartBlock 
            key={chart.dataKey}
            dataKey={chart.dataKey} 
            title={chart.title} 
          />
        ))}
      </div>
    </div>
  );
}

export default App;