<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>
        <v-row>
          <v-col cols="4" offset="0">
            <v-tabs v-model="tab" align-tabs="center" density="compact" bg-color="deep-purple-accent-4" stacked>
              <v-tab value="tab-1">
                <v-icon>mdi-file-tree</v-icon>
                Sites Tree
              </v-tab>

              <v-tab value="tab-2" v-if="!storyReadOnly">
                <v-icon>mdi-table-arrow-up</v-icon>
                Upload Photographs
              </v-tab>

              <!-- <v-tab value="tab-3">
        <v-icon>mdi-account-box</v-icon>
        Nearby
      </v-tab> -->
            </v-tabs>
            <div v-if="tab == 'tab-1'">
              <SiteTree @site-selected="handleSiteSelected" @site-action="handleSiteAction"
                :storyReadOnly="storyReadOnly"></SiteTree>
            </div>
            <div v-if="tab == 'tab-2'">
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
            </div>
          </v-col>
          <v-col cols="7" offset="0">
            <div id="mapid" style="height: 700px; width:900px"></div>
            <!-- <TimelineProfile
              :thetimeline="timelineProfileToShow ? timelineProfileToShow : currentStory.mapConfiguration.timelines[0]"
              :sites="sitesData" @clickSite="handleClickSite" @dblclickSite="handleDblClickSite"
              v-if="mapShowTimelines">
            </TimelineProfile> -->
            <SitesTimelineProfile :sites="sitesTimelineProfileData" @clickSite="handleClickSite"
              @dblclickSite="handleDblClickSite" @sitesInFocus="handleSitesInFocus" :label="sitesTimelineProfileLabel">
            </SitesTimelineProfile>
            <v-container>
              <v-row align="center">
                <v-col cols="auto">
                  <v-btn @click="refreshMap()">Refresh Map</v-btn>
                </v-col>
              </v-row>

            </v-container>


          </v-col>
        </v-row>

      </v-main>
      <!-- Add/Edit Site Dialog -->
      <v-dialog v-model="showEditSitePopup" max-width="1000px">
        <SiteEditor v-model:site="editedSite" :storyTags="storyTags" @saveSite="saveItem" @closeDialog="closeDialog">
        </SiteEditor>
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

      <v-dialog v-model="showMapConfigurationPopup" max-width="1200px">
        <v-card>
          <v-card-title>
            <span class="headline">Map Configuration</span>
          </v-card-title>
          <v-card-text>
            <MapConfigurator v-model:map="currentStory.mapConfiguration" @resetStory="handleResetStory()">
            </MapConfigurator>
            <v-container>

              <v-row>
                <v-col cols="3">
                  <v-checkbox v-model="exportAsReadonly" label="Export as Read Only"></v-checkbox>
                  <v-btn @click="exportMap(exportAsReadonly)">Export Map</v-btn>
                </v-col>
                <v-col cols="8" offset="1">
                  <v-file-input label="Upload FotoMapp Archive" @change="handleImport" accept=".zip"></v-file-input>
                  <v-checkbox v-model="importReplace" label="Replace"></v-checkbox>
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
    <div style="display: none;">
      <!-- the content for timeline legend is referenced by $el in the Leaflet legend control  -->
      <v-container id="timelinesLegend" ref="timelinesLegendRef" style="max-width: 300px">
        <v-row v-for="timeline in currentStory.mapConfiguration?.timelines" @dblclick.stop="focusOnTimeline(timeline)"
          @click.stop="showTimelineProfile(timeline)" @mouseover="highlightTimeline(timeline)"
          @mouseout="unhighlightTimeline(timeline)" class="timelineLegendLine">
          <v-col cols="2" class="timelineLegendLine">
            <hr :style="{
              'border-style': timeline.lineStyle + ' none none none'
              , 'border-width': timeline.width + 'px'
              , 'border-color': timeline.color
              , 'background-color': 'none'
            }" />

          </v-col>
          <v-col cols="10" class="timelineLegendLine">
            {{ timeline.label }}
          </v-col>
        </v-row>

      </v-container>
    </div>
    <div style="display: none;">
      <!-- the content for tour legend is referenced by $el in the Leaflet legend control  -->
      <v-container id="toursLegend" ref="toursLegendRef" style="max-width: 300px">
        <v-row v-for="tour in currentStory.mapConfiguration?.tours" @dblclick.stop="focusOnTour(tour)"
          @click.stop="showTour(tour)" @mouseover="highlightTour(tour)" @mouseout="unhighlightTour(tour)"
          class="timelineLegendLine">
          <v-col cols="2" class="timelineLegendLine">
            <hr :style="{
              'border-style': tour.lineStyle + ' none none none'
              , 'border-width': tour.width + 'px'
              , 'border-color': tour.color
              , 'background-color': 'none'
            }" />

          </v-col>
          <v-col cols="10" class="timelineLegendLine">
            {{ tour.label }}
          </v-col>
        </v-row>
      </v-container>
    </div>


    <v-dialog v-model="showTimelineEditorPopup" max-width="800px">
      <TimelineEditor v-model="timelineToEdit" @saveTimeline="saveTimeline"
        @closeDialog="showTimelineEditorPopup = false">
      </TimelineEditor>
    </v-dialog>

    <v-dialog v-model="showAddTagToSitesDialog" max-width="800px">
      Choose Tag(s) to add to all selected sites
      <SitesBulkEditor v-model:sites="selectedSites" :storyTags="storyTags" mode="tags"
        @closeSitesDialog="showAddTagToSitesDialog = false"></SitesBulkEditor>

    </v-dialog>
    <v-dialog v-model="showSetTimezoneForSitesDialog" max-width="800px">
      Select timezone to use for time selected sites
      <SitesBulkEditor v-model:sites="selectedSites" @closeSitesDialog="showSetTimezoneForSitesDialog = false"
        mode="timezone">
      </SitesBulkEditor>

    </v-dialog>
    <v-dialog v-model="showAddSitesToTourDialog" max-width="800px">
      Select Tour to add Sites to
      <SitesBulkEditor v-model:sites="selectedSites" @closeSitesDialog="showAddSitesToTourDialog = false" mode="tour"
        :tours="currentStory.mapConfiguration?.tours">
      </SitesBulkEditor>

    </v-dialog>


    <!-- contents for the popup on markers; note: this content is moved to the leaflet popup by referencing the $el under the popupContentRef -->
    <div style="display: none;">
      <v-card class="mx-auto hover-zoom" max-width="600" :title="poppedupSite?.label"
        :theme="poppedupSite?.imageURL ? 'light' : 'light'" ref="popupContentRef">
        <SiteDetails v-model:site="poppedupSite" ref="popupContentRef"></SiteDetails>
      </v-card>
    </div>



  </v-responsive>
