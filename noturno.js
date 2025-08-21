import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gauge, Activity, Users, Wrench } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export default function DashboardAndaime() {
  // Dados fictícios
  const supervisor = "Carlos Silva";
  const encarregado = "João Pereira";

  const totalMontadores = 12;
  const hhPrevisto = totalMontadores * 8.8; // 105.6
  const hhReal = 98;
  const mlPrevisto = 250;
  const mlReal = 230;

  const stdPrevisto = (hhPrevisto / mlPrevisto).toFixed(2);
  const stdReal = (hhReal / mlReal).toFixed(2);

  const interferencias = "Área bloqueada para solda até 20h, falta de material às 22h";

  // % de performance
  const desempenho = Math.round((mlReal / mlPrevisto) * 100);

  const barData = [
    { name: "HH", Previsto: hhPrevisto, Real: hhReal },
    { name: "ML", Previsto: mlPrevisto, Real: mlReal },
    { name: "STD", Previsto: stdPrevisto, Real: stdReal },
  ];

  const gaugeData = [
    { name: "Progresso", value: desempenho },
    { name: "Restante", value: 100 - desempenho },
  ];

  const COLORS = ["#0b63d6", "#e5e7eb"];

  return (
    <div className="min-h-screen bg-white p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="bg-blue-600 text-white p-4 rounded-2xl shadow flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Andaime - Turno 18:00 às 05:00</h1>
        <Button variant="secondary" className="bg-gray-200 text-blue-600 font-semibold">
          Voltar
        </Button>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-blue-600" />
            <p className="font-semibold">Supervisor</p>
            <p>{supervisor}</p>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-4 text-center">
            <Wrench className="w-6 h-6 mx-auto text-blue-600" />
            <p className="font-semibold">Encarregado</p>
            <p>{encarregado}</p>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto text-blue-600" />
            <p className="font-semibold">HH Previsto</p>
            <p>{hhPrevisto}</p>
            <p className="font-semibold">HH Real</p>
            <p>{hhReal}</p>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-4 text-center">
            <Gauge className="w-6 h-6 mx-auto text-blue-600" />
            <p className="font-semibold">ML Previsto</p>
            <p>{mlPrevisto}</p>
            <p className="font-semibold">ML Real</p>
            <p>{mlReal}</p>
          </CardContent>
        </Card>
      </div>

      {/* STD e Interferências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow">
          <CardContent className="p-4">
            <h2 className="font-bold mb-2">STD</h2>
            <p><b>Previsto:</b> {stdPrevisto}</p>
            <p><b>Real:</b> {stdReal}</p>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-4">
            <h2 className="font-bold mb-2">Interferências</h2>
            <p>{interferencias}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow">
          <CardContent className="p-4">
            <h2 className="font-bold mb-4">Desempenho (%)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xl font-bold text-blue-600">{desempenho}%</p>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-4">
            <h2 className="font-bold mb-4">Comparativo Previsto x Real</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Previsto" fill="#0b63d6" />
                <Bar dataKey="Real" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quadro de fotos */}
      <Card className="shadow">
        <CardContent className="p-4">
          <h2 className="font-bold mb-2">Registro Fotográfico</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">Foto 1</div>
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">Foto 2</div>
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">Foto 3</div>
            <div className="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">Foto 4</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
