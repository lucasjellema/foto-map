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

  return { getSortedSitesInTour, removeSitesFromTour };
}


