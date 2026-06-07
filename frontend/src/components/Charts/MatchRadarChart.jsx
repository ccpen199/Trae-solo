import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const MatchRadarChart = ({ dimensions }) => {
  if (!dimensions || dimensions.length === 0) return null;

  const data = {
    labels: dimensions.map(d => d.name),
    datasets: [
      {
        label: '匹配度',
        data: dimensions.map(d => d.score),
        backgroundColor: 'rgba(22, 119, 255, 0.2)',
        borderColor: 'rgba(22, 119, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(22, 119, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(22, 119, 255, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          font: {
            size: 10,
          },
        },
        pointLabels: {
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.raw}%`;
          }
        }
      }
    },
  };

  return (
    <div className="radar-chart-container">
      <Radar data={data} options={options} />
    </div>
  );
};

export default MatchRadarChart;
