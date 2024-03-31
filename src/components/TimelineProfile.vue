<template>
  TimelineProfile for {{ thetimeline?.label }}
  <svg id="svg-timeline-root" width="900" height="150" style="padding-right: 0%;">
    <g transform="scale(0.95)">
      <g id="svg-timeline" transform="translate(40,1)">
      </g>
    </g>
  </svg>
</template>
<script setup>

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate } = useDateTimeLibrary();

const props = defineProps(['thetimeline', 'sites']);
const emit = defineEmits(['clickSite', 'dblclickSite']);

onMounted(() => {
  drawTimelineProfile()
});

watch(() => props.thetimeline, (newValue, oldValue) => {
  drawTimelineProfile()
});


const svgNamespace = 'http://www.w3.org/2000/svg';

const addMarker = (site, position, svg, timelineColor) => {
  // Calculate vertical line position
  const yPos = 50; // Base Y position for the line
  const lineLength = 15; // Length of the vertical line

  // Create the vertical line
  const markerLine = document.createElementNS(svgNamespace, 'line');
  markerLine.setAttribute('x1', position);
  markerLine.setAttribute('y1', yPos - lineLength);
  markerLine.setAttribute('x2', position);
  markerLine.setAttribute('y2', yPos);
  markerLine.setAttribute('stroke', timelineColor);
  svg.appendChild(markerLine);

  // Create the circle on top of the line
  const circle = document.createElementNS(svgNamespace, 'circle');
  circle.setAttribute('cx', position);
  circle.setAttribute('cy', yPos - lineLength);
  circle.setAttribute('r', '5 '); // Radius of the circle
  circle.setAttribute('fill', timelineColor);
  svg.appendChild(circle);
  return circle
};

const getSortedSites = (allSites) => {
  return allSites.sort((a, b) => (new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()) ? 1 : -1)
}
const drawTimelineProfile = () => {
  // sort sites by timestamp
  const sortedSites = getSortedSites(props.sites);
  // then find the starting and ending timestamps of the timeline
  const timelineStart = props.thetimeline.startTimestamp
  const timelineEnd = props.thetimeline.endTimestamp

  const svg = document.getElementById('svg-timeline');
  // clean all children under svg
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }



  const startTime = new Date(timelineStart).getTime();
  const endTime = new Date(timelineEnd).getTime();
  const timelineWidth = 0.9 * 900 //parseInt(svg.getAttribute('width'));

  // Draw the timeline
  const line = document.createElementNS(svgNamespace, 'line');
  line.setAttribute('x1', '0');
  line.setAttribute('y1', '50');
  line.setAttribute('x2', timelineWidth);
  line.setAttribute('y2', '50');
  line.setAttribute('stroke', props.thetimeline.color);
  svg.appendChild(line);

  // Create ticks and labels
  // TODO depending on how far start and end are from each other (years, months, etc.), use different numbers of ticks and different labels
  // use hours when the start and end are close to each other, use months when the start and end are far apart
  const numTicks = 5;
  for (let i = 0; i <= numTicks; i++) {
    const relativePosition = i / numTicks;
    const xPos = relativePosition * timelineWidth;

    // Timestamp for tick
    const tickTime = startTime + (relativePosition * (endTime - startTime));
    const date = new Date(tickTime);

    // Format date for label
    const options = { month: 'short', day: 'numeric' };
    const label = date.toLocaleDateString('en-US', options);

    // Create tick
    const tick = document.createElementNS(svgNamespace, 'line');
    tick.setAttribute('x1', xPos);
    tick.setAttribute('y1', '47');
    tick.setAttribute('x2', xPos);
    tick.setAttribute('y2', '60');
    tick.setAttribute('stroke', 'black');
    svg.appendChild(tick);

    // Create tick label
    const tickLabel = document.createElementNS(svgNamespace, 'text');
    tickLabel.setAttribute('x', xPos);
    tickLabel.setAttribute('y', '75');
    tickLabel.setAttribute('fill', 'black');
    tickLabel.setAttribute('text-anchor', 'middle');
    tickLabel.textContent = label;
    svg.appendChild(tickLabel);
  }

  sortedSites.forEach((site, index) => {

    const siteTime = new Date(site.timestamp).getTime();
    if (siteTime < startTime || siteTime > endTime) { return }
    const relativePosition = (new Date(site.timestamp).getTime() - startTime) / (endTime - startTime);
    const xPos = relativePosition * timelineWidth;
    const marker = addMarker(site, xPos, svg, props.thetimeline.color);

    // Create tooltip
    const tooltip = document.createElementNS(svgNamespace, 'text');
    tooltip.setAttribute('x', xPos);
    tooltip.setAttribute('y', '25');
    tooltip.setAttribute('fill', 'black');
    tooltip.setAttribute('text-anchor', 'middle');
    tooltip.setAttribute('class', 'tooltip');
    tooltip.textContent = site.label + ' (' + formatDate(site.timestamp) + ')'; // use appropriate date format style for range covered by timeline (and current scaling)
    tooltip.style.visibility = 'hidden';
    svg.appendChild(tooltip);

    // Hover events for tooltip
    marker.addEventListener('mouseenter', () => tooltip.style.visibility = 'visible');
    marker.addEventListener('mouseleave', () => tooltip.style.visibility = 'hidden');
    marker.addEventListener('click', () => {
      console.log(`click for ${site.label} and id ${site.id}`)
      emit('clickSite', { site: site })
    });
    marker.addEventListener('dblclick', () => {
      console.log(`dblclick for ${site.label} and id ${site.id}`)
      emit('dblclickSite', { site: site })
    });

  });

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
