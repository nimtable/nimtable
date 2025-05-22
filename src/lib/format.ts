export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    }).format(date)
  }