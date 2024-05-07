<template>
  <v-card>
    <v-card-title>
      <span class="headline">Edit Site {{ modelSite.label }}</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-text-field v-model="modelSite.label" label="Label" required></v-text-field>
          <v-expansion-panels :multiple="true">
            <v-expansion-panel title="Place" collapse-icon="mdi-map-marker" expand-icon="mdi-map-marker">
              <v-expansion-panel-text>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field v-model="modelSite.address" label="Address"></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="6">
                      <v-text-field v-model="modelSite.street" label="Street"></v-text-field>
                    </v-col>
                    <v-col cols="6">

                      <v-text-field v-model="modelSite.city" label="City"></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="4">
                      <v-text-field v-model="modelSite.county" label="County"></v-text-field>

                    </v-col>
                    <v-col cols="4">
                      <v-text-field v-model="modelSite.state" label="State"></v-text-field>
                    </v-col>
                    <v-col cols="4">
                      <v-text-field v-model="modelSite.country" label="Country"></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-select v-model="modelSite.resolution" label="Resolution"
                        hint="How exact or roundabout is this location to be interpreted?" :items="resolutionOptions"></v-select></v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      
                      Refresh through geocoding coordinates  <v-btn @click="refreshLocationDetailsThroughGeocoder(modelSite)"
                        icon="mdi-map-marker-down"></v-btn>
                    </v-col>
                  </v-row>
                </v-container>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Time" collapse-icon="mdi-clock" expand-icon="mdi-clock">
              <v-expansion-panel-text>
                <v-container class="mb-0 mt-1">
                  <v-row v-if="modelSite.timeGrain < 8" class="mb-0 mt-2">
                    <v-col cols="5">
                      <v-text-field label="Date" type="date" v-model="modelSite.datePart"
                        v-if="modelSite.timeGrain < 8"></v-text-field>
                    </v-col>
                    <v-col cols="5">
                      <v-text-field label="Time" type="time" v-model="modelSite.timePart"
                        v-if="modelSite.timeGrain < 2"></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row v-if="(modelSite.timeGrain > 6 && modelSite.timeGrain < 13)">
                    <v-col cols="7" v-if="modelSite.timeGrain == 8">
                      <v-select :items="months" item-title="name" item-value="id" label="Select Month" outlined
                        v-model="month" v-if="modelSite.timeGrain == 8"></v-select>
                    </v-col>
                    <v-col cols="5">

                      <v-text-field label="Year" type="number" v-model="year"
                        v-if="(modelSite.timeGrain > 6 && modelSite.timeGrain < 13)" />
                    </v-col>
                  </v-row>
                  <v-row v-if="modelSite.timeGrain < 8" class="mb-0 mt-0">
                    <v-col cols="12">
                      <v-select :items="utcTimezones" item-title="label" item-value="value" label="Select Timezone"
                        outlined v-model="modelSite.timezoneOffset" v-if="modelSite.timeGrain < 8"></v-select>
                    </v-col>
                  </v-row>
                  <v-row v-if="modelSite.timeGrain == 2" class="mb-0 mt-0">
                    <v-col cols="12">
                      <div class="text-caption" v-if="modelSite.timeGrain == 2">Set Hour
                        <v-slider v-model="hours" v-if="modelSite.timeGrain == 2" min="0" max="23" step="1"
                          thumb-label="always" thumb-size="15" :ticks="hourTickLabels" show-ticks="always"></v-slider>
                      </div>
                    </v-col>
                  </v-row>
                  <v-row v-if="modelSite.timeGrain == 4 || modelSite.timeGrain == 10" class="mb-1 mt-1">
                    <v-col cols="12">
                      <v-radio-group v-model="dayPart" v-if="modelSite.timeGrain == 4" label="Day Part" inline>
                        <v-radio label="Night" :value="3"></v-radio>
                        <v-radio label="Morning" :value="9"></v-radio>
                        <v-radio label="Afternoon" :value="15"></v-radio>
                        <v-radio label="Evening" :value="21"></v-radio>
                      </v-radio-group>
                      <v-radio-group v-model="season" v-if="modelSite.timeGrain == 10" label="Season" inline>
                        <v-radio label="Winter" :value="0"></v-radio>
                        <v-radio label="Spring" :value="1"></v-radio>
                        <v-radio label="Summer" :value="2"></v-radio>
                        <v-radio label="Fall" :value="3"></v-radio>
                      </v-radio-group>


                    </v-col>
                  </v-row>
                  <v-row class="mb-0 mt-0">
                    <v-col cols="12">
                      <v-select v-model="modelSite.timeGrain" label="Time grain"
                        hint="How exact or roundabout is the timestamp to be interpreted?"
                        :items="timeGrainOptions"></v-select>
                    </v-col>
                  </v-row>

                </v-container>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Duration" collapse-icon="mdi-timer-marker-outline"
              expand-icon="mdi-timer-marker-outline">
              <v-expansion-panel-text>
                <v-container>
                  <v-row class="mb-0 mt-0">
                    <v-col cols="2">
                      <v-checkbox v-model="modelSite.hasDuration" label="Has duration?"></v-checkbox>

                    </v-col>
                    <v-col cols="10" v-if="modelSite.hasDuration">
                      <v-text-field label="Minutes" type="number" v-model="durationMinutes" />
                      <v-text-field label="Hours" type="number" v-model="durationHours" />
                      <v-text-field label="Days" type="number" v-model="durationDays" />
                      <v-text-field label="Months" type="number" v-model="durationMonths" />
                      <v-text-field label="Years" type="number" v-model="durationYears" />
                    </v-col>
                  </v-row>
                </v-container>
              </v-expansion-panel-text>
            </v-expansion-panel> <v-expansion-panel title="Description & Tags" collapse-icon="mdi-pencil-box-outline"
              expand-icon="mdi-pencil-box-outline">
              <v-expansion-panel-text>
                <v-sheet class="flex-1-1-100  ma-0 pa-0">
                  <QuillEditor theme="snow" toolbar="essential" v-model:content="description" contentType="delta" />
                </v-sheet>
                <v-combobox v-model="modelSite.tags" :items="storyTags" chips clearable deletable-chips multiple
                  label="Enter tags" append-icon="mdi-tag-plus" @change="handleTagChange"
                  :menu-props="{ maxHeight: 'auto' }" class="ma-0 mt-5" </v-combobox>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Image" collapse-icon="mdi-image" expand-icon="mdi-image">
              <v-expansion-panel-text>
                <image-editor :image-url="modelSite.imageUrl" :image-id="modelSite.imageId" ref="imageEditorRef"
                  image-height=600 image-width=800 @image-change="handleImageChange"></image-editor>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Attachments" collapse-icon="mdi-attachment" expand-icon="mdi-attachment">
              <v-expansion-panel-text>

                '<v-data-table :headers="attachmentHeaders" :items="modelSite.attachments" item-key="label"
                  class="elevation-1">
                  <template v-slot:item.thumbnail="{ item, index }">
                    
                    <v-img width="80" :src="attachmentImageURLs[index]" class="thumbnail"></v-img>
                  </template>
                  <template v-slot:item.actions="{ item, index }">
                    <v-icon small @click="editAttachment(item, index)">
                      mdi-pencil
                    </v-icon>
                    <v-icon small @click="removeAttachment(item, index)">
                      mdi-delete
                    </v-icon>
                  </template>
                </v-data-table>

                <v-btn prepend-icon="mdi-attachment-plus" @click="addAndEditAttachment()">Add Attachment</v-btn>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Style" collapse-icon="mdi-brush" expand-icon="mdi-brush">
              <v-expansion-panel-text>
                <v-container>
                  <v-row>
                    <v-col cols="2">
                      <div>Tooltip Color</div>
                      <div
                        :style="{ backgroundColor: modelSite.tooltipColor, width: '100px', height: '50px', cursor: 'pointer', border: '1px solid black' }"
                        @click="showtooltipColorPicker = !showtooltipColorPicker"></div>
                      <v-dialog v-model="showtooltipColorPicker" width="300px">
                        <v-card>
                          <v-color-picker v-model="modelSite.tooltipColor" hide-inputs></v-color-picker>
                        </v-card>
                      </v-dialog>
                    </v-col>
                    <v-col cols="2">
                      <div>Background</div>
                      <div
                        :style="{ backgroundColor: modelSite.tooltipBackgroundColor, width: '100px', height: '50px', cursor: 'pointer', border: '1px solid black' }"
                        @click="showtooltipBackgroundColorPicker = !showtooltipBackgroundColorPicker"></div>
                      <v-dialog v-model="showtooltipBackgroundColorPicker" width="300px">
                        <v-card>
                          <v-color-picker v-model="modelSite.tooltipBackgroundColor" hide-inputs></v-color-picker>
                        </v-card>
                      </v-dialog>
                    </v-col>

                    <v-col cols="2">
                      <v-checkbox v-model="modelSite.showTooltip" label="Show Label on Map"></v-checkbox>
                    </v-col>
                    <v-col cols="4" offset="1">
                      <div>Pick location of tooltip</div>
                      <TooltipDirectionSelector v-model="modelSite.tooltipDirection"></TooltipDirectionSelector>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="2">
                      <div>Pick Icon for the Toolip</div>
                    </v-col>
                    <v-col cols="2" offset="1">
                      <v-btn @click="modelSite.tooltipIcon = ''">Clear Icon</v-btn>
                    </v-col>
                    <v-col cols="2" offset="2">
                      <v-radio-group v-model="modelSite.tooltipSize">
                        <v-radio label="Small" :value="0"></v-radio>
                        <v-radio label="Normal" :value="1"></v-radio>
                        <v-radio :value="2" label="Large"></v-radio>
                      </v-radio-group>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="8">
                      <IconSelector v-model="modelSite.tooltipIcon"></IconSelector>
                    </v-col>
                  </v-row>

                </v-container>

              </v-expansion-panel-text>
            </v-expansion-panel>

          </v-expansion-panels>
        </v-form>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>

      <v-btn color="blue darken-1" text @click="saveSite">Save</v-btn>
    </v-card-actions>
  </v-card>
  <v-dialog v-model="showAttachmentEditorPopup" max-width="800px">
    <AttachmentEditor v-model="attachmentToEdit" @saveAttachment="saveAttachment()"
      @closeDialog="showAttachmentEditorPopup = false"></AttachmentEditor>
  </v-dialog>
