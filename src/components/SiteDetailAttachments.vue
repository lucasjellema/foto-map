<template>
  <v-card>
    <v-card-title>
      <v-icon>mdi-attachment</v-icon>
      <span class="headline">Attachments for Site {{ modelSite.label }}</span>
    </v-card-title>
    <v-card-text>
      <v-container>

        <!-- <Carousel :value="modelSite?.attachments" :numVisible="1" :numScroll="1" verticalViewPortHeight="350px"
          contentClass="flex align-items-center">
          <template #item="slotProps">
            <div class="border-1 surface-border border-round m-2  p-3">
              <div class="mb-3">
                <div class="relative mx-auto">
                  <v-img width="400" cover :src="slotProps.data.imageUrl"></v-img>

                </div>
              </div>
              <div class="mb-3 ">{{ slotProps.data.label }}</div>
              <div class="flex justify-content-between align-items-center">
                <div class="mt-0 font-semibold text-xl">{{ slotProps.data.description }}</div>

              </div>
            </div>
          </template>
</Carousel> -->
        <v-carousel :height="550" show-arrows="hover">

          <v-carousel-item v-for="(attachment, index) in modelSite?.attachments">
            <v-container>
              <v-row>
                <v-col cols="7" offset="1">
                  <v-img width="400" cover :src="attachmentImageURLs[index]"></v-img>
                </v-col>
                <v-col cols="4">
                  <div>
                    <h2>{{ attachment.label }}</h2>
                    <v-spacer></v-spacer>
                    <!-- TODO make sure description is a proper delta document -->
                    <QuillEditor theme="bubble" :toolbar="[]" v-model:content="attachment.description" contentType="delta" :readOnly="true" v-if=" attachment?.description"/>

                  </div>
                </v-col>
              </v-row>
            </v-container>

          </v-carousel-item>
        </v-carousel>

      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="blue darken-1" text @click="closeDialog">Close</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script setup>
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';


import { useImagesStore } from "../store/imagesStore";
const imagesStore = useImagesStore()

const modelSite = defineModel('site');
const emit = defineEmits(['closeDialog']);


import Carousel from 'primevue/carousel';

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


onMounted(() => {
  initializeAttachmentImageURLs()
});


const closeDialog = () => {
  emit('closeDialog', {})
}


</script>