<template>
  <v-card>
    <v-card-title>
      <span class="headline">Add Tags to Selected Sites {{ mode }}</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-combobox v-model="tagSelection" :items="storyTags" chips clearable deletable-chips multiple
            label="Enter tags to add to all sites" append-icon="mdi-tag-plus" @change="handleTagChange"
            :menu-props="{ maxHeight: 'auto' }" v-if="mode == 'tags'"></v-combobox>
          <v-select :items="utcTimezones" item-title="label" item-value="value" label="Select Timezone" outlined
            v-model="selectedTimezone" v-if="mode == 'timezone'"></v-select>

          <v-select :items="tours" item-title="label" label="Select Tour" outlined v-model="selectedTour"
            :return-object="true" v-if="mode == 'tour'"></v-select>
        </v-form>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>

      <v-btn color="blue darken-1" text @click="saveSites">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script setup>
const modelSite = defineModel('sites');
const emit = defineEmits(['closeSitesDialog']);
const props = defineProps({ storyTags: Array, mode: String, tours: Array });
const tagSelection = ref([]); // 
const selectedTimezone = ref(0);
const selectedTour = ref(null);

import { useStorieStore } from "@/store/storiesStore";
const storiesStore = useStorieStore()
import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { utcTimezones } = useDateTimeLibrary();

const handleTagChange = (newValue) => {
  // Handle the change event
  // This is where you might want to add logic to update the list of tags
  // For example, you could add the newly entered tag to `availableTags`
  // if it doesn't already exist, assuming you want to save it for future suggestions.
  console.log('Tags updated:', newValue);
}

onMounted(() => {
  console.log(`mode is `, props.mode)
});

const saveSites = () => {
  if (props.mode == 'tour') {
    if (selectedTour.value) {
      if (!selectedTour.value.sites) {
        selectedTour.value.sites = []
      }
      // add the id of all sites to the selected tour but ensure the id is unique
      modelSite.value.forEach((site) => {
        if (!selectedTour.value.sites.includes(site.id)) {
          selectedTour.value.sites.push(site.id)
        }
      })
    }
  } else {


    modelSite.value.forEach((site) => {
      if (!site.tags) {
        site.tags = []
      }
      const tags = new Set([...site.tags, ...tagSelection.value])
      site.tags = [...tags]
      if (props.mode == 'timezone') {
        site.timezoneOffset = selectedTimezone.value

      }
      storiesStore.updateSite(site)
    })
  }
  emit('closeSitesDialog', {})

}

const closeDialog = () => {
  emit('closeSitesDialog', {})
}

</script>