</template>


<script setup>
import domtoimage from 'dom-to-image-more';
import ImageEditor from "@/components/imageEditor.vue"
import SiteEditor from "@/components/SiteEditor.vue"

import MapConfigurator from "@/components/MapConfigurator.vue"
import ShowTimeAnalog from "@/components/ShowTimeAnalog.vue"



import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.min.css';
import { QuillEditor, Delta } from '@vueup/vue-quill'

import { ref, onMounted } from 'vue';
import { useLocationLibrary } from '@/composables/useLocationLibrary';
import TooltipDirectionSelector from '@/components/TooltipDirectionSelector.vue'
import IconSelector from '@/components/IconSelector.vue'
import GeometryUtil from "leaflet-geometryutil";
import 'leaflet-polylinedecorator';

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MarkerClusterGroup } from 'leaflet.markercluster';

const { mapZoomToResolution, isValidCoordinateFormat, isValidGeoJSON, reverseGeocode } = useLocationLibrary();
import { useFunctionCallThrottler } from '@/composables/useFunctionCallThrottler';
const { enqueueCall: enqueueCallToReverseGeocode } = useFunctionCallThrottler(1500, reverseGeocode);


import { useImagesStore } from "@/store/imagesStore";
const imagesStore = useImagesStore()
import { useStorieStore } from "@/store/storiesStore";
const storiesStore = useStorieStore()
const currentStory = computed(() => storiesStore.currentStory)
const sitesData = computed(() => currentStory.value.sites);
const storyTags = computed(() => currentStory.value.tags);
const storyReadOnly = computed(() => currentStory.value.mapConfiguration.readOnly);
const exportAsReadonly = ref(false);
const importReplace = ref(false);
import { useImportExportLibrary } from '@/composables/useImportExportLibrary';
const { exportStoryToZip, importStoryFromZip } = useImportExportLibrary();
import { useSitesTreeLibrary } from '@/composables/useSitesTreeLibrary';

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate, formatDateByGrain, getLocalISOStringForNow } = useDateTimeLibrary();
import { useTimelinesLibrary } from '@/composables/useTimelinesLibrary';
const { splitTimelineAtSiteX, drawTimelinesX, hideTimelines, startTimelineAtSite, highlightTimeline, unhighlightTimeline, endTimelineAtSite, refreshTimelines, registerEventCallback, fuseTimelinesAtSite, createTimelinePer, getSortedSitesInTimeline } = useTimelinesLibrary();

import { useToursLibrary } from '@/composables/useToursLibrary';
const { drawTours, hideTours, highlightTour, unhighlightTour, removeSitesFromTour } = useToursLibrary();

const tab = ref('tab-1')





const timelinesLegendRef = ref(null)
const toursLegendRef = ref(null)
const selectedSites = ref(null)
const showAddTagToSitesDialog = ref(false)
const showSetTimezoneForSitesDialog = ref(false)
const showAddSitesToTourDialog = ref(false)

const sitesTimelineProfileLabel = ref('All sites')
const sitesTimelineProfileData = ref(sitesData.value)


const timelineToEdit = ref(null)
const showTimelineEditorPopup = ref(false)
const saveTimeline = () => {
  showTimelineEditorPopup.value = false
  refreshTimelines(sitesData.value, currentStory.value.mapConfiguration.timelines, map.value)
}

const editTimeline = (timeline) => {
  timelineToEdit.value = timeline
  showTimelineEditorPopup.value = true
}

const showTimelineProfile = (timeline) => {

  // TODO find all sites in timeline and focus on these sites
  const timelineSites = getSortedSitesInTimeline(timeline, sitesData.value)
  const timelineSiteIds = timelineSites.map(s => s.id)
  // TODO set sitesTimelineProfileLabel to "Timeline"
  focusOnSites(timelineSiteIds)
  sitesTimelineProfileData.value = timelineSites
  sitesTimelineProfileLabel.value = `Timeline ${timeline.label}`

}

const handleClickSite = ({ site }) => {
  console.log(`handleClickSite`, site)
  handleSiteSelected([site.id])
}

const handleSitesInFocus = ({ sites }) => {
  const siteIds = sites.map(s => s.id)
  focusOnSites(siteIds)
}

const handleDblClickSite = ({ site }) => {
  console.log(`handleDblClickSite`, site)
}

const exportMap = (asReadOnly) => {
  exportStoryToZip(currentStory.value, asReadOnly)
}

const handleResetStory = () => {
  storiesStore.resetStory()
  refreshMap()
}

// callback - will be invoked from importStoryFromZip  
const handleImportedStory = (story, imageFile2NewImageIdMap, replaceCurrentStory) => {
  if (replaceCurrentStory) {
    storiesStore.resetStory()
  }
  //loop over all sites in story and create sites in current story using addSite
  for (const site of story.sites) {
    // find story in storiesStore with id site.id
    let existingSite = storiesStore.getSite(site.id)
    if (existingSite) {
      //copy properties from site to existingSite
      existingSite = { ...existingSite, ...site }
      // remove existing image from indexedDB 
      // TODO unless it is used in other sites as well? alternatively, push to attachments?
      if (existingSite.imageId) {
        imagesStore.removeImage(existingSite.imageId)
      }

      existingSite.imageId = imageFile2NewImageIdMap[`images\/${site.imageId}`]
      existingSite.attachments?.forEach(attachment => {
        if (attachment.imageId) {
          attachment.imageId = imageFile2NewImageIdMap[`images\/${attachment.imageId}`]
        }
      })
      storiesStore.updateSite(existingSite)

    }
    else {

      const newSite = { ...site }
      newSite.imageId = imageFile2NewImageIdMap[`images\/${site.imageId}`]
      newSite.attachments?.forEach(attachment => {
        if (attachment.imageId) {
          attachment.imageId = imageFile2NewImageIdMap[`images\/${attachment.imageId}`]
        }
      })

      storiesStore.addSite(newSite)
    }
    // TODO handle image id in attachments - both for existing (overwritten) site and for newly created site
  }
}


