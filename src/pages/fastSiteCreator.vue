<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>
        <v-row>
          <v-col cols="4" offset="0">
            <v-text-field v-model="search" label="Search" clearable></v-text-field>
            <v-data-table :headers="headers" :items="sitesData" :search="search" items-per-page="5"
              :custom-sort="customSort" return-object>
              <template v-slot:item.timestamp="{ item }">
                {{ formatDate(item.timestamp) }}
              </template>

              <template v-slot:item.edit="{ item }">
                <v-btn icon @click="editItem(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>

              <template v-slot:item.remove="{ item }">
                <v-btn icon @click="removeSite(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>

            <h3>Upload or paste one or multiple files</h3>
            <image-editor ref="imageEditorRef" image-height=400 image-width=600 @gps-data="handleGPSData"
              :allowMultipleFiles=true :fastSiteCreator="true"></image-editor>

          </v-col>
          <v-col cols="7" offset="0">
            <div id="mapid" style="height: 700px; width:900px"></div>
            <v-container>
              <v-row align="center">
                <v-col cols="auto">
                  <v-btn @click="refreshMap()">Refresh Map</v-btn>
                </v-col>

                <v-col cols="auto">
                  <!-- an input element to set the consolidation radius in km -->
                  <v-text-field v-model="consolidationRadius" label="Consolidation Radius (km)"
                    type="number"></v-text-field>
                </v-col>
              </v-row>

            </v-container>
            <!-- contents for the popup on markers -->
            <div style="display: none;">
              <v-card class="mx-auto hover-zoom" max-width="600" :title="poppedupSite?.label"
                :theme="poppedupFeature?.properties?.imageURL ? 'light' : 'light'" ref="popupContentRef">
                <!-- :image="poppedupFeature?.properties?.imageURL" -->
                <v-card-text>{{ formatDate(poppedupSite?.timestamp) }}
                  {{ poppedupFeature?.properties?.city }},{{ poppedupSite?.country }}
                  {{ poppedupFeature?.geometry?.coordinates[2] ? ` (∆
                  ${poppedupFeature?.geometry?.coordinates[2].toFixed(0)}m)` : '' }}
                  <div v-if="poppedupSite?.attachments?.length > 0">
                    <v-carousel :height="400" show-arrows="hover">
                      <v-carousel-item>
                        <div>
                          <v-img width="500" cover :src="poppedupFeature?.properties?.imageURL"
                            content-class="hover-zoom"></v-img>
                          {{ poppedupFeature?.properties?.description }}
                        </div>
                      </v-carousel-item>
                      <v-carousel-item v-for="(attachment, index) in poppedupSite?.attachments">
                        <div>
                          <v-img width="500" cover :src="attachment.imageURL"></v-img>
                          {{ attachment.description }}
                        </div>
                      </v-carousel-item>
                    </v-carousel>
                  </div>
                  <div v-else>
                    <v-img width="500" cover :src="poppedupFeature?.properties?.imageURL"
                      content-class="hover-zoom"></v-img>
                    {{ poppedupFeature?.properties?.description }}
                  </div>
                </v-card-text>
              </v-card>
            </div>

          </v-col>
        </v-row>
        <!-- <v-row>
          <v-col>
            <SiteMap v-model="sitesData" v-model:currentStory="currentStory">  </SiteMap>
          </v-col>
        </v-row> -->
      </v-main>
      <!-- Add/Edit Site Dialog -->
      <v-dialog v-model="showEditSitePopup" max-width="1000px">
        <SiteEditor v-model:site="editedSite" @saveSite="saveItem" @closeDialog="closeDialog"></SiteEditor>
      </v-dialog>

      <v-dialog v-model="showMapFiltersPopup" max-width="800px">
        <v-card>
          <v-card-title>
            <span class="headline">Map Filters</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-range-slider v-model="dateRangeSlider" :min="minTimestamp" :max="maxTimestamp"
                    :step="dateRangeStep" label="Filter Sites by Date" @end="onSliderChange" :thumb-label="true"
                    :ticks="dateRangeTicks" show-ticks="always" tick-size="4" strict>

                    <template v-slot:thumb-label="{ modelValue }" class="date-range-slider-thumb">
                      {{ formatDate(modelValue) }}
                    </template>
                  </v-range-slider>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="closeMapFiltersDialog">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showMapConfigurationPopup" max-width="800px">
        <v-card>
          <v-card-title>
            <span class="headline">Map Configuration</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="3">
                  <v-btn @click="exportMap()">Export Map</v-btn>
                </v-col>
                <v-col cols="8" offset="1">
                  <v-file-input label="Upload FotoMapp Archive" @change="handleImport" accept=".zip"></v-file-input>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-checkbox v-model="currentStory.mapConfiguration.showTooltips"
                    label="Show Tooltips for Markers"></v-checkbox>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <h2>Custom tile layers</h2>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="4">
                  <v-text-field v-model="newTileLayer.label" label="Label"></v-text-field>
                </v-col>
                <v-col cols="8">
                  <v-text-field v-model="newTileLayer.url" label="URL"
                    hint="https://provider.domain/optional- provider-specific-path/{z}/{x}/{y}.png"
                    persistent-hint=""></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="newTileLayer.description" label="Description"></v-text-field>
                  <v-text-field v-model="newTileLayer.attribution" label="Attribution"
                    hint="Attribution to provider, for example '© OpenStreetMap contributors'"></v-text-field>
                  <v-btn @click="addTileLayer">Add Tile Layer</v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-data-table :headers="tileLayersHeaders" :items="currentStory.mapConfiguration.customTileLayers"
                    item-key="label" class="elevation-1">
                    <template v-slot:item.actions="{ item }">
                      <v-icon small @click="removeTileLayer(item, index)">
                        mdi-delete
                      </v-icon>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="closeMapConfigurationDialog">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-container>
  </v-responsive>
