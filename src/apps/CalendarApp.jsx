import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useElementSize } from '../hooks/useElementSize';

const CalendarApp = () => {
  const [date, setDate] = useState(new Date());
  const { theme } = useTheme();
  const { ref, width, height } = useElementSize();

  const { year, month, monthName, days } = useMemo(() => {
    const today = date;
    const y = today.getFullYear();
    const m = today.getMonth();

    const monthName = today.toLocaleDateString([], { month: 'long' });
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();

    let dayGrid = [];
    let day = 1;
    for (let i = 0; i < 6; i++) { // Max 6 weeks
      let week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(null); // Empty cell
        } else if (day > daysInMonth) {
          week.push(null); // Empty cell
        } else {
          week.push(day);
          day++;
        }
      }
      dayGrid.push(week);
      if (day > daysInMonth) break;
    }
    return { year: y, month: m, monthName, days: dayGrid };
  }, [date]);

  // Auto-update at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msToMidnight = tomorrow.getTime() - now.getTime();
    const timer = setTimeout(() => {
      setDate(new Date());
    }, msToMidnight + 1000); // +1 second to be sure
    return () => clearTimeout(timer);
  }, []);

  const sizes = useMemo(() => {
    const minDim = Math.max(1, Math.min(width, height));
    const headerSize = Math.max(16, Math.min(48, Math.floor(minDim * 0.1)));
    const daySize = Math.max(10, Math.min(32, Math.floor(minDim * 0.07)));
    return { headerSize, daySize };
  }, [width, height]);

  const today = new Date().getDate();
  const currentMonth = new Date().getMonth();

  return (
    <div ref={ref} className="w-full h-full flex flex-col p-4 text-white">
      <div 
        className="font-semibold" 
        style={{ fontSize: `${sizes.headerSize}px`, color: theme.accent }}
      >
        {monthName} {year}
      </div>
      <table className="flex-1 w-full mt-2 text-center">
        <thead>
          <tr className="text-white/70">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <th key={d} className="font-light" style={{ fontSize: `${sizes.daySize * 0.8}px` }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((week, i) => (
            <tr key={i}>
              {week.map((d, j) => (
                <td key={j} className="relative" style={{ fontSize: `${sizes.daySize}px` }}>
                  {d && d === today && month === currentMonth ? (
                    <span 
                      className="w-full h-full absolute top-0 left-0 flex items-center justify-center rounded-full"
                      style={{ background: theme.accent, color: '#000', fontWeight: 'bold' }}
                    >
                      {d}
                    </span>
                  ) : (
                    <span className="text-white/90">{d}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalendarApp;