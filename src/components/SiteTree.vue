<template>
  <Tree :value="sitesTreeData" v-model:selectionKeys="selectedKey" class="w-full md:w-30rem tree-override" ref="treeRef" selectionMode="multiple" ></Tree>
</template>
<script setup>

import { useStorieStore } from "@/store/storiesStore";
import { computed } from 'vue';
import Tree from 'primevue/tree';
const storiesStore = useStorieStore()
const currentStory = computed(() => storiesStore.currentStory)

import { useSitesTreeLibrary } from '@/composables/useSitesTreeLibrary';
const { getSitesTreeData } = useSitesTreeLibrary();
const sitesTreeData = computed(() => getSitesTreeData(currentStory.value.sites));

const emit = defineEmits(['siteSelected']);
const props = defineProps({
});

const treeRef = ref(null);
const selectedKey = ref(null);


onMounted(() => {
  const treeElement = treeRef.value.$el; // Access the Tree DOM element
  treeElement.addEventListener('dblclick', handleDoubleClickOnTree);

});

watch(selectedKey, (newselectedKey) => {
  // selectedkey is object with siteId as key and boolean as value
  const siteIds = Object.keys(newselectedKey)
  emit('siteSelected', siteIds)
})

const findSiteIdInTree= (currentElement)=> {
  while (currentElement && currentElement !== document) {
    if (currentElement.classList) {
      for (let className of currentElement.classList) {
        if (className.startsWith('site-')) {
          // Extract the part of the class name after "site-"
          const nameAfterSite = className.substring(5);
          return {
            element: currentElement, // The matching element
            siteId: nameAfterSite // The extracted string
          };
        }
      }
    }
    currentElement = currentElement.parentNode;
  }
  return null;
}
const handleDoubleClickOnTree = (event)=> {
  const {siteId} = findSiteIdInTree(event.target);
  console.log(siteId)
}

</script>
<style>
/* this class is defined in PrimeVue tree; it gets overridden by a Vuetify style; this next definition corrects this override to marke
   sure that child nodes are indented properly 
*/
.p-treenode-children {
  padding-left: 1rem !important;
}
</style>