const handleImport = async (event) => {
  const files = event.target.files
  if (!files || files.length == 0) return;
  importStoryFromZip(files[0], handleImportedStory, importReplace.value)
}

const getSitesFromSiteIds = (siteIds) => {
  const sites = []
  for (const siteId of siteIds) {
    const site = storiesStore.getSite(siteId)
    if (site) {
      sites.push(site)
    }
  }
  return sites
}

const handleSiteAction = ({ siteId, siteIds, action, payload }) => {
  // for all siteIds call siteAction
  if (action.startsWith('createTimelinesPer')) {
    console.log(`createTimelinesPer`, action)
    if (action === 'createTimelinesPerYear') createTimelinePer('year', sitesData.value, currentStory.value.mapConfiguration.timelines, map.value, payload)
    if (action === 'createTimelinesPerMonth') createTimelinePer('month', sitesData.value, currentStory.value.mapConfiguration.timelines, map.value, payload)
    if (action === 'createTimelinesPerDay') createTimelinePer('day', sitesData.value, currentStory.value.mapConfiguration.timelines, map.value, payload)
    //TODO if (action==='createTimelinesPerWeek') createTimelinesPerWeek()
    return
  }

  if (siteIds) {
    if (action == 'siteFocus') {
      focusOnSites(siteIds)
      sitesTimelineProfileData.value = getSitesFromSiteIds(siteIds)
      sitesTimelineProfileLabel.value = payload.label || "Selected Sites"

    } else if (action == 'removeSiteFromTour') {
      removeSitesFromTour(siteIds, payload.tourId, currentStory.value)
    } else if (action == 'selectChildren') {
      handleSiteSelected(siteIds)
    } else if (action == 'consolidateSitesToTargetSite') {
      const targetSite = storiesStore.getSite(payload.targetSiteId)
      consolidateSitesToTargetSite(targetSite, getSitesFromSiteIds(siteIds))
    } else if (action == 'addTagsToSites') {
      selectedSites.value = getSitesFromSiteIds(siteIds)
      showAddTagToSitesDialog.value = true
    } else if (action == 'setTimezoneForSites') {
      selectedSites.value = getSitesFromSiteIds(siteIds)
      showSetTimezoneForSitesDialog.value = true
    } else if (action == 'addSitesToTour') {
      selectedSites.value = getSitesFromSiteIds(siteIds)
      showAddSitesToTourDialog.value = true
    } else if (action == 'hideSelectedSites') {
      selectedSites.value = getSitesFromSiteIds(siteIds)
      selectedSites.value.forEach(site => hideSite(site))
    } else if (action == 'hideUnselectedSites') {
      selectedSites.value = getSitesFromSiteIds(siteIds)
      sitesData.value.filter((site) => !siteIds.includes(site.id)).forEach(site => hideSite(site))
    } else if (action == 'showOnlySelectedSites') { // TODO implement showOnlySelectedSites
      selectedSites.value = getSitesFromSiteIds(siteIds)
      // hide all, then create markers for selectedSites.value
    }
    //TODO handle action == unselectChildren 

    else {
      for (const siteId of siteIds) {
        handleSiteAction({ siteId, action, payload })
      }
    }
    return
  }
  if (!siteId) {
    if (action == 'selectTimeline') {
      console.log(`select timeline ${payload.timelineId}`)
      // find timeline with timelineid in current story
      const timeline = currentStory.value.mapConfiguration.timelines.find(timeline => timeline.id == payload.timelineId)

      // showTimelineProfile(timeline)
      mapShowTimelines.value = true

    }
    if (action == 'editTimeline') {
      const timeline = currentStory.value.mapConfiguration.timelines.find(timeline => timeline.id == payload.timelineId)
      editTimeline(timeline)
    }

  } else {

    const site = storiesStore.getSite(siteId)
    if (site) {
      if (action == 'edit') {
        editItem(site)
        return
      } else if (action == 'delete') {
        removeSite(site) //deleteSite(site)      
      } else if (action == 'highlight') {
        highlightSite(site, payload)
      } else if (action == 'splitTimeline') {
        splitTimelineAtSite(site)
      }
    }
  }
}

const handleSiteSelected = (siteIds) => {
  if (siteIds.length == 0) {
    return
  }
  const coordinates = []
  for (const siteId of siteIds) {
    const site = storiesStore.getSite(siteId)
    if (site) {
      const siteCoordinates = site.geoJSON.features[0].geometry.coordinates
      coordinates.push([siteCoordinates[1], siteCoordinates[0]])
      const marker = findMarkerForSite(site);
      selectMarker(marker, true);
    }
  }
  if (coordinates.length > 0) {
    const bounds = L.latLngBounds(coordinates);
    try {
      // if bounds are actually the same, this call will fail
      // TODO fix this by extending one set of bounds
      map.value.fitBounds(bounds, { padding: [30, 30] });

    } catch (error) {

    }
  }
}

const highlightSite = (site, payload) => {
  const marker = findMarkerForSite(site);
  const color = payload.highlightStyle
  if (!L.DomUtil.hasClass(marker._icon, `marker-highlight-style-${color}`)) {
    L.DomUtil.addClass(marker._icon, `marker-highlight-style-${color}`);
  } else {
    L.DomUtil.removeClass(marker._icon, `marker-highlight-style-${color}`);
  }
}

