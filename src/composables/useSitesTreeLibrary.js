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
        key: year,
        label: year,
        data: year,
        icon: 'mdi mdi-calendar-range',
        selectable: false,
        children: []
      }
      const uniqueMonths = [...new Set(sites.filter(site => new Date(site.timestamp).getFullYear() === year).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(site => new Date(site.timestamp).toLocaleString('default', { month: 'long' }))
      )];
      uniqueMonths.forEach(month => {
        const monthNode = {
          key: month,
          label: month,
          data: month,
          icon: 'mdi mdi-calendar-range',
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
            key: day,
            label: formatDate(date, 'dow') + ' ' + day,
            data: day,
            icon: 'mdi mdi-calendar-range',
            selectable: false,
            children: []
          }
          // iterate over all sites with a timestamp that matches the year, month, and day, sorted by timestamp
          const sitesWithYearMonthAndDay = sitesWithYearAndMonth.filter(site => new Date(site.timestamp).getDate() === day).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          sitesWithYearMonthAndDay.forEach(site => {
            const siteNode = {
              key: site.id, // to allow the site to be found from the feature - as in the map only the feature will be available
              label: site.label + ' (' + formatDate(site.timestamp, 'short') + ')',
              data: site,
              icon: 'mdi mdi-clock-outline',
              selectable: true,
              styleClass: `site-${site.id}`,
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
      selectable: false,
      children: []
    }
    // if multiple countries, then add children for countries
    // per country (if multiple countries) - if multiple cities, then children per city 
    const uniqueCountries = [...new Set(sites.map(site => site.country))];
    uniqueCountries.forEach(country => {
      const countryNode = {
        key: country,
        label: country,
        data: country,
        selectable: false,
        icon: 'mdi mdi-map-marker',
        children: []
      }
      const uniqueCities = [...new Set(sites.filter(site => site.country === country).map(site => site.city))];
      uniqueCities.forEach(city => {
        const cityNode = {
          key: city,
          label: city,
          data: city,
          selectable: false,
          icon: 'mdi mdi-city',
          children: []
        }
        // loop over sites, ordered by timestamp, filtered by city and add to children
        sites.filter(site => site.country === country && site.city === city).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(site => {
          const siteNode = {
            key: site.id, // to allow the site to be found from the feature - as in the map only the feature will be available
            label: site.label + ' - ' + formatDate(site.timestamp, 'medium'),
            data: site,
            icon: 'mdi mdi-city',
            styleClass: `site-${site.id}`,
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
        children: []
      }
      // loop over sites that have that tag and add to node for that tag to the tagNode children
      tagsSitesMap[tag].forEach(site => {
        const siteNode = {
          key: site.id, // to allow the site to be found from the feature - as in the map only the feature will be available  
          label: `${site.label} (${site.city}, ${site.country}) - ${formatDate(site.timestamp, 'medium')}`,
          data: site,
          icon: 'mdi mdi-city',
          styleClass: `site-${site.id}`,
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

  return { getSitesTreeData };
}


