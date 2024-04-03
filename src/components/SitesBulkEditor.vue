<template>
  <v-card>
    <v-card-title>
      <span class="headline">Add Tags to Selected Sites</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-form ref="form">
          <v-combobox v-model="tagSelection" :items="storyTags" chips clearable deletable-chips multiple
            label="Enter tags to add to all sites" append-icon="mdi-tag-plus" @change="handleTagChange"
            :menu-props="{ maxHeight: 'auto' }"></v-combobox>
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
const emit = defineEmits([ 'closeSitesDialog']);
const props = defineProps({ storyTags: Array });
const tagSelection = ref([]); // 

import { useStorieStore } from "@/store/storiesStore";
const storiesStore = useStorieStore()

const handleTagChange = (newValue) => {
  // Handle the change event
  // This is where you might want to add logic to update the list of tags
  // For example, you could add the newly entered tag to `availableTags`
  // if it doesn't already exist, assuming you want to save it for future suggestions.
  console.log('Tags updated:', newValue);
}

onMounted(() => {
});

const saveSites = () => {
  modelSite.value.forEach((site) => {
    if (!site.tags) {
      site.tags = []
    }
    const tags = new Set([...site.tags, ...tagSelection.value])
    site.tags = [...tags]
    storiesStore.updateSite(site)
  })
  emit('closeSitesDialog', {})

}

const closeDialog = () => {
  emit('closeSitesDialog', {})
}

</script>