const focusOnSites = (siteIds) => {
  const coordinatePairs = []
  for (const siteId of siteIds) {
    // get site 
    const site = storiesStore.getSite(siteId)
    const coordinates = site.geoJSON.features[0].geometry.coordinates
    coordinatePairs.push([coordinates[1], coordinates[0]])
  }
  if (coordinatePairs.length == 0) return
  if (coordinatePairs.length == 1) {
    centerAndZoomMap({ latlng: coordinatePairs[0] })
    return
  }
  const bounds = L.latLngBounds(coordinatePairs);
  try {
    map.value.fitBounds(bounds, { padding: [80, 80] }); // Adds padding around the bounds
  } catch (error) {
    console.log(`map.value.fitBounds(bounds, { padding: [80, 80] }) failed`, error)
  }
}

const focusOnTimeline = (timeline) => {
  const sitesInTimeline = getSortedSitesInTimeline(timeline, sitesData.value)
  const sitesIdsInTimeline = sitesInTimeline.map(site => site.id)
  focusOnSites(sitesIdsInTimeline)
}

const focusOnTour = (tour) => {
  focusOnSites(tour.sites)
  sitesTimelineProfileData.value = getSitesFromSiteIds(tour.sites)
  sitesTimelineProfileLabel.value = `Tour ${tour.label}`
}

const search = ref("")

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
const mapShowTimelines = ref(false)
const mapShowTours = ref(false)
//const consolidationRadius = ref(2)
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
  const [year, month, day] = editedSite.value.datePart.split('-');
  const [hours, minutes] = editedSite.value.timePart.split(':');
  //2024-04-16T05:12:00.000Z
  //  editedSite.value.timestamp = new Date(year, month - 1, day, hours, minutes); 
  editedSite.value.timestamp = editedSite.value.datePart + 'T' + editedSite.value.timePart + ':00.000Z'
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
  if (!tooltipElement) return
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
// const dateFormatStyle = computed(() => {
//   const timerange = maxTimestamp.value - minTimestamp.value
//   if (timerange < oneDayInMS) {
//     return "short"  // HH:MI
//   } else if (timerange < 50 * oneDayInMS) return "medium"  // DD MON HH
//   else
//     return "long"  // DD MON Y
// })


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
  //description: '', // TODO delta document!
  address: '',
  city: '',
  country: 'nl',
  resolution: 0,
  geoJSON: {},
  geoJSONText: "",
  imageUrl: '',
  imageId: '',
  relevance: 1, // 0 is low, 1 is normal, 2 is high, 3 is low
  timestamp: "2024-04-16T05:12:00.000Z",
  timezoneOffset: 0,
  showTooltip: true,
  tooltipDirection: 'auto',
  timeGrain: 0

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
  //  editedSite.value.timePart = dateForTimestamp.toISOString().slice(11, 16) // HH:MI
  // 2024-04-16T05:12:00.000Z
  // substring from 11 to 16

  editedSite.value.timePart = dateForTimestamp.toISOString().substring(11, 16)
  if (!editedSite.value.timeGrain) {
    editedSite.value.timeGrain = 0
  }
  //    imageMetadata.value = null
  showEditSitePopup.value = true;
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
  // TODO fix any timeline that starts or ends at this site
  // in case of start: find next site on the timeline as the new start
  // in case of end: find previous site on the timeline as the new end


  hideSite(site);
  storiesStore.removeSite(site)
}

const refreshSite = (site) => {
  hideSite(site);
  console.log("Refreshing site use drawMarkerForSite")
  drawMarkerForSite(site)
  //  geoJsonLayer.addData(site.geoJSON);
}


const props = defineProps({
  geoJsonPoint: Object,
  zoomLevel: 10
});

const alignClustering = () => {
  if (mapClusterMode.value) {
    try {
      map.value.removeLayer(markersLayer);
    } catch (error) {
    }
    clustersLayer.addLayer(markersLayer);
  }
  else {
    try {
      clustersLayer.removeLayer(markersLayer);
    } catch (error) {
    }
    map.value.addLayer(markersLayer);
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
  // geoJsonLayer.clearLayers();
  clustersLayer.clearLayers();
  markersLayer.clearLayers();
  // addSitesToLayer(geoJsonLayer, applyFilters(currentStory.value.sites));
  addSitesAsMarkersToLayer(markersLayer, applyFilters(currentStory.value.sites));
  alignClustering()
}

//watch cluster mode and toggle clustering when changed
watch(mapClusterMode, () => {
  alignClustering()
})

watch(mapShowTimelines, (newValue) => {
  if (newValue) {
    console.log("Showing timelines")
    drawTimelines()
  } else {
    console.log("Hide timelines")
  }
})

watch(currentStory, (newValue) => {
  // probably only fires when auto-importing a story
  refreshMap()
})


const timelineEventHandler = (event) => {
  console.log("Timeline event handler", event)

  if (event.type == 'editTimeline') {
    editTimeline(event.timeline)
  } else if (event.type == 'createSite') {
    console.log(`createSite`)
    const newGeoJsonData =
    {
      "type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": { name: event.label }
        , "geometry": { "coordinates": [event.latlng.lng, event.latlng.lat], "type": "Point" }
      }]
    }
    createSiteFromGeoJSON(newGeoJsonData, event.imageId, event.timestamp);
    //eventCallback({ type: 'creaeSite', latlng: latlng, timestamp:centerPointDate, label:`create in timeline ${timeline.label}`  })
  }

}


onMounted(() => {
  drawMap();
  refreshMarkers();
  dateRangeSlider.value = [minTimestamp.value, maxTimestamp.value];
  registerEventCallback(timelineEventHandler)

});


const map = ref(null)
let geoJsonLayer, clustersLayer, markersLayer, selectionLayer
const iconMarkerSelectionHandlesUrl = new URL('/marker-selection-handles.png', import.meta.url).href;
const selectionHandlesIcon = L.icon({
  iconUrl: iconMarkerSelectionHandlesUrl, // Path to your selection icon
  iconSize: [37, 53], // Size of the icon
  iconAnchor: [18, 50], // Adjust to center the icon over the marker
});
const iconSelectedMarkerUrl = new URL('/selected-marker.png', import.meta.url).href;
const selectedMarkerIcon = L.icon({
  iconUrl: iconSelectedMarkerUrl,
  iconSize: [37, 53],
  iconAnchor: [18, 50],
});

