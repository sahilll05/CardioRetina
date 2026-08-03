import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { grade: 'Grade 0', count: 120, fill: 'hsl(var(--success))' },
  { grade: 'Grade 1', count: 65, fill: 'hsl(120, 70%, 45%)' },
  { grade: 'Grade 2', count: 40, fill: 'hsl(var(--warning))' },
  { grade: 'Grade 3', count: 15, fill: 'hsl(20, 90%, 55%)' },
  { grade: 'Grade 4', count: 5, fill: 'hsl(var(--destructive))' },
];

export function DRGradeChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
          <XAxis type="number" hide />
          <YAxis dataKey="grade" type="category" axisLine={false} tickLine={false} width={80} />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
