<template>
    <div @paste.prevent="handlePaste">
        <v-btn v-if="imageSrc" @click="clearImage" prepend-icon="mdi-close-box">Clear Image</v-btn>
        <v-img v-if="imageSrc" :src="imageSrc" :width="imageWidth" :height="imageHeight" class="mt-5"></v-img>
        <v-file-input label="Upload image from file" @change="handleFileUpload" accept="image/*"
            :multiple="isMultiple"></v-file-input>
        <v-text-field v-model="imageUrl" label="Image URL"></v-text-field>
    </div>
</template>
<script setup>

import { useImagesStore } from "../store/imagesStore";
const imagesStore = useImagesStore()
import { useUtilsLibrary } from '@/composables/useUtilsLibrary';
const { throttle } = useUtilsLibrary();

import { ref, onMounted } from 'vue';

const props = defineProps({
    imageId: Number,
    imageUrl: String,
    imageHeight: String,
    imageWidth: String,
    allowMultipleFiles: Boolean,
    fastSiteCreator: Boolean, // when the imageEditor is used in the context of the fastSiteCreator then updating the image should not delete the previous image

});

const imageId = ref(props.imageId)
const imageUrl = ref(props.imageUrl)
const imageSrc = ref("")
const imageHeight = ref(props.imageHeight)
const imageWidth = ref(props.imageWidth)
const isMultiple = ref(props.allowMultipleFiles)
const isFastSiteCreator = ref(props.fastSiteCreator)
const emit = defineEmits(['imageChange', 'gpsData'])

onMounted(() => {
    setImageIdUrl()
});

const emitImageChange = () => {
    emit('imageChange', { "imageId": imageId.value, "imageUrl": imageUrl.value })
}
const emitGPSData = (gpsData) => {
    emit('gpsData', gpsData)
}


const setImageIdUrl = async () => {
    if (props.imageId) {
        const imageIdUrl = await imagesStore.getUrlForIndexedDBImage(props.imageId)
        imageSrc.value = imageIdUrl
    }
}

const clearImage = async () => {
    await resetImage()
    emitImageChange()
}

// remove existing image from indexedDB or reset imageUrl
const resetImage = async () => {
    // remove from indexedDB image with if imageId.value
    if (imageId.value) await imagesStore.removeImage(imageId.value)
    imageId.value = null
    imageUrl.value = null
    imageSrc.value = null
}

const displayImageFromDB = async (imageId) => {
    if (!imageId) return
    const url = await imagesStore.getUrlForIndexedDBImage(imageId)
    imageSrc.value = url
}

const handleNewImage = async (file) => {
    imagesStore.resizeImage(file, imageWidth.value, imageHeight.value, async (resizedBlob) => {
        // Now you have a resized image as a Blob, you can store it in IndexedDB
        const imageSaveResult = await imagesStore.saveImage(resizedBlob);
        //const newImageId = await imagesStore.saveImage(resizedBlob);
        //   editedStory.value.imageId = imageId;
        if (imageSaveResult.imageId) {
            imageId.value = imageSaveResult.imageId
            imageUrl.value = null
            displayImageFromDB(imageId.value)
            console.log('Image stored in IndexedDB with ID:', imageId.value);
            
        }
        if (imageSaveResult.url) {
            imageId.value = null
            imageUrl.value = imageSaveResult.url
            console.log('Image stored in bucket with URL:', imageUrl.value);
            
        }
        if (!isFastSiteCreator.value) {
            resetImage() // if a prior image was defined, remove it now
            // resetImage should not be done in the fastSiteCreator
        }
        emitImageChange()
        imagesStore.extractEXIFData(file).then(({ dateTimeOriginal, gpsInfo }) => {
            console.log('Timestamp:', dateTimeOriginal);
            console.log('GPS Info:', gpsInfo);
            // Process the EXIF data as needed
            emitGPSData({ dateTimeOriginal, gpsInfo, imageId: imageId.value , imageUrl: imageUrl.value })
        }).catch(error => {
            console.error('Error extracting EXIF data:', error);
        });
    });
}

const throttledHandleNewImageCall = throttle(handleNewImage, 500);

const handlePaste = async (event) => {

    if (event.clipboardData?.items) {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            // Check if the item is an image
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                //throttledHandleNewImageCall(file)
                handleNewImage(file)
            }

            // if item is a string that is a valid URL - set the imageUrl property and try to download and store that image (that will probably fail because of CORS limitations)
            // 
            if (items[i].type.indexOf("text") !== -1) {
                const text = (event.clipboardData || window.clipboardData).getData('text');
                if (isValidImageUrl(text)) { // Implement isValidImageUrl according to your needs
                    if (!isFastSiteCreator.value) {
                        resetImage() // if a prior image was defined, remove it now
                        // resetImage should not be done in the fastSiteCreator
                    }

                    imageUrl.value = text
                    emitImageChange()
                    imageSrc.value = text
                    try {
                        const response = await fetch(text);
                        if (!response.ok) throw new Error('Network response was not ok.');
                        const blob = await response.blob();
                        //throttledHandleNewImageCall(blob)
                        handleNewImage(blob)
                    } catch (error) {
                        console.error('Fetching and storing image failed:', error);
                    }
                }
            }
        }
    }
}
const handleFileUpload = async (event) => {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && file.type.startsWith('image/')) {
            //throttledHandleNewImageCall(file)
            handleNewImage(file)
        }
    }
}

const isValidImageUrl = (url) => {
    return url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
}

defineExpose({
    handlePaste, handleNewImage
});


</script>