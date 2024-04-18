import utcTimezones from './utc-timezones.json'
export function useDateTimeLibrary() {

  const formatDate = (timestamp, dateFormatStyle) => {
    const date = new Date(timestamp)

    if (dateFormatStyle === "dow") {
      const dayOfWeek = date.toLocaleString('default', { weekday: 'long' })
        ;
      return dayOfWeek
    }
    else if (dateFormatStyle === "short") { // HH:MI
      const hour = date.getHours();
      const min = date.getMinutes();
      return `${hour}:${min < 10 ? '0' : ''}${min}`
    } else if (dateFormatStyle === "medium") {  // DD month HH:MI
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' })
      const hour = date.getHours();
      const min = date.getMinutes();
      return `${day} ${month} ${hour}:${min < 10 ? '0' : ''}${min}`
    } else { // DD month YYYY
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear();
      return `${day} ${month} ${year}`
    }
  }




  return { formatDate, utcTimezones };
}


