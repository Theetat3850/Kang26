
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Thermometer,
  Gauge,
  Mountain,
  Wifi,
  RefreshCw,
  Clock,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { apiRequest } from '../api';

// Format date from MariaDB / API
function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

// SVG Line Chart - no external chart library required
function SensorChart({ title, data, dataKey, color, unit, decimals = 2 }) {
  const width = 700;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 55 };

  const values = data
    .map((item) => Number(item[dataKey]))
    .filter(Number.isFinite);

  if (values.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
          ยังไม่มีข้อมูลเพียงพอสำหรับแสดงกราฟ
        </div>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = values.map((value, index) => {
    const x = padding.left + (index / (values.length - 1)) * chartWidth;
    const y = padding.top + ((max - value) / range) * chartHeight;
    return { x, y, value };
  });

  const line = points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    )
    .join(' ');

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="text-xs text-slate-400">
          {values.length} readings
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={title}
        >
          {[0, 1, 2, 3].map((index) => {
            const y = padding.top + (index / 3) * chartHeight;
            const value = max - (index / 3) * range;

            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94a3b8"
                >
                  {value.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill={color}
            />
          ))}

          <text
            x={padding.left}
            y={height - 10}
            fontSize="11"
            fill="#94a3b8"
          >
            เก่าสุด
          </text>

          <text
            x={width - padding.right}
            y={height - 10}
            textAnchor="end"
            fontSize="11"
            fill="#94a3b8"
          >
            ล่าสุด
          </text>
        </svg>
      </div>

      <p className="text-xs text-slate-400 mt-2 text-right">
        หน่วย: {unit}
      </p>
    </div>
  );
}

function SensorCard({ title, value, unit, icon: Icon, color, description }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-bold text-slate-800">
              {value}
            </span>
            <span className="text-sm text-slate-500">{unit}</span>
          </div>
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">{description}</p>
    </div>
  );
}

