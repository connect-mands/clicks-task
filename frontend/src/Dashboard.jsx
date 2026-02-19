import { useState, useEffect, useCallback, useRef } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { track, getAnalytics } from './api';
import { getStoredFilters, setStoredFilters } from './App';
import 'react-day-picker/dist/style.css';
import './Dashboard.css';

const AGE_OPTIONS = [
  { value: '', label: 'All Ages' },
  { value: '<18', label: '<18' },
  { value: '18-40', label: '18-40' },
  { value: '>40', label: '>40' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'All Genders' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const PRESETS = [
  { label: 'Today', fn: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { label: 'Yesterday', fn: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) },
  { label: 'Last 7 Days', fn: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }) },
  { label: 'This Month', fn: () => ({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: endOfDay(new Date()) }) },
];

function toApiDate(d) {
  return d ? format(d, 'yyyy-MM-dd HH:mm:ss') : null;
}

export function Dashboard({ user, onLogout }) {
  const stored = getStoredFilters();

  const [startDate, setStartDate] = useState(() => stored.startDate ? new Date(stored.startDate) : subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(() => stored.endDate ? new Date(stored.endDate) : new Date());
  const [age, setAge] = useState(stored.age || '');
  const [gender, setGender] = useState(stored.gender || '');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [ageDropdownOpen, setAgeDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);

  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics({
        start_date: toApiDate(startDate),
        end_date: toApiDate(endDate),
        age: age || undefined,
        gender: gender || undefined,
        feature_name: selectedFeature || undefined,
      });
      setBarData(res.barChart || []);
      setLineData(res.lineChart || []);
    } catch (err) {
      setBarData([]);
      setLineData([]);
      setError(err.message);
      if (err.message.includes('401')) {
        localStorage.removeItem('token');
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, age, gender, selectedFeature]);

  useEffect(() => {
    setStoredFilters({ startDate: startDate ? toApiDate(startDate) : null, endDate: endDate ? toApiDate(endDate) : null, age, gender });
  }, [startDate, endDate, age, gender]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const applyPreset = (preset) => {
    const { start, end } = preset.fn();
    setStartDate(start);
    setEndDate(end);
    setDatePickerOpen(false);
    track('date_picker');
  };

  const applyCustomRange = () => {
    setDatePickerOpen(false);
    track('date_picker');
  };

  const handleAgeSelect = (v) => {
    setAge(v);
    setAgeDropdownOpen(false);
    track('filter_age');
  };

  const handleGenderSelect = (v) => {
    setGender(v);
    setGenderDropdownOpen(false);
    track('filter_gender');
  };

  const handleBarClick = (data) => {
    const payload = data?.activePayload?.[0]?.payload;
    if (payload?.feature_name) {
      setSelectedFeature(prev => prev === payload.feature_name ? null : payload.feature_name);
      track('chart_bar');
    }
  };

  const dateRef = useRef(null);
  const ageRef = useRef(null);
  const genderRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) setDatePickerOpen(false);
      if (ageRef.current && !ageRef.current.contains(e.target)) setAgeDropdownOpen(false);
      if (genderRef.current && !genderRef.current.contains(e.target)) setGenderDropdownOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Product Analytics Dashboard</h1>
        <div className="header-actions">
          <span className="user-badge">{user?.username}</span>
          <button onClick={onLogout} className="btn-logout">Log Out</button>
        </div>
      </header>

      <div className="filters-row">
        <div className="date-picker-wrap" ref={dateRef}>
          <button
            className="filter-btn date-display"
            onClick={() => { setDatePickerOpen(!datePickerOpen); setAgeDropdownOpen(false); setGenderDropdownOpen(false); track('date_picker'); }}
          >
            {startDate && endDate
              ? `${format(startDate, 'yyyy-MM-dd HH:mm')} - ${format(endDate, 'yyyy-MM-dd HH:mm')}`
              : 'Select date range'}
          </button>
          {datePickerOpen && (
            <div className="date-picker-popover">
              <div className="date-presets">
                {PRESETS.map(p => (
                  <button key={p.label} className="preset-btn" onClick={() => applyPreset(p)}>{p.label}</button>
                ))}
                <span className="preset-btn active">Custom Range</span>
              </div>
              <div className="date-calendars">
                <DayPicker
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    if (range?.from) setStartDate(range.from);
                    if (range?.to) setEndDate(range.to);
                  }}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
              </div>
              <div className="date-range-display">
                {startDate && endDate && `${format(startDate, 'yyyy-MM-dd HH:mm:ss')} - ${format(endDate, 'yyyy-MM-dd HH:mm:ss')}`}
              </div>
              <div className="date-actions">
                <button className="btn-cancel" onClick={() => setDatePickerOpen(false)}>Cancel</button>
                <button className="btn-apply" onClick={applyCustomRange}>Apply</button>
              </div>
            </div>
          )}
        </div>

        <div className="dropdown-wrap" ref={ageRef}>
          <button
            className="filter-btn"
            onClick={() => { setAgeDropdownOpen(!ageDropdownOpen); setDatePickerOpen(false); setGenderDropdownOpen(false); track('filter_age'); }}
          >
            Age {age ? `: ${AGE_OPTIONS.find(o => o.value === age)?.label || age}` : ''}
          </button>
          {ageDropdownOpen && (
            <div className="dropdown-menu">
              {AGE_OPTIONS.map(o => (
                <button key={o.value || 'all'} className="dropdown-item" onClick={() => handleAgeSelect(o.value)}>{o.label}</button>
              ))}
            </div>
          )}
        </div>

        <div className="dropdown-wrap" ref={genderRef}>
          <button
            className="filter-btn"
            onClick={() => { setGenderDropdownOpen(!genderDropdownOpen); setDatePickerOpen(false); setAgeDropdownOpen(false); track('filter_gender'); }}
          >
            Gender {gender ? `: ${gender}` : ''}
          </button>
          {genderDropdownOpen && (
            <div className="dropdown-menu">
              {GENDER_OPTIONS.map(o => (
                <button key={o.value || 'all'} className="dropdown-item" onClick={() => handleGenderSelect(o.value)}>{o.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="chart-error">
          {error}
          {error.includes('401') && ' — Try logging out and back in.'}
        </div>
      )}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Total Clicks</h3>
          {loading ? (
            <div className="chart-placeholder">Loading...</div>
          ) : barData.length === 0 ? (
            <div className="chart-placeholder">No data for this range</div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ left: 80 }} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text-muted)" />
                  <YAxis type="category" dataKey="feature_name" width={100} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                  <Bar dataKey="total_clicks" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="chart-hint">Click a bar to filter the line chart</p>
        </div>

        <div className="chart-card">
          <h3>Clicks Daily {selectedFeature ? `(${selectedFeature})` : ''}</h3>
          {loading ? (
            <div className="chart-placeholder">Loading...</div>
          ) : lineData.length === 0 ? (
            <div className="chart-placeholder">No data for this range</div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                  <Line type="monotone" dataKey="clicks" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
