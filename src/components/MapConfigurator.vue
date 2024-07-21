<template>
  <v-container>
    <v-form ref="form">
      <!-- <v-text-field v-model="modelMap.label" label="Label" required></v-text-field> -->
      <v-expansion-panels :multiple="true">
        <v-expansion-panel title="Place" collapse-icon="mdi-map-marker" expand-icon="mdi-map-marker">
          <v-expansion-panel-text>

          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel title="Settings" collapse-icon="mdi-cog" expand-icon="mdi-cog">
          <v-expansion-panel-text>
            <v-text-field v-model="modelMap.consolidationRadius" label="Consolidation Radius (km)"
                    type="number"></v-text-field>            
            <v-text-field v-model="modelMap.consolidationPeriod" label="Consolidation Period (hours)" 
                    type="number"></v-text-field>
                    Reset Story (remove all sites)
            <v-btn @click="emit('resetStory')" icon="mdi-close-circle"></v-btn>
            Consolidate Story (incorporate all deltas)
            <v-btn @click="emit('consolidateDeltas')" icon="mdi-set-merge"></v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel title="Timelines" collapse-icon="mdi-sort-clock-descending-outline"
          expand-icon="mdi-sort-clock-descending-outline">
          <v-expansion-panel-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-data-table :headers="timelineHeaders" :items="modelMap.timelines" item-key="label"
                    class="elevation-1">
                    <template v-slot:item.preview="{ item, index }">
                      <hr :style="{
                    'border-style': `${item.lineStyle} none none none`
                    , 'border-width': item.width + 'px'
                    , 'border-color': item.color
                    , 'background-color': 'none'
                }" />

                    </template>
                    <template v-slot:item.fromSite="{ item, index }">
                       {{ formatDate(item.startTimestamp,'short') }}, {{ formatDate(item.startTimestamp,'long') }}
                    </template>
                    <template v-slot:item.toSite="{ item }">
                      {{ formatDate(item.endTimestamp,'short') }}, {{ formatDate(item.endTimestamp,'long') }}                       
                    </template>
                    <template v-slot:item.actions="{ item, index }">
                      <v-icon small @click="editTimeline(item, index)">
                        mdi-clock-edit-outline
                      </v-icon>
                      <v-icon small @click="removeTimeline(item, index)">
                        mdi-delete
                      </v-icon>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>
            </v-container>

          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel title="Tours" collapse-icon="mdi-transit-detour"
          expand-icon="mdi-transit-detour">
          <v-expansion-panel-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-data-table :headers="tourHeaders" :items="modelMap.tours" item-key="label"
                    class="elevation-1">
                    <template v-slot:item.preview="{ item, index }">
                      <hr :style="{
                    'border-style': `${item.lineStyle} none none none`
                    , 'border-width': item.width + 'px'
                    , 'border-color': item.color
                    , 'background-color': 'none'
                }" />

                    </template>
                    <template v-slot:item.actions="{ item, index }">
                      <v-icon small @click="editTour(item, index)">
                        mdi-vector-polyline-edit
                      </v-icon>
                      <v-icon small @click="removeTour(item, index)">
                        mdi-delete
                      </v-icon>
                    </template>
                  </v-data-table>
                  <v-btn prepend-icon="mdi-vector-polyline-plus" @click="addAndEditTour()">Add Tour</v-btn>
                                </v-col>
              </v-row>
            </v-container>

          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel title="Tooltips" collapse-icon="mdi-tooltip-outline" expand-icon="mdi-tooltip-outline">
          <v-expansion-panel-text>
            <v-checkbox v-model="modelMap.showTooltips" label="Show Tooltips for Markers"></v-checkbox>

            <v-radio-group v-model="modelMap.showTooltipsMode" label="Show Tooltips for Markers" inline>
                    <v-radio label="Always" value="always"></v-radio>
                    <v-radio label="On Hover" value="hover"></v-radio>
                    <v-radio label="Never" value="never"></v-radio>
                </v-radio-group>
          </v-expansion-panel-text>
        </v-expansion-panel> <v-expansion-panel title="Custom Tile Layers" collapse-icon="mdi-layers-edit"
          expand-icon="mdi-layers-edit">
          <v-expansion-panel-text>
            <v-container>

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
                  <v-data-table :headers="tileLayersHeaders" :items="modelMap.customTileLayers" item-key="label"
                    class="elevation-1">
                    <template v-slot:item.actions="{ item }">
                      <v-icon small @click="removeTileLayer(item, index)">
                        mdi-delete
                      </v-icon>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>
            </v-container>

          </v-expansion-panel-text>
        </v-expansion-panel>

      </v-expansion-panels>

    </v-form>
  </v-container>

  <v-dialog v-model="showTimelineEditorPopup" max-width="800px">
    <TimelineEditor v-model="timelineToEdit" @saveTimeline="saveTimeline" @closeDialog="showTimelineEditorPopup=false">
    </TimelineEditor>
  </v-dialog>
  <v-dialog v-model="showTourEditorPopup" max-width="800px">
    <TourEditor v-model="tourToEdit" @saveTour="saveTour" @closeDialog="showTourEditorPopup=false">
    </TourEditor>
  </v-dialog>

