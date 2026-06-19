import { DatePicker, Segmented } from 'antd';
import { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  onChange?: (dates: [Dayjs | null, Dayjs | null] | null, period: string) => void;
  quickOptions?: string[];
  showQuickSelect?: boolean;
}

const DateRangePicker = ({
  onChange,
  quickOptions = ['今日', '昨日', '近7天', '近30天', '近90天'],
  showQuickSelect = true,
}: DateRangePickerProps) => {
  const [selectedQuick, setSelectedQuick] = useState<string | null>('近7天');
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    if (selectedQuick) {
      let newDates: [Dayjs | null, Dayjs | null];
      switch (selectedQuick) {
        case '今日':
          newDates = [dayjs().startOf('day'), dayjs()];
          break;
        case '昨日':
          newDates = [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')];
          break;
        case '近7天':
          newDates = [dayjs().subtract(7, 'day'), dayjs()];
          break;
        case '近30天':
          newDates = [dayjs().subtract(30, 'day'), dayjs()];
          break;
        case '近90天':
          newDates = [dayjs().subtract(90, 'day'), dayjs()];
          break;
        default:
          newDates = [dayjs().subtract(7, 'day'), dayjs()];
      }
      setDates(newDates);
      onChange?.(newDates, selectedQuick);
    }
  }, [selectedQuick]);

  const handleRangeChange = (newDates: [Dayjs | null, Dayjs | null]) => {
    setDates(newDates);
    setSelectedQuick(null);
    onChange?.(newDates, 'custom');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {showQuickSelect && (
        <Segmented
          size="small"
          value={selectedQuick}
          onChange={(val) => setSelectedQuick(val as string)}
          options={quickOptions}
        />
      )}
      <RangePicker
        value={dates}
        onChange={handleRangeChange}
        style={{ width: showQuickSelect ? '100%' : 300 }}
        allowClear={false}
      />
    </div>
  );
};

export default DateRangePicker;
