import GeometryUtil from "leaflet-geometryutil";
import 'leaflet-polylinedecorator';
import { v4 as uuidv4 } from 'uuid';
import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate } = useDateTimeLibrary();


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


  return { getSortedSitesInTour };
}