</template>


<script setup>
import domtoimage from 'dom-to-image-more';
import ImageEditor from "@/components/imageEditor.vue"
import SiteEditor from "@/components/SiteEditor.vue"
import SiteMap from "@/components/SiteMap.vue"
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.min.css';
import { ref, onMounted } from 'vue';
import { useLocationLibrary } from '@/composables/useLocationLibrary';
import TooltipDirectionSelector from '@/components/TooltipDirectionSelector.vue'
import IconSelector from '@/components/IconSelector.vue'

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MarkerClusterGroup } from 'leaflet.markercluster';

const { mapZoomToResolution, isValidCoordinateFormat, isValidGeoJSON, reverseGeocode } = useLocationLibrary();
import { useFunctionCallThrottler } from '@/composables/useFunctionCallThrottler';
const { enqueueCall: enqueueCallToReverseGeocode } = useFunctionCallThrottler(1500, reverseGeocode);


import { useImagesStore } from "@/store/imagesStore";
const imagesStore = useImagesStore()
import { useStorieStore } from "@/store/storiesStore";
import { computed } from 'vue';
const storiesStore = useStorieStore()
const currentStory = computed(() => storiesStore.currentStory)
const sitesData = computed(() => currentStory.value.sites);

import { useImportExportLibrary } from '@/composables/useImportExportLibrary';
const { exportStoryToZip, importStoryFromZip } = useImportExportLibrary();


const exportMap = () => {
  exportStoryToZip(currentStory.value)
}


const handleImportedStory = (story) => {
  console.log(`resolvd`)
    //loop over all sites in story and create sites in current story using addSite
    // TODO handle image id
    for (const site of story.sites) {
      storiesStore.addSite(site)
    }
}


const handleImport = async (event) => {
  const files = event.target.files
  if (!files || files.length == 0) return;
  importStoryFromZip(files[0], handleImportedStory)
  
}

const search = ref("")
const tileLayersHeaders = ref([
  { text: 'Label', value: 'label' },
  { text: 'URL', value: 'url' },
  { text: 'Description', value: 'description' },
  { text: 'Actions', value: 'actions' },
])
const newTileLayer = ref({})

const addTileLayer = () => {
  currentStory.value.mapConfiguration.customTileLayers.push(newTileLayer.value)

  newTileLayer.value = {}

}

const removeTileLayer = (item, index) => {
  currentStory.value.mapConfiguration.customTileLayers.splice(index, 1)

}

const popupContentRef = ref(null)
const poppedupFeature = ref({})
const poppedupSite = ref({})
const showPopup = ref(false)
const showEditSitePopup = ref(false)
const showMapFiltersPopup = ref(false)
const showMapConfigurationPopup = ref(false)

const imageMetadata = ref()
const mapEditMode = ref(false)
const mapClusterMode = ref(false)
const mapFilterMode = ref(false)
const consolidationRadius = ref(2)
const dateRangeTicks = computed(() => {
  const start = minTimestamp.value
  const end = maxTimestamp.value
  const middle = start + Math.floor((end - start) / 2)
  const dateRange = {}
  dateRange[start] = formatDate(start)
  dateRange[end] = formatDate(end)
  dateRange[middle] = formatDate(middle)

  return dateRange
})

const dateRangeSlider = ref([0, 0]) // Initial slider values (timestamps)
const numberOfStepsInSlider = 50
const dateRangeStep = computed(() => {
  return Math.floor((maxTimestamp.value - minTimestamp.value) / numberOfStepsInSlider)
})

const minTimestamp = computed(() => {
  if (!sitesData.value || sitesData.value.length === 0) return 0
  let min = new Date(sitesData.value[0].timestamp)
  sitesData.value.forEach(site => {
    const siteTimestamp = new Date(site.timestamp)
    if (siteTimestamp < min) {
      min = siteTimestamp
    }
  })
  return min.getTime()
})