</template>
<script setup>

import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';

import { useQuillUtilsLibrary } from '@/composables/useQuillUtilsLibrary';
const { ensureDeltaFormat } = useQuillUtilsLibrary();

const modelSite = defineModel('site');
const emit = defineEmits(['saveSite', 'closeDialog']);
const props = defineProps({ storyTags: Array });

// array of objects with name of month and id of month
const months = [
  { name: 'January', id: 1 },
  { name: 'February', id: 2 },
  { name: 'March', id: 3 },
  { name: 'April', id: 4 },
  { name: 'May', id: 5 },
  { name: 'June', id: 6 },
  { name: 'July', id: 7 },
  { name: 'August', id: 8 },
  { name: 'September', id: 9 },
  { name: 'October', id: 10 },
  { name: 'November', id: 11 },
  { name: 'December', id: 12 }

]

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { utcTimezones } = useDateTimeLibrary();

const selectedTimezone = ref(null); // offset in minute from UTC time
const hours = ref(new Date().getHours());
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth());
const hasDuration = ref(false);
const durationHours = ref(null);
const durationMinutes = ref(null);
const durationDays = ref(null);
const durationMonths = ref(null);
const durationYears = ref(null);

const dayPart = ref(null);
const season = ref(null);
const description = ref(null)
import { useImagesStore } from "../store/imagesStore";
const imagesStore = useImagesStore()

