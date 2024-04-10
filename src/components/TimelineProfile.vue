<template>
  <div>
    <h5>TimelineProfile for {{ thetimeline?.label }}</h5>
    <div id="timeline"> </div>

  </div>
  <div id="svg2"></div>
</template>
<script setup>

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
import * as d3 from "d3";
const { formatDate } = useDateTimeLibrary();

const props = defineProps(['thetimeline', 'sites']);
const emit = defineEmits(['clickSite', 'dblclickSite']);

let timegrain 

onMounted(() => {
  // Create the SVG container
  svg = d3.select("#timeline").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
    timegrain = timeResolution()
  console.log("timegrain", timegrain)
  drawTimelineProfile(svg)

});

watch(() => props.thetimeline, (newValue, oldValue) => {
  timegrain = timeResolution()
  console.log("timegrain", timegrain)
  drawTimelineProfile(svg)
});


function toggleVisibility(group) {
  // const currentDisplay = element.style("display");
  // element.style("display", currentDisplay === "none" ? null : "none");

  const isHidden = group.style("display") === "none";
    group.style("display", isHidden ? null : "none"); 
}

const yearInMilliseconds = 365 * 24 * 60 * 60 * 1000
const monthInMilliseconds = 30 * 24 * 60 * 60 * 1000
const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000
const dayInMilliseconds = 24 * 60 * 60 * 1000
const hourInMilliseconds = 60 * 60 * 1000

const timeResolution = () => {
  const timelineStart = props.thetimeline.startTimestamp
  const timelineEnd = props.thetimeline.endTimestamp
  const startTime = new Date(timelineStart).getTime();
  const endTime = new Date(timelineEnd).getTime();
  const timeDiff = endTime - startTime;
  console.log('timediff ',timeDiff)
  if (timeDiff > 3* yearInMilliseconds) return "year"
  if (timeDiff > 3* monthInMilliseconds) return "month"
  if (timeDiff > 3* weekInMilliseconds) return "week"
  if (timeDiff > 3* dayInMilliseconds) return "day"
  if (timeDiff > 3* hourInMilliseconds) return "hour"
  return "minute"
}

const addMarker = (site, position, svg, timelineColor,relativePosition) => {

  const yPos = 50; // Base Y position for the line
  const lineLength = 25; // Length of the vertical line

  svg.append("line")
    .attr("x1", position)
    .attr("x2", position)
    .attr("y1", yPos - lineLength)
    .attr("y2", yPos)
    .attr("stroke", timelineColor);

  const circle = svg.append("circle")
    .attr("cx", position)
    .attr("cy", yPos - lineLength)
    .attr("r", "5 ") // Radius of the circle
    .attr("fill", timelineColor);


  const tooltipGroup = svg.append("g")
  .attr("id", `tooltip-group-${site.id}`)
  .style("display", "none")

  tooltipGroup.append("text")
    .attr("x", position)
    .attr("y", lineLength -8 )
    .attr("text-anchor", relativePosition<0.6 ? "start":"end")
    .attr("fill", "black")
    .attr("class", "tooltip")
    .text(site.label );

    tooltipGroup.append("line")
    .attr("x1", position)
    .attr("x2", position)
    .attr("y1", yPos)
    .attr("y2", yPos  + 2* lineLength)
    .attr("stroke", timelineColor);

    tooltipGroup.append("line")
    .attr("x1", position)
    .attr("x2", position+ 8 * (relativePosition<0.6 ? 1:-1))
    .attr("y1", yPos  + 2* lineLength)
    .attr("y2", yPos  + 2* lineLength)
    .attr("stroke", timelineColor);
  
    tooltipGroup.append("text")
    .attr("x", position+ 10 * (relativePosition<0.6 ? 1:-1))
    .attr("y", yPos + 2*lineLength+8)
    .attr("text-anchor", relativePosition<0.6 ? "start":"end")
    .attr("fill", "black")
    .attr("class", "tooltip")
    .text(formatDate(site.timestamp,'medium'));
  


  // Hover events for tooltip
  circle.on('mouseenter', () => toggleVisibility(tooltipGroup));
  circle.on('mouseleave', () => toggleVisibility(tooltipGroup));
  circle.on('click', () => {
    console.log(`click for ${site.label} and id ${site.id}`)
    emit('clickSite', { site: site })
  });
  circle.on('dblclick', () => {
    console.log(`dblclick for ${site.label} and id ${site.id}`)
    emit('dblclickSite', { site: site })
  });
};

const getSortedSites = (allSites) => {
  return allSites.sort((a, b) => (new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()) ? 1 : -1)
}

const margin = { top: 20, right: 20, bottom: 20, left: 20 },
  width = 960 - margin.left - margin.right,
  height = 160 - margin.top - margin.bottom;

let svg

