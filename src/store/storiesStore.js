import { defineStore } from 'pinia';

import { useLocalStorage } from "@vueuse/core"
import { v4 as uuidv4 } from 'uuid';
import { useImagesStore } from "../store/imagesStore";

export const useStorieStore = defineStore('storyData', () => {
    const imagesStore = useImagesStore()
    const stories = ref(useLocalStorage('fotomap-stories', []))

    const currentStory = ref(stories.value[0])

    const initializeCurrentStory = () => {
        if (stories.value.length==0) {
            stories.value.push({ id: uuidv4(), name: 'New Story', sites: [], tags: [], mapConfiguration: { customTileLayers: [], showTooltips: true, showTooltipsMode: 'hover', timelines: [] } })
            
        } else {
            if (!currentStory.value.mapConfiguration) {
                currentStory.value.mapConfiguration = { customTileLayers: [], showTooltips: false, showTooltipsMode: 'hover', timelines: [] }
            }
        }

    }
    initializeCurrentStory()

    const setCurrentStory = (story) => {
        currentStory.value = story
    }


    const addStory = (story) => {
        if (!story.id) {
            story.id = uuidv4();
        }
        if (!story.sites) {
            story.sites = [];
        }
        if (!story.tags) {
            story.tags = [];
        }
        if (!story.mapConfiguration) {
            story.mapConfiguration = { customTileLayers: [], showTooltips: true , timelines: [] };
        }
        stories.value.push(story);
    }

    const updateStory = (story) => {
        // find story with matching id
        const index = stories.value.findIndex(l => l.id === story.id);
        if (index !== -1) {
            stories.value[index] = story;
        }
    }
    const removeStory = (storyToRemove) => {
        const theIndex = stories.value.findIndex(l => l.id === storyToRemove.id);
        if (theIndex !== -1) {
            if (stories.value[theIndex].imageId) { imagesStore.removeImage(stories.value[theIndex].imageId) }

            stories.value.splice(theIndex, 1);
        }
    }

    const getStoryTags = (storyId) => {
        if (storyId) {
            return stories.value.find(l => l.id === storyId).tags
        } else {
            console.log('getstorytags', currentStory.value.tags)
            return currentStory.value.tags
        }
    }

const mergeTags = (tags) => {
// the array of tags is an array of unique strings

    if (!currentStory.value.tags) {
        currentStory.value.tags = tags
    } else {
        const array1 = currentStory.value.tags
        const array2 = tags
        const mergedArrayUnique = [...new Set([...array1, ...array2])];
        currentStory.value.tags = mergedArrayUnique
    }

}

    const addSite = (site) => {
        if (!currentStory.value.sites) {
            currentStory.value.sites = [];
        }
        if (!site.id) {
            site.id = uuidv4();
        }
        site.geoJSON.features[0].properties.id = site.id; // to allow the site to be found from the feature - as in the map only the feature will be available
        currentStory.value.sites.push(site)
        if (site.tags) mergeTags(site.tags)
    }

    const updateSite = (site) => {
        const theIndex = currentStory.value.sites.findIndex(l => l.id === site.id);
        if (theIndex !== -1) {
            currentStory.value.sites[theIndex] = site;
            if (site.tags) mergeTags(site.tags)
        }
    }

    const getSite = (siteId) => {
        return currentStory.value.sites.find(l => l.id === siteId)
    }

    const removeSite = (site) => {
        const theIndex = currentStory.value.sites.findIndex(l => l.id === site.id);
        if (theIndex !== -1) {
            if (currentStory.value.sites[theIndex].imageId) { imagesStore.removeImage(currentStory.value.sites[theIndex].imageId) }
            currentStory.value.sites.splice(theIndex, 1);
        }
    }

    return {
        stories, currentStory, addStory, updateStory, removeStory, setCurrentStory, addSite, removeSite, updateSite, getSite, getStoryTags
    };
});