import { useLocationLibrary } from '@/composables/useLocationLibrary';
import TooltipDirectionSelector from '@/components/TooltipDirectionSelector.vue'
import IconSelector from '@/components/IconSelector.vue'
import AttachmentEditor from '@/components/AttachmentEditor.vue'
const attachmentHeaders = ref([
{ title: 'Label', value: 'label' },
{ title: 'Thumbnail', value: 'thumbnail' },
  { title: 'Actions', value: 'actions' },
])
const { mapZoomToResolution, isValidCoordinateFormat, isValidGeoJSON, reverseGeocode, createSiteFromGeoJSON } = useLocationLibrary();
import { useFunctionCallThrottler } from '@/composables/useFunctionCallThrottler';
const { enqueueCall: enqueueCallToReverseGeocode } = useFunctionCallThrottler(1500, reverseGeocode);

//import { ref, onMounted } from 'vue';

const imageEditorRef = ref(null)
const attachmentToEdit = ref(null)
let newAttachment = false
const showAttachmentEditorPopup = ref(false)

const attachmentImageURLs = ref({})
  
const initializeAttachmentImageURLs = () => {
  if (modelSite.value.attachments)
  modelSite.value.attachments.forEach(async (attachment, index) =>  {
    let imageUrl = null
    if (attachment.imageId) {
      imageUrl = await imagesStore.getUrlForIndexedDBImage(attachment.imageId)
    } else if (attachment.imageUrl) {
      imageUrl = attachment.imageUrl
    }
    attachmentImageURLs.value[index]= imageUrl 
  })
}