const drawMarkerForSite = (site) => {

  const marker = L.marker([site.geoJSON.features[0].geometry.coordinates[1], site.geoJSON.features[0].geometry.coordinates[0]], {}
    //    icon: L.icon({ className: `site-${site.id}` })
  ).addTo(markersLayer);
  marker.site = site
  if (currentStory.value.mapConfiguration?.showTooltips && currentStory.value.mapConfiguration?.showTooltipsMode !== 'never') {  // not having to work on the tooltip saves on performance for large numbers of markers/sites

    if (site.showTooltip) {


      const tooltip = `${site.label}`;
      const tooltipClassName = `tooltip${site.id}`.replace(/-/g, "")
      marker.bindTooltip(tooltip, {
        permanent: currentStory.value.mapConfiguration?.showTooltipsMode === 'always' // TODO can the site override this - and make the tooltip sticky even if the map wide setting is not??
        , className: `my-custom-tooltip ${tooltipClassName}`
        , direction: site.tooltipDirection ? site.tooltipDirection : 'auto' // derive direction from feature properties ; also opacity , 
        , interactive: true // needed to handle tooltip click events
      })
      // TODO now that we have the tooltip itself, is all of this elaborate way to set the content of the tooltip still needed?
      setTimeout(() => {
        const tooltipElement = document.querySelector(`.${tooltipClassName}`);
        try {
          refreshTooltip(site, tooltipElement)

        } catch (error) {
          console.error('Issue with tooltip', error)
        }
      }, 50); // Small timeout to ensure the tooltip is rendered
    }
  }

  marker.bindPopup((marker) => {
    poppedupSite.value = site
    if (mapEditMode.value) {
      editItem(poppedupSite.value)
      return popupContentRef.value.$el
    }
    if (site.imageId) {
      setImageURLonObject(site.imageId, poppedupSite.value)
    }
    poppedupSite.value.attachments?.forEach(attachment => {
      if (attachment.imageId) {
        setImageURLonObject(attachment.imageId, attachment)
      }
    })
    return popupContentRef.value.$el;
  });

  const contextMenuItems = [{
    separator: true
  }, {
    text: 'Select Site',
    callback: (e) => {
      const marker = e.relatedTarget;
      if (marker) {
        selectMarker(marker);
      }
    }
  }, {
    text: 'Hide Site',
    callback: (e) => {
      const marker = e.relatedTarget;
      if (marker) {
        hideMarker(marker);
      }
    }
  }, {
    text: 'Consolidate Site',
    callback: (e) => {
      const marker = e.relatedTarget;
      if (marker) {
        consolidateSite(marker.site);
      }
    }
  }]
  if (!storyReadOnly.value) {
    contextMenuItems.push({
      text: 'Delete Site',
      callback: (e) => {
        const marker = e.relatedTarget;
        if (marker) {
          deleteMarker(marker);
        }
      }
    })
    contextMenuItems.push({
      text: 'Dump Site Details',
      callback: (e) => {
        const marker = e.relatedTarget;
        if (marker) {
          console.log(JSON.stringify(marker.site))
        }
      }


    })

    contextMenuItems.push({ separator: true })

    // TODO ideally this option to split timeline is only shown when timelines are shown

    // TODO also: only show this option if the site is the part of a timeline (and not the beginning or end)
    // however - redrawing all markers when timelines are enabled/disables seems a bit expensive. or is it?
    //   if (mapShowTimelines.value ...
    contextMenuItems.push(
      {
        text: 'Split Timeline',
        callback: (e) => {
          const marker = e.relatedTarget;
          if (marker) {
            console.log(`Split timeline at this marker ${JSON.stringify(marker.site)}`)
            splitTimelineAtSite(marker.site)
          }
        }
      })
    // ideally ony show when timelines are showing and when this site is not part of a timeline (except for being its endsite)
    contextMenuItems.push(
      {
        text: 'Start New Timeline Here',
        callback: (e) => {
          const marker = e.relatedTarget;
          if (marker) {
            if (!currentStory.value.mapConfiguration.timelines) {
              currentStory.value.mapConfiguration.timelines = []
            }
            startTimelineAtSite(marker.site, sitesData.value, currentStory.value.mapConfiguration.timelines, map.value)
            console.log(`Start timeline at this marker ${JSON.stringify(marker.site)}`)
          }
        }
      })
    // ideally ony show when timelines are showing and when this site is part of a timeline (though not its first nor its last site)
    contextMenuItems.push(
      {
        text: 'End Timeline Here',
        callback: (e) => {
          const marker = e.relatedTarget;
          if (marker) {
            endTimelineAtSite(marker.site, sitesData.value, currentStory.value.mapConfiguration.timelines, map.value)
            console.log(`End existing timeline at this marker ${JSON.stringify(marker.site)}`)
          }
        }
      })
    // ideally ony show when site is both end and start of a timeline 

    contextMenuItems.push(
      {
        text: 'Fuse Timelines',
        callback: (e) => {
          const marker = e.relatedTarget;
          if (marker) {
            fuseTimelinesAtSite(marker.site, sitesData.value, currentStory.value.mapConfiguration.timelines, map.value)
          }
        }
      })
  }


  const markerContextMenu = {
    contextmenu: true,
    contextmenuItems: contextMenuItems
  }
  marker.bindContextMenu(markerContextMenu)

  // do not open popup for ctrl + click (instead, select/deselect the marker)
  marker.on('click', (e) => {
    if (e.originalEvent.ctrlKey) {
      selectMarker(marker);
      e.target.closePopup();
    }
  });
  return marker
}


const refreshMap = () => {
  map.value.remove()
  drawMap()
  refreshMarkers()
  mapEditMode.value = false

  drawTimelines()
  sitesTimelineProfileLabel.value = 'All sites'
  sitesTimelineProfileData.value = sitesData


}


