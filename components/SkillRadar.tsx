
import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface SkillRadarProps {
  data: Record<string, number>;
}

export const SkillRadar: React.FC<SkillRadarProps> = ({ data }) => {
  const chartData = useMemo(() => {
    return Object.entries(data).map(([subject, value]) => ({
      subject,
      A: value,
      fullMark: 100,
    }));
  }, [data]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar
            name="Intuition"
            dataKey="A"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
