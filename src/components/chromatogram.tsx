"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DataPoint = {
  name: string;
  uv: number;
  pv: number;
  amt: number;
};

const generateRandomData = (): DataPoint[] => {
  let randomData = [];
  for (let i = 0; i < 10; i++) {
    randomData.push({
      name: `Point ${i}`,
      uv: Math.floor(Math.random() * 2000),
      pv: Math.floor(Math.random() * 2000),
      amt: Math.floor(Math.random() * 2000),
    });
  }

  return randomData;
};

export default function Chromatogram() {
  return (
    <LineChart
      width={500}
      height={300}
      data={generateRandomData()}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey="pv"
        stroke="#8884d8"
        activeDot={{ r: 8 }}
      />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
    </LineChart>
  );
}
