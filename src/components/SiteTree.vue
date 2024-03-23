<template>
  <Tree :value="sitesTreeData" v-model:selectionKeys="selectedKey" class="w-full md:w-30rem tree-override" ref="treeRef"
    selectionMode="multiple" :filter="true"></Tree>

  <ContextMenu ref="contextMenu" :model="contextMenuItems"></ContextMenu>
</template>
<script setup>

import { useStorieStore } from "@/store/storiesStore";
import { computed } from 'vue';
import Tree from 'primevue/tree';
import ContextMenu from 'primevue/contextmenu';
const storiesStore = useStorieStore()
const currentStory = computed(() => storiesStore.currentStory)
const contextMenu = ref(null);

import { useSitesTreeLibrary } from '@/composables/useSitesTreeLibrary';
const { getSitesTreeData } = useSitesTreeLibrary();
const sitesTreeData = computed(() => getSitesTreeData(currentStory.value.sites));
const contextMenuItems = ref([])
//   { label: 'Select Site', icon: 'pi pi-fw pi-pencil', command: () => selectSite() },
//   { label: 'Edit Site', icon: 'pi pi-fw pi-pencil', command: () => editSite() },
//   { label: 'Delete Site', icon: 'mdi mdi-delete', command: () => deleteSite() }
// ]


const emit = defineEmits(['siteSelected','siteAction']);
const props = defineProps({
});

const treeRef = ref(null);
const selectedKey = ref(null);



onMounted(() => {
  const treeElement = treeRef.value.$el; // Access the Tree DOM element
  treeElement.addEventListener('dblclick', handleDoubleClickOnTree);
  treeElement.addEventListener('contextmenu', handleContextMenuClickOnTree);

});

watch(selectedKey, (newselectedKey) => {
  // selectedkey is object with siteId as key and boolean as value
  const siteIds = Object.keys(newselectedKey)
  emit('siteSelected', siteIds)
})

const findSiteIdInTree = (currentElement) => {
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
  return { siteId: null };
}
const handleDoubleClickOnTree = (event) => {
  const { siteId } = findSiteIdInTree(event.target);
  console.log(siteId)
}

const handleContextMenuClickOnTree = (event) => {
  console.log(`contextmenu clicked on site ${event.target}`)
  contextMenuItems.value = []
  const { siteId } = findSiteIdInTree(event.target);
  if (siteId) {
//    contextMenuItems.value.push({ label: `Select Site ${siteId} `, icon: 'pi pi-fw pi-pencil', command: () => selectSite(siteId) })
    contextMenuItems.value.push({ label: `Edit Site`, icon: 'pi pi-fw pi-pencil'
    , command: () => { emit('siteAction',{action: 'edit', siteId:siteId}) }})
    contextMenuItems.value.push({ label: `Delete Site`, icon: 'midi mdi-delete'
    , command: () => { emit('siteAction',{action: 'delete', siteId:siteId}) }})
  
  }

  // const { siteId } = findSiteIdInTree(event.target);
  //console.log(siteId)
  contextMenu.value.show(event); // Show the PrimeVue ContextMenu
}

</script>
<style>
/* this class is defined in PrimeVue tree; it gets overridden by a Vuetify style; this next definition corrects this override to marke
   sure that child nodes are indented properly 
*/
.p-treenode-children {
  padding-left: 1rem !important;
}

.p-tree-filter-container .p-tree-filter {
  padding-top: 0px;
  padding-right: 1.125rem !important;
  padding-bottom: 1.125rem !important;
  padding-left: 1.125rem !important;
  margin-top: 10px;

}

.p-contextmenu {
  padding-top: 0.7rem !important;
  padding-right: 0.25rem !important;
  padding-bottom: 0.7rem !important;
  padding-left: 0.25rem !important;
  margin-top: 10px;

}

.p-menuitem {
  padding-top: 0.25rem !important;
  padding-right: 0.25rem !important;
  padding-bottom: 0.25rem !important;
  padding-left: 0.3rem !important;


}
</style>