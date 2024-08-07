<template>
  <Tree :value="sitesTreeData" v-model:selectionKeys="selectedKey" scrollable scrollHeight="700px"
    class="w-full md:w-30rem tree-override" ref="treeRef" selectionMode="multiple" :filter="true"
    filterPlaceholder="Enter search term" @node-select="handleNodeSelect" @node-unselect="handleNodeUnselect"></Tree>
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
const { getSitesTreeData, findLeafNodes,findNodeWithKey,findNodeWithId } = useSitesTreeLibrary();
const sitesTreeData = computed(() => getSitesTreeData(currentStory.value.sites, currentStory.value.mapConfiguration.timelines, currentStory.value.mapConfiguration.tours));
const contextMenuItems = ref([])



const emit = defineEmits(['siteSelected', 'siteAction']);
const props = defineProps(['storyReadOnly']);

const treeRef = ref(null);
const selectedKey = ref(null);



onMounted(() => {
  const treeElement = treeRef.value.$el; // Access the Tree DOM element
  treeElement.addEventListener('dblclick', handleDoubleClickOnTree);
  treeElement.addEventListener('click', handleClickOnTree);
  treeElement.addEventListener('contextmenu', handleContextMenuClickOnTree);

});

watch(selectedKey, (newselectedKey) => {
  // selectedkey is object with siteId as key and boolean as value
  const siteIds = Object.keys(newselectedKey).filter(key => newselectedKey[key]);// only selected sites
  emit('siteSelected', siteIds)
})


const resetSelection = () => {
  // remove all elements from the collection selectedKey without destroying the object
  selectedKey.value = {}
}

const findTreeKeyForElement = (currentElement) => {
  while (currentElement && currentElement !== document) {
    if (currentElement.classList) {
      for (let className of currentElement.classList) {
        if (className.startsWith('treekey|')) {
          // Extract the part of the class name after "treekey|"
          const nameAfterTreeKey = className.substring(8);
          nameAfterTreeKey.split('|')[0]
          return {
            element: currentElement,
            treeKey: nameAfterTreeKey,
            keyType: nameAfterTreeKey.split('|')[0],
            key: nameAfterTreeKey.split('|')[1],
            className: className
          };
        }
      }
    }
    currentElement = currentElement.parentNode;
  }
  return { siteId: null };
}


const handleDoubleClickOnTree = (event) => {
  const treeKey = findTreeKeyForElement(event.target)
  const treeData = treeRef.value.value
  const selectedNode = findNodeWithId(treeData, parseInt(treeKey.key))
  let siteIds = []
  if ((selectedNode.nodeType === 'year' || selectedNode.nodeType === 'month' || selectedNode.nodeType === 'day' || selectedNode.nodeType === 'tag' || selectedNode.nodeType === 'country' || selectedNode.nodeType === 'city' || selectedNode.nodeType === 'timeline'|| selectedNode.nodeType === 'tour')
    && selectedNode.key) {
    // find all sites under this key 
    siteIds = findLeafNodes(treeData, selectedNode.key).map(siteNode => siteNode.key)
  }
  resetSelection()
  if (selectedNode.nodeType === 'site' && selectedNode.key) {
    siteIds = [selectedNode.key]
  }
  
  let label 
  if (selectedNode) {
    label = selectedNode.label
    if (selectedNode.parent) {
      label = `${label} ${selectedNode.parent.label} `
      if (selectedNode.parent.parent) {
      label = `${label} ${selectedNode.parent.parent.label} `
    }

    }
  }

  emit('siteAction', { action: 'siteFocus', siteIds: siteIds, payload:{label: label} })
}

let lastSelectedNode, previouslySelectedNode, lastClickWasASelection = false, previousClickWasASelection = false


const handleNodeSelect = (selectedNode) => {
  if (selectedNode.leaf) {
    previousClickWasASelection = lastClickWasASelection
    lastClickWasASelection = true
    previouslySelectedNode = lastSelectedNode
    lastSelectedNode = selectedNode
  }
}

