
const preAuthenticatedRequestURL = ref(null)
export function usePARLibrary() {
  

  const setPAR = (par) => {
    preAuthenticatedRequestURL.value = par
}
const getPAR = () => {
    return preAuthenticatedRequestURL.value
}
  
  const getJSONFile = (filename) => {
    return new Promise((resolve, reject) => {
        const targetURL = preAuthenticatedRequestURL.value + filename
        fetch(targetURL, { method: 'GET' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                resolve(response.json())
            })
            .catch(err =>
                resolve(1)
            );
    })
}

const getListOfFiles = () => {
    return new Promise((resolve, reject) => {
        const targetURL = preAuthenticatedRequestURL.value
        fetch(targetURL, { method: 'GET' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                resolve(response.json()) // should be a list of all files that needs to be filtered by prefix directory+'/'
            })
            .catch(err =>
                resolve(1)
            );
    })
}


const saveFile = async (blob, filename) => {
    const fetchOptions = {
        method: 'PUT',
        body: blob,
    };

    const targetURL = preAuthenticatedRequestURL.value + filename
    fetch(targetURL, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.status;
        })
        .then(data => {
            return 0
        })
        .catch(error => {
            return 1
        });
}

  return {saveFile, getJSONFile, getListOfFiles, setPAR, getPAR};


}
