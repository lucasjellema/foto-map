import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useImagesStore } from "@/store/imagesStore";


export function useImportExportLibrary() {

  async function fetchImageData(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return response.blob(); // Get the image data as Blob
  }

  function blobToFile(blob, fileName) {
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  }


  const imagesStore = useImagesStore()


  const addImageToZip = (promises, imageId, zip) => {
    promises.push(new Promise((resolve, reject) => {
      imagesStore.getUrlForIndexedDBImage(imageId).then(async (url) => {
        try {
          const imageData = await fetchImageData(url);
          zip.file(`images/${imageId}`, imageData);
          resolve();
        }
        catch (error) { reject(error); }
      });
    }));
  }
  const exportStoryToZip = (story) => {
    const zip = new JSZip();
    zip.file("story.json", JSON.stringify(story));

    const promises = [];
    // for each site - check the imageId; get the associated image as a file and add it to the zip file in the subdirectory for images using the imageId as the filename
    // for each attachment in each site, do the same
    story.sites.forEach(site => {
      if (site.imageId) {
        addImageToZip(promises, site.imageId, zip);
      }
      site.attachments?.forEach(attachment => {
        if (attachment.imageId) {
          addImageToZip(promises, attachment.imageId, zip);
        }
      })
    })
    // only when all images have been added can we generate the zip; that is when all promises are resolved

    Promise.all(promises)
      .then(results => {
        // Generate the zip file and trigger download
        zip.generateAsync({ type: "blob" })
          .then(function (content) {
            saveAs(content, `fotomapp-archive.zip`);
          });
      })
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
        const imageId = await imagesStore.saveImage(blob)
        imageFile2NewImageId[file.name] = imageId
      }
    }
    const data = await contents.file("story.json").async("string");
    const story = JSON.parse(data);
    // invoke callback function to handle the imported content 
    handleImportedStory(story, imageFile2NewImageId)
  }





  return { exportStoryToZip, importStoryFromZip };


}