const maxTimestamp = computed(() => {
  if (!sitesData.value || sitesData.value.length === 0) return 0
  let max = new Date(sitesData.value[0].timestamp)
  sitesData.value.forEach(site => {
    const siteTimestamp = new Date(site.timestamp)
    if (siteTimestamp > max) {
      max = siteTimestamp
    }
  })
  return max.getTime()
})

const onSliderChange = (value) => {
  mapFilterMode.value = true
  refreshMap()
}

const closeDialog = () => {
  showEditSitePopup.value = false;
}

const closeMapFiltersDialog = () => {
  showMapFiltersPopup.value = false;
}
const closeMapConfigurationDialog = () => {
  storiesStore.updateStory(currentStory.value)
  refreshMap()
  showMapConfigurationPopup.value = false;
}


const saveItem = () => {
  // no JSONTEXT in this page editedSite.value.geoJSON =JSON.parse(editedSite.value.geoJSONText)
  editedSite.value.geoJSON.features[0].properties.name = editedSite.value.label
  editedSite.value.geoJSON.features[0].properties.description = editedSite.value.description
  editedSite.value.geoJSON.features[0].properties.city = editedSite.value.city
  editedSite.value.geoJSON.features[0].properties.country = editedSite.value.country
  editedSite.value.geoJSON.features[0].properties.timestamp = editedSite.value.timestamp
  editedSite.value.geoJSON.features[0].properties.imageId = editedSite.value.imageId


  const [year, month, day] = editedSite.value.datePart.split('-');
  const [hours, minutes] = editedSite.value.timePart.split(':');
  editedSite.value.timestamp = new Date(year, month - 1, day, hours, minutes); // TODO do something about the TIMEZONE!! 
  storiesStore.updateSite(editedSite.value)
  closeDialog();
  refreshSite(editedSite.value)
  const tooltips = document.getElementsByClassName(`tooltip${editedSite.value.id}`.replace(/-/g, ""))

  for (let i = 0; i < tooltips.length; i++) {
    const tooltip = tooltips[i];
    setTimeout(() => {
      refreshTooltip(editedSite.value, tooltip)
    }, 50); // Small timeout to ensure the tooltip is rendered
  }
}

const refreshTooltip = (site, tooltipElement) => {
  tooltipElement.style.display = currentStory.value.mapConfiguration?.showTooltips ? 'block' : 'none'

  if (!site.tooltipSize) site.tooltipSize = site.tooltipSize

  tooltipElement.innerHTML = `<i class="mdi ${site.tooltipIcon ? site.tooltipIcon : ''}" 
          style="font-size: ${10 + 6 * site.tooltipSize}px; color=${site.tooltipColor ? site.tooltipColor : 'black'}">
          </i>${site.label}`;
  console.log(`Tooltip size ${site.tooltipSize}   ${site.tooltipSize ? 8 + 4 * site.tooltipSize : '14'}px`)

  tooltipElement.style.fontSize = `${10 + 6 * site.tooltipSize}px`;
  tooltipElement.style.color = `${site.tooltipColor ? site.tooltipColor : 'black'}`;
  tooltipElement.style.background = site.tooltipBackgroundColor ? site.tooltipBackgroundColor : 'yellow';
  //          createCSSSelector(`.${tooltipClassName}`, `color: ${site.tooltipColor?site.tooltipColor:'black'};background: ${site.tooltipBackgroundColor?site.tooltipBackgroundColor:'yellow'}; border: 1px solid black; font-size: 18px;color: black;`);

  if (tooltipElement) {
    tooltipElement.addEventListener('click', function () {
      console.log(`Tooltip was clicked! for feature ${feature.properties.name}`);
      // Add any click handling logic here
    });
  }

}

const headers = [
  { title: 'Label', value: 'label', sortable: true },
  { title: 'City', value: 'city', sortable: true },
  { title: 'Timestamp', value: 'timestamp', sortable: true },
  { title: "Edit", value: 'edit' },
  { title: "Delete", value: 'remove' },
]

