import GeometryUtil from "leaflet-geometryutil";
import 'leaflet-polylinedecorator';

// TODO startSite and endSite should be startSiteId and endSiteId - do not rely on objects but on the hard, fixed ids
export function useTimelinesLibrary() {

  const findTimelineForSite = (siteToLocate, allSortedSites, timelines) => {
    // loop over timelines and find the timeline this site is part of ; 
    for (let i = 0; i < timelines.length; i++) {
      const timeline = timelines[i]
      // loop over sites
      let inRangeTimeline = false
      for (const site of allSortedSites) {
        if (site.id === timeline.startSiteId) { // start looking for site from the start of the timeline
          inRangeTimeline = true
        }
        if (inRangeTimeline)
          if (site.id === siteToLocate.id) {
            return timeline
          }
        if (inRangeTimeline && site.id === timeline.endSiteId) { // stop looking for site at the  end of the timeline
          break
        }
      }
    }

    return null
  }

  const startTimelineAtSite = (siteToStartAt, allSites, timelines, map) => {
    const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)

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

    timelines.push({
      startSiteId: siteToStartAt.id,
      endSiteId: nextSiteInTimeline.id,
      startTimestamp: siteToStartAt.timestamp,
      endTimestamp: nextSiteInTimeline.timestamp,
      label: `from ${siteToStartAt.label}`,
      color: 'green' // TODO some other color than the color of theTimeline if theTimeline exists
    })

    // refresh timelines 
    refreshTimelines(allSites, timelines, map)
  }


  const endTimelineAtSite = (siteToEndAt, allSites, timelines, map) => {
    const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)

    const theTimeline = findTimelineForSite(siteToEndAt, sites, timelines)

    if (!theTimeline || theTimeline.startSiteId == siteToEndAt.id || theTimeline.endSiteId == siteToEndAt.id) { // the site not in a timeline or it is already the end or it is the start
      return
    }
    theTimeline.endSiteId = siteToEndAt.id
    theTimeline.endTimestamp = siteToEndAt.timestamp
    // refresh timelines 
    refreshTimelines(allSites, timelines, map)
  }

  const splitTimelineAtSiteX = (siteToSplitAt, allSites, timelines, map) => {

    const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
    if (timelines.length === 0) {
      // create two timelines, from the first site to siteToSplitAt and the second from the siteToSplitAt to the last site
      timelines.push({
        startSite: sites[0],
        endSite: siteToSplitAt,
        startSiteId: sites[0].id,
        endSiteId: siteToSplitAt.id,
        startTimestamp: sites[0].timestamp,
        endTimestamp: siteToSplitAt.timestamp,
        label: `from ${sites[0].label} to ${siteToSplitAt.label}`,
        color: 'green'
      })
      timelines.push({
        startSite: siteToSplitAt,
        startSiteId: siteToSplitAt.id,
        endSite: sites[sites.length - 1],
        endSiteId: sites[sites.length - 1].id,
        startTimestamp: siteToSplitAt.timestamp,
        endTimestamp: sites[sites.length - 1].timestamp,
        label: `from ${siteToSplitAt.label} to ${sites[sites.length - 1].label}`,
        color: 'red'
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
        startSite: siteToSplitAt,
        endSite: originalEndsite,
        startSiteId: siteToSplitAt.id,
        endSiteId: originalEndsite.id,
        startTimestamp: siteToSplitAt.timestamp,
        endTimestamp: originalEndsite.timestamp,
        label: `from ${siteToSplitAt.label} to ${originalEndsite.label}`,
        color: 'yellow' // TODO pick a color that is different from the theTimeLine's color 
      })
      refreshTimelines(allSites, timelines, map)
      //TODO what if the siteToSplitAt is not in any of the timelines? start a new timeline - but where does it start?
      console.log('Split Timeline at site ', siteToSplitAt);
    }
  }


  let timeline, timelineDecorator
  let drawnTimelines = [] // the currently created polylines on the map that represent timelines
  let drawnTimelineDecorators = []
  const drawTimeline = (timeline, sites, map) => {

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

          }
        }, {
          text: 'Delete timeline',
          index: 1,
          callback: (context) => {
            deleteTimeline(timeline)
          }
        }, {
          text: 'Split timeline',
          index: 2,
          callback: (context) => {
            const latlng = context.latlng
            const closestSegment = findClosestSegment(polyline, latlng);
            //TODO  split polyline in two - one ending at the first pair of the closest segment, the other starting at the second pair 
            console.log('Closest segment:', closestSegment);

            // Optionally, highlight or mark the closest segment on the map
            // TODO is not closestSegment then try again with higher tolerance
            if (closestSegment) {
              L.polyline([closestSegment[0], closestSegment[1]], { color: 'blue' }).addTo(map);
            }
          }
        }
          // , {
          //    separator: true,
          //    index: 1
          //  }
        ]
      }).addTo(map);

      if (timeline.lineStyle == 'dotted') {
        polyline.setStyle({dashArray: '1, 10'});
      } else       if (timeline.lineStyle == 'dashed') {
        polyline.setStyle({dashArray: '5,9'});
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
    const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
    const siteIds = sites.map(site => site.id)
    if (timelines && timelines.length > 0) {
      for (const timeline of timelines.sort((a, b) => (a.startTimestamp > b.startTimestamp ? 1 : -1))) {
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
        startSite: sites[0],
        endSite: sites[sites.length - 1],
        label: `from ${sites[0].label} to ${sites[sites.length - 1].label}`,
        color: 'blue',
        startTimestamp: sites[0].timestamp,
        endTimestamp: sites[sites.length - 1].timestamp
      }
      const { polyline, timelineDecorator } = drawTimeline(dummyEndToEndTimeline, sites, map)

      drawnTimelines.push(polyline)
      drawnTimelineDecorators.push(timelineDecorator)
    }
  }

  const highlightTimeline = (timelineStartSiteId) => {
    const polyline = drawnTimelines.find(drawnTimeline => drawnTimeline.timeline.startSiteId === timelineStartSiteId)
    if (polyline) {
      polyline.setStyle({ color: 'red' })
    }
  }

  const unhighlightTimeline = (timelineStartSiteId) => {
    const polyline = drawnTimelines.find(drawnTimeline => drawnTimeline.timeline.startSiteId === timelineStartSiteId)
    if (polyline) {
      polyline.setStyle({ color: polyline.timeline.color })
    }
  }


  const hideTimelines = () => {

    // loop over all timelines and remove
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
    let closestSegment = null;
    // Iterate through each pair of points
    for (let i = 0; i < latLngs.length - 1; i++) {
      const segmentStart = latLngs[i];
      const segmentEnd = latLngs[i + 1];
      if (GeometryUtil.belongsSegment(clickLatLng, segmentStart, segmentEnd, 0.01)) {
        console.log(`clicked belongs to this segment ${segmentStart.lng},${segmentStart.lat}`)
        closestSegment = [segmentStart, segmentEnd];
        break;
      }
    }
    return closestSegment;
  }

  return { endTimelineAtSite, startTimelineAtSite, splitTimelineAtSiteX, drawTimelinesX, hideTimelines, refreshTimelines, highlightTimeline, unhighlightTimeline, deleteTimeline };
}


