import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function useImportExportLibrary() {

  const exportStoryToZip = (story) => {
    const zip = new JSZip();

    // TODO process imageId 
    zip.file("story.json", JSON.stringify(story));

    // Generate the zip file and trigger download
    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        saveAs(content, `fotomapp-archive.zip`);
      });
  }


  const importStoryFromZip = (file, handleImportedStory) => {
      const zip = new JSZip();

      // Read the zip file
      zip.loadAsync(file)
        .then(function (contents) {
          // Assuming there's only one file, "localStorageData.json"
          return contents.file("story.json").async("string");
        })
        .then(function (data) {
          const story = JSON.parse(data);
          // add data from story to currentstory or replace currentstory with story
          handleImportedStory(story)

        })
        .catch(function (err) {
          console.error("Error reading zip file", err);
          
        });
    
  }





  return { exportStoryToZip, importStoryFromZip };
}