const hourTickLabels = {
  0: '0',
  3: '3',
  6: '6',
  9: '9',
  12: '12',
  15: '15',
  18: '18',
  21: '21'
}


const refreshLocationDetailsThroughGeocoder = (site) => {
  console.log('refreshLocationDetailsThroughGeocoder'+site.id + site.geo)

  reverseGeocode(site.geoJSON.features[0], site);
}

const addAndEditAttachment = () => {
  attachmentToEdit.value = { label: 'new attachment', description: null, imageUrl: null, imageId: null }
  newAttachment = true
  showAttachmentEditorPopup.value = true
}

const editAttachment = (item, index) => {
  attachmentToEdit.value = item
  newAttachment = false
  showAttachmentEditorPopup.value = true
}

const removeAttachment = (item, index) => {
  console.log(`remove attachment ${index} ${item.label}`)
  modelSite.value.attachments.splice(index, 1)
  initializeAttachmentImageURLs()
}

const saveAttachment = () => {
  if (!modelSite.value.attachments) modelSite.value.attachments = []
  console.log(attachmentToEdit.value.description)
  if (newAttachment) {
    modelSite.value.attachments.push(attachmentToEdit.value)
  }
  showAttachmentEditorPopup.value = false
  initializeAttachmentImageURLs()
}
const handleTagChange = (newValue) => {
  // Handle the change event
  // This is where you might want to add logic to update the list of tags
  // For example, you could add the newly entered tag to `availableTags`
  // if it doesn't already exist, assuming you want to save it for future suggestions.
  console.log('Tags updated:', newValue);
}

onMounted(() => {

  description.value = modelSite.value.description
  hours.value = modelSite.value.timePart.substring(0, 2)
  year.value = modelSite.value.datePart.substring(0, 4)

  let _month = parseInt(modelSite.value.datePart.substring(5, 7))
  _month = findClosestValue(month, [2, 5, 8, 11])

  season.value = (_month == 2 ? 0 : (_month == 5 ? 1 : (_month == 8 ? 2 : 3)))
  dayPart.value = modelSite.value.timePart.substring(0, 2)
  dayPart.value = findClosestValue(dayPart.value, [3, 9, 15, 21]) // closest value from 3, 9, 15, 21

  if (modelSite.value.duration) {
    hasDuration.value = true
    durationHours.value = modelSite.value.duration.hours
    durationDays.value = modelSite.value.duration.days
    durationMinutes.value = modelSite.value.duration.minutes
    durationMonths.value = modelSite.value.duration.months
    durationYears.value = modelSite.value.duration.years
  }
  initializeAttachmentImageURLs()

});