const deleteMarker = marker => {
  hideMarker(marker)
  removeSite(marker.site)
}

const hideMarker = marker => {
  marker.remove()
}


const selectMarker = (selectedMarker, forceSelect) => {
  if (selectedMarker) {
    if (selectedMarker.selected) {
      if (forceSelect) return
      selectedMarker.setIcon(selectedMarker.originalIcon)
    } else {
      selectedMarker.originalIcon = selectedMarker.getIcon()
      // TODO for the time being - do not show the selectedMarker icon; reconsider if we want to use selection at all
      // selectedMarker.setIcon(selectedMarkerIcon)
    }
    selectedMarker.selected = !selectedMarker.selected
  }
}

const findMarkerForSite = (site) => {
  let theMarker
  for (const marker of getAllMarkers()) {
    if (marker.site === site) {
      theMarker = marker
      break;
    }
  }
  return theMarker;
}

const hideSite = (site) => {
  findMarkerForSite(site)?.remove()
}

function findSitesWithinConsolidationRadius(targetSite) {
  // Array to store features within consolidation radius
  const consolidationRadius = currentStory.value.mapConfiguration.consolidationRadius ? currentStory.value.mapConfiguration.consolidationRadius : 2

  console.log(`finding sites within ${consolidationRadius} km from ${targetSite.id} 
  at ${targetSite.geoJSON.features[0].geometry.coordinates[0]}, ${targetSite.geoJSON.features[0].geometry.coordinates[1]}`)

  const consolidationRangeInMeters = 1000 * consolidationRadius
  let sitesWithinRadius = [];

  // // Convert target feature's coordinates to a Leaflet LatLng object
  let targetLatLng = L.latLng(targetSite.geoJSON.features[0].geometry.coordinates[1], targetSite.geoJSON.features[0].geometry.coordinates[0]);

  // Iterate over all sites and check if they are within the consolidation radius

  applyFilters(currentStory.value.sites).forEach(site => {
    if (site === targetSite) return
    let siteLatLng = L.latLng(site.geoJSON.features[0].geometry.coordinates[1], site.geoJSON.features[0].geometry.coordinates[0]);
    let distance = map.value.distance(targetLatLng, siteLatLng);
    if (distance <= consolidationRangeInMeters) { // Distance in meters
      sitesWithinRadius.push(site);
    }
  })

  return sitesWithinRadius;
}

const consolidateSitesToTargetSite = (targetSite, sitesToConsolidate) => {
  if (!targetSite.attachments) {
    targetSite.attachments = []
  }
  let removedSites = []
  // Remove all nearby sites
  // sort nearbyfeature by timestamp
  for (const siteToRemove of sitesToConsolidate.sort((a, b) => (new Date(a.timestamp) > new Date(b.timestamp)) ? 1 : -1).filter((siteToRemove) => { return siteToRemove !== targetSite })) {

    removedSites.push(siteToRemove)
    if (mapEditMode.value) {

      //      const siteToRemove = storiesStore.getSite(feature.feature.properties.id)
      // add to targetSite.attachments an object with description (consisting of label, timestamp, description) and imageID
      if (siteToRemove.imageId || siteToRemove.description) {

        const delta = new Delta([
          { insert: `${siteToRemove.label}, ${siteToRemove.city}, ${siteToRemove.country}\n`, attributes: { bold: true } },
          { insert: `${formatDateByGrain(siteToRemove.timestamp, siteToRemove.timezoneOffset, siteToRemove.timeGrain)}`, attributes: { color: '#ccc' } }
        ]);

        targetSite.attachments.push({
          description: siteToRemove.description ? siteToRemove.description : delta
          , label: siteToRemove.label
          , imageId: siteToRemove.imageId
        })
        siteToRemove.imageId = null // to prevent the removal of the site to alsoresult in removal of the referenced image 

        if (siteToRemove.attachments) {
          targetSite.attachments.push(...siteToRemove.attachments)
          siteToRemove.attachments = []
        }
      }
      removeSite(siteToRemove)
    }
    else hideSite(siteToRemove)

  }
  //);
  if (mapEditMode.value) {
    storiesStore.updateSite(targetSite)
  }
  return removedSites
}


const consolidateSite = (targetSite) => {
  // remove all sites with in the specified consolidation radius
  // in theory all are merged into this one - however: what remains of these other sites? 
  // add their pictures in additional attachments for the site?
  // todo find sites within consolidation range?
  let nearbySites = findSitesWithinConsolidationRadius(targetSite);
// if a consolidation period was specified, then remove all sites that are not within the time range
  if (currentStory.value.mapConfiguration.consolidationPeriod) {
    const ONE_HOUR = 60 * 60 * 1000
    const MAX_TIME_DELTA = currentStory.value.mapConfiguration.consolidationPeriod * ONE_HOUR
    const TARGET_SITE_TIME = new Date(targetSite.timestamp).getTime()
    nearbySites = nearbySites.filter((site) => {
      return ( Math.abs(new Date(site.timestamp).getTime() - TARGET_SITE_TIME) <= MAX_TIME_DELTA)
    })
  }

  return consolidateSitesToTargetSite(targetSite, nearbySites)
}


const consolidateAllSites = () => {
  // loop over all currently visible markers/sites and consolidate each  
  // note: after a consolidation, sites may have been removed from the layer
  const recentlyRemovedSites = []
  const currentlyVisibleSites = getSitesInFocus(map.value.getBounds())
  for (const site of currentlyVisibleSites) { // currentStory.value.sites) {
    if (!recentlyRemovedSites.includes(site)) {
      const consolidatedSites = consolidateSite(site)
      recentlyRemovedSites.push(...consolidatedSites)
    }
  }
  // currentStory.value.sites.forEach(site => {
  //   consolidateSite(site)
  // })

  // // NOTE: removed markers and removed sites are not the same thing! - 

  //   const recentlyRemovedMarkers = []
  //   markersLayer.eachLayer(function (marker) {
  //     if (!recentlyRemovedMarkers.includes(marker)) {
  //       // TODO marker is not yhe same as site - why call consolidate site here?
  //       const removedFeatures = consolidateSite(marker.site);  
  //       recentlyRemovedMarkers.push(...removedFeatures)
  //     }
  //   });

}

