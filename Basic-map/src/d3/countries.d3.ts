import { mouse } from "d3";
import { select } from "d3-selection";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { interpolatePuRd } from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";
import { json, csv} from "d3-fetch";
import { FeatureCollection, Geometry, Feature } from 'geojson';

// (*) Lets define a width and height for the SVG user space
// coordinate system (viewBox), also a padding to avoid
// overflows.
const width = 960;  
const height = 460;
const padding = 20;

// (*) Lets add a card for our map.
const card = select("#root")
  .append("div")
    .attr("class", "card")
    //.style("background-color", "#80afab")
    .style("opacity", 0.8);


// (*) Also lets add a reserved div for a tooltip.
const tooltip = select("#root")
  .append("div")
    .style("display", "none")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("border-radius", "3px")
    .style("background-color", "black")
    .style("color", "white")
    .style("opacity", "0.7");

// (*) Now the SVG canvas with the viewBox.
const svg = card
  .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `${-padding} ${-padding} ${width + 2*padding} ${height + 2*padding}`);

// Also, lets create a group whithin the svg to group 
// all the countries inside.
const countriesGroup = svg
  .append("g");

// (*) Lets create a projection for our map. Since we want
// to represent only Europe, we have to play a little bit
//With the position and the scale of the map in the canvas 
const projection = geoNaturalEarth1()
  .translate([ width*0.4, height*1.75 ])
  .scale(width*0.7)
  
                                   
// And then a path creator based on that projection.
const pathCreator = geoPath()
  .projection(projection);
// (*) Lets implement a useful scale to assign color to
// countries based on its avg wages.
const top_wage = 55000
const wageLogScale = scaleLinear()
  .domain([0, top_wage])
  .range([0, 1]);

const colorScale = (avgwage: number)  => interpolatePuRd(wageLogScale(avgwage));

// (*) Let's load the needed data. This time we will use an
// async helper borrowed from Promise. We are requiring local
// files using require() for webpack to provide us with the right
// path. Prior to that we need to do something with webpack config:
// **** WARNING **** Remember to change webpack rule to use
// file-loader for all these data extensions.

Promise.all([
  json(require("../data/europe.geojson")),
  //json(require("../data/AverageWages2017EU.json")
  csv(require("../data/AverageWages2017EU.csv"))
]).then(onDataReady as (value) => void);


// (*) And the function callback to handle that loaded data.
// We will need typings here to specify the structure of the
// expected country entities and population records.
interface CountryProps {
  FID: number;
  FIPS: string;
  ISO2: string;
  ISO3: string;
  UN: number;
  NAME: string;
  AREA: number;
  POP2005: number;
  REGION: number;
  SUBREGION: number;
  LON: number;
  LAT: number;
};

interface wageRecord {
  LOCATION: string;
  INDICATOR: string;
  SUBJECT: string;
  MEASURE: string;
  FREQUENCY: string;
  TIME: number;
  Value: number;
}

// Here is the function.
function onDataReady([countries, wages]: [FeatureCollection<Geometry, CountryProps>, wageRecord[]]) {
  
  const wagesMap = wages.reduce(
    (acc, record) => {
      acc[record.LOCATION] = record.Value;
      return acc;
    }, {}
  );

  // (*) Lets implement the ENTER pattern for each new country to be represented
  // with a SVG path, joined to its datum.
  countriesGroup.selectAll("path")
    .data(countries.features, (d: Feature<Geometry, CountryProps>) => d.properties.NAME)
    .enter()
    .append("path")
      .attr("d", pathCreator)
      .attr("fill", d => colorScale(wagesMap[d.properties.NAME]))
      .style("stroke", "white")
      .style("stroke-width", "0.5px")
      .style("opacity", 0.8)
      // Finally, lets bind some mouse events to show a tooltip with info.
      .on("mouseenter", onMouseEnter)
      .on("mousemove", onMouseMove)
      .on("mouseleave", onMouseLeave);
  

  // (*) You can find below the event handlers implementation

  // OnMouseEnter we will show the tooltip and hightlight the country.
  function onMouseEnter(d: Feature<Geometry, CountryProps>) {
    tooltip
      .style("display", "block")
      .html(`
        <p><b>Country</b>: ${d.properties.NAME}</p>
        <p><b>Avg Wage</b>: ${wagesMap[d.properties.NAME]}</p>
      `);
    
    select(this)
      .raise()  // To be able to see the stroke width change.
      .transition()
      .ease(Math.sqrt)
      .duration(400)
        .style("opacity", 1)
        .style("stroke", "cyan")
        .style("stroke-width", "1.5px");
  };

  // OnMouseMove lets update the tooltip position.
  function onMouseMove() {
    const [mx, my] = mouse(document.body);

    tooltip
      .style("left", `${mx + 10}px`)
      .style("top", `${my + 10}px`);
  };

  // OnMouseLeave just hide the tooltip.
  function onMouseLeave() {
    tooltip
      .style("display", "none");
    
    select(this)
      .transition()
      .style("opacity", 0.8)
      .style("stroke", "white")
      .style("stroke-width", "0.5px");
  }
}
