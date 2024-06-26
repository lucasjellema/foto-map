<template>
  <div>
    <h5>TimelineProfile for {{ label }} <v-icon icon="mdi-arrow-top-left" @click="rollup()" v-if="showRollup"></v-icon>
    </h5>
    <div id="sitesTimeline"> </div>
    <div id="sitesTimelineZoom"> </div>

  </div>

</template>
<script setup>

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
import * as d3 from "d3";
const { formatDate, formatDateByGrain } = useDateTimeLibrary();

const props = defineProps(['label', 'sites']);
const emit = defineEmits(['clickSite', 'dblclickSite', 'sitesInFocus']);

let timegrain

const showRollup = ref(false)
const timelineColor = "steelblue"

onMounted(() => {
  // Create the SVG container
  svg = d3.select("#sitesTimeline").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg2 = d3.select("#sitesTimelineZoom").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  resetTimelines()
});

watch(() => props.sites, (newValue, oldValue) => {
  resetTimelines()
})

const resetTimelines = () => {
  // sort sites by timestamp
  sortedSites = getSortedSites(props.sites);
  drawSitesTimelineProfile(svg, sortedSites, true)
  drawSitesTimelineProfile(svg2, sortedSites, false)
  showRollup.value = false
}

let sortedSites

const rollup = () => {
  showRollup.value = !showRollup.value
  resetTimelines()
}
const drawZoomedinProfile = (sortedSites, startPercentage, durationPercentage, timelineStart, timelineEnd) => {
  // given the full width of the timeline for all sites, startPercentage indicates the timestamp where this zoomedin profile should start: starttime + startPercentage * (end-time - starttime)
  // filter sites based on start and end time
  const startTime = new Date(timelineStart).getTime();
  const endTime = new Date(timelineEnd).getTime();

  const timeDiff = endTime - startTime;
  const startTimestamp = startTime + startPercentage * timeDiff
  const endTimestamp = startTime + (startPercentage + durationPercentage) * timeDiff

  const sortedFilteredSites = sortedSites.filter((site) => {
    const siteTimestamp = new Date(site.timestamp).getTime();
    return siteTimestamp >= startTimestamp && siteTimestamp <= endTimestamp
  })
  drawSitesTimelineProfile(svg2, sortedFilteredSites, false, new Date(startTimestamp).toISOString(), new Date(endTimestamp).toISOString())
  emit('sitesInFocus', { sites: sortedFilteredSites })
}

const zoomInOnZoombox = (sortedSites, startPercentage, durationPercentage, timelineStart, timelineEnd) => {
  const startTime = new Date(timelineStart).getTime();
  const endTime = new Date(timelineEnd).getTime();

  const timeDiff = endTime - startTime;
  const startTimestamp = startTime + startPercentage * timeDiff
  const endTimestamp = startTime + (startPercentage + durationPercentage) * timeDiff

  const sortedFilteredSites = sortedSites.filter((site) => {
    const siteTimestamp = new Date(site.timestamp).getTime();
    return siteTimestamp >= startTimestamp && siteTimestamp <= endTimestamp
  })
  drawSitesTimelineProfile(svg, sortedFilteredSites, true)
  drawSitesTimelineProfile(svg2, sortedFilteredSites, false)
  showRollup.value = true
}


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

const timeResolution = (timelineStart, timelineEnd) => {
  const startTime = new Date(timelineStart).getTime();
  const endTime = new Date(timelineEnd).getTime();
  const timeDiff = endTime - startTime;
  if (timeDiff > 3 * yearInMilliseconds) return "year"
  if (timeDiff > 3 * monthInMilliseconds) return "month"
  if (timeDiff > 3 * weekInMilliseconds) return "week"
  if (timeDiff > 3 * dayInMilliseconds) return "day"
  if (timeDiff > 3 * hourInMilliseconds) return "hour"
  return "minute"
}

