import { useEffect, useState } from 'react';

interface CityDateTimeProps {
  timezone: string;
}

export function CityDateTime({ timezone }: CityDateTimeProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        timeStyle: 'medium',
      };
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        dateStyle: 'full',
      };
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', options));
      setDate(now.toLocaleDateString('en-US', dateOptions));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div>
      <p className="font-semibold">Local Time</p>
      <p className="text-2xl font-bold text-blue-600">{time}</p>
      <p className="text-gray-600">{date}</p>
    </div>
  );
}
