import React, { useEffect, useMemo } from 'react';
import { useSearchStore, useModalStore } from '@/store';
import {
  formatDate,
  formatDateCN,
  getDaysInMonth,
  getFirstDayOfMonth,
  isSameDay,
  isBefore,
  addDays,
  isDateInRange,
  getNights,
  generateCalendarMonths,
} from '@/utils/date';

const DatePicker: React.FC = () => {
  const { showDatePicker, setShowDatePicker } = useModalStore();
  const { dateSelection, setDateSelection } = useSearchStore();

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const months = useMemo(() => generateCalendarMonths(today, 6), [today]);

  const { checkIn, checkOut } = dateSelection;

  const handleDateClick = (date: Date) => {
    if (isBefore(date, today)) return;

    if (!checkIn || (checkIn && checkOut)) {
      setDateSelection({
        checkIn: date,
        checkOut: null,
        nights: 0,
      });
    } else if (checkIn && !checkOut) {
      if (isBefore(date, checkIn)) {
        setDateSelection({
          checkIn: date,
          checkOut: null,
          nights: 0,
        });
      } else if (isSameDay(date, checkIn)) {
        setDateSelection({
          checkIn: null,
          checkOut: null,
          nights: 0,
        });
      } else {
        const nights = getNights(checkIn, date);
        setDateSelection({
          checkIn,
          checkOut: date,
          nights,
        });
      }
    }
  };

  const handleClear = () => {
    setDateSelection({
      checkIn: null,
      checkOut: null,
      nights: 0,
    });
  };

  const handleConfirm = () => {
    setShowDatePicker(false);
  };

  const getDayStatus = (date: Date) => {
    const isToday = isSameDay(date, today);
    const isPast = isBefore(date, today);
    const isCheckIn = checkIn ? isSameDay(date, checkIn) : false;
    const isCheckOut = checkOut ? isSameDay(date, checkOut) : false;
    const inRange = checkIn && checkOut ? isDateInRange(date, checkIn, checkOut) : false;

    return { isToday, isPast, isCheckIn, isCheckOut, inRange };
  };

  const renderMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const rows: React.ReactNode[] = [];
    const days: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ width: 40, height: 40 }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const { isToday, isPast, isCheckIn, isCheckOut, inRange } = getDayStatus(date);

      let dayStyle: React.CSSProperties = {
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        cursor: isPast ? 'not-allowed' : 'pointer',
        color: isPast ? '#ddd' : '#333',
        position: 'relative',
      };

      if (isCheckIn || isCheckOut) {
        dayStyle = {
          ...dayStyle,
          backgroundColor: '#ff385c',
          color: '#fff',
          fontWeight: 600,
        };
      } else if (inRange) {
        dayStyle = {
          ...dayStyle,
          backgroundColor: '#fff0f2',
        };
      }

      rows.push(
        <div
          key={day}
          style={dayStyle}
          onClick={() => !isPast && handleDateClick(date)}
        >
          <span>
            {isToday && !isCheckIn && !isCheckOut ? (
              <span style={{ color: '#ff385c' }}>今天</span>
            ) : (
              day
            )}
          </span>
          {(isCheckIn || isCheckOut) && (
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                fontSize: 10,
                color: isCheckIn || isCheckOut ? '#fff' : '#999',
              }}
            >
              {isCheckIn ? '入住' : '离店'}
            </span>
          )}
        </div>
      );
    }

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <div key={`${year}-${month}`} style={{ marginBottom: 32 }}>
        <div
          style={{
            textAlign: 'center',
            fontWeight: 600,
            marginBottom: 16,
            fontSize: 16,
          }}
        >
          {year}年{month + 1}月
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 40px)',
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {weekDays.map((w) => (
            <div
              key={w}
              style={{
                width: 40,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#999',
              }}
            >
              {w}
            </div>
          ))}
          {days}
          {rows}
        </div>
      </div>
    );
  };

  if (!showDatePicker) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1000,
    paddingTop: 80,
    overflow: 'auto',
  };

  const modalStyle: React.CSSProperties = {
    width: 640,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    maxHeight: '80vh',
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  };

  const closeBtnStyle: React.CSSProperties = {
    fontSize: 24,
    cursor: 'pointer',
    color: '#999',
  };

  const selectedBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
    padding: '16px 24px',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  };

  const dateBoxStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    padding: 12,
    backgroundColor: active ? '#fff' : 'transparent',
    borderRadius: 8,
    border: active ? '2px solid #ff385c' : '2px solid transparent',
  });

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1px solid #f0f0f0',
  };

  const clearBtnStyle: React.CSSProperties = {
    padding: '12px 24px',
    color: '#666',
    cursor: 'pointer',
    fontSize: 14,
  };

  const confirmBtnStyle: React.CSSProperties = {
    padding: '12px 40px',
    backgroundColor: '#ff385c',
    color: '#fff',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  };

  return (
    <div style={overlayStyle} onClick={() => setShowDatePicker(false)}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>选择入住日期</h3>
          <span style={closeBtnStyle} onClick={() => setShowDatePicker(false)}>
            ✕
          </span>
        </div>

        <div style={selectedBarStyle}>
          <div style={dateBoxStyle(!!checkIn && !checkOut)}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
              入住日期
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {checkIn ? formatDateCN(checkIn) : '请选择'}
            </div>
          </div>

          <div style={{ color: '#ccc', fontSize: 20 }}>→</div>

          <div style={dateBoxStyle(!!checkOut)}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
              离店日期
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {checkOut ? formatDateCN(checkOut) : '请选择'}
            </div>
          </div>

          {dateSelection.nights > 0 && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff385c',
                color: '#fff',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              共 {dateSelection.nights} 晚
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          {months.map(renderMonth)}
        </div>

        <div style={footerStyle}>
          <button style={clearBtnStyle} onClick={handleClear}>
            清除选择
          </button>
          <button style={confirmBtnStyle} onClick={handleConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