const addMarker = (site, position, svg, timelineColor, relativePosition) => {

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
    .attr("y", lineLength - 8)
    .attr("text-anchor", relativePosition < 0.6 ? "start" : "end")
    .attr("fill", "black")
    .attr("class", "tooltip")
    .text(site.label);

  tooltipGroup.append("line")
    .attr("x1", position)
    .attr("x2", position)
    .attr("y1", yPos)
    .attr("y2", yPos + 2 * lineLength)
    .attr("stroke", timelineColor);

  tooltipGroup.append("line")
    .attr("x1", position)
    .attr("x2", position + 8 * (relativePosition < 0.6 ? 1 : -1))
    .attr("y1", yPos + 2 * lineLength)
    .attr("y2", yPos + 2 * lineLength)
    .attr("stroke", timelineColor);

  tooltipGroup.append("text")
    .attr("x", position + 10 * (relativePosition < 0.6 ? 1 : -1))
    .attr("y", yPos + 2 * lineLength + 8)
    .attr("text-anchor", relativePosition < 0.6 ? "start" : "end")
    .attr("fill", "black")
    .attr("class", "tooltip")
    .text(formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain))




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
  try {
    const sortedSites = allSites.sort((a, b) => (new Date(a.timestamp) - new Date(b.timestamp)) ? 1 : -1)
    return sortedSites
  }
  catch (err) {
    console.log(err)
  }
}

const margin = { top: 10, right: 20, bottom: 10, left: 20 },
  width = 960 - margin.left - margin.right,
  height = 145 - margin.top - margin.bottom;

let svg, svg2