function findClosestValue(t, values = [3, 9, 15, 21]) {
  // Define the set of possible closest values
  //const values = [3, 9, 15, 21];

  // Initialize variables to keep track of the closest value and smallest difference found
  let closest = values[0];
  let smallestDiff = Math.abs(t - values[0]);

  // Iterate over the possible values
  values.forEach(value => {
    const diff = Math.abs(t - value);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = value;
    }
  });

  // Return the closest value found
  return closest;
}

const seasonMonthMap = { 0: '02', 1: '05', 2: '08', 3: '11' }

const saveSite = () => {
  const site = modelSite.value
  site.description = description.value
  console.log(JSON.stringify(site.description, null, 2))
  console.log(`site`, site, modelSite.value.timeGrain)
  if (modelSite.value.timeGrain == 12) { // year
    // set date from year and 1st July
    modelSite.value.datePart = `${year.value}-07-01`
  }
  if (modelSite.value.timeGrain == 10) { // season
    // set date from year and day - month for season based on northern hemisphere
    modelSite.value.datePart = `${year.value}-${seasonMonthMap[season.value]}-10`
    console.log(`season value`, seasonMonthMap[season.value])
  }
  console.log(`date part`, modelSite.value.datePart)
  if (modelSite.value.timeGrain == 8) { // month
    // set date from year and day - month for season based on northern hemisphere
    modelSite.value.datePart = `${year.value}-${month.value < 10 ? '0' : ''}${month.value}-15`
  }
  if (modelSite.value.timeGrain == 4) { // day part
    // set time from time for day part
    modelSite.value.timePart = `${dayPart.value < 10 ? '0' : ''}${dayPart.value}:00`

  }
  if (modelSite.value.timeGrain == 2) { // hour
    modelSite.value.timePart = `${hours.value < 10 ? '0' : ''}${hours.value}:00`

  }

  // duration
  const duration = { years: durationYears.value, months: durationMonths.value, days: durationDays.value, hours: durationHours.value, minutes: durationMinutes.value, seconds: 0 }
  modelSite.value.duration = duration



  emit('saveSite', {})
}

const closeDialog = () => {
  emit('closeDialog', {})
}


const resolutionOptions = [
  { title: 'Exact Address (high accuracy)', value: 0 },
  { title: 'City ', value: 1 },
  { title: 'Area/State/Province ', value: 2 },
  { title: 'Country', value: 3 },
  { title: 'Continent', value: 4 },
]

const timeGrainOptions = [
  { title: 'Exact Timestamp (high accuracy, down to minute)', value: 0 },
  { title: 'Hour ', value: 2 },
  { title: 'Part of Day (morning, afternoon, evening)  ', value: 4 },
  { title: 'Day', value: 6 },
  { title: 'Month', value: 8 },
  { title: 'Season (Summer, Fall, Winter, Spring)', value: 10 },
  { title: 'Year', value: 12 },
  { title: 'Decade', value: 14 },
  { title: 'Century', value: 16 },
]
const showtooltipColorPicker = ref(false)
const showtooltipBackgroundColorPicker = ref(false)

const handleImageChange = (event) => {
  modelSite.value.imageId = event.imageId
  modelSite.value.imageUrl = event.imageUrl
}



</script>
<style>
/*change the number below to scale to the appropriate size*/ 
.thumbnail:hover { 
transform: scale(3); 
z-index: 900;

}
</style>