import { useDateTimeLibrary } from '@/composables/useDateTimeLibrary';
const { formatDate, formatDateByGrain } = useDateTimeLibrary();
import { useTimelinesLibrary } from '@/composables/useTimelinesLibrary';
const { getSortedSitesInTimeline } = useTimelinesLibrary();
import { useToursLibrary } from '@/composables/useToursLibrary';
const { getSortedSitesInTour } = useToursLibrary();


export function useSitesTreeLibrary() {

  const getTimesTreeData = (sites) => { 
    const timesTreeData =
    {
      key: '0-times',
      label: 'Times',
      data: 'Documents Folder',
      icon: 'mdi mdi-calendar-clock',
      styleClass: `treekey|times`,
      children: []
    }
    // if multiple years/months/days, then add children for years/months/days
    // TODO cater for timeGrain > 12 (decade, century, etc.)

    const uniqueYears = [...new Set(sites.map(site => new Date(site.timestamp).getFullYear()))];
    for (const year of uniqueYears) {
      const yearNode = {
        key: `${year}`,
        label: year,
        data: year,
        icon: 'mdi mdi-calendar-range',
        styleClass: `treekey|year|${year}`,

        selectable: false,
        children: []
      }
      // TODO sites with timeGrain== 12 -- year

      const sitesTimesGrainYear = sites.filter(site => new Date(site.timestamp).getFullYear() === year
        && (site.timeGrain && site.timeGrain == 12))
      for (const site of sitesTimesGrainYear) {
        const siteNode = {
          key: site.id,
          label: site.label + ' (' + formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0) + ')',
          data: site,
          icon: 'mdi mdi-clock-outline',
          selectable: true,
          styleClass: `treekey|site|${site.id}`,
          leaf: true,
          children: [],
          parent: yearNode
        }
        yearNode.children.push(siteNode)
      }


      // TODO if more than one site in a season, then add season as intermediate node??
      const sitesTimesGrainSeason = sites.filter(site => new Date(site.timestamp).getFullYear() === year
        && (site.timeGrain && site.timeGrain == 10)).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      // first identify the seasons?>  

      for (const site of sitesTimesGrainSeason) {
        const siteNode = {
          key: site.id,
          label: site.label + ' (' + formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0) + ')',
          data: site,
          icon: 'mdi mdi-clock-outline',
          selectable: true,
          styleClass: `treekey|site|${site.id}`,
          leaf: true,
          children: [],
          parent: yearNode
        }
        yearNode.children.push(siteNode)
      }





      const uniqueMonths = [...new Set(sites.filter(site => new Date(site.timestamp).getFullYear() === year && (!site.timeGrain || site.timeGrain < 12)).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(site => new Date(site.timestamp).toLocaleString('default', { month: 'long' }))
      )];
      for (const month of uniqueMonths) {
        //      uniqueMonths.forEach(month => {
        const monthNode = {
          key: `${year}_${month}`,
          label: month,
          data: month,
          icon: 'mdi mdi-calendar-range',
          styleClass: `treekey|month|${year}_${month}`,
          selectable: false,
          children: []          
        }

        const sitesTimesGrainMonth = sites.filter(site => new Date(site.timestamp).getFullYear() === year
          && new Date(site.timestamp).toLocaleString('default', { month: 'long' }) === month
          && (site.timeGrain && site.timeGrain == 8))
        for (const site of sitesTimesGrainMonth) {
          const siteNode = {
            key: site.id,
            label: site.label + ' (' + formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0) + ')',
            data: site,
            icon: 'mdi mdi-clock-outline',
            selectable: true,
            styleClass: `treekey|site|${site.id}`,
            leaf: true,
            children: [],
            parent: monthNode
          }
          monthNode.children.push(siteNode)
        }


        // iterate over all sites with a timestamp that matches the year and month
        const sitesWithYearAndMonth = sites.filter(site => new Date(site.timestamp).getFullYear() === year
          && new Date(site.timestamp).toLocaleString('default', { month: 'long' }) === month
          && (!site.timeGrain || site.timeGrain < 8))
        // for all sites with the same year and month, add them to the month node
        const uniqueDays = [...new Set(sitesWithYearAndMonth.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map(site => new Date(site.timestamp).getUTCDate()))];
        //iterate over all unique days sorted by date and create a node for each day
        for (const day of uniqueDays) {
          //        uniqueDays.forEach(day => {
          const date = new Date(`${year}-${month}-${day}`)
          const dayNode = {
            key: `${year}_${month}_${day}`,
            label: formatDate(date, 'dow') + ' ' + day,
            data: day,
            icon: 'mdi mdi-calendar-range',
            styleClass: `treekey|day|${year}_${month}_${day}`,
            selectable: false,
            children: [],
            parent: monthNode
          }
          // iterate over all sites with a timestamp that matches the year, month, and day, sorted by timestamp
          const sitesWithYearMonthAndDay = sitesWithYearAndMonth.filter(site => new Date(site.timestamp).getUTCDate() === day).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          for (const site of sitesWithYearMonthAndDay) {
            //          sitesWithYearMonthAndDay.forEach(site => {
            const siteNode = {
              key: site.id,
              label: site.label + ' (' + formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0) + ')',
              data: site,
              icon: 'mdi mdi-clock-outline',
              selectable: true,
              styleClass: `treekey|site|${site.id}`,
              leaf: true,
              children: [],
              parent: dayNode
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
              dayNode.parent = monthNode
              dayNode.label = dayNode.label + ' - ' + siteNode.label
            }
          }
          //)
          monthNode.children.push(dayNode)
        }
        //)
        if (uniqueMonths.length > 1 || yearNode.children.length > 0) {
          console.log(`push monthNode ${monthNode.label}`)
          monthNode.parent= yearNode
          yearNode.children.push(monthNode)
        } else {
          yearNode.children = monthNode.children
          yearNode.label = monthNode.label + ' - ' + yearNode.label
          for (const monthChild of monthNode.children) {
            monthChild.parent = yearNode
          }
        }
      }
      //)
      timesTreeData.children.push(yearNode)
    }
    //)
    return timesTreeData
  }

  const suitableInClassName = (someString) => {
    // replace characters such as space that are not allowed in style class names
    return someString ?
      someString.replace(/[^a-zA-Z0-9]/g, '_') : ''
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
    for (const country of uniqueCountries) {
      //    uniqueCountries.forEach(country => {
      const countryKey = suitableInClassName(country)
      const countryNode = {
        key: countryKey,
        label: country,
        data: country,
        selectable: false,
        styleClass: `treekey|country|${countryKey}`,
        icon: 'mdi mdi-map-marker',
        children: []
      }
      const uniqueCities = [...new Set(sites.filter(site => site.country === country).map(site => site.city))];
      for (const city of uniqueCities) {
        //      uniqueCities.forEach(city => {
        const cityKey = suitableInClassName(city)
        const cityNode = {
          key: `${countryKey}_${cityKey}`,
          label: city,
          data: city,
          selectable: false,
          icon: 'mdi mdi-city',
          styleClass: `treekey|city|${countryKey}_${cityKey}`,
          children: []
        }
        // loop over sites, ordered by timestamp, filtered by city and add to children
        for (const site of sites.filter(site => site.country === country && site.city === city).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))) {

          //        sites.filter(site => site.country === country && site.city === city).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(site => {
          const siteNode = {
            key: site.id, // to allow the site to be found from the feature - as in the map only the feature will be available
            label: site.label + ' (' + formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0) + ')',
            data: site,
            leaf: true,
            icon: 'mdi mdi-map-clock-outline',
            styleClass: `treekey|site|${site.id}`,
            children: [],
            parent: uniqueCities.length > 1 ? cityNode : countryNode
          }
          cityNode.children.push(siteNode)
        }
        //)
        if (uniqueCities.length > 1)
          countryNode.children.push(cityNode)
        else {
          countryNode.children = cityNode.children
          countryNode.label = cityNode.label + ' - ' + countryNode.label
        }
      }
      //)
      locationTreeData.children.push(countryNode)
    }
    //)
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

    const tagsSitesMap = {}
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
    // TODO sort tags
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
          label: `${site.label} (${site.city}, ${site.country}) - ${formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0)}`,

          data: site,
          icon: 'mdi mdi-map-clock-outline',
          leaf: true,
          styleClass: `treekey|site|${site.id}`,
          children: [],
          parent: tagNode
        }
        tagNode.children.push(siteNode)
      })
      tagsTreeData.children.push(tagNode)
    })
    return tagsTreeData
  }

  const getTimelinesTreeData = (timelines, sites) => {
    const timelinesTreeData =
    {
      key: '0-timelines',
      label: 'Timelines',
      data: 'Documents Folder',
      icon: 'mdi mdi-timeline-clock-outline',
      styleClass: `treekey|timelines`,

      selectable: false,
      children: []
    }
    // iterate timelines sorted by startTimestamp
    const sortedTimelines = timelines.slice().sort((a, b) => new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime())
    for (const timeline of sortedTimelines) {
      const timelineNode = {
        key: `${timeline.id}`,
        label: timeline.label,
        data: timeline,
        icon: 'mdi mdi-timeline-clock-outline',
        styleClass: `treekey|timeline|${timeline.id}`,
        selectable: false,
        children: []
      }
      const sitesInTimeline = getSortedSitesInTimeline(timeline, sites)
      for (const site of sitesInTimeline) {
        const siteNode = {
          key: `${site.id}`,
          label: `${site.label} (${site.city}, ${site.country}) - ${formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0)}`,
          data: site,
          icon: 'mdi mdi-map-clock-outline',
          leaf: true,
          styleClass: `treekey|site|${site.id}`,
          children: [],
          parent: timelineNode
        }


        timelineNode.children.push(siteNode)
      }

      timelinesTreeData.children.push(timelineNode)
    }

    return timelinesTreeData
  }

  const getToursTreeData = (tours, sites) => {
    const toursTreeData =
    {
      key: '0-tours',
      label: 'Tours',
      data: 'Documents Folder',
      icon: 'mdi mdi-transit-detour',
      styleClass: `treekey|tours`,

      selectable: false,
      children: []
    }
    // iterate tours sorted by label
    if (tours) {
    const sortedTours = tours.slice().sort((a, b) => a.label.localeCompare(b.label))
    for (const tour of sortedTours) {
      const tourNode = {
        key: `${tour.id}`,
        label: tour.label,
        data: tour,
        icon: 'mdi mdi-transit-detour',
        styleClass: `treekey|tour|${tour.id}`,
        selectable: false,
        children: []
      }
      const sitesInTour = getSortedSitesInTour(tour, sites)
      for (const site of sitesInTour) {
        const siteNode = {
          key: `${site.id}`,
          label: `${site.label} (${site.city}, ${site.country}) - ${formatDateByGrain(site.timestamp, site.timezoneOffset, site.timeGrain ? site.timeGrain : 0)}`,
          data: site,
          icon: 'mdi mdi-transit-detour',
          leaf: true,
          styleClass: `treekey|site|${site.id}`,
          children: [],
          parent: tourNode
        }


        tourNode.children.push(siteNode)
      }

      toursTreeData.children.push(tourNode)
    }
  }
    return toursTreeData
  }

  const getSitesTreeData = (sites, timelines, tours) => {
    const sitesTreeData = [];
    sitesTreeData.push(getLocationsTreeData(sites));
    sitesTreeData.push(getTimesTreeData(sites));
    sitesTreeData.push(getTagsTreeData(sites));
    sitesTreeData.push(getTimelinesTreeData(timelines, sites));
    sitesTreeData.push(getToursTreeData(tours, sites));
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

  const  findNodeWithKey= (nodes, targetKey)=> {
    for (const node of nodes) {
      if (node.key === targetKey) {
        return node
        
      } else if (node.children && node.children.length > 0) {
        const result =findNodeWithKey(node.children, targetKey);
        if (result != null) return result
        
      }
    }
  }


  return { getSitesTreeData, findLeafNodes,findNodeWithKey };
}


