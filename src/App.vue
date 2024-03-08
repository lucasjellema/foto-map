<template>
  <v-app>
    <v-app-bar app >
      <v-toolbar-title>FotoMapp


      </v-toolbar-title>
      <v-img src="/app-bar-background-conclusion.jpg" height="80" ></v-img>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStorieStore } from "./store/storiesStore";

import { useRouter } from 'vue-router'

const router = useRouter()
const store = useStorieStore()
const storyData = store.stories;

// import { useImagesStore } from "./store/imagesStore";
// const imagesStore = useImagesStore()

// const storyImageSrc = ref()

const currentStory = computed(() => store.currentStory)

// watch(currentStory, async (newCurrentStory) => {
//   if (newCurrentStory) {
//     if (newCurrentStory.imageId) {
//       const url = await imagesStore.getUrlForIndexedDBImage(newCurrentStory.imageId)
//       storyImageSrc.value = url
//     } else {
//       storyImageSrc.value = newCurrentStory.imageUrl
//     }
//     router.push('/storyCover')
//     dialog.value = false
//   }
// })

// const gotoStory = () => {
//   if (currentStory.value) {
    	
  
//   router.push('/storyCover')
//   }
// }

onMounted(() => {
    console.log(` rerieve or create and save current story`)
    // does a story exist? if not, create it
    if (store.stories.length==0) {
      // create default story
      store.addStory({label: 'Default', imageUrl: 'https://picsum.photos/id/237/200/300'})
      console.log(store.stories[0])
    }
    // the first story is the current story
    store.setCurrentStory(store.stories[0])
});

const selectedStory = computed({
  get: () => store.currentStory,
  set: (value) => {
    store.setCurrentStory(value)
  },
})


</script>
