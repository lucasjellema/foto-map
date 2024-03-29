<template>
  <v-container>
    <v-form ref="form">
      <!-- <v-text-field v-model="modelMap.label" label="Label" required></v-text-field> -->
      <v-expansion-panels :multiple="true">
        <v-expansion-panel title="Place" collapse-icon="mdi-map-marker" expand-icon="mdi-map-marker">
          <v-expansion-panel-text>

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
                    <template v-slot:item.fromSite="{ item, index }">
                      {{ item.startSite?.label }} {{ formatDate(item.startTimestamp) }}
                    </template>
                    <template v-slot:item.toSite="{ item }">
                      {{ item.endSite?.label }} {{  formatDate(item.endTimestamp) }}
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
        <v-expansion-panel title="Tooltips" collapse-icon="mdi-tooltip-outline" expand-icon="mdi-tooltip-outline">
          <v-expansion-panel-text>
            <v-checkbox v-model="modelMap.showTooltips" label="Show Tooltips for Markers"></v-checkbox>
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

</template>
<script setup>

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate } = useDateTimeLibrary();

const timelineToEdit = ref(null)

const showTimelineEditorPopup = ref(false)
const saveTimeline = () => {
  showTimelineEditorPopup.value = false
  // TODO update timeline??
}

const modelMap = defineModel('map');
const emit = defineEmits([]);

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


  { title: 'Label', value: 'label' },
  { title: 'From Site', value: 'fromSite' },
  { title: 'To Site', value: 'toSite' },
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

</script>