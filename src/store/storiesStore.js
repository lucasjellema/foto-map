import { defineStore } from 'pinia';

import { useLocalStorage } from "@vueuse/core"
import { v4 as uuidv4 } from 'uuid';
import { useImagesStore } from "../store/imagesStore";

export const useStorieStore = defineStore('storyData', () => {
    const imagesStore = useImagesStore()
    const stories = ref(useLocalStorage('fotomap-stories', []))

    const currentStory = ref(stories.value[0])

    const initializeCurrentStory = () => {
        if (!currentStory.value.mapConfiguration) {
            currentStory.value.mapConfiguration = { customTileLayers: [], showTooltips: true };
            updateStory(currentStory.value);
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
        if (!story.mapConfiguration) {
            story.mapConfiguration = { customTileLayers: [], showTooltips: true };
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

    const addSite = (site) => {
        if (!currentStory.value.sites) {
            currentStory.value.sites = [];
        }
        if (!site.id) {
            site.id = uuidv4();
        }
        site.geoJSON.features[0].properties.id = site.id; // to allow the site to be found from the feature - as in the map only the feature will be available
        currentStory.value.sites.push(site)
    }

    const updateSite = (site) => {
        const theIndex = currentStory.value.sites.findIndex(l => l.id === site.id);
        if (theIndex !== -1) {
            currentStory.value.sites[theIndex] = site;
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
        stories, currentStory, addStory, updateStory, removeStory, setCurrentStory, addSite, removeSite, updateSite, getSite
    };
});


