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
                <v-text-field v-model="modelSite.address" label="Address"></v-text-field>
                <v-text-field v-model="modelSite.city" label="City"></v-text-field>
                <v-text-field v-model="modelSite.country" label="Country"></v-text-field>
                <v-select v-model="modelSite.resolution" label="Resolution"
                  hint="How exact or roundabout is this location to be interpreted?"
                  :items="resolutionOptions"></v-select>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Time" collapse-icon="mdi-clock" expand-icon="mdi-clock">
              <v-expansion-panel-text>
                <!-- 'Exact Timestamp (high accuracy, down to minute)', value: 0 },
  { title: 'Hour ', value: 2 },
  { title: 'Part of Day (morning, afternoon, evening)  ', value: 4 },
  { title: 'Day', value: 6 },
  { title: 'Month', value: 8 },
  { title: 'Season (Summer, Fall, Winter, Spring)', value: 10 },
  { title: 'Year', value: 12 },
  { title: 'Decade', value: 14 },
  { title: 'Century', value: 16 },-->

                <v-text-field label="Date" type="date" v-model="modelSite.datePart"
                  v-if="modelSite.timeGrain < 8"></v-text-field>
                <v-text-field label="Time" type="time" v-model="modelSite.timePart"
                  v-if="modelSite.timeGrain < 2"></v-text-field>
                <v-text-field label="Year" type="number" v-model="year"
                  v-if="(modelSite.timeGrain > 6 && modelSite.timeGrain < 13)" />
                <v-select :items="utcTimezones" item-title="label" item-value="value" label="Select Timezone" outlined
                  v-model="modelSite.timezoneOffset" v-if="modelSite.timeGrain < 8"></v-select>
                <div class="text-caption" v-if="modelSite.timeGrain == 2">Set Hour
                  <v-slider v-model="hours" v-if="modelSite.timeGrain == 2" min="0" max="23" step="1"
                    thumb-label="always" thumb-size="15" :ticks="hourTickLabels" show-ticks="always"></v-slider>
                </div>
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

                <v-select v-model="modelSite.timeGrain" label="Time grain"
                  hint="How exact or roundabout is the timestamp to be interpreted?"
                  :items="timeGrainOptions"></v-select>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Description & Tags" collapse-icon="mdi-pencil-box-outline"
              expand-icon="mdi-pencil-box-outline">
              <v-expansion-panel-text>
                <v-combobox v-model="modelSite.tags" :items="storyTags" chips clearable deletable-chips multiple
                  label="Enter tags" append-icon="mdi-tag-plus" @change="handleTagChange"
                  :menu-props="{ maxHeight: 'auto' }"></v-combobox>
                <v-textarea v-model="modelSite.description" label="Description" auto-grow clearable></v-textarea>
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
                Attachments
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
const modelSite = defineModel('site');
const emit = defineEmits(['saveSite', 'closeDialog']);
const props = defineProps({ storyTags: Array });

import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { utcTimezones } = useDateTimeLibrary();

const selectedTimezone = ref(null); // offset in minute from UTC time
const hours = ref(new Date().getHours());
const year = ref(new Date().getFullYear());

const dayPart = ref(null);
const season = ref(null);

import { useImagesStore } from "../store/imagesStore";
const imagesStore = useImagesStore()

import { useLocationLibrary } from '@/composables/useLocationLibrary';
import TooltipDirectionSelector from '@/components/TooltipDirectionSelector.vue'
import IconSelector from '@/components/IconSelector.vue'
import AttachmentEditor from '@/components/AttachmentEditor.vue'

const { mapZoomToResolution, isValidCoordinateFormat, isValidGeoJSON, reverseGeocode, createSiteFromGeoJSON } = useLocationLibrary();
import { useFunctionCallThrottler } from '@/composables/useFunctionCallThrottler';
const { enqueueCall: enqueueCallToReverseGeocode } = useFunctionCallThrottler(1500, reverseGeocode);

//import { ref, onMounted } from 'vue';

const imageEditorRef = ref(null)
const attachmentToEdit = ref(null)
const showAttachmentEditorPopup = ref(false)

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


const addAndEditAttachment = () => {
  attachmentToEdit.value = { label: 'new attachment', description: 'new attachment description', imageUrl: null, imageId: null }
  showAttachmentEditorPopup.value = true
}

const saveAttachment = () => {
  if (!modelSite.value.attachments) modelSite.value.attachments = []
  modelSite.value.attachments.push(attachmentToEdit.value) // this will work for new attachments; existing ones should be updated or replaced
  showAttachmentEditorPopup.value = false
}
const handleTagChange = (newValue) => {
  // Handle the change event
  // This is where you might want to add logic to update the list of tags
  // For example, you could add the newly entered tag to `availableTags`
  // if it doesn't already exist, assuming you want to save it for future suggestions.
  console.log('Tags updated:', newValue);
}

onMounted(() => {
  hours.value = modelSite.value.timePart.substring(0, 2)
  year.value = modelSite.value.datePart.substring(0, 4)

  let month = parseInt(modelSite.value.datePart.substring(5, 7))
  month = findClosestValue(month, [2, 5, 8, 11]) 

  season.value = (month == 2 ? 0 : (month == 5 ? 1 : (month == 8 ? 2 : 3)))
  dayPart.value = modelSite.value.timePart.substring(0, 2)
  dayPart.value = findClosestValue(dayPart.value, [3, 9, 15, 21]) // closest value from 3, 9, 15, 21
  console.log(`month`, month.value)
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

const seasonMonthMap = {0:  '02',1:  '05',2:  '08',3:  '11'}

const saveSite = () => {
  if (modelSite.value.timeGrain == 10) { // season
    // set date from year and day - month for season based on northern hemisphere
    modelSite.value.datePart = `${year.value}-${seasonMonthMap[season.value]}-10`
    console.log(`season value`, seasonMonthMap[season.value])
  }
  console.log(`date part`, modelSite.value.datePart)

  if (modelSite.value.timeGrain == 4) { // day part
    // set time from time for day part
    modelSite.value.timePart = `${dayPart.value<10 ? '0' : ''}${dayPart.value}:00`

  }
  if (modelSite.value.timeGrain == 2) { // hour
    modelSite.value.timePart = `${hours.value<10 ? '0' : ''}${hours.value}:00`

  }

  modelSite.value.tags = []
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