const drawSitesTimelineProfile = (svg, sortedSites, withZoombox = false, requestedTimelineStart, requestedTimelineEnd) => {

  svg.selectAll("*").remove();
  if (!sortedSites || sortedSites.length == 0) return
  // then find the starting and ending timestamps - the timestamp of the first and the last of the sorted sites
  let timelineStart = requestedTimelineStart || sortedSites[0].timestamp
  let timelineEnd = requestedTimelineEnd || sortedSites[sortedSites.length - 1].timestamp


  let startDate = new Date(timelineStart);
  let endDate = new Date(timelineEnd);
  let numTicks = 5;

  timegrain = timeResolution(timelineStart, timelineEnd)
  const timelineWidth = width

  // determine real start time and end time and ticks 

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


  // WORKING
  // TODO!!!
  // if same day
  const sameHour = timelineStart.substring(0, 13) == timelineEnd.substring(0, 13)
  const sameDay = timelineStart.substring(0, 10) == timelineEnd.substring(0, 10)
  const sameMonth = timelineStart.substring(0, 7) == timelineEnd.substring(0, 7)
  const sameYear = timelineStart.substring(0, 4) == timelineEnd.substring(0, 4)


  // TODO what if not same day but a few hours apart or not the same month but a few days apart? do not show all hours in  both days or all days in both months
  // TODO same hour / within a few hours?
  // TODO several months or even multiple years
  if (sameHour || endDate.getTime() - startDate.getTime() < hourInMilliseconds) {
    const earliestMinute = parseInt(timelineStart.substring(14, 16))
    const lastMinute = parseInt(timelineEnd.substring(14, 16)) + 1 // 
    timelineStart = timelineStart.substring(0, 14) + (earliestMinute < 10 ? '0' : '') + earliestMinute + ':00Z'
    if (lastMinute > 59) {
      timelineEnd = timelineEnd.substring(0, 14) + '59:59Z'
    } else {
      timelineEnd = timelineEnd.substring(0, 14) + (lastMinute < 10 ? '0' : '') + lastMinute + ':00Z'
    }
    startDate = new Date(timelineStart);
    endDate = new Date(timelineEnd);
    numTicks = (endDate.getTime() - startDate.getTime()) / 1000 * 60 * 10  // 10 minutes
    if (numTicks < 4) numTicks = numTicks * 2

    if (numTicks > 8) numTicks = Math.min(8, Math.ceil(numTicks / 2)) // Math.ceil(numTicks / 2)
  }
  else if (sameDay || endDate.getTime() - startDate.getTime() < dayInMilliseconds) {
    const earliestHour = parseInt(timelineStart.substring(11, 13))
    const lastHour = parseInt(timelineEnd.substring(11, 13)) + 1 // TO DO should be <= 23 ;what if last hour is last hour in day?

    timelineStart = timelineStart.substring(0, 10) + 'T' + (earliestHour < 10 ? '0' : '') + earliestHour + ':00:00Z'
    if (lastHour > 23) {
      timelineEnd = timelineEnd.substring(0, 10) + 'T23:59:59Z'
    } else {
      timelineEnd = timelineEnd.substring(0, 10) + 'T' + (lastHour < 10 ? '0' : '') + lastHour + ':00:00Z'
    }
    startDate = new Date(timelineStart);
    endDate = new Date(timelineEnd);
    numTicks = (endDate.getTime() - startDate.getTime()) / hourInMilliseconds
    if (numTicks < 4) numTicks = numTicks * 2
    if (numTicks > 8) numTicks = Math.ceil(numTicks / 2)
  }
  else if (sameMonth || endDate.getTime() - startDate.getTime() < monthInMilliseconds) {
    const earliestDay = parseInt(timelineStart.substring(8, 10))
    let lastDay = parseInt(timelineEnd.substring(8, 10)) + 1

    let month = parseInt(timelineEnd.substring(5, 7))
    let daysInMonth = new Date(timelineEnd.substring(0, 4), month, 0).getDate()
    if (lastDay > daysInMonth) {
      timelineEnd = timelineEnd.substring(0, 8) + `${daysInMonth}T23:59:59Z`
    } else {
      timelineEnd = timelineEnd.substring(0, 8) + (lastDay < 10 ? '0' : '') + lastDay + 'T00:00:00Z'
    }

    timelineStart = timelineStart.substring(0, 8) + (earliestDay < 10 ? '0' : '') + earliestDay + 'T00:00:00Z'
    startDate = new Date(timelineStart);
    endDate = new Date(timelineEnd);
    numTicks = (endDate.getTime() - startDate.getTime()) / dayInMilliseconds
    if (numTicks < 4) numTicks = numTicks * 2
    if (numTicks > 8) numTicks = Math.ceil(numTicks / 2)
  } else if (sameYear) {


    const earliestMonth = parseInt(timelineStart.substring(5, 7))
    let lastMonth = parseInt(timelineEnd.substring(5, 7)) + 1
    timelineStart = timelineStart.substring(0, 5) + (earliestMonth < 10 ? '0' : '') + earliestMonth + '-01T00:00:00Z'
    if (lastMonth > 12) {
      timelineEnd = timelineEnd.substring(0, 5) + '12-31T23:59:59Z'
    } else {
      timelineEnd = timelineEnd.substring(0, 5) + (lastMonth < 10 ? '0' : '') + lastMonth + '-01T00:00:00Z'
    }
    startDate = new Date(timelineStart);
    endDate = new Date(timelineEnd);
    numTicks = lastMonth - earliestMonth
    if (numTicks > 8) numTicks = Math.ceil(numTicks / 2)
  }

  let startTime = startDate.getTime();
  let endTime = endDate.getTime();

  const ticks = []

  for (let i = 0; i <= numTicks; i++) {
    const relativePosition = i / numTicks;
    const xPos = relativePosition * timelineWidth;

    // Timestamp for tick
    const tickTime = startTime + (relativePosition * (endTime - startTime));
    const date = new Date(tickTime);

    // Format date for label
    let label = formatDate(date, dateTimeFormat)
    if (!sameDay && (sameMonth || (endDate.getTime() - startDate.getTime() < monthInMilliseconds))) label = formatDate(date, 'day')  // 13, 14, 15
    else if (sameYear && !sameMonth) label = formatDate(date, 'month')  // april, may, june 
    ticks.push({ label: label, xPos: xPos, relativePosition: relativePosition, tickTime: tickTime })
  }



  // determine the time label that covers the entire range
  // for example: April 2024, 2025, 17 October 2024 : if the entire timeline is within one year, one month, one day then have a label indicate that 
  // and omit year, month and day from the tick labels and possibly the tooltip time indication

  let timelabel
  if (timelineStart.substring(0, 4) == timelineEnd.substring(0, 4)) {
    timelabel = timelineStart.substring(0, 4)
    if (timelineStart.substring(5, 7) == timelineEnd.substring(5, 7)) {
      timelabel = formatDateByGrain(timelineStart, 0, 8) // month
      if (timelineStart.substring(8, 10) == timelineEnd.substring(8, 10)) {
        timelabel = timelineStart.substring(8, 10) + ' ' + timelabel  // same day
        // add start and end time 
        timelabel = formatDate(timelineStart, 'short') + ' - ' + formatDate(timelineEnd, 'short') + ', ' + timelabel
      } else {
        timelabel = timelineStart.substring(8, 10) + '-' + timelineEnd.substring(8, 10) + ' ' + timelabel  // day
      }
    }
    else {
      timelabel = formatDateByGrain(timelineStart, 0, 8)
      // remove last 6 characters from timelabel
      timelabel = timelabel.substring(0, timelabel.length - 6)


      timelabel = timelabel + '-' + formatDateByGrain(timelineEnd, 0, 8)
    }
  } else {
    timelabel = timelineStart.substring(0, 4) + '-' + timelineEnd.substring(0, 4)
  }
  if (timelabel) {
    svg.append("text")
      .attr("x", timelineWidth / 2)
      .attr("y", 130)
      .attr("text-anchor", "middle")
      .attr("fill", "gray")
      .attr("class", "tooltip")
      .text(timelabel)
  }


  const xScale = d3.scaleTime()
    .domain([startTime, endTime])
    .range([0, width]);

  // Draw the horizontal timeline
  svg.append("line")
    .attr("x1", 0)
    .attr("x2", timelineWidth)
    .attr("y1", 50)
    .attr("y2", 50)
    .attr("stroke", timelineColor);
  let previousLabel
  for (let i = 0; i < ticks.length; i++) {

    const tick = ticks[i]
    // Create tick
    const tickie =
      svg.append("line")
        .attr("x1", tick.xPos)
        .attr("x2", tick.xPos)
        .attr("y1", 47)
        .attr("y2", 60)
        .attr("stroke", timelineColor);

    // Add label
    const textAnchor = (i == 0 ? "start" : (i == ticks.length - 1 ? "end" : "start"))  // the tick indicates the start of the new hour/day/month/year
    if (tick.label && tick.label != previousLabel) {


      svg.append("text")
        .attr("x", tick.xPos)
        .attr("y", 75)
        .attr("text-anchor", textAnchor)
        .attr("fill", "black")
        .text(tick.label);
    }
    previousLabel = tick.label
  }

  sortedSites.forEach((site, index) => {
    const siteTime = new Date(site.timestamp).getTime();
    if (siteTime < startTime || siteTime > endTime) { return }
    const relativePosition = (new Date(site.timestamp).getTime() - startTime) / (endTime - startTime);
    const xPos = xScale(new Date(site.timestamp));
    addMarker(site, xPos, svg, timelineColor, relativePosition);
  })
  if (withZoombox) {
    drawZoombox(svg, timelineStart, timelineEnd)
  }
}


const drawZoombox = (svg, timelineStart, timelineEnd) => {
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
    handleMoveOrResize(timelineStart, timelineEnd); // Function triggered on move or resize
  }

  rectangle.call(dragMove);

  // handle double click on rectangle
  rectangle.on("dblclick", function () {
    // TODO - zoom to rectangle
    console.log("double click on rectangle")
    zoomInOnZoombox(sortedSites, (rectX - minX) / (maxX - minX), rectWidth / (maxX - minX), timelineStart, timelineEnd)
  });

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
  function handleMoveOrResize(timelineStart, timelineEnd) {
    drawZoomedinProfile(sortedSites, (rectX - minX) / (maxX - minX), rectWidth / (maxX - minX), timelineStart, timelineEnd)
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