const handleNodeUnselect = (selectedNode) => {
  if (selectedNode.leaf) {
    previousClickWasASelection = lastClickWasASelection
    lastClickWasASelection = false
    previouslySelectedNode = lastSelectedNode
    lastSelectedNode = selectedNode
  }
}

const handleClickOnTree = (event) => {
  const treeKey = findTreeKeyForElement(event.target)
  const treeData = treeRef.value.value

  const selectedNode = findNodeWithId(treeData, parseInt(treeKey.key))
  if (selectedNode && selectedNode.nodeType && selectedNode.nodeType === 'site' && selectedNode.key) {
    if (event.shiftKey) {
      console.log(`tree was shift clicked - find all sites from ${previouslySelectedNode.key} to  ${lastSelectedNode.key}`)

      const children = lastSelectedNode.parent.children
      console.log(`children ${children.length}`)
      // loop over children 
      let inRange = false
      const siteIdsToSelect = []
      for (const child of children) {
        let justNow = false
        if (!inRange && (child.key == previouslySelectedNode.key || child.key == lastSelectedNode.key)) {

          inRange = true
          justNow = true
        }
        if (inRange) {
          siteIdsToSelect.push(child.key)
        }
        if (inRange && (child.key == lastSelectedNode.key || child.key == previouslySelectedNode.key) && !justNow) {
          inRange = false
        }

      }
      console.log(`siteIdsToSelect or unselect ${previousClickWasASelection} ${siteIdsToSelect}`)
      if (previousClickWasASelection) {

        emit('siteAction', { action: 'selectChildren', siteIds: siteIdsToSelect });
        const updatedSelection = { ...selectedKey.value };
        siteIdsToSelect.forEach(key => {
          updatedSelection[key] = true;
        });
        selectedKey.value = updatedSelection;
      } else {
        emit('siteAction', { action: 'unselectChildren', siteIds: siteIdsToSelect });
        const updatedSelection = { ...selectedKey.value };
        siteIdsToSelect.forEach(key => {
          updatedSelection[key] = false;
        });
        selectedKey.value = updatedSelection;
      }
    }

  }
  if (selectedNode.nodeType === 'timeline' && treeKey.key) {
    emit('siteAction', { action: 'selectTimeline', payload: { timelineId: treeKey.key } });
  }

}

