import GeometryUtil from "leaflet-geometryutil";
import 'leaflet-polylinedecorator';
import { v4 as uuidv4 } from 'uuid';
import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate } = useDateTimeLibrary();

// import { useStorieStore } from "@/store/storiesStore";
// const storiesStore = useStorieStore()
// const currentStory = computed(() => storiesStore.currentStory)
// const sitesData = computed(() => currentStory.value.sites);
// const storyTags = computed(() => currentStory.value.tags);
// const storyReadOnly = computed(() => currentStory.value.mapConfiguration.readOnly);



export function useToursLibrary() {

  const getSortedSites = (allSites) => {


    return allSites.sort((a, b) => (new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime()) ? 1 : -1)
  }

  const getSortedSitesInTour = (tour, allSites) => {
    // get sites from allSites where site.id in tour.sites 
    if (!tour || !tour.sites) {
      return []
    }
    return getSortedSites(allSites).filter(site => tour.sites.includes(site.id))
  }


  const removeSitesFromTour = (siteIds, tourId, story) => {
    const tour =
    story.mapConfiguration.tours.filter(tour => tour.id == tourId)[0]
      if (tour) {
        tour.sites = tour.sites.filter(siteId => !siteIds.includes(siteId))
      }
      console.log(tour.sites)
    
  }

  let tour, tourDecorator
  let drawnTours = [] // the currently created polylines on the map that represent tours
  let drawnTourDecorators = []
  const drawTour = (tour, sites, map, tours) => {

    const polyline = L.polyline(sites.map(site => [site.geoJSON.features[0].geometry.coordinates[1], site.geoJSON.features[0].geometry.coordinates[0]])
      , {
        color: tour.color ? tour.color : 'red'
        , weight: tour.width ? tour.width : 3
      }).addTo(map);
// TODO add context menu
    if (tour.lineStyle == 'dotted') {
      polyline.setStyle({ dashArray: '1, 10' });
    } else if (tour.lineStyle == 'dashed') {
      polyline.setStyle({ dashArray: '5,9' });
    }


    // see https://bbecquet.github.io/Leaflet.PolylineDecorator/ and https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/example/example.js 
    // TODO use definition of tour to create decorator     
    tourDecorator = L.polylineDecorator(polyline, {
      patterns: [
        { offset: 25, repeat: 80, symbol: L.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 1, weight: 0 } }) }
      ]
    }).addTo(map);

    // Assuming polyline is already added to the map
    polyline.on('mouseover', function (e) {
      const layer = e.target;
      layer.bindTooltip("dummy", { permanent: false, direction: 'auto' }).openTooltip(); // not sure why this is needed, but if I remove it, the tooltip doesn't appear in the right place (where the mouse hover took place)
      const clickLatLng = e.latlng;
      const clickContent = tour.label
      polyline.bindTooltip(clickContent).openTooltip(clickLatLng);
    });
    return { polyline, tourDecorator }
  }

  let     _tours,  _allSites ,_map


  const drawTours = (allSites, tours, map) => {
    _tours = tours
    _allSites = allSites
    _map = map

    if (tours && tours.length > 0) {
      for (const tour of tours) {
        const sites = getSortedSitesInTour(tour, allSites)
        const { polyline, tourDecorator } = drawTour(tour, sites, map)
        polyline.tour = tour
        drawnTours.push(polyline)
        drawnTourDecorators.push(tourDecorator)
      }
    } 
  }

  const hideTours = () => {
    drawnTours.forEach(tour => {
      tour.remove();
    })
    drawnTours = []
    drawnTourDecorators.forEach(tourDecorator => {
      tourDecorator.remove();
    })
    drawnTourDecorators = []
  }


  const highlightTour = (tour) => {
    const polyline = drawnTours.find(drawnTour => drawnTour.tour === tour)
    if (polyline) {
      polyline.setStyle({
        color: 'white'
        , weight: 7
        , dashArray: '3,  10'
      });
    }
  }

  const unhighlightTour = (tour) => {
    const polyline = drawnTours.find(drawnTour => drawnTour.tour === tour)
    if (polyline) {
      polyline.setStyle({
        color: polyline.tour.color
        , weight: polyline.tour.width ? polyline.tour.width : 3
        , dashArray: null
      })

      if (polyline.tour.lineStyle == 'dotted') {
        polyline.setStyle({ dashArray: '1, 10' });
      } else if (polyline.tour.lineStyle == 'dashed') {
        polyline.setStyle({ dashArray: '5,9' });
      }
    }
  }


  return { getSortedSitesInTour, removeSitesFromTour , drawTours,hideTours,highlightTour,unhighlightTour};
}


