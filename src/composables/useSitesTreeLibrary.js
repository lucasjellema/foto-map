export function useSitesTreeLibrary() {


  const treeData = [
    {
      key: '0',
      label: 'Locations',
      data: 'Documents Folder',
      icon: 'mdi mdi-map-marker',
      children: [
        {
          key: '0-0',
          label: 'Work',
          data: 'Work Folder',
          icon: 'mdi mdi-abacus',
          children: [
            { key: '0-0-0', label: 'Expenses.doc', icon: 'pi pi-fw pi-file', data: 'Expenses Document' },
            { key: '0-0-1', label: 'Resume.doc', icon: 'pi pi-fw pi-file', data: 'Resume Document' }
          ]
        },
        {
          key: '0-1',
          label: 'Home',
          data: 'Home Folder',
          icon: 'pi pi-fw pi-home',
          children: [{ key: '0-1-0', label: 'Invoices.txt', icon: 'pi pi-fw pi-file', data: 'Invoices for this month' }]
        }
      ]
    },
    {
      key: '1',
      label: 'Events',
      data: 'Events Folder',
      icon: 'pi pi-fw pi-calendar',
      children: [
        { key: '1-0', label: 'Meeting', icon: 'pi pi-fw pi-calendar-plus', data: 'Meeting' },
        { key: '1-1', label: 'Product Launch', icon: 'pi pi-fw pi-calendar-plus', data: 'Product Launch' },
        { key: '1-2', label: 'Report Review', icon: 'pi pi-fw pi-calendar-plus', data: 'Report Review' }
      ]
    },
    {
      key: '2',
      label: 'Movies',
      data: 'Movies Folder',
      icon: 'pi pi-fw pi-star-fill',
      children: [
        {
          key: '2-0',
          icon: 'pi pi-fw pi-star-fill',
          label: 'Al Pacino',
          data: 'Pacino Movies',
          children: [
            { key: '2-0-0', label: 'Scarface', icon: 'pi pi-fw pi-video', data: 'Scarface Movie' },
            { key: '2-0-1', label: 'Serpico', icon: 'pi pi-fw pi-video', data: 'Serpico Movie' }
          ]
        },
        {
          key: '2-1',
          label: 'Robert De Niro',
          icon: 'pi pi-fw pi-star-fill',
          data: 'De Niro Movies',
          children: [
            { key: '2-1-0', label: 'Goodfellas', icon: 'pi pi-fw pi-video', data: 'Goodfellas Movie' },
            { key: '2-1-1', label: 'Untouchables', icon: 'pi pi-fw pi-video', data: 'Untouchables Movie' }
          ]
        }
      ]
    }
  ]

  const getTimesTreeData = (sites) => {
    const timesTreeData =
    {
      key: '0',
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
      const uniqueMonths = [...new Set(sites.filter(site => new Date(site.timestamp).getFullYear() === year).map(site => new Date(site.timestamp).toLocaleString('default', { month: 'long' })))];
      uniqueMonths.forEach(month => {
        const monthNode = {
          key: month,
          label: month,
          data: month,
          icon: 'mdi mdi-calendar-range',
          selectable: false,
          children: []
        }
        yearNode.children.push(monthNode)
      })
      timesTreeData.children.push(yearNode)



    })
    return timesTreeData
  }

  const formatDate = (timestamp, dateFormatStyle)=> {
    const date = new Date(timestamp)
  
    if (dateFormatStyle === "short") {
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
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`
    }
  }

  const getLocationsTreeData = (sites) => {
    const locationTreeData =
    {
      key: '0',
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
            label: site.label + ' - ' + formatDate(site.timestamp,'medium'),
            data: site,
            icon: 'mdi mdi-city',
            styleClass: `site-${site.id}`,
            children: []
          }
          cityNode.children.push(siteNode)
        })

        countryNode.children.push(cityNode)
      })
      locationTreeData.children.push(countryNode)



    })


    /*
           {
                key: '0-0',
                label: 'Work',
                data: 'Work Folder',
                icon: 'mdi mdi-abacus',
                children: [
                    { key: '0-0-0', label: 'Expenses.doc', icon: 'pi pi-fw pi-file', data: 'Expenses Document' },
                    { key: '0-0-1', label: 'Resume.doc', icon: 'pi pi-fw pi-file', data: 'Resume Document' }
                ]
            },
            {
                key: '0-1',
                label: 'Home',
                data: 'Home Folder',
                icon: 'pi pi-fw pi-home',
                children: [{ key: '0-1-0', label: 'Invoices.txt', icon: 'pi pi-fw pi-file', data: 'Invoices for this month' }]
            }
     */
    return locationTreeData
  }

  const getSitesTreeData = (sites) => {
    const sitesTreeData = [];
    sitesTreeData.push(getLocationsTreeData(sites));
    sitesTreeData.push(getTimesTreeData(sites));
    return sitesTreeData;
  }

  return { getSitesTreeData };
}