const handleContextMenuClickOnTree = (event) => {
  const readOnly = props.storyReadOnly

  contextMenuItems.value = []
  const treeKey = findTreeKeyForElement(event.target)
  console.log(`keyType`, treeKey.keyType)
  const treeData = treeRef.value.value
 // const selectedNode = findNodeWithKey(treeData, treeKey.key)
 console.log(`node id = `, treeKey.key)
  const selectedNode = findNodeWithId(treeData, parseInt(treeKey.key))
  if (selectedNode && !selectedNode.nodeType) selectedNode.nodeType = 'UNKNOWN' // to prevent error because of missing nodeType
    
  
  
  // TODO in case of a site node - it will find the first occurrence of the site in the tree, which may not be the one that is context menu clicked 
console.log(`selectedNode ID`, selectedNode.id)
  if (selectedNode.nodeType === 'locations' || selectedNode.nodeType === 'tags' || selectedNode.nodeType === 'times') {
    contextMenuItems.value.push({
      label: ` Reset Selection`, icon: 'mdi mdi-cancel'
      , command: () => { resetSelection() }
    })
  }
  if (!readOnly &&
    (selectedNode.nodeType === 'times' || selectedNode.nodeType === 'timelines'
      || selectedNode.nodeType === 'year' || selectedNode.nodeType === 'month' || selectedNode.nodeType === 'day'
    )
  ) {
    const createTimelineMenuItem = {
      label: ` Create Timeline`, icon: 'mdi mdi-sort-clock-ascending-outline'
      , items: []
    }
    const payload = {}
    if (selectedNode.nodeType === 'year') payload.year = treeKey.key
    if (selectedNode.nodeType === 'month') { payload.year = treeKey.key.split('_')[0]; payload.month = treeKey.key.split('_')[1] }
    if (selectedNode.nodeType === 'day') { payload.year = treeKey.key.split('_')[0]; payload.month = treeKey.key.split('_')[1]; payload.day = treeKey.key.split('_')[2] }

    createTimelineMenuItem.items.push({ label: `Per Day`, command: () => { emit('siteAction', { action: 'createTimelinesPerDay', payload: payload }) } })
    if (selectedNode.nodeType !== 'day') {
      createTimelineMenuItem.items.push({ label: `Per Week`, command: () => { emit('siteAction', { action: 'createTimelinesPerWeek', payload: payload }) } })
      createTimelineMenuItem.items.push({ label: `Per Month`, command: () => { emit('siteAction', { action: 'createTimelinesPerMonth', payload: payload }) } })
      if (selectedNode.nodeType !== 'month') {
        createTimelineMenuItem.items.push({ label: `Per Year`, command: () => { emit('siteAction', { action: 'createTimelinesPerYear', payload: payload }) } })
      }
    }
    contextMenuItems.value.push(createTimelineMenuItem)
  }


  let siteIds = []

  if ((selectedNode.nodeType === 'year' || selectedNode.nodeType === 'month' || selectedNode.nodeType === 'day' || selectedNode.nodeType === 'tag')
    || selectedNode.nodeType === 'country' || selectedNode.nodeType === 'city' || selectedNode.nodeType === 'timeline'|| selectedNode.nodeType === 'tour'
    && selectedNode.key) {
    const treeData = treeRef.value.value
    // find all sites under this key 
    siteIds = findLeafNodes(treeData, selectedNode.key).map(siteNode => siteNode.key)
  }

  if (selectedNode.nodeType === 'site' && selectedNode.key) {
    // https://primevue.org/contextmenu/
    const siteId = selectedNode.key
    siteIds = [siteId]
    if (!readOnly) {
      contextMenuItems.value.push({
        label: ` Edit Site`, icon: 'pi pi-fw pi-pencil'
        , command: () => { emit('siteAction', { action: 'edit', siteIds: siteIds }) }
      })
      contextMenuItems.value.push({
        label: ` Delete Site`, icon: 'mdi mdi-trash-can-outline'
        , command: () => { emit('siteAction', { action: 'delete', siteIds: siteIds }) }
      })
      contextMenuItems.value.push({
        label: ` Split Timeline at Site`, icon: 'mdi mdi-timeline-clock-outline'
        , command: () => { emit('siteAction', { action: 'splitTimeline', siteIds: siteIds }) }
      })

      if (selectedNode.parent.nodeType==='tour') {
        contextMenuItems.value.push({
        label: ` Remove Site from Tour`, icon: 'mdi mdi-vector-polyline-remove'
        , command: () => { emit('siteAction', { action: 'removeSiteFromTour', siteIds: siteIds, payload: { tourId: selectedNode.parent.key } }) }
      })
        
      }
    }
    // if multiple sites are selected, they can all be consolidated into the site for which the menu is shown
    const selectedSiteIds =
      // get all keys from selectedKey.value for which the value is boolean True
      Object.keys(selectedKey.value).filter(key => selectedKey.value[key])

    if (!readOnly && selectedSiteIds.length == 2) {
      contextMenuItems.value.push({
        label: ` Create timeline between selected sites`, icon: 'mdi mdi-sort-clock-ascending-outline'
        , command: () => { emit('siteAction', { action: 'createTimelineBetweenTwoSites', siteIds: selectedSiteIds }); }
      })
    }
    if (!readOnly && selectedSiteIds.length > 1) {
      contextMenuItems.value.push({
        label: ` Consolidate Selected Sites to this Site`, icon: 'mdi mdi-consolidate'
        , command: () => { emit('siteAction', { action: 'consolidateSitesToTargetSite', siteIds: selectedSiteIds, payload: { targetSiteId: treeKey.key } }); resetSelection() }
      })
    }
    if (!readOnly && selectedSiteIds.length > 1) {
      contextMenuItems.value.push({
        label: ` Add Tag(s) to all Selected Sites`, icon: 'mdi mdi-tag-plus-outline'
        , command: () => { emit('siteAction', { action: 'addTagsToSites', siteIds: selectedSiteIds }) }
      })
    }
    if (!readOnly && selectedSiteIds.length > 1) {
      contextMenuItems.value.push({
        label: ` Set Timezone for Selected Sites`, icon: 'mdi mdi-map-clock-outline'
        , command: () => { emit('siteAction', { action: 'setTimezoneForSites', siteIds: selectedSiteIds }) }
      })
    }
    if (!readOnly && selectedSiteIds.length > 1) {
      contextMenuItems.value.push({
        label: ` Add Selected Sites to Tour`, icon: 'mdi mdi-vector-polyline-plus'
        , command: () => { emit('siteAction', { action: 'addSitesToTour', siteIds: selectedSiteIds }) }
      })
    }
    if (selectedSiteIds.length > 1) {
      contextMenuItems.value.push({
        label: ` Hide All Selected Sites`, icon: 'mdi mdi-eye-off'
        , command: () => { emit('siteAction', { action: 'hideSelectedSites', siteIds: selectedSiteIds }) }
      })
    }
    if (selectedSiteIds.length > 1) {
      contextMenuItems.value.push({
        label: ` Hide All Unselected Sites`, icon: 'mdi mdi-eye-off'
        , command: () => { emit('siteAction', { action: 'hideUnselectedSites', siteIds: selectedSiteIds }) }
      })
    }
    if (selectedSiteIds.length > 1) {
      contextMenuItems.value.push({
        label: ` (Only) Show All Selected Sites`, icon: 'mdi mdi-curtains'
        , command: () => { emit('siteAction', { action: 'showOnlySelectedSites', siteIds: selectedSiteIds }) }
      })
    }

  }
  if (siteIds.length > 0) {
    if (selectedNode.nodeType != 'site') {
      contextMenuItems.value.push({
        label: `Select Child Sites`, icon: 'mdi mdi-file-tree'
        , command: () => {
          emit('siteAction', { action: 'selectChildren', siteIds: siteIds });
          // extend selectionkey with all siteIds with true
          const updatedSelection = { ...selectedKey.value };
          siteIds.forEach(key => {
            updatedSelection[key] = true;
          });
          selectedKey.value = updatedSelection;
        }
      })
    }

    const highlightMenuItem = {
      label: `Highlight`, icon: 'mdi mdi-format-color-highlight'
      , items: []
    }
    contextMenuItems.value.push(highlightMenuItem)
    for (let color of ['yellow', 'red', 'green', 'blue']) {
      highlightMenuItem.items.push({
        label: ``, class: `marker-highlight-style-${color}`, icon: 'mdi mdi-format-color-highlight'
        , command: () => { emit('siteAction', { action: 'highlight', siteIds: siteIds, payload: { highlightStyle: color } }) }
      })
    }
  }
  if (selectedNode.nodeType === 'timeline') {
    contextMenuItems.value.push({
      label: `Edit Timeline`, icon: 'mdi mdi-clock-edit-outline'
      , command: () => { emit('siteAction', { action: 'editTimeline', payload:{ timelineId: selectedNode.key} }) }
    })
  }

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
  padding-top: 0.4rem !important;
  padding-right: 0.25rem !important;
  padding-bottom: 0.4rem !important;
  padding-left: 0.25rem !important;
  margin-top: 10px;

}

.p-menuitem {
  padding-top: 0.25rem !important;
  padding-right: 0.25rem !important;
  padding-bottom: 0.25rem !important;
  padding-left: 0.3rem !important;


}

.marker-highlight-style-yellow {
  border: 1px dashed #d7d412;
  background-color: yellow;
}

.marker-highlight-style-red {
  border: 1px dashed #eab9b9;
  background-color: rgb(206, 67, 67);
}

.marker-highlight-style-green {
  border: 1px dashed #1e8b45;
  background-color: rgb(9, 255, 0);
}

.marker-highlight-style-blue {
  border: 1px dashed #3388ff;
  background-color: rgb(136, 143, 221);
}
</style>