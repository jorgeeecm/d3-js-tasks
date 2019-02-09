import { select } from "d3-selection";
import { scaleLinear,  scaleOrdinal, scaleBand } from "d3-scale";
import { interpolatePlasma } from "d3-scale-chromatic";
import { avgTemp } from "./barchart.data";
import { axisBottom, axisLeft } from "d3-axis";
import { extent } from "d3-array";

const d3 = {
  select,
  scaleLinear,
  scaleBand,
  extent,
  axisBottom,
  axisLeft,
  scaleOrdinal,
  interpolatePlasma,
 
};

const width = 500;
const height = 300;
const padding = 50;

//Definiing the months
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

//Create the new card
const card = d3
  .select("#root")
  .append("div")
  .attr("class", "card");

//Create the svg canvas
const svg = card
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("viewBox", `${-padding} ${-padding} ${width + 2 * padding} ${height + 2 * padding}`);

//Scaling the temperatures (y axis)
const yScalePos = d3.scaleLinear()
  .domain(d3.extent(avgTemp)) //Catching the max and min value for the temps
  .range([height, 0]);

//Scaling the months (x axis)
const xScalePos = d3.scaleBand<string>()
  .domain(months) // Jan to Dec 2018
  .range([0, width])
  .paddingInner(0.05);

//Let's define a scale to assing color depending on the temperature values
const temperatureLogScale = scaleLinear()
  .domain(d3.extent(avgTemp))
  .range([0, 1]);

const colorScale = (temp: number) => d3.interpolatePlasma(temperatureLogScale(temp));

//Lets draw the bar, making a group will give us the support for futures updates
const barGroup = svg
  .append("g")

barGroup
  .selectAll('rect')
  .data(avgTemp)
  .enter()
  .append("rect")
    .attr("x", ((d,i) => xScalePos(months[i])))
    .attr("y", d => yScalePos(d))
    .attr("width", xScalePos.bandwidth())
    .attr("height", d => height - yScalePos(d))
    .attr("fill", d => colorScale(d));


const axisGroup = svg.append("g");

// Y Axis: call axisLeft helper and pass the scale
axisGroup.append("g").call(d3.axisLeft(yScalePos));

// X axis:
axisGroup
  .append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(xScalePos));

 // text label for the x axis
axisGroup
  .append("text")             
  .attr("transform", `translate(${width/2}, ${height + padding*0.8})`)
  .text("Month");

// text label for y axis
axisGroup
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - padding)
  .attr("x",0 - (height * 0.7))
  .attr("dy", "1em")
  .text("Temp in Degrees");    