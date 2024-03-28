export function useDateTimeLibrary() {

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




  return { formatDate };
}


