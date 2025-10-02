import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { WeightEntry } from "./weight.schema";
import { toChartData } from "./weight.service";

type WeightChartProps = {
  entries: WeightEntry[];
};

export function WeightChart({ entries }: WeightChartProps) {
  const data = toChartData(entries);

  if (data.length === 0) {
    return <p className="weight-chart__empty">Cadastre um peso para visualizar o gráfico.</p>;
  }

  return (
    <div className="weight-chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso"]}
            labelFormatter={(label) => `Data: ${label}`}
            contentStyle={{ borderRadius: 12, borderColor: "#cbd5f5" }}
          />
          <Line type="monotone" dataKey="kg" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.weight-chart {
  width: 100%;
  height: 260px;
}
.weight-chart__empty {
  color: #94a3b8;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}