export default function IoTDashboard() {
  const [devices, setDevices] = useState([]);
  const [latest, setLatest] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async () => {
    try {
      const [deviceData, latestData] = await Promise.all([
        apiRequest('/iot/devices'),
        apiRequest('/iot/latest'),
      ]);

      setDevices(deviceData);
      setLatest(latestData);

      setSelectedDevice((current) => {
        if (current && deviceData.some((d) => d.device_id === current)) {
          return current;
        }
        return deviceData[0]?.device_id || '';
      });

      setError('');
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูล IoT ได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(async (deviceId) => {
    if (!deviceId) {
      setHistory([]);
      return;
    }

    try {
      const result = await apiRequest(
        `/iot/history?device_id=${encodeURIComponent(deviceId)}&limit=100`
      );

      // API returns newest first; reverse for chronological chart
      setHistory([...result].reverse());
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดประวัติ Sensor ได้');
    }
  }, []);

  // Refresh device status and latest readings every 5 seconds
  useEffect(() => {
    fetchOverview();

    const timer = setInterval(fetchOverview, 5000);
    return () => clearInterval(timer);
  }, [fetchOverview]);

  // Load history when device changes, then refresh every 30 seconds
  useEffect(() => {
    if (!selectedDevice) return;

    fetchHistory(selectedDevice);

    const timer = setInterval(() => {
      fetchHistory(selectedDevice);
    }, 30000);

    return () => clearInterval(timer);
  }, [selectedDevice, fetchHistory]);

  const selectedReading = useMemo(
    () => latest.find((item) => item.device_id === selectedDevice),
    [latest, selectedDevice]
  );

  const selectedDeviceInfo = useMemo(
    () => devices.find((item) => item.device_id === selectedDevice),
    [devices, selectedDevice]
  );

  const online = selectedDeviceInfo?.status === 'online';

  const sortedHistory = useMemo(
    () => [...history].reverse(),
    [history]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverview();

    if (selectedDevice) {
      fetchHistory(selectedDevice);
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        กำลังโหลดข้อมูล IoT...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-semibold">INTERNET OF THINGS</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            IoT Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Monitoring ระบบตรวจวัดสภาพแวดล้อมจาก ESP32 และ BMP280
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Device Selection and Status */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Cpu className="w-7 h-7 text-purple-300" />
            </div>

            <div>
              <p className="text-sm text-slate-400">Sensor Device</p>
              <h2 className="text-lg font-semibold">
                {selectedDeviceInfo?.device_name || 'ไม่พบอุปกรณ์'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedDevice || 'No device selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              {devices.length === 0 && (
                <option value="">ไม่พบอุปกรณ์</option>
              )}

              {devices.map((device) => (
                <option key={device.device_id} value={device.device_id}>
                  {device.device_name}
                </option>
              ))}
            </select>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
              online
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                online ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              {online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-5 pt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-400">
          <span>
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            Last seen: {formatDate(selectedDeviceInfo?.last_seen)}
          </span>
          <span>Sensor: {selectedDeviceInfo?.sensor_type || '-'}</span>
          <span>Auto refresh: 5 seconds</span>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SensorCard
          title="Temperature"
          value={selectedReading?.temperature ?? '--'}
          unit="°C"
          icon={Thermometer}
          color="bg-orange-100 text-orange-600"
          description="อุณหภูมิปัจจุบัน"
        />

        <SensorCard
          title="Atmospheric Pressure"
          value={selectedReading?.pressure ?? '--'}
          unit="hPa"
          icon={Gauge}
          color="bg-blue-100 text-blue-600"
          description="ความดันบรรยากาศ"
        />

        <SensorCard
          title="Altitude"
          value={selectedReading?.altitude ?? '--'}
          unit="m"
          icon={Mountain}
          color="bg-purple-100 text-purple-600"
          description="ความสูงโดยประมาณ"
        />

        <SensorCard
          title="Wi-Fi Signal"
          value={selectedReading?.wifi_rssi ?? '--'}
          unit="dBm"
          icon={Wifi}
          color="bg-green-100 text-green-600"
          description="ความแรงสัญญาณ Wi-Fi"
        />
      </div>

      {/* Charts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Sensor History
          </h2>
          <span className="text-xs text-slate-400">
            แสดงข้อมูลล่าสุดไม่เกิน 100 รายการ
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SensorChart
            title="Temperature History"
            data={sortedHistory}
            dataKey="temperature"
            color="#f97316"
            unit="°C"
          />

          <SensorChart
            title="Pressure History"
            data={sortedHistory}
            dataKey="pressure"
            color="#3b82f6"
            unit="hPa"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">
              Sensor Readings
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ประวัติข้อมูลจากอุปกรณ์
            </p>
          </div>

          <span className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full">
            {history.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">เวลา</th>
                <th className="px-5 py-3 font-medium">Temperature</th>
                <th className="px-5 py-3 font-medium">Pressure</th>
                <th className="px-5 py-3 font-medium">Altitude</th>
                <th className="px-5 py-3 font-medium">Wi-Fi RSSI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-400">
                    ยังไม่มีข้อมูล Sensor
                  </td>
                </tr>
              ) : (
                history.map((item, index) => (
                  <tr
                    key={`${item.device_id}-${item.recorded_at}-${index}`}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(item.recorded_at)}
                    </td>
                    <td className="px-5 py-3 font-medium text-orange-600">
                      {Number(item.temperature).toFixed(2)} °C
                    </td>
                    <td className="px-5 py-3 text-blue-600">
                      {Number(item.pressure).toFixed(2)} hPa
                    </td>
                    <td className="px-5 py-3 text-purple-600">
                      {Number(item.altitude).toFixed(2)} m
                    </td>
                    <td className="px-5 py-3 text-green-600">
                      {item.wifi_rssi} dBm
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        IoT Monitoring System · ESP32 + BMP280 · MQTT · EMQX
      </p>
    </div>
  );
}
