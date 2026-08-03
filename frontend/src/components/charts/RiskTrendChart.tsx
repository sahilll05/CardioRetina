import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const data = [
  { date: 'Oct 2023', score: 2, level: 'Low' },
  { date: 'Nov 2023', score: 3, level: 'Low' },
  { date: 'Dec 2023', score: 6, level: 'Moderate' },
  { date: 'Jan 2024', score: 8.5, level: 'High' },
];

export function RiskTrendChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={10} />
          <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tickMargin={10} />
          
          <ReferenceLine y={3.5} stroke="hsl(var(--success))" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: 'Low Risk Zone', fill: 'hsl(var(--success))', fontSize: 12, opacity: 0.8 }} />
          <ReferenceLine y={7.5} stroke="hsl(var(--warning))" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: 'Moderate Risk', fill: 'hsl(var(--warning))', fontSize: 12, opacity: 0.8 }} />
          
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ r: 5, fill: 'hsl(var(--surface))', strokeWidth: 2 }}
            activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
