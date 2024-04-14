import GeometryUtil from "leaflet-geometryutil";
import 'leaflet-polylinedecorator';
import { v4 as uuidv4 } from 'uuid';
import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate } = useDateTimeLibrary();

// TODO startSite and endSite should be startSiteId and endSiteId - do not rely on objects but on the hard, fixed ids
export function useTimelinesLibrary() {

  const getSortedSites = (allSites) => {
    return allSites.sort((a, b) => (new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()) ? 1 : -1)
  }

  const getSortedSitesInTimeline = (timeline, allSites) => {
    const timelineStartTime = new Date(timeline.startTimestamp).getTime()
    const timelineEndTime = new Date(timeline.endTimestamp).getTime()
    return getSortedSites(allSites).filter(site => new Date(site.timestamp).getTime() >= timelineStartTime
      && new Date(site.timestamp).getTime() <= timelineEndTime)
  }

  const getSortedTimelines = (theTimelines) => {
    return theTimelines.sort((a, b) => new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime())
  }

  const findTimelineForSite = (siteToLocate, allSortedSites, timelines) => {
    const sites = findTimelinesForSite(siteToLocate, allSortedSites, timelines)

    if (sites.length > 0) {
      return sites[0]
    }
    return null
  }


  const findTimelinesForSite = (siteToLocate, allSortedSites, timelines) => {
    // loop over timelines and find the timeline this site is part of ; 
    const timelinesForSite = []
    // iterate over timelines sorted by startTimestamp
    const sortedTimelines = getSortedTimelines(timelines)
    for (timeline of sortedTimelines) {
      // loop over sites
      let inRangeTimeline = false
      for (const site of allSortedSites) {
        if (site.id === timeline.startSiteId) { // start looking for site from the start of the timeline
          inRangeTimeline = true
        }
        if (inRangeTimeline)
          if (site.id === siteToLocate.id) {
            timelinesForSite.push(timeline)
          }
        if (inRangeTimeline && site.id === timeline.endSiteId) { // stop looking for site at the  end of the timeline
          break
        }
      }
    }
    return timelinesForSite
  }




  const getSitesPerTimes = (sites) => {
    const years = []
    const uniqueYears = [...new Set(sites.map(site => new Date(site.timestamp).getFullYear()))];
    for (const year of uniqueYears) {
      const yearNode = {
        label: year,
        data: year,
        children: []
      }
      const uniqueMonths = [...new Set(sites.filter(site => new Date(site.timestamp).getFullYear() === year).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(site => new Date(site.timestamp).toLocaleString('default', { month: 'long' }))
      )];
      for (const month of uniqueMonths) {
        const monthNode = {
          label: month,
          data: month,
          children: []
        }
        // iterate over all sites with a timestamp that matches the year and month
        const sitesWithYearAndMonth = sites.filter(site => new Date(site.timestamp).getFullYear() === year
          && new Date(site.timestamp).toLocaleString('default', { month: 'long' }) === month)
        // for all sites with the same year and month, add them to the month node
        const uniqueDays = [...new Set(sitesWithYearAndMonth.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(site => new Date(site.timestamp).getDate()))];
        //iterate over all unique days sorted by date and create a node for each day
        for (const day of uniqueDays) {
          const date = new Date(`${year}-${month}-${day}`)
          const dayNode = {
            label: formatDate(date, 'dow') + ' ' + day,
            data: day,
            children: []
          }
          // iterate over all sites with a timestamp that matches the year, month, and day, sorted by timestamp
          const sitesWithYearMonthAndDay = sitesWithYearAndMonth.filter(site => new Date(site.timestamp).getDate() === day).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          for (const site of sitesWithYearMonthAndDay) {
            dayNode.children.push(site)
          }
          monthNode.children.push(dayNode)
        }
        yearNode.children.push(monthNode)
      }
      years.push(yearNode)
    }
    return years
  }

  const createTimeline = (siteToStartAt, siteToEndAt, label, color) => {
    return {
      id: uuidv4(),
      startSiteId: siteToStartAt.id,
      endSiteId: siteToEndAt.id,
      startTimestamp: siteToStartAt.timestamp,
      endTimestamp: siteToEndAt.timestamp,
      label: label,
      color: color,
      width: 3,
      lineStyle: 'dashed'
    }
  }

  const createTimelinePer = (level, sites, timelines, map,context) => { // level = year, month, week, day; optional context = {year: , month: , day:}
    const sitesPerTimes = getSitesPerTimes(sites)
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'brown', 'pink', 'gray', 'black', 'gold', 'silver', 'aqua', 'fuchsia', 'lime', 'maroon', 'navy', 'olive', 'purple', 'teal']
    let colorIndex = 0
    for (const year of sitesPerTimes) {
      if (!context.year || context.year == year.data ) // if there is a year set in context then then only process that year
      if (level === 'year') {
        const siteToStartAt = year.children[0].children[0].children[0] // first month, first day, first site
        const lastMonthIndex = year.children.length - 1
        const lastDayIndex = year.children[lastMonthIndex].children.length - 1
        const lastSiteIndex = year.children[lastMonthIndex].children[lastDayIndex].children.length - 1
        const siteToEndAt = year.children[lastMonthIndex].children[lastDayIndex].children[lastSiteIndex] // last month, last day, last site
        timelines.push(createTimeline(siteToStartAt, siteToEndAt, `the year ${year.label}`, colors[colorIndex++]))
        if (colorIndex >= colors.length) { colorIndex = 0 }
      } else for (const month of year.children) {
        if (!context.month || context.month == month.data ) 
        if (level === 'month') {
          const siteToStartAt = month.children[0].children[0] // first day, first site
          const lastDayIndex = month.children.length - 1
          const lastSiteIndex = month.children[lastDayIndex].children.length - 1
          const siteToEndAt = month.children[lastDayIndex].children[lastSiteIndex] // last day, last site
          timelines.push(createTimeline(siteToStartAt, siteToEndAt, `${month.label} ${year.label}`, colors[colorIndex++]))
          if (colorIndex >= colors.length) { colorIndex = 0 }
        } else for (const day of month.children) {
          if (!context.day || context.day == day.data ) 
          if (level === 'day') {
            const siteToStartAt = day.children[0] // first site
            const lastSiteIndex = day.children.length - 1
            const siteToEndAt = day.children[lastSiteIndex] // last site
            timelines.push(createTimeline(siteToStartAt, siteToEndAt, `${day.label} ${month.label} ${year.label}`, colors[colorIndex++]))
            if (colorIndex >= colors.length) { colorIndex = 0 }
          }
        }
      }
    }
    // refresh timelines 
    refreshTimelines(sites, timelines, map)
  }

  const startTimelineAtSite = (siteToStartAt, allSites, timelines, map) => {
    const sites = getSortedSites(allSites)
    //   allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)

    //create new timeline - provided site is not currently in another timeline

    // check if site is in another timeline
    const theTimeline = findTimelineForSite(siteToStartAt, sites, timelines)

    if (theTimeline && theTimeline.endSiteId != siteToStartAt.id) { // the site is already in another timeline and not at its end
      // TODO cater for multiple timelines that a site can be part of - the start of one and the end of another; then we should not proceed 
      return
    }
    // collection of the startSiteId values from all timelines
    const allStartSiteIds = timelines.map(timeline => timeline.startSiteId)
    // find the first site in sites that comes after siteToStartAt and is the start of (a subsequent) timeline
    let nextSiteInTimeline = sites.slice(sites.indexOf(siteToStartAt) + 1).find(site => allStartSiteIds.indexOf(site.id) > -1)
    if (!nextSiteInTimeline) {
      nextSiteInTimeline = sites[sites.length - 1]
    }
    const newTimeline = {
      id: uuidv4(),
      startSiteId: siteToStartAt.id,
      endSiteId: nextSiteInTimeline.id,
      startTimestamp: siteToStartAt.timestamp,
      endTimestamp: nextSiteInTimeline.timestamp,
      label: `from ${siteToStartAt.label}`,
      color: 'green', // TODO some other color than the color of theTimeline if theTimeline exists
      width: 3,
      lineStyle: 'dashed'
    }
    timelines.push(newTimeline)

    // refresh timelines 
    refreshTimelines(allSites, timelines, map)
    return newTimeline
  }


  const endTimelineAtSite = (siteToEndAt, allSites, timelines, map) => {
    //const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
    const sites = getSortedSites(allSites)

    const theTimeline = findTimelineForSite(siteToEndAt, sites, timelines)

    if (!theTimeline || theTimeline.startSiteId == siteToEndAt.id || theTimeline.endSiteId == siteToEndAt.id) { // the site not in a timeline or it is already the end or it is the start
      return
    }
    theTimeline.endSiteId = siteToEndAt.id
    theTimeline.endTimestamp = siteToEndAt.timestamp
    // refresh timelines 
    refreshTimelines(allSites, timelines, map)
  }

  const fuseTimelinesAtSite = (siteToFuseAt, allSites, timelines, map) => {
    if (!timelines || timelines.length == 0) { return }

    //    const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
    const sites = getSortedSites(allSites)
    const theTimelines = findTimelinesForSite(siteToFuseAt, sites, timelines)

    if (!theTimelines || theTimelines.length != 2) { return } // there is no timeline to split or the site is not in exactly two timelines
    const sortedTimelines = getSortedTimelines(timelines)
    const firstTimeline = sortedTimelines[0]
    const secondTimeline = sortedTimelines[1]
    firstTimeline.endSiteId = secondTimeline.endSiteId
    firstTimeline.endTimestamp = secondTimeline.endTimestamp
    firstTimeline.label += ' *'

    timelines.splice(timelines.indexOf(secondTimeline), 1)

    refreshTimelines(allSites, timelines, map)

  }

  const splitTimelineAtSiteX = (siteToSplitAt, allSites, timelines, map) => {

    //const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
    const sites = getSortedSites(allSites)
    if (timelines.length === 0) {
      // create two timelines, from the first site to siteToSplitAt and the second from the siteToSplitAt to the last site
      timelines.push({
        id: uuidv4(),
        //startSite: sites[0],
        //endSite: siteToSplitAt,
        startSiteId: sites[0].id,
        endSiteId: siteToSplitAt.id,
        startTimestamp: sites[0].timestamp,
        endTimestamp: siteToSplitAt.timestamp,
        label: `from ${sites[0].label} to ${siteToSplitAt.label}`,
        color: 'green',
        width: 3,
        lineStyle: 'dashed'

      })
      timelines.push({
        id: uuidv4(),
        // startSite: siteToSplitAt,
        startSiteId: siteToSplitAt.id,
        //endSite: sites[sites.length - 1],
        endSiteId: sites[sites.length - 1].id,
        startTimestamp: siteToSplitAt.timestamp,
        endTimestamp: sites[sites.length - 1].timestamp,
        label: `from ${siteToSplitAt.label} to ${sites[sites.length - 1].label}`,
        color: 'red',
        width: 3,
        lineStyle: 'dashed'

      })

      refreshTimelines(allSites, timelines, map)
      return
    }
    else {
      // loop over timelines and find the timeline this site is part of ; 
      // NOTE: ignore and return when this site already is the end and start of timelines!!
      const theTimeline = findTimelineForSite(siteToSplitAt, sites, timelines)

      if (!theTimeline) { return } // there is not timeline to split

      if (theTimeline.endSiteId == siteToSplitAt.id || theTimeline.startSiteId == siteToSplitAt.id) {
        return
      } // we do not split a timeline at its beginning or end

      const originalEndsite = theTimeline.endSite
      theTimeline.endSite = siteToSplitAt // the timeline is now ended at the siteToSplitAt
      theTimeline.endSiteId = siteToSplitAt.id // the timeline is now ended at the siteToSplitAt
      theTimeline.endTimestamp = siteToSplitAt.timestamp
      theTimeline.label + '*' // to indicate that this timeline has been influenced by the split
      timelines.push({
        id: uuidv4(),
        //  startSite: siteToSplitAt,
        // endSite: originalEndsite,
        startSiteId: siteToSplitAt.id,
        endSiteId: originalEndsite.id,
        startTimestamp: siteToSplitAt.timestamp,
        endTimestamp: originalEndsite.timestamp,
        label: `from ${siteToSplitAt.label} to ${originalEndsite.label}`,
        color: 'yellow', // TODO pick a color that is different from the theTimeLine's color 
        width: 3,
        lineStyle: 'dashed'
      })
      refreshTimelines(allSites, timelines, map)
      //TODO what if the siteToSplitAt is not in any of the timelines? start a new timeline - but where does it start?
      console.log('Split Timeline at site ', siteToSplitAt);
    }
  }


  let timeline, timelineDecorator
  let drawnTimelines = [] // the currently created polylines on the map that represent timelines
  let drawnTimelineDecorators = []
  const drawTimeline = (timeline, sites, map, timelines) => {

    const polyline = L.polyline(sites.map(site => [site.geoJSON.features[0].geometry.coordinates[1], site.geoJSON.features[0].geometry.coordinates[0]])
      , {
        color: timeline.color ? timeline.color : 'red'
        , weight: timeline.width ? timeline.width : 3


        , contextmenu: true, contextmenuInheritItems: false,
        contextmenuItems: [{
          text: 'Edit timeline',
          index: 0,
          callback: (context) => {
            // open timeline editor ??
            eventCallback({ type: 'editTimeline', timeline: timeline })
          }
        }, {
          text: 'Delete timeline',
          index: 1,
          callback: (context) => {
            deleteTimeline(timeline)
          }
        }, {
          text: 'Snip timeline',
          index: 2,
          callback: (context) => {
            const latlng = context.latlng
            snipTimelineFromLatLng(latlng, timeline, polyline, sites, map, _timelines)
          }
        }, {
          text: 'Create Site in Timeline',
          index: 3,
          callback: (context) => {
            const latlng = context.latlng
            createSiteInTimeline(latlng, timeline, polyline, sites, map, _timelines)
          }
        }
          // , {
          //    separator: true,
          //    index: 1
          //  }
        ]
      }).addTo(map);

    if (timeline.lineStyle == 'dotted') {
      polyline.setStyle({ dashArray: '1, 10' });
    } else if (timeline.lineStyle == 'dashed') {
      polyline.setStyle({ dashArray: '5,9' });
    }


    // see https://bbecquet.github.io/Leaflet.PolylineDecorator/ and https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/example/example.js 
    // TODO use definition of timeline to create decorator     
    timelineDecorator = L.polylineDecorator(polyline, {
      patterns: [
        { offset: 25, repeat: 80, symbol: L.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 1, weight: 0 } }) }
      ]
    }).addTo(map);

    // Assuming polyline is already added to the map
    polyline.on('mouseover', function (e) {
      const layer = e.target;
      layer.bindTooltip("dummy", { permanent: false, direction: 'auto' }).openTooltip(); // not sure why this is needed, but if I remove it, the tooltip doesn't appear in the right place (where the mouse hover took place)
      const clickLatLng = e.latlng;
      const clickContent = timeline.label
      polyline.bindTooltip(clickContent).openTooltip(clickLatLng);
    });
    return { polyline, timelineDecorator }
  }

  const deleteTimeline = (timeline) => {
    const timelineIndex = _timelines.findIndex(tl => tl.startSiteId === timeline.startSiteId);
    _timelines.splice(timelineIndex, 1);
    refreshTimelines(_allSites, _timelines, _map)
  }

  const refreshTimelines = (allSites, timelines, map) => {
    hideTimelines()
    drawTimelinesX(allSites, timelines, map)
  }

  let _timelines, _allSites, _map

  const drawTimelinesX = (allSites, timelines, map) => {
    // loop over all sites ordered by timestamp
    _timelines = timelines
    _allSites = allSites
    _map = map

    const sites = getSortedSites(allSites)
    const siteIds = sites.map(site => site.id)
    if (timelines && timelines.length > 0) {
      for (const timeline of getSortedTimelines(timelines)) {
        // TODO find site in array of sites properly - this does not work!
        const startIndex = siteIds.indexOf(timeline.startSiteId)
        const endIndex = siteIds.indexOf(timeline.endSiteId)
        console.log(`${timeline.label} ${startIndex} - ${endIndex}`)
        const { polyline, timelineDecorator } = drawTimeline(timeline, sites.slice(startIndex === -1 ? 0 : startIndex, endIndex === -1 ? sites.length : endIndex + 1), map)
        polyline.timeline = timeline
        drawnTimelines.push(polyline)
        drawnTimelineDecorators.push(timelineDecorator)
      }
    } else {
      const dummyEndToEndTimeline = {
        // startSite: sites[0],
        // endSite: sites[sites.length - 1],
        label: `from ${sites[0].label} to ${sites[sites.length - 1].label}`,
        color: 'blue',
        startTimestamp: sites[0].timestamp,
        endTimestamp: sites[sites.length - 1].timestamp
        , width: 3
        , lineStyle: 'dashed'
      }
      const { polyline, timelineDecorator } = drawTimeline(dummyEndToEndTimeline, sites, map)

      drawnTimelines.push(polyline)
      drawnTimelineDecorators.push(timelineDecorator)
    }
  }

  const highlightTimeline = (timelineStartSiteId) => {
    const polyline = drawnTimelines.find(drawnTimeline => drawnTimeline.timeline.startSiteId === timelineStartSiteId)
    if (polyline) {
      polyline.setStyle({
        color: 'white'
        , weight: 7
        , dashArray: '3,  10'
      });
    }
  }

  const unhighlightTimeline = (timelineStartSiteId) => {
    const polyline = drawnTimelines.find(drawnTimeline => drawnTimeline.timeline.startSiteId === timelineStartSiteId)
    if (polyline) {
      polyline.setStyle({
        color: polyline.timeline.color
        , weight: polyline.timeline.width ? polyline.timeline.width : 3
        , dashArray: null
      })

      if (polyline.timeline.lineStyle == 'dotted') {
        polyline.setStyle({ dashArray: '1, 10' });
      } else if (polyline.timeline.lineStyle == 'dashed') {
        polyline.setStyle({ dashArray: '5,9' });
      }
    }
  }


  const hideTimelines = () => {
    drawnTimelines.forEach(timeline => {
      timeline.remove();
    })
    drawnTimelines = []
    drawnTimelineDecorators.forEach(timelineDecorator => {
      timelineDecorator.remove();
    })
    drawnTimelineDecorators = []
  }

  function findClosestSegment(polyline, clickLatLng) {
    const latLngs = polyline.getLatLngs();
    let closestSegment, closestSegmentFound = false;

    for (const tolerance of [0.01, 0.05, 0.1, 0.2, 0.3]) {
      for (let i = 0; i < latLngs.length - 1; i++) {
        const segmentStart = latLngs[i];
        const segmentEnd = latLngs[i + 1];
        if (GeometryUtil.belongsSegment(clickLatLng, segmentStart, segmentEnd, tolerance)) {
          console.log(`clicked belongs to this segment ${segmentStart.lng},${segmentStart.lat}`)
          closestSegment = [segmentStart, segmentEnd];
          closestSegmentFound = true
          break;
        }
      }
      if (closestSegmentFound) {
        break;
      }
    }
    return closestSegment;
  }

  const createSiteInTimeline = (latlng, timeline, polyline, sites, map, timelines) => {
    const closestSegment = findClosestSegment(polyline, latlng);

    if (closestSegment) {

      // find the site at the start and the end of the segment
      const startSite = sites.find(site => site.geoJSON.features[0].geometry.coordinates[1] === closestSegment[0].lat && site.geoJSON.features[0].geometry.coordinates[0] === closestSegment[0].lng);
      const endSite = sites.find(site => site.geoJSON.features[0].geometry.coordinates[1] === closestSegment[1].lat && site.geoJSON.features[0].geometry.coordinates[0] === closestSegment[1].lng);

      console.log('create site in timeline between startSite', startSite.timestamp, 'endSite', endSite.timestamp)
      // calculate newTimestamp as the midpoint between startSite.timestamp and endSite.timestamp
      const midpointTime = (new Date(startSite.timestamp).getTime() + new Date(endSite.timestamp).getTime()) / 2;
      const centerPointDate = new Date(midpointTime);
      eventCallback({ type: 'createSite', latlng: latlng, timestamp: centerPointDate, label: `create in timeline ${timeline.label}` })
    }

  }

  const snipTimelineFromLatLng = (latlng, timeline, polyline, sites, map, timelines) => {
    const closestSegment = findClosestSegment(polyline, latlng);

    if (closestSegment) {

      // find the site at the start and the end of the segment
      const startSite = sites.find(site => site.geoJSON.features[0].geometry.coordinates[1] === closestSegment[0].lat && site.geoJSON.features[0].geometry.coordinates[0] === closestSegment[0].lng);
      const endSite = sites.find(site => site.geoJSON.features[0].geometry.coordinates[1] === closestSegment[1].lat && site.geoJSON.features[0].geometry.coordinates[0] === closestSegment[1].lng);

      console.log('snip timeline startSite', startSite, 'endSite', endSite)
      const cloneTimeline = Object.assign({}, timeline);
      cloneTimeline.id = uuidv4()
      cloneTimeline.startSiteId = endSite.id;
      cloneTimeline.startTimestamp = endSite.timestamp;
      cloneTimeline.label = `from  ${endSite.label}`
      timelines.push(cloneTimeline)
      timeline.endSiteId = startSite.id;
      timeline.endTimestamp = startSite.timestamp;
      timeline.label += ` *`

      refreshTimelines(sites, timelines, map)
    }
  }


  let eventCallback
  const registerEventCallback = (callback) => {
    eventCallback = callback
  }

  return { endTimelineAtSite, startTimelineAtSite, splitTimelineAtSiteX, drawTimelinesX, hideTimelines, refreshTimelines, highlightTimeline, unhighlightTimeline, deleteTimeline, registerEventCallback, fuseTimelinesAtSite, getSortedSitesInTimeline, createTimelinePer };
}