const centerMap = (e) => {
  map.value.panTo(e.latlng);
}

const centerAndZoomMap = (e) => {
  map.value.panTo(e.latlng, { animate: false });
  map.value.zoomIn(4) // number of zoom levels to increase with
}

const geoJSONToClipboard = () => {
  const geoJSON = markersLayer.toGeoJSON()
  //TODO every feature should have a property called tooltip that contains the city and country and the formatted timestamp
  //TODO geoJSON.features.forEach(feature => feature.properties.tooltip = `${feature.properties.city}, ${feature.properties.country} (${formatDate(feature.properties.timestamp)})`)

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
    markersLayer.eachLayer((marker) => {
      marker.dragging.enable();
      marker.on('dragend', (e) => {
        var newLatLng = marker.getLatLng();
        const site = marker.site // storiesStore.getSite(marker.feature.properties.id)
        // Update the GeoJSON feature with the new coordinates
        const geoJsonFeature = site.geoJSON.features[0]
        geoJsonFeature.geometry.coordinates = [newLatLng.lng, newLatLng.lat];
        // now update site as well
        site.geoJSON.features[0].geometry.coordinates = [newLatLng.lng, newLatLng.lat]
        site.geoJSONText = JSON.stringify(site.geoJSON)
        storiesStore.updateSite(site)
        enqueueCallToReverseGeocode(geoJsonFeature, site);
      });
    });

  } else {
    map.value.doubleClickZoom.enable();
    markersLayer.eachLayer(function (marker) {
      if (marker?.dragging) {
        marker.dragging.disable();
      }
    });
  }

})

let layerControl
const drawMap = () => {
  // Initialize the map
  const contextmenuItems = [{
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
    text: 'Consolidate Visible Sites',
    callback: consolidateAllSites
  }, {
    text: 'Show Filters',
    callback: () => {
      // show filter dialog
      showMapFiltersPopup.value = true
    }
  }]
  if (!storyReadOnly.value) {
    contextmenuItems.push(
      {
        text: 'Configure Map',
        callback: () => {
          // show filter dialog
          showMapConfigurationPopup.value = true
        }
      }
    )
  }

  map.value = L.map('mapid', {
    contextmenu: true,
    contextmenuWidth: 160,
    contextmenuItems: contextmenuItems

  }).setView([51.505, -0.09], 7); // Temporary view, will adjust based on GeoJSON

  // Add OpenStreetMap tiles
  const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);
  const EsriWorldImageryLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });
  markersLayer = L.featureGroup([], { draggable: true }).addTo(map.value);

  // Layer group for selection markers
  selectionLayer = L.layerGroup().addTo(map.value);


  const overlayLayers = {
    "Markers": markersLayer
  };
  layerControl = L.control.layers({ OpenStreetMap: osmLayer, Satellite: EsriWorldImageryLayer }, overlayLayers).addTo(map.value);

  currentStory.value.mapConfiguration?.customTileLayers?.forEach(tileLayer => {
    const theTileLayer = L.tileLayer(tileLayer.url, { attribution: tileLayer.attribution }).addTo(map.value);
    layerControl.addOverlay(theTileLayer, tileLayer.label);
  })



  attachMapListeners()
  addClusterControl()
  if (!storyReadOnly.value) {
    addEditModeControl()
  }
  addTimelinesControl()
  addToursControl()
  addFilterControl()
  addTimelinesLegendControl()
  addToursLegendControl()

  clustersLayer = L.markerClusterGroup();
  map.value.addLayer(clustersLayer);


  map.value.on('boxzoomend', (e) => {
    // e.boxZoomBounds contains the LatLngBounds of the box zoom area
    const bounds = e.boxZoomBounds;
    var markersWithinRectangle = [];


    const sitesInFocus = []

    getAllMarkers().forEach(function (marker) {
      // Check each marker to see if it's within the bounds
      if (bounds.contains(marker.getLatLng())) {
        markersWithinRectangle.push(marker);
        selectMarker(marker, true)
        // TODO get all sites associated with these markers and focus on them
        sitesInFocus.push(marker.site)
      }
    });

    if (sitesInFocus.length > 0) {
      sitesTimelineProfileData.value = sitesInFocus
      sitesTimelineProfileLabel.value = "Selected Sites"

    }
  })

}

const getSitesInFocus = (bounds) => {
  const sitesInFocus = []

  getAllMarkers().forEach(function (marker) {
    // Check each marker to see if it's within the bounds
    if (bounds.contains(marker.getLatLng())) {
      sitesInFocus.push(marker.site)
    }
  });
  return sitesInFocus

}

const getAllMarkers = () => {
  const allMarkers = [];
  map.value.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      allMarkers.push(layer);
    }
  });
  return allMarkers
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


let toursLegendControl, toursLegendDiv
const addToursLegendControl = () => {
  toursLegendControl = L.control({ position: 'bottomright' });
  toursLegendControl.onAdd = function (map) {
    toursLegendDiv = L.DomUtil.create('div', 'info legend');
    toursLegendDiv.style.overflowY = 'auto'; // Enable vertical scroll
    toursLegendDiv.style.maxHeight = '150px'; // Set a max height for scroll
    toursLegendDiv.style.opacity = '0.7 ';
    toursLegendDiv.style.background = 'white';
    refreshToursLegendControl()
    return toursLegendDiv;
  };
}

const refreshToursLegendControl = () => {
  const el = toursLegendRef.value.$el
  toursLegendDiv.appendChild(el);
}

const addToursControl = () => {
  const toursControl = L.control({ position: 'bottomleft' });
  myControls.push(toursControl);

  toursControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'map-control');
    div.innerHTML = `<form><input id="toursCheckbox" ${mapShowTours.value ? 'checked' : ''} type="checkbox" title="Show Tours"> Show Tours</form>`;
    return div;
  };
  toursControl.addTo(map.value);
  document.getElementById('toursCheckbox').addEventListener('change', function () {
    if (this.checked) {
      mapShowTours.value = true;
      drawTours(sitesData.value, currentStory.value.mapConfiguration?.tours, map.value);
      toursLegendControl.addTo(map.value)
    } else {
      mapShowTours.value = false;
      hideTours();
      toursLegendControl.remove()
    }
  });
}





