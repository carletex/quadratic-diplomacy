import React from "react";
import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartMore from "highcharts/highcharts-more";
HighchartMore(Highcharts);

const getOptions = (title, data, names, chartType, subtitle) => ({
  chart: {
    polar: true,
  },
  plotOptions: {
    line: {
      dataLabels: {
        enabled: true,
      },
      enableMouseTracking: false,
    },
  },

  legend: {
    enabled: false,
  },

  title: {
    text: title,
  },

  subtitle: {
    text: subtitle,
  },

  xAxis: {
    categories: names,
  },

  yAxis: {
    min: 0,
  },

  series: [
    {
      type: chartType || "area", //sline, line, column
      name: "Line",
      color: "#00aa55",
      data: data,
    },
  ],
});

const SpiderChart = ({ data, names, title, chartType, subtitle }) => {
  const [options, setoptions] = React.useState(getOptions(title, data, names, chartType));

  React.useEffect(() => {
    setoptions(getOptions(title, data, names, chartType, subtitle));
  }, [data, names]);
  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export { SpiderChart };