const oneDayInMS = 86400000
const dateFormatStyle = computed(() => {
  const timerange = maxTimestamp.value - minTimestamp.value
  if (timerange < oneDayInMS) {
    return "short"  // HH:MI
  } else if (timerange < 50 * oneDayInMS) return "medium"  // DD MON HH
  else
    return "long"  // DD MON Y
})

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function formatDate(timestamp) {
  const date = new Date(timestamp)

  if (dateFormatStyle.value === "short") {
    const hour = date.getHours();
    const min = date.getMinutes();
    return `${hour}:${min < 10 ? '0' : ''}${min}`
  } else if (dateFormatStyle.value === "medium") {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hour = date.getHours();
    const min = date.getMinutes();
    return `${day} ${month} ${hour}:${min < 10 ? '0' : ''}${min}`
  } else {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`
  }
}

const customSort = (items, sortBy, sortDesc) => {
  const [sortKey] = sortBy;
  const sortOrder = sortDesc[0] ? -1 : 1;

  if (sortKey === 'timestamp') {
    return items.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return (dateA - dateB) * sortOrder;
    });
  }
  // Fallback for other sorts or implement similarly
  return items;
}

let editedSite = ref({
  label: '',
  description: '',
  address: '',
  city: '',
  country: 'nl',
  resolution: 0,
  geoJSON: {},
  geoJSONText: "",
  imageUrl: '',
  imageId: '',
  relevance: 1, // 0 is low, 1 is normal, 2 is high, 3 is low
  timestamp: new Date(),
  showTooltip: true,
  tooltipDirection: 'auto'

})



const editItem = (site) => {
  editedSite.value = { ...site }; // Make a copy of the item to edit
  // if site does not contain property showTooltip, set it to true
  if (!site.hasOwnProperty('showTooltip')) {
    editedSite.value.showTooltip = true
  }
  if (!site.tooltipDirection) {
    editedSite.value.tooltipDirection = 'auto'
  }
  if (!site.tooltipBackgroundColor) {
    editedSite.value.tooltipBackgroundColor = '#f8fc03' // yellow
  }
  if (!site.tooltipColor) {
    editedSite.value.tooltipColor = '#000000'
  }
  if (!site.tooltipSize) {
    editedSite.value.tooltipSize = 1
  }

  // editedSite.value.geoJSONText = JSON.stringify(editedSite.value.geoJSON)
  const dateForTimestamp = new Date(editedSite.value.timestamp)
  editedSite.value.datePart = dateForTimestamp.toISOString().slice(0, 10)
  editedSite.value.timePart = dateForTimestamp.toISOString().slice(11, 16) // HH:MI

  //    imageMetadata.value = null
  showEditSitePopup.value = true;
}
const editSiteFromPopup = () => {
  const siteId = poppedupFeature.value.properties.id
  const siteToEdit = storiesStore.getSite(siteId)
  editItem(siteToEdit)
}

const imageEditorRef = ref(null)

const handleGPSData = (event) => {
  console.log("GPS Data for image " + JSON.stringify(event))
  if (event.gpsInfo?.longitude) {
    const newGeoJsonData =
    {
      "type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": { name: "To be geo-encoded", imageId: event.imageId, timestamp: event.dateTimeOriginal }
        , "geometry": { "coordinates": [event.gpsInfo.longitude, event.gpsInfo.latitude, event.gpsInfo.altitude], "type": "Point" }
      }]
    }
    createSiteFromGeoJSON(newGeoJsonData, event.imageId, event.dateTimeOriginal);
  }
}

const removeSite = (site) => {
  hideSite(site);
  storiesStore.removeSite(site)
}

const refreshSite = (site) => {
  hideSite(site);
  geoJsonLayer.addData(site.geoJSON);
}


const props = defineProps({
  geoJsonPoint: Object,
  zoomLevel: 10
});

const alignClustering = () => {
  if (mapClusterMode.value) {
    try {
      map.value.removeLayer(geoJsonLayer);
    } catch (error) {
    }
    clustersLayer.addLayer(geoJsonLayer);
  }
  else {
    try {
      clustersLayer.removeLayer(geoJsonLayer);
    } catch (error) {
    }
    map.value.addLayer(geoJsonLayer);
  }
}

const applyFilters = (sites) => {
  if (mapFilterMode.value) {
    const filteredSites = sites.filter(site => {
      const date = new Date(site.timestamp)
      const isWithinRange = date >= dateRangeSlider.value[0] && date <= dateRangeSlider.value[1]
      return isWithinRange
    })
    return filteredSites
  } else return sites
}

const refreshMarkers = () => {
  geoJsonLayer.clearLayers();
  clustersLayer.clearLayers();
  addSitesToLayer(geoJsonLayer, applyFilters(currentStory.value.sites));
  alignClustering()
}

//watch cluster mode and toggle clustering when changed
watch(mapClusterMode, () => {
  alignClustering()
})

onMounted(() => {
  drawMap();
  refreshMarkers();
  dateRangeSlider.value = [minTimestamp.value, maxTimestamp.value];
});
const map = ref(null)
let geoJsonLayer, clustersLayer


const refreshMap = () => {
  map.value.remove()
  drawMap()
  refreshMarkers()
  mapEditMode.value = false
}


const deleteMarker = marker => {
  hideMarker(marker)
  const feature = marker.feature;
  const site = storiesStore.getSite(feature.properties.id)
  removeSite(site)
}

const hideMarker = marker => {
  marker.remove()
}

const hideSite = (site) => {
  geoJsonLayer.eachLayer(function (marker) {
    // Check if this layer's feature has the property 'id' equal to 87
    if (marker.feature.properties.id === site.id) {
      //geoJsonLayer.removeLayer(marker);
      marker.remove()
    }
  });
}

function findFeaturesWithinConsolidationRadius(targetFeature, geojsonLayer) {
  // Array to store features within consolidation radius
  console.log(`finding features within ${consolidationRadius.value} km from ${targetFeature.properties.id} at ${targetFeature.geometry.coordinates[0]}, ${targetFeature.geometry.coordinates[1]}`)

  const consolidationRangeInMeters = 1000 * consolidationRadius.value
  let featuresWithinRadius = [];

  // Convert target feature's coordinates to a Leaflet LatLng object
  let targetLatLng = L.latLng(targetFeature.geometry.coordinates[1], targetFeature.geometry.coordinates[0]);

  // Iterate over each feature in the GeoJSON layer
  geojsonLayer.eachLayer(function (marker) {
    // do not process the target feature
    if (marker.feature === targetFeature) { } else {


      // Get the current feature's LatLng
      let featureLatLng = L.latLng(marker.feature.geometry.coordinates[1], marker.feature.geometry.coordinates[0]);

      // Calculate the distance between the target feature and the current feature
      let distance = map.value.distance(targetLatLng, featureLatLng);

      // If the distance is less than or equal to consolidation radius, add the feature to the array
      if (distance <= consolidationRangeInMeters) { // Distance in meters
        featuresWithinRadius.push(marker);
        console.log(`-- found ${marker.feature.properties.id}`)
      }
    }
  });

  return featuresWithinRadius;
}

const consolidateSite = (marker) => {
  // remove all sites with in the specified consolidation radius
  // in theory all are merged into this one - however: what remains of these other sites? 
  // add their pictures in additional attachments for the site?
  let targetFeature = marker.feature;
  const targetSite = storiesStore.getSite(targetFeature.properties.id)
  if (!targetSite.attachments) {
    targetSite.attachments = []
  }
  let nearbyFeatures = findFeaturesWithinConsolidationRadius(targetFeature, geoJsonLayer);
  let removedFeatures = []
  // Remove all nearby sites
  // sort nearbyfeature by timestamp
  nearbyFeatures.sort((a, b) => (a.feature.properties.timestamp > b.feature.properties.timestamp) ? 1 : -1).forEach(function (feature) {

    removedFeatures.push(feature)
    if (mapEditMode.value) {
      const siteToRemove = storiesStore.getSite(feature.feature.properties.id)

      // add to targetSite.attachments an object with description (consisting of label, timestamp, description) and imageID
      if (siteToRemove.imageId || siteToRemove.description) {
        targetSite.attachments.push({
          description: `${formatDate(siteToRemove.timestamp)} ${siteToRemove.city}, ${siteToRemove.country}`
          , imageId: siteToRemove.imageId
        })
        siteToRemove.imageId = null // to prevent the removal of the site to also remove referenced image 
      }
      deleteMarker(feature)
    }
    else hideMarker(feature)

  });
  console.log(targetSite)
  if (mapEditMode.value) {
    storiesStore.updateSite(targetSite)
  }
  return removedFeatures
}


const consolidateAllSites = () => {
  // loop over all markers/sites and consolidate each  
  // note: after a consolidation, sites may have been removed from the layer
  const recentlyRemovedMarkers = []
  geoJsonLayer.eachLayer(function (marker) {
    if (!recentlyRemovedMarkers.includes(marker)) {
      const removedFeatures = consolidateSite(marker);
      recentlyRemovedMarkers.push(...removedFeatures)
    }
  });

}

const centerMap = (e) => {
  map.value.panTo(e.latlng);
}

const centerAndZoomMap = (e) => {
  map.value.panTo(e.latlng, { animate: false });
  map.value.zoomIn(4) // number of zoom levels to increase with

}

const geoJSONToClipboard = () => {
  const geoJSON = geoJsonLayer.toGeoJSON()
  //every feature should have a property called tooltip that contains the city and country and the formatted timestamp
  geoJSON.features.forEach(feature => feature.properties.tooltip = `${feature.properties.city}, ${feature.properties.country} (${formatDate(feature.properties.timestamp)})`)

  // TODO set icon (based on site type), scale (derive from relevance!), color (per day/category),    
  // https://academy.datawrapper.de/article/177-how-to-style-your-markers-before-importing-them-to-datawrapper
  navigator.clipboard.writeText(JSON.stringify(geoJSON));
}

const showHideControls = (show) => {
  map.value.zoomControl.getContainer().style.display = show ? 'block' : 'none';
  layerControl.getContainer().style.display = show ? 'block' : 'none';
  myControls.forEach(function (control) {
    control.getContainer().style.display = show ? 'block' : 'none';
  });
}
const myControls = [];


const mapImageToClipboard = async () => {
  showHideControls(false)
  const mapElement = document.querySelector("#mapid")
  const { width, height } = mapElement.getBoundingClientRect();
  const blob = await domtoimage.toBlob(mapElement, { width, height })
  const item = new ClipboardItem({ "image/png": blob });
  navigator.clipboard.write([item]).then(() => {
    console.log("Image copied to clipboard");
  }).catch(err => {
    console.error("Error copying image to clipboard", err);
    // Fallback method: display the image for manual copying or saving
    const imgURL = URL.createObjectURL(blob);
    window.open(imgURL, '_blank').focus();
  });
  showHideControls(true)

}

watch(mapEditMode, async (newMapEditMode) => {
  if (newMapEditMode) {
    map.value.doubleClickZoom.disable();
    geoJsonLayer.eachLayer(function (marker) {
      marker.dragging.enable();
      marker.on('dragend', function (e) {
        var newLatLng = marker.getLatLng();
        // Update the GeoJSON feature with the new coordinates
        const geoJsonFeature = marker.feature

        geoJsonFeature.geometry.coordinates = [newLatLng.lng, newLatLng.lat];
        // now update site as well
        const site = storiesStore.getSite(marker.feature.properties.id)
        site.geoJSON.features[0].geometry.coordinates = [newLatLng.lng, newLatLng.lat]
        site.geoJSONText = JSON.stringify(site.geoJSON)
        storiesStore.updateSite(site)
        console.log(newLatLng); // New coordinates
        enqueueCallToReverseGeocode(geoJsonFeature, site);
      });
    });

  } else {
    map.value.doubleClickZoom.enable();
    geoJsonLayer.eachLayer(function (marker) {
      if (marker?.dragging) {
        marker.dragging.disable();
      }
    });
  }

})

let layerControl
const drawMap = () => {
  // Initialize the map
  map.value = L.map('mapid', {
    contextmenu: true,
    contextmenuWidth: 160,
    contextmenuItems: [{
      text: 'Center map here',
      callback: centerMap
    }, {
      text: 'Zoom in here',
      callback: centerAndZoomMap
    }, {
      separator: true
    }, {
      text: 'GeoJSON to Clipboard',
      callback: geoJSONToClipboard
    }, {
      text: 'Image to Clipboard',
      callback: mapImageToClipboard
    }, {
      text: 'Consolidate All Sites',
      callback: consolidateAllSites
    }, {
      text: 'Show Filters',
      callback: () => {
        // show filter dialog
        showMapFiltersPopup.value = true
      }
    }, {
      text: 'Configure Map',
      callback: () => {
        // show filter dialog
        showMapConfigurationPopup.value = true
      }
    }]
  }).setView([51.505, -0.09], 7); // Temporary view, will adjust based on GeoJSON

  // Add OpenStreetMap tiles
  const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);


  const EsriWorldImageryLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });
  //  layerControl.addOverlay(Esri_WorldImagery, "Esri World Imagery");

  layerControl = L.control.layers({ OpenStreetMap: osmLayer, Satellite: EsriWorldImageryLayer }, {}).addTo(map.value);


  // const tileLayer = L.tileLayer('https://mapwarper.net/maps/tile/80272/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.https://mapwarper.net">mapwarper.net</a> ' }).addTo(map.value);
  // layerControl.addOverlay(tileLayer, "Galgenwaard");

  //loop over customtilelayers and add them
  currentStory.value.mapConfiguration?.customTileLayers?.forEach(tileLayer => {
    const theTileLayer = L.tileLayer(tileLayer.url, { attribution: tileLayer.attribution }).addTo(map.value);
    layerControl.addOverlay(theTileLayer, tileLayer.label);
  })



  attachMapListeners()
  addClusterControl()
  addEditModeControl()
  addFilterControl()
  clustersLayer = L.markerClusterGroup();
  map.value.addLayer(clustersLayer);


  geoJsonLayer = L.geoJSON(null, {
    draggable: true,
    onEachFeature: async (feature, layer) => {
      const site = storiesStore.getSite(feature.properties.id)
      const tooltip = `${feature.properties.name}`;
      const tooltipClassName = `tooltip${feature.properties.id}`.replace(/-/g, "")
      if (site.showTooltip) {


        layer.bindTooltip(tooltip, {
          permanent: true
          , className: `my-custom-tooltip ${tooltipClassName}`
          , direction: site.tooltipDirection ? site.tooltipDirection : 'auto' // derive direction from feature properties ; also opacity , 
          , interactive: true // needed to handle tooltip click events
        })

        //TODO allow user to edit tool tip characteristics; store them in geojson properties; use them to set direction opacity, and color, background color, font-size

        setTimeout(() => {
          const tooltipElement = document.querySelector(`.${tooltipClassName}`);
          refreshTooltip(site, tooltipElement)

        }, 50); // Small timeout to ensure the tooltip is rendered

      }
      layer.bindPopup((layer) => {
        poppedupSite.value = storiesStore.getSite(layer.feature.properties.id)
        if (mapEditMode.value) {
          // open edit dialog
          // editedSite.value = poppedupSite.value
          // showEditSitePopup.value = true
          editItem(poppedupSite.value)
          return popupContentRef.value.$el
          //          return editSitePopupContentRef.value.$el;
        }

        poppedupFeature.value = layer.feature;
        // get site from storiesStore for this feature

        console.log(`open popup for ${layer.feature.properties.id} ${poppedupSite.value.label}`);
        if (poppedupSite.value.imageId) {
          try {
            setImageURLonFeature(poppedupSite.value.imageId);
            //iterate over every attachment in the poppedupSite 
            poppedupSite.value.attachments.forEach(attachment => {
              if (attachment.imageId) {

                imagesStore.getUrlForIndexedDBImage(attachment.imageId).then(url => {
                  attachment.imageURL = url
                })
              }
            })

          }
          catch (e) { }
        }
        return popupContentRef.value.$el;
      });
      layer.bindContextMenu({
        contextmenu: true,
        contextmenuItems: [{
          separator: true
        }, {
          text: 'Delete Site',
          callback: (e) => {
            var featureLayer = e.relatedTarget;
            deleteMarker(featureLayer);
          }
        }, {
          text: 'Hide Site',
          callback: (e) => {
            var featureLayer = e.relatedTarget;
            hideMarker(featureLayer);
          }
        }, {
          text: 'Consolidate Site',
          callback: (e) => {
            var featureLayer = e.relatedTarget;
            consolidateSite(featureLayer);
          }
        }]
      });
    }
  })

}


const addFilterControl = () => {
  const filterControl = L.control({ position: 'bottomleft' });
  myControls.push(filterControl);

  filterControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'map-control');
    div.innerHTML = `<form><input id="filterCheckbox" ${mapFilterMode.value ? 'checked' : ''} type="checkbox" title="Apply filters on sites to display"> Apply Filters</form>`;
    return div;
  };
  filterControl.addTo(map.value);
  document.getElementById('filterCheckbox').addEventListener('change', function () {
    if (this.checked) {
      mapFilterMode.value = true;
    } else {
      mapFilterMode.value = false;
    }
  });
}


const addClusterControl = () => {
  const clusteringControl = L.control({ position: 'bottomleft' });
  myControls.push(clusteringControl);

  clusteringControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'map-control');
    div.innerHTML = `<form><input id="clusterCheckbox" ${mapClusterMode.value ? 'checked' : ''} type="checkbox" title="Enable Clustering of sites : show nearby sites as clusters"> Enable Clustering</form>`;
    return div;
  };
  clusteringControl.addTo(map.value);
  document.getElementById('clusterCheckbox').addEventListener('change', function () {
    if (this.checked) {
      mapClusterMode.value = true;
      mapEditMode.value = false;
    } else {
      mapClusterMode.value = false;
    }
  });
}


const addEditModeControl = () => {
  const editModeControl = L.control({ position: 'bottomleft' });
  myControls.push(editModeControl);

  editModeControl.onAdd = () => {
    const div = L.DomUtil.create('div', 'map-control');
    div.innerHTML = `<form><input id="editmodeCheckbox" type="checkbox" ${mapEditMode.value ? 'checked' : ''}  title="Enable Edit Mode: move, delete, add sites"> Edit Mode</form>`;
    return div;
  };
  editModeControl.addTo(map.value);
  document.getElementById('editmodeCheckbox').addEventListener('change', function () {
    if (this.checked) {
      mapEditMode.value = true;
      mapClusterMode.value = false;
    } else {
      mapEditMode.value = false;
    }
  });

}
//if mapeditmode changes then refresh the editmodecontrol
watch(mapEditMode, (newMapEditModeValue) => {
  document.getElementById('editmodeCheckbox').checked = newMapEditModeValue
  if (newMapEditModeValue) {
    document.getElementById('clusterCheckbox').checked = !newMapEditModeValue
    mapClusterMode.value = !newMapEditModeValue
  }
})

watch(mapFilterMode, (newMapFilterModeValue) => {
  refreshMarkers()
})

const attachMapListeners = () => {
  const mapContainer = map.value.getContainer();
  // Make the map container focusable
  mapContainer.setAttribute('tabindex', '0');

  if (!mapContainer.getAttribute('data-paste-listener-attached')) {
    mapContainer.addEventListener('paste', function (event) {
      // Handle the paste event
      console.log('Paste event detected!');
      event.stopPropagation();
      event.preventDefault();

      // You can access the pasted data using event.clipboardData
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        // Check if the item is an image
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          imageEditorRef.value.handleNewImage(file)
        }
        if (items[i].type.indexOf("text") !== -1) {
          const text = (event.clipboardData || window.clipboardData).getData('text');
          handlePastedText(text);
        }
      }
    });
    mapContainer.setAttribute('data-paste-listener-attached', 'true');
  }


  if (!mapContainer.getAttribute('dblclick-listener-attached')) {
    mapContainer.addEventListener('dblclick', function (e) {
      if (mapEditMode.value) {
        const latlng = map.value.mouseEventToLatLng(e)
        const { lat, lng } = latlng;
        // Create a GeoJSON Point feature for the click location
        const geoJsonPointFeature =
        {
          "type": "FeatureCollection", "features": [
            {
              "type": "Feature", "properties": { name: "Pasted coordinates", timestamp: new Date() }
              , "geometry": { "coordinates": [lng, lat], "type": "Point" }
            }
          ]
        }
          ;
        console.log(`double click at location ${JSON.stringify(geoJsonPointFeature)}`)
        createSiteFromGeoJSON(geoJsonPointFeature, null, new Date());
      }
    })

  }
  mapContainer.setAttribute('dblclick-listener-attached', 'true');

  // Focus the map container to ensure it can receive paste (and other keyboard) events
  // This step might be necessary depending on how you want to handle focus in your application
  mapContainer.focus();

}

const setImageURLonFeature = async (imageId) => {
  const url = await imagesStore.getUrlForIndexedDBImage(imageId)
  poppedupFeature.value.properties.imageURL = url

}


const addSitesToLayer = (layer, sites) => {
  if (!sites) return
  try {

    const features = sites.map(site => site.geoJSON.features[0]);
    layer.addData({ type: "FeatureCollection", features: features });
  } catch (e) {
    console.warn(`adding daata to layer failed`, e);
  }
  // Zoom the map to the GeoJSON bounds
  try {
    const bounds = geoJsonLayer.getBounds();
    if (bounds)
      map.value.fitBounds(bounds);
    // if (layer.getBounds()) map.value.fitBounds(layer.getBounds());
  } catch (e) { console.warn(`map.value.fitBounds(layer.getBounds() failed`); }
}

function createSiteFromGeoJSON(newGeoJsonData, imageId, dateTimeOriginal) {
  const site = {
    label: "To be geo-encoded",
    imageId: imageId,
    timestamp: dateTimeOriginal,
    geoJSON: newGeoJsonData,
    resolution: mapZoomToResolution(map.value.getZoom()),
    showTooltip: true
  };
  console.log(site.resolution)
  storiesStore.addSite(site);
  console.warn(`request reverse geo call`);

  enqueueCallToReverseGeocode(newGeoJsonData.features[0], site);
  geoJsonLayer.addData(newGeoJsonData);
  if (!mapEditMode.value) {
    const bounds = geoJsonLayer.getBounds();
    map.value.fitBounds(bounds);
  }
}


const handlePastedText = (text) => {
  // handle pasted geojson
  if (isValidGeoJSON(text)) {
    console.log(`looks like valid geojson`)
    // process all features of type point in text
    const geoJsonData = JSON.parse(text);
    for (const feature of geoJsonData.features) {
      if (feature.geometry.type === 'Point') {
        const newGeoJsonData =
        {
          "type": "FeatureCollection", "features": [feature]
        }
        createSiteFromGeoJSON(newGeoJsonData, null, new Date());
      }
    }
  }

  else if (isValidCoordinateFormat(text)) {
    console.log(`looks like coordinates`)
    const coordinates = text.split(',');
    const longitude = parseFloat(coordinates[1]);
    const latitude = parseFloat(coordinates[0]);

    const newGeoJsonData =
    {
      "type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": { name: "Pasted coordinates", timestamp: new Date() }
        , "geometry": { "coordinates": [longitude, latitude], "type": "Point" }
      }]
    }
    createSiteFromGeoJSON(newGeoJsonData, null, new Date());
  }
}




</script>

<style>
.my-custom-tooltip {
  background-color: black;
  color: white;
  font-family: Arial, sans-serif;
  /* Other styling */
}

.v-slider-thumb__label {
  min-width: 150px !important;
}

.v-slider-track__tick-label {
  /* text-wrap: wrap !important;*/
  font-size: 12px !important;
}

.map-control {
  background-color: rgba(200, 200, 200, 0.8);
  /* Light gray with transparency */
  padding: 5px;
  border-radius: 4px;
}

.leaflet-bottom.leaflet-left .leaflet-control {
  margin-bottom: 0px;
  padding: 0px;
}

.image-container {
  overflow: hidden;
  /* Ensures the image doesn't overflow its container */
  display: inline-block;
  /* Adjust as needed */
}

img.hover-zoom {
  transition: transform 0.5s ease;
  /* Smooth transition */
  display: block;
  /* Prevents adding extra space below the image */
  width: 100px;
  /* Initial reduced width, adjust as needed */
  height: auto;
  /* Maintain aspect ratio */
}

img.hover-zoom:hover {
  transform: scale(2);
  /* Adjust scale factor as needed */
}
</style>
