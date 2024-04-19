import utcTimezones from './utc-timezones.json'
export function useDateTimeLibrary() {

  const formatDate = (timestamp, dateFormatStyle, timezoneOffset) => {
//    const date = timezoneOffset? new Date( new Date(timestamp)- timezoneOffset * 60 * 1000):new Date(timestamp)
    const date = new Date(timestamp) // this is not correct: it uses the current local timezone.

    if (dateFormatStyle === "dow") {
      const dayOfWeek = date.toLocaleString('default', { weekday: 'long' })
        ;
      return dayOfWeek
    }
    else if (dateFormatStyle === "short") { // HH:MI
      const hour = date.getUTCHours();
      const min = date.getUTCMinutes();
      return `${hour}:${min < 10 ? '0' : ''}${min}`
    } else if (dateFormatStyle === "medium") {  // DD month HH:MI
      const day = date.getUTCDate();
      // TODO toLocaleString is expensive and not UTC correct
      const month = date.toLocaleString('default', { month: 'long' })
      const hour = date.getUTCHours();
      const min = date.getUTCMinutes();
      return `${day} ${month} ${hour}:${min < 10 ? '0' : ''}${min}`
    } else { // DD month YYYY
      const day = date.getUTCDate();
      const month = date.toLocaleString('default', { month: 'long' })
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year}`
    }
  }

  // <!-- 'Exact Timestamp (high accuracy, down to minute)', value: 0 },
  // { title: 'Hour ', value: 2 },
  // { title: 'Part of Day (morning, afternoon, evening)  ', value: 4 },
  // { title: 'Day', value: 6 },
  // { title: 'Month', value: 8 },
  // { title: 'Season (Summer, Fall, Winter, Spring)', value: 10 },
  // { title: 'Year', value: 12 },
  // { title: 'Decade', value: 14 },
  // { title: 'Century', value: 16 },-->

  const seasons = ["Winter", "Spring", "Summer", "Fall"]
  const dayParts = ["Night", "Morning", "Afternoon", "Evening"]
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


  const formatDateByGrain = (timestamp, timezoneOffset, timegrain) => {

    let dateTimeString = ""
    // //2024-04-16T05:12:00.000Z

    // const dateForTimestamp = new Date(editedSite.value.timestamp)
    // editedSite.value.datePart = dateForTimestamp.toISOString().slice(0, 10)
    // //  editedSite.value.timePart = dateForTimestamp.toISOString().slice(11, 16) // HH:MI
    // // 2024-04-16T05:12:00.000Z
    // // substring from 11 to 16

    // editedSite.value.timePart = editedSite.value.timestamp.substring(11, 16)

    if (timegrain === 0) {
      dateTimeString = formatDate(timestamp, "medium", timezoneOffset) // TODO cater for timezoneOffset!!!
    }
    if (timegrain === 4) {
      const hour = parseInt(timestamp.substring(11, 13))
      // 3, 9, 15, 21
      dateTimeString = dayParts[(hour - 3) / 6]+","
      //plus date
    }
    if (timegrain === 2) {
      const hour = parseInt(timestamp.substring(11, 13))
      dateTimeString = `${hour} ${hour<12 ? " AM, " : " PM, "}` 
      
    }

    if (timegrain === 8) {
      // month
      const month = parseInt(timestamp.substring(5, 7))
      dateTimeString = months[month - 1] + ", "+timestamp.substring(0,4)
    }

    if (timegrain === 10) {
      //2, 5, 8, 11
      const month = (parseInt(timestamp.substring(5, 7)) + 1) / 3 - 1
      const season = seasons[month]
      dateTimeString = season + " " + timestamp.substring(0, 4)  // Summer 2024
    }

    if (timegrain === 12) {
      dateTimeString = timestamp.substring(0, 4)
    }

    if (timegrain === 2 || timegrain === 4 || timegrain === 6) {	
      dateTimeString += " " + formatDate(timestamp, null)
    }
    // TODO add timezone

    return dateTimeString

  }


  return { formatDate, formatDateByGrain, utcTimezones };
}