</template>
<script setup>

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate } = useDateTimeLibrary();
import { v4 as uuidv4 } from 'uuid';

const timelineToEdit = ref(null)
const showTimelineEditorPopup = ref(false)
const tourToEdit = ref(null)
const showTourEditorPopup = ref(false)
let newTour = false
import { useStorieStore } from "@/store/storiesStore";
const storiesStore = useStorieStore()

const saveTimeline = () => {
  showTimelineEditorPopup.value = false
  // TODO update timeline??
  storiesStore.updateMapConfiguration()
}

const saveTour = () => {
  if (!modelMap.value.tours) modelMap.value.tours = []

  if (newTour) {
    modelMap.value.tours.push(tourToEdit.value) 
  }
  storiesStore.updateMapConfiguration()
  showTourEditorPopup.value = false

}

const modelMap = defineModel('map');
const emit = defineEmits(['resetStory','consolidateDeltas']);

onMounted(() => {
});




const tileLayersHeaders = ref([
  { title: 'Label', value: 'label' },
  { title: 'URL', value: 'url' },
  { title: 'Description', value: 'description' },
  { title: 'Actions', value: 'actions' },
])
const newTileLayer = ref({})

const timelineHeaders = ref([
{ title: 'Preview', value: 'preview' },
{ title: 'Label', value: 'label' },
  { title: 'From Site', value: 'fromSite' },
  { title: 'To Site', value: 'toSite' },
  { title: 'Actions', value: 'actions' },
])


const tourHeaders = ref([
{ title: 'Preview', value: 'preview' },
{ title: 'Label', value: 'label' },
  { title: 'Actions', value: 'actions' },
])

const addTileLayer = () => {
  if (!modelMap.customTileLayers) {
    modelMap.value.customTileLayers = []
  }
  modelMap.value.customTileLayers.push(newTileLayer.value)
  newTileLayer.value = {}
}

const removeTileLayer = (item, index) => {
  modelMap.value.customTileLayers.splice(index, 1)
}

const removeTimeline = (item, index) => {
  console.log(`remove timeline ${index}`)
  modelMap.value.timelines.splice(index, 1)
}

const editTimeline = (timeline) => {
  timelineToEdit.value = timeline
  showTimelineEditorPopup.value = true
}

const removeTour = (item, index) => {
  modelMap.value.tours.splice(index, 1)
}

const editTour = (tour) => {
  tourToEdit.value = tour
  newTour = false
  showTourEditorPopup.value = true
}

const addAndEditTour = () => {
  tourToEdit.value = {
        id: uuidv4(),
        label: `New Tour`,
        color: 'blue',
        width: 3,
        lineStyle: 'dashed'
      }
  newTour = true
  showTourEditorPopup.value = true
}


</script>