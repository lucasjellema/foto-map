<template>
    <v-card-text>{{ formatDateByGrain(site?.timestamp,site?.timezoneOffset, site.timeGrain) }}
      {{ site?.street }},{{ site?.city }}{{ site?.county?', '+site.county:'' }}{{ site?.state?', '+site.state:'' }}{{ site?.country?', '+site.country:'' }}
      
      {{ site?.geoJSON?.features[0]?.geometry?.coordinates[2] ? ` (∆
      ${site?.geoJSON.features[0].geometry.coordinates[2].toFixed(0)}m)` : '' }}
      <div v-if="site?.attachments?.length > 0">


      </div>
      <div>
        <v-img width="500" cover :src="site?.imageUrl" content-class="hover-zoom"></v-img>    
        <QuillEditor theme="bubble" :toolbar="[]" v-model:content="siteDescription" contentType="delta" :readOnly="true" v-if="site?.description"/>
      </div>

      <div v-if="site?.tags?.length > 0">
        <v-chip v-for="tag in site?.tags" class="ma-2">
          {{ tag }}
        </v-chip>
      </div>
      <!-- <div class="mt-3">
        <ShowTimeAnalog v-if="site?.timestamp" :timestamp="site.timestamp"></ShowTimeAnalog>
      </div> -->
      <div v-if="site?.attachments?.length > 0">
        <v-btn @click="showSiteDetailAttachmentsPopup = true" prepend-icon="mdi-attachment">Show</v-btn>
      </div>
    </v-card-text>
  

  <v-dialog v-model="showSiteDetailAttachmentsPopup" max-width="1000px">
    <SiteDetailAttachments v-model:site="site" @closeDialog="showSiteDetailAttachmentsPopup = false">
    </SiteDetailAttachments>
  </v-dialog>
</template>
<script setup>
import { QuillEditor, Delta } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
const site = defineModel('site');
const emit = defineEmits(['closeDialog']);
const showSiteDetailAttachmentsPopup = ref(false);
const siteDescription = computed(() => {
  if (site.value?.description instanceof Delta)  return site.value?.description
  return new Delta(site.value?.description)
})


import Carousel from 'primevue/carousel';
import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDateByGrain } = useDateTimeLibrary();



onMounted(() => {
  console.log("siteDetails mounted", site.value)
});


const closeDialog = () => {
  emit('closeDialog', {})
}


</script>