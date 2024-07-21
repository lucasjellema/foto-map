import { defineStore } from 'pinia';

import { useLocalStorage } from "@vueuse/core"
import { v4 as uuidv4 } from 'uuid';
import { useImagesStore } from "../store/imagesStore";

import { Delta } from '@vueup/vue-quill'
//import { useImportExportLibrary } from '@/composables/useImportExportLibrary';
import { usePARLibrary } from '@/composables/usePARLibrary';

const { saveFile, getJSONFile, getListOfFiles, setPAR, getPAR } = usePARLibrary();

import storyCodeDataFileMap from './storyCodeDataFileMap.json'

import JSZip from 'jszip';

//const { importStoryFromZip } = useImportExportLibrary();

export const useStorieStore = defineStore('storyData', () => {

    const imagesStore = useImagesStore()
    const stories = ref(useLocalStorage('fotomap-stories', []))

    const currentStory = ref(stories.value[0])
    const storyUpdateIndicator = ref(0) // every time the story is updated, this is incremented; this can be watched to trigger a re-render



    const handleImportedStory = (story, imageFile2NewImageIdMap) => {

        // invoked for a story that was imported from a zip file
        story.sites.forEach(site => {
            if (site.imageId) {
                if (imageFile2NewImageIdMap[`images\/${site.imageId}`].imageId) {
                    site.imageId = imageFile2NewImageIdMap[`images\/${site.imageId}`]
                    site.imageUrl = null
                } else if (imageFile2NewImageIdMap[`images\/${site.imageId}`].url) {
                    site.imageUrl = imageFile2NewImageIdMap[`images\/${site.imageId}`].url
                    site.imageId = null
                }


                //site.imageId = imageFile2NewImageIdMap[`images\/${site.imageId}`]
            }
            if (site.description && !(site.description instanceof Delta)) site.description = new Delta(site.description)
            site.attachments?.forEach(attachment => {
                if (attachment.description && !(attachment.description instanceof Delta)) attachment.description = new Delta(attachment.description)
                if (attachment.imageId) {
                    if (imageFile2NewImageIdMap[`images\/${attachment.imageId}`].imageId) {
                        attachment.imageId = imageFile2NewImageIdMap[`images\/${attachment.imageId}`].imageId
                    } else if (imageFile2NewImageIdMap[`images\/${attachment.imageId}`].url) {
                        attachment.imageUrl = imageFile2NewImageIdMap[`images\/${attachment.imageId}`].url
                        attachment.imageId = null
                    }




                }
            })
        })
        stories.value.push(story)
        if (stories.value.length == 2) {
            // remove the first story
            stories.value.shift()
        }
        setCurrentStory(story)
    }


    const imgFileRegex = /^images\/\d+$/i;

    const importStoryFromZip = async (file, handleImportedStory) => {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file)
        const files = Object.values(contents.files);
        const imageFile2NewImageId = {}

        for (const file of files) {
            // store file as image in indexedDB, retrieve newly assigned imageId, return map with original image id and new image id 
            if (imgFileRegex.test(file.name)) {
                const blob = await zip.file(file.name).async('blob') // .then(async (content) => {

                const imageSaveResult = await imagesStore.saveImage(blob);
                //                const imageId = await imagesStore.saveImage(blob)
                imageFile2NewImageId[file.name] = imageSaveResult // either {imageId:} or {url:}
            }
        }
        const data = await contents.file("story.json").async("string");
        const story = JSON.parse(data);

        // invoke callback function to handle the imported content 
        handleImportedStory(story, imageFile2NewImageId)
    }


    // const preAuthenticatedRequestURL = ref(null)
    const DELTA_DIRECTORY = 'story-deltas'

    const STORIES_FILE = 'stories-file.json'
    const CONSOLIDATION_MARKER_FILE = 'lastDeltaConsolidated.json'


    const loadDeltaFiles = async () => {
        // get list of files in delta directory

        const files = await getListOfFiles()
        if (!files || !files.objects || files.objects.length == 0) return
        const deltaFiles = files.objects.filter(file => file.name.startsWith(DELTA_DIRECTORY + '/')).sort((a, b) => a.name.localeCompare(b.name))
        if (!deltaFiles || deltaFiles.length == 0) return
        const lastConsolidation = await getJSONFile(CONSOLIDATION_MARKER_FILE)
        let deltaToProcess = deltaFiles
        if (lastConsolidation != 1) {
            console.log('DEBUG last consolidation log read from file ', lastConsolidation)
            console.log('DEBUG remove from delta files any file less than or equal to ', DELTA_DIRECTORY + '/' + lastConsolidation.lastDeltaTimestamp + '.json')
            try {
            deltaToProcess = deltaFiles.filter(file => file.name > DELTA_DIRECTORY + '/' + lastConsolidation.lastDeltaTimestamp + '.json')
            } catch (error) {
                console.log('ERROR in filtering delta files to deltaToProcess', error)
            }
            
            
        }
        // for each file, load it and merge it into the story
        console.log('delta files to process', deltaToProcess)
        for (const file of deltaToProcess) {
            const delta = await getJSONFile(file.name)
            if (delta) {
                console.log('processing delta', delta.type, file.name)
                if (delta.type == 'site') {
                    try {
                        updateSite(delta.site, false, true)
                    }
                    catch (error) {
                        console.log("failed loading delta " + file.name, error)
                    }
                }
                if (delta.type == 'delete-site') {
                    try {
                        // get site for delta id
                        const site = currentStory.value.sites.find(site => site.id == delta.id)
                        // then remove site
                        if (site)
                            removeSite(site, false)
                    }
                    catch (error) {
                        console.log("failed loading delta remove site " + file.name, error)
                    }
                }
                if (delta.type == 'map-config') {
                    try {
                        currentStory.value.mapConfiguration = delta.mapConfiguration
                    }
                    catch (error) {
                        console.log("failed loading delta mapConfig ", error)
                    }
                }
            }
        }
        return deltaFiles
    }


    const initializeCurrentStory = async () => {

        // check if a URL param is provided - that should suggest loading data from a file
        const urlParams = new URLSearchParams(window.location.search);
        const storyToLoad = urlParams.get('story');
        if (storyToLoad) {
            try {
                console.log(`storyToLoad: ${storyToLoad}`)
                const filename = storyCodeDataFileMap[storyToLoad]
                if (!filename) throw new Error(`Unknown story to load: ${storyToLoad}; load story from localstore instead`)
                const storyURL = new URL(filename, import.meta.url).href;
                fetch(storyURL)
                    .then(response => response.blob())
                    .then(blob => {
                        const file = new File([blob], storyToLoad, { type: blob.type });
                        importStoryFromZip(file, handleImportedStory)
                    });
                return
            }
            catch (error) {
                console.log(`Error while loading story ${storyToLoad}`, error)
            }
        }
        const storyUrlToFetch = urlParams.get('storyArchiveURL');
        if (storyUrlToFetch) {
            try {
                // to download a zip file from GitHub https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
                console.log(`storyToFetch: ${storyUrlToFetch}`)
                const storyURL = storyUrlToFetch
                fetch(storyURL
                    //     ,{
                    //     headers: {
                    //         'Accept': 'application/vnd.github.v3+json'
                    //     }
                    // }
                )
                    .then(response => response.blob())
                    .then(blob => {
                        console.log('Fetch Zip File has Blob size:', blob.size);
                        const file = new File([blob], storyUrlToFetch, { type: blob.type });
                        importStoryFromZip(file, handleImportedStory)
                    });
                return
            }
            catch (error) {
                console.log(`Error while fetching story ${storyUrlToFetch}`, error)
            }
        }

        if (urlParams.has('par')) {
            // http://<host:port/apppath>/?par=https://objectstorage.us-ashburn-1.oraclecloud.com/p/3ZvD2n18VN6y/n/idtwlqf2hanz/b/website/o/
            const bucketPAR = urlParams.get('par')
            setPAR(bucketPAR)
            console.log(`initialize story from PAR: ${bucketPAR}`)

            const storyJSON = await getJSONFile(STORIES_FILE)
            // if not found, create it
            if (storyJSON == 1) {

                stories.value.push({ id: uuidv4(), name: 'New Story', sites: [], tags: [], mapConfiguration: { customTileLayers: [], showTooltips: true, showTooltipsMode: 'hover', timelines: [] } })

                if (stories.value.length == 2) {
                    // remove the first story
                    stories.value.shift()
                }
                setCurrentStory(story)
                // save it
                saveFile(JSON.stringify(stories.value), STORIES_FILE)

            } else {
                stories.value = storyJSON
                await loadDeltaFiles()
                storyUpdateIndicator.value++
            }
        }

        if (stories.value.length == 0) {
            stories.value.push({ id: uuidv4(), name: 'New Story', sites: [], tags: [], mapConfiguration: { customTileLayers: [], showTooltips: true, showTooltipsMode: 'hover', timelines: [] } })

        } else {
            // prepare delta for description
            currentStory.value.sites.forEach(site => {
                if (site.description && !(site.description instanceof Delta)) site.description = new Delta(site.description)
                site.attachments?.forEach(attachment => {
                    if (attachment.description && !(attachment.description instanceof Delta)) attachment.description = new Delta(attachment.description)
                })
            })

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
            story.mapConfiguration = { customTileLayers: [], showTooltips: true, timelines: [] };
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



    const addSite = (site, saveDelta = true) => {
        if (!currentStory.value.sites) {
            currentStory.value.sites = [];
        }
        if (!site.id) {
            site.id = uuidv4();
        }
        site.geoJSON.features[0].properties.id = site.id; // to allow the site to be found from the feature - as in the map only the feature will be available
        currentStory.value.sites.push(site)
        console.log('adding site, ', site)

        if (site.tags) mergeTags(site.tags)
        if (getPAR() && saveDelta)
            setTimeout(() => {

                const filename = DELTA_DIRECTORY + '/' + new Date().getTime() + '.json'
                // do not save site (has captured in the closure) but the site state as it currently stands
                const theIndex = currentStory.value.sites.findIndex(l => l.id === site.id);
                const currentSiteState = currentStory.value.sites[theIndex]
                saveFile(JSON.stringify({ type: 'site', site: currentSiteState }), filename)
            }, 5000)
    }

    const updateMapConfiguration = () => {
        console.log('updateMapConfiguration')
        // TODO save delta for the map config

        if (getPAR()) {
            const filename = DELTA_DIRECTORY + '/' + new Date().getTime() + '.json'
            saveFile(JSON.stringify({ type: 'map-config', mapConfiguration: currentStory.value.mapConfiguration }), filename)
        }
    }

    const updateSite = (site, saveDelta = true, addIfNotFound = false) => {
        const theIndex = currentStory.value.sites.findIndex(l => l.id === site.id);
        if (theIndex !== -1) {
            currentStory.value.sites[theIndex] = site;
            if (getPAR() && saveDelta) {
                // TODO if PAR is set, then save site to delta/ 
                const filename = DELTA_DIRECTORY + '/' + new Date().getTime() + '.json'
                saveFile(JSON.stringify({ type: 'site', site: site }), filename)
            }
            if (site.tags) mergeTags(site.tags)
        } else {
            if (addIfNotFound) {
                addSite(site, saveDelta)
            }
        }
    }

    const getSite = (siteId) => {
        return currentStory.value.sites.find(l => l.id === siteId)
    }

    const stripSite = (site) => {
        if (site.imageId) { imagesStore.removeImage(site.imageId); }
        // for all attachements in site remove the image
        if (site.attachments) {
            site.attachments.forEach(attachment => {
                if (attachment.imageId) { imagesStore.removeImage(attachment.imageId); }
            });
        }
    }
    const removeSite = (site, saveDelta = true) => {
        stripSite(site);

        const theIndex = currentStory.value.sites.findIndex(l => l.id === site.id);
        if (theIndex !== -1) {

            currentStory.value.sites.splice(theIndex, 1);
        }
        if (getPAR() && saveDelta) {

            // TODO if PAR is set, then save the site deletion to delta/ 
            const filename = DELTA_DIRECTORY + '/' + new Date().getTime() + '.json'
            saveFile(JSON.stringify({ type: 'delete-site', id: site.id }), filename)
        }

    }

    const resetStory = () => {
        // remove all sites in story
        currentStory.value.sites.forEach(site => {
            stripSite(site)
        })
        currentStory.value.sites = [];
        currentStory.value = { id: uuidv4(), name: 'New Story', sites: [], tags: [], mapConfiguration: { customTileLayers: [], showTooltips: true, showTooltipsMode: 'hover', timelines: [] } }
    }

    const consolidateDeltas = async () => {
        // TODO
        console.log('consolidate deltas into a single stories.json')

        const storyJSON = await getJSONFile(STORIES_FILE)
        stories.value = storyJSON
        const deltaFiles = await loadDeltaFiles()
        

        // write lastDeltaConsolidated.json with fileid/timestamp of most recent delta that was processed
        const lastDeltaFileProcessed = deltaFiles[deltaFiles.length - 1]
        const timestamp = lastDeltaFileProcessed.name.substring(0, lastDeltaFileProcessed.name.length - 5).substring(13)
        const lastConsolidation = { consolidationTimestamp: new Date().getTime(), lastDeltaTimestamp: timestamp }
        currentStory.value.lastConsolidation = lastConsolidation
        const _ = await saveFile(`[${JSON.stringify(currentStory.value)}]`, STORIES_FILE)


        saveFile(JSON.stringify(lastConsolidation), CONSOLIDATION_MARKER_FILE)
        // optionally overwrite earlier deltas with {} or {type:'X'} to indicate they can be discarded/deleted

        
    }

    return {
        stories, currentStory, addStory, updateStory, removeStory, resetStory, setCurrentStory, addSite, removeSite, updateSite, getSite, getStoryTags, setPAR, updateMapConfiguration, consolidateDeltas, storyUpdateIndicator
    };
});