let timelinesLegendControl, timelinesLegendDiv
const addTimelinesLegendControl = () => {


  timelinesLegendControl = L.control({ position: 'bottomright' });
  timelinesLegendControl.onAdd = function (map) {

    timelinesLegendDiv = L.DomUtil.create('div', 'info legend');
    timelinesLegendDiv.style.overflowY = 'auto'; // Enable vertical scroll
    timelinesLegendDiv.style.maxHeight = '150px'; // Set a max height for scroll
    timelinesLegendDiv.style.opacity = '0.7 ';
    timelinesLegendDiv.style.background = 'white';
    refreshTimelinesLegendControl()
    return timelinesLegendDiv;
  };
}

const refreshTimelinesLegendControl = () => {
  const el = timelinesLegendRef.value.$el
  timelinesLegendDiv.appendChild(el);
}

const addTimelinesControl = () => {
  const timelinesControl = L.control({ position: 'bottomleft' });
  myControls.push(timelinesControl);

  timelinesControl.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'map-control');
    div.innerHTML = `<form><input id="timelinesCheckbox" ${mapShowTimelines.value ? 'checked' : ''} type="checkbox" title="Show Timelines"> Show Timelines</form>`;
    return div;
  };
  timelinesControl.addTo(map.value);
  document.getElementById('timelinesCheckbox').addEventListener('change', function () {
    if (this.checked) {
      mapShowTimelines.value = true;
      drawTimelines();
      timelinesLegendControl.addTo(map.value)
    } else {
      mapShowTimelines.value = false;
      hideTimelines();
      timelinesLegendControl.remove()
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

  if (!mapContainer.getAttribute('keydown-listener-attached')) {

    mapContainer.addEventListener('keydown', function checkKeyCombo(event) {
      if (event.ctrlKey && event.shiftKey && event.key === 'U') {
        console.log('UNLOCK MAP CTRL + SHIFT + U was pressed');
        currentStory.value.mapConfiguration.readOnly = false;
        refreshMap();
      }
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        console.log('LOCK MAP CTRL + SHIFT + L was pressed');
        currentStory.value.mapConfiguration.readOnly = true;
        refreshMap();
      }
    })
    mapContainer.setAttribute('keydown-listener-attached', 'true');

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
        createSiteFromGeoJSON(geoJsonPointFeature, null, getLocalISOStringForNow());
      }
    })

  }
  mapContainer.setAttribute('dblclick-listener-attached', 'true');

  // Focus the map container to ensure it can receive paste (and other keyboard) events
  // This step might be necessary depending on how you want to handle focus in your application
  mapContainer.focus();

}

const setImageURLonObject = async (imageId, theObject) => {
  const url = await imagesStore.getUrlForIndexedDBImage(imageId)
  //  poppedupFeature.value.properties.imageURL = url
  theObject.imageURL = url

}
const addSitesAsMarkersToLayer = (layer, sites) => {
  if (!sites) return
  try {
    // loop over sites and call drawMarkerForSite for each site
    const markers = sites.map(site => drawMarkerForSite(site));


  } catch (e) {
    console.warn(`adding markers to layer failed`, e);
  }
  try {
    const bounds = layer.getBounds();
    if (bounds)
      map.value.fitBounds(bounds, { padding: [15, 15] });
    // if (layer.getBounds()) map.value.fitBounds(layer.getBounds());
  } catch (e) { console.warn(`map.value.fitBounds(layer.getBounds() failed`); }
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
    const bounds = layer.getBounds();
    if (bounds)
      map.value.fitBounds(bounds, { padding: [15, 15] });
    // if (layer.getBounds()) map.value.fitBounds(layer.getBounds());
  } catch (e) { console.warn(`map.value.fitBounds(layer.getBounds() failed`); }
}

function createSiteFromGeoJSON(newGeoJsonData, imageId, dateTimeOriginal, rezoom) {
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
  drawMarkerForSite(site)

  if (!mapEditMode.value && rezoom) {
    try {
      const bounds = markersLayer.getBounds();
      map.value.fitBounds(bounds);
    } catch (e) { console.warn(`map.value.fitBounds(markersLayer.getBounds() failed`); }

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
        createSiteFromGeoJSON(newGeoJsonData, null, getLocalISOStringForNow());
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
    createSiteFromGeoJSON(newGeoJsonData, null, getLocalISOStringForNow());
  }
}

const splitTimelineAtSite = (siteToSplitAt) => {
  if (!currentStory.value.mapConfiguration.timelines) {
    currentStory.value.mapConfiguration.timelines = []
  }
  splitTimelineAtSiteX(siteToSplitAt, sitesData.value, currentStory.value.mapConfiguration.timelines, map.value)
}

const drawTimelines = () => {
  if (currentStory.value.mapConfiguration?.timelines && currentStory.value.mapConfiguration?.timelines.length > 0) {
    drawTimelinesX(sitesData.value, currentStory.value.mapConfiguration?.timelines, map.value)
  }
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

.marker-highlight-style-yellow {
  border: 1px dashed #d7d412;
  background-color: yellow;
}

.marker-highlight-style-red {
  border: 1px dashed #eab9b9;
  background-color: rgb(206, 67, 67);
}

.marker-highlight-style-green {
  border: 1px dashed #1e8b45;
  background-color: rgb(9, 255, 0);
}

.marker-highlight-style-blue {
  border: 1px dashed #3388ff;
  background-color: rgb(136, 143, 221);
}

.timelineLegendLine {

  padding-top: 1px;
  padding-right: 6px;
  padding-bottom: 1px;
  padding-left: 6px;
}


.tourLegendLine {

  padding-top: 1px;
  padding-right: 6px;
  padding-bottom: 1px;
  padding-left: 6px;
}
</style>
