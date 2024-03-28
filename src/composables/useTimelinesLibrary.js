import GeometryUtil from "leaflet-geometryutil";
import 'leaflet-polylinedecorator';

export function useTimelinesLibrary() {
  const splitTimelineAtSiteX = (siteToSplitAt, allSites, timelines, map) => {

    // const latlng = site.geoJSON.features[0].geometry.coordinates
     const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
   
     // let firstIndex = sites.length
     // let lastIndex = 0
     let timelineFound = false
     let theTimeline
     
     // find the timeline this site is part of
   

     if (timelines.length === 0) {
       // create two timelines, from the first site to siteToSplitAt and the second from the siteToSplitAt to the last site
       timelines.push({
         startSite: sites[0],
         endSite: siteToSplitAt,
         label: `from ${sites[0].label} to ${siteToSplitAt.label}`,
         color: 'green'
       })
       timelines.push({
         startSite: siteToSplitAt,
         endSite: sites[sites.length - 1],
         label: `from ${siteToSplitAt.label} to ${sites[sites.length - 1].label}`,
         color:'red' 
       })
       hideTimelines()
       drawTimelinesX(allSites, timelines,map)
       return
     }  
     else {
       // loop over timelines and find the timeline this site is part of ; 
       // NOTE: ignore and return when this site already is the end and start of timelines!!
   
       for( let i = 0; i < timelines.length; i++ ) {
         const timeline =   timelines[i]
         // loop over sites
         let inRangeTimeline = false
         for (const site of sites) {
           if (site === timeline.startSite) { // start looking for siteToSplitAt from the start of the timeline
             inRangeTimeline = true
           }
           if (site === siteToSplitAt) {
             timelineFound = true
             if (site == timeline.endSite || site == timeline.startSite) {
               // we do not split the timeline at its beginning or end
               return
             }
             console.log(`site is found in time line ${timeline.startSite?.id} ${timeline.endSite?.id}`)
             theTimeline = timeline          
           }
           if (site === timeline.endSite) { // stop looking for siteToSplitAt at the  end of the timeline
             break
           }
         }
         if (timelineFound) {
           break
         }
       }
     }
   
     if (timelineFound) {
       const originalEndsite = theTimeline.endSite
       theTimeline.endSite = siteToSplitAt // the timeline is now ended at the siteToSplitAt
       theTimeline.label +'*' // to indicate that this timeline has been influenced by the split
       timelines.push({
         startSite: siteToSplitAt,
         endSite: originalEndsite,
         label: `from ${siteToSplitAt.label} to ${originalEndsite.label}`,
         color:'yellow' 
       })
       hideTimelines()
       drawTimelinesX(allSites, timelines,map)
     }
     //TODO what if the siteToSplitAt is not in any of the timelines? start a new timeline - but where does it start?
     console.log('Split Timeline at site ', siteToSplitAt);
   }
   
   
   let timeline, timelineDecorator
   let drawnTimelines = [] // the currently created polylines on the map that represent timelines
   let drawnTimelineDecorators = []
   const drawTimeline = (timeline, sites,map) => {
   
     const polyline = L.polyline(sites.map(site => [site.geoJSON.features[0].geometry.coordinates[1], site.geoJSON.features[0].geometry.coordinates[0]])
       , {
         color: timeline.color?timeline.color:'red', weight: 5, contextmenu: true, contextmenuInheritItems: false,
         contextmenuItems: [{
           text: 'Split timeline',
           index: 0,
           callback: (context) => {
             const latlng = context.latlng
   
             const closestSegment = findClosestSegment(polyline, latlng);
   
             //TODO  split polyline in two - one ending at the first pair of the closest segment, the other starting at the second pair 
             console.log('Closest segment:', closestSegment);
   
             // Optionally, highlight or mark the closest segment on the map
             if (closestSegment) {
               L.polyline([closestSegment[0], closestSegment[1]], { color: 'blue' }).addTo(map);
             }
           }
         }, {
           separator: true,
           index: 1
         }]
       }).addTo(map);
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
   
   
   const drawTimelinesX = (allSites, timelines,map) => {
     // loop over all sites ordered by timestamp
     const sites = allSites.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
   
   
     if (timelines && timelines.length > 0) {
   
   
       // loop over all timelines
   
       for (const timeline of timelines.sort((a, b) => (a.startSite == null || (a.startSite.timestamp > b.startSite?.timestamp)) ? 1 : -1)) {
         // TODO find site in array of sites properly - this does not work!
         const startIndex = timeline.startSite==null? 0: sites.indexOf(timeline.startSite)
         const endIndex = timeline.endSite ==null?sites.length:sites.indexOf(timeline.endSite)
         console.log(`${timeline.label} ${startIndex} - ${endIndex}`)
         const { polyline, timelineDecorator } = drawTimeline(timeline, sites.slice(startIndex === -1 ? 0 : startIndex, endIndex === -1 ? sites.length : endIndex + 1), map)
         drawnTimelines.push(polyline)
         drawnTimelineDecorators.push(timelineDecorator)
       }
     } else {
       const dummyEndToEndTimeline = {
         startSite: sites[0],
         endSite: sites[sites.length - 1],
         label: `from ${sites[0].label} to ${sites[sites.length - 1].label}`,
         color:'blue' 
       }
       const { polyline, timelineDecorator } = drawTimeline(dummyEndToEndTimeline, sites)
       drawnTimelines.push(polyline)
       drawnTimelineDecorators.push(timelineDecorator)
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
   
  return { splitTimelineAtSiteX, drawTimelinesX,hideTimelines };
}


