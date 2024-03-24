export function useSitesTreeLibrary() {

  const getTimesTreeData = (sites) => {
    const timesTreeData =
    {
      key: '0-times',
      label: 'Times',
      data: 'Documents Folder',
      icon: 'mdi mdi-calendar-clock',
      children: []
    }
    // if multiple years/months/days, then add children for years/months/days


    const uniqueYears = [...new Set(sites.map(site => new Date(site.timestamp).getFullYear()))];
    uniqueYears.forEach(year => {
      const yearNode = {
        key: `${year}`,
        label: year,
        data: year,
        icon: 'mdi mdi-calendar-range',
        styleClass: `treekey|year|${year}`,

        selectable: false,
        children: []
      }
      const uniqueMonths = [...new Set(sites.filter(site => new Date(site.timestamp).getFullYear() === year).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(site => new Date(site.timestamp).toLocaleString('default', { month: 'long' }))
      )];
      uniqueMonths.forEach(month => {
        const monthNode = {
          key: `${year}_${month}`,
          label: month,
          data: month,
          icon: 'mdi mdi-calendar-range',
          styleClass: `treekey|month|${year}_${month}`,
          selectable: false,
          children: []
        }
        // iterate over all sites with a timestamp that matches the year and month
        const sitesWithYearAndMonth = sites.filter(site => new Date(site.timestamp).getFullYear() === year
          && new Date(site.timestamp).toLocaleString('default', { month: 'long' }) === month)
        // for all sites with the same year and month, add them to the month node
        const uniqueDays = [...new Set(sitesWithYearAndMonth.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(site => new Date(site.timestamp).getDate()))];
        //iterate over all unique days sorted by date and create a node for each day

        uniqueDays.forEach(day => {
          const date = new Date(`${year}-${month}-${day}`)
          const dayNode = {
            key: `${year}_${month}_${day}`,
            label: formatDate(date, 'dow') + ' ' + day,
            data: day,
            icon: 'mdi mdi-calendar-range',
            styleClass: `treekey|day|${year}_${month}_${day}`,
            selectable: false,
            children: []
          }
          // iterate over all sites with a timestamp that matches the year, month, and day, sorted by timestamp
          const sitesWithYearMonthAndDay = sitesWithYearAndMonth.filter(site => new Date(site.timestamp).getDate() === day).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          sitesWithYearMonthAndDay.forEach(site => {
            const siteNode = {
              key: site.id, 
              label: site.label + ' (' + formatDate(site.timestamp, 'short') + ')',
              data: site,
              icon: 'mdi mdi-clock-outline',
              selectable: true,
              styleClass: `treekey|site|${site.id}`,
              leaf: true,
              children: []
            }
            if (sitesWithYearMonthAndDay.length > 1)
              dayNode.children.push(siteNode)
            else {

              dayNode.key = siteNode.key
              dayNode.icon = siteNode.icon
              dayNode.selectable = siteNode.selectable
              dayNode.leaf = siteNode.leaf
              dayNode.styleClass = siteNode.styleClass
              dayNode.data = siteNode.data
              dayNode.label = dayNode.label + ' - ' + siteNode.label
            }
          })
          monthNode.children.push(dayNode)
        })
        if (uniqueMonths.length > 1) {
          console.log(`push monthNode ${monthNode.label}`)
          yearNode.children.push(monthNode)
        } else {
          yearNode.children = monthNode.children
          yearNode.label = monthNode.label + ' - ' + yearNode.label
        }
      })
      timesTreeData.children.push(yearNode)
    })
    return timesTreeData
  }

  const suitableInClassName = (someString) => {
    // replace characters such as space that are not allowed in style class names
    return someString?
     someString.replace(/[^a-zA-Z0-9]/g, '_'):''
  }

  const formatDate = (timestamp, dateFormatStyle) => {
    const date = new Date(timestamp)

    if (dateFormatStyle === "dow") {
      const dayOfWeek = date.toLocaleString('default', { weekday: 'long' })
        ;
      return dayOfWeek
    }
    else if (dateFormatStyle === "short") {
      const hour = date.getHours();
      const min = date.getMinutes();
      return `${hour}:${min < 10 ? '0' : ''}${min}`
    } else if (dateFormatStyle === "medium") {
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' })
      const hour = date.getHours();
      const min = date.getMinutes();
      return `${day} ${month} ${hour}:${min < 10 ? '0' : ''}${min}`
    } else {
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear();
      return `${day} ${month} ${year}`
    }
  }

  const getLocationsTreeData = (sites) => {
    const locationTreeData =
    {
      key: '0-locations',
      label: 'Locations',
      data: 'Documents Folder',
      icon: 'mdi mdi-map-marker',
      styleClass: `treekey|locations`,
      selectable: false,
      children: []
    }
    // if multiple countries, then add children for countries
    // per country (if multiple countries) - if multiple cities, then children per city 
    const uniqueCountries = [...new Set(sites.map(site => site.country))];
    uniqueCountries.forEach(country => {
      const key = suitableInClassName(country)
      const countryNode = {
        key: key,
        label: country,
        data: country,
        selectable: false,
        styleClass: `treekey|country|${key}`,
        icon: 'mdi mdi-map-marker',
        children: []
      }
      const uniqueCities = [...new Set(sites.filter(site => site.country === country).map(site => site.city))];
      uniqueCities.forEach(city => {
        const cityKey = suitableInClassName(city)
        const cityNode = {
          key: `${country}_${cityKey}`,
          label: city,
          data: city,
          selectable: false,
          icon: 'mdi mdi-city',
          styleClass: `treekey|city|${country}_${cityKey}`,
          children: []
        }
        // loop over sites, ordered by timestamp, filtered by city and add to children
        sites.filter(site => site.country === country && site.city === city).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(site => {
          const siteNode = {
            key: site.id, // to allow the site to be found from the feature - as in the map only the feature will be available
            label: site.label + ' - ' + formatDate(site.timestamp, 'medium'),
            data: site,
            icon: 'mdi mdi-city',
            styleClass: `treekey|site|${site.id}`,
            children: []
          }
          cityNode.children.push(siteNode)
        })
        if (uniqueCities.length > 1)
          countryNode.children.push(cityNode)
        else {
          countryNode.children = cityNode.children
          countryNode.label = cityNode.label + ' - ' + countryNode.label
        }
      })
      locationTreeData.children.push(countryNode)
    })
    return locationTreeData
  }

  const getTagsTreeData = (sites) => {
    const tagsTreeData =
    {
      key: '0-tags',
      label: 'Tags',
      data: 'Documents Folder',
      icon: 'mdi mdi-tag-outline',
      styleClass: `treekey|tags`,

      selectable: false,
      children: []
    }

    const tagsSitesMap ={}
// loop over sites and then over the tags for each site
// add each tag to the map with an array of sites that have that tag 
    sites.forEach(site => {
      site.tags?.forEach(tag => {
        if (!tagsSitesMap[tag]) {
          tagsSitesMap[tag] = []  
        }
        tagsSitesMap[tag].push(site)
      })
    })

// loop over all properties in tagsSitesMap and create a node for each tag

    Object.keys(tagsSitesMap).forEach(tag => {
      const tagNode = {
        key: tag, 
        label: tag,
        data: tag,
        selectable: false,
        icon: 'mdi mdi-tag-outline',
        styleClass: `treekey|tag|${tag}`,
        children: []
      }
      // loop over sites that have that tag and add to node for that tag to the tagNode children
      tagsSitesMap[tag].forEach(site => {
        const siteNode = {
          key: site.id, // to allow the site to be found from the feature - as in the map only the feature will be available  
          label: `${site.label} (${site.city}, ${site.country}) - ${formatDate(site.timestamp, 'medium')}`,
          data: site,
          icon: 'mdi mdi-city',
          styleClass: `treekey|site|${site.id}`,
          children: []
        }
        tagNode.children.push(siteNode)
      })      
      tagsTreeData.children.push(tagNode)
    })
    return tagsTreeData
  }

  const getSitesTreeData = (sites) => {
    const sitesTreeData = [];
    sitesTreeData.push(getLocationsTreeData(sites));
    sitesTreeData.push(getTimesTreeData(sites));
    sitesTreeData.push(getTagsTreeData(sites));
    return sitesTreeData;
  }

  function findLeafNodes(nodes, targetKey) {
    let leafNodes = [];
  
    // Helper function to recursively find leaf nodes
    function findLeaves(node) {
      if (node.children && node.children.length > 0) {
        // If the node has children, iterate through them
        node.children.forEach(findLeaves);
      } else {
        // If the node has no children, it is a leaf node
        leafNodes.push(node);
      }
    }
  
    // Function to find the target node by key
    function findNode(nodes, targetKey) {
      for (const node of nodes) {
        if (node.key === targetKey) {
          findLeaves(node); // Start collecting leaves from the target node
          break;
        } else if (node.children && node.children.length > 0) {
          findNode(node.children, targetKey); // Recurse into children
        }
      }
    }
  
    // Start the search for the target node
    findNode(nodes, targetKey);
  
    return leafNodes;
  }
  


  return { getSitesTreeData, findLeafNodes };
}


