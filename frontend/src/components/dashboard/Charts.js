// frontend/src/components/dashboard/Charts.js
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Charts = ({ type, data, options }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#714B67', // Odoo primary color
          font: {
            family: 'Inter'
          }
        }
      }
    },
    scales: type !== 'doughnut' ? {
      x: {
        ticks: {
          color: '#8F8F8F', // Odoo gray
          font: {
            family: 'Inter'
          }
        },
        grid: {
          color: '#E0E0E0'
        }
      },
      y: {
        ticks: {
          color: '#8F8F8F',
          font: {
            family: 'Inter'
          }
        },
        grid: {
          color: '#E0E0E0'
        }
      }
    } : {}
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options
  };

  // Apply Odoo color scheme to data
  const styledData = {
    ...data,
    datasets: data.datasets?.map((dataset, index) => ({
      ...dataset,
      backgroundColor: [
        '#714B67', // Odoo primary
        '#017E84', // Odoo secondary
        '#21B799', // Ready partner
        '#E4A900', // Gold partner
        '#E46E78', // Learning partner
        '#5B899E'  // Silver partner
      ][index % 6],
      borderColor: [
        '#714B67',
        '#017E84',
        '#21B799',
        '#E4A900',
        '#E46E78',
        '#5B899E'
      ][index % 6],
      borderWidth: 2
    }))
  };

  switch (type) {
    case 'line':
      return <Line data={styledData} options={mergedOptions} />;
    case 'bar':
      return <Bar data={styledData} options={mergedOptions} />;
    case 'doughnut':
      return <Doughnut data={styledData} options={mergedOptions} />;
    default:
      return <div>Chart type not supported</div>;
  }
};

export default Charts;