const drawTimelineProfile = (svg) => {

  svg.selectAll("*").remove();
  // sort sites by timestamp
  const sortedSites = getSortedSites(props.sites);
  // then find the starting and ending timestamps of the timeline
  const timelineStart = props.thetimeline.startTimestamp
  const timelineEnd = props.thetimeline.endTimestamp
  const startTime = new Date(timelineStart).getTime();
  const endTime = new Date(timelineEnd).getTime();
  const timelineWidth = width



  // TODO determine proper start and end time for the timescale - rounded up to start of an hour, a day, a month or a year - instead of picking the first and last sites' timestamps


  const xScale = d3.scaleTime()
    .domain([startTime, endTime])
    .range([0, width]);

  // Draw the horizontal timeline
  svg.append("line")
    .attr("x1", 0)
    .attr("x2", timelineWidth)
    .attr("y1", 50)
    .attr("y2", 50)
    .attr("stroke", props.thetimeline.color);

  const numTicks = 5;
  // if timegrain is day or hour then dateTimeFormat = short, if timegrain is month then dateTimeFormat = long
  // if timegrain is year then dateTimeFormat = medium
  let dateTimeFormat
  if (timegrain == 'year') {
    dateTimeFormat = 'medium'
  } else if (timegrain == 'month') {
    dateTimeFormat = 'long'
  } else if (timegrain == 'day' || timegrain == 'hour') {
    dateTimeFormat = 'short'
  } else {
    dateTimeFormat = 'short'
  }
  


  //const dateTimeFormat = timegrain =='month' ? 'long' :(timegrain =='day'? 'short' :  'medium');
  for (let i = 0; i <= numTicks; i++) {
    const relativePosition = i / numTicks;
    const xPos = relativePosition * timelineWidth;

    // Timestamp for tick
    const tickTime = startTime + (relativePosition * (endTime - startTime));
    const date = new Date(tickTime);

    // Format date for label
    const label = formatDate(date, dateTimeFormat)

    // Create tick
    const tick =
      svg.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", 47)
        .attr("y2", 60)
        .attr("stroke", props.thetimeline.color);

    // Add label
    svg.append("text")
      .attr("x", xPos)
      .attr("y", 75)
      .attr("text-anchor",  (i==0?"start":(i==numTicks?"end":"middle"))) 
      .attr("fill", "black")
      .text(label);
  }

  sortedSites.forEach((site, index) => {
    const siteTime = new Date(site.timestamp).getTime();
    if (siteTime < startTime || siteTime > endTime) { return }
    const relativePosition = (new Date(site.timestamp).getTime() - startTime) / (endTime - startTime);
    const xPos = xScale(new Date(site.timestamp));
    addMarker(site, xPos, svg, props.thetimeline.color, relativePosition);
  })
  drawZoombox(svg)
}


const drawZoombox = (svg) => {
  const maxX = width
  const minX = 0
  const minWidth = 15;


  // Initial rectangle properties
  let rectWidth = 100, rectHeight = 28;
  let rectX = 200, rectY = 33; // Centering the rectangle
  //const svg = d3.select("#svg-timeline-root")
  // Create the rectangle
  let rectangle = svg.append("rect")

  rectangle
    .attr("x", rectX)
    .attr("y", rectY)
    .attr("width", rectWidth)
    .attr("height", rectHeight)
    .style("fill", "pink")
    .style("fill-opacity", 0.3)
    .style("stroke", "black")
    .style("cursor", "ew-resize");

  let dragMove = d3.drag()
    .on("drag", function (event) {
      let dx = event.dx;
      let newX = rectX + dx;

      // Constrain the movement within the bounds
      if (newX < minX) {
        newX = minX;
      } else if (newX + rectWidth > maxX) {
        newX = maxX - rectWidth;
      }

      rectX = newX;
      updateRectangle();
    });
  function updateRectangle() {
    rectangle.attr("x", rectX);
    leftHandle.attr("cx", rectX);
    rightHandle.attr("cx", rectX + rectWidth);
    handleMoveOrResize(); // Function triggered on move or resize
  }

  rectangle.call(dragMove);

  function resizeRect(dragHandle) {
    return d3.drag()
      .on("drag", function (event) {
        if (dragHandle === 'right') {
          let newWidth = Math.max(minWidth, Math.min(maxX - rectX, event.x - rectX));
          rectWidth = newWidth;
        } else if (dragHandle === 'left') {
          let newWidth = rectWidth + (rectX - event.x);
          if (newWidth >= minWidth && event.x >= minX) {
            rectX = event.x;
            rectWidth = newWidth;
          }
        }
        rectangle.attr("width", rectWidth);
        updateRectangle(); // Update positions
      });
  }

  // Right resize handle
  let rightHandle = svg.append("circle")
    .attr("cx", rectX + rectWidth)
    .attr("cy", rectY + (rectHeight / 4))
    .attr("r", 5)
    .style("stroke", "black")
    .style("fill", "white")
    .style("cursor", "ew-resize")
    .call(resizeRect('right'));

  // Left resize handle
  let leftHandle = svg.append("circle")
    .attr("cx", rectX)
    .attr("cy", rectY + (rectHeight / 4))
    .attr("r", 5)
    .style("stroke", "black")
    .style("fill", "white")
    .style("cursor", "ew-resize")
    .call(resizeRect('left'));

  // Placeholder for handling move or resize events
  function handleMoveOrResize() {
    console.log("Rectangle moved or resized. New position and size:", rectX, rectY, rectWidth, rectHeight);
  }
}
</script>

<style scoped>
.tooltip {
  font-family: Arial, sans-serif;
  font-size: 12px;
  pointer-events: none;
  /* Ensures the tooltip doesn't interfere with marker hover */
}
</style>
