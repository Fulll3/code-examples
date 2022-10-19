export function addLeadingZeros(value: string, length: number): string {
  if (value.length > length || isNaN(Number(value))) {
    return value;
  } else {
    return Array(length - value.length + 1).join("0") + value;
  }
}